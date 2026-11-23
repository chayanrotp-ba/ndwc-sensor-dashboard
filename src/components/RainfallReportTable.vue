<script setup>
import { computed } from 'vue';
import { formatRainfall } from '../rainfall-report.js';
const props = defineProps({ rows:{type:Array,default:()=>[]}, referenceDate:{type:String,required:true}, selectedIds:{type:Array,default:()=>[]}, selectable:{type:Boolean,default:false}, visibleColumns:{type:Array,default:()=>['code','name','agency','tambon','amphoe','province','rain0','rain1','rain2','total']} });
const emit = defineEmits(['toggle']);
const selected = computed(() => new Set(props.selectedIds));
const headers = computed(() => { const origin=new Date(`${props.referenceDate}T00:00:00`); const label=(offset)=>{const date=new Date(origin);date.setDate(date.getDate()+offset);return new Intl.DateTimeFormat('th-TH',{day:'2-digit',month:'short'}).format(date);}; return [label(-2),label(-1),label(0)]; });
const allColumns = Object.freeze(['code','name','agency','tambon','amphoe','province','rain0','rain1','rain2','total']);
const columns = computed(() => allColumns.filter(column => props.visibleColumns.includes(column)));
function label(column){ return ({code:'รหัสสถานี',name:'สถานี',agency:'หน่วยงาน',tambon:'ตำบล',amphoe:'อำเภอ',province:'จังหวัด',rain0:headers.value[0],rain1:headers.value[1],rain2:headers.value[2],total:'ฝนสะสม 3 วัน'})[column]; }
function value(row,column){ if(column==='rain0') return formatRainfall(row.rain[0]); if(column==='rain1') return formatRainfall(row.rain[1]); if(column==='rain2') return formatRainfall(row.rain[2]); if(column==='total') return formatRainfall(row.total); return row[column]; }
const groups = computed(() => {
  const byProvince = new Map();
  props.rows.forEach((row) => { if(!byProvince.has(row.province)) byProvince.set(row.province,[]); byProvince.get(row.province).push(row); });
  return [...byProvince.entries()].map(([province, rows]) => {
    const sorted=[...rows].sort((a,b)=>(b.total ?? -Infinity)-(a.total ?? -Infinity)||a.name.localeCompare(b.name,'th'));
    return { province, rows:sorted, maximum:sorted.find(row=>row.total!==null)?.total ?? null };
  }).sort((a,b)=>(b.maximum ?? -Infinity)-(a.maximum ?? -Infinity)||a.province.localeCompare(b.province,'th'));
});
</script>
<template>
  <div class="report-table-wrap"><table class="report-table"><thead><tr><th v-if="selectable" class="select-cell">เลือก</th><th v-for="column in columns" :key="column" :class="{rain:column.startsWith('rain') || column==='total'}">{{label(column)}}<small v-if="column.startsWith('rain')">(24 ชม.)</small></th></tr></thead><tbody><template v-for="group in groups" :key="group.province"><tr class="province-row"><td :colspan="columns.length + (selectable ? 1 : 0)"><b>จังหวัด{{group.province}}</b><span>{{group.rows.length}} สถานี · ค่าสูงสุด {{formatRainfall(group.maximum)}} มม.</span></td></tr><tr v-for="row in group.rows" :key="row.id"><td v-if="selectable" class="select-cell"><input :checked="selected.has(row.id)" type="checkbox" :aria-label="'เลือก '+row.name" @change="emit('toggle',row.id)"></td><td v-for="column in columns" :key="column" :class="[{missing:column==='total'&&row.total===null,station:column==='name'}, {rain:column.startsWith('rain') || column==='total'}]"><template v-if="column==='name'"><b>{{row.name}}</b></template><b v-else-if="column==='total'">{{value(row,column)}}</b><template v-else>{{value(row,column)}}</template></td></tr></template><tr v-if="!rows.length"><td :colspan="Math.max(columns.length + (selectable ? 1 : 0),1)" class="empty">ไม่พบสถานีตามเงื่อนไขที่กำหนด</td></tr></tbody></table></div>
</template>
<style scoped>
.report-table-wrap{overflow:auto;border:1px solid var(--rr-line);border-radius:8px}.report-table{width:100%;min-width:1120px;border-collapse:collapse;background:var(--rr-panel);color:var(--rr-text);font:13px/1.4 Sarabun,'Leelawadee UI',sans-serif}.report-table th{padding:9px 10px;background:var(--rr-panel-2);border-bottom:1px solid var(--rr-line);text-align:left;font-weight:700;white-space:nowrap}.report-table th:nth-last-child(-n+4),.report-table td:nth-last-child(-n+4){text-align:right;font-variant-numeric:tabular-nums}.report-table th small{display:block;color:var(--rr-muted);font-weight:400}.report-table td{padding:9px 10px;border-bottom:1px solid var(--rr-line);vertical-align:middle}.report-table tbody tr:not(.province-row):hover{background:var(--rr-accent-soft)}.station-cell{display:flex;align-items:flex-start;gap:8px;min-width:210px}.station-cell input{margin-top:4px;width:16px;height:16px;accent-color:var(--rr-accent)}.station-cell b,.station-cell small{display:block}.station-cell small{color:var(--rr-muted);font-size:11px}.province-row td{padding:8px 10px;background:var(--rr-panel-2);color:var(--rr-text);text-align:left!important;font-variant-numeric:normal!important}.province-row td>b{display:inline-flex;align-items:center}.province-row td>span{margin-left:10px;color:var(--rr-muted);font-size:12px}.missing{color:#f59e0b}.empty{padding:28px!important;text-align:center;color:var(--rr-muted)}
.report-table .rain{text-align:right;font-variant-numeric:tabular-nums}.report-table .station{min-width:210px}.report-table .select-cell{width:46px;padding-inline:10px;text-align:center}.report-table .select-cell input{width:16px;height:16px;margin:0;accent-color:var(--rr-accent)}
</style>
<style scoped>
.report-table-wrap{max-height:min(520px,calc(100dvh - 260px));overscroll-behavior:contain}
.report-table thead th{position:sticky;top:0;z-index:3;box-shadow:0 1px 0 var(--rr-line)}
.report-table{font-size:12px;line-height:1.3}
.report-table th{padding:7px 10px}
.report-table td{padding:6px 10px}
.province-row td{padding:5px 10px}
.station-cell{gap:7px}
.station-cell input{margin-top:2px}
.station-cell small{line-height:1.2}
</style>
