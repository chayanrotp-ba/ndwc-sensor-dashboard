<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { REPORT_STATIONS } from '../rainfall-report.js';
import DashboardHeader from './DashboardHeader.vue';

const props = defineProps({
  goMap: { type: Function, default: () => {} },
  goAdmin: { type: Function, default: () => {} },
  goDevices: { type: Function, default: () => {} },
  theme: { type: String, default: 'dark' },
  setTheme: { type: Function, default: () => {} },
});

// Station identity and sample daily rainfall are shared with the rainfall report.
const rainfallLevels = [
  { minimum: 90, severity: 'red', label: 'ต้องอพยพ' },
  { minimum: 35, severity: 'orange', label: 'อพยพ' },
  { minimum: 20, severity: 'yellow', label: 'เตรียมรับมือ' },
  { minimum: 10, severity: 'blue', label: 'เฝ้าระวัง' },
];
function rainfallLevel(value) { return rainfallLevels.find(level => value > level.minimum) || { severity: 'normal', label: 'ติดตาม' }; }
function rainfallColor(severity) { return { red: '#ef4444', orange: '#f97316', yellow: '#facc15', blue: '#38bdf8', normal: '#62d477' }[severity] || '#62d477'; }
function formatChange(value) { return `${value >= 0 ? '+' : ''}${value.toFixed(1)}`; }
const stationsByCode = new Map(REPORT_STATIONS.map(station => [station.code, station]));
const caseDefinitions = {
  '09': { name: 'น่าน', province: 'น่าน · อุตรดิตถ์', stationCodes: ['G15006-5501', 'G15006-0512', 'G15006-5514'] },
  '08': { name: 'ยม', province: 'แพร่', stationCodes: ['G15006-5527', 'G15006-5540'] },
  '04': { name: 'ชี', province: 'ขอนแก่น', stationCodes: ['G15006-4001', 'DEMO-04-07', 'DEMO-04-06'] },
};
const otherAgencyStations = {
  '09': [
    { code: 'TMD-09-01', name: 'สถานีอุตุนิยมวิทยาน่าน', province: 'น่าน', agency: 'กรมอุตุนิยมวิทยา', rain: [18, 26, 38], scope: 'external' },
    { code: 'RID-09-02', name: 'สถานีวัดน้ำฝนท่าปลา', province: 'อุตรดิตถ์', agency: 'กรมชลประทาน', rain: [9, 14, 22], scope: 'external' },
  ],
  '08': [
    { code: 'TMD-08-01', name: 'สถานีอุตุนิยมวิทยาแพร่', province: 'แพร่', agency: 'กรมอุตุนิยมวิทยา', rain: [12, 19, 31], scope: 'external' },
    { code: 'DWR-08-02', name: 'สถานีโทรมาตรแม่น้ำยม', province: 'สุโขทัย', agency: 'กรมทรัพยากรน้ำ', rain: [7, 15, 24], scope: 'external' },
  ],
  '04': [
    { code: 'TMD-04-01', name: 'สถานีอุตุนิยมวิทยาขอนแก่น', province: 'ขอนแก่น', agency: 'กรมอุตุนิยมวิทยา', rain: [22, 31, 48], scope: 'external' },
    { code: 'DWR-04-02', name: 'สถานีโทรมาตรลำน้ำพอง', province: 'ขอนแก่น', agency: 'กรมทรัพยากรน้ำ', rain: [11, 18, 29], scope: 'external' },
  ],
};
// Presentation-only 24-hour readings, used to demonstrate each warning color.
// These values are not live measurements and do not modify the warning criteria.
const presentationRain24Overrides = {
  'G15006-5501': 28,
  'G15006-5514': 29,
  'TMD-09-01': 31,
  'TMD-04-01': 96,
};
const stationIconPath = 'M6.5 3a3.5 3.5 0 0 1 3.5 3.5v11a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 3 17.5v-11A3.5 3.5 0 0 1 6.5 3z M11.4 12a1.4 1.4 0 1 0 2.8 0 1.4 1.4 0 1 0-2.8 0 M16.2 8.2a5.4 5.4 0 0 1 0 7.6 M19.2 5.2a9.6 9.6 0 0 1 0 13.6';
const stationCoordinates = {
  'G15006-5501': [100.78, 18.62], 'G15006-0512': [100.82, 18.68], 'G15006-5514': [100.32, 17.63],
  'G15006-5527': [100.15, 17.85], 'G15006-5540': [100.25, 17.72],
  'G15006-4001': [102.82, 16.45], 'DEMO-04-07': [102.68, 16.28], 'DEMO-04-06': [102.95, 16.55],
  'TMD-09-01': [100.62, 18.48], 'RID-09-02': [100.48, 17.72],
  'TMD-08-01': [100.16, 17.76], 'DWR-08-02': [100.22, 17.46],
  'TMD-04-01': [102.78, 16.52], 'DWR-04-02': [102.98, 16.34],
};
const runoffByBasin = {
  '09': [
    { value: 82, path: [[100.48,18.72],[100.62,18.48],[100.70,18.10],[100.78,17.82]] },
    { value: 64, path: [[100.28,18.45],[100.43,18.18],[100.55,17.90],[100.62,17.62]] },
    { value: 18, path: [[100.88,18.40],[100.76,18.12],[100.68,17.86],[100.58,17.58]] },
  ],
  '08': [
    { value: 58, path: [[100.15,18.12],[100.22,17.85],[100.30,17.55],[100.36,17.28]] },
    { value: 34, path: [[99.92,17.86],[100.06,17.64],[100.16,17.40],[100.28,17.18]] },
    { value: 8, path: [[99.98,18.02],[100.12,17.86],[100.20,17.66],[100.32,17.50]] },
  ],
  '04': [
    { value: 91, path: [[102.45,16.72],[102.68,16.48],[102.82,16.25],[103.02,16.02]] },
    { value: 47, path: [[102.98,16.72],[103.12,16.45],[103.28,16.22],[103.48,16.04]] },
    { value: 26, path: [[102.60,16.70],[102.78,16.50],[102.94,16.28],[103.08,16.10]] },
  ],
};
const cctvByBasin = {
  '09': [
    { code: 'AYA03', name: 'บริเวณเขื่อนป้องกันน้ำท่วมวัดสิงห์', province: 'ต.น้ำเต้า อ.บางบาล จ.พระนครศรีอยุธยา', agency: 'ปภ. · กรมป้องกันและบรรเทาสาธารณภัย', coordinates: [100.35, 19.05], level: 'ติดตาม', waterLevel: 1.77, bankLevel: 3.25, phone: '065-936-0553', status: 'ปกติ · รับข้อมูลล่าสุด 10:30' },
    { code: 'NAN01', name: 'กล้อง CCTV ระดับน้ำน่าน เมืองน่าน', province: 'อ.เมืองน่าน จ.น่าน', agency: 'ปภ. · กรมป้องกันและบรรเทาสาธารณภัย', coordinates: [101.15, 18.15], level: 'เฝ้าระวัง', waterLevel: 2.14, bankLevel: 3.8, phone: '065-936-0553', status: 'ปกติ · รับข้อมูลล่าสุด 10:30' },
  ],
  '08': [
    { code: 'PHR02', name: 'กล้อง CCTV แม่น้ำยม ร้องกวาง', province: 'อ.ร้องกวาง จ.แพร่', agency: 'ปภ. · กรมป้องกันและบรรเทาสาธารณภัย', coordinates: [99.55, 18.55], level: 'ติดตาม', waterLevel: 1.42, bankLevel: 3.1, phone: '065-936-0553', status: 'ปกติ · รับข้อมูลล่าสุด 10:30' },
    { code: 'PHR04', name: 'กล้อง CCTV ระดับน้ำเมืองแพร่', province: 'อ.เมืองแพร่ จ.แพร่', agency: 'ปภ. · กรมป้องกันและบรรเทาสาธารณภัย', coordinates: [100.45, 17.75], level: 'เตรียมรับมือ', waterLevel: 2.36, bankLevel: 3.4, phone: '065-936-0553', status: 'ปกติ · รับข้อมูลล่าสุด 10:30' },
  ],
  '04': [
    { code: 'KKN01', name: 'กล้อง CCTV ลำน้ำชี เมืองขอนแก่น', province: 'อ.เมืองขอนแก่น จ.ขอนแก่น', agency: 'ปภ. · กรมป้องกันและบรรเทาสาธารณภัย', coordinates: [102.15, 16.9], level: 'ติดตาม', waterLevel: 1.68, bankLevel: 3.25, phone: '065-936-0553', status: 'ปกติ · รับข้อมูลล่าสุด 10:30' },
    { code: 'KKN02', name: 'กล้อง CCTV ลำน้ำพอง', province: 'อ.น้ำพอง จ.ขอนแก่น', agency: 'ปภ. · กรมป้องกันและบรรเทาสาธารณภัย', coordinates: [103.25, 15.95], level: 'เฝ้าระวัง', waterLevel: 2.08, bankLevel: 3.2, phone: '065-936-0553', status: 'ปกติ · รับข้อมูลล่าสุด 10:30' },
  ],
};
const cases = Object.fromEntries(Object.entries(caseDefinitions).map(([code, definition]) => {
  const stations = [...definition.stationCodes.map(stationCode => stationsByCode.get(stationCode)).filter(Boolean), ...(otherAgencyStations[code] || [])].map(station => {
    const rain24 = station.rain[2];
    const previous24 = station.rain[1];
    return { ...station, agency: station.agency || 'หน่วยงานในระบบ', rain24, change: rain24 !== null && previous24 !== null ? rain24 - previous24 : null, ...rainfallLevel(rain24) };
  }).sort((a, b) => (b.rain24 ?? -1) - (a.rain24 ?? -1));
  const peakStation = stations[0];
  return [code, { ...definition, stations, peakStation, peak: peakStation?.rain24 ?? 0, trend: peakStation?.change ?? 0, points: stations.filter(station => station.rain24 > 0.5).length, ...rainfallLevel(peakStation?.rain24 ?? 0) }];
}));
const sampleStations = Object.values(cases).flatMap(basin => basin.stations);
const stationLevelCounts = Object.fromEntries(['red', 'orange', 'yellow', 'blue', 'normal'].map(level => [level, sampleStations.filter(station => station.severity === level).length]));
const fallbackNames = ['สาละวิน','โขงเหนือ','โขงตะวันออกเฉียงเหนือ','ชี','มูล','ปิง','วัง','ยม','น่าน','เจ้าพระยา','สะแกกรัง','ป่าสัก','ท่าจีน','แม่กลอง','บางปะกง','โตนเลสาบ','ชายฝั่งทะเลตะวันออก','เพชรบุรี-ประจวบคีรีขันธ์','ภาคใต้ฝั่งตะวันออกตอนบน','ภาคใต้ฝั่งตะวันออกตอนล่าง','ภาคใต้ฝั่งตะวันตก','ทะเลสาบสงขลา'];
const features = ref([]);
const loading = ref(true);
const scope = ref('national');
const drilldownActive = ref(false);
const layerPanel = ref(null);
const weatherPanel = ref(null);
const sensorPanel = ref(null);
const mapLayerState = ref({ mainRiver: false, secondaryRiver: false, community: false, road: false, basin: true, places: false, admin: false, weather: false, rainObservation: true, ownStations: true, rainStations: true, runoffStations: true, dams: false, cctv: true });
const sourceMarkers = ref([]);
const runoffMarkers = ref([]);
const cctvMarkers = ref([]);
const stationPopup = ref(null);
const cctvPopup = ref(null);
const area = ref('all');
const province = ref('all');
const severity = ref('all');
const query = ref('');
const rainPeriod = ref('24h');
const rainPeriods = [
  { key: '1h', label: 'ฝน 1 ชั่วโมง', description: 'สะสมย้อนหลัง 1 ชั่วโมงนับจากเวลาปัจจุบัน' },
  { key: '24h', label: 'ฝน 24 ชม.', description: 'สะสมย้อนหลัง 24 ชั่วโมงนับจากเวลาปัจจุบัน' },
  { key: 'today', label: 'ฝนวันนี้', description: 'สะสมตั้งแต่ 07:00 น. ของวันนี้ถึงเวลาปัจจุบัน' },
  { key: 'yesterday', label: 'ฝนวานนี้', description: 'สะสมตั้งแต่ 07:00 น. เมื่อวานถึง 07:00 น. วันนี้' },
  { key: '3d', label: 'ฝนสะสม 3 วัน', description: 'รวมปริมาณฝนรายวันย้อนหลัง 3 วัน' },
];
const selected = ref('09');
const mapError = ref(false);
const basemap = ref('dark');
const basemapOpen = ref(false);
const legendOpen = ref(true);
const legendPosition = ref(null);
const legendDragState = ref(null);
const mapHost = ref(null);
const contentPanel = ref(null);
const basinDetail = ref(null);
const mapReady = ref(false);
const mapBusy = ref(true);
const headerFit = ref({ k: 1, x: 0, dw: 0 });
let mapView = null;
let graphics = null;
let mapModules = null;
let basemapLoadVersion = 0;
let basemapLoadController = null;
function startLegendDrag(event){
  if(event.button!==0) return;
  const legend=event.currentTarget.closest('.map-legend'),panel=legend?.closest('.map-panel');
  if(!legend||!panel) return;
  const panelRect=panel.getBoundingClientRect(),legendRect=legend.getBoundingClientRect();
  legendDragState.value={startX:event.clientX,startY:event.clientY,left:legendRect.left-panelRect.left,top:legendRect.top-panelRect.top,width:legendRect.width,height:legendRect.height,panel};
  event.currentTarget.setPointerCapture?.(event.pointerId);
}
function moveLegendDrag(event){
  const drag=legendDragState.value;
  if(!drag) return;
  const panelRect=drag.panel.getBoundingClientRect(),maxLeft=Math.max(0,panelRect.width-drag.width),maxTop=Math.max(0,panelRect.height-drag.height);
  legendPosition.value={left:Math.min(maxLeft,Math.max(0,drag.left+event.clientX-drag.startX)),top:Math.min(maxTop,Math.max(0,drag.top+event.clientY-drag.startY))};
}
function stopLegendDrag(){ legendDragState.value=null; }
function pointInRing(longitude, latitude, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    const crosses = (yi > latitude) !== (yj > latitude)
      && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}
function isCoordinateInsideBasin(basinCode, longitude, latitude) {
  const feature = features.value.find(item => item.properties.code === basinCode);
  if (!feature) return false;
  const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
  return polygons.some(rings => pointInRing(longitude, latitude, rings[0]) && !rings.slice(1).some(ring => pointInRing(longitude, latitude, ring)));
}
const basemapOptions = [
  { key: 'terrain', name: 'ภูมิประเทศ', thumb: '/assets/dd65fa0593bd6884efcd4d08f98989bd.jpg' },
  { key: 'satellite', name: 'ดาวเทียม', thumb: '/assets/fda0c868746f83417d225dce8e2ecd1d.jpg' },
  { key: 'dark', name: 'โหมดมืด', thumb: '/assets/a7aeb2c182daa3c59feb302d1ba42a22.jpg' },
];

onMounted(async () => {
  try {
    const response = await fetch('/ddpm-cctv-monitoring-dashboard/data/onwr-basins-22.geojson');
    if (!response.ok) throw new Error('Boundary unavailable');
    features.value = (await response.json()).features || [];
    if (features.value.length !== 22) throw new Error('Incomplete boundary data');
    initArcgisMap();
  } catch (_) { mapError.value = true; mapBusy.value = false; }
  finally { loading.value = false; }
});
onBeforeUnmount(() => { basemapLoadController?.abort(); mapView?.destroy(); mapView = null; });

function loadArcgis() {
  if (window.require?.toUrl) return Promise.resolve(window.require);
  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-basin-arcgis]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = 'https://js.arcgis.com/4.31/esri/themes/light/main.css';
      stylesheet.dataset.basinArcgis = 'true';
      document.head.appendChild(stylesheet);
    }
    let script = document.querySelector('script[data-basin-arcgis]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://js.arcgis.com/4.31/';
      script.dataset.basinArcgis = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(window.require), { once: true });
    script.addEventListener('error', () => reject(new Error('ArcGIS unavailable')), { once: true });
    if (window.require?.toUrl) resolve(window.require);
  });
}

async function initArcgisMap() {
  try {
    const requireEsri = await loadArcgis();
    const [Map, MapView, GraphicsLayer, Graphic, Point, VectorTileLayer, Basemap, reactiveUtils] = await new Promise((resolve, reject) => requireEsri([
      'esri/Map', 'esri/views/MapView', 'esri/layers/GraphicsLayer', 'esri/Graphic', 'esri/geometry/Point', 'esri/layers/VectorTileLayer', 'esri/Basemap', 'esri/core/reactiveUtils',
    ], (...modules) => resolve(modules), reject));
    if (!mapHost.value) return;
    mapModules = { Map, MapView, GraphicsLayer, Graphic, Point, VectorTileLayer, Basemap, reactiveUtils };
    const basinLayer = new GraphicsLayer({ title: 'ขอบเขตลุ่มน้ำ' });
    const stationLayer = new GraphicsLayer({ title: 'สถานีตรวจวัดฝน' });
    const labelLayer = new GraphicsLayer({ title: 'ชื่อพื้นที่ลุ่มน้ำ' });
    const runoffLayer = new GraphicsLayer({ title: 'ชั้นน้ำท่าตามลำน้ำ' });
    const cctvLayer = new GraphicsLayer({ title: 'กล้อง CCTV' });
    const map = new Map({ basemap: new Basemap({ baseLayers: [new VectorTileLayer({ portalItem: { id: 'b36501bed2304f8b96641bc1119c3ab4' } })] }), layers: [basinLayer, runoffLayer, stationLayer, cctvLayer, labelLayer] });
    graphics = { map, basinLayer, runoffLayer, stationLayer, cctvLayer, labelLayer };
    applyMapLayerVisibility();
    mapView = new MapView({ container: mapHost.value, map, center: [101.7, 13.4], zoom: 5, constraints: { minZoom: 4, maxZoom: 13 }, ui: { components: ['attribution'] } });
    await mapView.when();
    mapView.watch('extent', updateSourceMarkers);
    mapView.on('resize', updateSourceMarkers);
    updateMapGraphics();
    nextTick(updateSourceMarkers);
    mapView.on('click', async event => {
      // DOM marker clicks are handled by Vue. Do not let the underlying
      // ArcGIS basin hit-test immediately replace that station popup.
      if (event.native?.target?.closest?.('.source-pin, .runoff-pin')) return;
      const result = await mapView.hitTest(event);
      const cctvCode = result.results.find(hit => hit.graphic?.attributes?.cctvCode)?.graphic?.attributes?.cctvCode;
      if (cctvCode) {
        const camera = (cctvByBasin[selected.value] || []).find(item => item.code === cctvCode);
        if (camera) { openCctvPopup(camera); return; }
      }
      const stationCode = result.results.find(hit => hit.graphic?.attributes?.stationCode)?.graphic?.attributes?.stationCode;
      if (stationCode) {
        const station = selectedDisplayStations.value.find(item => item.code === stationCode);
        if (station) {
          openStationPopup(station);
          return;
        }
      }
      const code = result.results.find(hit => hit.graphic?.attributes?.basinCode)?.graphic.attributes.basinCode;
      if (code) openBasinDrilldown(code);
    });
    mapReady.value = true;
    waitForBasemap();
  } catch (error) {
    console.warn('Basin map unavailable:', error);
    mapError.value = true;
    mapBusy.value = false;
  }
}

