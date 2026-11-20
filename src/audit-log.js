export const AUDIT_LOG_KEY = 'ndwc.audit-log.v1';

// Keep this list aligned with the Station back-office menu.  The log selector
// must not depend on whether an example row exists for a feature yet.
export const AUDIT_TARGETS = Object.freeze([
  'รายการสถานี Sensor',
  'ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง',
  'กฎแจ้งเตือน LINE',
  'ความถี่การแจ้งเตือน',
  'รายงานปริมาณน้ำฝน',
  'ประเภทข้อมูล Sensor สำหรับ LINE OA',
  'ตั้งค่า Popup แจ้งเตือนข่าว',
  'จัดการ Story Map',
  'จัดการผู้ใช้งาน',
  'กำหนดสิทธิ์',
]);

export const AUDIT_CENTRAL_CRITERIA_TARGET = 'ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง';
export const AUDIT_CRITERIA_SETS = Object.freeze([
  'เกณฑ์การเฝ้าระวังภัย (ปภ.)',
  'เกณฑ์มาตรฐานอ้างอิง',
]);

const seed = [
  { id: 'seed-1', item: 'กฎแจ้งเตือน LINE', action: 'แก้ไข', target: 'NDWC North', basin: 'ลุ่มน้ำน่าน', at: '17/11/2569 09:29 น.', actor: 'Super admin', detail: 'ปรับประเภทและระดับที่ใช้แจ้งเตือน' },
  { id: 'seed-2', item: 'รายการสถานี Sensor', action: 'แก้ไข', target: 'สะพานบ้านคลองหนุ่ม 4 อ่างทอง', basin: 'ลุ่มน้ำเจ้าพระยา', at: '09/11/2569 13:58 น.', actor: 'Support01', detail: 'ปรับข้อมูลสถานีตรวจวัด' },
  { id: 'seed-3', item: AUDIT_CENTRAL_CRITERIA_TARGET, criteriaSet: 'เกณฑ์การเฝ้าระวังภัย (ปภ.)', action: 'แก้ไข', target: 'ปริมาณฝนสะสม · ฝน 24 ชั่วโมง', basin: '-', at: '06/11/2569 17:15 น.', actor: 'Super admin', detail: 'ปรับชื่อ สี และช่วงค่าเกณฑ์กลาง' },
  { id: 'seed-4', item: 'ความถี่การแจ้งเตือน', action: 'แก้ไข', target: 'ค่าเริ่มต้นของระบบ', basin: 'ทุกลุ่มน้ำ', at: '06/11/2569 17:14 น.', actor: 'Super admin', detail: 'ปรับเวลาห้ามแจ้งซ้ำ' },
  { id: 'seed-5', item: 'ประเภทข้อมูล Sensor สำหรับ LINE OA', action: 'แก้ไข', target: 'ปริมาณฝนสะสม', basin: '-', at: '20/10/2569 13:42 น.', actor: 'Support01', detail: 'เปิดใช้งานประเภทข้อมูลสำหรับ LINE OA' },
];

function storageOf(storage) { return storage || globalThis.localStorage; }

const legacyItemNames = Object.freeze({
  'สถานี': 'รายการสถานี Sensor',
  'สถานีตรวจวัด': 'รายการสถานี Sensor',
  'เกณฑ์รายสถานี': 'รายการสถานี Sensor',
  'เกณฑ์การเฝ้าระวังภัยรายสถานี': 'รายการสถานี Sensor',
});

function normalizeItem(item) {
  if (AUDIT_CRITERIA_SETS.includes(item)) return AUDIT_CENTRAL_CRITERIA_TARGET;
  return legacyItemNames[item] || item || 'ข้อมูลระบบ';
}

function criteriaSetOf(item, criteriaSet) {
  return criteriaSet || (AUDIT_CRITERIA_SETS.includes(item) ? item : '');
}

function normalizeEntry(entry) {
  return {
    ...entry,
    item: normalizeItem(entry?.item),
    criteriaSet: criteriaSetOf(entry?.item, entry?.criteriaSet),
  };
}

export function loadAuditLog(storage) {
  try {
    const value = JSON.parse(storageOf(storage)?.getItem(AUDIT_LOG_KEY) || 'null');
    if (Array.isArray(value)) {
      const entries = value.map(normalizeEntry);
      return [...entries, ...seed.filter(example => !entries.some(entry => entry.id === example.id))];
    }
  } catch { /* Use the initial prototype history when browser storage is unavailable. */ }
  return seed.map(entry => ({ ...entry }));
}

export function recordAudit(entry, storage) {
  const store = storageOf(storage);
  const rawItem = entry?.item;
  const event = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    item: normalizeItem(rawItem),
    criteriaSet: criteriaSetOf(rawItem, entry?.criteriaSet),
    action: entry?.action || 'แก้ไข',
    target: entry?.target || '-',
    basin: entry?.basin || '-',
    actor: entry?.actor || 'Super admin',
    detail: entry?.detail || '-',
    at: entry?.at || new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()).replace(',', '') + ' น.'
  };
  const next = [event, ...loadAuditLog(store)].slice(0, 500);
  try { store?.setItem(AUDIT_LOG_KEY, JSON.stringify(next)); } catch { /* Keep the interaction usable when browser storage is full. */ }
  return event;
}
