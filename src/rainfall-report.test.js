import assert from 'node:assert/strict';
import { RAINFALL_REPORT_COLUMNS, REPORT_STATIONS, automaticSelection, createReportRows, totalRainfall } from './rainfall-report.js';

assert.deepEqual(RAINFALL_REPORT_COLUMNS, ['ชื่อสถานี', 'หน่วยงาน', 'ตำบล', 'อำเภอ', 'จังหวัด', 'D−2', 'D−1', 'D', 'ฝนสะสม 3 วัน']);
assert.equal(totalRainfall([0, 3, 28]), 31);
assert.equal(totalRainfall([null, 3, 28]), null, 'missing must not become zero');
assert.equal(createReportRows(['G15006-2202'])[0].total, null);
assert.deepEqual(Object.keys(createReportRows(['G15006-5501'])[0]).filter(key => ['code', 'name', 'agency', 'tambon', 'amphoe', 'province'].includes(key)).length, 6, 'report row must retain Station Master identity and location fields');
assert.ok(automaticSelection({ agencyScope:'กรมป้องกันและบรรเทาสาธารณภัย', provinceScope:'all', criteriaMode:'all' }).includes('G15006-5501'));
const provinceCounts = REPORT_STATIONS.reduce((counts,station)=>counts.set(station.province,(counts.get(station.province)||0)+1),new Map());
assert.ok(provinceCounts.size >= 15 && provinceCounts.size < 77,'prototype should cover a representative subset of provinces');
assert.ok([...provinceCounts.values()].every(count=>count>=1&&count<=10),'every example province should contain no more than 10 stations');
assert.ok(createReportRows().length >= 50, 'prototype should include enough station examples to exercise filters and scrolling');
const limitedSelection=automaticSelection({agencyScope:'all',provinceScope:'all',criteriaMode:'rain',minRain:40,minimumEnabled:true,minRows:1});
const limitedProvinceCounts=createReportRows(limitedSelection).reduce((counts,station)=>counts.set(station.province,(counts.get(station.province)||0)+1),new Map());
assert.ok([...limitedProvinceCounts.values()].every(count=>count===1),'station count limit must cap the result at one row per province');
assert.equal(automaticSelection({agencyScope:'all',provinceScope:'all',criteriaMode:'rain',minRain:300,minimumEnabled:true,minRows:1}).length,0,'rainfall threshold must be applied before the province limit');
console.log('rainfall-report tests passed');
