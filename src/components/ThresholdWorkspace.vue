<script setup>
import { ref } from 'vue';
import BackofficeMenu from './BackofficeMenu.vue';
defineProps({ goMap: Function, goStations: Function, goLine: Function });
const frame = ref(null);
const logoUrl = import.meta.env.BASE_URL + 'assets/b820c1ee4f82dbfcefb07b5f5491f09e.png';
const theme = ref(localStorage.getItem('ndwc-station-theme') === 'light' ? 'light' : 'dark');
function applyTheme(value = theme.value) {
  theme.value = value;
  localStorage.setItem('ndwc-station-theme',value);
  frame.value?.contentDocument?.getElementById(value === 'light' ? 'sensorThemeLight' : 'sensorThemeDark')?.click();
}
</script>

<template>
  <div :class="['threshold-backoffice', {'threshold-light':theme === 'light'}]">
    <BackofficeMenu :go-light="() => applyTheme('light')" :go-dark="() => applyTheme('dark')" current="criteria" :go-map="goMap" :go-stations="goStations" :go-line="goLine" />
    <aside class="threshold-sidebar" aria-label="เมนู Backoffice">
      <div class="threshold-brand"><img :src="logoUrl" alt="ตราสัญลักษณ์ ปภ."><div><strong>ระบบบริหารจัดการ Sensor</strong><small>System Management Sensor</small></div></div>
      <nav aria-label="เมนูหลัก">
        <button @click="goMap">⌂ <span>หน้าแผนที่</span></button>
        <button @click="goStations">◉ <span>รายการสถานี Sensor</span></button>
        <button @click="goLine">♧ <span>จัดการการแจ้งเตือนไลน์</span></button>
        <button class="active" aria-current="page">☷ <span>จัดการเกณฑ์การตรวจวัด</span></button>
      </nav>
      <div class="threshold-sidebar-bottom">
        <div class="threshold-theme" role="group" aria-label="โหมดการแสดงผล">
          <button :aria-pressed="theme === 'light'" @click="applyTheme('light')">☼ สว่าง</button>
          <button :aria-pressed="theme === 'dark'" @click="applyTheme('dark')">☾ มืด</button>
        </div>
        <div class="threshold-account">Supervisor<small>ผู้ตรวจทานการตั้งค่า</small></div>
      </div>
    </aside>
    <main class="threshold-content">
      <header><div><p>Backoffice / จัดการเกณฑ์การตรวจวัด</p><h1>จัดการเกณฑ์การตรวจวัด</h1><span>กำหนด Profile เกณฑ์กลางตามพื้นที่ และเกณฑ์รายสถานีตรวจวัด</span></div><a href="./thresholds-v56.html" target="_blank" rel="noopener">เปิดเต็มหน้า ↗</a></header>
      <iframe ref="frame" title="กำหนดและปรับเกณฑ์การตรวจวัด NDWC v56" src="./thresholds-v56.html?embedded=1" @load="applyTheme()"></iframe>
    </main>
  </div>
</template>

<style>
.threshold-backoffice{position:fixed;inset:0;display:grid;grid-template-columns:280px minmax(0,1fr);background:#191919;color:#f8fafc;font-family:'Sarabun','Leelawadee UI',sans-serif;z-index:20}.threshold-sidebar{background:#101012;border-right:1px solid #303030;padding:18px 10px;display:flex;flex-direction:column}.threshold-brand{display:flex;gap:12px;align-items:center;padding:0 5px 28px}.threshold-brand img{width:32px;height:47px;object-fit:contain}.threshold-brand strong{font-size:15px}.threshold-brand small,.threshold-account small{display:block;font-size:12px;color:#9bb7dc;margin-top:4px}.threshold-sidebar nav{display:flex;flex-direction:column;gap:8px}.threshold-sidebar button{display:flex;gap:12px;align-items:center;background:transparent;border:0;color:#cbd5e1;font:inherit;font-size:14px;text-align:left;padding:14px 12px;border-radius:7px;cursor:pointer}.threshold-sidebar button:hover{background:#262626}.threshold-sidebar button.active{background:#1c2c5d;color:#bfdbfe}.threshold-account{margin-top:auto;padding:13px;background:#202023;border:1px solid #303030;border-radius:8px;font-size:14px}.threshold-content{display:flex;flex-direction:column;min-height:0;min-width:0}.threshold-content>header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;border-bottom:1px solid #333}.threshold-content h1{margin:4px 0;font-size:24px}.threshold-content header p{margin:0;color:#94a3b8;font-size:12px}.threshold-content header span{font-size:13px;color:#b5c2d5}.threshold-content header a{color:#bfdbfe;border:1px solid #475569;border-radius:7px;padding:9px 12px;text-decoration:none;font-size:13px;white-space:nowrap}.threshold-content iframe{flex:1;width:100%;border:0;background:#f5f7fb;min-height:0}@media(max-width:800px){.threshold-backoffice{grid-template-columns:190px minmax(0,1fr)}.threshold-brand strong{font-size:12px}.threshold-sidebar button{font-size:12px;padding:12px 6px}.threshold-content>header{padding:14px;align-items:flex-start}.threshold-content h1{font-size:18px}}
</style>
<style>
.threshold-sidebar-bottom{margin-top:auto;display:grid;gap:10px;padding-top:20px}.threshold-sidebar-bottom .threshold-account{margin-top:0}.threshold-theme{display:flex;padding:4px;border:1px solid #343434;border-radius:8px;background:#202023}.threshold-sidebar .threshold-theme button{flex:1;justify-content:center;padding:9px 5px;font-size:13px}.threshold-sidebar .threshold-theme button[aria-pressed=true]{background:#353535;color:#fff}.threshold-light{background:#f4f4f5;color:#0f172a}.threshold-light .threshold-sidebar{background:#fff;border-color:#e2e8f0}.threshold-light .threshold-sidebar button{color:#334155}.threshold-light .threshold-sidebar button:hover{background:#f1f5f9}.threshold-light .threshold-sidebar button.active{background:#dbeafe;color:#1d4ed8}.threshold-light .threshold-theme,.threshold-light .threshold-account{background:#f8fafc;border-color:#cbd5e1}.threshold-light .threshold-theme button[aria-pressed=true]{background:#dbeafe;color:#1d4ed8}.threshold-light .threshold-content>header{border-color:#e2e8f0}.threshold-light .threshold-content header span,.threshold-light .threshold-content header p,.threshold-light .threshold-brand small,.threshold-light .threshold-account small{color:#475569}.threshold-light .threshold-content header a{color:#1d4ed8;border-color:#cbd5e1}
</style>
