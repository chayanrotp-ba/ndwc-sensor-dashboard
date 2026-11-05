import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultRain, saveThresholds, effectiveThreshold } from './threshold-settings.js';
import Dashboard from './components/Exact.js';
test('daily windows share 24h edits and map legend uses the saved bounds and colors',()=>{
  const values=defaultRain(); values['24h']=[1,15,40,100];
  saveThresholds('type','',values);
  for(const window of ['24h','today','yesterday']) assert.deepEqual(effectiveThreshold('',window).cuts,values['24h']);
  const model=new Dashboard({});
  for(const period of ['d1','today','yesterday']) assert.deepEqual(model.rainCategories(period).map(c=>c[2]),model.rainCategories('d1').map(c=>c[2]));
  assert.ok(effectiveThreshold('','1h').cuts.every((v,i)=>v<values['24h'][i]));
  const own=defaultRain(); own['24h']=[1,20,50,130]; saveThresholds('station','G15006-5501',own);
  assert.match(model.rainCategories('today','G15006-5501')[0][2],/>130/);
  assert.equal(model.rainCategories('d1','G15006-5501')[0][1](130),false);
  assert.equal(model.rainCategories('d1','G15006-5501')[0][1](130.1),true);
  const invalid=defaultRain(); invalid['1h']=[1,15,40,100];
  assert.throws(()=>saveThresholds('type','',invalid),/1 ชั่วโมง/);
});
