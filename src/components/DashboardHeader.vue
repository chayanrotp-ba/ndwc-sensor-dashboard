<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  current: { type: String, required: true },
  goMap: { type: Function, default: () => {} },
  goRainfall: { type: Function, default: () => {} },
  goDevices: { type: Function, default: () => {} },
  goAdmin: { type: Function, default: () => {} },
  theme: { type: String, default: 'dark' },
  setTheme: { type: Function, default: () => {} },
});
const emit = defineEmits(['fit']);
const fit = ref({ k: 1, x: 0, dw: 0 });
const menuOpen = ref(false);
const menuButton = ref(null);
const menuPosition = ref({ left: '0px', top: '0px' });
const notificationsOpen = ref(false);
const userMenuOpen = ref(false);

function updateFit() {
  const width = window.innerWidth || 1920;
  const height = window.innerHeight || 1080;
  const k = Math.min(width / 1920, height / 1080);
  const dw = Math.max(0, Math.floor(width / k - 1920));
  fit.value = { k, dw, x: dw ? 0 : Math.round((width - 1920 * k) / 2) };
  emit('fit', fit.value);
}
function choose(target) {
  menuOpen.value = false;
  if (target === 'rainfall' && props.current !== 'rainfall') props.goRainfall();
  if (target === 'devices' && props.current !== 'devices') props.goDevices();
}
function positionMenu() {
  if (!menuButton.value) return;
  const button = menuButton.value.getBoundingClientRect();
  menuPosition.value = {
    left: `${Math.max(8, Math.min(button.left, window.innerWidth - 243))}px`,
    top: `${button.bottom + 6}px`,
  };
}
function toggleMenu() {
  if (!menuOpen.value) positionMenu();
  menuOpen.value = !menuOpen.value;
}
function onPointerDown(event) {
  if (menuOpen.value && !menuButton.value?.contains(event.target) && !event.target.closest('.dashboard-choice-menu')) menuOpen.value = false;
}
function onKeyDown(event) {
  if (event.key === 'Escape') menuOpen.value = false;
}
function onResize() { updateFit(); if (menuOpen.value) positionMenu(); }
onMounted(() => {
  updateFit();
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', positionMenu, true);
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('keydown', onKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  window.removeEventListener('scroll', positionMenu, true);
  document.removeEventListener('pointerdown', onPointerDown);
  document.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <header class="ex-fit dashboard-source-fit" :class="{ lt: theme === 'light' }" :style="{ height: `${113 * fit.k}px` }">
    <div class="ex" :class="{ lt: theme === 'light' }" :style="{ width: `${1920 + fit.dw}px`, '--dw': `${fit.dw}px`, transform: `translate(${fit.x}px, 0) scale(${fit.k})` }">
      <img class="abs ex-logo" src="/assets/b820c1ee4f82dbfcefb07b5f5491f09e.png" alt="ตราสัญลักษณ์ ปภ.">
      <h1 class="abs ex-ttl">ระบบรวบรวมข้อมูลและติดตามสถานะ<br>ชุดอุปกรณ์ตรวจวัดสภาพแวดล้อม (Sensor)</h1>
      <nav class="ex-navw" aria-label="เมนูหลัก">
        <button type="button" class="abs ex-map-link" style="left:922px" aria-label="แผนที่" @click="goMap"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg><span>แผนที่</span></button>
        <button type="button" class="abs ex-nb" style="left:1054px" aria-label="จอแสดงผล"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8m-4-4v4"/></svg></button>
        <button ref="menuButton" type="button" class="abs ex-nb ex-current" style="left:1132px" aria-label="Dashboard" aria-haspopup="menu" :aria-expanded="menuOpen" @click="toggleMenu"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M4 16c2.5-6 5-9 8-9 2.5 0 3.5 3 6 4m-9 1 2 2"/></svg></button>
        <button type="button" class="abs ex-nb" style="left:1210px" aria-label="ตั้งค่า" @click="goAdmin"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>
      </nav>
      <button type="button" class="abs ex-bell" aria-label="การแจ้งเตือน" @click="notificationsOpen = !notificationsOpen"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m4.3 13a1.94 1.94 0 0 0 3.4 0"/></svg><span class="ex-bell-n">26</span></button>
      <button type="button" class="abs ex-theme" role="switch" :aria-checked="theme === 'light'" @click="setTheme(theme === 'light' ? 'dark' : 'light')"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg></button>
      <button type="button" class="abs ex-user" @click="userMenuOpen = !userMenuOpen"><span class="ex-av"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span><span style="flex:1"><span class="ex-un">ผู้ดูแลระบบ</span><span class="ex-ur">Super admin</span></span><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
    </div>
    <Teleport to="body">
      <div v-if="menuOpen" class="dashboard-choice-menu" :class="{ light: theme === 'light' }" :style="menuPosition" role="menu" aria-label="เลือก Dashboard">
        <button type="button" role="menuitem" :aria-current="current === 'rainfall' ? 'page' : undefined" @click="choose('rainfall')">สถานการณ์ฝน</button>
        <button type="button" role="menuitem" :aria-current="current === 'devices' ? 'page' : undefined" @click="choose('devices')">สถานะอุปกรณ์ Sensor</button>
      </div>
    </Teleport>
  </header>
</template>

<style scoped>
.dashboard-source-fit{overflow:visible;z-index:100}.dashboard-source-fit .ex{height:113px!important;overflow:visible}
.dashboard-source-fit svg.i{width:20px;height:20px}.dashboard-source-fit .ex-user svg.i{width:18px;height:18px}.dashboard-source-fit .ex-bell svg.i{width:22px;height:22px}
.dashboard-source-fit .ex-navw{left:calc(var(--dw,0px) / 2)}.dashboard-source-fit .ex-theme{left:calc(1661px + var(--dw,0px))}.dashboard-source-fit .ex-user{left:calc(1729px + var(--dw,0px))}.dashboard-source-fit .ex-bell{left:calc(1597px + var(--dw,0px))}
.dashboard-source-fit .ex-map-link{top:26px;width:120px;height:52px;border-radius:26px;background:#262626;display:flex;align-items:center;justify-content:center;gap:8px;color:#f8fafc;font-size:19px;font-weight:600}.dashboard-source-fit .ex-current{background:#404040;color:#f8fafc}
.dashboard-source-fit.lt .ex-map-link{background:#fff;color:#0f172a;box-shadow:0 0 0 1px #e2e8f0}.dashboard-source-fit.lt .ex-current{background:#dbeafe;color:#1d4ed8}
.dashboard-choice-menu{position:fixed;width:235px;z-index:2147483647;padding:6px;border:1px solid #465163;border-radius:10px;background:#20242d;box-shadow:0 12px 30px #0009}.dashboard-choice-menu button{display:block;width:100%;border:0;border-radius:7px;padding:11px 12px;text-align:left;background:transparent;color:#f8fafc;font:inherit;font-size:14px;cursor:pointer}.dashboard-choice-menu button:hover,.dashboard-choice-menu button[aria-current]{background:#284a82}.dashboard-choice-menu.light{background:#fff;border-color:#cbd5e1}.dashboard-choice-menu.light button{color:#172033}.dashboard-choice-menu.light button:hover,.dashboard-choice-menu.light button[aria-current]{background:#dbeafe}
</style>
