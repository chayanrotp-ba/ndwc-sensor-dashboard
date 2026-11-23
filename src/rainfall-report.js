export const RAINFALL_REPORT_COLUMNS = Object.freeze([
  'ชื่อสถานี', 'หน่วยงาน', 'ตำบล', 'อำเภอ', 'จังหวัด', 'D−2', 'D−1', 'D', 'ฝนสะสม 3 วัน',
]);

// Temporary report data mirrors the station identity and location fields already
// shown in the Sensor station list. Rain values remain a local prototype until
// Station Master and the Rainfall API are connected.
const BASE_REPORT_STATIONS = Object.freeze([
  { id:'G15006-5501', code:'G15006-5501', name:'องค์การบริหารส่วนตำบลขุนน่าน', tambon:'ขุนน่าน', amphoe:'เฉลิมพระเกียรติ', province:'น่าน', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[28,3,45] },
  { id:'G15006-0512', code:'G15006-0512', name:'สถานีบ้านกอ', tambon:'แม่จริม', amphoe:'แม่จริม', province:'น่าน', agency:'กรมทรัพยากรน้ำ', scope:'project', rain:[0,4,19.5] },
  { id:'G15006-0515', code:'G15006-0515', name:'โรงเรียนบ้านน้ำปาย', tambon:'น้ำปาย', amphoe:'แม่จริม', province:'น่าน', agency:'กรมทรัพยากรน้ำ', scope:'project', rain:[12,0,8] },
  { id:'G15006-2201', code:'G15006-2201', name:'หอประชุม ม.17', tambon:'ขุนซ่อง', amphoe:'แก่งหางแมว', province:'จันทบุรี', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[45,3,28] },
  { id:'G15006-2202', code:'G15006-2202', name:'เทศบาลตำบลบ่อเวฬุ ม.2', tambon:'บ่อเวฬุ', amphoe:'ขลุง', province:'จันทบุรี', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[null,12,31] },
  { id:'G15006-4001', code:'G15006-4001', name:'เทศบาลตำบลสะอาด', tambon:'สะอาด', amphoe:'น้ำพอง', province:'ขอนแก่น', agency:'กรมทรัพยากรน้ำ', scope:'project', rain:[2,0,0] },
  { id:'G15006-0821', code:'G15006-0821', name:'อบต.ปิงโค้ง', tambon:'ปิงโค้ง', amphoe:'เชียงดาว', province:'เชียงใหม่', agency:'กรมทรัพยากรน้ำ', scope:'project', rain:[4,12,7] },
  { id:'TMD-31378274', code:'31378274', name:'บ้านขุนห้วยแม่สอด', tambon:'แม่สอด', amphoe:'แม่สอด', province:'ตาก', agency:'กรมอุตุนิยมวิทยา', scope:'external', rain:[8,6,5.5] },
  { id:'TMD-313782681', code:'313782681', name:'ศาลากลางสมุทรปราการ', tambon:'ปากน้ำ', amphoe:'เมืองสมุทรปราการ', province:'สมุทรปราการ', agency:'กรมอุตุนิยมวิทยา', scope:'external', rain:[null,null,13.5] },
  { id:'RID-CN-004', code:'RID-CN-004', name:'สถานีคลองหอยโข่ง', tambon:'คลองหอยโข่ง', amphoe:'คลองหอยโข่ง', province:'สงขลา', agency:'กรมชลประทาน', scope:'external', rain:[45,3,28] },
  { id:'G15006-5514', code:'G15006-5514', name:'โรงเรียนบ้านวังเบน', tambon:'บ่อทอง', amphoe:'ทองแสนขัน', province:'อุตรดิตถ์', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[35.4,48.2,74.6] },
  { id:'G15006-5527', code:'G15006-5527', name:'องค์การบริหารส่วนตำบลเวียงทอง', tambon:'เวียงทอง', amphoe:'สูงเม่น', province:'แพร่', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[26.8,31.5,40.5] },
  { id:'G15006-5540', code:'G15006-5540', name:'โรงเรียนบ้านปง (วัฒนาวิทยาคาร)', tambon:'ต้าผามอก', amphoe:'ลอง', province:'แพร่', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[22,29,43] },
  { id:'G15006-5566', code:'G15006-5566', name:'องค์การบริหารส่วนตำบลบ่อเบี้ย', tambon:'บ่อเบี้ย', amphoe:'บ้านโคก', province:'อุตรดิตถ์', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[12.5,18,21] },
  { id:'G15006-5579', code:'G15006-5579', name:'โรงเรียนบ้านนาใหม่', tambon:'บ้านใหม่', amphoe:'เมืองอุบลราชธานี', province:'อุบลราชธานี', agency:'กรมป้องกันและบรรเทาสาธารณภัย', scope:'project', rain:[15,8.5,26] },
  { id:'RID-CR-011', code:'RID-CR-011', name:'สถานีฝายเชียงราย', tambon:'ริมกก', amphoe:'เมืองเชียงราย', province:'เชียงราย', agency:'กรมชลประทาน', scope:'external', rain:[18,22,44] },
  { id:'RID-AY-018', code:'RID-AY-018', name:'สถานีประตูระบายน้ำบางบาล', tambon:'บางบาล', amphoe:'บางบาล', province:'พระนครศรีอยุธยา', agency:'กรมชลประทาน', scope:'external', rain:[9.5,14,20] },
  { id:'RID-UB-027', code:'RID-UB-027', name:'สถานีวัดน้ำมูล', tambon:'ในเมือง', amphoe:'เมืองอุบลราชธานี', province:'อุบลราชธานี', agency:'กรมชลประทาน', scope:'external', rain:[30,16,33] },
  { id:'DWR-LP-102', code:'DWR-LP-102', name:'สถานีบ้านแม่ทะ', tambon:'แม่ทะ', amphoe:'แม่ทะ', province:'ลำปาง', agency:'กรมทรัพยากรน้ำ', scope:'project', rain:[7,11.5,24] },
  { id:'DWR-SK-205', code:'DWR-SK-205', name:'สถานีบ้านควนลัง', tambon:'ควนลัง', amphoe:'หาดใหญ่', province:'สงขลา', agency:'กรมทรัพยากรน้ำ', scope:'project', rain:[38,27,41] },
  { id:'TMD-48454', code:'48454', name:'สถานีอุตุนิยมวิทยานครสวรรค์', tambon:'ปากน้ำโพ', amphoe:'เมืองนครสวรรค์', province:'นครสวรรค์', agency:'กรมอุตุนิยมวิทยา', scope:'external', rain:[6,12,18.5] },
  { id:'TMD-48565', code:'48565', name:'สถานีอุตุนิยมวิทยาภูเก็ต', tambon:'ตลาดใหญ่', amphoe:'เมืองภูเก็ต', province:'ภูเก็ต', agency:'กรมอุตุนิยมวิทยา', scope:'external', rain:[51,36,29] },
]);

