<script setup>
import { computed, ref, onBeforeUnmount, nextTick } from 'vue';
import { rainfallResult } from '../rain-criteria.js';
const props = defineProps({ station: { type: Object, required: true }, compact: Boolean });
const opened = ref(false);
const selection = ref(null);
const selected = computed(() => selection.value || props.station);
const rangeOf = s => s.metric === 'rain' ? ({d1:'24h',d3:'72h',d5:'5d',d7:'7d',d15:'15d'})[s.period] : null;
const inlineResult = computed(() => rainfallResult(rangeOf(props.station),props.station.value,props.station.offline,'station'));
const inlineArea = computed(() => rainfallResult(rangeOf(props.station),props.station.value,props.station.offline,'area'));
const detailArea = computed(() => rainfallResult(rangeOf(selected.value),selected.value.value,selected.value.offline,'area'));
const areaCuts = computed(() => detailArea.value.criterion?.cuts.join(' / ') || 'ไม่มีเกณฑ์ช่วงนี้');
const detailResult = computed(() => rainfallResult(rangeOf(selected.value),selected.value.value,selected.value.offline,'station'));
const cuts = computed(() => detailResult.value.criterion?.cuts.join(' / ') || 'ไม่มีเกณฑ์ช่วงนี้ใน v56');
const trigger = ref(null);
const closeButton = ref(null);
const periods = { d1: '24 ชั่วโมง', d3: '3 วัน', d5: '5 วัน', d7: '7 วัน', d15: '15 วัน', m: 'รายเดือน', y: 'รายปี' };
const periodLabel = computed(() => selected.value.metric === 'rain' ? periods[selected.value.period] || 'ไม่ระบุช่วงสะสม' : 'ค่าล่าสุด');
const observation = computed(() => selected.value.offline ? 'ออฟไลน์ · ไม่มีข้อมูลพร้อมประเมิน' : selected.value.value == null ? 'ไม่มีข้อมูลพร้อมประเมิน' : `${selected.value.value} ${selected.value.unit || ''}`);
let previousOverflow;
function keydown(event) {
  if (event.key === 'Escape') { event.stopImmediatePropagation(); close(); }
  if (event.key === 'Tab') { event.preventDefault(); closeButton.value?.focus(); }
}
async function open() {
  selection.value = { ...props.station };
  previousOverflow = document.body.style.overflow;
  opened.value = true; document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', keydown, true);
  await nextTick(); closeButton.value?.focus();
}
function close() {
  opened.value = false; document.body.style.overflow = previousOverflow || '';
  window.removeEventListener('keydown', keydown, true); trigger.value?.focus();
}
onBeforeUnmount(() => { if (opened.value) close(); });
</script>

