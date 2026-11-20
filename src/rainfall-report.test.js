import assert from 'node:assert/strict';
import { RAINFALL_REPORT_COLUMNS, createReportRows, totalRainfall } from './rainfall-report.js';

assert.deepEqual(RAINFALL_REPORT_COLUMNS, ['อำเภอ', 'จังหวัด', 'D−2', 'D−1', 'D', 'ฝนสะสม 3 วัน']);
assert.equal(totalRainfall([0, 3, 28]), 31);
assert.equal(totalRainfall([null, 3, 28]), null, 'missing must not become zero');
assert.equal(createReportRows(['G15006-2202'])[0].total, null);
console.log('rainfall-report tests passed');
