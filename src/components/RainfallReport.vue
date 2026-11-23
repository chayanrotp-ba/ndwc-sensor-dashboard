<script setup>
import { computed, ref } from 'vue';
import ExcelJS from 'exceljs';
import { REPORT_STATIONS, THAI_PROVINCES, automaticSelection, createReportRows, isoToday, stationScope } from '../rainfall-report.js';
import RainfallReportTable from './RainfallReportTable.vue';

const props = defineProps({ theme:{type:String,default:'dark'} });

const STORE = 'ndwc.sensor.rainfall-report-profiles.v2';
const today = isoToday();
const screen = ref('overview');
const profiles = ref(loadProfiles());
const filterAgency = ref('all');
const query = ref('');
const activeProfile = ref(null);
const appliedProfile = ref(null);
const reviewIds = ref([]);
const automaticIds = ref([]);
const reviewQuery = ref('');
const inclusion = ref('all');
const referenceDate = ref(today);
const notice = ref('');
const deleting = ref(null);
const previewRows = ref([]);
const previewLoadedAt = ref('');
const previewQuery = ref('');
const previewSort = ref('total-desc');
const exportColumns = ref(['code','name','agency','tambon','amphoe','province','rain0','rain1','rain2','total']);

const EXPORT_COLUMN_DEFINITIONS = Object.freeze([
  { key:'code', label:'รหัสสถานี', width:16 },
  { key:'name', label:'ชื่อสถานี', width:34 },
  { key:'agency', label:'หน่วยงาน', width:32 },
  { key:'tambon', label:'ตำบล', width:18 },
  { key:'amphoe', label:'อำเภอ', width:20 },
  { key:'province', label:'จังหวัด', width:18 },
  { key:'rain0', label:'ฝนวันที่ 1', width:14 },
  { key:'rain1', label:'ฝนวันที่ 2', width:14 },
  { key:'rain2', label:'ฝนวันที่ 3', width:14 },
  { key:'total', label:'ฝนสะสม 3 วัน', width:18 },
]);

const REGION_DEFINITIONS = Object.freeze([
  { name:'ภาคเหนือ', provinces:['เชียงใหม่','เชียงราย','ลำพูน','ลำปาง','แม่ฮ่องสอน','น่าน','พะเยา','แพร่','อุตรดิตถ์','พิษณุโลก','พิจิตร','เพชรบูรณ์','สุโขทัย','ตาก','กำแพงเพชร','นครสวรรค์','อุทัยธานี'] },
  { name:'ภาคตะวันออกเฉียงเหนือ', provinces:['กาฬสินธุ์','ขอนแก่น','ชัยภูมิ','นครพนม','นครราชสีมา','บึงกาฬ','บุรีรัมย์','มหาสารคาม','มุกดาหาร','ยโสธร','ร้อยเอ็ด','เลย','ศรีสะเกษ','สกลนคร','สุรินทร์','หนองคาย','หนองบัวลำภู','อำนาจเจริญ','อุดรธานี','อุบลราชธานี'] },
  { name:'ภาคกลาง', provinces:['กรุงเทพมหานคร','อ่างทอง','ชัยนาท','ลพบุรี','สิงห์บุรี','สระบุรี','สุพรรณบุรี','พระนครศรีอยุธยา','ปทุมธานี','นนทบุรี','สมุทรปราการ','สมุทรสาคร','สมุทรสงคราม','นครปฐม','นครนายก'] },
  { name:'ภาคตะวันตก', provinces:['กาญจนบุรี','ราชบุรี','เพชรบุรี','ประจวบคีรีขันธ์'] },
  { name:'ภาคตะวันออก', provinces:['ฉะเชิงเทรา','ชลบุรี','ระยอง','จันทบุรี','ตราด','ปราจีนบุรี','สระแก้ว'] },
  { name:'ภาคใต้', provinces:['กระบี่','ชุมพร','ตรัง','นครศรีธรรมราช','นราธิวาส','ปัตตานี','พังงา','พัทลุง','ภูเก็ต','ยะลา','ระนอง','สงขลา','สตูล','สุราษฎร์ธานี'] },
]);

const agencies = computed(() => [...new Set(REPORT_STATIONS.map(station => station.agency))]);
const provinces = computed(() => [...THAI_PROVINCES]);
const tableProvinceNames = computed(() => {
  let rows=[];
  if(screen.value==='form') rows=stationScope({...form.value,provinceScope:'all',provinces:[]});
  else if(screen.value==='review' && activeProfile.value) {
    const profile={...activeProfile.value,provinceScope:'all',provinces:[]};
    rows=automaticSelection(profile).map(id=>REPORT_STATIONS.find(station=>station.id===id)).filter(Boolean);
  } else rows=REPORT_STATIONS;
  return [...new Set(rows.map(row=>row.province))];
});
const provinceRegions = computed(() => {
  const available=new Set(provinces.value);
  return REGION_DEFINITIONS.map(region=>({...region,provinces:region.provinces.filter(province=>available.has(province))})).filter(region=>region.provinces.length);
});
const filteredProfiles = computed(() => {
  const needle=query.value.trim().toLocaleLowerCase('th-TH');
  return profiles.value.filter((profile) =>
    (filterAgency.value === 'all' || profile.agencyScope === 'all' || profile.agencyScope === filterAgency.value) &&
    (!needle || [profile.name, profile.agencyScope === 'all' ? 'ทุกหน่วยงาน' : profile.agencyScope, profile.provinceScope === 'all' ? 'ทุกจังหวัด' : profile.provinces.join(' ')].join(' ').toLocaleLowerCase('th-TH').includes(needle))
  );
});
const scopeRows = computed(() => appliedProfile.value ? stationScope(appliedProfile.value) : []);
const criteriaRows = computed(() => {
  const accepted=new Set(automaticIds.value);
  return scopeRows.value.filter(row=>accepted.has(row.id));
});
const reviewRows = computed(() => {
  const needle=reviewQuery.value.trim().toLocaleLowerCase('th-TH');
  const selected=new Set(reviewIds.value);
  return criteriaRows.value.filter((row) =>
    (inclusion.value === 'all' || (inclusion.value === 'included' ? selected.has(row.id) : !selected.has(row.id))) &&
    (!needle || [row.code,row.name,row.agency,row.tambon,row.amphoe,row.province].join(' ').toLocaleLowerCase('th-TH').includes(needle))
  );
});
const selectedRows = computed(() => criteriaRows.value.filter(row => reviewIds.value.includes(row.id)));
const formSelectedProvinceSummary = computed(() => provinceSummary(stationScope(form.value), form.value.provinces));
const reviewSelectedProvinceSummary = computed(() => provinceSummary(criteriaRows.value, activeProfile.value?.provinces || []));
const visibleColumnDefinitions = computed(() => EXPORT_COLUMN_DEFINITIONS.filter(column => exportColumns.value.includes(column.key)));
const previewTableRows = computed(() => {
  const needle=previewQuery.value.trim().toLocaleLowerCase('th-TH');
  const rows=previewRows.value.filter(row => !needle || [row.code,row.name,row.agency,row.tambon,row.amphoe,row.province].join(' ').toLocaleLowerCase('th-TH').includes(needle));
  return [...rows].sort((a,b) => {
    if(previewSort.value==='province') return a.province.localeCompare(b.province,'th') || a.name.localeCompare(b.name,'th');
    if(previewSort.value==='name') return a.name.localeCompare(b.name,'th');
    const aTotal=previewTotal(a) ?? -1, bTotal=previewTotal(b) ?? -1;
    return previewSort.value==='total-asc' ? aTotal-bTotal : bTotal-aTotal;
  });
});

