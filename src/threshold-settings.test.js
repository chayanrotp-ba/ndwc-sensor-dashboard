import test from 'node:test';
import assert from 'node:assert/strict';
const storage = new Map();
globalThis.localStorage = { getItem:key => storage.get(key) || null, setItem:(key,value) => storage.set(key,value) };
const { thresholdSettings, defaultRain, effectiveThreshold, effectiveRainfall, saveThresholds, inheritThresholds, SETTINGS_KEY } = await import('./threshold-settings.js');

test('type defaults affect unconfigured stations; station overrides remain isolated and can return to defaults', () => {
  const common = defaultRain(); common['24h']=[1,20,60,140];
  saveThresholds('type', 'A', common);
  assert.deepEqual(effectiveThreshold('A','24h').cuts, common['24h']);
  assert.deepEqual(effectiveThreshold('B','24h').cuts, common['24h']);
  const own = defaultRain(); own['24h']=[1,10,30,70];
  saveThresholds('station','A',own);
  assert.equal(effectiveRainfall('A','24h',80,false).label,'ฝนหนักมาก');
  assert.equal(effectiveRainfall('B','24h',80,false).label,'ฝนหนัก');
  common['24h']=[2,25,65,150]; saveThresholds('type','B',common);
  assert.deepEqual(effectiveThreshold('A','24h').cuts,own['24h']);
  assert.deepEqual(JSON.parse(storage.get(SETTINGS_KEY)).stations.A.rain['24h'],own['24h']);
  inheritThresholds('A');
  assert.deepEqual(effectiveThreshold('A','24h').cuts,common['24h']);
  assert.equal(effectiveThreshold('A','24h').source,'เกณฑ์กลาง (Default ระบบ)');
});
test('invalid ranges and failed storage writes cannot change the active thresholds', () => {
  const before=JSON.stringify(thresholdSettings);
  const invalid=defaultRain(); invalid['24h']=[1,10,10,90];
  assert.throws(()=>saveThresholds('station','A',invalid));
  invalid['24h']=[null,10,35,90]; assert.throws(()=>saveThresholds('type','A',invalid));
  assert.equal(JSON.stringify(thresholdSettings),before);
  globalThis.localStorage.setItem=()=>{throw new Error('storage full');};
  assert.throws(()=>saveThresholds('station','A',defaultRain()));
  assert.equal(JSON.stringify(thresholdSettings),before);
});
