<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { RAIN_CRITERIA, RAIN_LEVELS, RAIN_COLORS } from '../rain-criteria.js';
import { thresholdSettings, effectiveThreshold, validCuts, saveThresholds, inheritThresholds, thresholdRange } from '../threshold-settings.js';
const props = defineProps({ station: Object, close: Function, saved: Function });
const period = ref('24h');
const current = ref(Object.fromEntries(Object.keys(RAIN_CRITERIA).map(key => [key, [...effectiveThreshold(props.station.code, key).cuts]])));
const error = ref('');
const dirty = ref(false);
const pending = ref(null);
const invalid = computed(() => Object.values(current.value).some(cuts => !validCuts(cuts)) || current.value['1h'].some((v,i)=>v >= current.value['24h'][i]));
const inherited = computed(() => !thresholdSettings.stations[props.station.code]?.rain);
const dialog = ref(null);
const origin = document.activeElement;
function update(index, event) { const key = thresholdRange(period.value); current.value[key][index] = event.target.value === '' ? null : Number(event.target.value); if(key==='24h'){ current.value.today=[...current.value['24h']]; current.value.yesterday=[...current.value['24h']]; } dirty.value = true; }
function close() {
  if (dirty.value) { pending.value = 'close'; return; }
  props.close();
}
function discard() {
  const target = pending.value;
  pending.value = null;
  if (target === 'inherit') { inherit(); return; }
  if (target === 'close') { props.close(); return; }

}
function save() {
  if (invalid.value) return;
  try { saveThresholds('station', props.station.code, JSON.parse(JSON.stringify(current.value))); props.saved('บันทึกเกณฑ์รายสถานีแล้ว'); }
  catch { error.value = 'บันทึกไม่ได้ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์'; }
}
function inherit() {
  try { inheritThresholds(props.station.code); props.saved('สถานีนี้ใช้เกณฑ์กลาง Default ของระบบแล้ว'); }
  catch { error.value = 'บันทึกไม่ได้ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์'; }
}
function keydown(event) {
  if (event.key === 'Escape') { event.stopPropagation(); close(); }
  if (event.key === 'Tab') {
    const elements = [...dialog.value.querySelectorAll('button:not(:disabled),input:not(:disabled),select')];
    const first = elements[0], last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
}
onMounted(async () => { await nextTick(); dialog.value.querySelector('button').focus(); });
onBeforeUnmount(() => origin?.focus());
</script>

<template>
  <div class="ste-overlay" @click.self="close" @keydown="keydown">
    <section ref="dialog" class="ste-dialog" role="dialog" aria-modal="true" aria-labelledby="ste-title">
      <header class="ste-header"><div><span class="ste-eyebrow">รายการสถานี / ตั้งค่าเกณฑ์</span><h2 id="ste-title">ตั้งค่าเกณฑ์การตรวจวัดและแจ้งเตือน</h2><p>{{ station.name }} <span class="ste-code">{{ station.code }}</span></p><small>{{ station.loc }}</small></div><button class="ste-icon" aria-label="ปิดการตั้งค่าเกณฑ์" @click="close">×</button></header>
      <div class="ste-body">
        <p class="ste-info">ⓘ ตั้งค่าเกณฑ์ที่เดียว ใช้ชุดเดียวกันสำหรับประเมินผลและเงื่อนไขแจ้งเตือน</p>
        <div class="ste-config"><label>ประเภทการตรวจวัด<select aria-label="ประเภทการตรวจวัด"><option value="rain">ปริมาณน้ำฝน (Rainfall) · มม.</option></select></label><div><span>เกณฑ์ที่สถานีนี้ใช้อยู่</span><strong>{{ inherited ? 'เกณฑ์กลาง (Default ระบบ)' : 'เกณฑ์รายสถานี' }}</strong><small>หากไม่ตั้งเกณฑ์รายสถานี ระบบจะใช้เกณฑ์กลาง Default</small></div></div>
        <div class="ste-periods" role="group" aria-label="ช่วงสะสมที่ต้องการตั้งเกณฑ์"><button v-for="(item,key) in RAIN_CRITERIA" :key="key" :class="{active:period===key}" :aria-pressed="period===key" @click="period=key">{{ item.label }}<span v-if="!validCuts(current[key])"> ⚠</span></button></div>
        <section class="ste-levels"><div class="ste-section-title"><div><h3>เกณฑ์ปริมาณน้ำฝน · {{ RAIN_CRITERIA[period].label }}</h3><p>กำหนดขอบบน 4 จุด แบ่งเป็น 5 ระดับ · หน่วย มม.</p></div><span class="ste-badge">ใช้ร่วมกับการแจ้งเตือน</span></div>
          <div class="ste-band-grid"><label v-for="(level,index) in RAIN_LEVELS" :key="level" :style="{'--level-color':RAIN_COLORS[index]}"><b>{{ level }}</b><template v-if="index<4"><span>{{ index ? '> '+(current[period][index-1]??'—')+' ถึง' : '> 0 ถึง' }}</span><input type="number" min="0.01" step="any" :aria-label="RAIN_CRITERIA[period].label+' ขอบบน '+level" :value="current[period][index]" @input="update(index,$event)"></template><template v-else><span>มากกว่า</span><strong>{{ current[period][3] ?? '—' }}</strong></template><small>มม.</small></label></div>
          <p v-if="invalid" class="ste-error" role="alert">กรุณากรอกค่ามากกว่า 0 เรียงจากน้อยไปมาก และกำหนดฝน 1 ชั่วโมงให้ต่ำกว่าฝน 24 ชั่วโมงทุกระดับ</p>
          <p class="ste-hint">ฝนวันนี้และฝนวานนี้ใช้เกณฑ์ร่วมกับฝน 24 ชม. แก้ช่วงใดช่วงหนึ่งจะเปลี่ยนทั้งสามช่วง · รวมค่าขอบบนในระดับนั้น · 0 มม. = ไม่มีฝน · ไม่มีข้อมูลหรือออฟไลน์ = ไม่ประเมิน</p>
        </section>
        <div class="ste-preview"><strong>เกณฑ์ชุดเดียวที่มีผลหลังบันทึก</strong><p>{{ station.name }} → {{ RAIN_CRITERIA[period].label }} → {{ current[period].map(v=>v??'—').join(' / ') }} มม.</p><span>การตรวจวัด → ประเมินระดับ → เงื่อนไขแจ้งเตือน → ช่องทางส่งที่หน้าจัดการการแจ้งเตือนไลน์</span></div>
        <p class="ste-hint">ข้อมูลต้นแบบ · บันทึกในเบราว์เซอร์นี้เท่านั้น ยังไม่เชื่อมระบบส่งแจ้งเตือนจริง · ช่วงเวลาฝนวันนี้/วานนี้อ้างอิง 07:00 น.</p>
        <p v-if="error" class="ste-error" role="alert">{{ error }}</p>
      </div>
      <footer v-if="pending" class="ste-footer ste-pending" role="alert"><p>{{ pending==='inherit' ? 'ยกเลิกเกณฑ์เฉพาะสถานีนี้และกลับไปใช้เกณฑ์กลาง Default ของระบบหรือไม่?' : 'มีค่าที่ยังไม่บันทึก ต้องการละทิ้งการแก้ไขหรือไม่?' }}</p><button class="ste-secondary" @click="pending=null">แก้ไขต่อ</button><button class="ste-primary" @click="discard">{{ pending==='inherit' ? 'ยืนยันใช้เกณฑ์กลาง Default' : 'ละทิ้งการแก้ไข' }}</button></footer>
      <footer v-else class="ste-footer"><button v-if="!inherited" class="ste-secondary ste-inherit" @click="pending='inherit'">กลับไปใช้เกณฑ์กลาง Default</button><button class="ste-secondary" @click="close">ยกเลิก</button><button class="ste-primary" :disabled="invalid" @click="save">บันทึกเกณฑ์</button></footer>
    </section>
  </div>
</template>

<style>
.ste-overlay{position:fixed;inset:0;background:#000b;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px}.ste-dialog{width:min(1060px,100%);max-height:calc(100dvh - 48px);display:flex;flex-direction:column;background:#191b20;border:1px solid #424753;border-radius:14px;box-shadow:0 24px 80px #0008;color:#f1f5f9;font:14px/1.6 Sarabun,sans-serif;overflow:hidden}.ste-dialog button,.ste-dialog input,.ste-dialog select{font:inherit}.ste-dialog button{cursor:pointer}.ste-dialog :focus-visible{outline:2px solid #60a5fa;outline-offset:3px}.ste-header{padding:20px 24px;border-bottom:1px solid #353945;display:flex;justify-content:space-between;gap:16px;background:#202329}.ste-header h2{font-size:22px;margin:3px 0 8px}.ste-header p{margin:0}.ste-header small,.ste-eyebrow{color:#a8b9cf}.ste-code{font-size:12px;padding:2px 8px;border:1px solid #526078;border-radius:4px;white-space:nowrap}.ste-icon{width:36px;height:36px;flex-shrink:0;border:1px solid #515968;border-radius:8px;background:#30353f;color:#fff;font-size:24px!important}.ste-body{padding:20px 24px;overflow:auto;display:flex;flex-direction:column;gap:16px;min-height:0}.ste-info,.ste-warning,.ste-preview{padding:12px 16px;border:1px solid #355786;background:#17273e;border-radius:8px;margin:0;color:#cce1ff}.ste-scope{padding:0;border:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:10px}.ste-scope legend{margin-bottom:8px;font-weight:600}.ste-scope button{background:#24272e;border:1px solid #515968;border-radius:9px;padding:12px 16px;text-align:left;color:#dbe4f2}.ste-scope button.active{border-color:#4a8cff;background:#172c54;box-shadow:inset 0 0 0 1px #4a8cff}.ste-scope strong,.ste-scope small{display:block}.ste-scope small{margin-top:4px;color:#a8bbd7}.ste-config{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center}.ste-config label{display:grid;gap:7px}.ste-config select{width:100%;background:#282c34;border:1px solid #586173;border-radius:6px;color:#fff;padding:10px}.ste-config>div{display:grid;gap:2px}.ste-config>div span,.ste-config small{color:#a8b9cf;font-size:12px}.ste-config strong{color:#93c5fd}.ste-warning{background:#332911;color:#f9dd94;border-color:#806221}.ste-warning p{margin:5px 0 0}.ste-periods{display:flex;flex-wrap:wrap;gap:7px}.ste-periods button{border:1px solid #4e586b;background:#242830;color:#cbd5e1;border-radius:7px;padding:8px 12px;min-height:40px}.ste-periods button.active{background:#2563eb;color:#fff;border-color:#60a5fa}.ste-levels{padding:16px;border:1px solid #404855;border-radius:10px;background:#15171c}.ste-section-title{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}.ste-section-title h3{font-size:16px;margin:0}.ste-section-title p,.ste-hint{font-size:12px;color:#a8b9cf;margin:5px 0 0}.ste-badge{border:1px solid #315d55;background:#13362c;color:#99e7cb;padding:4px 8px;font-size:11px;border-radius:20px;white-space:nowrap}.ste-band-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.ste-band-grid label{min-width:0;border:1px solid #434b59;border-top:4px solid var(--level-color);border-radius:7px;padding:12px;display:flex;flex-direction:column;gap:5px}.ste-band-grid b{color:var(--level-color);font-size:13px}.ste-band-grid span,.ste-band-grid small{font-size:12px;color:#a8b9cf}.ste-band-grid input{width:100%;min-width:0;color:#fff;background:#272c35;border:1px solid #6b778c;border-radius:5px;padding:8px}.ste-band-grid strong{font-size:24px;min-height:40px}.ste-preview strong{font-size:14px}.ste-preview p{margin:5px 0}.ste-preview>span{font-size:12px}.ste-error{color:#fca5a5;background:#411b22;padding:10px;border-radius:6px;margin:5px 0;font-size:13px}.ste-footer{display:flex;gap:8px;justify-content:flex-end;align-items:center;padding:14px 24px;border-top:1px solid #353945;background:#202329}.ste-primary,.ste-secondary{border:1px solid #555f70;border-radius:6px;padding:9px 16px;background:#303640;color:#e2e8f0;min-height:42px}.ste-primary{background:#2563eb;border-color:#2563eb;color:#fff}.ste-primary:disabled{opacity:.45;cursor:not-allowed}.ste-inherit{margin-right:auto;color:#bfdbfe}.sx.lt .ste-dialog,.sx.lt .ste-levels{background:#fff;color:#172033}.sx.lt .ste-header,.sx.lt .ste-footer{background:#f1f5f9}.sx.lt .ste-scope button,.sx.lt .ste-periods button,.sx.lt .ste-config select,.sx.lt .ste-band-grid input{background:#f1f5f9;color:#172033}.sx.lt .ste-scope button.active,.sx.lt .ste-periods button.active{background:#dbeafe;color:#1e40af}.sx.lt .ste-hint,.sx.lt .ste-config small,.sx.lt .ste-section-title p,.sx.lt .ste-band-grid span,.sx.lt .ste-band-grid small,.sx.lt .ste-scope small,.sx.lt .ste-header small,.sx.lt .ste-eyebrow{color:#475569}.sx.lt .ste-band-grid b{color:#334155}@media(max-width:700px){.ste-overlay{padding:8px}.ste-dialog{max-height:calc(100dvh - 16px)}.ste-header,.ste-body{padding:14px}.ste-header h2{font-size:19px}.ste-scope,.ste-config{grid-template-columns:1fr}.ste-band-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ste-section-title{flex-direction:column}.ste-footer{padding:12px;flex-wrap:wrap}.ste-inherit{width:100%;margin:0}.ste-periods button{flex-grow:1}}
</style>