async function waitForBasemap() {
  if (!mapView || !graphics || !mapModules) return;
  basemapLoadController?.abort();
  const controller = new AbortController();
  basemapLoadController = controller;
  const version = ++basemapLoadVersion;
  const view = mapView;
  const currentBasemap = graphics.map.basemap;
  mapBusy.value = true;
  mapError.value = false;
  try {
    await currentBasemap.loadAll();
    if (controller.signal.aborted) return;
    await Promise.all([...currentBasemap.baseLayers, ...currentBasemap.referenceLayers].map(layer => view.whenLayerView(layer)));
    if (controller.signal.aborted) return;
    await mapModules.reactiveUtils.whenOnce(() => !view.updating, { signal: controller.signal });
    if (version === basemapLoadVersion) mapBusy.value = false;
  } catch (error) {
    if (controller.signal.aborted || version !== basemapLoadVersion) return;
    console.warn('Basemap unavailable:', error);
    mapError.value = true;
    mapBusy.value = false;
  }
}

function updateMapGraphics() {
  if (!graphics || !mapModules) return;
  const { Graphic } = mapModules;
  const { basinLayer, runoffLayer, stationLayer, cctvLayer, labelLayer } = graphics;
  basinLayer.removeAll(); runoffLayer.removeAll(); stationLayer.removeAll(); cctvLayer.removeAll(); labelLayer.removeAll();
  const singleBasinCode = drilldownActive.value
    ? selected.value
    : scope.value === 'basin' && area.value !== 'all'
      ? area.value
      : null;
  const visibleFeatures = singleBasinCode
    ? features.value.filter(feature => feature.properties.code === singleBasinCode)
    : features.value;
  for (const feature of visibleFeatures) {
    const severityName = basins.value.find(basin => basin.code === feature.properties.code)?.severity || 'normal';
    const fill = { red: [239, 68, 68, 0.53], orange: [249, 115, 22, 0.5], yellow: [250, 204, 21, 0.47], blue: [56, 189, 248, 0.44], normal: [190, 202, 216, 0.09] }[severityName];
    const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
    for (const polygon of polygons) basinLayer.add(new Graphic({ geometry: { type: 'polygon', rings: polygon, spatialReference: { wkid: 4326 } }, symbol: { type: 'simple-fill', color: fill, outline: { color: [185, 202, 222, 0.57], width: feature.properties.code === selected.value ? 2 : 0.7 } }, attributes: { basinCode: feature.properties.code } }));
  }
  if (drilldownActive.value && mapLayerState.value.runoffStations) {
    const selectedRunoff = singleBasinCode ? (runoffByBasin[singleBasinCode] || []) : Object.values(runoffByBasin).flat();
    for (const river of selectedRunoff) {
      const color = river.value > 100 ? [239,68,68,0.92] : river.value > 70 ? [37,99,235,0.92] : river.value > 30 ? [34,197,94,0.92] : river.value >= 10 ? [250,204,21,0.92] : [249,115,22,0.92];
      runoffLayer.add(new Graphic({ geometry: { type: 'polyline', paths: [river.path], spatialReference: { wkid: 4326 } }, symbol: { type: 'simple-line', color, width: 3, style: 'solid' }, attributes: { runoff: river.value, layer: 'runoff' } }));
    }
  }
  if (drilldownActive.value && (mapLayerState.value.ownStations || mapLayerState.value.rainStations)) {
    for (const station of selectedDisplayStations.value) {
      const [longitude, latitude] = stationCoordinates[station.code] || [101.2, 17.2];
      if (!isCoordinateInsideBasin(singleBasinCode, longitude, latitude)) continue;
      stationLayer.add(new Graphic({
        geometry: { type: 'point', longitude, latitude },
        // The visible marker is rendered by the source-pin layer. This nearly
        // transparent hit target keeps the ArcGIS layer itself clickable too.
        symbol: { type: 'simple-marker', size: 30, color: [255, 255, 255, 0.01], outline: { color: [255, 255, 255, 0], width: 0 } },
        attributes: { stationCode: station.code, layer: 'stations' },
      }));
    }
  }
  if (drilldownActive.value && mapLayerState.value.cctv) {
    for (const camera of cctvByBasin[singleBasinCode] || []) {
      const [longitude, latitude] = camera.coordinates;
      if (!isCoordinateInsideBasin(singleBasinCode, longitude, latitude)) continue;
      cctvLayer.add(new Graphic({ geometry: { type: 'point', longitude, latitude }, symbol: { type: 'simple-marker', size: 34, color: [255, 255, 255, 0.01], outline: { color: [255, 255, 255, 0], width: 0 } }, attributes: { cctvCode: camera.code, layer: 'cctv' } }));
    }
  }
  const labels = drilldownActive.value ? [] : [
    { code: '09', x: 100.75, y: 18.1 }, { code: '08', x: 99.78, y: 17.6 }, { code: '04', x: 103.2, y: 16.05 },
  ];
  for (const label of labels) labelLayer.add(new Graphic({ geometry: { type: 'point', longitude: label.x, latitude: label.y }, symbol: { type: 'text', text: `ลุ่มน้ำ${cases[label.code].name}`, color: '#fff', haloColor: '#142033', haloSize: 2, font: { family: 'Sarabun', size: 13, weight: 'bold' } }, attributes: { basinCode: label.code } }));
}
watch([selected, drilldownActive, scope, area, province, rainPeriod], () => {
  updateMapGraphics();
  nextTick(updateSourceMarkers);
  if (mapView && !drilldownActive.value) mapView.goTo({ center: [101.7, 13.4], zoom: 5 }, { duration: 450 }).catch(() => {});
});
watch(basemap, key => {
  if (!graphics || !mapModules) return;
  graphics.map.basemap = key === 'dark' ? new mapModules.Basemap({ baseLayers: [new mapModules.VectorTileLayer({ portalItem: { id: 'b36501bed2304f8b96641bc1119c3ab4' } })] }) : key === 'satellite' ? 'satellite' : 'topo-vector';
  waitForBasemap();
});

const basins = computed(() => (features.value.length ? features.value : fallbackNames.map((name, index) => ({ properties: { code: String(index + 1).padStart(2, '0'), name_th: name } }))).map(feature => {
  const base = cases[feature.properties.code];
  const stations = base?.stations || [];
  const displayStations = stations.map(station => displayStation(station));
  const peakStation = displayStations.reduce((peak, station) => !peak || (station.rainValue ?? -1) > (peak.rainValue ?? -1) ? station : peak, null);
  const level = rainfallLevel(peakStation?.rainValue ?? 0);
  return {
    code: feature.properties.code,
    name: feature.properties.name_th,
    ...base,
    stations,
    peakStation,
    peak: peakStation?.rainValue ?? 0,
    trend: peakStation?.change ?? 0,
    severity: peakStation ? level.severity : 'normal',
    label: peakStation ? level.label : 'ไม่มีข้อมูลสถานีตัวอย่าง',
    points: displayStations.filter(station => (station.rainValue ?? 0) > 0.5).length,
  };
}));
const activeBasins = computed(() => basins.value.filter(b => b.points).sort((a, b) => b.peak - a.peak));
const scopeMatches = basin => scope.value === 'national'
  || (scope.value === 'basin' && (area.value === 'all' || area.value === basin.code))
  || (scope.value === 'province' && (province.value === 'all' || `${basin.province || ''} ${(basin.stations || []).map(station => station.province).join(' ')}`.includes(province.value)));
const scopedBasins = computed(() => basins.value.filter(scopeMatches));
const scopedActiveBasins = computed(() => scopedBasins.value.filter(b => b.points).sort((a, b) => b.peak - a.peak));
const visibleBasinsCount = computed(() => scopedBasins.value.length);
const counts = computed(() => ({ all: scopedActiveBasins.value.length, ...Object.fromEntries(['red', 'orange', 'yellow', 'blue'].map(level => [level, scopedActiveBasins.value.filter(b => b.severity === level).length])) }));
const noDataBasins = computed(() => scopedBasins.value.filter(b => !b.points));
const availableProvinces = computed(() => [...new Set(activeBasins.value.flatMap(b => [b.province, ...(b.stations || []).map(station => station.province)]).filter(Boolean).flatMap(value => value.split(' · ')))].sort((a, b) => a.localeCompare(b, 'th')));
const filtered = computed(() => scopedActiveBasins.value.filter(b => {
  const searchable = `ลุ่มน้ำ${b.name} ${b.province || ''} ${(b.stations || []).map(s => `${s.code} ${s.name} ${s.province || ''}`).join(' ')}`.toLowerCase();
  return (severity.value === 'all' || severity.value === b.severity) && (!query.value || searchable.includes(query.value.trim().toLowerCase()));
}));
const selectedBasin = computed(() => scopedBasins.value.find(b => b.code === selected.value) || filtered.value.find(b => b.code === selected.value) || scopedActiveBasins.value[0] || activeBasins.value[0]);
const selectedStations = computed(() => {
  const stations = selectedBasin.value?.stations || [];
  return scope.value === 'province' && province.value !== 'all'
    ? stations.filter(station => station.province === province.value)
    : stations;
});
// Keep every drilldown surface in operational priority order.  A station at a
// higher warning level must not be visually buried below a lower-severity row.
const severityRank = { red: 4, orange: 3, yellow: 2, blue: 1, normal: 0 };
const selectedDisplayStations = computed(() => selectedStations.value
  .map(station => displayStation(station))
  .sort((a, b) => (severityRank[b.severity] - severityRank[a.severity]) || ((b.rainValue ?? -1) - (a.rainValue ?? -1)) || a.name.localeCompare(b.name, 'th')));
