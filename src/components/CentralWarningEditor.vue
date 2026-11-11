<script setup>
import {ref, computed, watch} from 'vue';
import MeasurementRules from './MeasurementRules.vue';
import MeasurementTypes from './MeasurementTypes.vue';
const type = ref(0);
const otherDirty = ref(false);
import {WARNING_PERIODS, warningMaster, activeWarning, validWarning, saveCentralWarning} from '../warning-criteria.js';
const period = ref('24h');
const levels = ref([]);
const draft = ref(null);
const dirty = ref(false);
const message = ref('');
const masterNamesUrl = computed(() => {
  const url = new URL(import.meta.env.BASE_URL, location.origin);
  url.searchParams.set('category', 'warning');
  url.searchParams.set('measurement', String(type.value));
  url.searchParams.set('period', period.value);
  url.hash = 'stations/master';
  return url.href;
});
try {
  levels.value = warningMaster(period.value);
  draft.value = JSON.parse(JSON.stringify(activeWarning('', levels.value,{draft:true})));
} catch (error) {
  message.value = error.message;
}
watch(period,()=>{
  try{levels.value=warningMaster(period.value);}
  catch(failure){message.value=failure.message;}
});
const valid = computed(() => validWarning(draft.value, levels.value.length));
function cancelRainEdit() {
  try {
    draft.value = JSON.parse(JSON.stringify(activeWarning('', levels.value,{draft:true})));
    dirty.value = false;
    message.value = '';
  } catch (error) {
    message.value = error.message;
  }
}
function save() {
  try {
    saveCentralWarning(draft.value, levels.value);
    dirty.value = false;
    message.value = 'บันทึกแล้ว ทุกสถานีที่ใช้ Default จะใช้ช่วงค่าใหม่';
  } catch (error) {
    message.value = error.message;
  }
}
</script>
<template>
<section class="central-warning">
  <header><div class="central-crumb">หน้าแรก › จัดการเกณฑ์การเตือนภัย › ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง</div><h1>ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง</h1>
  <p>ใช้กับทุกสถานีที่เลือก Default ส่วนสถานี Custom ใช้เกณฑ์เฉพาะของตน</p>
  <small>ข้อมูลสาธิต · บันทึกในเบราว์เซอร์นี้</small></header>
  <div class="central-panel">
  <div class="central-master-link"><span>ชื่อและสีของระดับเตือนภัย</span><a :href="masterNamesUrl" target="_blank" rel="noopener" aria-label="แก้ไขชื่อเกณฑ์และสี (เปิดในแท็บใหม่)">แก้ไขชื่อเกณฑ์และสี ↗</a></div>
  <MeasurementTypes v-model="type" :disabled="dirty || otherDirty" />
<MeasurementRules v-if="type!==0" :key="type" :type="type"  @dirty="otherDirty=$event" />
<section v-else-if="draft" class="warning-form">
  <div class="ste-periods" role="group" aria-label="ช่วงฝนสะสม"><button v-for="(label,key) in WARNING_PERIODS" :key="key" :aria-pressed="period===key" :class="{active:period===key}" @click="period=key">{{label}}</button></div>
  <div class="ste-source-note">
    <strong>Warning DDPM Criteria — Default</strong>
    <p>เกณฑ์กลางของทั้งระบบ · ใช้กับสถานีที่เลือก Default</p>
    <small>กำหนดช่วงค่าจากเมนูเกณฑ์เตือนภัยกลาง</small>
  </div>
  <p class="ste-info">Warning DDPM ใช้ประเมินระดับเตือนภัยและเงื่อนไข Alert · ชื่อและสีอ้างอิง Master DDPMSOF-403</p>
  <section class="ste-levels">
    <div class="ste-section-title"><h3>{{ WARNING_PERIODS[period] }}</h3><span class="ste-badge">Default</span></div>
    <div class="ste-band-grid">
      <label v-for="(level,i) in levels" :key="level.id" :style="{'--level-color':level.color}">
        <b>{{ level.name }}</b>
        <span>{{ i ? '> '+draft[period][i-1] : 'ตั้งแต่ 0' }}{{i<levels.length-1?' ถึง':''}}</span>
        <input v-if="i<levels.length-1" v-model.number="draft[period][i]" type="number" step="any" :aria-label="'ขอบบนระดับ '+(i+1)" @input="dirty=true;message=''">
        <strong v-else>{{draft[period].at(-1)}}</strong>
        <small>มม.</small>
      </label>
    </div>
    <p class="ste-hint">รวมขอบบนในระดับนั้น ระดับถัดไปมากกว่าขอบเดิม จึงไม่มีช่องว่างหรือช่วงซ้อน · ฝนวันนี้ ฝนวานนี้ และฝน 24 ชั่วโมงกำหนดค่าแยกกัน</p>
    <p v-if="!valid" class="ste-error" role="alert">กรอกขอบบนทุกช่วงให้ครบ เป็นตัวเลขมากกว่า 0 เรียงจากน้อยไปมาก</p>
  </section>
  <div class="central-actions"><button v-if="dirty" class="ste-secondary" @click="cancelRainEdit">ยกเลิกการแก้ไข</button><button class="ste-primary" :disabled="!valid || !dirty" @click="save">บันทึกเกณฑ์กลาง</button></div>
</section>
  <p v-if="type===0" role="status">{{ message }}</p>
  </div>