<template>
  <div :class="['criteria-inline', { 'criteria-compact': compact }]" @click.stop>
    <span class="criteria-type central" title="รายพื้นที่จำลอง: ต่ำกว่าค่ากลาง v56 20%">รายพื้นที่ <span :style="{color:inlineArea.color}">{{ inlineArea.label }}</span></span>
    <span class="criteria-type station" title="เกณฑ์รายสถานีจำลอง · ช่วงเฉพาะสถานีจำลอง">รายสถานี <span :style="{color:inlineResult.color}">{{ inlineResult.label }}</span></span>
    <button ref="trigger" type="button" class="criteria-open" :aria-label="`ดูผลประเมินเกณฑ์ ${station.name}`" @click="open">ดูผลจำลอง <span aria-hidden="true">↗</span></button>
  </div>
  <Teleport to="body">
    <div v-if="opened" class="criteria-backdrop" @click.self="close">
      <section class="criteria-dialog" role="dialog" aria-modal="true" aria-labelledby="criteria-heading" aria-describedby="criteria-description">
        <header class="criteria-header">
          <div><div class="criteria-eyebrow">ผลประเมินรายสถานี</div><h2 id="criteria-heading">{{ selected.name }}</h2><p>{{ selected.location }}</p></div>
          <button ref="closeButton" class="criteria-close" aria-label="ปิดผลประเมินเกณฑ์" @click="close">×</button>
        </header>
        <div class="criteria-body">
          <p id="criteria-description" class="criteria-explanation">ตรวจสอบเกณฑ์ที่ครอบคลุมสถานี และผลการเข้าเงื่อนไขของแต่ละเกณฑ์แยกกัน</p>
          <div class="criteria-observation"><div><span>{{ selected.metricLabel }} · {{ periodLabel }}</span><strong>{{ observation }}</strong></div><span class="criteria-demo">ข้อมูลสาธิตจากต้นฉบับ</span></div>
          <div class="criteria-pending"><span aria-hidden="true">ⓘ</span><div><strong>MOCKUP · ใช้ค่าเริ่มต้นจาก v56</strong><p>จำลองรายพื้นที่ให้มีจุดแบ่งต่ำกว่าค่ากลาง 20% ส่วนรายสถานีกำหนดช่วงเฉพาะ v56 เป็นฐาน ไม่สร้างการแจ้งเตือนจริง</p></div></div>
          <article class="criteria-section">
            <div class="criteria-section-head"><h3><span class="criteria-dot central"></span>เกณฑ์กลางตามพื้นที่</h3><span class="criteria-status">{{ detailArea.label }}</span></div>
            <p>เกณฑ์ที่ส่วนกลางกำหนดให้สถานีภายในจังหวัด อำเภอ หรือตำบลที่เลือก</p>
            <dl><div><dt>ชื่อเกณฑ์ / Area List</dt><dd>เกณฑ์กลางตามพื้นที่ · ลดจุดแบ่ง 20% (Mockup)</dd></div><div><dt>พื้นที่ที่ครอบคลุม</dt><dd>พื้นที่จำลอง · จ.{{ selected.province }}</dd></div><div><dt>สถานะการอยู่ในขอบเขต</dt><dd>สมมติให้อยู่ในพื้นที่สำหรับทดสอบ UI</dd></div><div><dt>ผลการเข้าเงื่อนไข</dt><dd>{{ periodLabel }} · จุดแบ่ง {{ areaCuts }} มม. · {{ detailArea.label }}</dd></div></dl>
          </article>
          <article class="criteria-section">
            <div class="criteria-section-head"><h3><span class="criteria-dot station"></span>เกณฑ์รายสถานี</h3><span class="criteria-status">{{ detailResult.label }}</span></div>
            <p>เกณฑ์ที่กำหนดเฉพาะสถานีตรวจวัดนี้</p>
            <dl><div><dt>ชื่อเกณฑ์รายสถานี</dt><dd>ค่าเริ่มต้น v56 · ช่วงเฉพาะสถานีจำลอง</dd></div><div><dt>ช่วงสะสม / ค่าจุดแบ่งระดับ</dt><dd>{{ periodLabel }} · จุดแบ่ง {{ cuts }} มม.</dd></div><div><dt>ผลการเข้าเงื่อนไข</dt><dd>{{ detailResult.label }} · ผลจำลอง</dd></div></dl>
          </article>
          <footer class="criteria-footnote"><strong>อยู่ในพื้นที่ ≠ เข้าเงื่อนไข</strong><p>ช่วงเกณฑ์: 24 ชม. / 3 วัน / 5 วัน / 7 วัน / 15 วัน · ค่าเกณฑ์หลายวันเป็น Mockup Draft / TBD · ทุกค่าเป็นต้นแบบ ไม่ใช่เกณฑ์ปฏิบัติการที่อนุมัติแล้ว</p></footer>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style>
