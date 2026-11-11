<script setup>
defineProps({current:String,goMaster:Function,goCentral:Function});
</script>

<template>
  <details class="criteria-navigation" open>
    <summary>
      <svg class="criteria-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h4m4 0h10M3 12h10m4 0h4M3 19h4m4 0h10"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/></svg>
      <span>จัดการเกณฑ์การเตือนภัย</span>
      <svg class="criteria-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>
    </summary>
    <div class="criteria-items">
      <button type="button" :aria-current="current==='master'?'page':undefined" @click="goMaster?.()">ชื่อเกณฑ์และระดับการแจ้งเตือนภัย</button>
      <button v-if="goCentral" type="button" :aria-current="current==='central'?'page':undefined" @click="goCentral()">ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง</button>
    </div>
  </details>
</template>

<style scoped>
.criteria-navigation{--nav-bg:#18181b;--nav-border:#262626;--nav-text:#cbd5e1;--nav-muted:#94a3b8;--nav-active-bg:#172554;--nav-active:#bfdbfe;background:var(--nav-bg);border:1px solid var(--nav-border);border-radius:8px;padding:4px;min-width:0}
:global(.sx.lt .criteria-navigation){--nav-bg:#fafafa;--nav-border:#e4e4e7;--nav-text:#334155;--nav-muted:#64748b;--nav-active-bg:#dbeafe;--nav-active:#1e40af}
.criteria-navigation summary{display:flex;align-items:center;gap:10px;min-height:34px;padding:6px;color:var(--nav-muted);font-size:13px;line-height:20px;cursor:pointer;list-style:none;border:0;border-radius:5px;white-space:normal}
.criteria-navigation summary::-webkit-details-marker{display:none}
.criteria-symbol,.criteria-chevron{width:20px;height:20px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.criteria-chevron{width:16px;height:16px;margin-left:auto;transition:transform .15s}
.criteria-navigation:not([open]) .criteria-chevron{transform:rotate(-90deg)}
.criteria-items{margin:4px 0 2px 14px;border-left:2px solid #404040;display:grid;gap:2px}
.criteria-navigation .criteria-items button{position:relative;display:block;width:100%;min-height:36px;padding:8px 10px 8px 18px;border:0;border-radius:0 6px 6px 0;background:transparent;color:var(--nav-text);font:inherit;font-size:13px;line-height:20px;text-align:left;white-space:normal;cursor:pointer}
.criteria-navigation .criteria-items button:hover{background:var(--nav-border)}
.criteria-navigation .criteria-items button[aria-current=page]{background:var(--nav-active-bg);color:var(--nav-active);font-weight:600}
.criteria-items button[aria-current=page]::before{content:'';position:absolute;left:-2px;top:0;bottom:0;width:2px;background:#3b82f6}
.criteria-navigation :focus-visible{outline:2px solid #60a5fa;outline-offset:2px}
@media(prefers-reduced-motion:reduce){.criteria-chevron{transition:none}}
</style>
