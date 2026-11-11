import test from 'node:test';
import assert from 'node:assert/strict';
const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
const rules=await import('./warning-criteria.js');
test('all eight additional types save independently and reset follows current central rules',()=>{
  for(let type=1;type<9;type++){
    const levels=rules.measurementLevels(type);
    const central=rules.activeMeasurement(type,'',levels);
    const own=central.map(value=>Number((value*0.9).toFixed(3)));
    rules.saveMeasurement(type,'A',own,levels);
    assert.deepEqual(rules.activeMeasurement(type,'A',levels),own);
    assert.deepEqual(rules.activeMeasurement(type,'B',levels),central);
    const next=[...central];next[0]*=0.95;
    rules.saveMeasurement(type,'',next,levels);
    assert.deepEqual(rules.activeMeasurement(type,'A',levels),own);
    rules.saveMeasurement(type,'A',null,levels);
    assert.deepEqual(rules.activeMeasurement(type,'A',levels),next);
    assert.equal(rules.hasMeasurementCustom(type,'A'),false);
  }
});
test('PM types are isolated and invalid values or failed persistence preserve active rules',()=>{
  const levels=rules.measurementLevels(7);
  const before=rules.activeMeasurement(8,'A',rules.measurementLevels(8));
  rules.saveMeasurement(7,'A',[10,20,30,40],levels);
  assert.deepEqual(rules.activeMeasurement(8,'A',rules.measurementLevels(8)),before);
  assert.throws(()=>rules.saveMeasurement(7,'A',[10,10,30,40],levels));
  assert.throws(()=>rules.saveMeasurement(7,'A',[10,20,30,40],levels,false));
  assert.throws(()=>rules.saveMeasurement(2,'A',[20,40,70,101],rules.measurementLevels(2)));
  const setter=localStorage.setItem;localStorage.setItem=()=>{throw Error('full')};
  assert.throws(()=>rules.saveMeasurement(7,'A',[11,22,33,44],levels));
  localStorage.setItem=setter;
  assert.deepEqual(rules.activeMeasurement(7,'A',levels),[10,20,30,40]);
});
