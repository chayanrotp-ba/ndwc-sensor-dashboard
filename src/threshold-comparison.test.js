import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultRain,saveThresholds,inheritThresholds,thresholdComparisons,hasCustomThreshold} from './threshold-settings.js';
test('only configured stations show an extra criterion and badge; reset removes both',()=>{
  assert.deepEqual(thresholdComparisons('custom-test','24h',100,false).map(x=>x.key),['central']);
  const values=defaultRain();values['24h']=[1,20,50,130];
  saveThresholds('station','custom-test',values);
  assert.equal(hasCustomThreshold('custom-test'),true);
  const results=thresholdComparisons('custom-test','today',100,false);
  assert.deepEqual(results.map(x=>x.key),['central','station']);
  assert.equal(results[0].result.label,'ฝนหนักมาก');
  assert.equal(results[1].result.label,'ฝนหนัก');
  assert.deepEqual(thresholdComparisons('other-station','24h',100,false).map(x=>x.key),['central']);
  inheritThresholds('custom-test');
  assert.equal(hasCustomThreshold('custom-test'),false);
  assert.equal(thresholdComparisons('custom-test','24h',100,false).length,1);
});
