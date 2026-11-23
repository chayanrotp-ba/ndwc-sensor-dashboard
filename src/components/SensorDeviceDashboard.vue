<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { DEVICE_STATUS, SENSOR_TYPES, filterDemoSensors, makeDemoSensors } from '../sensor-device-demo.js';
import sensorMarkerUrl from '../assets/sensor-marker.png';
import DashboardHeader from './DashboardHeader.vue';

const props = defineProps({
  goMap: { type: Function, default: () => {} },
  goRainfall: { type: Function, default: () => {} },
  goAdmin: { type: Function, default: () => {} },
  theme: { type: String, default: 'dark' },
  setTheme: { type: Function, default: () => {} },
});
const openedAt = Date.now();
const stations = makeDemoSensors(openedAt);
const fallbackLocationCount = stations.filter(item => item.coordinateSource === 'inside-tambon-fallback').length;
const filters = reactive({ query: '', province: '', district: '', tambon: '', agency: '', type: '', status: '' });
const filtered = computed(() => filterDemoSensors(stations, filters));
// Keep the summary counts stable when a status card filters the list.
const summaryStations = computed(() => filterDemoSensors(stations, { ...filters, status: '' }));
const provinces = [...new Set(stations.map(item => item.province))].sort((a, b) => a.localeCompare(b, 'th'));
const districts = computed(() => [...new Set(stations.filter(item => !filters.province || item.province === filters.province).map(item => item.district))].sort((a, b) => a.localeCompare(b, 'th')));
const tambons = computed(() => [...new Set(stations.filter(item => (!filters.province || item.province === filters.province) && (!filters.district || item.district === filters.district)).map(item => item.subdistrict))].sort((a, b) => a.localeCompare(b, 'th')));
const types = SENSOR_TYPES.map(item => item.name);
const agencies = [...new Set(stations.map(item => item.agency))];
const selected = ref(null);
const mapHost = ref(null);
const mapError = ref(false);
const mapReady = ref(false);
const legendOpen = ref(true);
const basemap = ref('dark');
const basemapOpen = ref(false);
let mapView;
let markerLayer;
let Graphic;
let Point;
let BasemapClass;
let darkBasemap;
let markerIcons = {};
const MAP_MARKER_SIZE = 14;

const basemapOptions = [
  { key: 'terrain', name: 'ภูมิประเทศ', thumb: '/assets/dd65fa0593bd6884efcd4d08f98989bd.jpg' },
  { key: 'satellite', name: 'ดาวเทียม', thumb: '/assets/fda0c868746f83417d225dce8e2ecd1d.jpg' },
  { key: 'dark', name: 'โหมดมืด', thumb: '/assets/a7aeb2c182daa3c59feb302d1ba42a22.jpg' },
];

const counts = computed(() => Object.fromEntries(Object.keys(DEVICE_STATUS).map(key => [key, summaryStations.value.filter(item => item.status === key).length])));
const selectedReadings = computed(() => selected.value?.measurements.filter(item => !filters.type || item.type === filters.type) ?? []);
const typeCounts = computed(() => {
  const scopedStations = filterDemoSensors(stations, { ...filters, status: '', type: '' });
  return Object.fromEntries(types.map(type => [type, scopedStations.filter(item => item.type === type).length]));
});
const lastTime = station => station.lastReceived ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(station.lastReceived)) : 'ไม่มีข้อมูลตัวอย่าง';
const ageText = station => station.gapMinutes === null ? '—' : `${station.gapMinutes} นาที`;
function resetFilters() { Object.assign(filters, { query: '', province: '', district: '', tambon: '', agency: '', type: '', status: '' }); }
function toggleStatusFilter(status) { filters.status = filters.status === status ? '' : status; }
function chooseBasemap(key) { basemap.value = key; basemapOpen.value = false; }
function selectStation(station, move = true) {
  selected.value = station;
  if (move && mapView) mapView.goTo({ center: [station.lon, station.lat], zoom: 9 }, { duration: 450 }).catch(() => {});
}

