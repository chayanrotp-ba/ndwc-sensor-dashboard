import test from 'node:test';
import assert from 'node:assert/strict';

const data = new Map();
globalThis.localStorage = {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};

const [{default:LineRules},{warningMaster,measurementLevels,measurements}] = await Promise.all([
  import('./components/LineRules.js'),
  import('./warning-criteria.js'),
]);
const logic = Object.create(LineRules.prototype);

test('legacy LINE rules migrate to current rainfall level names', () => {
  const conditions = logic.conditionsForRule({tags:[1,2]});
  const levels = warningMaster('24h');
  assert.deepEqual(conditions['0'],[levels[1].id,levels.at(-1).id]);
  assert.deepEqual(logic.conditionChips({conditions}).map(tag=>tag.label),[
    measurements[0]+' · '+levels[1].name,
    measurements[0]+' · '+levels.at(-1).name,
  ]);
});

test('LINE conditions use the names and colors of every selected measurement type', () => {
  const temperature = measurementLevels(1);
  const pm25 = measurementLevels(7);
  const rule = {conditions:{1:[temperature[0].id],7:[pm25.at(-1).id]}};
  const chips = logic.conditionChips(rule);
  assert.deepEqual(chips.map(tag=>tag.label),[
    measurements[1]+' · '+temperature[0].name,
    measurements[7]+' · '+pm25.at(-1).name,
  ]);
  assert.ok(chips.every(tag=>tag.vars.includes('--tag-color:#')));
});

test('each LINE OA measurement type has a Master-derived range for its alert-level checkbox', () => {
  const rainfall = warningMaster('24h');
  const temperature = measurementLevels(1);
  assert.match(logic.levelRange(0, rainfall, 0), /ตั้งแต่ 0 ถึง/);
  assert.match(logic.levelRange(0, rainfall, rainfall.length - 1), /มากกว่า/);
  assert.match(logic.levelRange(1, temperature, 1), /ถึง/);
});

test('a new LINE rule opens only rainfall conditions by default', () => {
  assert.deepEqual(logic.blankForm().conditions, {0: []});
  assert.equal(logic.blankForm().stationType, '0');
});

test('LINE OA monitoring scope starts with 70 DPM stations and keeps external stations separate', () => {
  const stations = Object.values(logic.basins()).flat();
  const dpmStations = stations.filter((station) => !station[4]);
  assert.equal(dpmStations.length, 70);
  assert.equal(stations.filter((station) => station[4]).length, 10);
  assert.ok(stations.every((station) => Array.isArray(station[5]) && station[5].length));
  assert.ok(stations.every((station) => station[6]?.province && station[6]?.district && station[6]?.subdistrict));
  assert.ok(dpmStations.every((station) => station[5].length === 9));
});
