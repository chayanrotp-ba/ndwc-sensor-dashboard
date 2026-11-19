<script setup>
import { computed } from 'vue';
import { WARNING_PERIODS, activeWarning, evaluateWarning, warningCustom, warningMaster } from '../warning-criteria.js';

const props = defineProps({ context: { type: Object, required: true } });
const periodAliases = { d1: '24h', d3: '72h' };
const period = computed(() => periodAliases[props.context.range] || props.context.range);
const supported = computed(() => Object.hasOwn(WARNING_PERIODS, period.value));
const levels = computed(() => {
  try { return supported.value ? warningMaster(period.value) : []; }
  catch { return []; }
});
const cuts = computed(() => {
  try { return supported.value && levels.value.length ? activeWarning(props.context.code, levels.value)[period.value] || [] : []; }
  catch { return []; }
});
const source = computed(() => warningCustom(props.context.code) ? 'Custom' : 'Default');
const sourceLabel = computed(() => source.value === 'Custom' ? 'เกณฑ์การเฝ้าระวังภัยรายสถานี (Custom)' : 'เกณฑ์การเฝ้าระวังภัย (ปภ.)');
const result = computed(() => {
  if (!supported.value || !levels.value.length) return { available: false };
  try { return evaluateWarning(props.context.code, period.value, props.context.value, levels.value); }
  catch { return { available: false }; }
});
const amount = computed(() => props.context.offline ? 'ออฟไลน์' : props.context.value == null ? 'ไม่มีข้อมูลช่วงนี้' : `${props.context.value.toLocaleString('en-US')} มม.`);
const bands = computed(() => levels.value.map((level, index) => ({
  label: level.name,
  color: level.color,
  range: index === 0 ? `ตั้งแต่ 0 ถึง ${cuts.value[0] ?? '—'} มม.` : index < cuts.value.length ? `มากกว่า ${cuts.value[index - 1]} ถึง ${cuts.value[index]} มม.` : `มากกว่า ${cuts.value.at(-1) ?? '—'} มม.`
})));
</script>

<template>
  <section class="criteria-comparison" aria-label="รายละเอียดเกณฑ์การเฝ้าระวังภัย">
    <header class="comparison-header"><h3><span aria-hidden="true">▤</span> เกณฑ์การเฝ้าระวังภัยที่ใช้ประเมิน</h3></header>
    <div class="comparison-periods" role="group" aria-label="ช่วงฝนสะสมเพื่อเปรียบเทียบเกณฑ์">
      <span>ช่วงฝนสะสม</span><button v-for="period in context.periods" :key="period.key" type="button" :aria-pressed="period.selected" :class="{ selected: period.selected }" @click="period.pick">{{ period.label }}</button>
    </div>
    <div v-if="context.dailyGroup" class="comparison-periods comparison-daily" role="group" aria-label="ตัวเลือกภายในกลุ่ม 24 ชั่วโมง"><button v-for="period in context.dailyOptions" :key="period.key" type="button" :aria-pressed="period.selected" :class="{selected:period.selected}" @click="period.pick">{{period.label}}</button><p>{{ context.dailyDescription }} · เวลาอ้างอิงของข้อมูลสาธิต</p></div>
    <div class="comparison-observation"><span>ฝนสะสมที่ใช้ประเมิน · {{ context.periodLabel }}</span><strong>{{ amount }}</strong></div>
    <article class="comparison-row warning-source">
      <header class="comparison-source"><span class="comparison-source-icon" aria-hidden="true">▥</span><div class="comparison-source-title"><strong>{{ sourceLabel }}</strong><span>{{ context.code }} · {{ source === 'Custom' ? 'ใช้ช่วงที่กำหนดเฉพาะสถานีนี้' : 'ใช้ช่วงเกณฑ์กลาง ปภ.' }}</span></div><span :class="['comparison-source-badge', source.toLowerCase()]">{{ source }}</span></header>
      <div class="comparison-result">
        <div v-if="result.available"><span class="comparison-state">ผลประเมินตามเกณฑ์ที่ใช้งานจริง</span><strong :style="{color:result.level.color}">{{ result.level.name }}</strong></div>
        <div v-else><span class="comparison-state">ยังไม่มีผลประเมินจากเกณฑ์ ปภ.</span><strong>ไม่รองรับช่วงนี้</strong></div>
        <div v-if="bands.length" class="comparison-bands warning-bands"><div v-for="band in bands" :key="band.label"><i :style="{background:band.color}"></i><span>{{ band.label }}</span><b>{{ band.range }}</b></div></div>
        <p>{{ bands.length ? 'ช่วงค่าด้านบนคือชุดเกณฑ์ที่ใช้ประเมินสถานีนี้จริง — หากเป็น Custom จะแทนที่ Default เฉพาะสถานีนี้' : 'เกณฑ์การเฝ้าระวังภัย ปภ. รองรับฝน 1 ชั่วโมง, วันนี้, วานนี้, 24 ชั่วโมง และ 3 วัน' }}</p>
      </div>
    </article>
    <p class="comparison-note" role="status"><span aria-hidden="true">ⓘ</span><span>ใช้ชุดเกณฑ์เดียวสำหรับแสดงระดับและประเมิน Trigger Alert ของสถานีในโครงการ</span></p>
  </section>
