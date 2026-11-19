import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const master = readFileSync(new URL('../public/master-data.html', import.meta.url), 'utf8');
const navigation = readFileSync(new URL('./components/CriteriaNavigation.vue', import.meta.url), 'utf8');

test('threshold navigation is consolidated into one central criteria menu', () => {
  assert.equal((navigation.match(/ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง/g) ?? []).length, 1);
  assert.doesNotMatch(navigation, /ชื่อเกณฑ์และระดับการแจ้งเตือนภัย/);
  assert.doesNotMatch(navigation, /goCentral/);
});

test('central criteria opens warning colors and edits bounds, names and colors inline', () => {
  assert.match(master, /let rainCategory='warning'/);
  assert.match(master, /เกณฑ์การเฝ้าระวังภัย \(ปภ\.\)/);
  assert.match(master, /เกณฑ์มาตรฐานอ้างอิง/);
  assert.match(master, /id="inlineName"/);
  assert.match(master, /id="inlineColor"/);
  assert.match(master, /id="inlineLimit"/);
  assert.match(master, /function measurementCuts/);
  assert.match(master, /warningSettings\.measurementRules/);
  assert.match(master, /localStorage\.setItem\(WARNING_STORAGE/);
});