async function prepareMarkerIcons() {
  const image = new Image();
  image.src = sensorMarkerUrl;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable for the Sensor marker icon');
  const icons = {};
  for (const [status, definition] of Object.entries(DEVICE_STATUS)) {
    context.clearRect(0, 0, 24, 24);
    // Keep the same visual language as the reference: a status-colored disk,
    // with the white sensor glyph centered inside it.
    const markerColor = status === 'abnormal' ? DEVICE_STATUS.normal.color : definition.color;
    context.fillStyle = markerColor;
    context.beginPath();
    context.arc(12, 12, 11, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#fff';
    context.lineWidth = 1.5;
    context.stroke();
    context.globalCompositeOperation = 'source-over';
    context.drawImage(image, 4.5, 4.5, 15, 15);

    // Abnormal devices retain the normal green sensor marker and carry the
    // yellow warning badge shown in the supplied reference image.
    if (status === 'abnormal') {
      context.fillStyle = definition.color;
      context.strokeStyle = '#fff';
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(18.1, 1.2);
      context.lineTo(23.1, 10.1);
      context.quadraticCurveTo(23.5, 11, 22.5, 11);
      context.lineTo(13.8, 11);
      context.quadraticCurveTo(12.8, 11, 13.3, 10.1);
      context.lineTo(18.1, 1.2);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillStyle = '#20242b';
      context.beginPath();
      context.roundRect(17.55, 4.1, 1.15, 3.7, 0.55);
      context.fill();
      context.beginPath();
      context.arc(18.12, 9.1, 0.65, 0, Math.PI * 2);
      context.fill();
    }
    icons[status] = canvas.toDataURL('image/png');
  }
  context.globalCompositeOperation = 'source-over';
  return icons;
}

function loadArcgis() {
  if (window.require?.toUrl) return Promise.resolve(window.require);
  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-device-arcgis]')) {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://js.arcgis.com/4.31/esri/themes/dark/main.css'; css.dataset.deviceArcgis = 'true'; document.head.appendChild(css);
    }
    let script = document.querySelector('script[data-basin-arcgis],script[data-device-arcgis]');
    if (!script) { script = document.createElement('script'); script.src = 'https://js.arcgis.com/4.31/'; script.dataset.deviceArcgis = 'true'; document.head.appendChild(script); }
    script.addEventListener('load', () => resolve(window.require), { once: true });
    script.addEventListener('error', () => reject(new Error('ArcGIS unavailable')), { once: true });
    if (window.require?.toUrl) resolve(window.require);
  });
}
function drawMarkers() {
  if (!markerLayer || !Graphic || !Point) return;
  markerLayer.removeAll();
  filtered.value.forEach(station => {
    markerLayer.add(new Graphic({
      geometry: new Point({ longitude: station.lon, latitude: station.lat }),
      attributes: { code: station.code, status: station.status, markerColor: DEVICE_STATUS[station.status].color },
      symbol: { type: 'picture-marker', url: markerIcons[station.status], width: `${MAP_MARKER_SIZE}px`, height: `${MAP_MARKER_SIZE}px` },
    }));
  });
}
async function initMap() {
  try {
    markerIcons = await prepareMarkerIcons();
    const requireEsri = await loadArcgis();
    const [Map, MapView, GraphicsLayer, GraphicModule, PointModule, VectorTileLayer, Basemap] = await new Promise((resolve, reject) => requireEsri([
      'esri/Map', 'esri/views/MapView', 'esri/layers/GraphicsLayer', 'esri/Graphic', 'esri/geometry/Point', 'esri/layers/VectorTileLayer', 'esri/Basemap',
    ], (...items) => resolve(items), reject));
    if (!mapHost.value) return;
    Graphic = GraphicModule; Point = PointModule; BasemapClass = Basemap;
    markerLayer = new GraphicsLayer({ title: 'สถานะอุปกรณ์ Sensor ตัวอย่าง' });
    darkBasemap = new BasemapClass({ baseLayers: [new VectorTileLayer({ portalItem: { id: 'b36501bed2304f8b96641bc1119c3ab4' } })] });
    const map = new Map({ basemap: darkBasemap, layers: [markerLayer] });
    mapView = new MapView({ container: mapHost.value, map, center: [101.25, 13.6], zoom: 4.5, constraints: { minZoom: 4, maxZoom: 13 }, ui: { components: ['attribution', 'zoom'] } });
    await mapView.when();
    if (basemap.value !== 'dark') mapView.map.basemap = basemap.value === 'satellite' ? 'satellite' : 'topo-vector';
    mapView.on('click', async event => {
      const hit = await mapView.hitTest(event);
      const code = hit.results.find(result => result.graphic?.attributes?.code)?.graphic.attributes.code;
      const station = stations.find(item => item.code === code);
      if (station) selectStation(station, false);
    });
    mapReady.value = true;
    drawMarkers();
  } catch (error) { console.warn('Sensor device map unavailable:', error); mapError.value = true; }
}
watch(filtered, () => {
  if (selected.value && !filtered.value.includes(selected.value)) selected.value = null;
  drawMarkers();
});
watch(selected, drawMarkers);
watch(basemap, key => {
  if (!mapView || !darkBasemap) return;
  mapView.map.basemap = key === 'dark' ? darkBasemap : key === 'satellite' ? 'satellite' : 'topo-vector';
});
onMounted(initMap);
onBeforeUnmount(() => { mapView?.destroy(); mapView = null; markerLayer = null; });
</script>