</template>

<style>
.ex .criteria-comparison{flex:none;border:1px solid #474747;background:#222;border-radius:12px;overflow:hidden;font-size:14px;line-height:21px}.ex .comparison-header{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid #404040;gap:12px}.ex .comparison-header h3{font-size:19px;line-height:26px;margin:0;display:flex;gap:10px;align-items:center}.comparison-demo{font-size:11px;line-height:18px;border:1px solid #525252;color:#b9c5d5;padding:1px 7px;border-radius:5px;white-space:nowrap}.comparison-periods{padding:12px 13px 7px;display:flex;align-items:center;gap:5px;flex-wrap:wrap}.comparison-periods>span{color:#b9c5d5;font-size:13px;margin-right:auto}.ex .comparison-periods button{border:1px solid #484848;background:#2a2a2a;color:#dbe5f1;border-radius:18px;padding:5px 10px;line-height:20px;font-size:13px}.ex .comparison-periods button.selected{background:#eff6ff;color:#172554;border-color:#60a5fa;box-shadow:0 0 0 2px #2563eb}.comparison-observation{display:flex;justify-content:space-between;gap:12px;padding:8px 16px 13px;color:#aebed3;font-size:13px}.comparison-observation strong{color:#f1f5f9;font-size:19px}.comparison-row{display:grid;grid-template-columns:240px 1fr;margin:0 12px 8px;border:1px solid #454545;border-radius:9px;overflow:hidden;min-width:0}.comparison-source{display:flex;align-items:center;gap:10px;padding:13px 12px;background:#253348;border-right:1px solid #46576c}.comparison-row.station .comparison-source{background:#393121;border-color:#675438}.comparison-source-icon{display:grid;place-items:center;width:38px;height:42px;background:#2563eb;border-radius:8px;font-size:28px;color:#fff;flex-shrink:0}.comparison-row.station .comparison-source-icon{background:#b7791f}.comparison-source strong{font-size:15px;display:block}.comparison-source div>span{font-size:12px;color:#c3cddd;display:block;margin-top:3px}.comparison-result{padding:10px 13px;min-width:0}.comparison-result>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:#aebdd0}.comparison-state{color:#dce5f0}.comparison-empty-scale{height:9px;border:1px dashed #657285;border-radius:10px;background:repeating-linear-gradient(135deg,#424954 0px,#424954 5px,#333a44 5px,#333a44 10px);margin:9px 0 6px}.ex .comparison-result p{font-size:11px;line-height:17px;color:#9fadc0}.ex .comparison-note{display:flex;gap:8px;margin:11px 12px 9px;padding:9px 11px;background:#223348;border:1px solid #3b608c;border-radius:7px;font-size:12px;line-height:19px;color:#bfdbfe}.ex .comparison-caption{font-size:11px;line-height:17px;color:#a5b4c7;padding:0 14px 12px}.ex.lt .criteria-comparison{background:#fff;border-color:#cbd5e1}.ex.lt .comparison-header{border-color:#e2e8f0}.ex.lt .comparison-source{background:#eff6ff;border-color:#bfdbfe}.ex.lt .comparison-row.station .comparison-source{background:#fffbeb;border-color:#fde68a}.ex.lt .comparison-row{border-color:#cbd5e1}.ex.lt .comparison-source div>span,.ex.lt .comparison-observation,.ex.lt .comparison-periods>span,.ex.lt .comparison-result>div:first-child,.ex.lt .comparison-result p,.ex.lt .comparison-caption{color:#475569}.ex.lt .comparison-observation strong,.ex.lt .comparison-state{color:#0f172a}.ex.lt .comparison-periods button{background:#f8fafc;color:#334155;border-color:#cbd5e1}.ex.lt .comparison-periods button.selected{background:#dbeafe;border-color:#3b82f6;color:#1e3a8a}.ex.lt .comparison-note{background:#eff6ff;color:#1e40af;border-color:#bfdbfe}.ex.lt .comparison-empty-scale{background:repeating-linear-gradient(135deg,#e2e8f0 0px,#e2e8f0 5px,#f8fafc 5px,#f8fafc 10px)}.ex .criteria-history{border:1px solid #474747;border-radius:12px;background:#222;padding:15px}.ex .criteria-history h3{font-size:17px;line-height:24px;margin:0 0 10px}.ex .criteria-history p{font-size:13px;line-height:21px;color:#b7c3d5}.ex .criteria-history small{display:block;margin-top:8px;color:#8fa0b8;font-size:11px;line-height:18px}.ex.lt .criteria-history{background:#fff;border-color:#cbd5e1}.ex.lt .criteria-history p,.ex.lt .criteria-history small{color:#475569}
</style>

<style>
.comparison-source-badge{flex:0 0 auto;padding:3px 8px;border:1px solid;border-radius:999px;font-size:11px;font-weight:700}.comparison-source-badge.default{border-color:#60a5fa;background:#1e3a5f;color:#dbeafe}.comparison-source-badge.custom{border-color:#f59e0b;background:#44260a;color:#fde68a}.warning-bands>div{position:relative;padding-top:7px}.warning-bands i{position:absolute;top:0;left:0;right:0;height:4px;border-radius:999px}.warning-bands b{font-size:9px;line-height:14px}.ex.lt .comparison-source-badge.default{background:#dbeafe;color:#1e3a8a}.ex.lt .comparison-source-badge.custom{background:#fef3c7;color:#92400e}
</style>
<style>.comparison-bands{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;margin:9px 0 6px;text-align:center}.comparison-bands span,.comparison-bands b{display:block;font-size:10px;line-height:16px}.comparison-bands span{color:#bdc9db}.comparison-bands b{color:#ecf2fb;font-weight:500}.comparison-scale{position:relative;display:flex;height:12px;border-radius:8px;margin:8px 0 12px}.comparison-scale>i{width:20%}.comparison-scale>i:first-child{border-radius:8px 0 0 8px}.comparison-scale>i:last-of-type{border-radius:0 8px 8px 0}.comparison-marker{position:absolute;top:50%;width:15px;height:15px;background:#fff;border:3px solid #162234;box-shadow:0 0 0 2px #fff;transform:translate(-50%,-50%);border-radius:50%}.ex.lt .comparison-bands span,.ex.lt .comparison-bands b{color:#334155}</style>
<style>.comparison-daily{margin:0 12px 8px;background:#263140;border:1px solid #465974;border-radius:8px}.comparison-daily p{width:100%;font-size:11px;color:#adbed4;padding:4px}.ex.lt .comparison-daily{background:#eff6ff}.ex.lt .comparison-daily p{color:#475569}</style>
<style>
.ex .comparison-row{display:block}
.ex .comparison-row>.comparison-source{border-right:0;list-style:none;cursor:pointer;gap:10px;min-height:60px;user-select:none}
.comparison-source::-webkit-details-marker{display:none}
.ex .comparison-row[open]>.comparison-source{border-bottom:1px solid #46576c}
.comparison-source-title{flex:1;min-width:0}
.comparison-summary-result{font-size:13px;font-weight:600;white-space:nowrap}
.comparison-toggle{display:flex;align-items:center;gap:6px;color:#cbd5e1;font-size:12px;white-space:nowrap;border:1px solid #66758b;border-radius:6px;padding:5px 9px}
.comparison-row[open] .when-collapsed,.comparison-row:not([open]) .when-expanded{display:none}
.comparison-row[open] .comparison-chevron{transform:rotate(180deg)}
.comparison-source:focus-visible{outline:2px solid #60a5fa;outline-offset:-3px}
.ex.lt .comparison-toggle{color:#334155;border-color:#94a3b8}
.ex .comparison-row>.comparison-result{padding:12px 15px}
@media(max-width:600px){.comparison-source{flex-wrap:wrap}.comparison-source-title{flex-basis:55%}.comparison-summary-result{margin-left:auto}.comparison-toggle{min-height:36px}}
</style>
