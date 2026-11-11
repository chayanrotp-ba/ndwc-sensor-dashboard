import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import Exact from './components/Exact.js';

const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../public/rainfall-legend-reference.js',import.meta.url),'utf8'),context);
const reference=JSON.parse(JSON.stringify(context.window.NDWC_RAINFALL_LEGEND_REFERENCE));
const logic=new Exact({});
const periods={'1h':'1h',today:'today',yesterday:'yesterday','24h':'d1','72h':'d3','5d':'d5','7d':'d7','15d':'d15',month:'m',year:'y'};
test('quantity names, intervals and colors match every supported map Legend',()=>{
  for(const [period,key] of Object.entries(periods)){
    const legend=logic.twRain(key);
    assert.equal(reference[period].length,legend.length,period);
    legend.forEach((row,index)=>{
      const entry=reference[period][index];
      assert.equal(entry.name,row[3],period);
      assert.equal(entry.color,row[4],period);
      assert.equal(entry.range,row[2].replace(/ ฝน.*$/,''),period);
    });
  }
  assert.equal(reference['24h'].length,7);
  assert.equal(reference['5d'].length,12);
  assert.equal(reference.month.length,30);
  assert.equal(reference.year.length,30);
  for(const unsupported of ['3h','6h','12h','48h'])assert.equal(reference[unsupported],undefined);
});
