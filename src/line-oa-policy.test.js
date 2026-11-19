import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LINE_SENSOR_TYPES,
  THAI_RIVER_BASINS,
  defaultLineTypeState,
  eligibleRuleConditions,
  evaluateLineRule,
  isWarningAlertEnabledForReading,
  loadWarningAlertState,
  frequencyForRule,
  frequencyForBasin,
  loadLineFrequencyState,
  saveLineFrequencyState,
  loadLineTypeState,
  saveLineTypeState,
} from './line-oa-policy.js';

test('LINE OA exposes every measurement type, including PM10', () => {
  assert.deepEqual(LINE_SENSOR_TYPES, [0,1,2,3,4,5,6,7,8]);
  assert.equal(Object.values(defaultLineTypeState()).filter(Boolean).length, 9);
});

test('notification-frequency settings cover every one of Thailand\'s 22 official river basins', () => {
  assert.equal(THAI_RIVER_BASINS.length, 22);
  assert.deepEqual(THAI_RIVER_BASINS.slice(0, 6), [
    'ลุ่มน้ำสาละวิน', 'ลุ่มน้ำโขงเหนือ', 'ลุ่มน้ำโขงตะวันออกเฉียงเหนือ',
    'ลุ่มน้ำชี', 'ลุ่มน้ำมูล', 'ลุ่มน้ำปิง'
  ]);
  assert.ok(THAI_RIVER_BASINS.includes('ลุ่มน้ำภาคใต้ฝั่งตะวันตก'));
});

test('type switches persist independently without changing saved rule conditions', () => {
  const data = new Map();
  const storage = { getItem:key=>data.get(key)??null, setItem:(key,value)=>data.set(key,value) };
  const originalConditions = {0:['rain-critical'],2:['humidity-watch']};
  const state = saveLineTypeState({...defaultLineTypeState(),2:false}, storage);
  assert.equal(loadLineTypeState(storage)[2], false);
  assert.equal(state[0], true);
  assert.deepEqual(originalConditions, {0:['rain-critical'],2:['humidity-watch']});
});

test('all LINE OA sensor types can be enabled or disabled together', () => {
  const data = new Map();
  const storage = { getItem:key=>data.get(key)??null, setItem:(key,value)=>data.set(key,value) };
  const disabled = saveLineTypeState(Object.fromEntries(LINE_SENSOR_TYPES.map(type=>[type,false])), storage);
  assert.ok(LINE_SENSOR_TYPES.every(type=>disabled[type] === false));
  const enabled = saveLineTypeState(Object.fromEntries(LINE_SENSOR_TYPES.map(type=>[type,true])), storage);
  assert.ok(LINE_SENSOR_TYPES.every(type=>enabled[type] === true));
});

test('only enabled types in enabled rules are eligible, and re-enabling restores saved conditions', () => {
  const rule = {id:'r1',on:true,conditions:{0:['rain-critical'],2:['humidity-watch']}};
  const enabled = {...defaultLineTypeState(),2:false};
  assert.deepEqual(eligibleRuleConditions(rule,enabled),{'0':['rain-critical']});
  assert.deepEqual(eligibleRuleConditions({...rule,on:false},enabled),{});
  assert.deepEqual(eligibleRuleConditions(rule,{...enabled,2:true}),rule.conditions);
});

test('a disabled central DDPM alert level suppresses only project-station trigger evaluation', () => {
  const state = { alertLevels: { 'rainfall:24h': { watch: false } } };
  assert.equal(isWarningAlertEnabledForReading(state, { type: 0, period: '24h', levelId: 'watch' }), false);
  assert.equal(isWarningAlertEnabledForReading(state, { type: 0, period: '24h', levelId: 'watch', external: true }), true);
  const rule = { id: 'r1', on: true, sel: ['G1', 'EXT1'], conditions: { 0: ['watch'] } };
  const result = evaluateLineRule({
    rule,
    enabledTypes: defaultLineTypeState(),
    warningAlertState: state,
    now: 1_000_000,
    readings: [
      { type: 0, period: '24h', stationCode: 'G1', levelId: 'watch' },
      { type: 0, period: '24h', stationCode: 'EXT1', levelId: 'watch', external: true },
    ],
  });
  assert.deepEqual(result.alerts.map((alert) => alert.stationCode), ['EXT1']);
});

test('central DDPM alert state falls back safely when browser storage is unavailable', () => {
  assert.deepEqual(loadWarningAlertState({ getItem: () => null }), { alertLevels: {} });
});

