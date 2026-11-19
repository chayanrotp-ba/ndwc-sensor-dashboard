import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const template = await readFile(new URL('./components/Exact.html', import.meta.url), 'utf8');
const dpm = template.slice(template.indexOf('<sc-if value="{{dpmSummary}}"'), template.indexOf('<sc-if value="{{notDpmSummary}}"'));
const standard = template.slice(template.indexOf('<sc-if value="{{notDpmSummary}}"'));
const logic = await readFile(new URL('./components/Exact.js', import.meta.url), 'utf8');
const comparison = await readFile(new URL('./components/CriteriaComparison.vue', import.meta.url), 'utf8');

test('DDPM summary adds to, rather than replaces, the original station table', () => {
  assert.match(logic, /dpmSummary:\s*!!\(isRain && s\.dpmSummary && s\.crit === 'own'\)/);
  assert.ok(dpm.includes('class="abs dpm-summary-box"'), 'DPM mode must add the requested summary');
  for (const primitive of [
    'class="abs ex-th dpm-th"',
    'class="abs ex-rows dpm-list"',
    'class="{{r.cls}}"',
    'class="dpm-row-level"',
    'class="{{r.tmCls}}"',
    'class="pl" style="{{r.plStyle}}"',
    'class="ex-gb"',
    'class="abs ex-pg dpm-pg"'
  ]) assert.ok(dpm.includes(primitive), `DDPM list must retain the native ${primitive}`);
  assert.ok(!dpm.includes('class="dpm-row"'), 'DPM must not render a replacement row component');
  assert.ok(!dpm.includes('<dc-import name="CriteriaResults"'), 'DPM rows must not inject the tall criteria component');
  assert.match(template, /\.dpm-list \.ex-tr\{height:124px!important\}/);
  const order = ['class="abs dpm-summary-box"', 'class="abs dpm-rhead"', 'class="abs ex-th dpm-th"', 'class="abs ex-rows dpm-list"'];
  for (let index = 1; index < order.length; index++) {
    assert.ok(dpm.indexOf(order[index - 1]) < dpm.indexOf(order[index]), `${order[index]} must follow ${order[index - 1]}`);
  }
  assert.match(template, /\.dpm-rhead\{left:17px;top:302px/);
  assert.match(template, /\.dpm-th\{left:17px;top:336px/);
  assert.match(template, /\.dpm-list\.ex-rows\{left:17px;top:392px;width:551px;height:420px/);
});

test('standard station table remains the shared visual reference', () => {
  for (const primitive of ['class="abs ex-th"', 'class="abs ex-rows"', 'class="{{r.cls}}"', '<dc-import name="CriteriaResults" station="{{r.criteria}}">', 'class="abs ex-pg"']) {
    assert.ok(standard.includes(primitive), `standard table must retain ${primitive}`);
  }
});

test('DDPM legend and criterion column use the approved operational wording', () => {
  for (const label of ['>90 มม. ต้องอพยพ', '>35–90 มม. อพยพ', '>10–35 มม. เตรียมรับมือ', '>0.5–10 มม. เฝ้าระวัง', '0–0.5 มม. ติดตาม']) {
    assert.ok(logic.includes(label), `legend must include ${label}`);
  }
  assert.match(logic, /legendTitle: isRain && s\.crit === 'own' \? 'คำอธิบายสัญลักษณ์'/);
  assert.ok(dpm.includes('>ประเภทเกณฑ์<'), 'DDPM table must retain the criterion-type column');
  assert.ok(dpm.includes('<span class="{{r.criteriaBadgeCls}}" title="{{r.levelTitle}}">{{r.criteriaBadge}}</span>'), 'criterion source must sit below the station agency');
  assert.match(logic, /criteriaBadge: result \? \(isCustom \? 'เกณฑ์การเฝ้าระวังภัยรายสถานี' : 'เกณฑ์การเฝ้าระวังภัย \(ปภ\.\)'/);
  assert.match(template, /\.dpm-row-level\{left:307px;top:29px;width:122px/);
  assert.match(template, /\.dpm-list \.ex-tr\{height:124px!important\}/);
  assert.match(template, /\.dpm-list \.ex-tr \.nm\{top:9px;font-size:17px;line-height:22px/);
  assert.match(template, /\.dpm-list \.ex-tr \.ag\{top:56px;font-size:12px;line-height:16px/);
  assert.match(template, /\.dpm-source-badge\{position:absolute;left:15px;top:84px/);
});

test('criterion source belongs to the DDPM warning view and its popup shows the effective station ranges', () => {
  assert.match(logic, /spShowWarningCriteria: met\.key === 'rain' && s\.crit === 'own'/);
  assert.ok(template.includes('<sc-if value="{{spShowWarningCriteria}}"><dc-import name="CriteriaComparison"'));
  assert.match(comparison, /เกณฑ์การเฝ้าระวังภัยรายสถานี \(Custom\)/);
  assert.match(comparison, /เกณฑ์การเฝ้าระวังภัย \(ปภ\.\)/);
  assert.match(comparison, /activeWarning\(props\.context\.code/);
  assert.doesNotMatch(comparison, /thresholdComparisons/);
  assert.match(logic, /criteriaKind, criteriaMode: 'warning'/);
});
