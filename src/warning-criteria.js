import {reactive} from 'vue';
export const WARNING_KEY='ndwc.warning-ddpm.v1';
export const WARNING_PERIODS = {
  '1h':'ฝน 1 ชั่วโมง',
  today:'ฝนวันนี้ (07:00–ปัจจุบัน)',
  yesterday:'ฝนวานนี้ (07:00–07:00)',
  '24h':'ฝน 24 ชั่วโมง (ย้อนหลัง)',
  '72h':'ฝน 3 วัน',
};

// Older records used one daily window. Copy its bounds once when reading legacy data.
function separateDailyWindows(values) {
  if (!values || Object.hasOwn(values, 'yesterday') || !Array.isArray(values['24h'])) return values;
  return {...values, yesterday:[...values['24h']]};
}
const warningLevels = [
  {id:'ddpm-1',name:'ติดตาม',color:'#22c55e'},
  {id:'ddpm-2',name:'เฝ้าระวัง',color:'#38bdf8'},
  {id:'ddpm-3',name:'เตรียมรับมือ',color:'#facc15'},
  {id:'ddpm-4',name:'อพยพ',color:'#f97316'},
  {id:'ddpm-5',name:'ต้องอพยพ',color:'#ef4444'},
];
export function warningMaster(period='24h') {
  const periodData=globalThis.localStorage?.getItem('ndwc.rain-name-lists.v1');
  if (periodData) {
    const rows=JSON.parse(periodData)?.warning?.[period];
    if (!Array.isArray(rows)||rows.length<2||rows.some(row=>!row.id||!row.name||!/^#[0-9a-f]{6}$/i.test(row.color))) throw Error('รายการชื่อเกณฑ์ช่วงนี้ต้องมีอย่างน้อย 2 ระดับ พร้อมชื่อและสี');
    return rows.map(row=>({...row}));
  }
  const raw=globalThis.localStorage?.getItem('ddpm_masterdata_levelnames_split_v5');
  const rows=raw ? JSON.parse(raw)?.[0] : null;
  if (!rows || rows.length===6 && rows.every(row=>row.name?.startsWith('ฝน'))) {
    return warningLevels.map(level=>({...level}));
  }
  if (!Array.isArray(rows) || rows.length<2 || rows.some(row=>!row.id || !row.name || !/^#[0-9a-f]{6}$/i.test(row.color))) {
    throw Error('ข้อมูล Master ชื่อและสีเกณฑ์น้ำฝนไม่พร้อมใช้งาน');
  }
  const ordered = [...rows].reverse();
  const previousColors = ['#86efac','#facc15','#fb923c','#ef4444','#a855f7'];
  if (ordered.length===5 && ordered.every((level,index)=>
    level.name===warningLevels[index].name && level.color.toLowerCase()===previousColors[index])) {
    return ordered.map((level,index)=>({...level,color:warningLevels[index].color}));
  }
  return ordered;
}

let stored;try{stored=JSON.parse(globalThis.localStorage?.getItem(WARNING_KEY)||'null')}catch{stored={error:true}}
export const warningSettings=reactive(stored||{stations:{}});
export const warningCustom=code=>!!warningSettings.stations?.[code];
// Explicit demonstration central data, separate from ThaiWater intensity rules.
export function warningDefault(levels) {
  const base=[10,20,35,90];
  return Object.fromEntries(Object.keys(WARNING_PERIODS).map(period=>{
    const count=warningMaster(period).length;
    return [period,Array.from({length:count-1},(_,i)=>{
      const value=base[i];
      return value==null ? null : Number((value*(period==='1h'?0.4:period==='72h'?3:1)).toFixed(2));
    })];
  }));
}

export function validWarning(values,count) {
  return Object.keys(WARNING_PERIODS).every(period=>{
    const cuts=values?.[period];
    let expected=count;
    try {
      if(globalThis.localStorage?.getItem('ndwc.rain-name-lists.v1')) expected=warningMaster(period).length;
    } catch {
      return false;
    }
    return Array.isArray(cuts)&&cuts.length===expected-1&&cuts.every((value,index)=>
      typeof value==='number'&&Number.isFinite(value)&&value>0&&(!index||value>cuts[index-1]));
  });
}

export function activeWarning(code,levels,options={}) {
  if(warningSettings.error)throw Error('โหลดข้อมูลเกณฑ์ไม่สำเร็จ');
  const own=warningSettings.stations?.[code];
  const source=separateDailyWindows(own?.values||warningSettings.central||warningDefault(levels));
  const values={};
  for(const period of Object.keys(WARNING_PERIODS)){
    const names=warningMaster(period);
    let cuts=source[period]||[];
    let ids=own?.idsByPeriod?.[period]||own?.ids||warningSettings.centralIds?.[period];
    const legacy=own ? !own.idsByPeriod&&own.ids?.length===6 : !warningSettings.centralIds;
    if(cuts.length===5&&names.length===5&&legacy){
      cuts=cuts.slice(1);
      ids=null;
    }
    if(ids&&ids.join('|')!==names.map(level=>level.id).join('|')){
      values[period]=names.slice(0,-1).map(level=>{
        const index=ids.indexOf(level.id);
        return index>=0&&index<cuts.length ? cuts[index] : null;
      });
    }else{
      values[period]=names.slice(0,-1).map((_,index)=>cuts[index]??null);
    }
  }
  if(!options.draft && !validWarning(values,levels.length))throw Error('จำนวนระดับหรือช่วงค่าเปลี่ยน กรุณากำหนดขอบช่วงให้ครบ');
  return values;
}

function warningIdsByPeriod(){
  return Object.fromEntries(Object.keys(WARNING_PERIODS).map(period=>[period,warningMaster(period).map(level=>level.id)]));
}

export function saveWarning(code,values,levels,allowed=true) {
  if(!allowed)throw Error('ไม่มีสิทธิ์จัดการเกณฑ์');
  if(!code||!validWarning(values,levels.length))throw Error('กรุณากำหนดขอบช่วงให้ครบและเรียงจากน้อยไปมากทุกช่วง');
  const next=JSON.parse(JSON.stringify(warningSettings));
  next.stations[code]={ids:levels.map(level=>level.id),idsByPeriod:warningIdsByPeriod(),values};
  persistSettings(next);
}

export function resetWarning(code,allowed=true){if(!allowed)throw Error('ไม่มีสิทธิ์จัดการเกณฑ์');const next=JSON.parse(JSON.stringify(warningSettings));delete next.stations[code];globalThis.localStorage?.setItem(WARNING_KEY,JSON.stringify(next));Object.assign(warningSettings,next);}
export function evaluateWarning(code,period,value,levels){if(!Number.isFinite(value)||value<0)return {available:false};const cuts=activeWarning(code,levels)[period];if(!cuts)return {available:false};const index=cuts.findIndex(c=>value<=c);return {available:true,criteria:'Warning DDPM',level:warningMaster(period)[index<0?warningMaster(period).length-1:index],source:warningCustom(code)?'Custom':'Default'};}

function persistSettings(next) {
  globalThis.localStorage?.setItem(WARNING_KEY, JSON.stringify(next));
  Object.assign(warningSettings, next);
}

export function saveCentralWarning(values, levels) {
  if (warningSettings.error || !validWarning(values, levels.length)) {
    throw Error('กรุณาตรวจสอบขอบช่วงทุกระดับก่อนบันทึก');
  }
  persistSettings({...warningSettings, central: JSON.parse(JSON.stringify(values)), centralIds:warningIdsByPeriod()});
}

export function seedWarningExamples(stations) {
  if (warningSettings.error || warningSettings.examplesInitialized) return;
  try {
    const levels = warningMaster();
    const next = JSON.parse(JSON.stringify(warningSettings));
    const candidates = stations.filter(s => !next.stations[s.code]);
    // Preserve the previous session's reviewed station and existing custom values.
    const eligible = candidates.filter(s => s.code !== 'G15006-5501');
    for (const factor of [0.75, 1.2, 1.5]) {
      if (eligible.length < 2) break;
      const index = Math.floor(Math.random() * eligible.length);
      const [station] = eligible.splice(index, 1);
      const base = activeWarning('', levels);
      const values = Object.fromEntries(Object.entries(base).map(([period, cuts]) =>
        [period, cuts.map(value => Number((value * factor).toPrecision(12)))]));
      if (validWarning(values, levels.length)) next.stations[station.code] = {ids:levels.map(l => l.id), values};
    }
    next.examplesInitialized = true;
    persistSettings(next);
  } catch { /* Keep the existing configuration if demo data cannot be saved. */ }
}

export const measurements = ["ปริมาณฝนสะสม", "อุณหภูมิอากาศ", "ความชื้นสัมพัทธ์", "ความเร็วลม", "ทิศทางลม", "ความกดอากาศ", "ก๊าซคาร์บอนไดออกไซด์", "ฝุ่นละออง PM2.5", "ฝุ่นละออง PM10"];
const masterDefaults = [
  [
    [
      "ฝนหนักมาก",
      "#ef4444"
    ],
    [
      "ฝนหนัก",
      "#f97316"
    ],
    [
      "ฝนหนัก",
      "#facc15"
    ],
    [
      "ฝนปานกลาง",
      "#86efac"
    ],
    [
      "ฝนเล็กน้อย",
      "#93c5fd"
    ],
    [
      "ฝนละออง",
      "#78d1e3"
    ]
  ],
  [
    [
      "ร้อนจัด",
      "#f43f5e"
    ],
    [
      "ร้อน",
      "#fb923c"
    ],
    [
      "อุ่น",
      "#facc15"
    ],
    [
      "ปกติ",
      "#86d65b"
    ],
    [
      "เย็น",
      "#93c5fd"
    ]
  ],
  [
    [
      "อิ่มตัว",
      "#1d4ed8"
    ],
    [
      "ชื้นมาก",
      "#60a5fa"
    ],
    [
      "ปกติ",
      "#86d65b"
    ],
    [
      "แห้ง",
      "#facc15"
    ],
    [
      "แห้งมาก",
      "#fb923c"
    ]
  ],
  [
    [
      "พายุ",
      "#f43f5e"
    ],
    [
      "ลมแรง",
      "#fb923c"
    ],
    [
      "ปานกลาง",
      "#facc15"
    ],
    [
      "ลมเบา",
      "#86d65b"
    ],
    [
      "ลมสงบ",
      "#93c5fd"
    ]
  ],
  [
    [
      "เหนือ (N)",
      "#60a5fa"
    ],
    [
      "ตะวันออกเฉียงเหนือ (NE)",
      "#22d3ee"
    ],
    [
      "ตะวันออก (E)",
      "#6ee7b7"
    ],
    [
      "ตะวันออกเฉียงใต้ (SE)",
      "#a3e635"
    ],
    [
      "ใต้ (S)",
      "#facc15"
    ],
    [
      "ตะวันตกเฉียงใต้ (SW)",
      "#fb923c"
    ],
    [
      "ตะวันตก (W)",
      "#f472b6"
    ],
    [
      "ตะวันตกเฉียงเหนือ (NW)",
      "#c084fc"
    ]
  ],
  [
    [
      "ต่ำมาก (พายุ)",
      "#f43f5e"
    ],
    [
      "ต่ำ",
      "#fb923c"
    ],
    [
      "ปกติ",
      "#86d65b"
    ],
    [
      "สูง",
      "#60a5fa"
    ]
  ],
  [
    [
      "สูงมาก",
      "#f43f5e"
    ],
    [
      "สูง",
      "#fb923c"
    ],
    [
      "ปานกลาง",
      "#facc15"
    ],
    [
      "ดี",
      "#86d65b"
    ]
  ],
  [
    [
      "มีผลกระทบต่อสุขภาพ",
      "#f43f5e"
    ],
    [
      "เริ่มมีผลกระทบ",
      "#fb923c"
    ],
    [
      "ปานกลาง",
      "#facc15"
    ],
    [
      "ดี",
      "#86d65b"
    ],
    [
      "ดีมาก",
      "#60a5fa"
    ]
  ],
  [
    [
      "มีผลกระทบต่อสุขภาพ",
      "#f43f5e"
    ],
    [
      "เริ่มมีผลกระทบ",
      "#fb923c"
    ],
    [
      "ปานกลาง",
      "#facc15"
    ],
    [
      "ดี",
      "#86d65b"
    ],
    [
      "ดีมาก",
      "#60a5fa"
    ]
  ]
];

export function measurementLevels(type) {
  const raw = globalThis.localStorage?.getItem('ddpm_masterdata_levelnames_split_v5');
  const saved = raw ? JSON.parse(raw)?.[type] : null;
  const rows = saved ?? masterDefaults[type]?.map(([name,color],index) => ({id:type+'-'+index,name,color}));
  if (!Array.isArray(rows) || rows.length < 2 || rows.some(row => !row.name || !row.color)) {
    throw Error('โหลดชื่อและสีจาก Master ไม่สำเร็จ');
  }
  // Directions and pressure are already listed in increasing numeric order.
  return [4,5].includes(type) ? [...rows] : [...rows].reverse();
}
export function customMeasurements(code) {
  const names = warningCustom(code) ? [measurements[0]] : [];
  for (let type = 1; type < measurements.length; type++) {
    if (hasMeasurementCustom(type,code)) names.push(measurements[type]);
  }
  return names;
}
export function temperatureCuts(code) {
  const record = warningSettings.temperature?.stations?.[code] ?? warningSettings.temperature?.central;
  return record?.cuts ?? record ?? [25,30,35,40];
}
export function writeTemperature(code,cuts) {
  if (cuts && (cuts.length!==4 || !cuts.every((v,i)=>Number.isFinite(v)&&(!i||v>cuts[i-1])))) throw Error('ตรวจสอบขอบช่วงอุณหภูมิ');
  const config = JSON.parse(JSON.stringify(warningSettings.temperature ?? {stations:{}}));
  if (!code) config.central = [...cuts];
  else if (cuts) config.stations[code] = [...cuts];
  else delete config.stations[code];
  persistSettings({...warningSettings,temperature:config});
}

export const measurementUnits = ['มม.','°C','%','ม./วินาที','องศา','hPa','ppm','µg/m³','µg/m³'];
const exampleCuts = {
  1:[25,30,35,40], 2:[30,50,70,90], 3:[1,5,10,20],
  4:[45,90,135,180,225,270,315], 5:[980,1000,1020],
  6:[600,1000,1500], 7:[15,25,37.5,75], 8:[50,80,120,180],
};

export function hasMeasurementCustom(type,code) {
  if (type === 1) return !!warningSettings.temperature?.stations?.[code];
  return !!warningSettings.measurementRules?.[type]?.stations?.[code];
}

function validMeasurementCuts(type,cuts,count) {
  return Array.isArray(cuts) && cuts.length === count-1 &&
    cuts.every((value,index) => typeof value==='number' && Number.isFinite(value) &&
      (type===1 || value>0) && (!index || value>cuts[index-1]) &&
      (type!==2 || value<100) && (type!==4 || value<360));
}

export function activeMeasurement(type,code,levels) {
  if (!exampleCuts[type]) throw Error('ไม่พบประเภทการตรวจวัด');
  const rules = type===1 ? warningSettings.temperature : warningSettings.measurementRules?.[type];
  const record = rules?.stations?.[code] ?? rules?.central;
  const cuts = record?.cuts ?? record ?? exampleCuts[type];
  if (record?.ids && record.ids.join('|') !== levels.map(level=>level.id).join('|')) {
    throw Error('ชื่อระดับจาก Master เปลี่ยนแปลง กรุณาตรวจสอบการจับคู่เกณฑ์');
  }
  if (!validMeasurementCuts(type,cuts,levels.length)) throw Error('ช่วงค่าของประเภทนี้ไม่ครบหรือไม่ถูกต้อง');
  return [...cuts];
}

export function saveMeasurement(type,code,cuts,levels,allowed=true) {
  if (!allowed) throw Error('ไม่มีสิทธิ์แก้ไขเกณฑ์');
  if (!exampleCuts[type]) throw Error('ไม่พบประเภทการตรวจวัด');
  if (cuts && !validMeasurementCuts(type,cuts,levels.length)) throw Error('กรอกขอบช่วงให้ครบและเรียงจากน้อยไปมาก');
  if (!code && !cuts) throw Error('ต้องระบุค่าเกณฑ์กลาง');
  const next = JSON.parse(JSON.stringify(warningSettings));
  const key = type===1 ? 'temperature' : 'measurementRules';
  if (type===1) next.temperature ??= {stations:{}};
  else {next.measurementRules ??= {}; next.measurementRules[type] ??= {stations:{}};}
  const rules = type===1 ? next[key] : next[key][type];
  rules.stations ??= {};
  const record = cuts ? {cuts:[...cuts],ids:levels.map(level=>level.id)} : null;
  if (!code) rules.central=record;
  else if (record) rules.stations[code]=record;
  else delete rules.stations[code];
  persistSettings(next);
}