function baseProfile(){ return { id:'', name:'', agencyScope:'all', provinceScope:'all', provinces:[], criteriaMode:'all', minRain:40, minimumEnabled:false, minRows:4 }; }
function provinceSummary(rows, selectedProvinces=[]){
  const counts=new Map();
  rows.forEach(row=>counts.set(row.province,(counts.get(row.province)||0)+1));
  return selectedProvinces.map(province=>({province,count:counts.get(province)||0}));
}
const form = ref(baseProfile());
function seedProfiles(){ return [
  { id:'report-all', name:'รายงานปริมาณน้ำฝนรวมทุกหน่วยงาน', agencyScope:'all', provinceScope:'all', provinces:[], criteriaMode:'rain', minRain:40, minimumEnabled:true, minRows:4 },
  { id:'report-ddpm', name:'รายงานปริมาณน้ำฝน ปภ.', agencyScope:'กรมป้องกันและบรรเทาสาธารณภัย', provinceScope:'all', provinces:[], criteriaMode:'all', minRain:40, minimumEnabled:false, minRows:4 },
  { id:'report-rid', name:'รายงานปริมาณน้ำฝน กรมทรัพยากรน้ำ', agencyScope:'กรมทรัพยากรน้ำ', provinceScope:'all', provinces:[], criteriaMode:'all', minRain:40, minimumEnabled:false, minRows:4 },
]; }
function normalizeProfile(profile={}){
  const {type:_unusedType,...profileData}=profile;
  const provinces=Array.isArray(profile.provinces) ? profile.provinces : [];
  const legacyAgency=Array.isArray(profile.agencies) && profile.agencies.length===1 ? profile.agencies[0] : 'all';
  const minRain=Number(profile.minRain), minRows=Number(profile.minRows);
  return {...baseProfile(),...profileData,agencyScope:profile.agencyScope || legacyAgency,provinceScope:profile.provinceScope || (provinces.length ? 'selected' : 'all'),provinces,criteriaMode:profile.criteriaMode || 'all',minRain:Number.isFinite(minRain) ? minRain : 40,minimumEnabled:Boolean(profile.minimumEnabled),minRows:Number.isFinite(minRows) && minRows>0 ? minRows : 4};
}
function loadProfiles(){ try { const value=JSON.parse(localStorage.getItem(STORE)); return Array.isArray(value) && value.length ? value.map(normalizeProfile) : seedProfiles(); } catch { return seedProfiles(); } }
function persist(){ try { localStorage.setItem(STORE, JSON.stringify(profiles.value)); return true; } catch { notice.value='บันทึกรูปแบบรายงานไม่สำเร็จในเบราว์เซอร์นี้'; return false; } }
function scopeLabel(profile){ return `${profile.agencyScope === 'all' ? 'ทุกหน่วยงาน' : profile.agencyScope} · ${profile.provinceScope === 'all' ? 'ทุกจังหวัด' : profile.provinces.join(', ')}`; }
function openCreate(){ form.value=baseProfile(); screen.value='form'; }
function openEdit(profile){ form.value={...normalizeProfile(profile),provinces:[...(profile.provinces || [])]}; screen.value='form'; }
function saveProfile(){
  if(!form.value.name.trim()){ notice.value='กรุณาระบุชื่อรายงาน'; return; }
  if(form.value.provinceScope === 'selected' && !form.value.provinces.length){ notice.value='กรุณาเลือกจังหวัดอย่างน้อย 1 จังหวัด'; return; }
  if(form.value.criteriaMode === 'rain' && (!Number.isFinite(Number(form.value.minRain)) || Number(form.value.minRain) < 0)){ notice.value='กรุณาระบุฝนสะสม 3 วันขั้นต่ำเป็นตัวเลขตั้งแต่ 0 มม.'; return; }
  if(form.value.criteriaMode === 'rain' && form.value.minimumEnabled && (!Number.isInteger(Number(form.value.minRows)) || Number(form.value.minRows) < 1)){ notice.value='จำนวนสถานีที่แสดงต่อจังหวัดต้องเป็นจำนวนเต็มตั้งแต่ 1'; return; }
  const profile={...(profiles.value.find(item=>item.id===form.value.id) || {}),...form.value,id:form.value.id || `rain-${Date.now()}`,name:form.value.name.trim(),minRain:Number(form.value.minRain),minRows:Number(form.value.minRows)};
  const index=profiles.value.findIndex(item=>item.id===profile.id);
  if(index >= 0) profiles.value.splice(index,1,profile); else profiles.value.unshift(profile);
  if(!persist()) return;
  openReview(profile);
  notice.value=index >= 0 ? 'บันทึกการตั้งค่าแล้ว พร้อมเตรียมข้อมูลสำหรับออกรายงาน' : 'บันทึกรูปแบบแล้ว พร้อมเตรียมข้อมูลสำหรับออกรายงาน';
}
function openReview(profile){ activeProfile.value={...normalizeProfile(profile),provinces:[...(profile.provinces || [])]}; appliedProfile.value={...activeProfile.value,provinces:[...activeProfile.value.provinces]}; const selected=automaticSelection(appliedProfile.value); automaticIds.value=[...selected]; const selectedSet=new Set(selected); reviewIds.value=Array.isArray(profile.savedStationIds) ? profile.savedStationIds.filter(id=>selectedSet.has(id)) : [...selected]; reviewQuery.value=''; inclusion.value='all'; screen.value='review'; }
function toggleStation(id){ const next=new Set(reviewIds.value); next.has(id) ? next.delete(id) : next.add(id); reviewIds.value=[...next]; }
function saveReviewSelection(){
  const index=profiles.value.findIndex(item=>item.id===activeProfile.value?.id);
  if(index<0){ notice.value='ไม่พบรูปแบบรายงาน กรุณาบันทึกรูปแบบก่อน'; return; }
  const profile={...profiles.value[index],...normalizeProfile(activeProfile.value),name:activeProfile.value.name.trim() || profiles.value[index].name,provinces:[...(activeProfile.value.provinces || [])],savedStationIds:[...reviewIds.value]};
  profiles.value.splice(index,1,profile);
  activeProfile.value={...profile,provinces:[...profile.provinces]};
  if(!persist()) return;
  notice.value=`บันทึกสถานีที่เลือก ${reviewIds.value.length} สถานีแล้ว`;
}
function applyCriteria(){
  if(activeProfile.value.provinceScope==='selected'&&!activeProfile.value.provinces.length){ notice.value='กรุณาเลือกจังหวัดอย่างน้อย 1 จังหวัด'; return; }
  if(activeProfile.value.criteriaMode==='rain'&&(!Number.isFinite(Number(activeProfile.value.minRain))||Number(activeProfile.value.minRain)<0)){ notice.value='กรุณาระบุฝนสะสม 3 วันขั้นต่ำเป็นตัวเลขตั้งแต่ 0 มม.'; return; }
  if(activeProfile.value.criteriaMode==='rain'&&activeProfile.value.minimumEnabled&&(!Number.isInteger(Number(activeProfile.value.minRows))||Number(activeProfile.value.minRows)<1)){ notice.value='จำนวนสถานีที่แสดงต่อจังหวัดต้องเป็นจำนวนเต็มตั้งแต่ 1'; return; }
  appliedProfile.value={...normalizeProfile(activeProfile.value),provinces:[...activeProfile.value.provinces]};
  const selected=automaticSelection(appliedProfile.value); automaticIds.value=[...selected]; reviewIds.value=[...selected]; reviewQuery.value=''; inclusion.value='all'; notice.value=`อัปเดตข้อมูลแล้ว แสดง ${selected.length} สถานีตามเงื่อนไขที่กำหนด`;
}
function resetSelection(){ reviewIds.value=[...automaticIds.value]; notice.value='คืนค่ารายการตามผลประมวลผลล่าสุดแล้ว'; }
function previewTotal(row){ return row.rain.some(value=>value===null||value===undefined||value==='') ? null : row.rain.reduce((sum,value)=>sum+(Number(value)||0),0); }
function columnLabel(key){
  if(key==='rain0') return dateLabel(-2);
  if(key==='rain1') return dateLabel(-1);
  if(key==='rain2') return dateLabel(0);
  return EXPORT_COLUMN_DEFINITIONS.find(column=>column.key===key)?.label || key;
}
function columnValue(row,key){
  if(key==='rain0') return row.rain[0];
  if(key==='rain1') return row.rain[1];
  if(key==='rain2') return row.rain[2];
  if(key==='total') return previewTotal(row);
  return row[key];
}
function setColumnValue(row,key,value){
  const rainIndex={rain0:0,rain1:1,rain2:2}[key];
  if(rainIndex !== undefined) row.rain[rainIndex]=value==='' ? '' : Number(value);
  else if(key!=='total') row[key]=value;
}
function loadPreviewData(message=true){
  previewRows.value=selectedRows.value.map(row=>({...row,rain:[...row.rain]}));
  previewQuery.value=''; previewSort.value='total-desc';
  previewLoadedAt.value=new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short'}).format(new Date());
  if(message) notice.value=`โหลดข้อมูลล่าสุด ${previewRows.value.length} สถานี สำหรับตรวจสอบรายงานแล้ว`;
}
function openPreview(){ if(!reviewIds.value.length){notice.value='กรุณาเลือกสถานีอย่างน้อย 1 สถานีก่อนดูตัวอย่าง Excel'; return;} loadPreviewData(false); screen.value='preview'; }
async function exportExcel(){
  if(!previewRows.value.length){ notice.value='ไม่พบข้อมูลสำหรับออกรายงาน'; return; }
  const columns=visibleColumnDefinitions.value;
  if(!columns.length){ notice.value='กรุณาเลือกคอลัมน์อย่างน้อย 1 รายการสำหรับ Excel'; return; }
  const headers=columns.map(column=>columnLabel(column.key));
  const workbook=new ExcelJS.Workbook(); const sheet=workbook.addWorksheet('รายงานปริมาณน้ำฝน',{views:[{state:'frozen',ySplit:4}]});
  sheet.mergeCells(1,1,1,columns.length); sheet.getCell('A1').value=activeProfile.value.name; sheet.getCell('A1').font={bold:true,size:16}; sheet.getCell('A1').alignment={horizontal:'center'};
  sheet.mergeCells(2,1,2,columns.length); sheet.getCell('A2').value=`ข้อมูล ณ ${dateLabel(0)} · ${previewRows.value.length} สถานี`; sheet.getCell('A2').alignment={horizontal:'center'};
  sheet.addRow([]); const header=sheet.addRow(headers); header.eachCell(cell=>{cell.font={bold:true,color:{argb:'FF111827'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFFF00'}};cell.alignment={horizontal:'center'};cell.border={top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}};});
  previewRows.value.forEach(row=>sheet.addRow(columns.map(column=>columnValue(row,column.key))));
  sheet.columns.forEach((column,index)=>{column.width=columns[index].width;});
  sheet.eachRow((row,rowNumber)=>{if(rowNumber>4) row.eachCell(cell=>{cell.border={bottom:{style:'hair',color:{argb:'FFD1D5DB'}}};});});
  const buffer=await workbook.xlsx.writeBuffer(); const blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download=`${activeProfile.value.name.replace(/[\\/:*?"<>|]/g,'_')}.xlsx`; link.click(); URL.revokeObjectURL(url);
  notice.value=`ออกรายงาน Excel ${previewRows.value.length} สถานีจากข้อมูลที่ตรวจสอบแล้ว`;
}
function canvasText(ctx,text,x,y,maxWidth,align='left'){
  ctx.save(); ctx.beginPath(); ctx.rect(align==='right'?x-maxWidth:x,y-22,maxWidth,30); ctx.clip(); ctx.textAlign=align; ctx.fillText(String(text ?? ''),x,y,maxWidth); ctx.restore();
}
function pdfPageJpeg(rows,columns,pageIndex,pageCount){
  const width=1684,height=1190,margin=64,tableWidth=width-margin*2,headerTop=184,rowHeight=24,headerHeight=42;
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,width,height);
  ctx.fillStyle='#172033'; ctx.textAlign='left'; ctx.font='700 36px Sarabun, "Leelawadee UI", Tahoma, sans-serif';
  ctx.fillText(activeProfile.value.name,margin,66);
  ctx.fillStyle='#475569'; ctx.font='400 21px Sarabun, "Leelawadee UI", Tahoma, sans-serif';
  ctx.fillText(`ข้อมูล ณ ${dateLabel(0)} · ${previewRows.value.length} สถานี`,margin,104);
  ctx.fillStyle='#64748b'; ctx.font='400 17px Sarabun, "Leelawadee UI", Tahoma, sans-serif';
  ctx.fillText(`ฝนสะสม 3 วัน · หน้า ${pageIndex+1}/${pageCount}`,margin,137);
  const totalWeight=columns.reduce((sum,column)=>sum+column.width,0)||1;
  const widths=columns.map(column=>tableWidth*column.width/totalWeight);
  let x=margin;
  columns.forEach((column,index)=>{
    ctx.fillStyle='#ffdf00'; ctx.fillRect(x,headerTop,widths[index],headerHeight);
    ctx.strokeStyle='#cbd5e1'; ctx.lineWidth=1; ctx.strokeRect(x,headerTop,widths[index],headerHeight);
    ctx.fillStyle='#111827'; ctx.font='700 17px Sarabun, "Leelawadee UI", Tahoma, sans-serif';
    canvasText(ctx,columnLabel(column.key),x+9,headerTop+27,widths[index]-18);
    x+=widths[index];
  });
  rows.forEach((row,rowIndex)=>{
    const y=headerTop+headerHeight+rowIndex*rowHeight;
    ctx.fillStyle=rowIndex%2?'#f8fafc':'#fff'; ctx.fillRect(margin,y,tableWidth,rowHeight);
    let cellX=margin;
    columns.forEach((column,index)=>{
      ctx.strokeStyle='#dbe3ee'; ctx.lineWidth=1; ctx.strokeRect(cellX,y,widths[index],rowHeight);
      ctx.fillStyle='#172033'; ctx.font=column.key==='total'?'700 16px Sarabun, "Leelawadee UI", Tahoma, sans-serif':'400 16px Sarabun, "Leelawadee UI", Tahoma, sans-serif';
      const value=columnValue(row,column.key),text=value===null||value===undefined||value===''?'—':String(value),numeric=column.key.startsWith('rain')||column.key==='total',inset=9;
      canvasText(ctx,text,numeric?cellX+widths[index]-inset:cellX+inset,y+17,widths[index]-inset*2,numeric?'right':'left');
      cellX+=widths[index];
    });
  });
  ctx.fillStyle='#64748b'; ctx.font='400 15px Sarabun, "Leelawadee UI", Tahoma, sans-serif'; ctx.textAlign='right';
  ctx.fillText('รายงานปริมาณน้ำฝน · ข้อมูลจากระบบตัวอย่าง',width-margin,height-24);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?blob.arrayBuffer().then(buffer=>resolve(new Uint8Array(buffer))).catch(reject):reject(new Error('แปลงหน้ารายงานเป็น PDF ไม่สำเร็จ')),'image/jpeg',0.94));
}
function makePdf(images){
  const encoder=new TextEncoder(),chunks=[]; let length=0; const offsets=[0];
  const push=bytes=>{chunks.push(bytes);length+=bytes.length;};
  const ascii=text=>push(encoder.encode(text));
  const pageIds=images.map((_,index)=>3+index*3),totalObjects=2+images.length*3;
  ascii('%PDF-1.4\n');
  offsets[1]=length; ascii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offsets[2]=length; ascii(`2 0 obj\n<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${images.length} >>\nendobj\n`);
  images.forEach((image,index)=>{
    const pageId=pageIds[index],contentId=pageId+1,imageId=pageId+2;
    offsets[pageId]=length; ascii(`${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`);
    const content=encoder.encode('q\n841.89 0 0 595.28 0 0 cm\n/Im0 Do\nQ');
    offsets[contentId]=length; ascii(`${contentId} 0 obj\n<< /Length ${content.length} >>\nstream\n`); push(content); ascii('\nendstream\nendobj\n');
    offsets[imageId]=length; ascii(`${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width 1684 /Height 1190 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`); push(image); ascii('\nendstream\nendobj\n');
  });
  const xrefOffset=length;
  ascii(`xref\n0 ${totalObjects+1}\n0000000000 65535 f \n`);
  for(let id=1;id<=totalObjects;id++) ascii(`${String(offsets[id]).padStart(10,'0')} 00000 n \n`);
  ascii(`trailer\n<< /Size ${totalObjects+1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  const output=new Uint8Array(length); let offset=0; chunks.forEach(chunk=>{output.set(chunk,offset);offset+=chunk.length;});
  return output;
}
async function exportPdf(){
  if(!previewRows.value.length){notice.value='ไม่พบข้อมูลสำหรับออกรายงาน';return;}
  const columns=visibleColumnDefinitions.value;
  if(!columns.length){notice.value='กรุณาเลือกคอลัมน์อย่างน้อย 1 รายการสำหรับ PDF';return;}
  try{
    await document.fonts?.ready;
    const rowsPerPage=38,pageCount=Math.ceil(previewRows.value.length/rowsPerPage),images=[];
    for(let index=0;index<pageCount;index++) images.push(await pdfPageJpeg(previewRows.value.slice(index*rowsPerPage,(index+1)*rowsPerPage),columns,index,pageCount));
    const blob=new Blob([makePdf(images)],{type:'application/pdf'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url; link.download=`${activeProfile.value.name.replace(/[\\/:*?"<>|]/g,'_')}.pdf`; link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    notice.value=`ดาวน์โหลดรายงาน PDF ${previewRows.value.length} สถานีแล้ว`;
  }catch(error){notice.value=`สร้าง PDF ไม่สำเร็จ${error?.message?`: ${error.message}`:''}`;}
}
function toggleActiveProvince(province){
  const next=new Set(activeProfile.value.provinces); next.has(province) ? next.delete(province) : next.add(province); activeProfile.value.provinces=[...next];
}
function deleteProfile(){ const profile=deleting.value; profiles.value=profiles.value.filter(item=>item.id!==profile.id); if(!persist()) return; deleting.value=null; notice.value=`ลบรูปแบบ “${profile.name}” แล้ว โดยไม่กระทบข้อมูลสถานี`; }
function toggleProvince(province){ const next=new Set(form.value.provinces); next.has(province)?next.delete(province):next.add(province); form.value.provinces=[...next]; }
function dateLabel(offset){ const date=new Date(`${referenceDate.value}T00:00:00`); date.setDate(date.getDate()+offset); return new Intl.DateTimeFormat('th-TH',{day:'2-digit',month:'short',year:'numeric'}).format(date); }
</script>

<template>
<main class="rainfall-page" :class="{light:props.theme==='light'}">
  <template v-if="screen==='overview'">
    <header class="page-head"><div><h1>รายงานปริมาณน้ำฝน</h1><p>ขั้นตอน 1 · เลือกรูปแบบรายงาน หรือสร้างรูปแบบใหม่</p></div><button class="primary" @click="openCreate">＋ เพิ่มรูปแบบรายงาน</button></header>
    <section class="profile-filters"><label>หน่วยงาน<select v-model="filterAgency"><option value="all">ทุกหน่วยงาน</option><option v-for="agency in agencies" :key="agency" :value="agency">{{agency}}</option></select></label><label class="search">ค้นหา<input v-model="query" type="search" placeholder="ค้นหาชื่อรายงาน"></label></section>
    <section class="profile-list"><article v-for="profile in filteredProfiles" :key="profile.id" class="profile-row"><div class="profile-copy"><h2>{{profile.name}}</h2><p>{{scopeLabel(profile)}}</p></div><div class="profile-actions"><button class="inspect" @click="openReview(profile)">▣ จัดทำรายงาน</button><button class="trash" @click="deleting=profile" :aria-label="`ลบรูปแบบรายงาน ${profile.name}`" title="ลบรูปแบบรายงาน">🗑</button></div></article><p v-if="!filteredProfiles.length" class="empty">ไม่พบรูปแบบรายงานที่ตรงกับตัวกรอง</p></section>
  </template>

  <template v-else-if="screen==='form'">
    <nav class="crumb"><button @click="screen='overview'">รูปแบบรายงาน</button><span>›</span>{{form.id?'ตั้งค่ารูปแบบ':'เพิ่มรูปแบบรายงาน'}}</nav>
    <header class="page-head"><div><h1>{{form.id?'ตั้งค่ารูปแบบ':'เพิ่มรูปแบบ'}}รายงานปริมาณน้ำฝน</h1><p>ขั้นตอน 2 · กำหนดขอบเขตและเงื่อนไข แล้วบันทึกเพื่อเตรียมข้อมูลออกรายงาน</p></div></header>
    <section class="form-card">
      <label class="wide">ชื่อรูปแบบรายงาน <em>*</em><input v-model="form.name" placeholder="เช่น รายงานปริมาณน้ำฝนรวมทุกหน่วยงาน"></label>
      <div class="form-grid"><label>หน่วยงาน<select v-model="form.agencyScope"><option value="all">ทุกหน่วยงาน</option><option v-for="agency in agencies" :key="agency" :value="agency">{{agency}}</option></select></label><label>พื้นที่รายงาน<select v-model="form.provinceScope"><option value="all">ทุกจังหวัด</option><option value="selected">เลือกเฉพาะจังหวัด</option></select></label></div>
      <fieldset v-if="form.provinceScope==='selected'" class="province-picks province-regions"><legend>เลือกจังหวัดที่ต้องการแสดง</legend><section v-for="region in provinceRegions" :key="region.name" class="province-region"><h3>{{region.name}} <small>{{region.provinces.length}} จังหวัด</small></h3><div class="province-chips"><button v-for="province in region.provinces" :key="province" type="button" :class="{selected:form.provinces.includes(province)}" @click="toggleProvince(province)">{{province}}</button></div></section></fieldset>
      <fieldset class="criteria"><legend>เงื่อนไขการแสดงรายการ</legend><label><input v-model="form.criteriaMode" value="all" type="radio"> แสดงทุกสถานีในขอบเขต (ค่าเริ่มต้น)</label><label><input v-model="form.criteriaMode" value="rain" type="radio"> คัดเลือกตามปริมาณฝนสะสม</label><div v-if="form.criteriaMode==='rain'" class="criteria-fields"><label>ฝนสะสม 3 วันขั้นต่ำ (มม.)<input v-model.number="form.minRain" min="0" step="0.1" type="number"></label><label class="check"><input v-model="form.minimumEnabled" type="checkbox"> กำหนดจำนวนสถานีที่แสดงต่อจังหวัด</label><label v-if="form.minimumEnabled">จำนวนสถานีที่แสดงต่อจังหวัด<input v-model.number="form.minRows" min="1" step="1" type="number"></label></div></fieldset>
      <footer><button class="secondary" @click="screen='overview'">ยกเลิก</button><button class="primary" @click="saveProfile">บันทึกและเตรียมข้อมูล</button></footer>
    </section>
  </template>

  <template v-else-if="screen==='review'">
    <nav class="crumb"><button @click="screen='overview'">ขั้นตอน 1 รายการรูปแบบ</button><span>›</span><button @click="openEdit(activeProfile)">ขั้นตอน 2 ตั้งค่ารูปแบบ</button><span>›</span>ขั้นตอน 3 เตรียมข้อมูลออกรายงาน</nav>
    <header class="page-head"><div><h1>{{activeProfile.name}}</h1><p>ขั้นตอน 3 · {{scopeLabel(activeProfile)}} · วันที่อ้างอิง {{dateLabel(0)}}</p></div><button class="secondary" @click="screen='overview'">← กลับหน้ารายการ</button></header>
    <section class="review-card">
      <div class="review-editor">
        <div class="review-editor-intro"><b>ตั้งค่ารายงานครั้งนี้</b><small>ปรับข้อมูลแล้วกด “อัปเดตข้อมูล” เพื่อเปลี่ยนรายการสถานีในตารางตามเงื่อนไขที่กำหนด</small></div>
        <div class="review-editor-grid"><label class="review-name">ชื่อรูปแบบรายงาน <em>*</em><input v-model="activeProfile.name"></label><label>หน่วยงาน<select v-model="activeProfile.agencyScope"><option value="all">ทุกหน่วยงาน</option><option v-for="agency in agencies" :key="agency" :value="agency">{{agency}}</option></select></label><label>พื้นที่รายงาน<select v-model="activeProfile.provinceScope"><option value="all">ทุกจังหวัด</option><option value="selected">เลือกเฉพาะจังหวัด</option></select></label></div>
        <fieldset v-if="activeProfile.provinceScope==='selected'" class="province-picks province-regions"><legend>เลือกจังหวัดที่ต้องการแสดง</legend><section v-for="region in provinceRegions" :key="region.name" class="province-region"><h3>{{region.name}} <small>{{region.provinces.length}} จังหวัด</small></h3><div class="province-chips"><button v-for="province in region.provinces" :key="province" type="button" :class="{selected:activeProfile.provinces.includes(province)}" @click="toggleActiveProvince(province)">{{province}}</button></div></section></fieldset>
        <fieldset class="criteria review-criteria"><legend>เงื่อนไขการแสดงรายการ</legend><label><input v-model="activeProfile.criteriaMode" value="all" type="radio"> แสดงทุกสถานีในขอบเขต (ค่าเริ่มต้น)</label><label><input v-model="activeProfile.criteriaMode" value="rain" type="radio"> คัดเลือกตามปริมาณฝนสะสม</label><div v-if="activeProfile.criteriaMode==='rain'" class="criteria-fields"><label>ฝนสะสม 3 วันขั้นต่ำ (มม.)<input v-model.number="activeProfile.minRain" min="0" step="0.1" type="number"></label><label class="check"><input v-model="activeProfile.minimumEnabled" type="checkbox"> กำหนดจำนวนสถานีที่แสดงต่อจังหวัด</label><label v-if="activeProfile.minimumEnabled">จำนวนสถานีที่แสดงต่อจังหวัด<input v-model.number="activeProfile.minRows" min="1" step="1" type="number"></label></div></fieldset>
        <div class="review-run-actions"><span>ข้อมูลในตารางจะแสดงเฉพาะสถานีที่ผ่านเงื่อนไขล่าสุด</span><button class="primary" @click="applyCriteria">↻ อัปเดตข้อมูล</button></div>
      </div>
      <div class="review-top"><div><h2>ตารางข้อมูลสถานีตรวจวัด</h2><p>{{criteriaRows.length}} สถานีตามเงื่อนไข · เลือกแล้ว {{reviewIds.length}} สถานี</p></div><div class="review-top-actions"><details class="column-picker"><summary>☷ คอลัมน์ Excel ({{exportColumns.length}}/{{EXPORT_COLUMN_DEFINITIONS.length}})</summary><div class="column-picker-menu"><label v-for="column in EXPORT_COLUMN_DEFINITIONS" :key="column.key"><input v-model="exportColumns" :value="column.key" type="checkbox"> {{columnLabel(column.key)}}</label></div></details><button class="excel" @click="openPreview">ดูตัวอย่าง Excel</button></div></div>
      <div class="review-filters"><input v-model="reviewQuery" type="search" placeholder="ค้นหาชื่อสถานี รหัสสถานี หน่วยงาน ตำบล อำเภอ หรือจังหวัด"><select v-model="inclusion"><option value="all">ทุกรายการ</option><option value="included">เฉพาะสถานีที่อยู่ในรายงาน</option><option value="excluded">สถานีที่ไม่ได้เลือกเข้ารายงาน</option></select><button class="secondary" @click="resetSelection">คืนค่าผลอัตโนมัติ</button></div>
      <RainfallReportTable :rows="reviewRows" :reference-date="referenceDate" :selected-ids="reviewIds" :visible-columns="exportColumns" selectable @toggle="toggleStation"/>
      <footer><small>การเพิ่มหรือนำสถานีออกมีผลเฉพาะรายงานนี้ ไม่กระทบข้อมูล Station Master</small><button class="secondary" @click="saveReviewSelection">บันทึกข้อมูล</button><button class="primary" @click="openPreview">ตรวจสอบและดูตัวอย่าง Excel</button></footer>
    </section>
  </template>

  <template v-else>
    <nav class="crumb"><button @click="screen='review'">ตรวจสอบรายงาน</button><span>›</span>ดูตัวอย่าง Excel</nav>
    <header class="page-head"><div><h1>{{activeProfile.name}}</h1><p>ตัวอย่าง Excel · ข้อมูล {{dateLabel(-2)}} ถึง {{dateLabel(0)}} · {{selectedRows.length}} สถานี</p></div><button class="secondary" @click="screen='review'">← กลับไปแก้ไขรายการ</button></header>
    <section class="preview-card excel-preview-card">
      <header><div><span class="excel-mark">X</span><div><b>ตัวอย่าง Excel</b><small>แก้ไขค่าในเซลล์ได้ก่อนออกรายงาน · โหลดล่าสุด {{previewLoadedAt || '-'}}</small></div></div><div class="preview-actions"><button class="secondary" @click="loadPreviewData()">↻ โหลดข้อมูลล่าสุด</button><button class="primary" @click="exportExcel">⇩ ออกรายงาน Excel</button><button class="pdf-button" @click="exportPdf">⇩ ออกรายงาน PDF</button></div></header>
      <div class="excel-edit-note">ตรวจสอบและแก้ไขข้อมูลในตารางก่อนออกรายงาน โดยไฟล์ .xlsx จะสร้างด้วย ExcelJS จากค่าล่าสุดในตารางนี้</div>
      <div class="preview-table-controls"><input v-model="previewQuery" type="search" placeholder="ค้นหารหัสสถานี ชื่อ หน่วยงาน หรือพื้นที่"><select v-model="previewSort"><option value="total-desc">ฝนสะสม: มากไปน้อย</option><option value="total-asc">ฝนสะสม: น้อยไปมาก</option><option value="province">เรียงตามจังหวัด</option><option value="name">เรียงตามชื่อสถานี</option></select><span>{{previewTableRows.length}} / {{previewRows.length}} รายการ</span></div>
      <div class="vue-table-wrap"><table class="vue-excel-table"><thead><tr><th v-for="column in visibleColumnDefinitions" :key="column.key">{{columnLabel(column.key)}}</th></tr></thead><tbody><tr v-for="row in previewTableRows" :key="row.id"><td v-for="column in visibleColumnDefinitions" :key="column.key" :class="{ 'excel-total':column.key==='total' }"><span v-if="column.key==='total'">{{previewTotal(row) === null ? 'ไม่มีข้อมูล' : previewTotal(row).toLocaleString('th-TH',{maximumFractionDigits:1})}}</span><input v-else :value="columnValue(row,column.key)" :aria-label="columnLabel(column.key)" :type="column.key.startsWith('rain') ? 'number' : 'text'" :step="column.key.startsWith('rain') ? '0.1' : undefined" @input="setColumnValue(row,column.key,$event.target.value)"></td></tr><tr v-if="!previewTableRows.length"><td :colspan="Math.max(visibleColumnDefinitions.length,1)" class="empty">ไม่พบรายการที่ตรงกับการค้นหา</td></tr></tbody></table></div>
    </section>
  </template>
  <p v-if="notice" class="notice" role="status">{{notice}} <button @click="notice=''" aria-label="ปิด">×</button></p>
  <div v-if="deleting" class="overlay" @click.self="deleting=null"><section class="confirm" role="dialog" aria-modal="true"><h2>ยืนยันการลบรูปแบบรายงาน</h2><p>ต้องการลบรูปแบบ “{{deleting.name}}” ใช่หรือไม่? การลบจะไม่กระทบข้อมูลสถานีและข้อมูลตรวจวัด</p><footer><button class="secondary" @click="deleting=null">ยกเลิก</button><button class="delete" @click="deleteProfile">ยืนยันการลบรูปแบบ</button></footer></section></div>
</main>
</template>

<style scoped>
.rainfall-page{--rr-bg:#111318;--rr-panel:#191d24;--rr-panel-2:#202630;--rr-input:#232a35;--rr-line:#303846;--rr-text:#edf3ff;--rr-muted:#9db2cf;--rr-accent:#2563eb;--rr-accent-soft:#172554;--rr-danger:#fb7185;box-sizing:border-box;height:100%;overflow:auto;padding:30px 36px;background:var(--rr-bg);color:var(--rr-text);font:14px/1.45 Sarabun,'Leelawadee UI',sans-serif}.rainfall-page.light{--rr-bg:#f5f7fb;--rr-panel:#fff;--rr-panel-2:#f1f5f9;--rr-input:#fff;--rr-line:#d8e0ec;--rr-text:#172033;--rr-muted:#64748b;--rr-accent:#2563eb;--rr-accent-soft:#dbeafe;--rr-danger:#b42318}.rainfall-page *{box-sizing:border-box}.page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.page-head h1{margin:0;font-size:24px;line-height:1.25}.page-head p{margin:4px 0 0;color:var(--rr-muted)}.primary,.secondary,.delete,.profile-actions button,.crumb button{font:600 14px Sarabun,'Leelawadee UI',sans-serif;cursor:pointer}.primary{min-height:38px;padding:8px 14px;border:1px solid var(--rr-accent);border-radius:8px;background:var(--rr-accent);color:#fff}.page-head>.primary,.profile-actions .inspect{border-radius:999px}.secondary,.excel{min-height:36px;padding:7px 12px;border:1px solid var(--rr-line);border-radius:7px;background:var(--rr-panel);color:var(--rr-text)}.delete{min-height:36px;padding:7px 12px;border:1px solid #b91c1c;border-radius:7px;background:#7f1d1d22;color:var(--rr-danger)}.profile-filters{display:grid;grid-template-columns:1fr 1fr minmax(220px,.8fr);gap:10px;margin-bottom:12px}.profile-filters label,.form-card label,.review-config label{display:grid;gap:5px;color:var(--rr-muted);font-size:12px}.profile-filters input,.profile-filters select,.form-card input:not([type=radio]):not([type=checkbox]),.form-card select,.review-config input,.review-filters input,.review-filters select{min-height:40px;width:100%;padding:8px 12px;border:1px solid var(--rr-line);border-radius:8px;background:var(--rr-input);color:var(--rr-text);font:14px Sarabun,'Leelawadee UI',sans-serif}.profile-list{display:grid;gap:9px}.profile-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 14px;border:1px solid var(--rr-line);border-radius:12px;background:var(--rr-panel)}.profile-copy h2{margin:0;font-size:16px}.profile-copy p{margin:5px 0 0;color:var(--rr-muted);font-size:13px}.profile-actions{display:flex;align-items:center;flex-wrap:wrap;gap:7px}.profile-actions button{min-height:30px;padding:5px 10px;border:1px solid var(--rr-line);border-radius:16px;background:var(--rr-panel);color:var(--rr-text)}.profile-actions .inspect{background:var(--rr-accent);border-color:var(--rr-accent);color:#fff}.profile-actions .more{border:0;font-size:16px}.crumb{display:flex;align-items:center;gap:8px;margin-bottom:14px;color:var(--rr-muted);font-size:13px}.crumb button{border:0;background:transparent;color:#60a5fa;padding:0}.form-card,.review-card,.preview-card{border:1px solid var(--rr-line);border-radius:12px;background:var(--rr-panel);box-shadow:0 4px 15px #00000020}.form-card{display:grid;gap:16px;padding:20px;max-width:920px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.wide{max-width:none!important}.form-card em{color:var(--rr-danger)}.criteria,.province-picks{margin:0;padding:16px;border:1px solid var(--rr-line);border-radius:10px}.criteria legend,.province-picks legend{padding:0 5px;color:var(--rr-text);font-weight:700}.criteria>label,.criteria-fields .check{display:flex;align-items:center;gap:9px;margin:10px 0;color:var(--rr-text);font-size:14px;cursor:pointer}.criteria input[type=radio],.criteria input[type=checkbox]{flex:0 0 auto;width:17px;height:17px;min-height:0;margin:0;accent-color:var(--rr-accent)}.criteria-fields{display:grid;gap:12px;margin:12px 0 0;padding:14px;border-top:1px solid var(--rr-line);background:var(--rr-panel-2);border-radius:0 0 8px 8px}.criteria-fields>label:not(.check){max-width:480px}.province-picks{display:flex;flex-wrap:wrap;gap:8px}.province-picks legend{width:100%}.province-picks button{padding:6px 10px;border:1px solid var(--rr-line);border-radius:999px;background:var(--rr-input);color:var(--rr-text);font:inherit;cursor:pointer}.province-picks button.selected{border-color:var(--rr-accent);background:var(--rr-accent);color:#fff}.form-card footer,.review-card>footer{display:flex;justify-content:flex-end;gap:8px;padding-top:6px}.review-card{overflow:hidden}.review-config,.review-top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border-bottom:1px solid var(--rr-line)}.review-config>div{display:grid;gap:3px}.review-config small,.review-top p{margin:0;color:var(--rr-muted)}.review-config label{min-width:170px}.review-top h2{margin:0;font-size:16px}.excel{font:600 13px Sarabun,'Leelawadee UI',sans-serif;cursor:pointer}.review-filters{display:grid;grid-template-columns:minmax(260px,1fr) 220px auto;gap:10px;padding:14px 18px}.review-card>footer{align-items:center;padding:14px 18px;border-top:1px solid var(--rr-line)}.review-card>footer small{margin-right:auto;color:var(--rr-muted)}.preview-card>header{display:flex;justify-content:space-between;align-items:center;padding:15px 18px;border-bottom:1px solid var(--rr-line)}.preview-card>header>div{display:flex;gap:9px;align-items:center}.preview-card b,.preview-card small{display:block}.preview-card small{color:var(--rr-muted)}.excel-mark{display:grid;place-items:center;width:28px;height:28px;border-radius:5px;background:#217346;color:#fff;font-weight:800}.notice{position:fixed;z-index:10;right:22px;bottom:22px;display:flex;align-items:center;gap:13px;max-width:480px;margin:0;padding:11px 13px;border:1px solid #3b82f6;border-radius:8px;background:var(--rr-accent-soft);color:var(--rr-text);box-shadow:0 8px 30px #0005}.notice button{border:0;background:transparent;color:inherit;font-size:18px;cursor:pointer}.overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:#000a}.confirm{width:min(460px,100%);padding:20px;border:1px solid var(--rr-line);border-radius:12px;background:var(--rr-panel);color:var(--rr-text);box-shadow:0 20px 50px #0008}.confirm h2{margin:0}.confirm p{color:var(--rr-muted)}.confirm footer{display:flex;justify-content:flex-end;gap:8px}.empty{padding:28px;text-align:center;color:var(--rr-muted);border:1px dashed var(--rr-line);border-radius:10px}@media(max-width:760px){.rainfall-page{padding:18px;padding-top:72px}.profile-filters,.form-grid,.review-filters{grid-template-columns:1fr}.page-head,.profile-row,.review-config,.review-top,.preview-card>header{align-items:stretch;flex-direction:column}.profile-actions{justify-content:flex-start}.review-card>footer{align-items:stretch;flex-direction:column}.review-card>footer small{margin:0}.primary,.secondary{width:100%}}
.form-card{width:100%;max-width:none}
.criteria-fields{grid-template-columns:minmax(240px,1fr) minmax(280px,1fr);align-items:end}
.criteria-fields>label:not(.check){max-width:none}
.criteria-fields .check{align-self:center}
.review-editor{padding:18px;border-bottom:1px solid var(--rr-line);background:var(--rr-panel)}
.review-editor-intro{display:grid;gap:3px;margin-bottom:15px}
.review-editor-intro small{color:var(--rr-muted)}
.review-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:12px}
.review-editor-grid .review-name{grid-column:1/-1}
.review-editor label{display:grid;gap:5px;color:var(--rr-muted);font-size:12px}
.review-editor em{color:var(--rr-danger)}
.review-editor input:not([type=radio]):not([type=checkbox]),.review-editor select{min-height:40px;width:100%;padding:8px 12px;border:1px solid var(--rr-line);border-radius:8px;background:var(--rr-input);color:var(--rr-text);font:14px Sarabun,'Leelawadee UI',sans-serif}
.review-editor .province-picks,.review-editor .review-criteria{margin-top:14px}
.review-run-actions{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:14px;padding-top:14px;border-top:1px solid var(--rr-line)}
.review-run-actions span{color:var(--rr-muted);font-size:12px}
.province-regions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.province-regions legend{grid-column:1/-1}
.province-region{min-width:0;padding:10px;border:1px solid var(--rr-line);border-radius:8px;background:var(--rr-panel-2)}
.province-region h3{display:flex;align-items:baseline;gap:7px;margin:0 0 8px;font-size:14px}
.province-region h3 small{color:var(--rr-muted);font-weight:400}
.province-chips{display:flex;flex-wrap:wrap;gap:7px}
.selected-province-summary{grid-column:1/-1;display:flex;align-items:center;flex-wrap:wrap;gap:7px;padding:10px 12px;border:1px solid var(--rr-accent);border-radius:8px;background:var(--rr-accent-soft);color:var(--rr-text)}.selected-province-summary>b{width:100%;font-size:13px}.selected-province-chip{padding:4px 9px;border:1px solid #4b83dc;border-radius:999px;background:var(--rr-panel);font-size:12px}.selected-province-chip small{color:var(--rr-muted)}.summary-muted{color:var(--rr-muted);font-size:12px}
button:disabled{opacity:.45;cursor:not-allowed}
@media(max-width:900px){.review-editor-grid{grid-template-columns:1fr 1fr}.review-editor-grid .review-name{grid-column:1/-1}}
@media(max-width:760px){.criteria-fields{grid-template-columns:1fr}}
@media(max-width:760px){.review-run-actions{align-items:stretch;flex-direction:column}.review-editor-grid,.province-regions{grid-template-columns:1fr}.review-editor-grid .review-name{grid-column:auto}}
.profile-filters{grid-template-columns:1fr 1fr}
.preview-actions{display:flex;gap:8px}.pdf-button{min-height:38px;padding:8px 14px;border:1px solid #b42318;border-radius:8px;background:#b42318;color:#fff;font:600 14px Sarabun,'Leelawadee UI',sans-serif;cursor:pointer}
.excel-edit-note{padding:10px 18px;border-bottom:1px solid var(--rr-line);background:var(--rr-panel-2);color:var(--rr-muted);font-size:12px}
.preview-table-controls{display:grid;grid-template-columns:minmax(250px,1fr) 220px auto;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid var(--rr-line);background:var(--rr-panel)}
.preview-table-controls input,.preview-table-controls select{min-height:38px;width:100%;padding:8px 11px;border:1px solid var(--rr-line);border-radius:7px;background:var(--rr-input);color:var(--rr-text);font:14px Sarabun,'Leelawadee UI',sans-serif}
.preview-table-controls span{color:var(--rr-muted);font-size:12px;white-space:nowrap}
.vue-table-wrap{max-height:min(680px,calc(100dvh - 305px));overflow:auto;background:#fff}
.vue-excel-table{width:100%;min-width:1260px;border-collapse:collapse;color:#111827;background:#fff;font:14px/1.3 'Leelawadee UI',Sarabun,sans-serif}
.vue-excel-table th{position:sticky;top:0;z-index:2;padding:10px 8px;border:1px solid #9ca3af;background:#fff700;color:#111827;text-align:center;white-space:nowrap;font-weight:700}
.vue-excel-table td{padding:0;border:1px solid #cbd5e1;background:#fff;vertical-align:middle}
.vue-excel-table td input{width:100%;min-width:0;border:0;background:transparent;color:#111827;padding:8px;outline:none;font:inherit}
.vue-excel-table td input:focus{background:#dbeafe;box-shadow:inset 0 0 0 2px #2563eb}
.vue-excel-table td:nth-last-child(-n+4) input,.vue-excel-table .excel-total{text-align:right;font-variant-numeric:tabular-nums}
.vue-excel-table .excel-total{padding:8px;background:#f8fafc;font-weight:700}
@media(max-width:760px){.preview-table-controls{grid-template-columns:1fr}.preview-table-controls span{display:none}}
@media(max-width:760px){.preview-actions{display:grid;grid-template-columns:1fr}.excel-preview-card>header{align-items:stretch;flex-direction:column}}
.profile-actions .trash{display:grid;place-items:center;width:32px;min-width:32px;padding:0;border-color:#7f1d1d;background:#7f1d1d22;color:#fda4af;font-size:15px}.profile-actions .trash:hover{background:#7f1d1d55;color:#fff}
.review-top-actions{display:flex;align-items:center;gap:8px}.column-picker{position:relative}.column-picker summary{min-height:36px;padding:7px 12px;border:1px solid var(--rr-line);border-radius:7px;background:var(--rr-panel);color:var(--rr-text);font:600 13px Sarabun,'Leelawadee UI',sans-serif;cursor:pointer;list-style:none}.column-picker summary::-webkit-details-marker{display:none}.column-picker-menu{position:absolute;z-index:8;right:0;top:calc(100% + 6px);display:grid;grid-template-columns:repeat(2,minmax(150px,1fr));gap:7px;width:360px;padding:12px;border:1px solid var(--rr-line);border-radius:9px;background:var(--rr-panel);box-shadow:0 12px 30px #0007}.column-picker-menu label{display:flex;align-items:center;gap:7px;color:var(--rr-text);font-size:13px;cursor:pointer}.column-picker-menu input{width:16px;height:16px;margin:0;accent-color:var(--rr-accent)}
@media(max-width:760px){.review-top-actions{align-items:stretch;flex-direction:column}.column-picker-menu{right:auto;left:0;width:min(360px,calc(100vw - 56px));grid-template-columns:1fr}.column-picker summary{width:100%}}
</style>
