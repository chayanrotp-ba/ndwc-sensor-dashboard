<script setup>
import { ref } from 'vue';
const props = defineProps({goMap:Function,goStations:Function,goLine:Function,goCriteria:Function,goLight:Function,goDark:Function,current:String});
const menu=ref(null);
function navigate(action){menu.value.open=false;action?.();}
</script>
<template>
  <div class="bo-mobile-bar">
    <span>ระบบบริหารจัดการ Sensor</span>
    <details ref="menu" @keydown.esc="menu.open=false">
      <summary aria-label="เปิดเมนู Backoffice">☰ เมนู</summary>
      <nav aria-label="เมนู Backoffice สำหรับมือถือ">
        <button @click="navigate(goMap)">หน้าแผนที่</button>
        <button :aria-current="current==='stations'?'page':undefined" @click="navigate(goStations)">รายการสถานี Sensor</button>
        <button :aria-current="current==='line'?'page':undefined" @click="navigate(goLine)">จัดการการแจ้งเตือนไลน์</button>
        <button :aria-current="current==='criteria'?'page':undefined" @click="navigate(goCriteria)">จัดการเกณฑ์การตรวจวัด</button>
        <div class="bo-mobile-theme"><button v-if="goLight" @click="navigate(goLight)">☼ สว่าง</button><button v-if="goDark" @click="navigate(goDark)">☾ มืด</button></div>
      </nav>
    </details>
  </div>
</template>
<style>
.bo-mobile-bar{display:none}
@media(max-width:767px){.bo-mobile-bar{display:flex;position:absolute;top:0;left:0;right:0;height:56px;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;background:#15171c;color:#f8fafc;border-bottom:1px solid #414651;z-index:25;font:14px/20px 'Sarabun',sans-serif}.bo-mobile-bar summary{cursor:pointer;padding:8px;border:1px solid #586173;border-radius:7px;list-style:none;white-space:nowrap}.bo-mobile-bar summary::-webkit-details-marker{display:none}.bo-mobile-bar nav{position:absolute;top:56px;left:8px;right:8px;padding:8px;background:#1e232d;border:1px solid #586173;border-radius:8px;box-shadow:0 12px 24px #0008;display:grid;gap:4px}.bo-mobile-bar button{background:transparent;color:#e2e8f0;font:inherit;padding:12px;border:0;border-radius:6px;text-align:left;cursor:pointer;min-height:44px}.bo-mobile-bar button:hover,.bo-mobile-bar button[aria-current=page]{background:#1e3a8a}.bo-mobile-bar :focus-visible{outline:2px solid #60a5fa;outline-offset:2px}}
</style>