export const THAI_PROVINCES = Object.freeze([
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา','ชลบุรี','ชัยนาท','ชัยภูมิ','ชุมพร','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา','พะเยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','ภูเก็ต','มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย','หนองบัวลำภู','อ่างทอง','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี','เชียงราย','เชียงใหม่','เลย',
]);
// Prototype data intentionally covers only a subset of provinces per region.
const SAMPLE_PROVINCES = Object.freeze([
  'เชียงใหม่','เชียงราย','น่าน',
  'ขอนแก่น','นครราชสีมา','อุบลราชธานี',
  'กรุงเทพมหานคร','นครปฐม','สระบุรี',
  'กาญจนบุรี','เพชรบุรี',
  'ชลบุรี','จันทบุรี',
  'สงขลา','ภูเก็ต','สุราษฎร์ธานี',
]);

const SAMPLE_AGENCIES = Object.freeze([
  'กรมป้องกันและบรรเทาสาธารณภัย','กรมทรัพยากรน้ำ','กรมอุตุนิยมวิทยา','กรมชลประทาน',
]);
const SAMPLE_STATION_NAMES = Object.freeze([
  'เทศบาลตำบล','องค์การบริหารส่วนตำบล','โรงเรียนบ้าน','สถานีชลประทาน','สถานีอุตุนิยมวิทยา','ศูนย์ป้องกันและบรรเทาสาธารณภัย','สถานีทรัพยากรน้ำ','ที่ว่าการอำเภอ',
]);
const SAMPLE_TAMBONS = Object.freeze(['ในเมือง','เหนือ','กลาง','ทุ่ง','หนองน้ำ','ริมคลอง','บ้านใหม่','สวนหลวง']);

