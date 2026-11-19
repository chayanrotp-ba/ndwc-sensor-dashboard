<script setup>
import { computed, ref, onBeforeUnmount, nextTick } from 'vue';
import { warningCustom } from '../warning-criteria.js';
const props = defineProps({ station: { type: Object, required: true }, compact: Boolean });
const opened = ref(false);
const showWarningSource = computed(() => props.station.criteriaMode === 'warning');
const custom = computed(()=>showWarningSource.value && (props.station.criteriaKind === 'custom' || warningCustom(props.station.code)));
const selection = ref(null);
const selected = computed(() => selection.value || props.station);
const trigger = ref(null);
const closeButton = ref(null);
const periods = { '1h':'ฝน 1 ชั่วโมง',today:'ฝนวันนี้',yesterday:'ฝนวานนี้',d1: '24 ชั่วโมง', d3: '3 วัน', d5: '5 วัน', d7: '7 วัน', d15: '15 วัน', m: 'รายเดือน', y: 'รายปี' };
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
    <span v-if="showWarningSource && custom" class="criteria-badge custom" title="สถานีนี้ใช้เกณฑ์เฉพาะสถานี">เกณฑ์การเฝ้าระวังภัยรายสถานี</span>
    <span v-else-if="showWarningSource" class="criteria-badge default" title="สถานีนี้ใช้เกณฑ์การเฝ้าระวังภัยกลาง ปภ.">เกณฑ์การเฝ้าระวังภัย (ปภ.)</span>
  </div>
</template>

<style>
#app .ex .ex-tr{height:150px}.criteria-inline{position:absolute;left:15px;right:12px;bottom:13px;display:flex;align-items:center;gap:6px;font-size:12px;line-height:21px;white-space:nowrap}.criteria-badge{padding:1px 8px;border-radius:9999px;font-size:11px;line-height:20px;font-weight:600;white-space:nowrap}.criteria-badge.custom{border:1px solid #2563eb;background:#101827;color:#dbeafe}.criteria-badge.default{border:1px solid #1d4ed8;background:#1e3a8a;color:#dbeafe}.criteria-compact{position:static;padding-top:9px;flex-wrap:wrap;white-space:normal}.ib-list .criteria-compact .criteria-badge{font-size:11px}.ex .ib-it{padding-bottom:8px}.criteria-alert-item{border-bottom:1px solid #404040;padding-bottom:8px;margin-bottom:7px}.criteria-alert-item .ib-it{width:100%;border-bottom:0;margin-bottom:0}.criteria-alert-item .criteria-inline{margin:0 12px}.lt .criteria-badge.custom{background:#eff6ff;color:#1d4ed8;border-color:#2563eb}.lt .criteria-badge.default{background:#1e40af;color:#eff6ff;border-color:#1d4ed8}
.criteria-backdrop{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Sarabun','Leelawadee UI',sans-serif;color:#e5e7eb;line-height:1.6}.criteria-dialog{width:min(840px,100%);max-height:calc(100dvh - 48px);overflow:auto;background:#22252b;border:1px solid #505866;border-radius:16px;box-shadow:0 28px 80px #0009}.criteria-header{position:sticky;top:0;z-index:1;padding:22px 26px;background:#292d34;border-bottom:1px solid #424954;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.criteria-eyebrow{color:#93c5fd;font-size:12px}.criteria-header h2{font-size:21px;margin:3px 0 5px}.criteria-header p{font-size:13px;color:#bac4d2;margin:0}.criteria-close{border:1px solid #525b69;border-radius:8px;background:#333944;color:#e5e7eb;width:34px;height:34px;font-size:24px;cursor:pointer;flex-shrink:0}.criteria-close:focus-visible{outline:2px solid #60a5fa;outline-offset:3px}.criteria-body{padding:20px 26px 26px}.criteria-explanation{margin:0 0 16px;font-size:13px;color:#c1cad8}.criteria-observation{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;border-radius:10px;background:#1b1e24;border:1px solid #404853}.criteria-observation div>span{display:block;font-size:12px;color:#aebdd0}.criteria-observation strong{font-size:24px;display:block;margin-top:3px}.criteria-demo{font-size:11px;background:#364152;color:#dae4f3;border-radius:5px;padding:4px 8px}.criteria-pending{display:flex;gap:10px;margin:16px 0;color:#d4dfed;padding:12px 14px;border-radius:8px;background:#2b3542;border:1px solid #46576b;font-size:13px}.criteria-pending p{margin:3px 0 0;font-size:12px;color:#bdcadd}.criteria-section{margin:18px 0 0;padding:18px;border:1px solid #424a57;border-radius:10px}.criteria-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.criteria-section h3{font-size:16px;margin:0;display:flex;align-items:center;gap:8px}.criteria-dot{width:10px;height:10px;border-radius:3px;display:inline-block}.criteria-dot.central{background:#60a5fa}.criteria-dot.station{background:#c084fc}.criteria-status{font-size:11px;color:#c0cbda;border:1px solid #5b6574;border-radius:20px;padding:2px 8px}.criteria-section>p{font-size:12px;color:#afbbcd;margin:7px 0 15px}.criteria-section dl{margin:0}.criteria-section dl>div{display:grid;grid-template-columns:190px 1fr;gap:12px;padding:8px 0;border-top:1px solid #383f4b;font-size:13px}.criteria-section dt{color:#9fadc1}.criteria-section dd{margin:0}.criteria-footnote{font-size:12px;color:#b9c6d7;margin-top:18px}.criteria-footnote p{margin:4px 0 0;color:#9fadc1}@media(max-width:600px){.criteria-backdrop{padding:10px}.criteria-dialog{max-height:calc(100dvh - 20px)}.criteria-header,.criteria-body{padding:16px}.criteria-section dl>div{grid-template-columns:1fr;gap:3px}.criteria-observation{align-items:flex-start;flex-direction:column}.criteria-section-head{align-items:flex-start;flex-direction:column}}
</style>

<style>.criteria-custom,.criteria-source.default{border-color:#b87924!important;background:#4a351c!important;color:#ffdc94!important}.criteria-source.custom{border-color:#66517e!important;background:#382e43!important;color:#e2cef7!important}.criteria-inline{flex-wrap:wrap}.criteria-inline .criteria-custom,.criteria-inline .criteria-source{font-size:11px}</style>