const selectedPeakStation = computed(() => selectedDisplayStations.value.reduce((peak, station) => !peak || (station.rainValue ?? -1) > (peak.rainValue ?? -1) ? station : peak, null));
const totalPoints = computed(() => scopedActiveBasins.value.reduce((sum, b) => sum + b.points, 0));
const highestTrendBasin = computed(() => scopedActiveBasins.value.reduce((highest, basin) => basin.trend > (highest?.trend ?? -Infinity) ? basin : highest, null));
function periodRainValue(station, period) {
  const values = station?.rain || [];
  const latest = values[2] ?? null;
  if (period === '1h') return latest === null ? null : Number((latest / 18).toFixed(1));
  if (period === 'today') return latest === null ? null : Number((latest * 0.72).toFixed(1));
  if (period === '24h') return latest;
  if (period === 'yesterday') return values[1] ?? null;
  return values.some(value => value !== null) ? Number(values.reduce((sum, value) => sum + (value ?? 0), 0).toFixed(1)) : null;
}
function periodPreviousRainValue(station, period, currentValue) {
  const values = station?.rain || [];
  if (currentValue === null) return null;
  if (period === '1h') {
    const seed = [...String(station?.code || '')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return Number((currentValue * (seed % 3 === 0 ? 0.68 : seed % 3 === 1 ? 1.08 : 0.86)).toFixed(1));
  }
  if (period === 'today') return values[1] ?? Number((currentValue * 0.9).toFixed(1));
  if (period === 'yesterday') return values[0] ?? Number((currentValue * 1.05).toFixed(1));
  if (period === '24h') return values[1] ?? Number((currentValue * 0.9).toFixed(1));
  return values.length ? Number(((values[0] ?? 0) * 1.1 + (values[1] ?? 0) * 0.65 + (values[2] ?? 0) * 0.25).toFixed(1)) : null;
}
function displayStation(station, period = rainPeriod.value) {
  const measuredValue = periodRainValue(station, period);
  const rainValue = period === '24h' && presentationRain24Overrides[station.code] !== undefined
    ? presentationRain24Overrides[station.code]
    : measuredValue;
  const previousValue = periodPreviousRainValue(station, period, rainValue);
  const level = rainfallLevel(rainValue ?? 0);
  return { ...station, rainValue, severity: level.severity, label: level.label, change: rainValue === null || previousValue === null ? null : Number((rainValue - previousValue).toFixed(1)) };
}
const selectedRainPeriod = computed(() => rainPeriods.find(item => item.key === rainPeriod.value) || rainPeriods[3]);
const selectedRainValue = computed(() => selectedPeakStation.value?.rainValue ?? null);
const selectedStatus = computed(() => rainfallLevel(selectedRainValue.value ?? 0));
const selectedSeverityCounts = computed(() => Object.fromEntries(['normal', 'blue', 'yellow', 'orange', 'red'].map(level => [level, selectedDisplayStations.value.filter(station => station.severity === level).length])));
const selectedCriticalCount = computed(() => selectedSeverityCounts.value[selectedStatus.value.severity] || 0);
const selectedOperationalLevels = computed(() => [
  { severity: 'yellow', label: 'เตรียมรับมือ' },
  { severity: 'orange', label: 'อพยพ' },
  { severity: 'red', label: 'ต้องอพยพ' },
].map(level => {
  const stations = selectedDisplayStations.value.filter(station => station.severity === level.severity);
  return { ...level, count: stations.length, provinces: new Set(stations.map(station => station.province).filter(Boolean)).size };
}));
const trendRange = computed(() => {
  const station = selectedPeakStation.value;
  if (!station) return [];
  const latest = station.rainValue ?? 0;
  const change = station.change ?? 0;
  return [Math.max(0, Number((latest - change * 2).toFixed(1))), Math.max(0, Number((latest - change).toFixed(1))), latest];
});
const trendLabels = computed(() => rainPeriod.value === '3d' ? ['2 วันก่อน', 'เมื่อวาน', 'ล่าสุด'] : ['ช่วงก่อนหน้า', 'ช่วงกลาง', 'ล่าสุด']);
const trendMaximum = computed(() => Math.max(1, ...trendRange.value.filter(value => value !== null)));
const trendBars = computed(() => {
  const slot = 348 / Math.max(trendRange.value.length, 1);
  const width = Math.min(64, slot * 0.58);
  return trendRange.value.map((value, index) => {
    const height = (value / trendMaximum.value) * 112;
    const level = rainfallLevel(value);
    return { value, x: 32 + index * slot + (slot - width) / 2, y: 152 - height, width, height, color: rainfallColor(level.severity), severity: level.severity };
  });
});
const popupRainBars = computed(() => {
  const base = Math.max(0, stationPopup.value?.rainValue ?? 0);
  const factors = [0.08, 0.14, 0.2, 0.12, 0.34, 0.78, 0.46, 0.08, 0.96, 0.28, 0.18, 0.58];
  return factors.map((factor, index) => ({
    value: Number((base * factor).toFixed(1)),
    label: index < 6 ? `${8 + index} ต.ค.` : `${9} ต.ค.`,
    time: ['12:00', '15:00', '17:00', '19:00', '21:00', '23:00', '01:00', '02:00', '04:00', '06:00', '09:00', '11:00'][index],
  }));
});
const popupRainMaximum = computed(() => Math.max(10, ...popupRainBars.value.map(bar => bar.value)) * 1.12);
const popupRainAxis = computed(() => {
  const max = popupRainMaximum.value;
  return [max, max * 0.75, max * 0.5, max * 0.25, 0];
});

function pickBasin(code) { selected.value = code; }
function openBasinDrilldown(code, drillScope = 'basin', selectedProvince = 'all') {
  selected.value = code;
  drilldownActive.value = true;
  scope.value = drillScope;
  area.value = drillScope === 'basin' ? code : 'all';
  province.value = drillScope === 'province' ? selectedProvince : 'all';
  severity.value = 'all';
  query.value = '';
  nextTick(() => {
    basinDetail.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const centers = { '09': [100.7, 18.15], '08': [100.15, 17.75], '04': [102.75, 16.4] };
    if (mapView) mapView.goTo({ center: centers[code] || [101.7, 16.5], zoom: centers[code] ? 7 : 6 }, { duration: 650 }).then(updateSourceMarkers).catch(() => {});
  });
}
function closeDrilldown() {
  drilldownActive.value = false;
  scope.value = 'national';
  area.value = 'all';
  province.value = 'all';
  severity.value = 'all';
  query.value = '';
  layerPanel.value = null;
  weatherPanel.value = null;
  sensorPanel.value = null;
  sourceMarkers.value = [];
  cctvMarkers.value = [];
  stationPopup.value = null;
  cctvPopup.value = null;
}
function openStationPopup(station) { stationPopup.value = station; }
function closeStationPopup() { stationPopup.value = null; }
function openCctvPopup(camera) { cctvPopup.value = camera; }
function closeCctvPopup() { cctvPopup.value = null; }
function focusStationOnMap() {
  const station = stationPopup.value;
  const coordinates = station && stationCoordinates[station.code];
  if (!coordinates || !mapView) return;
  stationPopup.value = null;
  mapView.goTo({ center: coordinates, zoom: 10 }, { duration: 650 }).then(updateSourceMarkers).catch(() => {});
}
function toggleMapPanel(panel) {
  layerPanel.value = panel === 'layers' && layerPanel.value !== 'layers' ? 'layers' : null;
  weatherPanel.value = panel === 'weather' && weatherPanel.value !== 'weather' ? 'weather' : null;
  sensorPanel.value = panel === 'sensor' && sensorPanel.value !== 'sensor' ? 'sensor' : null;
}
function toggleMapLayer(key) {
  mapLayerState.value = { ...mapLayerState.value, [key]: !mapLayerState.value[key] };
  applyMapLayerVisibility();
  updateMapGraphics();
  updateSourceMarkers();
}
function applyMapLayerVisibility() {
  if (!graphics) return;
  graphics.basinLayer.visible = mapLayerState.value.basin;
  graphics.labelLayer.visible = mapLayerState.value.basin;
  graphics.runoffLayer.visible = drilldownActive.value && mapLayerState.value.runoffStations;
  graphics.stationLayer.visible = mapLayerState.value.ownStations || mapLayerState.value.rainStations;
  graphics.cctvLayer.visible = drilldownActive.value && mapLayerState.value.cctv;
}
function markerClassFor(station) {
  const wave = station.severity === 'red' ? ' wave w4' : station.severity === 'orange' ? ' wave w3' : station.severity === 'yellow' ? ' wave w1' : '';
  return `source-pin${station.severity === 'red' ? ' red' : ''}${wave}`;
}
function markerColorFor(station) {
  return { red: '#ef4444', orange: '#f97316', yellow: '#facc15', blue: '#38bdf8', normal: '#aeb8c5' }[station.severity] || '#aeb8c5';
}
function runoffColorFor(value) { return value > 100 ? '#ef4444' : value > 70 ? '#2563eb' : value > 30 ? '#22c55e' : value >= 10 ? '#facc15' : '#f97316'; }
function agencyShort(agency) {
  if (!agency) return 'S';
  if (agency.includes('อุตุนิยมวิทยา')) return 'TMD';
  if (agency.includes('ทรัพยากรน้ำ')) return 'DWR';
  if (agency.includes('ชลประทาน')) return 'RID';
  if (agency.includes('ป้องกัน')) return 'ปภ.';
  return 'S';
}
function agencyLogo(agency) {
  if (!agency) return '/assets/agency-ddpm.png';
  if (agency.includes('อุตุนิยมวิทยา')) return '/assets/agency-tmd.png';
  if (agency.includes('ทรัพยากรน้ำ')) return '/assets/agency-dwr.png';
  if (agency.includes('ชลประทาน')) return '/assets/agency-rid.png';
  if (agency.includes('สารสนเทศ')) return '/assets/agency-hii.png';
  return '/assets/agency-ddpm.png';
}
function updateSourceMarkers() {
  if (!mapView || !drilldownActive.value) {
    sourceMarkers.value = [];
    runoffMarkers.value = [];
    cctvMarkers.value = [];
    return;
  }
  sourceMarkers.value = (mapLayerState.value.ownStations || mapLayerState.value.rainStations) ? selectedDisplayStations.value.map(station => {
    const [longitude, latitude] = stationCoordinates[station.code] || [101.2, 17.2];
    if (!isCoordinateInsideBasin(selected.value, longitude, latitude)) return null;
    // ArcGIS MapView uses WebMercator internally; never interpolate raw
    // longitude/latitude against `extent` (that produces huge off-canvas
    // values once the extent is projected). `toScreen` performs the proper
    // 4326 -> view projection and returns coordinates local to the map view.
    const point = new mapModules.Point({ longitude, latitude, spatialReference: { wkid: 4326 } });
    const screen = mapView.toScreen(point);
    return screen ? { ...station, x: screen.x, y: screen.y, markerClass: markerClassFor(station), markerColor: markerColorFor(station), markerLabel: `${station.name} · ${station.code} · ${station.label} · ${station.rainValue === null ? 'ไม่มีข้อมูล' : station.rainValue.toFixed(1)} มม.` } : null;
  }).filter(Boolean) : [];
  cctvMarkers.value = mapLayerState.value.cctv ? (cctvByBasin[selected.value] || []).map(camera => {
    const [longitude, latitude] = camera.coordinates;
    if (!isCoordinateInsideBasin(selected.value, longitude, latitude)) return null;
    const point = new mapModules.Point({ longitude, latitude, spatialReference: { wkid: 4326 } });
    const screen = mapView.toScreen(point);
    const markerColor = { 'ติดตาม': '#62d477', 'เฝ้าระวัง': '#3fa8f5', 'เตรียมรับมือ': '#ffc743', 'อพยพ': '#ff9b3e', 'ต้องอพยพ': '#f0442c' }[camera.level] || '#3fa8f5';
    return screen ? { ...camera, x: screen.x, y: screen.y, markerColor, markerLabel: `${camera.name} · ${camera.code} · ${camera.level}` } : null;
  }).filter(Boolean) : [];
  if (!mapLayerState.value.runoffStations) { runoffMarkers.value = []; return; }
  const rivers = runoffByBasin[selected.value] || [];
  runoffMarkers.value = rivers.flatMap((river, riverIndex) => [river.path[0], river.path[river.path.length - 1]].map(([longitude, latitude], pointIndex) => {
    if (!isCoordinateInsideBasin(selected.value, longitude, latitude)) return null;
    const point = new mapModules.Point({ longitude, latitude, spatialReference: { wkid: 4326 } });
    const screen = mapView.toScreen(point);
    return screen ? { x: screen.x, y: screen.y, value: river.value, color: runoffColorFor(river.value), key: `${selected.value}-${riverIndex}-${pointIndex}`, label: `น้ำท่า ${river.value}% ของความจุลำน้ำ` } : null;
  })).filter(Boolean);
}
function changeScope(nextScope) {
  scope.value = nextScope;
  if (nextScope === 'national') { area.value = 'all'; province.value = 'all'; }
  if (nextScope === 'basin') area.value = 'all';
  if (nextScope === 'province') province.value = 'all';
  changeArea();
}
function changeArea() { if (scope.value === 'basin' && cases[area.value]) selected.value = area.value; }
function changeProvince() {
  if (scope.value !== 'province' || province.value === 'all') return;
  const basin = activeBasins.value.find(item => `${item.province || ''} ${(item.stations || []).map(station => station.province).join(' ')}`.includes(province.value));
  if (basin) openBasinDrilldown(basin.code, 'province', province.value);
}
function resetFilters() { scope.value = 'national'; area.value = 'all'; province.value = 'all'; severity.value = 'all'; query.value = ''; }
function chooseBasemap(key) { basemap.value = key; basemapOpen.value = false; }
</script>

<template>
  <main class="dashboard" :class="{ light: theme === 'light' }" :style="{ '--source-header-height': `${113 * headerFit.k}px` }">
    <DashboardHeader current="rainfall" :go-map="goMap" :go-devices="goDevices" :go-admin="goAdmin" :theme="theme" :set-theme="setTheme" @fit="headerFit = $event" />
    <div class="dashboard-grid">
      <section class="map-panel" aria-label="แผนที่สถานการณ์ 22 ลุ่มน้ำ">
        <div ref="mapHost" class="arcgis-map" :class="{ ready: mapReady }"></div>
        <div v-if="drilldownActive && sourceMarkers.length" class="source-pin-layer" aria-label="สถานีฝนในลุ่มน้ำ">
          <button v-for="marker in sourceMarkers" :key="marker.code" type="button" :class="marker.markerClass" :style="{ left: `${marker.x}px`, top: `${marker.y}px`, '--pc': marker.markerColor, '--pi': '#fff' }" :aria-label="marker.markerLabel || `${marker.name} · ${marker.code}`" @click.stop="openStationPopup(marker)">
            <svg class="pm-i" viewBox="0 0 24 24" aria-hidden="true"><path class="pm-ic" :d="stationIconPath"></path><path class="pm-off" d="M12 20h.01 M8.5 16.4a5 5 0 0 1 7 0 M5 12.9a10 10 0 0 1 5.2-2.8 M19 12.9a10 10 0 0 0-2.1-1.7 M2 8.8a15 15 0 0 1 4.2-2.7 M22 8.8a15 15 0 0 0-11.3-3.8 M2 2l20 20"></path></svg>
          </button>
        </div>
        <div v-if="drilldownActive && runoffMarkers.length" class="source-pin-layer runoff-pin-layer" aria-label="จุดน้ำท่าตามลำน้ำ">
          <button v-for="marker in runoffMarkers" :key="marker.key" type="button" class="runoff-pin" :style="{ left: `${marker.x}px`, top: `${marker.y}px`, '--runoff-color': marker.color }" :aria-label="marker.label" @click.stop>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4.4-2 6.8 0M3 13c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4.4-2 6.8 0M3 18c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 4.4-2 6.8 0"></path></svg>
          </button>
        </div>
        <div v-if="drilldownActive && cctvMarkers.length" class="cctv-pin-layer" aria-label="กล้อง CCTV">
          <button v-for="camera in cctvMarkers" :key="camera.code" type="button" class="cctv-pin" :style="{ left: `${camera.x}px`, top: `${camera.y}px`, '--cctv-color': camera.markerColor }" :aria-label="camera.markerLabel" @click.stop="openCctvPopup(camera)">
            <img src="/assets/cctv-camera.png" alt="" aria-hidden="true">
          </button>
        </div>
        <div v-if="mapError" class="map-message" role="alert">ไม่สามารถโหลดแผนที่ได้</div>
        <div v-else-if="loading || mapBusy" class="map-loading" role="status" aria-live="polite"><span class="map-spinner" aria-hidden="true"></span><span>กำลังโหลดแผนที่…</span></div>
        <template v-if="drilldownActive">
          <div class="drilldown-map-tools" aria-label="ตัวควบคุมชั้นข้อมูลแผนที่">
            <button type="button" class="map-tool" :class="{active:layerPanel==='layers'}" aria-label="ชั้นข้อมูล" :aria-expanded="layerPanel==='layers'" @click="toggleMapPanel('layers')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 10 5-10 5L2 7z"></path><path d="m2 12 10 5 10-5"></path><path d="m2 17 10 5 10-5"></path></svg></button>
            <button type="button" class="map-tool" :class="{active:weatherPanel==='weather'}" aria-label="ชั้นสภาพอากาศ" :aria-expanded="weatherPanel==='weather'" @click="toggleMapPanel('weather')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 19H8a6 6 0 1 1 5.7-7.9A4.5 4.5 0 1 1 17.5 19z"></path></svg></button>
            <button type="button" class="map-tool" :class="{active:sensorPanel==='sensor'}" aria-label="ข้อมูล Sensor" :aria-expanded="sensorPanel==='sensor'" @click="toggleMapPanel('sensor')"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2"></circle><path d="M16.2 7.8a6 6 0 0 1 0 8.4"></path><path d="M7.8 16.2a6 6 0 0 1 0-8.4"></path><path d="M19.1 4.9a10 10 0 0 1 0 14.2"></path><path d="M4.9 19.1a10 10 0 0 1 0-14.2"></path></svg></button>
          </div>
          <div v-if="layerPanel==='layers'" class="map-layer-panel" aria-label="ชั้นข้อมูล">
            <header><b>ชั้นข้อมูล</b><small>เส้นทาง ลุ่มน้ำ สถานที่สำคัญ และเขตการปกครอง</small></header>
            <strong>เส้นทางและพื้นที่</strong>
            <label v-for="item in [{key:'mainRiver',label:'เส้นทางน้ำสายหลัก'},{key:'secondaryRiver',label:'เส้นทางน้ำสายรอง'},{key:'community',label:'เขตพื้นที่ชุมชน'},{key:'road',label:'เส้นทางคมนาคม'},{key:'basin',label:'ลุ่มแม่น้ำหลัก'},{key:'places',label:'สถานที่สำคัญ'},{key:'admin',label:'เขตพื้นที่ปกครอง'}]" :key="item.key"><span>{{ item.label }}</span><input type="checkbox" role="switch" :checked="mapLayerState[item.key]" @change="toggleMapLayer(item.key)"></label>
          </div>
          <div v-if="weatherPanel==='weather'" class="map-layer-panel" aria-label="ชั้นสภาพอากาศ">
            <header><b>ชั้นสภาพอากาศ</b><small>เปิด/ปิดข้อมูลสภาพอากาศและตรวจการณ์</small></header>
            <label><span>สภาพอากาศ</span><input type="checkbox" role="switch" :checked="mapLayerState.weather" @change="toggleMapLayer('weather')"></label>
            <label><span>ตรวจวัดปริมาณน้ำฝน</span><input type="checkbox" role="switch" :checked="mapLayerState.rainObservation" @change="toggleMapLayer('rainObservation')"></label>
          </div>
          <div v-if="sensorPanel==='sensor'" class="map-layer-panel sensor-layer-panel" aria-label="ข้อมูล Sensor">
            <header><b>ข้อมูล Sensor</b><small>เปิด/ปิดชั้นข้อมูลสถานีตรวจวัดและการเฝ้าระวัง</small></header>
            <strong>สถานีตรวจวัด</strong>
            <label><span><b>สถานีตรวจวัด ปภ.</b><small>ข้อมูลของระบบนี้</small></span><input type="checkbox" role="switch" :checked="mapLayerState.ownStations" @change="toggleMapLayer('ownStations')"></label>
            <label><span><b>สถานีวัดปริมาณน้ำฝน</b><small>ปริมาณฝน 24 ชม. · ทุกหน่วยงาน</small></span><input type="checkbox" role="switch" :checked="mapLayerState.rainStations" @change="toggleMapLayer('rainStations')"></label>
            <div class="sensor-agencies"><b>หน่วยงาน</b><span>✓ DWR · ทน. <em>8</em></span><span>✓ HII · สสน. <em>10</em></span><span>✓ TMD · อต. <em>7</em></span><span>✓ RID · ชป. <em>7</em></span></div>
            <label><span><b>สถานีวัดระดับน้ำท่า</b></span><input type="checkbox" role="switch" :checked="mapLayerState.runoffStations" @change="toggleMapLayer('runoffStations')"></label>
            <strong>แหล่งน้ำและการเฝ้าระวัง</strong>
            <label><span><b>อ่างเก็บน้ำ</b></span><input type="checkbox" role="switch" :checked="mapLayerState.dams" @change="toggleMapLayer('dams')"></label>
            <label><span><b>กล้อง CCTV</b></span><input type="checkbox" role="switch" :checked="mapLayerState.cctv" @change="toggleMapLayer('cctv')"></label>
          </div>
          <aside class="map-legend" aria-label="คำอธิบายสัญลักษณ์" :style="legendPosition ? {left:`${legendPosition.left}px`,top:`${legendPosition.top}px`,bottom:'auto'} : undefined">
            <div class="legend-heading"><span class="legend-drag-handle" title="ลากเพื่อย้ายคำอธิบายสัญลักษณ์" aria-hidden="true" @pointerdown.stop.prevent="startLegendDrag" @pointermove.stop.prevent="moveLegendDrag" @pointerup.stop.prevent="stopLegendDrag" @pointercancel.stop.prevent="stopLegendDrag">⠿</span><button type="button" class="legend-toggle" :aria-expanded="legendOpen" :aria-label="legendOpen ? 'ยุบคำอธิบายสัญลักษณ์' : 'ขยายคำอธิบายสัญลักษณ์'" @click="legendOpen = !legendOpen"><b>คำอธิบายสัญลักษณ์</b><span>{{ legendOpen ? '⌄' : '⌃' }}</span></button></div>
            <div v-if="legendOpen" class="legend-body">
              <strong>ระดับเตือนภัยฝน · {{ selectedRainPeriod.label }}</strong>
              <span><i class="red"></i>ต้องอพยพ <em>{{ selectedDisplayStations.filter(station => station.severity === 'red').length }}</em></span>
              <span><i class="orange"></i>อพยพ <em>{{ selectedDisplayStations.filter(station => station.severity === 'orange').length }}</em></span>
              <span><i class="yellow"></i>เตรียมรับมือ <em>{{ selectedDisplayStations.filter(station => station.severity === 'yellow').length }}</em></span>
              <span><i class="blue"></i>เฝ้าระวัง <em>{{ selectedDisplayStations.filter(station => station.severity === 'blue').length }}</em></span>
              <span><i class="normal"></i>ติดตาม <em>{{ selectedDisplayStations.filter(station => station.severity === 'normal').length }}</em></span>
              <strong>สถานีในขอบเขตที่เลือก</strong>
              <span>Sensor ฝน <em>{{ selectedDisplayStations.length }} สถานี</em></span>
              <template v-if="mapLayerState.runoffStations">
                <strong>เกณฑ์น้ำท่า · % ความจุลำน้ำ</strong>
                <span><i class="runoff-low"></i>น้อยวิกฤต &lt;10%</span>
                <span><i class="runoff-watch"></i>น้อย &gt;10–30%</span>
                <span><i class="runoff-normal"></i>ปกติ &gt;30–70%</span>
                <span><i class="runoff-high"></i>มาก &gt;70–100%</span>
                <span><i class="runoff-critical"></i>ล้นตลิ่ง &gt;100%</span>
              </template>
            </div>
          </aside>
          <div class="basemap-control" aria-label="เลือก Basemap">
            <div v-if="basemapOpen" class="basemap-options">
              <button v-for="item in basemapOptions" :key="item.key" type="button" :class="{active:basemap===item.key}" @click="chooseBasemap(item.key)"><img :src="item.thumb" :alt="item.name"><span>{{ item.name }}</span><small v-if="item.key === 'dark'">Default</small></button>
            </div>
            <button type="button" class="basemap-current" :aria-expanded="basemapOpen" @click="basemapOpen = !basemapOpen"><img :src="basemapOptions.find(item => item.key === basemap)?.thumb" alt=""><span>{{ basemapOptions.find(item => item.key === basemap)?.name }}</span></button>
          </div>
        </template>
      </section>
      <div ref="contentPanel" class="content-panel">
        <div class="page-heading"><div><small>{{ drilldownActive ? `หน้าหลัก / Dashboard / ${scope === 'province' ? 'รายละเอียดจังหวัด' : 'รายละเอียดลุ่มน้ำ'}` : 'หน้าหลัก / Dashboard' }}</small><h1>{{ drilldownActive ? (scope === 'province' ? `ภาพรวมสถานีจังหวัด${province}` : `ภาพรวมสถานีลุ่มน้ำ${selectedBasin?.name ?? ''}`) : 'ภาพรวมฝนรายลุ่มน้ำ' }}</h1><p>{{ drilldownActive ? (scope === 'province' ? 'ตรวจสอบสถานีตรวจวัดฝนและระดับเตือนภัยภายในจังหวัดที่เลือก' : 'ตรวจสอบสถานีตรวจวัดฝนและระดับเตือนภัยภายในลุ่มน้ำที่เลือก') : 'ดูฝนสะสม 24 ชั่วโมง ระดับการเฝ้าระวัง และแนวโน้มจาก Sensor ตรวจวัดฝน' }}</p></div><div class="timestamp"><button v-if="drilldownActive" type="button" class="drilldown-back" @click="closeDrilldown">← กลับภาพรวม</button><b>ข้อมูลตัวอย่าง</b><span>ฝนสะสม 24 ชม.</span><small>ขอบเขตลุ่มน้ำ: ONWR Open Data</small></div></div>
        <div v-if="drilldownActive" class="drilldown-banner" role="status"><strong>กำลังดูรายละเอียด{{ scope === 'province' ? `จังหวัด${province}` : `ลุ่มน้ำ${selectedBasin?.name ?? ''}` }}</strong><span>{{ scope === 'province' ? `แสดงสถานีฝนในจังหวัด${province}` : `${selectedBasin?.province || 'ยังไม่มีข้อมูลจังหวัด'} · แสดงสถานีฝนภายในลุ่มน้ำนี้` }}</span></div>
        <template v-if="!drilldownActive">
        <section class="controls" aria-label="ตัวกรองข้อมูลฝน"><div class="scope-head"><div><span class="eyebrow">ขอบเขตข้อมูล</span><b>ข้อมูลฝนล่าสุด</b><small>เลือกมุมมองพื้นที่และช่วงฝนสะสมเพื่อดูสถานการณ์และแนวโน้ม</small></div><span class="freshness"><i></i>อัปเดตล่าสุด 11:40 น.</span></div><div class="scope-tabs" role="tablist" aria-label="ขอบเขตพื้นที่"><button v-for="item in [{key:'national',label:'ทั่วประเทศ'},{key:'basin',label:'รายลุ่มน้ำ'},{key:'province',label:'รายจังหวัด'}]" :key="item.key" type="button" :class="{active:scope===item.key}" role="tab" :aria-selected="scope===item.key" @click="changeScope(item.key)">{{ item.label }}</button></div><div class="period-tabs" role="tablist" aria-label="ช่วงฝนสะสม"><span>ช่วงฝนสะสม</span><button v-for="item in rainPeriods" :key="item.key" type="button" :class="{active:rainPeriod===item.key}" role="tab" :aria-selected="rainPeriod===item.key" @click="rainPeriod=item.key">{{ item.label }}</button></div><div class="search-row"><label v-if="scope==='basin'"><span>ลุ่มน้ำ</span><select v-model="area" @change="changeArea"><option value="all">ลุ่มน้ำทั้งหมด 22 ลุ่มน้ำ</option><option v-for="b in basins" :key="b.code" :value="b.code">ลุ่มน้ำ{{ b.name }}</option></select></label><label v-else-if="scope==='province'"><span>จังหวัด</span><select v-model="province" @change="changeProvince"><option value="all">ทุกจังหวัดที่มีข้อมูล</option><option v-for="item in availableProvinces" :key="item" :value="item">{{ item }}</option></select></label><label v-else><span>พื้นที่</span><select aria-label="พื้นที่ที่แสดง"><option>ประเทศไทย · 22 ลุ่มน้ำ</option></select></label><label class="search"><span>ค้นหา</span><input v-model="query" type="search" placeholder="ค้นหาลุ่มน้ำ จังหวัด หรือสถานี"></label></div><div class="severity-filters"><span>เกณฑ์เตือนภัยฝน</span><button v-for="level in [{key:'all',text:'ทั้งหมด'},{key:'blue',text:'เฝ้าระวัง'},{key:'yellow',text:'เตรียมรับมือ'},{key:'orange',text:'อพยพ'},{key:'red',text:'ต้องอพยพ'}]" :key="level.key" type="button" :class="[level.key,{active:severity===level.key}]" @click="severity=level.key">{{ level.text }} <b>{{ counts[level.key] }}</b></button><button type="button" class="reset" @click="resetFilters">ล้างตัวกรอง</button></div></section>
        <section class="stat-grid" aria-label="ตัวเลขภาพรวม"><article><span>ลุ่มน้ำที่มีฝนเข้าเกณฑ์</span><b>{{ counts.all }}</b><small>จาก {{ visibleBasinsCount }} ลุ่มน้ำ</small></article><article><span>สถานีฝนที่เข้าเกณฑ์</span><b>{{ totalPoints }}</b><small>ใน {{ counts.all }} ลุ่มน้ำ</small></article><article><span>ฝนสูงสุด · {{ selectedRainPeriod.label }}</span><b>{{ scopedActiveBasins[0]?.peak.toFixed(1) ?? '–' }}</b><small>มม. · ลุ่มน้ำ{{ scopedActiveBasins[0]?.name ?? '–' }}</small></article><article><span>ลุ่มน้ำไม่มีข้อมูล</span><b>{{ noDataBasins.length }}</b><small>แยกจากระดับติดตาม</small></article></section>
        <section class="national-summary"><header><div><small>RAINFALL OVERVIEW</small><h2>สรุป{{ selectedRainPeriod.label }} · {{ visibleBasinsCount }} ลุ่มน้ำ</h2></div><span>{{ counts.all }} ลุ่มน้ำมีสถานีเข้าเกณฑ์ · {{ noDataBasins.length }} ลุ่มน้ำไม่มีข้อมูล</span></header><div class="summary-body"><div class="donut" :style="{ '--red': counts.red / Math.max(visibleBasinsCount,1) * 100 + '%', '--orange': (counts.red + counts.orange) / Math.max(visibleBasinsCount,1) * 100 + '%', '--yellow': (counts.red + counts.orange + counts.yellow) / Math.max(visibleBasinsCount,1) * 100 + '%', '--blue': counts.all / Math.max(visibleBasinsCount,1) * 100 + '%' }"><b>{{ visibleBasinsCount }}</b><small>ลุ่มน้ำในมุมมองนี้</small></div><div class="summary-lines"><div><i class="red"/>ต้องอพยพ <b>{{ counts.red }}</b></div><div><i class="orange"/>อพยพ <b>{{ counts.orange }}</b></div><div><i class="yellow"/>เตรียมรับมือ <b>{{ counts.yellow }}</b></div><div><i class="blue"/>เฝ้าระวัง <b>{{ counts.blue }}</b></div><div><i class="normal"/>ไม่มีข้อมูล <b>{{ noDataBasins.length }}</b></div></div><div class="summary-note"><b>Sensor ตรวจวัดฝนเข้าเกณฑ์ {{ totalPoints }} สถานี</b><p>เลือกแถวลุ่มน้ำเพื่อดูค่า{{ selectedRainPeriod.label }} เทียบระดับเตือน และแนวโน้มที่เพิ่มขึ้น</p></div></div></section>
        <section class="basin-list"><header><div><small>ข้อมูลฝนล่าสุด · {{ selectedRainPeriod.label }}</small><h2>สถานการณ์รายลุ่มน้ำ</h2></div><span>แสดง {{ filtered.length }} จาก {{ counts.all }} ลุ่มน้ำที่มีข้อมูล</span></header><div class="list-head"><span>ลำดับ / พื้นที่ลุ่มน้ำ</span><span>ระดับเตือนภัย</span><span>{{ selectedRainPeriod.label }}</span><span>แนวโน้ม</span><span>สถานีเข้าเกณฑ์</span></div><div v-if="!filtered.length" class="empty">ไม่พบลุ่มน้ำที่ตรงกับตัวกรอง</div><button v-for="(b,index) in filtered" :key="b.code" type="button" :class="['basin-row',b.severity,{active:selected===b.code}]" @click="openBasinDrilldown(b.code)"><span class="basin-name"><small>{{ String(index+1).padStart(2,'0') }}</small><b>ลุ่มน้ำ{{ b.name }}</b><em>{{ b.province }}</em></span><span class="status-pill">{{ b.label }}</span><strong>{{ b.peak.toFixed(1) }} <small>มม.</small></strong><strong class="trend">{{ b.trend >= 0 ? '↗' : '↘' }} {{ formatChange(b.trend) }} <small>มม.</small></strong><strong>{{ b.points }} <small>สถานี</small></strong></button></section>
        </template>
        <section v-if="drilldownActive && selectedBasin?.points" ref="basinDetail" class="basin-detail">
          <header><div><small>{{ scope === 'province' ? 'DRILLDOWN · ภาพรวมสถานีในจังหวัด' : 'DRILLDOWN · ภาพรวมสถานีในลุ่มน้ำ' }}</small><h2>{{ scope === 'province' ? `ภาพรวมสถานี · จังหวัด${province}` : `ภาพรวมสถานี · ลุ่มน้ำ${selectedBasin.name}` }}</h2><p>{{ scope === 'province' ? province : selectedBasin.province }}</p></div><span :class="['status-pill',selectedStatus.severity]">{{ selectedStatus.label }}</span></header>
          <div class="detail-period-tabs" role="tablist" aria-label="ช่วงฝนสะสมในลุ่มน้ำ"><span>ช่วงฝนสะสม</span><button v-for="item in rainPeriods" :key="item.key" type="button" :class="{active:rainPeriod===item.key}" role="tab" :aria-selected="rainPeriod===item.key" @click="rainPeriod=item.key">{{ item.label }}</button></div>
          <div class="detail-grid">
            <div class="trend-chart"><div class="trend-title"><b>{{ selectedRainPeriod.label }} · {{ selectedPeakStation?.name || 'ไม่มีสถานี' }}</b><strong>{{ selectedRainValue === null ? 'ไม่มีข้อมูล' : `${selectedRainValue.toFixed(1)} มม.` }}</strong></div><svg viewBox="0 0 400 170" preserveAspectRatio="none" :aria-label="`กราฟแท่ง${selectedRainPeriod.label}`"><path d="M32 152 H380 M32 98 H380 M32 44 H380" class="gridline"/><g class="trend-bars"><rect v-for="(bar,index) in trendBars" :key="index" :x="bar.x" :y="bar.y" :width="bar.width" :height="bar.height" :fill="bar.color" rx="4"><title>{{ trendLabels[index] }} {{ bar.value.toFixed(1) }} มม. · {{ rainfallLevel(bar.value).label }}</title></rect></g></svg><div class="axis"><span v-for="label in trendLabels" :key="label">{{ label }}</span></div><div class="trend-legend" aria-label="เกณฑ์สีฝน"><span><i class="normal"></i>ติดตาม</span><span><i class="blue"></i>เฝ้าระวัง</span><span><i class="yellow"></i>เตรียมรับมือ</span><span><i class="orange"></i>อพยพ</span><span><i class="red"></i>ต้องอพยพ</span></div><small>ปริมาณฝนแต่ละช่วงของสถานีที่มีค่าสูงสุดในขอบเขตที่เลือก · สีแท่งอ้างอิงเกณฑ์ฝน 24 ชม.</small></div>
          <div class="detail-stats"><div><span>ฝนสูงสุด · {{ selectedRainPeriod.label }}</span><b>{{ selectedRainValue === null ? '–' : `${selectedRainValue.toFixed(1)} มม.` }}</b></div><div><span>สถานีเข้าเกณฑ์</span><b>{{ selectedDisplayStations.filter(station => ['red','orange','yellow'].includes(station.severity)).length }} สถานี</b></div><div><span>Sensor ตัวอย่าง</span><b>{{ selectedDisplayStations.length }} สถานี</b></div></div>
          </div>
          <section class="drilldown-summary" aria-label="สรุปสถานีตามเกณฑ์การเฝ้าระวังภัย ปภ."><div class="drilldown-summary-header"><span>เกณฑ์การเฝ้าระวังภัย (ปภ.)</span><button type="button" class="drilldown-summary-all">ทั้งหมด {{ selectedDisplayStations.length }}</button></div><div class="drilldown-summary-cards"><button v-for="level in selectedOperationalLevels" :key="level.severity" type="button" :class="['drilldown-summary-card',level.severity]" :aria-label="`${level.label} ${level.count} สถานี ${level.provinces} จังหวัด`"><b>{{ level.label }}</b><strong>{{ level.count }}</strong><span>{{ level.provinces }} จังหวัด</span></button></div></section>
          <h3>Sensor ตรวจวัดฝนที่ต้องติดตาม</h3>
          <div class="station-table"><div class="station-head"><span>สถานี / จังหวัด / หน่วยงาน</span><span>{{ selectedRainPeriod.label }}</span><span>ระดับเตือน</span><span>แนวโน้ม</span></div><button v-for="station in selectedDisplayStations" :key="station.code" type="button" class="station-row" @click="openStationPopup(station)"><span class="station-identity"><img :src="agencyLogo(station.agency)" :alt="agencyShort(station.agency)"><span><b>{{ station.name }}</b><small>{{ station.code }} · {{ station.province }}</small><small class="station-agency">{{ station.agency }}</small></span></span><strong>{{ station.rainValue === null ? 'ไม่มีข้อมูล' : `${station.rainValue.toFixed(1)} มม.` }}</strong><span :class="['station-level',station.severity]">{{ station.label }}</span><strong class="trend">{{ station.change === null ? 'ไม่มีข้อมูล' : `${station.change >= 0 ? '↗' : '↘'} ${formatChange(station.change)} มม.` }}</strong></button></div>
        </section>
        <section v-else-if="drilldownActive" ref="basinDetail" class="basin-detail empty-drilldown"><h2>ยังไม่มีข้อมูลสถานีฝนในลุ่มน้ำ{{ selectedBasin?.name ?? '' }}</h2><p>ลุ่มน้ำนี้ยังไม่มีข้อมูลตัวอย่างสำหรับแสดงผล Drilldown</p></section>
      <div v-if="cctvPopup" class="cctv-popup-backdrop" role="presentation" @click.self="closeCctvPopup">
        <section class="cctv-popup" role="dialog" aria-modal="true" aria-labelledby="cctv-popup-title">
          <header class="cctv-popup-head"><div class="cctv-popup-title"><span class="cctv-status">{{ cctvPopup.level }}</span><div class="cctv-title-row"><h2 id="cctv-popup-title">{{ cctvPopup.name }}</h2><span class="cctv-code">{{ cctvPopup.code }}</span></div><p><span>⌖ {{ cctvPopup.province }}</span><span>▣ {{ cctvPopup.agency }}</span></p></div><button type="button" class="cctv-close" aria-label="ปิด popup" @click="closeCctvPopup">×</button></header>
          <div class="cctv-popup-body"><main class="cctv-main"><div class="cctv-tabs"><button type="button" class="active">กล้องตัวที่ 1</button><button type="button">กล้องตัวที่ 2</button><button type="button">กราฟระดับน้ำ</button></div><div class="cctv-viewer"><span class="cctv-loader" aria-hidden="true"></span><strong>กำลังตรวจสอบสัญญาณกล้อง...</strong><small>UTM 47N 656463E 1584573N</small></div></main><aside class="cctv-side"><div class="cctv-water-cards"><article><span>ระดับน้ำ</span><b>{{ cctvPopup.waterLevel.toFixed(2) }}</b><small>ม.รทก.</small></article><article><span>ระดับตลิ่ง</span><b>{{ cctvPopup.bankLevel.toFixed(2) }}</b><small>ม.รทก.</small></article></div><div class="cctv-water-summary"><strong>ต่ำกว่าตลิ่ง {{ (cctvPopup.bankLevel - cctvPopup.waterLevel).toFixed(2) }} ม.</strong><p>อัปเดตทุก 30 นาที · ล่าสุด 9 ต.ค. 2569 10:30 น.</p></div><section class="cctv-info"><h3>สถานีที่ตั้ง</h3><b>{{ cctvPopup.name }}</b><p>{{ cctvPopup.agency }}</p><p>พิกัด<br><strong>{{ cctvPopup.coordinates[1].toFixed(6) }}, {{ cctvPopup.coordinates[0].toFixed(6) }}</strong></p><a :href="`tel:${cctvPopup.phone.replaceAll('-', '')}`">☎ โทร {{ cctvPopup.phone }}</a><button type="button" class="cctv-open">↗ เปิดในระบบ CCTV ปภ.</button></section></aside></div>
        </section>
      </div>
      <div v-if="stationPopup" class="station-popup-backdrop ex" role="presentation" @click.self="closeStationPopup">
          <section class="station-popup sp one" role="dialog" aria-modal="true" aria-labelledby="station-popup-title">
            <header class="sp-h">
              <div class="sp-ttl">
                <span :class="['sp-bd', stationPopup.severity === 'red' ? 'b-bad' : stationPopup.severity === 'orange' ? 'b-warn' : stationPopup.severity === 'normal' ? 'b-none' : 'b-ok']">{{ stationPopup.label }}</span>
                <div class="sp-tr"><h2 id="station-popup-title">{{ stationPopup.name }}</h2><span class="sp-id">{{ stationPopup.code }}</span></div>
                <p class="sp-meta"><span class="m"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg><span>{{ stationPopup.province }}</span></span><span class="m"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/></svg><span>{{ stationPopup.agency }}</span></span></p>
              </div>
              <div class="sp-tools" role="toolbar" aria-label="การทำงานกับสถานี">
                <button class="sp-loc" type="button" title="ซูมไปยังตำแหน่งสถานีนี้บนแผนที่" @click="focusStationOnMap"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg><span>ดูบนแผนที่</span></button>
                <button class="sp-hb" type="button" aria-label="ค้นหาสถานีอื่น" title="ค้นหาสถานีอื่น"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>
                <div class="sp-hact"><button class="sp-hb" type="button" aria-label="แก้ไขข้อมูลสถานี" title="แก้ไขข้อมูลสถานี"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button><button class="sp-hb" type="button" aria-label="QR Code สถานี" title="เปิดรูปสถานีและ QR Code"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4"/></svg></button></div>
              </div><span class="sp-div" aria-hidden="true"></span><button class="hx-x sp-x" type="button" aria-label="ปิด" @click="closeStationPopup"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </header>
            <div class="sp-b sp-b2">
              <div class="sp-main">
                <div class="sp-mh"><h3>ค่าล่าสุด <span>อัปเดต 9 ต.ค. 2569 11:00 น.</span></h3><button class="sp-sec" type="button"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>ค่าทั้งหมด <b>8</b></button></div>
                <div class="rc rc-sec"><div :class="['rc-one', stationPopup.severity === 'red' ? 's-bad' : stationPopup.severity === 'orange' ? 's-warn' : 's-ok']"><div class="rc-oh"><span class="rc-ic">☁</span><span class="rc-tx"><span class="rc-lb">ปริมาณน้ำฝน · {{ selectedRainPeriod.label }}</span><span class="rc-note">ค่าที่เลือกในตัวกรอง “ประเภทข้อมูล”</span></span><span class="rc-pill">{{ stationPopup.label }}</span></div><div class="rc-big"><b>{{ stationPopup.rainValue === null ? '–' : stationPopup.rainValue.toFixed(1) }}</b><i>มม.</i></div></div></div>
                <section class="criteria-comparison" aria-label="รายละเอียดเกณฑ์การเฝ้าระวังภัย"><header class="comparison-header"><h3><span aria-hidden="true">▤</span> ช่วงค่าตามเกณฑ์เฝ้าระวังภัย (ปภ.) รายสถานี</h3></header><div class="comparison-periods" role="group" aria-label="ช่วงฝนสะสมเพื่อเปรียบเทียบเกณฑ์"><span>ช่วงฝนสะสม</span><button v-for="period in rainPeriods" :key="period.key" type="button" :class="{selected:rainPeriod===period.key}" @click="rainPeriod=period.key">{{ period.label }}</button></div><div class="comparison-observation"><span>ฝนสะสมที่ใช้ประเมิน · {{ selectedRainPeriod.label }}</span><strong>{{ stationPopup.rainValue === null ? 'ไม่มีข้อมูล' : `${stationPopup.rainValue.toFixed(1)} มม.` }}</strong></div><article class="comparison-row warning-source"><header class="comparison-source"><span class="comparison-source-icon" aria-hidden="true">▥</span><div class="comparison-source-title"><strong>เกณฑ์การเฝ้าระวังภัย (ปภ.)</strong><span>{{ stationPopup.code }} · ใช้ช่วงเกณฑ์กลาง ปภ.</span></div><span class="comparison-source-badge default">เกณฑ์การเฝ้าระวังภัย (ปภ.)</span></header><div class="comparison-result"><div><span class="comparison-state">ผลประเมินตามเกณฑ์ที่ใช้งานจริง</span><strong :style="{color: stationPopup.severity === 'red' ? '#ef4444' : stationPopup.severity === 'orange' ? '#f97316' : stationPopup.severity === 'yellow' ? '#facc15' : '#22c55e'}">{{ stationPopup.label }}</strong></div><div class="comparison-bands warning-bands"><div><i style="background:#22c55e"/><span>ติดตาม</span><b>ตั้งแต่ 0 ถึง 10 มม.</b></div><div><i style="background:#38bdf8"/><span>เฝ้าระวัง</span><b>มากกว่า 10 ถึง 20 มม.</b></div><div><i style="background:#facc15"/><span>เตรียมรับมือ</span><b>มากกว่า 20 ถึง 35 มม.</b></div><div><i style="background:#f97316"/><span>อพยพ</span><b>มากกว่า 35 ถึง 90 มม.</b></div><div><i style="background:#ef4444"/><span>ต้องอพยพ</span><b>มากกว่า 90 มม.</b></div></div><p>ช่วงค่าด้านบนคือชุดเกณฑ์ที่ใช้ประเมินสถานีนี้จริง</p></div></article><p class="comparison-note"><span>ⓘ</span><span>ใช้ชุดเกณฑ์เดียวสำหรับแสดงระดับและประเมิน Trigger Alert ของสถานีในโครงการ</span></p></section>
                <div class="hx-card sp-mini"><div class="sp-mini-h"><h3>กราฟปริมาณฝนสะสมย้อนหลัง</h3><button class="sp-sec" type="button">↗ ขยายกราฟ</button></div><div class="hx-gr" role="tablist"><button class="on" type="button">รายวัน</button><button type="button">รายเดือน</button><button type="button">รายปี</button></div><div class="hx-tools"><div class="hx-rng"><button v-for="period in rainPeriods" :key="period.key" type="button" :class="{on:rainPeriod===period.key}" @click="rainPeriod=period.key">{{ period.label.replace('ฝนสะสม ','') }}</button></div></div><div class="hx-chart popup-bar-chart"><svg viewBox="0 0 520 190" preserveAspectRatio="none" aria-label="กราฟแท่งปริมาณฝนสะสมย้อนหลัง"><g class="popup-bar-grid"><template v-for="(axis,index) in popupRainAxis" :key="`axis-${axis}`"><line x1="26" :y1="20 + index * 30" x2="505" :y2="20 + index * 30"/><text x="512" :y="24 + index * 30">{{ axis.toFixed(0) }}</text></template></g><g class="popup-bars"><rect v-for="(bar,index) in popupRainBars" :key="`${bar.label}-${bar.time}`" :x="30 + index * 39" :y="140 - (bar.value / popupRainMaximum) * 120" width="17" :height="Math.max(0,(bar.value / popupRainMaximum) * 120)" rx="3"/><template v-for="(bar,index) in popupRainBars" :key="`label-${bar.label}-${bar.time}`"><text v-if="index % 2 === 0" :x="38 + index * 39" y="164">{{ bar.time }}</text></template></g></svg></div><p class="hx-lg"><i style="background:#3b82f6"></i>ฝนสะสม (รายชั่วโมง)</p></div>
              </div>
              <aside class="sp-side"><section class="sp-inf3" aria-label="ข้อมูลสถานี"><div class="sp-who"><span class="sp-av" aria-hidden="true">{{ stationPopup.name?.slice(0,1) || 'ส' }}</span><span class="sp-whot"><em>ผู้ดูแลอุปกรณ์ / ผู้ประสานงาน</em><b>นายอนุชา บุญชม</b></span></div><a class="sp-call" href="tel:0872985066">☎ โทร 087-298-5066</a><dl class="sp-kv"><div><dt>ลุ่มน้ำ</dt><dd>{{ selectedBasin?.name || '–' }}</dd></div><div></div><div class="w"><dt>สถานะข้อมูล</dt><dd class="sp-dst">ปกติ · รับข้อมูลล่าสุด 10:57</dd></div></dl><button class="sp-inf2-h sp-geo-h" type="button"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8-6-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg><span><b>ตำแหน่งและพิกัด</b></span><svg class="i sp-cv" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></section><section class="criteria-history" aria-label="ประวัติผลประเมินเกณฑ์"><h3>ประวัติผลประเมินเกณฑ์ของสถานี</h3><p>ยังไม่มีประวัติผลประเมินที่เชื่อมกับสถานีนี้</p><small>เมื่อเชื่อมข้อมูล จะแยกประเภทเกณฑ์ ช่วงสะสม ค่าที่ตรวจพบ และเวลาที่ประเมิน โดยไม่ใช้รายการแจ้งเตือนสาธิตแทนประวัติจริง</small></section></aside>
            </div>
          </section>
        </div>
        <footer>ชื่อและรหัสสถานีอ้างอิงข้อมูลในระบบ · ค่าฝนเป็นข้อมูลตัวอย่างจากรายงานปริมาณน้ำฝน · ขอบเขตลุ่มน้ำอ้างอิง ONWR</footer>
      </div>
    </div>
  </main>
</template>

<style scoped>
@font-face{font-family:Sarabun;src:url('/assets/bcc369502f7b45efbd73f6a2c5708ac0.ttf') format('truetype');font-weight:400;font-display:swap}@font-face{font-family:Sarabun;src:url('/assets/66d1a1f409f1d7267b7159f42f977071.ttf') format('truetype');font-weight:700;font-display:swap}
*{box-sizing:border-box}.dashboard{--bg:#111214;--panel:#1b1d22;--panel2:#232833;--line:#353b47;--text:#f5f7fa;--muted:#9ca9bd;--blue:#3b82f6;min-height:100vh;background:var(--bg);color:var(--text);font-family:Sarabun,Arial,sans-serif}.dashboard.light{--bg:#f3f5f8;--panel:#fff;--panel2:#ebf0f7;--line:#d4dce8;--text:#172033;--muted:#61728a}.dashboard button,.dashboard input,.dashboard select{font:inherit}.dashboard button{cursor:pointer}.topbar{min-height:68px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 20px}.brand{display:flex;align-items:center;gap:9px;min-width:0}.brand img{width:34px;height:47px;object-fit:contain}.brand strong,.brand small{display:block}.brand strong{font-size:15px}.brand small{font-size:10px;color:var(--muted)}.topbar nav{display:flex;background:var(--panel2);padding:4px;border-radius:25px}.topbar nav button,.header-actions button{border:0;background:transparent;color:var(--text);padding:8px 12px;border-radius:20px;font-size:12px}.topbar nav .on{background:var(--blue);color:white}.header-actions{display:flex;gap:6px}.header-actions button{border:1px solid var(--line);border-radius:8px}.dashboard-grid{display:grid;grid-template-columns:minmax(360px,41%) minmax(0,1fr);align-items:start;gap:0}.map-panel{position:sticky;top:0;height:calc(100vh - 68px);min-height:610px;background:radial-gradient(circle at 48% 38%,#284466,#112339 56%,#0a1728);border-right:1px solid var(--line);overflow:hidden}.map-panel svg{position:absolute;inset:4% 0 0;width:100%;height:92%;filter:drop-shadow(0 2px 2px #0005)}.basin-shape{fill:#b6c2ce20;stroke:#97aabc88;stroke-width:1.5;fill-rule:evenodd;cursor:pointer;transition:fill .2s}.basin-shape:hover,.basin-shape.selected{stroke:#fff;stroke-width:3}.basin-shape.red{fill:#ef4444a8}.basin-shape.orange{fill:#f97316a8}.basin-shape.yellow{fill:#facc15af}.map-caption,.map-legend{position:absolute;z-index:2;background:#111b2de8;border:1px solid #56708c;color:white;border-radius:10px;box-shadow:0 10px 24px #0004}.map-caption{left:16px;top:16px;padding:11px 14px}.map-caption b,.map-caption span,.map-legend b,.map-legend span,.map-legend small{display:block}.map-caption span,.map-legend small{font-size:10px;color:#b7c7dc}.map-caption b{font-size:14px}.map-legend{left:16px;bottom:16px;padding:12px 14px;min-width:206px}.map-legend b{font-size:12px;margin-bottom:8px}.map-legend span{font-size:11px;margin:5px 0}.map-legend small{margin-top:9px}.map-legend i,.summary-lines i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px}.red{background:#ef4444}.orange{background:#f97316}.yellow{background:#facc15}.normal{background:#aeb8c5}.map-label{cursor:pointer}.map-label rect{fill:#0f172add;stroke:#ffffffaa}.map-label text{fill:#fff;font-size:12px;font-weight:700}.map-message{position:absolute;top:47%;left:50%;transform:translate(-50%,-50%);color:white;text-align:center}.content-panel{padding:22px clamp(14px,2vw,32px) 28px;min-width:0}.page-heading,.national-summary header,.basin-list header,.basin-detail header{display:flex;justify-content:space-between;align-items:center;gap:14px}.page-heading{padding-bottom:14px;border-bottom:1px solid var(--line)}.page-heading small,.national-summary header small,.basin-list header small,.basin-detail header small{color:#60a5fa;font-size:10px;font-weight:700}.page-heading h1{font-size:24px;margin:4px 0}.page-heading p,.basin-detail header p{margin:0;color:var(--muted);font-size:12px}.timestamp{border-left:3px solid var(--blue);padding-left:12px;text-align:right;white-space:nowrap}.timestamp b,.timestamp span,.timestamp small{display:block;font-size:10px}.timestamp small{color:var(--muted)}.controls,.national-summary,.basin-detail{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px;margin-top:12px}.scope{display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid var(--line)}.scope b{background:#2363c9;color:white;padding:6px 13px;border-radius:5px;font-size:12px}.scope span,.severity-filters>span{font-size:10px;color:var(--muted)}.search-row{display:grid;grid-template-columns:1fr 1.2fr;gap:10px;margin-top:12px}.search-row label{min-width:0}.search-row label span{display:block;font-size:10px;color:var(--muted);margin-bottom:3px}.search-row select,.search-row input{width:100%;height:40px;color:var(--text);background:var(--panel2);border:1px solid var(--line);border-radius:6px;padding:0 10px;min-width:0}.search-row select option{background:var(--panel)}.severity-filters{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px}.severity-filters>span{width:100%}.severity-filters button{border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:5px;padding:5px 8px;font-size:11px}.severity-filters button.active{background:#2563eb;color:#fff}.severity-filters button.red:not(.active){color:#f87171}.severity-filters button.orange:not(.active){color:#fb923c}.severity-filters button.yellow:not(.active){color:#facc15}.severity-filters button.reset{margin-left:auto}.stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.stat-grid article{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:11px;min-width:0}.stat-grid span,.stat-grid b,.stat-grid small{display:block}.stat-grid span{font-size:10px;color:var(--muted)}.stat-grid b{font-size:25px;line-height:1.2}.stat-grid small{font-size:9px;color:var(--muted)}.stat-grid article:first-child{border-top:3px solid #ef4444}.national-summary h2,.basin-list h2,.basin-detail h2{font-size:18px;margin:2px 0}.national-summary header>span,.basin-list header>span{font-size:10px;color:var(--muted)}.summary-body{display:grid;grid-template-columns:110px minmax(160px,.8fr) minmax(0,1fr);gap:18px;align-items:center;border-top:1px solid var(--line);padding-top:14px;margin-top:10px}.donut{width:96px;height:96px;border-radius:50%;background:conic-gradient(#ef4444 0 var(--red),#f97316 var(--red) var(--orange),#facc15 var(--orange) var(--yellow),#aeb8c5 var(--yellow) 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;isolation:isolate}.donut:before{content:'';position:absolute;inset:13px;border-radius:50%;background:var(--panel);z-index:-1}.donut b{font-size:25px}.donut small{font-size:8px;color:var(--muted)}.summary-lines div{display:flex;align-items:center;font-size:10px;margin:5px 0}.summary-lines b{margin-left:auto}.summary-note{border-left:1px solid var(--line);padding-left:16px}.summary-note b{font-size:13px}.summary-note p{font-size:11px;color:var(--muted);line-height:1.4}.basin-list{margin-top:16px}.basin-list header{margin-bottom:10px}.list-head,.basin-row{display:grid;grid-template-columns:minmax(150px,2fr) minmax(70px,.8fr) minmax(75px,.7fr) minmax(95px,.9fr) minmax(65px,.6fr);gap:8px;align-items:center}.list-head{background:var(--panel2);padding:9px 12px;border-radius:6px;font-size:10px;color:var(--muted)}.basin-row{width:100%;text-align:left;border:1px solid var(--line);border-left:4px solid #aeb8c5;background:var(--panel);color:var(--text);border-radius:7px;padding:10px 9px;margin-top:6px}.basin-row.red{border-left-color:#ef4444}.basin-row.orange{border-left-color:#f97316}.basin-row.yellow{border-left-color:#facc15}.basin-row.active{outline:1px solid var(--blue)}.basin-name{display:grid;grid-template-columns:25px 1fr;gap:0 7px;align-items:center}.basin-name small{grid-row:span 2;color:var(--muted)}.basin-name b{font-size:13px}.basin-name em{font-size:9px;color:var(--muted);font-style:normal}.status-pill{width:max-content;max-width:100%;padding:4px 8px;border-radius:12px;color:#fff;background:#64748b;font-size:10px}.basin-row.red .status-pill,.status-pill.red{background:#b91c1c}.basin-row.orange .status-pill,.status-pill.orange{background:#c2410c}.basin-row.yellow .status-pill,.status-pill.yellow{background:#a16207}.basin-row strong{font-size:14px}.basin-row strong small{font-size:9px;color:var(--muted)}.basin-row .trend,.station-row .trend{color:#60a5fa}.empty{padding:24px;text-align:center;color:var(--muted);font-size:12px}.basin-detail{margin-top:16px}.detail-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:12px;margin-top:13px}.trend-chart,.detail-stats>div{background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:12px}.trend-title{display:flex;justify-content:space-between;font-size:12px}.trend-title strong{color:#60a5fa}.trend-chart svg{width:100%;height:120px;margin-top:5px}.gridline{stroke:var(--line);stroke-width:1}.axis{display:flex;justify-content:space-between;color:var(--muted);font-size:9px}.trend-chart>small{display:block;color:var(--muted);font-size:9px;margin-top:5px}.detail-stats{display:grid;gap:8px}.detail-stats>div{display:flex;justify-content:space-between;align-items:center}.detail-stats span{font-size:11px;color:var(--muted)}.detail-stats b{font-size:18px}.basin-detail h3{font-size:14px;margin:18px 0 8px}.station-head,.station-row{display:grid;grid-template-columns:minmax(140px,1.6fr) repeat(3,minmax(70px,.7fr));gap:8px;align-items:center;padding:9px 10px}.station-head{background:var(--panel2);font-size:10px;color:var(--muted)}.station-row{border-bottom:1px solid var(--line);font-size:11px}.station-row span:first-child b,.station-row span:first-child small{display:block}.station-row span:first-child small{color:var(--muted);font-size:9px}.content-panel footer{color:var(--muted);font-size:10px;padding:18px 0 6px}
@media(max-width:1100px){.dashboard-grid{grid-template-columns:1fr}.map-panel{position:relative;height:480px;min-height:0;border-right:0;border-bottom:1px solid var(--line)}.map-panel svg{height:96%;inset:2% 0 0}.content-panel{padding:18px}.summary-body{grid-template-columns:95px 1fr 1fr}}@media(max-width:680px){.topbar{flex-wrap:wrap;padding:8px 12px}.brand strong{font-size:12px}.brand small{font-size:8px}.topbar nav{order:3;width:100%;justify-content:center}.header-actions button:last-child{display:none}.map-panel{height:400px}.map-caption{left:9px;top:9px}.map-legend{left:9px;bottom:9px;min-width:0;padding:8px}.map-legend span,.map-legend small{font-size:9px}.page-heading{align-items:flex-start;flex-direction:column}.timestamp{text-align:left}.search-row,.detail-grid{grid-template-columns:1fr}.stat-grid{grid-template-columns:repeat(2,1fr)}.summary-body{grid-template-columns:90px 1fr}.summary-note{grid-column:1/-1;border-left:0;border-top:1px solid var(--line);padding:9px 0 0}.basin-list{overflow-x:auto}.list-head,.basin-row{min-width:660px}.station-table{overflow-x:auto}.station-head,.station-row{min-width:530px}}
.arcgis-map{position:absolute;inset:0;z-index:1;opacity:0;transition:opacity .2s}.arcgis-map.ready{opacity:1}.map-message,.map-loading{position:absolute;z-index:4;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:10px;min-width:190px;padding:18px 22px;border-radius:10px;background:#111b2de8;color:#fff;text-align:center;box-shadow:0 8px 24px #0007;font-size:13px}.map-spinner{width:30px;height:30px;border:3px solid #ffffff55;border-top-color:#60a5fa;border-radius:50%;animation:map-spin .8s linear infinite}@keyframes map-spin{to{transform:rotate(360deg)}}.map-panel .map-legend{z-index:20;width:min(250px,calc(100% - 80px));min-width:0;max-height:calc(100% - 100px);overflow:auto;padding:0;background:#1b1d22ee;border-color:#4a5465}.legend-toggle{display:flex;justify-content:space-between;align-items:center;width:100%;border:0;background:transparent;color:white;text-align:left;padding:10px 12px}.legend-toggle b{font-size:12px}.legend-body{padding:0 12px 11px}.legend-body strong{display:block;border-top:1px solid #465063;padding-top:8px;margin-top:8px;font-size:10px}.legend-body span{display:flex;align-items:center;color:#d9e2ee;font-size:10px}.legend-body em{margin-left:auto;color:#b6c3d4;font-style:normal}.legend-body .blue{background:#38bdf8}.legend-body .green{background:#22c55e}.basemap-control{position:absolute;right:15px;bottom:15px;z-index:7}.basemap-current{display:flex;flex-direction:column;gap:2px;align-items:center;width:74px;border:2px solid #fff;border-radius:8px;background:#fff;color:#223044;padding:3px;box-shadow:0 4px 18px #0007;font-size:9px;font-weight:700}.basemap-current img{display:block;width:64px;height:46px;object-fit:cover;border-radius:5px}.basemap-options{position:absolute;right:0;bottom:calc(100% + 8px);display:flex;gap:8px;padding:9px;border-radius:11px;background:#fff;box-shadow:0 10px 30px #0008}.basemap-options button{width:94px;flex:0 0 94px;border:1px solid transparent;border-radius:8px;background:#f3f6fa;color:#27384b;padding:5px;text-align:center;font-size:10px}.basemap-options button.active{border-color:#2563eb;background:#eaf2ff}.basemap-options img{width:82px;height:68px;object-fit:cover;border-radius:5px}.basemap-options span,.basemap-options small{display:block}.basemap-options small{color:#64748b;font-size:8px}@media(max-width:680px){.basemap-control{right:9px;bottom:9px}.basemap-options{gap:3px;padding:5px}.basemap-options button{width:72px;flex-basis:72px;font-size:9px}.basemap-options img{width:60px;height:50px}.map-panel .map-legend{max-height:45%;width:180px}.legend-body strong,.legend-body span{font-size:9px}}
.donut{background:conic-gradient(#ef4444 0 var(--red),#f97316 var(--red) var(--orange),#facc15 var(--orange) var(--yellow),#38bdf8 var(--yellow) var(--blue),#aeb8c5 var(--blue) 100%)}.basin-row.blue{border-left-color:#38bdf8}.basin-row.blue .status-pill,.status-pill.blue{background:#0369a1}.station-level{font-weight:700}.station-level.red{color:#f87171;background:none}.station-level.orange{color:#fb923c;background:none}.station-level.yellow{color:#facc15;background:none}.station-level.blue{color:#38bdf8;background:none}.station-level.normal{color:var(--muted);background:none}
.topbar{min-height:94px;background:#191919;border-bottom:0;padding:12px 24px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:20px}.brand img{width:36px;height:53px}.brand strong{font-size:18px;line-height:1.15}.brand small{font-size:14px;line-height:1.25;color:#f8fafc}.main-nav.topbar nav,.topbar .main-nav{background:none;border-radius:0;padding:0;gap:8px}.topbar .main-nav button,.header-actions .round-action,.header-actions .user-action{height:46px;border:0;border-radius:24px;background:#262626;color:#f8fafc;display:inline-flex;align-items:center;justify-content:center}.topbar .main-nav button:hover,.header-actions .round-action:hover,.header-actions .user-action:hover{background:#404040}.topbar .main-nav .map-link{gap:7px;padding:0 15px;font-size:15px}.topbar .main-nav .nav-icon{width:46px;padding:0}.topbar .main-nav .on{background:#404040;color:#fff}.topbar svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.header-actions{justify-self:end;align-items:center;gap:8px}.header-actions .round-action{width:46px;padding:0;position:relative}.header-actions .theme-action{color:#fbbf24;font-size:22px}.bell-count{position:absolute;top:-3px;right:-2px;min-width:18px;height:18px;padding:0 3px;border-radius:10px;background:#ef4444;color:#fff;font-size:10px;line-height:18px}.header-popover{position:relative}.header-actions .user-action{height:48px;gap:8px;border-radius:9px;padding:0 9px;text-align:left}.avatar{width:30px;height:30px;border-radius:50%;background:#191919;display:grid;place-items:center;font-size:21px}.user-copy strong,.user-copy small{display:block;white-space:nowrap}.user-copy strong{font-size:13px;line-height:15px}.user-copy small{font-size:10px;line-height:13px;color:#cbd5e1}.header-menu{position:absolute;z-index:20;right:0;top:calc(100% + 8px);min-width:170px;padding:10px;background:#262626;color:#fff;border:1px solid #404040;border-radius:9px;box-shadow:0 10px 25px #0008}.header-menu p{font-size:11px;line-height:1.4;margin:7px 0;color:#cbd5e1}.header-menu button{width:100%;border:0;border-radius:5px;padding:7px;background:#404040;color:#fff;text-align:left;font-size:12px}.notification-menu{min-width:225px}.map-panel{height:calc(100vh - 94px)}.dashboard.light .topbar{background:#f7f9fc}.dashboard.light .brand small{color:#334155}.dashboard.light .topbar .main-nav button,.dashboard.light .header-actions .round-action,.dashboard.light .header-actions .user-action{background:#e2e8f0;color:#172033}.dashboard.light .topbar .main-nav .on{background:#cbd5e1}.dashboard.light .header-menu{background:#fff;color:#172033}.dashboard.light .header-menu button{background:#e2e8f0;color:#172033}@media(max-width:900px){.topbar{grid-template-columns:1fr auto;gap:10px}.main-nav{grid-column:1/-1;grid-row:2;justify-content:center}.map-panel{height:480px}.brand strong{font-size:15px}.brand small{font-size:11px}}@media(max-width:680px){.topbar{padding:9px 12px}.topbar .main-nav{order:0;width:auto;justify-content:center}.brand img{width:27px;height:40px}.brand strong{font-size:11px}.brand small{font-size:9px}.header-actions .round-action{width:34px;height:34px}.header-actions .user-action{width:35px;height:35px;padding:0;justify-content:center}.user-copy,.user-action>span:last-child{display:none}.avatar{width:30px;height:30px}.topbar .main-nav button{height:38px}.topbar .main-nav .nav-icon{width:38px}.topbar .main-nav .map-link{font-size:13px}}
/* Match the 76px map-page header at desktop sizes. */
@media(min-width:901px){.topbar{height:76px;min-height:76px;padding:8px 20px;gap:16px}.brand{gap:9px}.brand img{width:27px;height:40px}.brand strong{font-size:15px;line-height:18px}.brand small{font-size:13px;line-height:17px}.topbar .main-nav button{height:36px}.topbar .main-nav .map-link{padding:0 13px;font-size:14px}.topbar .main-nav .nav-icon{width:36px}.topbar svg{width:17px;height:17px}.header-actions .round-action{width:36px;height:36px}.header-actions .theme-action{font-size:18px}.header-actions .user-action{height:36px;padding:0 8px}.avatar{width:27px;height:27px;font-size:18px}.user-copy strong{font-size:12px;line-height:13px}.user-copy small{font-size:9px;line-height:11px}.map-panel{height:calc(100vh - 76px)}}
@media(max-width:680px){.header-actions .round-action,.header-actions .user-action{display:inline-flex}.map-panel{height:400px}}
/* The source map scales its 1920px canvas to the viewport width. Keep the
   dashboard toolbar at the same visible coordinates and size. */
@media(min-width:901px){.topbar{position:relative;height:5.885vw;min-height:5.885vw;padding:0 1.302vw}.brand{transform:translateY(-.26vw)}.brand img{width:1.875vw;height:2.76vw}.brand strong{font-size:1.145vw;line-height:1.458vw}.brand small{font-size:.95vw;line-height:1.25vw}.topbar .main-nav{position:absolute;left:48.02vw;top:1.354vw;gap:.526vw}.topbar .main-nav button{height:2.708vw}.topbar .main-nav .map-link{width:6.25vw;padding:0;font-size:.99vw}.topbar .main-nav .nav-icon{width:3.438vw}.topbar svg{width:1.04vw;height:1.04vw}.header-actions{gap:.526vw;transform:translateY(-.26vw)}.header-actions .round-action{width:2.708vw;height:2.708vw}.header-actions .user-action{width:8.698vw;height:2.604vw}.map-panel{height:calc(100vh - 5.885vw)}}
/* Exact header from the main map: fixed 1920px canvas, scaled as one unit. */
.source-header{width:100%;margin:0;overflow:hidden;background:#191919;color:#f8fafc;font-family:Sarabun,"Leelawadee UI","Noto Sans Thai",sans-serif}.source-header-canvas{position:relative;width:1920px;height:113px;transform-origin:0 0}.source-header button{font-family:inherit;cursor:pointer}.source-logo{position:absolute;left:25px;top:25px;width:36px;height:53px;object-fit:contain}.source-title{position:absolute;left:77px;top:25px;margin:0;font-size:22px;line-height:28px;font-weight:600;letter-spacing:0}.source-title small{font:inherit}.source-nav{position:static}.source-nav button{position:absolute;top:26px;height:52px;border:0;color:#f8fafc;display:flex;align-items:center;justify-content:center}.source-nav .map-link{left:922px;width:120px;border-radius:26px;background:#262626;gap:8px;font-size:19px;font-weight:600}.source-nav .nav-icon{width:66px;border-radius:26px;background:#262626}.source-nav .nav-icon:hover,.source-nav .nav-icon.on{background:#404040}.source-nav .nav-icon:nth-child(2){left:1054px}.source-nav .nav-icon:nth-child(3){left:1132px}.source-nav .nav-icon:nth-child(4){left:1210px}.source-nav svg,.source-actions svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.source-actions{position:static}.source-actions .header-popover{position:absolute;top:26px}.source-actions .header-popover:first-child{left:1597px}.source-actions .header-popover:last-child{left:1729px;top:27px}.source-actions .round-action{width:52px;height:52px;border:0;border-radius:50%;background:#262626;color:#f8fafc;display:flex;align-items:center;justify-content:center;position:relative}.source-actions .round-action:hover{background:#404040}.source-actions .theme-action{position:absolute;left:1661px;top:26px;color:#fbbf24;font-size:24px}.source-actions .user-action{width:167px;height:50px;border:0;border-radius:10px;background:#262626;color:#f8fafc;display:flex;align-items:center;gap:10px;padding:0 10px 0 8px;text-align:left}.source-actions .avatar{width:34px;height:34px;border-radius:50%;background:#191919;display:grid;place-items:center;font-size:21px}.source-actions .user-copy strong{font-size:14px;line-height:18px}.source-actions .user-copy small{font-size:11px;line-height:14px;color:#cbd5e1}.source-actions .bell-count{right:2px;top:2px;min-width:20px;height:20px;padding:0 5px;font-size:11px;line-height:20px;box-shadow:0 0 0 2px #191919}.source-actions .header-menu{top:60px;transform:none}.source-actions .user-action+.header-menu{top:56px}.dashboard.light .source-header{background:#f1f5f9;color:#0f172a}.dashboard.light .source-nav .map-link{background:#fff;color:#0f172a;box-shadow:0 0 0 1px #e2e8f0}.dashboard.light .source-nav .nav-icon,.dashboard.light .source-actions .round-action,.dashboard.light .source-actions .user-action{background:#fff;color:#0f172a;box-shadow:0 0 0 1px #e2e8f0}.dashboard.light .source-nav .nav-icon.on{background:#dbeafe;color:#1d4ed8;box-shadow:none}.dashboard.light .source-actions .avatar{background:#f1f5f9}.map-panel{height:calc(100vh - var(--source-header-height, 113px))}
.dashboard-source-fit svg.i{width:20px;height:20px}.dashboard-source-fit .ex-user svg.i{width:18px;height:18px}.dashboard-source-fit .ex-bell svg.i{width:22px;height:22px}.dashboard-source-fit .ex-clr{top:113px;width:140px;height:44px;border-radius:22px;background:#262626;border:1px solid #404040;color:#94a3b8;display:flex;align-items:center;justify-content:center;gap:7px;font:inherit;font-size:14px}.dashboard-source-fit .ex-clr:disabled{opacity:1;cursor:default}.dashboard-source-fit .ex-clr svg{width:18px;height:18px}.dashboard-source-fit .ex-f .chev{width:20px;height:20px}
.dashboard-grid{height:calc(100vh - var(--source-header-height, 113px));min-height:0;padding:8px;display:grid;grid-template-columns:minmax(0,40%) minmax(0,1fr);gap:18px;align-items:stretch;overflow:hidden}.dashboard-grid>.map-panel,.dashboard-grid>.content-panel{height:100%;min-height:0;border:8px solid #262626;border-radius:14px;overflow:hidden;background:var(--panel)}.dashboard.light .dashboard-grid>.map-panel,.dashboard.light .dashboard-grid>.content-panel{border-color:#e2e8f0}.dashboard-grid>.map-panel{position:relative;top:auto;box-shadow:0 2px 10px #0003}.dashboard-grid>.map-panel .arcgis-map{position:absolute;inset:0}.dashboard-grid>.content-panel{padding:16px;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:#64748b transparent}.dashboard-grid>.content-panel::-webkit-scrollbar{width:8px}.dashboard-grid>.content-panel::-webkit-scrollbar-thumb{background:#64748b;border-radius:8px}.dashboard-grid>.content-panel .page-heading{padding-bottom:10px}.dashboard-grid>.content-panel .page-heading h1{font-size:20px}.dashboard-grid>.content-panel .controls,.dashboard-grid>.content-panel .national-summary,.dashboard-grid>.content-panel .basin-detail{padding:10px;margin-top:8px}.dashboard-grid>.content-panel .stat-grid{margin-top:8px}.dashboard-grid>.content-panel .basin-list{margin-top:12px}.dashboard-grid>.content-panel .basin-row{padding:8px 9px;margin-top:4px}.dashboard-grid>.content-panel footer{padding:10px 0}.dashboard-source-fit .ex{overflow:visible}.dashboard-source-fit .ex-navw{left:calc(var(--dw,0px) / 2)}.dashboard-source-fit .ex-theme{left:calc(1661px + var(--dw,0px))}.dashboard-source-fit .ex-user{left:calc(1729px + var(--dw,0px))}.dashboard-source-fit .ex-bell{left:calc(1597px + var(--dw,0px))}
@media(max-width:900px){.dashboard-grid{height:auto;min-height:calc(100vh - var(--source-header-height, 113px));grid-template-columns:1fr;grid-template-rows:minmax(430px,55vh) minmax(500px,1fr);overflow:visible}.dashboard-grid>.map-panel{height:100%}.dashboard-grid>.content-panel{height:auto;max-height:none;overflow:visible}}
@media(max-width:560px){.dashboard-grid{padding:6px;gap:10px;grid-template-rows:minmax(340px,48vh) auto}.dashboard-grid>.map-panel,.dashboard-grid>.content-panel{border-width:5px;border-radius:11px}.dashboard-grid>.content-panel{padding:10px}.dashboard-grid .stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-grid .summary-body{grid-template-columns:80px 1fr;gap:10px}.dashboard-grid .summary-note{grid-column:1/-1}}
.dashboard{width:100%;min-height:100dvh}
.dashboard-source-fit .ex-map-link{top:26px;width:120px;height:52px;border-radius:26px;background:#262626;display:flex;align-items:center;justify-content:center;gap:8px;color:#f8fafc;font-size:19px;font-weight:600}
.dashboard-source-fit .ex-current{background:#404040;color:#f8fafc}
.dashboard.light .dashboard-source-fit .ex-map-link{background:#fff;color:#0f172a;box-shadow:0 0 0 1px #e2e8f0}
.dashboard.light .dashboard-source-fit .ex-current{background:#dbeafe;color:#1d4ed8}
.dashboard-grid>.content-panel .scope-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:10px}.scope-head>div{display:flex;flex-direction:column;gap:2px}.scope-head .eyebrow{color:#60a5fa;font-size:10px;text-transform:uppercase;letter-spacing:.04em}.scope-head b{font-size:16px}.scope-head small{color:var(--muted);font-size:11px}.freshness{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:11px;white-space:nowrap}.freshness i{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px #22c55e22}.scope-tabs{display:flex;gap:5px;margin-bottom:10px;border-bottom:1px solid var(--line);padding-bottom:8px}.scope-tabs button{border:1px solid var(--line);border-radius:6px;background:var(--panel2);color:var(--muted);padding:6px 13px;font-size:12px}.scope-tabs button:hover{color:var(--text);background:#303746}.scope-tabs button.active{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:700}.dashboard.light .scope-tabs button.active{background:#2563eb;color:#fff}.dashboard-grid>.content-panel .controls .search-row label>span{font-size:10px;color:var(--muted)}
.drilldown-back{border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:6px;padding:5px 9px;font-size:11px;margin-bottom:8px;cursor:pointer}.drilldown-back:hover{background:#2563eb;color:#fff;border-color:#2563eb}.drilldown-banner{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#172554;border:1px solid #2563eb;border-left:4px solid #3b82f6;border-radius:8px;padding:10px 12px;margin-top:10px}.drilldown-banner strong{font-size:14px}.drilldown-banner span{font-size:11px;color:#bfdbfe}.empty-drilldown{padding:28px;text-align:center}.empty-drilldown p{color:var(--muted);font-size:12px}
.drilldown-map-tools{position:absolute;z-index:8;right:14px;top:14px;display:flex;flex-direction:column;gap:8px}.map-tool{width:44px;height:44px;border:0;border-radius:50%;background:#fff;color:#64748b;box-shadow:0 4px 14px #0006;font-size:22px;cursor:pointer}.map-tool:hover,.map-tool.active{background:#2563eb;color:#fff}.map-layer-panel{position:absolute;z-index:9;right:68px;top:14px;width:300px;max-height:calc(100% - 28px);overflow:auto;background:#fff;color:#172033;border-radius:12px;box-shadow:0 10px 30px #0008;padding:14px}.map-layer-panel header{display:flex;flex-direction:column;gap:2px;border-bottom:1px solid #e2e8f0;padding-bottom:9px;margin-bottom:10px}.map-layer-panel header b{font-size:16px}.map-layer-panel header small,.map-layer-panel label small{font-size:10px;color:#64748b}.map-layer-panel>strong{display:block;font-size:10px;color:#64748b;margin:10px 0 4px}.map-layer-panel label{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #eef2f7;font-size:13px;font-weight:700}.map-layer-panel label span{display:flex;flex-direction:column;gap:1px}.map-layer-panel input[type=checkbox]{appearance:none;width:38px;height:22px;border-radius:14px;background:#cbd5e1;position:relative;flex:none;cursor:pointer}.map-layer-panel input[type=checkbox]::after{content:'';position:absolute;width:16px;height:16px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.16s}.map-layer-panel input[type=checkbox]:checked{background:#2563eb}.map-layer-panel input[type=checkbox]:checked::after{left:19px}.sensor-agencies{display:flex;flex-direction:column;gap:5px;padding:8px 0 4px 15px;border-left:2px solid #dbeafe;color:#334155;font-size:11px}.sensor-agencies span{display:flex;justify-content:space-between}.sensor-agencies em{font-style:normal;color:#64748b}@media(max-width:680px){.map-layer-panel{right:58px;width:min(280px,calc(100% - 74px));top:10px}.drilldown-map-tools{right:9px;top:9px}.map-tool{width:38px;height:38px;font-size:18px}}
.source-pin-layer{position:absolute;inset:0;z-index:6;pointer-events:auto}
.source-pin{position:absolute;z-index:1;width:26px;height:26px;margin:-13px 0 0 -13px;padding:0;border:2px solid #fff;border-radius:9999px;cursor:pointer;color:var(--pi,#fff);display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 32% 28%,color-mix(in srgb,var(--pc) 55%,#fff) 0%,var(--pc) 64%);box-shadow:0 2px 6px rgba(0,0,0,.45);transition:transform 120ms;pointer-events:auto}
.source-pin .pm-i{display:block;width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}.source-pin .pm-off{display:none}
.source-pin:hover,.source-pin:focus-visible{transform:scale(1.18);z-index:6;outline:none;box-shadow:0 0 0 3px rgba(96,165,250,.6),0 2px 8px rgba(0,0,0,.5)}
.source-pin.red{z-index:3;width:30px;height:30px;margin:-15px 0 0 -15px}.source-pin.red .pm-i{width:16px;height:16px}
@keyframes source-pin-ring{0%{transform:scale(.95);opacity:var(--wo,1)}100%{transform:scale(var(--ws,2.4));opacity:0}}
@keyframes source-pin-beat{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes source-pin-beat-red{0%,100%{transform:scale(1);box-shadow:0 2px 6px rgba(0,0,0,.45),0 0 0 0 rgba(239,68,68,.5)}50%{transform:scale(1.1);box-shadow:0 2px 6px rgba(0,0,0,.45),0 0 18px 7px rgba(239,68,68,.65)}}
.source-pin.wave::before,.source-pin.wave::after{content:'';position:absolute;inset:-3px;border-radius:9999px;border:var(--wb,2px) solid var(--pc);opacity:0;animation:source-pin-ring var(--wd,2s) ease-out infinite;pointer-events:none}
.source-pin.wave::after{animation-delay:calc(var(--wd,2s)/2)}
.source-pin.w1{z-index:2;--wb:1.5px;--wd:2.6s;--ws:1.7;--wo:.55}.source-pin.w1::after{display:none}.source-pin.w2{z-index:2;--wb:2px;--wd:2.1s;--ws:2;--wo:.75}.source-pin.w2::after{display:none}.source-pin.w3{z-index:3;--wb:2.5px;--wd:1.7s;--ws:2.4;--wo:.9;animation:source-pin-beat 1.6s ease-in-out infinite}.source-pin.w4{z-index:4;--wb:3px;--wd:1.3s;--ws:2.9;--wo:1;animation:source-pin-beat 1.1s ease-in-out infinite}.source-pin.red.wave{animation:source-pin-beat-red 1.35s cubic-bezier(.4,0,.2,1) infinite}
.drilldown-map-tools{right:14px;top:0;gap:0;z-index:9}.map-tool{position:absolute;right:0;width:48px;height:48px;display:flex;align-items:center;justify-content:center;border:0;border-radius:9999px;background:#fff;color:#64748b;box-shadow:0 1px 3px rgba(0,0,0,.3);font-size:0}.map-tool:nth-child(1){top:14px}.map-tool:nth-child(2){top:71px}.map-tool:nth-child(3){top:128px}.map-tool svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.map-tool:nth-child(3) svg{width:20px;height:20px}.map-tool:hover{color:#111827}.map-tool.active{background:#2563eb;color:#fff}.map-layer-panel{right:72px;top:14px;width:380px;max-height:calc(100% - 28px);padding:12px 8px 8px;border-radius:14px;box-shadow:0 12px 28px rgba(0,0,0,.4)}@media(max-width:680px){.drilldown-map-tools{right:9px;top:0}.map-tool{width:40px;height:40px}.map-tool:nth-child(1){top:9px}.map-tool:nth-child(2){top:58px}.map-tool:nth-child(3){top:107px}.map-layer-panel{right:58px;width:min(380px,calc(100% - 74px))}}
.dashboard-grid>.map-panel .map-tool svg{position:static;inset:auto;width:22px;height:22px;filter:none}
.dashboard-grid>.map-panel .map-tool:nth-child(3) svg{width:20px;height:20px}
.dashboard-grid>.map-panel .source-pin .pm-i{position:static;inset:auto;width:14px;height:14px;filter:none}
.dashboard-grid>.map-panel .source-pin.red .pm-i{width:16px;height:16px}
.runoff-pin-layer{z-index:7}.runoff-pin{position:absolute;z-index:1;width:22px;height:22px;margin:-11px 0 0 -11px;padding:3px;border:2px solid #fff;border-radius:50%;background:var(--runoff-color);box-shadow:0 2px 5px #0009;display:grid;place-items:center;pointer-events:auto}.runoff-pin svg{width:14px;height:14px;fill:none;stroke:#fff;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.runoff-pin:hover,.runoff-pin:focus-visible{transform:scale(1.18);outline:none;box-shadow:0 0 0 3px #60a5fa99,0 2px 8px #0009}
.station-identity{display:flex!important;align-items:center;gap:7px}.station-identity>img{width:24px;height:24px;object-fit:contain;flex:none}.station-identity>span{min-width:0}.station-table .station-row{width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:transparent;color:inherit;font:inherit;cursor:pointer}.station-table .station-row:hover,.station-table .station-row:focus-visible{background:color-mix(in srgb,var(--panel2) 55%,transparent);outline:none}.station-table .station-row:focus-visible{box-shadow:inset 0 0 0 2px #3b82f6}
.station-row[role=button]{cursor:pointer}.station-row[role=button]:hover{background:color-mix(in srgb,var(--panel2) 55%,transparent)}.station-popup-backdrop{position:fixed;inset:0;z-index:50;display:grid;place-items:center;padding:20px;background:#0009}.station-popup{position:relative;width:min(720px,calc(100vw - 32px));max-height:calc(100vh - 40px);overflow:auto;background:#202124;border:1px solid #4b5563;border-radius:14px;box-shadow:0 24px 70px #000b;color:#f8fafc}.station-popup-close{position:absolute;right:14px;top:12px;width:34px;height:34px;border:0;border-radius:8px;background:#fff;color:#ef4444;font-size:25px;line-height:1}.station-popup-head{padding:22px 54px 17px 22px;border-bottom:1px solid #3f4652}.station-popup-head h2{margin:8px 0 0;font-size:22px}.station-popup-head small,.station-popup-head p{display:block;color:#9ca9bd;margin:3px 0;font-size:12px}.station-popup-body{padding:16px;display:grid;grid-template-columns:1.3fr 1fr;gap:12px}.station-popup-value,.station-popup-rule{border:1px solid #3f4652;border-radius:10px;background:#292b30;padding:16px}.station-popup-value span,.station-popup-rule span,.station-popup-rule strong,.station-popup-footer span{display:block;color:#aab5c6;font-size:11px}.station-popup-value b{display:block;font-size:42px;line-height:1.15;margin:10px 0;color:#86d56f}.station-popup-value em{font-style:normal;color:#60a5fa;font-size:12px}.station-popup-rule b{display:block;font-size:15px;margin-bottom:10px}.station-popup-rule strong{margin-top:10px;color:#dbeafe;font-weight:400}.station-popup-footer{display:flex;align-items:center;gap:12px;padding:13px 16px;border-top:1px solid #3f4652}.station-popup-footer b{margin-right:auto;font-size:12px}.station-popup-footer button{border:1px solid #4b5563;border-radius:7px;background:#303640;color:#fff;padding:7px 16px}@media(max-width:680px){.station-popup-body{grid-template-columns:1fr}.station-popup-head h2{font-size:18px}}
.period-tabs{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:10px;padding-bottom:8px;border-bottom:1px solid var(--line)}
.period-tabs>span{width:100%;font-size:10px;color:var(--muted)}
.period-tabs button{border:1px solid var(--line);border-radius:6px;background:var(--panel2);color:var(--muted);padding:5px 9px;font-size:11px}
.period-tabs button:hover{color:var(--text);background:#303746}
.period-tabs button.active{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:700}
.detail-period-tabs{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:10px;padding:8px 0 2px;border-top:1px solid var(--line)}
.detail-period-tabs>span{font-size:10px;color:var(--muted);margin-right:4px}
.detail-period-tabs button{border:1px solid var(--line);border-radius:6px;background:var(--panel2);color:var(--muted);padding:4px 8px;font-size:10px}
.detail-period-tabs button.active{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:700}
.legend-body .runoff-low{background:#f97316}.legend-body .runoff-watch{background:#facc15}.legend-body .runoff-normal{background:#22c55e}.legend-body .runoff-high{background:#2563eb}.legend-body .runoff-critical{background:#ef4444}
.runoff-layer-label{font-size:10px;color:#d9e2ee}
.station-popup{width:min(970px,calc(100vw - 32px));background:#202124}.station-popup-head{min-height:108px;display:flex;align-items:flex-start;gap:12px;padding:18px 58px 14px 22px;background:#292929}.station-popup-head h2{margin:5px 0 0;font-size:21px}.station-popup-head h2 small{font-size:12px;color:#cbd5e1;background:#3a3d43;padding:4px 7px;border-radius:5px;margin-left:5px}.station-popup-head p{color:#9ca9bd}.station-popup-tools{margin-left:auto;display:flex;gap:7px}.station-popup-tools button{height:36px;border:1px solid #4b4f58;background:#262626;color:#f8fafc;border-radius:8px;padding:0 11px}.station-popup-body{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(250px,.85fr);gap:14px;padding:16px}.station-popup-main{min-width:0}.station-popup-latest h3,.station-popup-rule h3,.station-popup-chart h3{margin:0 0 10px;font-size:16px}.station-popup-latest h3 span{font-size:11px;color:#94a3b8;font-weight:400;margin-left:8px}.station-popup-value{display:flex;align-items:center;gap:12px;background:#2a2a2e;border:1px solid #3f4652;border-radius:11px;padding:14px}.station-popup-value .rain-icon{width:44px;height:44px;display:grid;place-items:center;border:2px solid #86d56f;border-radius:9px;background:#ecfdf5;color:#111;font-size:22px}.station-popup-value b,.station-popup-value small,.station-popup-value strong{display:block}.station-popup-value b{font-size:18px}.station-popup-value small{font-size:11px;color:#aab5c6}.station-popup-value strong{font-size:44px;color:#86d56f;line-height:1.1;margin-top:7px}.station-popup-value>.status-pill{margin-left:auto}.station-popup-rule{margin-top:12px;background:#25272b;border:1px solid #4b4f58;border-radius:11px;padding:14px}.popup-periods{display:flex;gap:6px;background:#253348;padding:9px;border-radius:8px}.popup-periods span{padding:5px 9px;border-radius:15px;background:#30343b;color:#dbeafe;font-size:11px}.popup-periods .active{background:#e7f0ff;color:#1d4ed8;border:2px solid #3b82f6}.station-popup-rule p{font-size:11px;color:#94a3b8}.criteria-bar{display:flex;align-items:center;gap:3px;position:relative;margin-top:14px}.criteria-bar i{height:4px;flex:1;background:#22c55e}.criteria-bar i:nth-child(2){background:#38bdf8}.criteria-bar i:nth-child(3){background:#facc15}.criteria-bar i:nth-child(4){background:#f97316}.criteria-bar i:nth-child(5){background:#ef4444}.criteria-bar b{position:absolute;right:0;bottom:8px;color:#f87171;font-size:11px}.station-popup-chart{margin-top:14px;background:#292a2e;border:1px solid #3f4652;border-radius:10px;padding:14px}.station-popup-chart svg{width:100%;height:90px}.station-popup-side{background:#292a2e;border-radius:11px;padding:14px}.owner-card{border-bottom:1px solid #3f4652;padding-bottom:12px}.owner-card b,.owner-card strong{display:block}.owner-card b{color:#aab5c6;font-size:12px}.owner-card strong{font-size:15px;margin:4px 0 10px}.owner-card button{width:100%;height:38px;border:1px solid #16a34a;border-radius:8px;background:#203e2d;color:#4ade80;font-weight:700}.station-popup-side dl{margin:14px 0}.station-popup-side dl div{padding:8px 0;border-bottom:1px solid #3f4652}.station-popup-side dt{color:#94a3b8;font-size:11px}.station-popup-side dd{margin:2px 0 0;font-size:13px}.history-card{border:1px solid #4b4f58;border-radius:10px;padding:13px}.history-card b{font-size:14px}.history-card p{font-size:11px;color:#94a3b8;line-height:1.5}.station-popup-footer{background:#24364c;justify-content:space-between}.station-popup-footer button{border:1px solid #4b5563;border-radius:7px;background:#303640;color:#fff;padding:7px 16px}@media(max-width:760px){.station-popup-tools button{font-size:0;padding:0;width:34px}.station-popup-body{grid-template-columns:1fr}.station-popup-head h2{font-size:18px}}
/* Reuse the map page's station popup classes and proportions. This is intentionally
   kept in the same class vocabulary as Exact.html so Dashboard opens the same
   visual surface rather than a second, dashboard-specific modal. */
.station-popup-backdrop.ex{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.62)}
.station-popup-backdrop.ex .sp{position:relative;left:auto;top:auto;translate:none;width:min(1080px,calc(100vw - 32px));height:min(840px,calc(100vh - 30px));max-height:calc(100vh - 30px);border-radius:16px;background:#1f1f1f;border:1px solid #404040;box-shadow:0 25px 50px -12px rgba(0,0,0,.75);display:flex;flex-direction:column;overflow:hidden;color:#f8fafc;font-family:Sarabun,"Leelawadee UI","Noto Sans Thai",sans-serif}
.station-popup-backdrop.ex .sp-h{height:auto;min-height:90px;flex-shrink:0;display:flex;align-items:flex-start;gap:24px;padding:18px 24px 14px;background:#2a2a2a;border-bottom:1px solid #404040;position:relative}
.station-popup-backdrop.ex .sp-ttl{width:372px;min-width:0;display:flex;flex-direction:column;gap:6px}.station-popup-backdrop.ex .sp-bd{align-self:flex-start;margin:0;padding:2px 7px;border-radius:6px;font-size:13px;line-height:20px;font-weight:600;color:#fff}.station-popup-backdrop.ex .sp-bd.b-bad{background:#ef4444}.station-popup-backdrop.ex .sp-bd.b-warn{background:#d97706}.station-popup-backdrop.ex .sp-bd.b-ok{background:#16a34a}.station-popup-backdrop.ex .sp-bd.b-none{background:#737373}.station-popup-backdrop.ex .sp-tr{display:flex;align-items:center;gap:10px;min-width:0;max-width:100%}.station-popup-backdrop.ex .sp-tr h2{min-width:0;margin:0;font-size:17px;line-height:24px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.station-popup-backdrop.ex .sp-id{flex-shrink:0;padding:2px 8px;border-radius:6px;background:#333;box-shadow:inset 0 0 0 1px #404040;font-size:14px;line-height:20px;font-weight:600;color:#cbd5e1;font-variant-numeric:tabular-nums;white-space:nowrap}.station-popup-backdrop.ex .sp-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 18px;margin:0;font-size:15px;line-height:22px;color:#94a3b8;white-space:normal}.station-popup-backdrop.ex .sp-meta .m{display:inline-flex;align-items:center;gap:6px;min-width:0}.station-popup-backdrop.ex .sp-meta svg{flex-shrink:0;color:#64748b;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.station-popup-backdrop.ex .sp-tools{display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:auto;margin-right:69px}.station-popup-backdrop.ex .sp-loc{height:44px;padding:0 14px;border-radius:10px;border:1px solid #404040;background:#262626;color:#e2e8f0;display:flex;align-items:center;gap:8px;font:inherit;font-size:15px;font-weight:600;cursor:pointer}.station-popup-backdrop.ex .sp-loc svg,.station-popup-backdrop.ex .sp-hb svg,.station-popup-backdrop.ex .sp-sec svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.station-popup-backdrop.ex .sp-hact{display:flex;gap:8px;flex-shrink:0}.station-popup-backdrop.ex .sp-hb{width:44px;height:44px;border:0;border-radius:10px;background:#262626;box-shadow:inset 0 0 0 1px #404040;color:#e2e8f0;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}.station-popup-backdrop.ex .sp-div{position:absolute;right:68px;top:22px;width:1px;height:36px;background:#404040}.station-popup-backdrop.ex .sp-x{position:absolute;right:20px;top:22px;margin:0;width:32px;height:32px;border:0;border-radius:8px;background:#fff;color:#dc2626;display:flex;align-items:center;justify-content:center;padding:0}.station-popup-backdrop.ex .sp-x svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.station-popup-backdrop.ex .sp-b{flex:1;min-height:0;padding:16px;display:flex;flex-direction:column}.station-popup-backdrop.ex .sp-b2{flex-direction:row;gap:16px;align-items:flex-start;overflow:auto}.station-popup-backdrop.ex .sp-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px}.station-popup-backdrop.ex .sp-mh{display:flex;align-items:center;gap:12px}.station-popup-backdrop.ex .sp-mh h3{flex:1;margin:0;font-size:20px;line-height:28px;font-weight:700}.station-popup-backdrop.ex .sp-mh h3 span{margin-left:8px;font-size:15px;font-weight:400;color:#94a3b8}.station-popup-backdrop.ex .sp-sec{height:38px;padding:0 14px;border:0;border-radius:10px;background:#262626;box-shadow:inset 0 0 0 1px #404040;color:#e2e8f0;font:inherit;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;cursor:pointer;white-space:nowrap;flex-shrink:0}.station-popup-backdrop.ex .sp-sec b{min-width:22px;height:22px;padding:0 6px;border-radius:9999px;background:#404040;color:#fff;font-size:13px;display:inline-flex;align-items:center;justify-content:center}
.station-popup-backdrop.ex .sp-side{width:320px;flex-shrink:0;display:flex;flex-direction:column;gap:12px}.station-popup-backdrop.ex .sp-inf3{border-radius:12px;background:#2a2a2a;padding:14px;display:flex;flex-direction:column;gap:12px}.station-popup-backdrop.ex .sp-who{display:flex;align-items:center;gap:12px}.station-popup-backdrop.ex .sp-av{width:40px;height:40px;flex-shrink:0;border-radius:9999px;background:#404040;color:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700}.station-popup-backdrop.ex .sp-whot{min-width:0;display:flex;flex-direction:column}.station-popup-backdrop.ex .sp-whot em{font-style:normal;font-size:14px;line-height:20px;color:#94a3b8}.station-popup-backdrop.ex .sp-whot b{font-size:17px;line-height:24px}.station-popup-backdrop.ex .sp-call{height:44px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;background:rgba(34,197,94,.12);box-shadow:inset 0 0 0 1px rgba(34,197,94,.55);color:#4ade80;text-decoration:none;font-size:16px;font-weight:700}.station-popup-backdrop.ex .sp-kv{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:12px;border-top:1px solid #404040}.station-popup-backdrop.ex .sp-kv div{min-width:0;display:flex;flex-direction:column}.station-popup-backdrop.ex .sp-kv dt{font-size:14px;line-height:20px;color:#94a3b8}.station-popup-backdrop.ex .sp-kv dd{margin:0;font-size:16px;line-height:22px;font-weight:600;overflow-wrap:anywhere}.station-popup-backdrop.ex .sp-kv div.w{grid-column:1 / -1}.station-popup-backdrop.ex .sp-geo-h{padding:10px 0 0;border:0;border-top:1px solid #404040;border-radius:0;display:flex;align-items:center;gap:8px;background:transparent;color:inherit;font:inherit;text-align:left}.station-popup-backdrop.ex .sp-geo-h b{font-size:16px}.station-popup-backdrop.ex .sp-geo-h .sp-cv{margin-left:auto;width:20px;height:20px}.station-popup-backdrop.ex .criteria-history{border:1px solid #474747;border-radius:12px;background:#222;padding:15px}.station-popup-backdrop.ex .criteria-history h3{font-size:17px;line-height:24px;margin:0 0 10px}.station-popup-backdrop.ex .criteria-history p{font-size:13px;line-height:21px;color:#b7c3d5}.station-popup-backdrop.ex .criteria-history small{display:block;margin-top:8px;color:#8fa0b8;font-size:11px;line-height:18px}
.station-popup-backdrop.ex .rc{font-family:inherit;color:#f4f4f5;--rc-card:#2a2a2e;--rc-line:#3f3f46;--rc-lb:#d4d4d8;--rc-tile:#fff;--rc-none:#f4f4f5;--rc-ok:#22c55e;--rc-warn:#f97316;--rc-bad:#ef4444}.station-popup-backdrop.ex .rc-one{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:12px;background:var(--rc-card)}.station-popup-backdrop.ex .rc-oh{display:flex;align-items:center;gap:12px}.station-popup-backdrop.ex .rc-ic{width:48px;height:48px;flex-shrink:0;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1.5px #e5e7eb;color:#2563eb;font-size:25px}.station-popup-backdrop.ex .s-ok .rc-ic{box-shadow:inset 0 0 0 1.5px #22c55e;color:#22c55e}.station-popup-backdrop.ex .s-warn .rc-ic{box-shadow:inset 0 0 0 1.5px #f97316;color:#f97316}.station-popup-backdrop.ex .s-bad .rc-ic{box-shadow:inset 0 0 0 1.5px #ef4444;color:#ef4444;background:#fef2f2}.station-popup-backdrop.ex .rc-tx{display:flex;flex-direction:column;min-width:0}.station-popup-backdrop.ex .rc-lb{font-size:18px;line-height:26px;font-weight:600}.station-popup-backdrop.ex .rc-note{display:flex;align-items:center;gap:6px;font-size:14px;line-height:20px;color:#d4d4d8}.station-popup-backdrop.ex .rc-pill{margin-left:auto;flex-shrink:0;padding:2px 12px;border-radius:9999px;font-size:16px;line-height:26px;font-weight:600;color:#fff;background:#71717a}.station-popup-backdrop.ex .s-ok .rc-pill{background:#22c55e}.station-popup-backdrop.ex .s-warn .rc-pill{background:#f97316}.station-popup-backdrop.ex .s-bad .rc-pill{background:#ef4444}.station-popup-backdrop.ex .rc-big{display:flex;align-items:baseline;gap:8px;padding-left:2px}.station-popup-backdrop.ex .rc-big b{font-size:52px;line-height:58px;font-weight:700;color:#f4f4f5}.station-popup-backdrop.ex .s-ok .rc-big b{color:#86d56f}.station-popup-backdrop.ex .s-warn .rc-big b{color:#fb923c}.station-popup-backdrop.ex .s-bad .rc-big b{color:#ff365d}.station-popup-backdrop.ex .rc-big i{font-style:normal;font-size:22px;color:#cbd5e1}
.station-popup-backdrop.ex .criteria-comparison{flex:none;border:1px solid #474747;background:#222;border-radius:12px;overflow:hidden;font-size:14px;line-height:21px}.station-popup-backdrop.ex .comparison-header{display:flex;align-items:center;padding:13px 16px;border-bottom:1px solid #404040}.station-popup-backdrop.ex .comparison-header h3{font-size:19px;line-height:26px;margin:0;display:flex;gap:10px;align-items:center}.station-popup-backdrop.ex .comparison-periods{padding:12px 13px 7px;display:flex;align-items:center;gap:5px;flex-wrap:wrap}.station-popup-backdrop.ex .comparison-periods>span{color:#b9c5d5;font-size:13px;margin-right:auto}.station-popup-backdrop.ex .comparison-periods button{border:1px solid #484848;background:#2a2a2a;color:#dbe5f1;border-radius:18px;padding:5px 10px;line-height:20px;font-size:13px}.station-popup-backdrop.ex .comparison-periods button.selected{background:#eff6ff;color:#172554;border-color:#60a5fa;box-shadow:0 0 0 2px #2563eb}.station-popup-backdrop.ex .comparison-observation{display:flex;justify-content:space-between;gap:12px;padding:8px 16px 13px;color:#aebed3;font-size:13px}.station-popup-backdrop.ex .comparison-observation strong{color:#f1f5f9;font-size:19px}.station-popup-backdrop.ex .comparison-row{display:block;margin:0 12px 8px;border:1px solid #454545;border-radius:9px;overflow:hidden}.station-popup-backdrop.ex .comparison-source{display:flex;align-items:center;gap:10px;padding:13px 12px;background:#253348;border-bottom:1px solid #46576c}.station-popup-backdrop.ex .comparison-source-icon{display:grid;place-items:center;width:38px;height:42px;background:#2563eb;border-radius:8px;font-size:28px;color:#fff;flex-shrink:0}.station-popup-backdrop.ex .comparison-source-title{flex:1;min-width:0}.station-popup-backdrop.ex .comparison-source strong{font-size:15px;display:block}.station-popup-backdrop.ex .comparison-source-title>span{font-size:12px;color:#c3cddd;display:block;margin-top:3px}.station-popup-backdrop.ex .comparison-source-badge{flex:0 0 auto;padding:3px 8px;border:1px solid #60a5fa;border-radius:999px;background:#1e3a5f;color:#dbeafe;font-size:11px;font-weight:700}.station-popup-backdrop.ex .comparison-result{padding:12px 15px}.station-popup-backdrop.ex .comparison-result>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:#aebdd0}.station-popup-backdrop.ex .comparison-bands{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;margin:9px 0 6px;text-align:center}.station-popup-backdrop.ex .comparison-bands>div{position:relative;padding-top:7px}.station-popup-backdrop.ex .comparison-bands i{position:absolute;top:0;left:0;right:0;height:4px;border-radius:999px}.station-popup-backdrop.ex .comparison-bands span,.station-popup-backdrop.ex .comparison-bands b{display:block;font-size:10px;line-height:16px}.station-popup-backdrop.ex .comparison-bands span{color:#bdc9db}.station-popup-backdrop.ex .comparison-bands b{color:#ecf2fb;font-weight:500}.station-popup-backdrop.ex .comparison-result p{font-size:11px;line-height:17px;color:#9fadc0}.station-popup-backdrop.ex .comparison-note{display:flex;gap:8px;margin:11px 12px 9px;padding:9px 11px;background:#223348;border:1px solid #3b608c;border-radius:7px;font-size:12px;line-height:19px;color:#bfdbfe}
.station-popup-backdrop.ex .hx-card{border-radius:12px;background:#2a2a2a;padding:14px 12px 10px;display:flex;flex-direction:column}.station-popup-backdrop.ex .sp-mini-h{display:flex;align-items:center;margin-bottom:10px}.station-popup-backdrop.ex .sp-mini-h h3{flex:1;margin:0;font-size:18px;line-height:26px}.station-popup-backdrop.ex .hx-gr{display:flex;border-bottom:2px solid #404040}.station-popup-backdrop.ex .hx-gr button{flex:1;height:38px;border:0;border-bottom:2px solid transparent;margin-bottom:-2px;background:transparent;color:#94a3b8;font-size:15px;border-radius:6px 6px 0 0}.station-popup-backdrop.ex .hx-gr button.on{background:#1f1f1f;color:#fff;border-bottom-color:#e2e8f0;font-weight:600}.station-popup-backdrop.ex .hx-tools{display:flex;align-items:center;gap:6px;height:38px;margin-top:14px}.station-popup-backdrop.ex .hx-rng{display:flex;gap:2px;padding:4px;border-radius:9999px;background:#fafafa;max-width:100%;overflow:auto}.station-popup-backdrop.ex .hx-rng button{height:30px;padding:0 12px;border:0;border-radius:9999px;background:transparent;color:#525252;font-size:13px;white-space:nowrap}.station-popup-backdrop.ex .hx-rng button.on{background:#18181b;color:#fff;font-weight:600}.station-popup-backdrop.ex .hx-chart{min-height:150px;margin-top:6px}.station-popup-backdrop.ex .hx-chart svg{display:block;width:100%;height:170px}.station-popup-backdrop.ex .hx-lg{display:flex;justify-content:center;align-items:center;gap:8px;margin:2px 0 0;font-size:13px;color:#cbd5e1}.station-popup-backdrop.ex .hx-lg i{width:22px;height:10px;border-radius:3px}
@media(max-width:760px){.station-popup-backdrop.ex{padding:8px}.station-popup-backdrop.ex .sp{width:calc(100vw - 16px);height:calc(100vh - 16px);max-height:none}.station-popup-backdrop.ex .sp-h{gap:8px;padding:14px 14px 12px}.station-popup-backdrop.ex .sp-ttl{width:auto;flex:1}.station-popup-backdrop.ex .sp-tools{margin-right:44px}.station-popup-backdrop.ex .sp-loc{font-size:0;width:44px;padding:0;justify-content:center}.station-popup-backdrop.ex .sp-b2{flex-direction:column!important}.station-popup-backdrop.ex .sp-main{width:100%;flex:none}.station-popup-backdrop.ex .sp-side{width:100%;flex:none}.station-popup-backdrop.ex .comparison-bands{grid-template-columns:repeat(5,100px);overflow:auto}.station-popup-backdrop.ex .hx-rng{border-radius:8px}}
.station-popup-backdrop.ex{width:100vw!important;height:100vh!important;left:0!important;top:0!important;transform:none!important;scale:none!important}
.station-popup-backdrop.ex .sp{height:auto!important;max-height:calc(100vh - 30px)!important;overflow-y:auto!important;top:0!important;left:0!important;translate:none!important}
.station-popup-backdrop.ex .sp-geo-h>svg:first-child{width:18px!important;height:18px!important;flex:0 0 18px!important}.station-popup-backdrop.ex .sp-geo-h .sp-cv{width:20px!important;height:20px!important;flex:0 0 20px!important}.station-popup-backdrop.ex .sp-geo-h>span{flex:1;min-width:0}
.station-popup-backdrop.ex .popup-bar-chart{min-height:190px}.station-popup-backdrop.ex .popup-bar-chart svg{width:100%;height:190px!important;overflow:visible}.station-popup-backdrop.ex .popup-bar-grid line{stroke:#3f3f46;stroke-width:1}.station-popup-backdrop.ex .popup-bar-grid text{fill:#94a3b8;font-size:10px;text-anchor:start}.station-popup-backdrop.ex .popup-bars rect{fill:#3b82f6}.station-popup-backdrop.ex .popup-bars rect:hover{fill:#60a5fa}.station-popup-backdrop.ex .popup-bars text{fill:#94a3b8;font-size:10px;text-anchor:middle}
.station-popup-backdrop.ex .rc-sec{width:100%;min-width:0}.station-popup-backdrop.ex .rc-sec .rc-one{width:100%;max-width:none;min-width:0}.station-popup-backdrop.ex .rc-oh{min-width:0}.station-popup-backdrop.ex .rc-tx{flex:1 1 auto;min-width:0}.station-popup-backdrop.ex .rc-pill{white-space:nowrap;flex:0 0 auto}
.cctv-pin-layer{position:absolute;inset:0;z-index:11;pointer-events:auto}.cctv-pin{position:absolute;translate:-50% -50%;width:28px;height:28px;border:2px solid #fff;border-radius:50%;background:var(--cctv-color,#3fa8f5);box-shadow:0 0 0 3px color-mix(in srgb,var(--cctv-color,#3fa8f5) 30%,transparent),0 3px 8px rgba(0,0,0,.4);display:grid;place-items:center;cursor:pointer;padding:0}.cctv-pin img{width:19px;height:19px;object-fit:contain;filter:brightness(0) invert(1)}.cctv-pin:focus-visible{outline:3px solid #facc15;outline-offset:3px}
.cctv-popup-backdrop{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.66)}.cctv-popup{width:min(1220px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;border:1px solid #505050;border-radius:16px;background:#242424;color:#f8fafc;box-shadow:0 24px 70px rgba(0,0,0,.65);font-family:Sarabun,"Leelawadee UI","Noto Sans Thai",sans-serif}.cctv-popup-head{display:flex;gap:18px;padding:20px 24px 16px;background:#292929;border-bottom:1px solid #484848}.cctv-popup-title{min-width:0;flex:1}.cctv-status{display:inline-flex;padding:4px 12px;border-radius:6px;background:#39d27a;color:#082b19;font-size:14px;font-weight:800}.cctv-title-row{display:flex;align-items:center;gap:10px;margin-top:7px}.cctv-title-row h2{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:24px}.cctv-code{padding:3px 8px;border-radius:6px;background:#3a3a3a;color:#cbd5e1;font-size:14px;white-space:nowrap}.cctv-popup-head p{display:flex;flex-wrap:wrap;gap:8px 20px;margin:6px 0 0;color:#9fb0c5;font-size:15px}.cctv-close{width:36px;height:36px;border:0;border-radius:8px;background:#fff;color:#ef4444;font-size:28px;line-height:1;cursor:pointer}.cctv-popup-body{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(320px,.8fr);gap:18px;padding:18px}.cctv-main{min-width:0}.cctv-tabs{display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #424242}.cctv-tabs button{flex:1;min-height:46px;border:0;border-radius:8px 8px 0 0;background:#303030;color:#cbd5e1;font:inherit;font-size:15px;cursor:pointer}.cctv-tabs button.active{background:#f1f1f1;color:#171717;font-weight:800}.cctv-viewer{position:relative;min-height:430px;border-radius:12px;background:#090a0b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#f3f4f6;box-shadow:inset 0 0 0 1px #3e4146}.cctv-viewer small{position:absolute;right:18px;bottom:14px;color:#cbd5e1;font-size:12px}.cctv-loader{width:52px;height:52px;border:5px solid #424242;border-top-color:#e5e7eb;border-radius:50%;animation:cctv-spin 1s linear infinite}@keyframes cctv-spin{to{transform:rotate(360deg)}}.cctv-viewer strong{font-size:18px}.cctv-side{min-width:0}.cctv-water-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cctv-water-cards article{padding:16px;border-radius:10px;background:#303030}.cctv-water-cards span,.cctv-water-cards small{display:block;color:#aeb9c8;font-size:13px}.cctv-water-cards b{font-size:36px;color:#56e6bd}.cctv-water-cards article:nth-child(2) b{color:#8be5ff}.cctv-water-summary{padding:16px 0;border-bottom:1px solid #454545}.cctv-water-summary strong{color:#73f0c7;font-size:18px}.cctv-water-summary p{margin:6px 0 0;color:#aeb9c8;font-size:13px}.cctv-info{margin-top:14px;padding:16px;border-radius:12px;background:#303030}.cctv-info h3{margin:0 0 8px;color:#8be5ff;font-size:17px}.cctv-info b{font-size:18px}.cctv-info p{margin:7px 0;color:#cbd5e1;line-height:1.45}.cctv-info a,.cctv-open{width:100%;min-height:44px;margin-top:10px;border-radius:9px;display:flex;align-items:center;justify-content:center;text-decoration:none;font:inherit;font-weight:800;cursor:pointer}.cctv-info a{background:rgba(34,197,94,.14);box-shadow:inset 0 0 0 1px #22c55e;color:#4ade80}.cctv-open{border:1px solid #55c8ff;background:rgba(56,189,248,.14);color:#7dd3fc}.cctv-open:active{transform:translateY(1px)}
@media(max-width:820px){.cctv-popup-backdrop{padding:8px}.cctv-popup{width:calc(100vw - 16px);max-height:calc(100vh - 16px)}.cctv-popup-head{padding:14px}.cctv-title-row h2{font-size:18px}.cctv-popup-body{grid-template-columns:1fr;padding:12px}.cctv-viewer{min-height:300px}.cctv-side{width:100%}}
.source-pin-layer:not(.runoff-pin-layer){z-index:10}.runoff-pin-layer{z-index:7}.drilldown-map-tools{z-index:12}
.trend-bars rect{transition:opacity .15s,filter .15s}.trend-bars rect:hover{opacity:.86;filter:brightness(1.12)}.trend-legend{display:flex;flex-wrap:wrap;gap:5px 12px;margin-top:3px;color:var(--muted);font-size:9px}.trend-legend span{display:inline-flex;align-items:center;gap:4px}.trend-legend i{display:inline-block;width:8px;height:8px;border-radius:50%;margin:0}.trend-legend i.normal{background:#62d477}.trend-legend i.blue{background:#38bdf8}.trend-legend i.yellow{background:#facc15}.trend-legend i.orange{background:#f97316}.trend-legend i.red{background:#ef4444}
.drilldown-summary{margin-top:12px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);padding:8px 10px 9px}.drilldown-summary-header{height:22px;display:flex;align-items:center;justify-content:space-between;color:var(--text);font-size:13px;font-weight:700}.drilldown-summary-header span{display:flex;align-items:center;gap:6px}.drilldown-summary-header span:before{content:'';width:4px;height:14px;border-radius:2px;background:#2563eb}.drilldown-summary-all{height:22px;padding:0 9px;border:1px solid #475569;border-radius:999px;background:#1e3a8a;color:#dbeafe;font:inherit;font-size:11px}.drilldown-summary-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding-top:7px}.drilldown-summary-card{min-height:62px;padding:6px;border:1px solid color-mix(in srgb,var(--dpm),55%,#334155);border-top:4px solid var(--dpm);border-radius:7px;background:#262830;color:var(--text);text-align:center}.drilldown-summary-card:hover{filter:brightness(1.1)}.drilldown-summary-card.yellow{--dpm:#facc15}.drilldown-summary-card.orange{--dpm:#f97316}.drilldown-summary-card.red{--dpm:#ef4444}.drilldown-summary-card b,.drilldown-summary-card strong,.drilldown-summary-card span{display:block}.drilldown-summary-card b{font-size:12px;line-height:15px;color:var(--dpm)}.drilldown-summary-card strong{margin:2px 0 0;color:#fff;font-size:20px;line-height:22px}.drilldown-summary-card span{font-size:10px;color:var(--muted)}
@media(max-width:820px){.drilldown-summary-cards{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.drilldown-summary-card b{font-size:11px}.drilldown-summary-card strong{font-size:18px}}
.map-layer-panel{z-index:20!important}
.dashboard-source-fit{overflow:visible;z-index:100}.dashboard-source-fit .ex{height:113px!important;overflow:visible}.dashboard-choice-menu{position:absolute;left:1080px;top:85px;width:235px;z-index:60;padding:6px;border:1px solid #465163;border-radius:10px;background:#20242d;box-shadow:0 12px 30px #0009}.dashboard-choice-menu button{display:block;width:100%;border:0;border-radius:7px;padding:11px 12px;text-align:left;background:transparent;color:#f8fafc;font:inherit;font-size:14px;cursor:pointer}.dashboard-choice-menu button:hover,.dashboard-choice-menu button[aria-current]{background:#284a82}.dashboard.light .dashboard-choice-menu{background:#fff;border-color:#cbd5e1}.dashboard.light .dashboard-choice-menu button{color:#172033}.dashboard.light .dashboard-choice-menu button:hover,.dashboard.light .dashboard-choice-menu button[aria-current]{background:#dbeafe}
.legend-heading{display:flex;align-items:center;min-height:40px}.legend-toggle{width:auto;flex:1;min-width:0;min-height:40px}.legend-toggle b{margin:0}.legend-toggle span{flex:0 0 28px;text-align:center;font-size:16px;line-height:1}.legend-drag-handle{display:grid;place-items:center;align-self:stretch;flex:0 0 24px;width:24px;color:#aab7c9;cursor:grab;touch-action:none;user-select:none}.legend-drag-handle:active{cursor:grabbing}
</style>
