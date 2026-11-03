import test from 'node:test';
import assert from 'node:assert/strict';
import { RAIN_CRITERIA, RAIN_LEVELS, rainfallResult } from './rain-criteria.js';
import Component from './components/Exact.js';

test('all v56 cuts include their upper boundary', () => {
  for (const [period, { cuts }] of Object.entries(RAIN_CRITERIA)) {
    cuts.forEach((cut,index) => {
      assert.equal(rainfallResult(period,cut).label,RAIN_LEVELS[index]);
      assert.equal(rainfallResult(period,cut+0.1).label,RAIN_LEVELS[index+1]);
    });
  }
});
test('zero rain, missing data, offline and unsupported periods stay distinct', () => {
  assert.equal(rainfallResult('24h',0).label,'ไม่มีฝน');
  for (const value of [null,undefined,NaN,-1]) assert.equal(rainfallResult('24h',value).available,false);
  assert.equal(rainfallResult('24h',270,true).available,false);
  assert.equal(rainfallResult('48h',270).criterion,undefined);
  assert.equal(rainfallResult('72h',200).criterion.draft,true);
  assert.equal(rainfallResult('72h',270).label,'ฝนหนักมาก');
});

test('mock area cuts are 20 percent below the central reference and assess separately', () => {
  assert.deepEqual(rainfallResult('24h',80,false,'area').criterion.cuts,[0.4,8,28,72]);
  assert.equal(rainfallResult('24h',80,false,'area').label,'ฝนหนักมาก');
  assert.equal(rainfallResult('24h',80).label,'ฝนหนัก');
  assert.deepEqual(rainfallResult('72h',170,false,'area').criterion.cuts,[40,80,120,160]);
  assert.equal(rainfallResult('72h',170,false,'area').label,'ฝนหนักมาก');
  assert.equal(rainfallResult('72h',170).label,'ฝนหนัก');
  assert.deepEqual(RAIN_CRITERIA['24h'].cuts,[0.5,10,35,90]);
});

test('popup period buttons update the shared graph range and matching accumulation', () => {
  const model = new Component({}); model.state.st = 's1';
  let view = model.renderVals();
  view.spComparison.periods.find(p => p.key === '72h').pick();
  view = model.renderVals();
  assert.equal(model.state.sph.range, '72h');
  assert.equal(view.spComparison.value, 437.7);
  assert.equal(rainfallResult(view.spComparison.range,view.spComparison.value).label,'ฝนหนักมาก');
  assert.deepEqual(view.spComparison.periods.map(p=>p.label),['24 ชม.','3 วัน','5 วัน','7 วัน','15 วัน']);
  for(const key of ['5d','7d','15d']){view.spComparison.periods.find(p=>p.key===key).pick();view=model.renderVals();assert.equal(view.spComparison.range,key);assert.equal(rainfallResult(key,view.spComparison.value).available,true);}

});
