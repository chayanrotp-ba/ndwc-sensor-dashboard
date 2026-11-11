<script setup>
import {ref,computed,onMounted,onBeforeUnmount,nextTick,watch} from 'vue';
import MeasurementRules from './MeasurementRules.vue';
import MeasurementTypes from './MeasurementTypes.vue';
const type = ref(0);
const otherDirty = ref(false);
import {WARNING_PERIODS,warningMaster,warningCustom,activeWarning,validWarning,saveWarning,resetWarning} from '../warning-criteria.js';
const props=defineProps({station:Object,close:Function,saved:Function,canManage:{type:Boolean,default:true}});
const period=ref('24h'),dirty=ref(false),pending=ref(null),error=ref(''),dialog=ref(null),levels=ref([]),current=ref({}),editing=ref(false),notice=ref('');
const origin=document.activeElement;
const hasRain=computed(()=>props.station.hasRain!==false);
const custom=computed(()=>warningCustom(props.station.code));
function load(){try{levels.value=warningMaster(period.value);current.value=JSON.parse(JSON.stringify(activeWarning(props.station.code,levels.value,{draft:true})));error.value='';}catch(e){error.value=e.message;}}
load();
watch(period,()=>{
  try{levels.value=warningMaster(period.value);}
  catch(failure){error.value=failure.message;}
});
const invalid=computed(()=>!validWarning(current.value,levels.value.length));
function cancelEdit(){load();editing.value=false;dirty.value=false;notice.value='';}
watch(()=>props.station.code,()=>{period.value='24h';pending.value=null;notice.value='';cancelEdit();});
function update(i,e){current.value[period.value][i]=e.target.value===''?null:Number(e.target.value);dirty.value=true;}
function close(){if(dirty.value||otherDirty.value)pending.value='close';else props.close();}
function save(){if(!props.canManage||!hasRain.value||!editing.value||invalid.value||error.value)return;try{saveWarning(props.station.code,JSON.parse(JSON.stringify(current.value)),levels.value,props.canManage);dirty.value=false;editing.value=false;notice.value='บันทึกสำเร็จ — Custom — มีเกณฑ์เฉพาะสถานี';load();}catch(e){error.value=e.message;}}
function confirm(){if(pending.value==='reset'){try{resetWarning(props.station.code,props.canManage);dirty.value=false;editing.value=false;notice.value='Reset สำเร็จ — Default — ใช้เกณฑ์กลาง';load();}catch(e){error.value=e.message;}pending.value=null;}else props.close();}
function keydown(e){if(e.key==='Escape'){e.stopPropagation();close();}if(e.key==='Tab'){const a=[...dialog.value.querySelectorAll('button:not(:disabled),input:not(:disabled)')];if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0]?.focus();}}}
onMounted(async()=>{await nextTick();dialog.value.querySelector('button')?.focus();});onBeforeUnmount(()=>origin?.focus());
</script>
<template>
<div class="ste-overlay" @click.self="close" @keydown="keydown"><section ref="dialog" class="ste-dialog" role="dialog" aria-modal="true" aria-labelledby="ste-title">
<header class="ste-header"><div><span class="ste-eyebrow">รายการสถานี / ตั้งค่าเกณฑ์และการแจ้งเตือน</span><h2 id="ste-title">ตั้งค่าเกณฑ์และการแจ้งเตือน</h2><p>{{station.name}} <span class="ste-code">{{station.code}}</span></p><small>{{station.agency || 'ไม่ระบุหน่วยงาน'}} · {{station.loc}}</small><p v-if="type===0" class="ste-warning-status">เกณฑ์เตือนภัย: {{custom?'Custom — มีเกณฑ์เฉพาะสถานี':'Default — ใช้เกณฑ์กลาง'}}</p></div><button class="ste-icon" aria-label="ปิดการตั้งค่าเกณฑ์" @click="close">×</button></header>
<div class="ste-body">
<p class="ste-hint">ต้นแบบ · เกณฑ์กลาง Warning เป็นข้อมูลสาธิต บันทึกในเบราว์เซอร์นี้ ยังไม่เชื่อมสิทธิ์ผู้ใช้หรือส่ง Alert จริง</p>

