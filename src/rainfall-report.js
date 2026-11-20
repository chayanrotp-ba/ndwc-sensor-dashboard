export const RAINFALL_REPORT_COLUMNS = ['อำเภอ', 'จังหวัด', 'D−2', 'D−1', 'D', 'ฝนสะสม 3 วัน'];

// Temporary Mock Service: replace this source with Station Master + Rainfall API.
export const REPORT_STATIONS = [
  { id:'G15006-5501', code:'G15006-5501', name:'องค์การบริหารส่วนตำบลขุนน่าน', amphoe:'เฉลิมพระเกียรติ', province:'น่าน', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[28,3,45] },
  { id:'G15006-0512', code:'G15006-0512', name:'สถานีบ้านกอ', amphoe:'แม่จริม', province:'น่าน', agency:'กรมทรัพยากรน้ำ', scope:'project', rain:[0,4,19.5] },
  { id:'G15006-0515', code:'G15006-0515', name:'โรงเรียนบ้านน้ำปาย', amphoe:'แม่จริม', province:'น่าน', agency:'กรมทรัพยากรน้ำ', scope:'project', rain:[12,0,8] },
  { id:'G15006-2201', code:'G15006-2201', name:'หอประชุม ม.17', amphoe:'แก่งหางแมว', province:'จันทบุรี', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[45,3,28] },
  { id:'G15006-2202', code:'G15006-2202', name:'เทศบาลตำบลบ่อเวฬุ ม.2', amphoe:'ขลุง', province:'จันทบุรี', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[null,12,31] },
  { id:'G15006-4001', code:'G15006-4001', name:'เทศบาลตำบลสะอาด', amphoe:'น้ำพอง', province:'ขอนแก่น', agency:'กรมทรัพยากรน้ำ', scope:'project', rain:[2,0,0] },
  { id:'G15006-0821', code:'G15006-0821', name:'อบต.ปิงโค้ง', amphoe:'เชียงดาว', province:'เชียงใหม่', agency:'กรมทรัพยากรน้ำ', scope:'project', rain:[4,12,7] },
  { id:'TMD-31378274', code:'TMD-31378274', name:'บ้านขุนห้วยแม่สอด', amphoe:'แม่สอด', province:'ตาก', agency:'กรมอุตุนิยมวิทยา', scope:'external', rain:[8,6,5.5] },
  { id:'TMD-313782681', code:'TMD-313782681', name:'ศาลากลางสมุทรปราการ', amphoe:'เมืองสมุทรปราการ', province:'สมุทรปราการ', agency:'กรมอุตุนิยมวิทยา', scope:'external', rain:[null,null,13.5] },
  { id:'RID-CN-004', code:'RID-CN-004', name:'สถานีคลองหอยโข่ง', amphoe:'คลองหอยโข่ง', province:'สงขลา', agency:'กรมชลประทาน', scope:'external', rain:[45,3,28] }
];

export function totalRainfall(values) {
  // Missing stays distinct from three genuinely dry days.
  return values.some(value => value === null || value === undefined) ? null : values.reduce((sum, value) => sum + Number(value), 0);
}
export function createReportRows(ids) { const selected = new Set(ids); return REPORT_STATIONS.filter(station => selected.has(station.id)).map(station => ({ ...station, total: totalRainfall(station.rain) })); }
export function formatRainfall(value) { return value === null || value === undefined ? 'ไม่มีข้อมูล' : Number(value).toLocaleString('th-TH', { maximumFractionDigits: 1 }); }
export function isoToday() { return new Date().toISOString().slice(0, 10); }