#app .ex .ex-tr{height:150px}.criteria-inline{position:absolute;left:15px;right:12px;bottom:13px;display:flex;align-items:center;gap:6px;font-size:12px;line-height:21px;white-space:nowrap}.criteria-type{padding:1px 7px;border:1px solid #4b5563;border-radius:5px;background:#30333a;color:#dbe3ed;font-weight:500}.criteria-type.central{border-color:#365a83;background:#243348;color:#bed9ff}.criteria-type.station{border-color:#66517e;background:#382e43;color:#e2cef7}.criteria-type>span{margin-left:5px;color:#aeb8c8}.criteria-open{margin-left:auto;border:0;background:transparent;color:#93c5fd;font-size:12px;padding:3px 0;cursor:pointer}.criteria-open:hover{text-decoration:underline}.criteria-open:focus-visible{outline:2px solid #60a5fa;outline-offset:3px}.criteria-compact{position:static;padding-top:9px;flex-wrap:wrap;white-space:normal}.ib-list .criteria-compact .criteria-type{font-size:11px}.ex .ib-it{padding-bottom:8px}.criteria-alert-item{border-bottom:1px solid #404040;padding-bottom:8px;margin-bottom:7px}.criteria-alert-item .ib-it{width:100%;border-bottom:0;margin-bottom:0}.criteria-alert-item .criteria-inline{margin:0 12px}.lt .criteria-type{background:#f8fafc;color:#334155;border-color:#cbd5e1}.lt .criteria-type.central{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}.lt .criteria-type.station{background:#faf5ff;color:#7e22ce;border-color:#e9d5ff}.lt .criteria-open{color:#1d4ed8}
.criteria-backdrop{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Sarabun','Leelawadee UI',sans-serif;color:#e5e7eb;line-height:1.6}.criteria-dialog{width:min(840px,100%);max-height:calc(100dvh - 48px);overflow:auto;background:#22252b;border:1px solid #505866;border-radius:16px;box-shadow:0 28px 80px #0009}.criteria-header{position:sticky;top:0;z-index:1;padding:22px 26px;background:#292d34;border-bottom:1px solid #424954;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.criteria-eyebrow{color:#93c5fd;font-size:12px}.criteria-header h2{font-size:21px;margin:3px 0 5px}.criteria-header p{font-size:13px;color:#bac4d2;margin:0}.criteria-close{border:1px solid #525b69;border-radius:8px;background:#333944;color:#e5e7eb;width:34px;height:34px;font-size:24px;cursor:pointer;flex-shrink:0}.criteria-close:focus-visible{outline:2px solid #60a5fa;outline-offset:3px}.criteria-body{padding:20px 26px 26px}.criteria-explanation{margin:0 0 16px;font-size:13px;color:#c1cad8}.criteria-observation{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;border-radius:10px;background:#1b1e24;border:1px solid #404853}.criteria-observation div>span{display:block;font-size:12px;color:#aebdd0}.criteria-observation strong{font-size:24px;display:block;margin-top:3px}.criteria-demo{font-size:11px;background:#364152;color:#dae4f3;border-radius:5px;padding:4px 8px}.criteria-pending{display:flex;gap:10px;margin:16px 0;color:#d4dfed;padding:12px 14px;border-radius:8px;background:#2b3542;border:1px solid #46576b;font-size:13px}.criteria-pending p{margin:3px 0 0;font-size:12px;color:#bdcadd}.criteria-section{margin:18px 0 0;padding:18px;border:1px solid #424a57;border-radius:10px}.criteria-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.criteria-section h3{font-size:16px;margin:0;display:flex;align-items:center;gap:8px}.criteria-dot{width:10px;height:10px;border-radius:3px;display:inline-block}.criteria-dot.central{background:#60a5fa}.criteria-dot.station{background:#c084fc}.criteria-status{font-size:11px;color:#c0cbda;border:1px solid #5b6574;border-radius:20px;padding:2px 8px}.criteria-section>p{font-size:12px;color:#afbbcd;margin:7px 0 15px}.criteria-section dl{margin:0}.criteria-section dl>div{display:grid;grid-template-columns:190px 1fr;gap:12px;padding:8px 0;border-top:1px solid #383f4b;font-size:13px}.criteria-section dt{color:#9fadc1}.criteria-section dd{margin:0}.criteria-footnote{font-size:12px;color:#b9c6d7;margin-top:18px}.criteria-footnote p{margin:4px 0 0;color:#9fadc1}@media(max-width:600px){.criteria-backdrop{padding:10px}.criteria-dialog{max-height:calc(100dvh - 20px)}.criteria-header,.criteria-body{padding:16px}.criteria-section dl>div{grid-template-columns:1fr;gap:3px}.criteria-observation{align-items:flex-start;flex-direction:column}.criteria-section-head{align-items:flex-start;flex-direction:column}}
</style>
