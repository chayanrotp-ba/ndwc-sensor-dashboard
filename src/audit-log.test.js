import test from 'node:test';
import assert from 'node:assert/strict';
import { AUDIT_CENTRAL_CRITERIA_TARGET, AUDIT_CRITERIA_SETS, AUDIT_LOG_KEY, AUDIT_TARGETS, loadAuditLog, recordAudit } from './audit-log.js';

function storage() { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) }; }

test('audit history starts with usable records and persists CRUD records first', () => {
  const store = storage();
  assert.ok(loadAuditLog(store).length >= 5);
  const record = recordAudit({ item: 'กฎแจ้งเตือน LINE', action: 'เพิ่ม', target: 'กลุ่มทดสอบ', basin: 'ลุ่มน้ำน่าน' }, store);
  const saved = JSON.parse(store.getItem(AUDIT_LOG_KEY));
  assert.equal(saved[0].id, record.id);
  assert.equal(saved[0].action, 'เพิ่ม');
  assert.equal(saved[0].target, 'กลุ่มทดสอบ');
});

test('audit target selector contains every mutable feature from the Station menu', () => {
  [
    'รายการสถานี Sensor',
    'ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง',
    'กฎแจ้งเตือน LINE',
    'ประเภทข้อมูล Sensor สำหรับ LINE OA',
    'ตั้งค่า Popup แจ้งเตือนข่าว',
    'จัดการ Story Map',
    'จัดการผู้ใช้งาน',
    'กำหนดสิทธิ์',
  ].forEach((target) => assert.ok(AUDIT_TARGETS.includes(target), `${target} is missing`));
});

test('legacy station and per-station criteria events remain filterable under the Station CRUD target', () => {
  const store = storage();
  store.setItem(AUDIT_LOG_KEY, JSON.stringify([
    { id: 'legacy-station', item: 'สถานี' },
    { id: 'legacy-criteria', item: 'เกณฑ์การเฝ้าระวังภัยรายสถานี' },
  ]));
  const rows = loadAuditLog(store);
  assert.equal(rows[0].item, 'รายการสถานี Sensor');
  assert.equal(rows[1].item, 'รายการสถานี Sensor');
});

test('central criteria events are grouped under the central setting with their selected criteria set', () => {
  const store = storage();
  store.setItem(AUDIT_LOG_KEY, JSON.stringify([
    { id: 'warning-criteria', item: 'เกณฑ์การเฝ้าระวังภัย (ปภ.)' },
    { id: 'reference-criteria', item: 'เกณฑ์มาตรฐานอ้างอิง' },
  ]));
  const rows = loadAuditLog(store);
  assert.equal(rows[0].item, 'ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง');
  assert.equal(rows[0].criteriaSet, 'เกณฑ์การเฝ้าระวังภัย (ปภ.)');
  assert.equal(rows[1].item, 'ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง');
  assert.equal(rows[1].criteriaSet, 'เกณฑ์มาตรฐานอ้างอิง');
});

test('the criteria-set filter has both central criteria choices even before an event is recorded', () => {
  assert.equal(AUDIT_CENTRAL_CRITERIA_TARGET, 'ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง');
  assert.deepEqual(AUDIT_CRITERIA_SETS, ['เกณฑ์การเฝ้าระวังภัย (ปภ.)', 'เกณฑ์มาตรฐานอ้างอิง']);
});
