import test from 'node:test';
import assert from 'node:assert/strict';
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
const m=await import('./warning-criteria.js');
test('custom warning is station-specific; reset follows current default; today is independent',()=>{const levels=m.warningMaster(),central=structuredClone(m.activeWarning('B',levels));const own=structuredClone(central);own.today=[12,24,40,100];m.saveWarning('A',own,levels);assert.equal(m.warningCustom('A'),true);assert.deepEqual(m.activeWarning('B',levels),central);assert.deepEqual(m.activeWarning('A',levels)['24h'],central['24h']);assert.equal(m.evaluateWarning('A','today',100,levels).level.id,levels[3].id);assert.equal(m.evaluateWarning('A','today',100.01,levels).level.id,levels[4].id);m.resetWarning('A');assert.equal(m.warningCustom('A'),false);assert.deepEqual(m.activeWarning('A',levels),central);});
test('invalid input, permissions, storage errors and changed master fail without altering saved state',()=>{const levels=m.warningMaster(),values=structuredClone(m.activeWarning('B',levels));values['1h'][1]=values['1h'][0];assert.throws(()=>m.saveWarning('B',values,levels));values['1h'][1]=8;assert.throws(()=>m.saveWarning('B',values,levels,false));assert.throws(()=>m.resetWarning('B',false));const original=localStorage.setItem;localStorage.setItem=()=>{throw Error('storage full')};assert.throws(()=>m.saveWarning('B',values,levels));assert.equal(m.warningCustom('B'),false);localStorage.setItem=original;m.saveWarning('B',values,levels);assert.throws(()=>m.activeWarning('B',levels.slice(1)));});

test('Default stations follow the latest central data without modifying custom stations',()=>{const levels=m.warningMaster(),old=structuredClone(m.activeWarning('C',levels));m.saveWarning('C',old,levels);m.warningSettings.central=structuredClone(old);m.warningSettings.central.today=[15,30,50,120];assert.deepEqual(m.activeWarning('D',levels).today,[15,30,50,120]);assert.deepEqual(m.activeWarning('C',levels).today,old.today);m.resetWarning('C');assert.deepEqual(m.activeWarning('C',levels).today,[15,30,50,120]);});

test('yesterday migrates from legacy 24h bounds and saves/evaluates independently',()=>{
  const levels=m.warningMaster();
  const legacy=JSON.parse(JSON.stringify(m.activeWarning('',levels)));
  delete legacy.yesterday;
  m.warningSettings.stations.LEGACY={ids:levels.map(level=>level.id),values:legacy};
  const upgraded=m.activeWarning('LEGACY',levels);
  assert.deepEqual(upgraded.yesterday,legacy['24h']);
  assert.notEqual(upgraded.yesterday,legacy['24h']);
  upgraded.yesterday=[20,40,70,150];
  m.saveWarning('station-test',upgraded,levels);
  assert.deepEqual(m.activeWarning('station-test',levels)['24h'],legacy['24h']);
  assert.notEqual(m.evaluateWarning('station-test','yesterday',100,levels).level.id,m.evaluateWarning('station-test','24h',100,levels).level.id);
  const stored=JSON.parse(data.get(m.WARNING_KEY));
  assert.deepEqual(stored.stations['station-test'].values.yesterday,upgraded.yesterday);
  assert.deepEqual(stored.stations['station-test'].values['24h'],legacy['24h']);
  const central=JSON.parse(JSON.stringify(m.activeWarning('',levels)));
  central.yesterday=[25,45,80,170];
  m.saveCentralWarning(central,levels);
  assert.deepEqual(m.activeWarning('fresh',levels).yesterday,central.yesterday);
  assert.deepEqual(m.activeWarning('fresh',levels)['24h'],central['24h']);
  m.resetWarning('station-test');
  assert.deepEqual(m.activeWarning('station-test',levels).yesterday,central.yesterday);
});


test('warning names use five requested levels and legacy six bands preserve higher boundaries',()=>{
  const levels=m.warningMaster();
  assert.deepEqual(levels.map(level=>level.name),['ติดตาม','เฝ้าระวัง','เตรียมรับมือ','อพยพ','ต้องอพยพ']);
  const values=Object.fromEntries(Object.keys(m.WARNING_PERIODS).map(period=>[period,[0.5,10,20,35,90]]));
  m.warningSettings.stations.OLD={ids:['a','b','c','d','e','f'],values};
  assert.deepEqual(m.activeWarning('OLD',levels)['24h'],[10,20,35,90]);
});


test('warning colors follow green blue yellow orange red',()=>{
 assert.deepEqual(m.warningMaster().map(level=>level.color),['#22c55e','#38bdf8','#facc15','#f97316','#ef4444']);
});

test('rain name lists support different counts per period without changing other periods',()=>{
  const periods=Object.keys(m.WARNING_PERIODS);
  const base=m.warningMaster();
  const lists={quantity:{},warning:Object.fromEntries(periods.map(period=>[period,base.map(level=>({...level}))]))};
  lists.warning['1h'].push({id:'extra-hour',name:'เฉพาะฝน 1 ชั่วโมง',color:'#ffffff'});
  data.set('ndwc.rain-name-lists.v1',JSON.stringify(lists));
  const values=m.activeWarning('',m.warningMaster(),{draft:true});
  assert.equal(values['1h'].length,5);
  assert.equal(values['24h'].length,4);
  assert.equal(values['1h'][4],null);
  values['1h'][4]=100;
  m.saveCentralWarning(values,m.warningMaster());
  assert.equal(m.warningMaster('1h').length,6);
  assert.equal(m.warningMaster('24h').length,5);
  lists.warning['1h'].pop();
  data.set('ndwc.rain-name-lists.v1',JSON.stringify(lists));
  assert.deepEqual(m.activeWarning('',m.warningMaster())['1h'],values['1h'].slice(0,4));
  data.delete('ndwc.rain-name-lists.v1');
});