</section>
</template>
<style scoped>
.central-warning{--central-bg:#191919;--central-surface:#0e0e10;--central-raised:#18181b;--central-field:#262626;--central-border:#303034;--central-text:#f8fafc;--central-muted:#94a3b8;--central-info:#172554;--central-info-border:#284b8e;--central-info-text:#bfdbfe;width:100%;min-width:0;box-sizing:border-box;padding:0 0 12px;font-size:14px;line-height:1.6;color:var(--central-text);background:var(--central-bg)}
:global(.sx.lt .central-warning){--central-bg:#f4f4f5;--central-surface:#fff;--central-raised:#fafafa;--central-field:#fff;--central-border:#e4e4e7;--central-text:#0f172a;--central-muted:#64748b;--central-info:#eff6ff;--central-info-border:#bfdbfe;--central-info-text:#1e40af}
.central-warning header{display:grid;gap:6px;margin-bottom:16px}
.central-crumb{font-size:13px;color:var(--central-muted);margin-bottom:2px}
.central-warning h1,.central-warning p{margin:0;line-height:1.55}
.central-warning h1{font-size:19px;line-height:24px;font-weight:600}
.central-warning header p{font-size:13px;color:var(--central-muted)}
.central-warning header small{font-size:12px;color:var(--central-muted)}
.central-panel{padding:16px;background:var(--central-surface);border:1px solid var(--central-border);border-radius:12px;min-width:0}
.central-master-link{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:16px;font-size:13px;color:var(--central-muted)}
.central-master-link a{color:var(--central-info-text);text-decoration:underline;text-underline-offset:3px;padding:6px 0}
.central-master-link a:hover{color:#60a5fa}
.central-master-link a:focus-visible{outline:2px solid #60a5fa;outline-offset:3px;border-radius:3px}
.warning-form{display:grid;gap:16px}
.central-warning .central-panel :deep(.measurement-types){margin:0 0 20px;color:var(--central-text)}
.central-warning .central-panel :deep(.measurement-types-list){gap:6px}
.central-warning .central-panel :deep(.measurement-types-label){font-size:13px}
.central-warning .central-panel :deep(.measurement-types-list button){min-height:36px;padding:0 14px;background:transparent;border-color:var(--central-border);color:var(--central-muted);font-size:13px;line-height:18px}
.central-warning .central-panel :deep(.measurement-types-list button:hover:not(:disabled)){background:var(--central-raised);color:var(--central-text);border-color:var(--central-muted)}
.central-warning .central-panel :deep(.measurement-types-list button.selected){background:#2563eb;border-color:#2563eb;color:#fff}
.central-warning .central-panel :deep(.ste-periods){gap:6px}
.central-warning .central-panel :deep(.ste-periods button){min-height:36px;padding:7px 12px;background:var(--central-raised);border-color:var(--central-border);color:var(--central-muted);font-size:13px;line-height:20px}
.central-warning .central-panel :deep(.ste-periods button.active){background:#2563eb;border-color:#2563eb;color:#fff}
.central-warning .central-panel :deep(.ste-source-note){background:var(--central-raised);border-color:var(--central-border);border-radius:8px;color:var(--central-text)}
.central-warning .central-panel :deep(.ste-source-note small),.central-warning .central-panel :deep(.ste-hint),.central-warning .central-panel :deep(.ste-band-grid span),.central-warning .central-panel :deep(.ste-band-grid small),.central-warning .central-panel :deep(.measurement-types small){color:var(--central-muted)}
.central-warning .central-panel :deep(.ste-info){background:var(--central-info);border-color:var(--central-info-border);color:var(--central-info-text);font-size:13px}
.central-warning .central-panel :deep(.ste-levels){background:var(--central-surface);border-color:var(--central-border);border-radius:10px}
.central-warning .central-panel :deep(.ste-band-grid){grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.central-warning .central-panel :deep(.ste-band-grid label){background:var(--central-raised);border-color:var(--central-border);border-top-color:var(--level-color);border-top-width:3px;border-radius:8px}
.central-warning .central-panel :deep(.ste-band-grid b){color:var(--central-text)}
.central-warning .central-panel :deep(.ste-band-grid input){min-height:36px;padding:7px 10px;border:1px solid #737373;background:var(--central-field);color:var(--central-text);border-radius:6px}
.central-warning .central-panel :deep(.ste-primary),.central-warning .central-panel :deep(.ste-secondary){min-height:40px;padding:8px 16px;font-size:13px;line-height:20px}
.central-warning .central-panel :deep(.ste-primary){background:#2563eb;border-color:#2563eb;color:#fff}
.central-warning .central-panel :deep(.ste-secondary){background:var(--central-raised);border-color:var(--central-border);color:var(--central-text)}
.central-warning .central-panel :deep(button:focus-visible),.central-warning .central-panel :deep(input:focus-visible){outline:2px solid #60a5fa;outline-offset:3px}
.central-warning .ste-source-note p{margin:4px 0}
.central-warning .ste-hint{margin-top:8px}
.central-warning input{box-sizing:border-box}
.central-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.central-warning [role=status]:not(:empty){margin-top:12px}
@media(max-width:550px){.central-panel{padding:12px}.central-actions button{width:100%}.central-warning .central-panel :deep(.ste-band-grid){grid-template-columns:repeat(2,minmax(0,1fr))}.central-warning .central-panel :deep(.ste-levels){padding:12px}.central-crumb{font-size:12px}}
</style>