<MeasurementTypes v-model="type" :disabled="dirty || otherDirty" :sensors="station.sensors || (hasRain?[0]:[])" />
<MeasurementRules v-if="type!==0" :key="type" :type="type" :code="station.code" :can-manage="canManage" @dirty="otherDirty=$event" />
<p v-else-if="!hasRain" class="ste-warning" role="alert">สถานีนี้ไม่มีข้อมูลตรวจวัดน้ำฝน ไม่สามารถกำหนด Warning DDPM Criteria ได้</p>
<template v-else>
<div class="ste-periods" role="group" aria-label="ช่วงฝนสะสม"><button v-for="(label,key) in WARNING_PERIODS" :key="key" :class="{active:period===key}" :aria-pressed="period===key" @click="period=key">{{label}}</button></div>
<p v-if="error" class="ste-error" role="alert">{{error}} <button @click="load">ลองโหลดอีกครั้ง</button></p>
<template v-else>
<div class="ste-source-note"><strong>Warning DDPM Criteria — {{custom?'Custom':'Default'}}</strong><p>{{custom?'เกณฑ์เฉพาะสถานีนี้ แก้ไขช่วงค่าได้จากหน้านี้':'เกณฑ์กลางของทั้งระบบ · อ่านอย่างเดียวในหน้ารายสถานี'}}</p><small>การตั้งค่า Default ดำเนินการที่เมนูแยก “Master Setting — เกณฑ์เตือนภัยกลาง”</small></div>
<p v-if="editing" class="ste-warning" role="status">กำลัง{{custom?'แก้ไข':'สร้าง'}} Custom เฉพาะ {{station.code}} · มีผลเมื่อบันทึกเท่านั้น</p>
<p class="ste-info">Warning DDPM ใช้ประเมินระดับเตือนภัยและเงื่อนไข Alert · ชื่อและสีอ้างอิง Master DDPMSOF-403</p>
<section class="ste-levels"><div class="ste-section-title"><h3>{{WARNING_PERIODS[period]}}</h3><span class="ste-badge">{{editing?'ฉบับแก้ไข Custom':custom?'Custom':'Default'}}</span></div><div class="ste-band-grid"><label v-for="(level,i) in levels" :key="level.id" :style="{'--level-color':level.color}"><b>{{level.name}}</b><span>{{i?'> '+(current[period][i-1]??'—'): 'ตั้งแต่ 0'}}{{i<levels.length-1?' ถึง':''}}</span><input v-if="i<levels.length-1" type="number" min="0" step="any" :disabled="!editing||!canManage" :value="current[period][i]" :aria-label="WARNING_PERIODS[period]+' ขอบบนระดับ '+(i+1)+' '+level.name" @input="update(i,$event)"><strong v-else>{{current[period].at(-1)}}</strong><small>มม.</small></label></div><p class="ste-hint">รวมขอบบนในระดับนั้น ระดับถัดไปมากกว่าขอบเดิม จึงไม่มีช่องว่างหรือช่วงซ้อน · ฝนวันนี้ ฝนวานนี้ และฝน 24 ชั่วโมงกำหนดค่าแยกกัน</p><p v-if="invalid" class="ste-error" role="alert">กรอกตัวเลขมากกว่า 0 เรียงจากน้อยไปมากให้ครบทุกช่วง</p></section>
<p v-if="!canManage" class="ste-warning">คุณมีสิทธิ์ดูข้อมูลเท่านั้น</p></template>
</template>
<p v-if="type===0 && notice" role="status" class="ste-info">{{notice}}</p>
</div>
<footer v-if="pending" class="ste-footer ste-pending"><p>{{pending==='reset'?'สถานีนี้จะยกเลิกเกณฑ์เฉพาะและกลับไปใช้เกณฑ์กลางล่าสุด ต้องการ Reset to Default หรือไม่?':'ต้องการละทิ้งการแก้ไขที่ยังไม่บันทึกหรือไม่?'}}</p><button class="ste-secondary" @click="pending=null">ยกเลิก</button><button class="ste-primary" @click="confirm">ยืนยัน</button></footer>
<footer v-else class="ste-footer"><template v-if="type===0&&hasRain&&!error&&canManage"><button v-if="custom" class="ste-secondary ste-inherit" @click="pending='reset'">Reset to Default</button><button v-if="!editing" class="ste-primary" @click="editing=true">{{custom?'แก้ไขเกณฑ์เฉพาะสถานี':'กำหนด Custom เฉพาะสถานี'}}</button><template v-else><button class="ste-secondary" @click="cancelEdit">ยกเลิกการแก้ไข Custom</button><button class="ste-primary" :disabled="invalid||!dirty" @click="save">บันทึก Custom เฉพาะสถานี</button></template></template><button class="ste-secondary" @click="close">ปิด</button></footer>
</section></div>
</template>
<style>
.ste-overlay{position:fixed;inset:0;background:#000b;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px}.ste-dialog{width:min(1060px,100%);max-height:calc(100dvh - 48px);display:flex;flex-direction:column;background:#191b20;border:1px solid #424753;border-radius:14px;box-shadow:0 24px 80px #0008;color:#f1f5f9;font:14px/1.6 Sarabun,sans-serif;overflow:hidden}.ste-dialog button,.ste-dialog input,.ste-dialog select{font:inherit}.ste-dialog button{cursor:pointer}.ste-dialog :focus-visible{outline:2px solid #60a5fa;outline-offset:3px}.ste-header{padding:20px 24px;border-bottom:1px solid #353945;display:flex;justify-content:space-between;gap:16px;background:#202329}.ste-header h2{font-size:22px;margin:3px 0 8px}.ste-header p{margin:0}.ste-header small,.ste-eyebrow{color:#a8b9cf}.ste-code{font-size:12px;padding:2px 8px;border:1px solid #526078;border-radius:4px;white-space:nowrap}.ste-icon{width:36px;height:36px;flex-shrink:0;border:1px solid #515968;border-radius:8px;background:#30353f;color:#fff;font-size:24px!important}.ste-body{padding:20px 24px;overflow:auto;display:flex;flex-direction:column;gap:16px;min-height:0}.ste-info,.ste-warning,.ste-preview{padding:12px 16px;border:1px solid #355786;background:#17273e;border-radius:8px;margin:0;color:#cce1ff}.ste-scope{padding:0;border:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}.ste-scope legend{margin-bottom:8px;font-weight:600}.ste-scope button{background:#24272e;border:1px solid #515968;border-radius:9px;padding:12px 16px;text-align:left;color:#dbe4f2}.ste-scope button.active{border-color:#4a8cff;background:#172c54;box-shadow:inset 0 0 0 1px #4a8cff}.ste-scope strong,.ste-scope small{display:block}.ste-scope small{margin-top:4px;color:#a8bbd7}.ste-config{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center}.ste-config label{display:grid;gap:7px}.ste-config select{width:100%;background:#282c34;border:1px solid #586173;border-radius:6px;color:#fff;padding:10px}.ste-config>div{display:grid;gap:2px}.ste-config>div span,.ste-config small{color:#a8b9cf;font-size:12px}.ste-config strong{color:#93c5fd}.ste-warning{background:#332911;color:#f9dd94;border-color:#806221}.ste-warning p{margin:5px 0 0}.ste-periods{display:flex;flex-wrap:wrap;gap:7px}.ste-periods button{border:1px solid #4e586b;background:#242830;color:#cbd5e1;border-radius:7px;padding:8px 12px;min-height:40px}.ste-periods button.active{background:#2563eb;color:#fff;border-color:#60a5fa}.ste-levels{padding:16px;border:1px solid #404855;border-radius:10px;background:#15171c}.ste-section-title{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}.ste-section-title h3{font-size:16px;margin:0}.ste-section-title p,.ste-hint{font-size:12px;color:#a8b9cf;margin:5px 0 0}.ste-badge{border:1px solid #315d55;background:#13362c;color:#99e7cb;padding:4px 8px;font-size:11px;border-radius:20px;white-space:nowrap}.ste-band-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.ste-band-grid label{min-width:0;border:1px solid #434b59;border-top:4px solid var(--level-color);border-radius:7px;padding:12px;display:flex;flex-direction:column;gap:5px}.ste-band-grid b{color:var(--level-color);font-size:13px}.ste-band-grid span,.ste-band-grid small{font-size:12px;color:#a8b9cf}.ste-band-grid input{width:100%;min-width:0;color:#fff;background:#272c35;border:1px solid #6b778c;border-radius:5px;padding:8px}.ste-band-grid strong{font-size:24px;min-height:40px}.ste-preview strong{font-size:14px}.ste-preview p{margin:5px 0}.ste-preview>span{font-size:12px}.ste-error{color:#fca5a5;background:#411b22;padding:10px;border-radius:6px;margin:5px 0;font-size:13px}.ste-footer{display:flex;gap:8px;justify-content:flex-end;align-items:center;padding:14px 24px;border-top:1px solid #353945;background:#202329}.ste-primary,.ste-secondary{border:1px solid #555f70;border-radius:6px;padding:9px 16px;background:#303640;color:#e2e8f0;min-height:42px}.ste-primary{background:#2563eb;border-color:#2563eb;color:#fff}.ste-primary:disabled{opacity:.45;cursor:not-allowed}.ste-inherit{margin-right:auto;color:#bfdbfe}.sx.lt .ste-dialog,.sx.lt .ste-levels{background:#fff;color:#172033}.sx.lt .ste-header,.sx.lt .ste-footer{background:#f1f5f9}.sx.lt .ste-scope button,.sx.lt .ste-periods button,.sx.lt .ste-config select,.sx.lt .ste-band-grid input{background:#f1f5f9;color:#172033}.sx.lt .ste-scope button.active,.sx.lt .ste-periods button.active{background:#dbeafe;color:#1e40af}.sx.lt .ste-hint,.sx.lt .ste-config small,.sx.lt .ste-section-title p,.sx.lt .ste-band-grid span,.sx.lt .ste-band-grid small,.sx.lt .ste-scope small,.sx.lt .ste-header small,.sx.lt .ste-eyebrow{color:#475569}.sx.lt .ste-band-grid b{color:#334155}@media(max-width:700px){.ste-overlay{padding:8px}.ste-dialog{max-height:calc(100dvh - 16px)}.ste-header,.ste-body{padding:14px}.ste-header h2{font-size:19px}.ste-scope,.ste-config{grid-template-columns:1fr}.ste-band-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ste-section-title{flex-direction:column}.ste-footer{padding:12px;flex-wrap:wrap}.ste-inherit{width:100%;margin:0}.ste-periods button{flex-grow:1}}
</style>

<style>.ste-band-grid{grid-template-columns:repeat(auto-fit,minmax(130px,1fr))}.ste-band-grid input:disabled{opacity:.75;cursor:default}.ste-pending{flex-wrap:wrap}.ste-band-grid strong{font-size:18px}</style>
<style>.ste-source-note{padding:12px 16px;border:1px solid #56627a;border-radius:8px}.ste-source-note p{margin:4px 0}.ste-source-note small{color:#a8b9cf}.ste-warning-status{font-size:13px;margin-top:8px!important;color:#93c5fd}</style>
<style>
.ste-body .measurement-types{margin:0 0 16px}
.ste-band-grid{grid-template-columns:repeat(6,minmax(0,1fr))}
.ste-band-grid input{box-sizing:border-box}
@media(max-width:850px){.ste-band-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:550px){.ste-band-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