function provinceSeed(province){ return [...province].reduce((sum,char,index)=>sum+(char.codePointAt(0)*(index+1)),0); }
function makeSampleStations(){
  const existingCount = new Map();
  BASE_REPORT_STATIONS.forEach(station=>existingCount.set(station.province,(existingCount.get(station.province)||0)+1));
  return SAMPLE_PROVINCES.flatMap((province,provinceIndex)=>{
    const seed=provinceSeed(province);
    const target=3+(seed%8);
    const current=existingCount.get(province)||0;
    return Array.from({length:Math.max(0,target-current)},(_,offset)=>{
      const stationNumber=current+offset+1;
      const agency=SAMPLE_AGENCIES[(seed+stationNumber)%SAMPLE_AGENCIES.length];
      const namePrefix=SAMPLE_STATION_NAMES[(seed+stationNumber*3)%SAMPLE_STATION_NAMES.length];
      const tambon=SAMPLE_TAMBONS[(seed+stationNumber*5)%SAMPLE_TAMBONS.length];
      const code=`DEMO-${String(provinceIndex+1).padStart(2,'0')}-${String(stationNumber).padStart(2,'0')}`;
      const rain=[0,1,2].map(day=>Number((((seed%47)+(stationNumber*11)+(day*17))%96+((stationNumber+day)%10)/10).toFixed(1)));
      return {id:code,code,name:`${namePrefix}${province} ${String(stationNumber).padStart(2,'0')}`,tambon,amphoe:province==='กรุงเทพมหานคร'?'พระนคร':`เมือง${province}`,province,agency,scope:agency==='กรมป้องกันและบรรเทาสาธารณภัย'||agency==='กรมทรัพยากรน้ำ'?'project':'external',rain};
    });
  });
}

export const REPORT_STATIONS = Object.freeze([...BASE_REPORT_STATIONS,...makeSampleStations()]);

export function totalRainfall(values) { return values.some(value => value === null || value === undefined) ? null : values.reduce((sum, value) => sum + Number(value), 0); }
export function createReportRows(ids = REPORT_STATIONS.map(station => station.id)) { const selected = new Set(ids); return REPORT_STATIONS.filter(station => selected.has(station.id)).map(station => ({ ...station, active: station.active !== false, total: totalRainfall(station.rain) })); }
export function formatRainfall(value) { return value === null || value === undefined ? 'ไม่มีข้อมูล' : Number(value).toLocaleString('th-TH', { maximumFractionDigits: 1 }); }
export function isoToday() { return new Date().toISOString().slice(0, 10); }
export function stationScope(profile) { return createReportRows().filter((station) => (!profile?.agencyScope || profile.agencyScope === 'all' || station.agency === profile.agencyScope) && (!profile?.provinceScope || profile.provinceScope === 'all' || (profile.provinces || []).includes(station.province))); }
export function automaticSelection(profile) {
  const scoped = stationScope(profile);
  if (profile?.criteriaMode !== 'rain') return scoped.map(station => station.id);
  const threshold = Number(profile.minRain);
  const limit = profile.minimumEnabled ? Math.max(1, Number(profile.minRows) || 1) : 0;
  const ids = [];
  [...new Set(scoped.map(station => station.province))].forEach((province) => {
    const available = scoped.filter(station => station.province === province && station.total !== null).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'th'));
    const passing = available.filter(station => station.total >= threshold);
    ids.push(...(limit ? passing.slice(0,limit) : passing).map(station => station.id));
  });
  return [...new Set(ids)];
}