<template>
  <main class="device-dashboard" :class="{ light: theme === 'light' }">
    <DashboardHeader current="devices" :go-map="goMap" :go-rainfall="goRainfall" :go-admin="goAdmin" :theme="theme" :set-theme="setTheme" />

    <section class="device-filters" aria-label="กรองสถานี Sensor">
        <label><span class="device-filter-label">ลุ่มน้ำ</span><select aria-label="ลุ่มน้ำ" disabled title="ข้อมูลตัวอย่างยังไม่มีรหัสลุ่มน้ำ"><option>ลุ่มน้ำทั้งหมด</option></select></label>
        <label><span class="device-filter-label">จังหวัด</span><select v-model="filters.province" aria-label="จังหวัด" @change="filters.district = ''; filters.tambon = ''"><option value="">จังหวัดทั้งหมด</option><option v-for="item in provinces" :key="item">{{ item }}</option></select></label>
        <label><span class="device-filter-label">อำเภอ</span><select v-model="filters.district" aria-label="อำเภอ" @change="filters.tambon = ''"><option value="">อำเภอทั้งหมด</option><option v-for="item in districts" :key="item">{{ item }}</option></select></label>
        <label><span class="device-filter-label">ตำบล</span><select v-model="filters.tambon" aria-label="ตำบล"><option value="">ตำบลทั้งหมด</option><option v-for="item in tambons" :key="item">{{ item }}</option></select></label>
        <button type="button" aria-label="ล้างตัวกรอง" @click="resetFilters"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M6 9h8m-6 4h4"/></svg><span>ล้างตัวกรอง</span></button>
    </section>
    <div class="device-grid">
      <section class="device-map-panel" aria-label="แผนที่ Sensor ตัวอย่าง">
        <div ref="mapHost" class="device-map"></div>
        <div v-if="!mapReady" class="device-map-message">{{ mapError ? 'แผนที่ยังไม่พร้อม — ใช้รายการสถานีด้านขวาได้' : 'กำลังโหลดแผนที่...' }}</div>
        <section class="device-map-legend" :class="{ collapsed: !legendOpen }" aria-label="Legend สถานะอุปกรณ์บนแผนที่">
          <button class="device-map-legend-toggle" type="button" :aria-expanded="legendOpen" :aria-label="legendOpen ? 'ย่อ Legend สถานะอุปกรณ์' : 'เปิด Legend สถานะอุปกรณ์'" @click="legendOpen = !legendOpen">
            <b>สถานะอุปกรณ์</b><span>{{ legendOpen ? '⌄' : '⌃' }}</span>
          </button>
          <div v-if="legendOpen" class="device-map-legend-body">
            <span class="device-map-legend-hint">กดเพื่อกรอง</span>
            <button v-for="key in ['normal', 'abnormal', 'offline', 'frequent']" :key="key" type="button" class="device-map-legend-item" :class="{ active: filters.status === key }" :aria-pressed="filters.status === key" @click="toggleStatusFilter(key)">
              <svg v-if="key === 'abnormal'" class="device-map-warning" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8 19 17.5H1z" :fill="DEVICE_STATUS[key].color" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/><path d="M10 6.4v5.2m0 2.5v.1" stroke="#1d1e21" stroke-width="1.8" stroke-linecap="round"/></svg>
              <i v-else :style="{ background: DEVICE_STATUS[key].color }"></i><span>{{ DEVICE_STATUS[key].label }}</span><b>{{ counts[key] }}</b>
            </button>
          </div>
        </section>
        <div class="device-basemap-control" aria-label="เลือก Basemap">
          <div v-if="basemapOpen" class="device-basemap-options">
            <button v-for="item in basemapOptions" :key="item.key" type="button" :class="{ active: basemap === item.key }" :aria-pressed="basemap === item.key" @click="chooseBasemap(item.key)"><img :src="item.thumb" :alt="item.name"><span>{{ item.name }}</span><small v-if="item.key === 'dark'">ค่าเริ่มต้น</small></button>
          </div>
          <button type="button" class="device-basemap-current" :aria-expanded="basemapOpen" aria-label="เปลี่ยน Basemap" @click="basemapOpen = !basemapOpen"><img :src="basemapOptions.find(item => item.key === basemap)?.thumb" alt=""><span>{{ basemapOptions.find(item => item.key === basemap)?.name }}</span></button>
        </div>
        <div class="device-map-caption">พิกัดอ้างอิงอยู่ในขอบเขตตำบล · {{ fallbackLocationCount }} จุดใช้จุดอ้างอิงภายในตำบล</div>
      </section>
      <div class="device-content-panel">
        <div class="device-intro">
          <div><p>DEVICE STATUS MONITOR · 70 ตำบลตามรายการอ้างอิง</p><h1>ติดตามสถานะอุปกรณ์ Sensor</h1><span>ตรวจจุดที่ขาดข้อมูลและส่งข้อมูลล่าช้า โดยแยกจากระดับเตือนภัยฝน</span></div>
          <div class="device-demo-note"><strong>สถานะอุปกรณ์เป็นข้อมูลจำลอง</strong><span>พิกัดอ้างอิงจากรายการสถานีและอยู่ในขอบเขตตำบล</span></div>
        </div>
        <section class="device-summary" aria-label="สรุปสถานะอุปกรณ์ตามตัวกรองพื้นที่">
          <button type="button" class="device-summary-card" :class="{ active: !filters.status }" aria-label="แสดง Sensor ทุกสถานะ" :aria-pressed="!filters.status" @click="toggleStatusFilter('')"><span>จำนวน Sensor</span><strong data-testid="device-total">{{ summaryStations.length }}</strong><small>ตามตัวกรองพื้นที่</small></button>
          <button v-for="key in ['normal','offline','abnormal','frequent']" :key="key" type="button" class="device-summary-card" :class="{ active: filters.status === key }" :style="{ '--status': DEVICE_STATUS[key].color }" :aria-label="`${DEVICE_STATUS[key].label} ${counts[key]} จุด${key === 'frequent' ? ' · ตั้งแต่ 5 ครั้งใน 7 วัน' : ''}`" :aria-pressed="filters.status === key" @click="toggleStatusFilter(key)"><span>{{ DEVICE_STATUS[key].label }}</span><strong :data-testid="`count-${key}`">{{ counts[key] }}</strong><small>{{ key === 'frequent' ? 'ตั้งแต่ 5 ครั้ง / 7 วัน' : 'จุด' }}</small></button>
        </section>
        <section class="device-type-summary" aria-label="จำนวนอุปกรณ์แยกตามประเภท Sensor">
          <div class="device-type-heading"><b>ประเภท Sensor</b><span>รองรับ {{ types.length }} ประเภท · กดเพื่อกรอง</span></div>
          <div class="device-type-list">
            <button v-for="type in types" :key="type" type="button" :aria-pressed="filters.type === type" :class="{ active: filters.type === type }" @click="filters.type = filters.type === type ? '' : type"><span>{{ type }}</span><b>{{ typeCounts[type] }}</b></button>
          </div>
        </section>
        <section class="device-list-panel" aria-label="รายการ Sensor ตามสถานะ">
        <div class="device-list-head"><div><h2>รายการอุปกรณ์ที่ต้องตรวจสอบ</h2><p>เรียงออฟไลน์และผิดปกติบ่อยก่อน · แสดง {{ filtered.length }} จุด</p></div><span>ข้อมูลจำลอง</span></div>
        <div class="device-list" data-testid="device-list">
          <button v-for="station in filtered" :key="station.code" type="button" class="device-row" :class="{ selected: selected?.code === station.code }" @click="selectStation(station)">
            <span class="device-status-dot" :style="{ background: DEVICE_STATUS[station.status].color }"></span>
            <span class="device-row-main"><strong>{{ station.name }}</strong><small>{{ station.code }} · ต.{{ station.subdistrict }} อ.{{ station.district }} จ.{{ station.province }} · รองรับ {{ types.length }} ประเภท</small></span>
            <span class="device-row-side"><b :style="{ color: DEVICE_STATUS[station.status].color }">{{ DEVICE_STATUS[station.status].label }}</b><small>{{ station.gapMinutes === null ? '—' : `ล่าสุด ${ageText(station)}ก่อน` }}</small></span>
          </button>
          <p v-if="!filtered.length" class="device-empty">ไม่พบอุปกรณ์ตามตัวกรอง</p>
        </div>
        </section>
        <section v-if="selected" class="device-detail" aria-label="รายละเอียดอุปกรณ์ที่เลือก">
          <div class="device-detail-title"><div><span>รายละเอียด Sensor</span><h2>{{ selected.name }}</h2></div><button type="button" aria-label="ปิดรายละเอียด" @click="selected = null">×</button></div>
          <div class="device-detail-grid"><div><small>รหัส</small><strong>{{ selected.code }}</strong></div><div><small>สถานะอุปกรณ์</small><strong :style="{ color: DEVICE_STATUS[selected.status].color }">{{ DEVICE_STATUS[selected.status].label }}</strong></div><div><small>ตำแหน่งตามรายการอ้างอิง</small><strong>ต.{{ selected.subdistrict }} อ.{{ selected.district }} จ.{{ selected.province }}</strong></div><div><small>รับข้อมูลล่าสุด</small><strong>{{ lastTime(selected) }}</strong></div><div><small>ความผิดปกติใน 7 วัน (ตัวอย่าง)</small><strong>{{ selected.gapEvents7d }} ครั้ง</strong></div><div><small>หน่วยงานดูแล</small><strong>{{ selected.agency }}</strong></div><div><small>ผู้ประสานงาน (ข้อมูลตัวอย่าง)</small><strong>{{ selected.coordinator }}</strong></div><div><small>เบอร์โทร (ข้อมูลตัวอย่าง)</small><strong>{{ selected.contactPhone }}</strong></div></div>
          <section class="device-readings" aria-label="ค่าล่าสุดของ Sensor ทั้ง 9 ประเภท"><header><b>ค่าล่าสุดตัวอย่าง · {{ filters.type || `${types.length} ประเภทที่รองรับ` }}</b><span>ข้อมูลจำลอง</span></header><div class="device-reading-grid"><article v-for="reading in selectedReadings" :key="reading.type"><small>{{ reading.type }}</small><strong>{{ reading.value }}</strong></article></div></section>
          <p>สถานะ เวลา และค่าที่แสดงเป็นข้อมูลสมมติ เกณฑ์ล่าช้าและขาดข้อมูลต้องยืนยันกับผู้ดูแลระบบก่อนใช้ข้อมูลจริง</p>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.device-dashboard{--bg:#111214;--panel:#1b1d22;--panel2:#232833;--line:#353b47;--text:#f5f7fa;--muted:#9ca9bd;min-height:100vh;background:var(--bg);color:var(--text);font-family:Sarabun,Arial,sans-serif;padding-bottom:20px}
.device-dashboard.light{--bg:#f3f5f8;--panel:#fff;--panel2:#ebf0f7;--line:#d4dce8;--text:#172033;--muted:#61728a}
.device-dashboard *{box-sizing:border-box}.device-dashboard button,.device-dashboard input,.device-dashboard select{font:inherit}.device-dashboard button{cursor:pointer}
.device-header{min-height:100px;background:#191919;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:12px 28px;border-bottom:1px solid #292c32}.light .device-header{background:#fff;border-color:var(--line)}
.device-brand{display:flex;align-items:center;gap:14px;min-width:0}.device-brand img{width:34px;height:52px;object-fit:contain}.device-brand strong{font-size:17px;line-height:1.35}
.device-topnav{display:flex;gap:8px;align-items:center}.device-topnav button,.device-theme{border:1px solid var(--line);border-radius:24px;background:var(--panel);color:var(--text);padding:10px 16px;white-space:nowrap}.device-topnav button.active{background:#314f8f;border-color:#4d76c8;color:#fff}.device-nav-menu{position:relative}.device-menu{position:absolute;z-index:50;top:calc(100% + 9px);left:0;min-width:230px;padding:6px;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 16px 35px #0008}.device-menu button{width:100%;text-align:left;border:0;border-radius:6px;padding:10px 12px;background:transparent}.device-menu button:hover,.device-menu button[aria-current]{background:#244987;color:#fff}
.device-intro{max-width:1600px;margin:auto;padding:26px 20px 18px;display:flex;align-items:end;justify-content:space-between;gap:20px}.device-intro p{margin:0 0 4px;color:#60a5fa;font-weight:700;font-size:11px;letter-spacing:.04em}.device-intro h1{font-size:26px;margin:0 0 4px}.device-intro span{color:var(--muted);font-size:13px}.device-demo-note{border:1px solid #a56d24;background:#4a311b55;border-radius:9px;padding:8px 12px;max-width:330px}.device-demo-note strong,.device-demo-note span{display:block;font-size:11px}.device-demo-note strong{color:#fbbf24;margin-bottom:2px}
.device-summary,.device-filters,.device-grid,.device-detail{max-width:1600px;margin:0 auto 12px;padding-left:20px;padding-right:20px}.device-summary{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}.device-summary article,.device-summary-card{min-width:0;background:var(--panel);border:1px solid var(--line);border-top:3px solid var(--status,#60a5fa);border-radius:9px;padding:10px 13px}.device-summary span,.device-summary small{display:block;color:var(--muted);font-size:11px}.device-summary strong{display:block;font-size:26px;line-height:1.25;margin:3px 0}
.device-filters{display:grid;grid-template-columns:minmax(190px,2fr) repeat(5,minmax(105px,1fr)) auto;gap:9px;align-items:end}.device-filters label{font-size:11px;color:var(--muted);display:flex;flex-direction:column;gap:5px;min-width:0}.device-filters input,.device-filters select,.device-filters button{height:37px;border:1px solid var(--line);border-radius:7px;background:var(--panel);color:var(--text);padding:0 10px;min-width:0}.device-filters button:hover{border-color:#60a5fa}
.device-grid{display:grid;grid-template-columns:minmax(300px,42%) minmax(0,1fr);gap:12px;min-height:520px}.device-map-panel,.device-list-panel,.device-detail{border:1px solid var(--line);border-radius:11px;background:var(--panel);overflow:hidden}.device-map-panel{position:relative;min-height:520px;background:#182232}.device-map{position:absolute;inset:0}.device-map-message{position:absolute;inset:0;display:grid;place-items:center;color:#d1d5db;font-size:14px}.device-map-legend{position:absolute;left:12px;bottom:42px;display:flex;flex-direction:column;gap:4px;background:#161a22ee;border:1px solid #465161;border-radius:9px;padding:10px 12px;color:#fff;font-size:11px}.device-map-legend b{margin-bottom:2px}.device-map-legend span{display:flex;align-items:center;gap:7px}.device-map-legend i{width:9px;height:9px;border-radius:50%}.device-map-caption{position:absolute;left:12px;right:12px;bottom:9px;background:#161a22cc;color:#d1d5db;border-radius:5px;padding:4px 7px;font-size:10px}
.device-list-panel{display:flex;flex-direction:column;min-width:0}.device-list-head{display:flex;align-items:start;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line)}.device-list-head h2{font-size:17px;margin:0}.device-list-head p{color:var(--muted);font-size:11px;margin:4px 0 0}.device-list-head>span{border-radius:20px;background:#6b4818;color:#fbbf24;padding:4px 8px;white-space:nowrap;font-size:10px}.device-list{max-height:470px;overflow:auto}.device-row{width:100%;display:grid;grid-template-columns:12px minmax(0,1fr) auto;align-items:center;gap:10px;text-align:left;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--text);padding:10px 16px}.device-row:hover,.device-row.selected{background:#3264ad25}.device-status-dot{width:10px;height:10px;border-radius:50%}.device-row-main{min-width:0}.device-row-main strong,.device-row-main small,.device-row-side b,.device-row-side small{display:block}.device-row-main strong{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.device-row-main small,.device-row-side small{font-size:10px;color:var(--muted)}.device-row-side{text-align:right;white-space:nowrap}.device-row-side b{font-size:11px}.device-empty{padding:30px;text-align:center;color:var(--muted)}
.device-detail{padding-top:14px;padding-bottom:14px}.device-detail-title{display:flex;justify-content:space-between}.device-detail-title span{font-size:10px;color:#60a5fa}.device-detail-title h2{font-size:17px;margin:3px 0 12px}.device-detail-title button{border:0;background:transparent;color:var(--text);font-size:26px}.device-detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.device-detail-grid div{background:var(--panel2);border-radius:7px;padding:9px}.device-detail-grid small,.device-detail-grid strong{display:block}.device-detail-grid small{color:var(--muted);font-size:10px}.device-detail-grid strong{font-size:12px;margin-top:4px}.device-detail p{font-size:11px;color:var(--muted)}
@media(max-width:1050px){.device-header{flex-wrap:wrap}.device-brand{width:100%}.device-intro{align-items:start}.device-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.device-filters{grid-template-columns:repeat(3,minmax(0,1fr))}.device-grid{grid-template-columns:1fr}.device-map-panel{min-height:390px}.device-list{max-height:440px}}
@media(max-width:620px){.device-header{padding:10px 14px;gap:10px}.device-brand strong{font-size:12px}.device-brand img{width:26px;height:38px}.device-topnav{width:100%;justify-content:space-between}.device-topnav button{padding:8px 10px;font-size:12px}.device-theme{position:absolute;right:12px;top:13px;padding:5px 8px}.device-intro{display:block;padding:18px 12px 12px}.device-intro h1{font-size:21px}.device-demo-note{margin-top:12px}.device-summary,.device-filters,.device-grid,.device-detail{padding-left:12px;padding-right:12px}.device-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.device-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.device-filters label:first-child{grid-column:1/-1}.device-filters button{grid-column:1/-1}.device-map-panel{min-height:340px}.device-row{grid-template-columns:10px minmax(0,1fr)}.device-row-side{grid-column:2;text-align:left}.device-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
/* Keep the shared header, filters, and monitor in separate rows so none can overlap. */
.device-dashboard{height:100dvh;min-height:0;padding:0;display:flex;flex-direction:column;overflow:hidden}
.device-grid{width:100%;max-width:none;margin:0;padding:5px;flex:1;min-height:0;grid-template-columns:minmax(0,40%) minmax(0,1fr);gap:18px}
.device-filters{position:relative;z-index:20;width:100%;max-width:none;min-height:56px;margin:0;padding:6px 14px 8px;display:flex;align-items:center;gap:15px;background:#191919;border-bottom:1px solid #292c32;flex:none}
.device-filters label{flex:none;width:202px;max-width:none;display:block}.device-filters label:nth-child(2){width:202px}.device-filters label:nth-child(3),.device-filters label:nth-child(4){width:202px}.device-filters select{height:41px;padding:0 13px;border:1px solid #383838;border-radius:9px;background:#242424;color:#f4f4f5;font-size:14px}.device-filters select:not(:disabled){cursor:pointer}.device-filters select:focus{outline:2px solid #3b82f6;outline-offset:1px;border-color:#60a5fa}.device-filters select:disabled{opacity:1;cursor:not-allowed;color:#858589;background:#242424}.device-filters button{height:41px;padding:0 14px;display:inline-flex;align-items:center;gap:7px;border-radius:24px;border:1px solid #303033;background:#202020;color:#88888d;font-size:13px;white-space:nowrap}.device-filters button svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round}.device-filters button:hover{border-color:#45454a;color:#b5b5ba;background:#252525}
.device-filter-label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.device-filters select{width:100%}.device-filters select:disabled{opacity:.75}.device-filters button{flex:none}
.device-more-filters{position:relative;flex:none}.device-more-filters summary{display:flex;align-items:center;list-style:none;padding:0 10px;border:1px solid var(--line);border-radius:7px;background:var(--panel);color:var(--text);font-size:12px;cursor:pointer}.device-more-filters summary::-webkit-details-marker{display:none}
.device-more-panel{position:absolute;top:40px;left:0;width:245px;padding:12px;display:grid;gap:9px;border:1px solid var(--line);border-radius:9px;background:var(--panel);box-shadow:0 12px 30px #0009}.device-more-panel label{width:100%;display:flex;flex-direction:column;gap:5px;font-size:11px}.device-more-panel select,.device-more-panel input{width:100%}
.device-map-panel{height:100%;min-height:0;margin:0;border:5px solid #262626;border-radius:10px}.device-dashboard.light .device-map-panel{border-color:#d4dce8}
.device-map-legend{z-index:5;width:min(248px,calc(100% - 24px));padding:9px 10px;gap:2px;font-size:12px;box-shadow:0 4px 14px #0007;backdrop-filter:blur(4px)}.device-map-legend-head{display:flex;align-items:center;justify-content:space-between;padding:0 2px 6px;margin-bottom:2px;border-bottom:1px solid #3b4350}.device-map-legend-head b{margin:0;font-size:12px}.device-map-legend-head span{display:block;margin:0;font-size:10px;color:#9ca9bd}.device-map-legend-item{width:100%;min-height:25px;display:grid;grid-template-columns:12px minmax(0,1fr) auto;align-items:center;gap:8px;padding:3px;border:0;border-radius:5px;background:transparent;color:#e6eaf0;text-align:left;font:inherit;cursor:pointer}.device-map-legend-item:hover,.device-map-legend-item.active{background:#2c3543}.device-map-legend-item:focus-visible{outline:2px solid #60a5fa;outline-offset:1px}.device-map-legend-item i{width:11px;height:11px;border:1.5px solid #fff;box-shadow:0 0 0 1px #0006}.device-map-legend-item span{display:block;min-width:0}.device-map-legend-item b{margin:0;font-size:11px;color:#aab8ca}.device-map-caption{z-index:6}
.device-content-panel{height:100%;min-width:0;min-height:0;margin:0;padding:12px 14px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;border:7px solid #262626;border-radius:13px;background:var(--panel)}
.device-dashboard.light .device-content-panel{border-color:#d4dce8}
.device-intro{width:100%;max-width:none;margin:0;padding:0 0 10px;align-items:center;border-bottom:1px solid var(--line)}
.device-intro h1{font-size:21px}.device-demo-note{max-width:180px;padding:2px 8px;border:0;border-left:3px solid #3b82f6;border-radius:0;background:transparent;text-align:right}.device-demo-note strong{color:var(--text)}
.device-summary{width:100%;max-width:none;margin:0;padding:0;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.device-summary article,.device-summary-card{padding:8px 11px}.device-summary-card{color:var(--text);text-align:left;cursor:pointer}.device-summary-card span,.device-summary-card small{color:var(--muted)}.device-summary-card strong{display:block;color:var(--text);font-size:23px;line-height:1.25;margin:3px 0}.device-summary-card:hover{border-color:var(--status,#60a5fa);background:var(--panel2)}.device-summary-card:focus-visible{outline:2px solid #60a5fa;outline-offset:2px}.device-summary-card[aria-pressed="true"]{background:var(--panel2);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--status,#60a5fa) 32%,transparent)}
.device-list-panel{flex:1;min-height:270px}.device-list{flex:1;min-height:0;max-height:none}
.device-detail{width:100%;max-width:none;flex:none;margin:0;padding:12px}
@media(max-width:1050px){.device-dashboard{height:auto;min-height:100dvh;overflow:visible}.device-grid{display:grid;grid-template-columns:1fr;gap:10px;padding:8px}.device-filters{flex-wrap:wrap}.device-filters label{flex:1 1 140px;width:auto}.device-map-panel{height:420px;min-height:420px;margin:0}.device-content-panel{height:auto;max-height:none;margin:0;overflow:visible}.device-list{max-height:440px;overflow:auto}}
@media(max-width:620px){.device-filters label{flex:1 1 calc(50% - 8px);max-width:none}.device-filters button{flex:1 1 calc(50% - 8px)}.device-more-filters{flex:1 1 calc(50% - 8px)}.device-more-filters summary{justify-content:center}.device-more-panel{left:auto;right:0}.device-grid{padding:6px;gap:10px}.device-map-panel{height:360px;min-height:360px}.device-content-panel{border-width:5px;padding:10px}.device-intro{display:block}.device-demo-note{margin-top:8px;text-align:left}.device-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.device-type-list{grid-template-columns:repeat(2,minmax(0,1fr))}.device-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.device-map-warning{width:14px;height:14px;display:block;overflow:visible;flex:none}
.device-type-summary{flex:none;padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:var(--panel)}.device-type-heading{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 0 6px}.device-type-heading b{font-size:12px}.device-type-heading span{font-size:10px;color:var(--muted)}.device-type-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:5px}.device-type-list button{min-width:0;min-height:30px;display:flex;align-items:center;justify-content:space-between;gap:5px;padding:4px 7px;border:1px solid var(--line);border-radius:6px;background:var(--panel2);color:var(--text);text-align:left;font-size:10px;line-height:1.2}.device-type-list button:hover,.device-type-list button.active{border-color:#3b82f6;background:#244987;color:#fff}.device-type-list button span{min-width:0}.device-type-list button b{flex:none;color:#9ca9bd;font-size:10px}
.device-readings{margin-top:8px;padding:9px;border:1px solid var(--line);border-radius:8px;background:var(--panel)}.device-readings header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}.device-readings header b{font-size:12px}.device-readings header span{font-size:10px;color:var(--muted)}.device-reading-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.device-reading-grid article{min-width:0;padding:7px 8px;border-radius:6px;background:var(--panel2)}.device-reading-grid small,.device-reading-grid strong{display:block}.device-reading-grid small{color:var(--muted);font-size:10px}.device-reading-grid strong{margin-top:3px;font-size:12px;overflow-wrap:anywhere}
.device-map-legend{z-index:10;left:12px;bottom:42px;width:min(248px,calc(100% - 24px));padding:0;gap:0;overflow:hidden}.device-map-legend.collapsed{width:auto;min-width:170px}.device-map-legend-toggle{width:100%;min-height:36px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 11px;border:0;background:transparent;color:#f4f6fa;text-align:left}.device-map-legend-toggle b{font-size:12px}.device-map-legend-toggle span{font-size:15px;line-height:1;color:#cbd5e1}.device-map-legend-toggle:hover{background:#ffffff0b}.device-map-legend-body{padding:0 10px 8px}.device-map-legend-hint{display:block;margin:0 3px 4px;color:#9ca9bd;font-size:10px}.device-map-legend-item{grid-template-columns:14px minmax(0,1fr) auto}.device-map-legend-item i{width:11px;height:11px;border-radius:50%;border:1.5px solid #fff;box-shadow:0 0 0 1px #0006}.device-basemap-control{position:absolute;right:12px;bottom:12px;z-index:10}.device-basemap-current{width:78px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:3px;border:2px solid #fff;border-radius:8px;background:#fff;color:#223044;box-shadow:0 4px 18px #0007;font-size:10px;font-weight:700}.device-basemap-current img{width:66px;height:48px;display:block;object-fit:cover;border-radius:5px}.device-basemap-options{position:absolute;right:0;bottom:calc(100% + 8px);display:flex;gap:7px;padding:8px;border:1px solid #d5dce6;border-radius:10px;background:#fff;box-shadow:0 10px 28px #0009}.device-basemap-options button{width:90px;flex:0 0 90px;padding:5px;border:1px solid transparent;border-radius:7px;background:#f3f6fa;color:#27384b;text-align:center;font-size:10px}.device-basemap-options button.active{border-color:#2563eb;background:#eaf2ff}.device-basemap-options img{width:78px;height:62px;display:block;object-fit:cover;border-radius:5px}.device-basemap-options span,.device-basemap-options small{display:block}.device-basemap-options small{color:#64748b;font-size:8px}
@media(max-width:620px){.device-map-legend{left:9px;bottom:42px;width:min(210px,calc(100% - 18px))}.device-basemap-control{right:9px;bottom:9px}.device-basemap-current{width:68px}.device-basemap-current img{width:56px;height:42px}.device-basemap-options{gap:3px;padding:5px}.device-basemap-options button{width:72px;flex-basis:72px;font-size:9px}.device-basemap-options img{width:60px;height:50px}}
@media(max-width:620px){.device-reading-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
