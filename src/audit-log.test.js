import test from 'node:test';
import assert from 'node:assert/strict';
import { AUDIT_CENTRAL_CRITERIA_TARGET, AUDIT_CRITERIA_SETS, AUDIT_LOG_KEY, AUDIT_TARGETS, auditColumnsFor, auditDetailFieldsFor, loadAuditLog, recordAudit } from './audit-log.js';

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
    'ตั้งค่าเกณฑ์รายสถานี',
    'ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง',
    'กฎแจ้งเตือน LINE',
    'ตั้งค่า Popup แจ้งเตือนข่าว',
    'จัดการ Story Map',
    'จัดการผู้ใช้งาน',
    'กำหนดสิทธิ์',
  ].forEach((target) => assert.ok(AUDIT_TARGETS.includes(target), `${target} is missing`));
});

test('every audit feature owns its own UI column set', () => {
  AUDIT_TARGETS.forEach((target) => assert.ok(auditColumnsFor(target).length > 0, `${target} has no audit columns`));
  assert.deepEqual(auditColumnsFor('รายการสถานี Sensor').map(([key]) => key), ['station', 'location', 'basin', 'frequency', 'owner', 'updatedAt', 'status', 'visible']);
  assert.ok(auditColumnsFor('ตั้งค่าเกณฑ์รายสถานี').some(([key]) => key === 'criterionSource'));
  assert.ok(auditColumnsFor('กฎแจ้งเตือน LINE').some(([key]) => key === 'trigger'));
  assert.ok(auditDetailFieldsFor('ตั้งค่า Popup แจ้งเตือนข่าว').some(([key]) => key === 'icon'));
  assert.ok(auditDetailFieldsFor('รายการสถานี Sensor').some(([key]) => key === 'latitude'));
});

test('deferred features are not available in the audit selector or persisted as audit rows', () => {
  const store = storage();
  assert.equal(AUDIT_TARGETS.includes('ความถี่การแจ้งเตือน'), false);
  assert.equal(AUDIT_TARGETS.includes('รายงานปริมาณน้ำฝน'), false);
  assert.equal(AUDIT_TARGETS.includes('ประเภทข้อมูล Sensor สำหรับ LINE OA'), false);
  recordAudit({ item: 'ความถี่การแจ้งเตือน', target: 'ค่าเริ่มต้นของระบบ' }, store);
  assert.equal(store.getItem(AUDIT_LOG_KEY), null);
});

test('legacy station and per-station criteria events remain filterable under their separate audit targets', () => {
  const store = storage();
  store.setItem(AUDIT_LOG_KEY, JSON.stringify([
    { id: 'legacy-station', item: 'สถานี' },
    { id: 'legacy-criteria', item: 'เกณฑ์การเฝ้าระวังภัยรายสถานี' },
  ]));
  const rows = loadAuditLog(store);
  assert.equal(rows[0].item, 'รายการสถานี Sensor');
  assert.equal(rows[1].item, 'ตั้งค่าเกณฑ์รายสถานี');
});

test('station audit events retain the Station menu column snapshot', () => {
  const store = storage();
  const station = { code: 'G15006-5501', location: 'ต.ขุนน่าน อ.เฉลิมพระเกียรติ จ.น่าน', frequency: '15 นาที', owner: 'นายสมชาย วงศ์ศรี', updatedAt: '09/10/2569 11:00', status: 'Online', visible: true };
  recordAudit({ item: 'รายการสถานี Sensor', action: 'แก้ไข', target: 'องค์การบริหารส่วนตำบลขุนน่าน', basin: 'ลุ่มน้ำน่าน', station }, store);
  assert.deepEqual(loadAuditLog(store)[0].station, station);
});

test('feature-specific audit fields are preserved for dynamic audit columns', () => {
  const store = storage();
  recordAudit({ item: 'จัดการ Story Map', target: 'แผนที่ทดสอบ', fields: { link: 'example.test', image: 'อัปเดตรูปภาพ', status: 'เปิด' } }, store);
  assert.deepEqual(loadAuditLog(store)[0].fields, { link: 'example.test', image: 'อัปเดตรูปภาพ', status: 'เปิด' });
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
