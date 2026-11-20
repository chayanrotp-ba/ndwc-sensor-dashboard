export const AUDIT_LOG_KEY = 'ndwc.audit-log.v1';

// Keep this list aligned with the Station back-office menu.  The log selector
// must not depend on whether an example row exists for a feature yet.
export const AUDIT_TARGETS = Object.freeze([
  'รายการสถานี Sensor',
  'ตั้งค่าเกณฑ์รายสถานี',
  'ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง',
  'กฎแจ้งเตือน LINE',
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

// Each feature owns its audit columns.  This deliberately avoids one wide,
// generic table whose columns become meaningless for different CRUD screens.
export const AUDIT_VIEW_COLUMNS = Object.freeze({
  'รายการสถานี Sensor': Object.freeze([
    ['station', 'สถานี / รหัส'], ['location', 'สถานที่ตั้ง'], ['basin', 'ลุ่มแม่น้ำ'], ['frequency', 'ความถี่ส่ง'], ['owner', 'ผู้ดูแล'], ['updatedAt', 'อัปเดตล่าสุด'], ['status', 'สถานะ'], ['visible', 'การมองเห็น'],
  ]),
  'ตั้งค่าเกณฑ์รายสถานี': Object.freeze([
    ['station', 'สถานี / รหัส'], ['measurement', 'ประเภทตรวจวัด'], ['period', 'ช่วงเวลาสะสม'], ['level', 'ระดับเกณฑ์'], ['range', 'ช่วงค่า'], ['criterionSource', 'ชุดเกณฑ์ที่ใช้'],
  ]),
  'ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง': Object.freeze([
    ['criteriaSet', 'ชุดเกณฑ์'], ['measurement', 'ประเภทตรวจวัด'], ['period', 'ช่วงเวลาสะสม'], ['level', 'ระดับเกณฑ์'], ['color', 'สี'], ['range', 'ช่วงค่า'], ['alertEnabled', 'การแจ้งเตือน'],
  ]),
  'กฎแจ้งเตือน LINE': Object.freeze([
    ['target', 'ชื่อกฎ'], ['lineGroup', 'LINE Group'], ['stationCount', 'สถานี'], ['timeWindow', 'ช่วงเวลา'], ['trigger', 'เงื่อนไขแจ้งเตือน'], ['status', 'สถานะ'],
  ]),
  'ตั้งค่า Popup แจ้งเตือนข่าว': Object.freeze([
    ['target', 'หัวข้อ'], ['message', 'รายละเอียด'], ['displayWindow', 'ช่วงวันที่แสดง'], ['status', 'สถานะ'], ['visible', 'เปิดการแสดงผล'],
  ]),
  'จัดการ Story Map': Object.freeze([
    ['target', 'หัวข้อ'], ['image', 'รูปภาพ'], ['description', 'รายละเอียด'], ['link', 'ลิงก์'], ['status', 'สถานะ'],
  ]),
  'จัดการผู้ใช้งาน': Object.freeze([
    ['username', 'Username'], ['fullName', 'ชื่อ-นามสกุล'], ['email', 'อีเมล'], ['agency', 'สังกัด'], ['roles', 'สิทธิ์ / บทบาท'], ['status', 'สถานะ'],
  ]),
  'กำหนดสิทธิ์': Object.freeze([
    ['target', 'ชื่อสิทธิ์'], ['permissions', 'Permission ตามเมนู'], ['status', 'สถานะ'],
  ]),
});

export function auditColumnsFor(item) { return AUDIT_VIEW_COLUMNS[item] || []; }

// Fields shown inside the Log detail dialog follow the corresponding edit form,
// not just the compact columns of its list page.
export const AUDIT_DETAIL_FIELDS = Object.freeze({
  'รายการสถานี Sensor': Object.freeze([['station', 'สถานี / รหัส'], ['location', 'สถานที่ตั้ง'], ['basin', 'ลุ่มแม่น้ำ'], ['manager', 'ผู้ดูแลสถานี'], ['phone', 'หมายเลขโทรศัพท์'], ['latitude', 'ละติจูด'], ['longitude', 'ลองจิจูด'], ['utmZone', 'UTM Zone'], ['installedAt', 'วันที่ติดตั้ง'], ['activeAt', 'วันที่เริ่มเปิดใช้งาน'], ['retiredAt', 'วันที่ปลดประจำการ'], ['status', 'สถานะ'], ['visible', 'การมองเห็น']]),
  'ตั้งค่าเกณฑ์รายสถานี': Object.freeze([['station', 'สถานี / รหัส'], ['measurement', 'ประเภทตรวจวัด'], ['period', 'ช่วงเวลาสะสม'], ['level', 'ระดับเกณฑ์'], ['color', 'สีระดับเกณฑ์'], ['range', 'ช่วงค่า'], ['criterionSource', 'ชุดเกณฑ์ที่ใช้']]),
  'ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง': Object.freeze([['criteriaSet', 'ชุดเกณฑ์'], ['measurement', 'ประเภทตรวจวัด'], ['period', 'ช่วงเวลาสะสม'], ['level', 'ระดับเกณฑ์'], ['color', 'สี'], ['range', 'ช่วงค่า'], ['alertEnabled', 'การแจ้งเตือน']]),
  'กฎแจ้งเตือน LINE': Object.freeze([['target', 'ชื่อกฎ'], ['lineGroup', 'LINE Group'], ['stationCount', 'สถานีที่เลือก'], ['timeWindow', 'ช่วงเวลาส่ง'], ['trigger', 'เงื่อนไขแจ้งเตือน'], ['status', 'สถานะ']]),
  'ตั้งค่า Popup แจ้งเตือนข่าว': Object.freeze([['target', 'หัวข้อ'], ['popupType', 'ประเภทหัวข้อ'], ['icon', 'ไอคอน'], ['displayWindow', 'ช่วงวันที่แสดง'], ['message', 'รายละเอียดการแจ้งเตือน'], ['status', 'สถานะ'], ['visible', 'เปิดการแสดงผล']]),
  'จัดการ Story Map': Object.freeze([['target', 'หัวข้อ'], ['link', 'ลิงก์ URL'], ['description', 'รายละเอียด'], ['image', 'รูปภาพ'], ['status', 'สถานะ']]),
  'จัดการผู้ใช้งาน': Object.freeze([['username', 'ชื่อผู้ใช้งาน'], ['fullName', 'ชื่อ-นามสกุล'], ['email', 'อีเมล'], ['agency', 'สังกัด'], ['roles', 'สิทธิ์ / บทบาท'], ['status', 'สถานะ']]),
  'กำหนดสิทธิ์': Object.freeze([['target', 'ชื่อสิทธิ์'], ['permissions', 'Permission ตามเมนู'], ['status', 'สถานะ']]),
});

export function auditDetailFieldsFor(item) { return AUDIT_DETAIL_FIELDS[item] || auditColumnsFor(item); }

const seed = [
  { id: 'seed-1', item: 'กฎแจ้งเตือน LINE', action: 'แก้ไข', target: 'NDWC North', basin: 'ลุ่มน้ำน่าน', at: '17/11/2569 09:29 น.', actor: 'Super admin', detail: 'ปรับประเภทและระดับที่ใช้แจ้งเตือน', fields: { lineGroup: 'โต๊ะประสานข่าวเช้า', stationCount: '11 สถานี', timeWindow: '22:00–08:00 (+1)', trigger: 'ปริมาณฝนสะสม · เฝ้าระวัง', status: 'เปิดใช้งาน' } },
  { id: 'seed-2', item: 'รายการสถานี Sensor', action: 'แก้ไข', target: 'สะพานบ้านคลองหนุ่ม 4 อ่างทอง', basin: 'ลุ่มน้ำเจ้าพระยา', at: '09/11/2569 13:58 น.', actor: 'Support01', detail: 'ปรับข้อมูลสถานีตรวจวัด', station: { code: 'G15006-2404', location: 'ต.บางเสด็จ อ.ป่าโมก จ.อ่างทอง', frequency: '15 นาที', owner: 'Support01', updatedAt: '09/11/2569 13:58 น.', status: 'Online', visible: true }, fields: { manager: 'สมชาย ใจดี', phone: 'ไม่ระบุ', latitude: '14.5631', longitude: '100.4512', utmZone: '47N', installedAt: '01/10/2568', activeAt: '01/11/2568', retiredAt: '—' } },
  { id: 'seed-criteria-station', item: 'ตั้งค่าเกณฑ์รายสถานี', action: 'แก้ไข', target: 'องค์การบริหารส่วนตำบลขุนน่าน', basin: 'ลุ่มน้ำน่าน', at: '09/11/2569 12:45 น.', actor: 'Support01', detail: 'ปรับเกณฑ์ Custom เฉพาะสถานี', station: { code: 'G15006-5501', location: 'ต.ขุนน่าน อ.เฉลิมพระเกียรติ จ.น่าน' }, fields: { measurement: 'ปริมาณฝนสะสม', period: 'ฝน 24 ชั่วโมง', level: 'ติดตาม, เฝ้าระวัง, เตรียมรับมือ, อพยพ, ต้องอพยพ', color: 'เขียว, ฟ้า, เหลือง, ส้ม, แดง', range: '0–10, >10–20, >20–35, >35–90, >90 มม.', criterionSource: 'Custom เฉพาะสถานี' } },
  { id: 'seed-3', item: AUDIT_CENTRAL_CRITERIA_TARGET, criteriaSet: 'เกณฑ์การเฝ้าระวังภัย (ปภ.)', action: 'แก้ไข', target: 'ปริมาณฝนสะสม · ฝน 24 ชั่วโมง', basin: '-', at: '06/11/2569 17:15 น.', actor: 'Super admin', detail: 'ปรับชื่อ สี และช่วงค่าเกณฑ์กลาง', fields: { measurement: 'ปริมาณฝนสะสม', period: 'ฝน 24 ชั่วโมง', level: 'เตรียมรับมือ', color: '#FACC15', range: '>20 ถึง 35 มม.', alertEnabled: 'เปิด' } },
  { id: 'seed-6', item: 'ตั้งค่า Popup แจ้งเตือนข่าว', action: 'แก้ไข', target: 'อยู่ระหว่างการบำรุงรักษาระบบ', basin: '-', at: '01/11/2569 00:00 น.', actor: 'Super admin', detail: 'ปรับช่วงเวลาการแสดงผล', fields: { popupType: 'บำรุงรักษา', icon: 'ประแจ', displayWindow: '1–30 พ.ย. 2569', message: 'ระบบกล้อง CCTV กำลังทำการปรับปรุงการรับภาพข้อมูลอยู่ ณ ขณะนี้', status: 'กำลังแสดงผล', visible: 'เปิด' } },
  { id: 'seed-7', item: 'จัดการ Story Map', action: 'แก้ไข', target: 'จากยอดดอยสู่ชัยภูมิ', basin: '-', at: '30/10/2569 09:30 น.', actor: 'Support01', detail: 'ปรับรายละเอียดและรูปภาพ', fields: { link: 'gis-portal.disaster.go.th/portal/apps/storymaps', description: 'เฝ้าระวังอุทกภัย ลุ่มน้ำชายฝั่งตะวันออกของไทย', image: 'อัปเดตรูปภาพ', status: 'เปิด' } },
  { id: 'seed-8', item: 'จัดการผู้ใช้งาน', action: 'แก้ไข', target: 'admin.sensor', basin: '-', at: '28/10/2569 14:00 น.', actor: 'Super admin', detail: 'ปรับบทบาทผู้ใช้งาน', fields: { username: 'admin.sensor', fullName: 'ผู้ดูแลระบบ ส่วนกลาง', email: 'admin.sensor@disaster.go.th', agency: 'ส่วนกลาง ปภ.', roles: 'SuperAdmin', status: 'เปิดใช้งาน' } },
  { id: 'seed-9', item: 'กำหนดสิทธิ์', action: 'แก้ไข', target: 'ProvinceOfficer', basin: '-', at: '28/10/2569 13:45 น.', actor: 'Super admin', detail: 'ปรับ Permission ตามเมนู', fields: { permissions: 'รายการสถานี Sensor: ดู/แก้ไข · Story Map: ดู', status: 'เปิดใช้งาน' } },
];

function storageOf(storage) { return storage || globalThis.localStorage; }

const legacyItemNames = Object.freeze({
  'สถานี': 'รายการสถานี Sensor',
  'สถานีตรวจวัด': 'รายการสถานี Sensor',
  'เกณฑ์รายสถานี': 'ตั้งค่าเกณฑ์รายสถานี',
  'เกณฑ์การเฝ้าระวังภัยรายสถานี': 'ตั้งค่าเกณฑ์รายสถานี',
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
    station: entry?.station && typeof entry.station === 'object' ? entry.station : null,
    fields: entry?.fields && typeof entry.fields === 'object' ? entry.fields : {},
    changes: entry?.changes && typeof entry.changes === 'object' ? entry.changes : {},
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
    station: entry?.station && typeof entry.station === 'object' ? entry.station : null,
    fields: entry?.fields && typeof entry.fields === 'object' ? entry.fields : {},
    changes: entry?.changes && typeof entry.changes === 'object' ? entry.changes : {},
    at: entry?.at || new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()).replace(',', '') + ' น.'
  };
  if (!AUDIT_TARGETS.includes(event.item)) return event;
  const next = [event, ...loadAuditLog(store)].slice(0, 500);
  try { store?.setItem(AUDIT_LOG_KEY, JSON.stringify(next)); } catch { /* Keep the interaction usable when browser storage is full. */ }
  return event;
}