test('same event and level is suppressed inside the LINE OA dedup window', () => {
  const rule = {id:'r1',on:true,sel:['G1'],conditions:{0:['critical'],2:['watch']}};
  const readings = [
    {type:0,stationCode:'G1',levelId:'critical',eventId:'storm-1',value:120},
    {type:2,stationCode:'G1',levelId:'watch',eventId:'storm-1',value:92},
  ];
  const first = evaluateLineRule({rule,enabledTypes:defaultLineTypeState(),readings,now:1_000_000});
  assert.equal(first.alerts.length,2);
  const duplicate = evaluateLineRule({rule,enabledTypes:defaultLineTypeState(),readings,dedup:first.dedup,now:1_010_000});
  assert.equal(duplicate.alerts.length,0);
  const afterWindow = evaluateLineRule({rule,enabledTypes:defaultLineTypeState(),readings,dedup:first.dedup,now:3_000_001});
  assert.equal(afterWindow.alerts.length,2);
});

test('frequency setting is persisted and can override a specific rule', () => {
  const data = new Map();
  const storage = { getItem:key=>data.get(key)??null, setItem:(key,value)=>data.set(key,value) };
  const saved = saveLineFrequencyState({scope:'rule',mode:'interval',hours:6,ruleId:'r1',rules:{r1:{mode:'interval',hours:12}}}, storage);
  assert.equal(loadLineFrequencyState(storage).scope, 'rule');
  assert.equal(frequencyForRule(saved, 'r1').windowMs, 12 * 60 * 60 * 1000);
  assert.equal(frequencyForRule(saved, 'r2').windowMs, 6 * 60 * 60 * 1000);
});

test('basin frequency override takes precedence over the system default', () => {
  const settings = saveLineFrequencyState({
    scope: 'all', mode: 'interval', hours: 6,
    basins: { 'ลุ่มน้ำน่าน': { mode: 'interval', hours: 12 }, 'ลุ่มน้ำปิง': { mode: 'on-update' } }
  }, { getItem: () => null, setItem: () => {} });
  assert.equal(frequencyForBasin(settings, 'ลุ่มน้ำน่าน').windowMs, 12 * 60 * 60 * 1000);
  assert.equal(frequencyForBasin(settings, 'ลุ่มน้ำปิง').mode, 'on-update');
  assert.equal(frequencyForBasin(settings, 'ลุ่มน้ำชี').windowMs, 6 * 60 * 60 * 1000);
});

test('alert evaluation uses the reading basin rather than a rule-wide basin', () => {
  const rule = { id: 'r1', on: true, sel: ['G1'], conditions: { 0: ['watch'] } };
  const frequency = { scope: 'all', mode: 'interval', hours: 6, basins: { 'ลุ่มน้ำน่าน': { mode: 'interval', hours: 1 } } };
  const first = evaluateLineRule({ rule, enabledTypes: defaultLineTypeState(), frequency, now: 1_000_000, readings: [{ type: 0, stationCode: 'G1', basin: 'ลุ่มน้ำน่าน', levelId: 'watch', levelRank: 1 }] });
  const repeat = evaluateLineRule({ rule, enabledTypes: defaultLineTypeState(), frequency, dedup: first.dedup, now: 5_000_000, readings: [{ type: 0, stationCode: 'G1', basin: 'ลุ่มน้ำน่าน', levelId: 'watch', levelRank: 1 }] });
  assert.equal(repeat.alerts.length, 1);
});

test('a lower alert level never repeats, while equal or higher levels repeat after the configured frequency', () => {
  const rule = {id:'r1',on:true,sel:['G1'],conditions:{0:['watch','evacuate','must-evacuate']}};
  const frequency = {scope:'all',mode:'interval',hours:1,rules:{}};
  const first = evaluateLineRule({rule,enabledTypes:defaultLineTypeState(),frequency,now:1_000_000,readings:[{type:0,stationCode:'G1',levelId:'must-evacuate',levelRank:4}]});
  const lower = evaluateLineRule({rule,enabledTypes:defaultLineTypeState(),frequency,dedup:first.dedup,now:5_000_000,readings:[{type:0,stationCode:'G1',levelId:'evacuate',levelRank:3}]});
  assert.equal(lower.alerts.length, 0);
  const equal = evaluateLineRule({rule,enabledTypes:defaultLineTypeState(),frequency,dedup:first.dedup,now:5_000_000,readings:[{type:0,stationCode:'G1',levelId:'must-evacuate',levelRank:4}]});
  assert.equal(equal.alerts.length, 1);
  const watch = evaluateLineRule({rule,enabledTypes:defaultLineTypeState(),frequency,now:1_000_000,readings:[{type:0,stationCode:'G1',levelId:'watch',levelRank:1}]});
  const increased = evaluateLineRule({rule,enabledTypes:defaultLineTypeState(),frequency,dedup:watch.dedup,now:5_000_000,readings:[{type:0,stationCode:'G1',levelId:'must-evacuate',levelRank:4}]});
  assert.equal(increased.alerts.length, 1);
});
