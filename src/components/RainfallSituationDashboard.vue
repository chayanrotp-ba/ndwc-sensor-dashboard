<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  goMap: { type: Function, default: () => {} },
  goAdmin: { type: Function, default: () => {} },
  theme: { type: String, default: 'dark' },
  setTheme: { type: Function, default: () => {} },
});

const groupMode = ref('basin');
const selectedAreaId = ref('basin-nan');
const selectedMetric = ref('rain');
const metricGroup = ref('alert');
const openMenu = ref(false);

const areaGroups = {
  basin: [
    { id: 'basin-nan', name: 'ลุ่มน้ำน่าน', sub: 'น่าน · อุตรดิตถ์ · พิษณุโลก', status: 'วิกฤต', tone: 'critical', score: 4, alerts: 12, stations: '31/34', trend: 'เพิ่มขึ้น', trendIcon: '↗', rain: '270 มม.', headline: 'ฝนสะสมสูงและน้ำท่ามีแนวโน้มเพิ่ม', sources: ['ฝนสะสม', 'น้ำท่า', 'Radar Composite'] },
    { id: 'basin-yom', name: 'ลุ่มน้ำยม', sub: 'แพร่ · สุโขทัย · พิจิตร', status: 'เฝ้าระวัง', tone: 'warning', score: 3, alerts: 7, stations: '24/26', trend: 'เพิ่มเล็กน้อย', trendIcon: '↗', rain: '98.8 มม.', headline: 'ฝนกระจุกตัวตอนบนของลุ่มน้ำ', sources: ['ฝนสะสม', 'Radar Composite'] },
    { id: 'basin-ping', name: 'ลุ่มน้ำปิง', sub: 'เชียงใหม่ · ลำพูน · ตาก', status: 'เฝ้าระวัง', tone: 'warning', score: 3, alerts: 5, stations: '27/29', trend: 'ทรงตัว', trendIcon: '→', rain: '76.4 มม.', headline: 'น้ำท่าบางสถานีเข้าใกล้ระดับเตือน', sources: ['น้ำท่า', 'อ่างเก็บน้ำ'] },
    { id: 'basin-khong', name: 'ลุ่มน้ำโขงเหนือ', sub: 'เชียงราย · พะเยา', status: 'ติดตาม', tone: 'normal', score: 2, alerts: 2, stations: '21/24', trend: 'ลดลง', trendIcon: '↘', rain: '34.9 มม.', headline: 'ฝนลดลง แต่ยังติดตามข้อมูลขาดช่วง', sources: ['ฝนสะสม'] },
  ],
  province: [
    { id: 'province-nan', name: 'จังหวัดน่าน', sub: 'อ.เฉลิมพระเกียรติ · อ.เมืองน่าน', status: 'วิกฤต', tone: 'critical', score: 4, alerts: 6, stations: '18/19', trend: 'เพิ่มขึ้น', trendIcon: '↗', rain: '270 มม.', headline: 'ฝนหนักมากต่อเนื่องและน้ำท่าเพิ่ม', sources: ['ฝนสะสม', 'น้ำท่า', 'Radar Composite'] },
    { id: 'province-uttaradit', name: 'จังหวัดอุตรดิตถ์', sub: 'อ.ทองแสนขัน · อ.บ้านโคก', status: 'วิกฤต', tone: 'critical', score: 4, alerts: 4, stations: '15/16', trend: 'เพิ่มขึ้น', trendIcon: '↗', rain: '158.2 มม.', headline: 'ฝนเกินเกณฑ์หลายสถานี', sources: ['ฝนสะสม', 'Radar Composite'] },
    { id: 'province-phrae', name: 'จังหวัดแพร่', sub: 'อ.สูงเม่น · อ.ลอง', status: 'เฝ้าระวัง', tone: 'warning', score: 3, alerts: 3, stations: '13/15', trend: 'ทรงตัว', trendIcon: '→', rain: '98.8 มม.', headline: 'ฝนหนักและมีสถานีข้อมูลมาช้า', sources: ['ฝนสะสม'] },
    { id: 'province-chiangmai', name: 'จังหวัดเชียงใหม่', sub: 'อ.แม่แตง · อ.เมืองเชียงใหม่', status: 'เฝ้าระวัง', tone: 'warning', score: 3, alerts: 2, stations: '22/23', trend: 'เพิ่มเล็กน้อย', trendIcon: '↗', rain: '76.4 มม.', headline: 'ติดตามอ่างเก็บน้ำและพื้นที่ท้ายน้ำ', sources: ['อ่างเก็บน้ำ', 'Radar Composite'] },
  ],
};

const trendStationsByArea = {
  'basin-nan': [
    { code: 'G15006-5501', name: 'องค์การบริหารส่วนตำบลขุนน่าน', province: 'น่าน', previous: '221', current: '270', change: '+49', time: '11:00 น.' },
    { code: 'G15006-1802', name: 'ศูนย์พัฒนาเด็กเล็ก วัดฝาง', province: 'อุตรดิตถ์', previous: '128.2', current: '158.2', change: '+30', time: '11:00 น.' },
    { code: 'G15006-0512', name: 'สถานีบ้านกอ', province: 'น่าน', previous: '68.4', current: '91.6', change: '+23.2', time: '10:55 น.' },
  ],
  'basin-yom': [
    { code: 'G15006-4001', name: 'องค์การบริหารส่วนตำบลเวียงทอง', province: 'แพร่', previous: '79.3', current: '98.8', change: '+19.5', time: '11:00 น.' },
    { code: 'G15006-5540', name: 'โรงเรียนบ้านปง (วัฒนาวิทยาคาร)', province: 'แพร่', previous: '82', current: '94', change: '+12', time: '10:08 น.' },
  ],
  'basin-ping': [],
  'basin-khong': [],
  'province-nan': [
    { code: 'G15006-5501', name: 'องค์การบริหารส่วนตำบลขุนน่าน', province: 'อ.เฉลิมพระเกียรติ', previous: '221', current: '270', change: '+49', time: '11:00 น.' },
    { code: 'G15006-0512', name: 'สถานีบ้านกอ', province: 'อ.แม่จริม', previous: '68.4', current: '91.6', change: '+23.2', time: '10:55 น.' },
    { code: 'G15006-0515', name: 'โรงเรียนบ้านน้ำปาย', province: 'อ.แม่จริม', previous: '54.8', current: '73.1', change: '+18.3', time: '10:50 น.' },
  ],
  'province-uttaradit': [
    { code: 'G15006-1802', name: 'ศูนย์พัฒนาเด็กเล็ก วัดฝาง', province: 'อ.เมือง', previous: '128.2', current: '158.2', change: '+30', time: '11:00 น.' },
    { code: 'G15006-1801', name: 'สถานีอุตรดิตถ์ตอนบน', province: 'อ.ทองแสนขัน', previous: '70.1', current: '88.6', change: '+18.5', time: '10:55 น.' },
  ],
  'province-phrae': [],
  'province-chiangmai': [
    { code: 'G15006-0821', name: 'อบต.ปิงโค้ง', province: 'อ.เชียงดาว', previous: '61.2', current: '76.4', change: '+15.2', time: '11:00 น.' },
    { code: 'RID-DAM-001', name: 'เขื่อนแม่งัดสมบูรณ์ชล', province: 'อ.แม่แตง', previous: '101', current: '103', change: '+2', time: '10:45 น.', unit: '%' },
  ],
};

const measurements = [
  { key: 'rain', group: 'own', type: 'ปริมาณฝนสะสม', value: '270', unit: 'มม. / 24 ชม.', status: 'วิกฤต', tone: 'critical', code: 'G15006-5501', station: 'อบต.ขุนน่าน', owner: 'ปภ.', time: '11:00 น.', reason: 'สูงกว่าเกณฑ์ฝนหนักมาก > 90 มม.' },
  { key: 'temperature', group: 'own', type: 'อุณหภูมิอากาศ', value: '28.6', unit: '°C', status: 'ปกติ', tone: 'normal', code: 'G15006-5501', station: 'อบต.ขุนน่าน', owner: 'ปภ.', time: '11:00 น.', reason: 'ใช้ประกอบการวิเคราะห์สภาพอากาศ' },
  { key: 'humidity', group: 'own', type: 'ความชื้นสัมพัทธ์', value: '94', unit: '%RH', status: 'เฝ้าระวัง', tone: 'warning', code: 'G15006-5501', station: 'อบต.ขุนน่าน', owner: 'ปภ.', time: '11:00 น.', reason: 'ความชื้นสูง สอดคล้องกับกลุ่มฝนต่อเนื่อง' },
  { key: 'wind', group: 'own', type: 'ความเร็วลม', value: '48', unit: 'กม./ชม.', status: 'เฝ้าระวัง', tone: 'warning', code: 'G15006-5501', station: 'อบต.ขุนน่าน', owner: 'ปภ.', time: '11:00 น.', reason: 'เฝ้าระวังลมกระโชกในพื้นที่ฝนฟ้าคะนอง' },
  { key: 'direction', group: 'own', type: 'ทิศทางลม', value: 'ตะวันตกเฉียงใต้', unit: 'SW', status: 'ข้อมูลประกอบ', tone: 'info', code: 'G15006-5501', station: 'อบต.ขุนน่าน', owner: 'ปภ.', time: '11:00 น.', reason: 'บอกทิศทางเคลื่อนตัวของกลุ่มฝน' },
  { key: 'pressure', group: 'own', type: 'ความกดอากาศ', value: '998', unit: 'hPa', status: 'เฝ้าระวัง', tone: 'warning', code: 'G15006-5501', station: 'อบต.ขุนน่าน', owner: 'ปภ.', time: '11:00 น.', reason: 'ค่าลดลงต่อเนื่อง ใช้ประกอบแนวโน้มพายุฝน' },
  { key: 'co2', group: 'own', type: 'ก๊าซคาร์บอนไดออกไซด์', value: '438', unit: 'ppm', status: 'ปกติ', tone: 'normal', code: 'G15006-5501', station: 'อบต.ขุนน่าน', owner: 'ปภ.', time: '11:00 น.', reason: 'ค่าประกอบด้านสิ่งแวดล้อม' },
  { key: 'pm25', group: 'own', type: 'ฝุ่นละออง PM2.5', value: '36', unit: 'µg/m³', status: 'ปกติ', tone: 'normal', code: 'G15006-5501', station: 'อบต.ขุนน่าน', owner: 'ปภ.', time: '11:00 น.', reason: 'ค่าประกอบด้านผลกระทบสุขภาพ' },
  { key: 'pm10', group: 'own', type: 'ฝุ่นละออง PM10', value: '51', unit: 'µg/m³', status: 'ปกติ', tone: 'normal', code: 'G15006-5501', station: 'อบต.ขุนน่าน', owner: 'ปภ.', time: '11:00 น.', reason: 'ค่าประกอบด้านผลกระทบสุขภาพ' },
  { key: 'runoff', group: 'external', type: 'ระดับน้ำท่า', value: '105', unit: '% ระดับตลิ่ง', status: 'ล้นตลิ่ง', tone: 'critical', code: 'TW-RV-640300', station: 'แม่น้ำปิง จ.ตาก', owner: 'สสน.', time: '10:55 น.', reason: 'ระดับเพิ่มต่อเนื่องและเกินระดับตลิ่ง' },
  { key: 'reservoir', group: 'external', type: 'อ่างเก็บน้ำ', value: '103', unit: '% ความจุ', status: 'เกินความจุ', tone: 'critical', code: 'RID-DAM-001', station: 'เขื่อนแม่งัดสมบูรณ์ชล', owner: 'กรมชลประทาน', time: '10:45 น.', reason: 'ติดตามการระบายและพื้นที่ท้ายน้ำ' },
  { key: 'radar', group: 'external', type: 'Radar Composite', value: '52', unit: 'dBZ', status: 'ฝนหนัก', tone: 'warning', code: 'RADAR-COMP-N', station: 'เรดาร์รวมภาคเหนือ', owner: 'กรมอุตุนิยมวิทยา', time: '10:50 น.', reason: 'กลุ่มฝนกำลังเคลื่อนเข้าลุ่มน้ำน่าน' },
];

const currentAreas = computed(() => areaGroups[groupMode.value]);
const selectedArea = computed(() => currentAreas.value.find((item) => item.id === selectedAreaId.value) || currentAreas.value[0]);
const selectedTrendStations = computed(() => trendStationsByArea[selectedArea.value.id] || []);
const selectedMeasurement = computed(() => measurements.find((item) => item.key === selectedMetric.value) || measurements[0]);
const visibleMeasurements = computed(() => {
  if (metricGroup.value === 'own') return measurements.filter((item) => item.group === 'own');
  if (metricGroup.value === 'external') return measurements.filter((item) => item.group === 'external');
  return measurements.filter((item) => ['critical', 'warning'].includes(item.tone));
});

const alertSources = computed(() => measurements.filter((item) => ['critical', 'warning'].includes(item.tone)));
const mapMarkers = computed(() => alertSources.value.slice(0, 6).map((item, index) => ({ ...item, x: [35, 45, 29, 54, 39, 61][index], y: [29, 43, 21, 34, 55, 48][index] })));

function selectGrouping(mode) {
  groupMode.value = mode;
  selectedAreaId.value = areaGroups[mode][0].id;
}

function toggleTheme() {
  props.setTheme(props.theme === 'light' ? 'dark' : 'light');
}
</script>

<template>
  <main class="situation" :class="{ light: theme === 'light' }">
    <header class="topbar">
      <div class="brand"><img src="/assets/b820c1ee4f82dbfcefb07b5f5491f09e.png" alt="ตราสัญลักษณ์ ปภ."/><div><b>ระบบรวบรวมข้อมูลและติดตามสถานะ</b><span>ชุดอุปกรณ์ตรวจวัดสภาพแวดล้อม (Sensor)</span></div></div>
      <nav><button type="button" @click="goMap">⌂ แผนที่</button><button type="button" class="active">⌁ รายงานข้อมูล</button></nav>
      <div class="top-actions"><button type="button" class="round" @click="toggleTheme">{{ theme === 'light' ? '☾' : '☀' }}</button><button type="button" class="user" @click="openMenu = !openMenu">ผู้ดูแลระบบ⌄</button><button v-if="openMenu" type="button" class="admin" @click="goAdmin">ไปหน้า Backoffice</button></div>
    </header>

    <section class="page-head">
      <div><span>DASHBOARD สถานการณ์น้ำฝน</span><h1>ภาพรวมสถานการณ์ตามพื้นที่</h1><p>เริ่มจากลุ่มน้ำหรือจังหวัด แล้วเจาะลงไปดูแนวโน้ม สถานีที่ต้องติดตาม และ Sensor ต้นทาง</p></div>
      <div class="head-time"><b>ข้อมูลล่าสุด 11:00 น.</b><span>อัปเดตทุก 15 นาที</span></div>
    </section>

    <section class="area-overview">
      <header class="section-head"><div><span class="kicker">ระดับที่ 1 · ภาพรวมพื้นที่</span><h2>สถานการณ์ตอนนี้เป็นอย่างไร</h2></div><div class="mode-switch" role="tablist"><button type="button" :class="{active:groupMode==='basin'}" @click="selectGrouping('basin')">สรุปตามลุ่มน้ำ</button><button type="button" :class="{active:groupMode==='province'}" @click="selectGrouping('province')">สรุปตามจังหวัด</button></div></header>
      <div class="overview-grid">
        <div class="area-list">
          <button v-for="item in currentAreas" :key="item.id" type="button" :class="['area-row', item.tone, {active:selectedArea.id===item.id}]" @click="selectedAreaId=item.id">
            <span class="severity">{{ item.score }}</span><span class="area-name"><b>{{ item.name }}</b><small>{{ item.sub }}</small></span><span class="area-signal"><b>{{ item.status }}</b><small>{{ item.alerts }} สถานีต้องติดตาม</small></span><span class="area-trend"><b>{{ item.trendIcon }} {{ item.trend }}</b><small>ฝนสูงสุด {{ item.rain }}</small></span>
          </button>
        </div>
        <article :class="['area-summary', selectedArea.tone]">
          <header><span>{{ groupMode==='basin'?'ลุ่มน้ำที่เลือก':'จังหวัดที่เลือก' }}</span><b>{{ selectedArea.status }}</b></header>
          <h2>{{ selectedArea.name }}</h2><p>{{ selectedArea.headline }}</p>
          <div class="summary-kpis"><div><span>สถานีต้องติดตาม</span><b>{{ selectedArea.alerts }}</b></div><div><span>สถานีพร้อมใช้</span><b>{{ selectedArea.stations }}</b></div><div><span>แนวโน้ม</span><b>{{ selectedArea.trendIcon }} {{ selectedArea.trend }}</b></div></div>
          <div class="source-chips"><span>ประเภทที่ทำให้เตือน</span><b v-for="source in selectedArea.sources" :key="source">{{ source }}</b></div>
          <section class="trend-stations" aria-label="สถานีที่ทำให้แนวโน้มเพิ่มขึ้น">
            <header><div><b>สถานีที่ค่าฝนเพิ่มขึ้น</b><small>เปรียบเทียบกับค่าก่อนหน้า 3 ชั่วโมง</small></div><span>{{ selectedTrendStations.length }} สถานี</span></header>
            <div v-if="selectedTrendStations.length" class="trend-station-list">
              <article v-for="station in selectedTrendStations" :key="station.code">
                <div><b>{{ station.name }}</b><small>{{ station.code }} · {{ station.province }} · {{ station.time }}</small></div>
                <div class="station-values"><small>{{ station.previous }} → {{ station.current }} {{ station.unit || 'มม.' }}</small><strong>เพิ่ม {{ station.change }} {{ station.unit || 'มม.' }}</strong></div>
              </article>
            </div>
            <p v-else>ยังไม่พบสถานีที่มีค่าเพิ่มขึ้นอย่างมีนัยสำคัญในช่วง 3 ชั่วโมงล่าสุด</p>
          </section>
          <div class="area-answer"><b>สรุป:</b> ควรติดตามค่าฝนสะสมร่วมกับน้ำท่าและภาพ Radar ต่อเนื่อง โดยตรวจสอบสถานีที่เกินเกณฑ์ก่อนพิจารณายกระดับการแจ้งเตือน</div>
        </article>
      </div>
    </section>

    <section class="drilldown">
      <header class="section-head"><div><span class="kicker">ระดับที่ 2 · Drill down {{ selectedArea.name }}</span><h2>อะไรทำให้เตือน และต้องติดตามอะไรต่อ</h2></div><button type="button" class="map-link" @click="goMap">เปิดแผนที่เต็ม ↗</button></header>
      <div class="drill-grid">
        <article class="focus-map">
          <div class="map-canvas">
            <span class="map-label">{{ selectedArea.name }} · {{ selectedArea.status }}</span>
            <button v-for="marker in mapMarkers" :key="marker.key" type="button" :class="['marker', marker.tone, {active:selectedMetric===marker.key}]" :style="{left:marker.x+'%',top:marker.y+'%'}" :aria-label="`${marker.type} ${marker.value} ${marker.unit}`" @click="selectedMetric=marker.key">{{ marker.key==='rain'?'☂':marker.key==='runoff'?'≋':marker.key==='reservoir'?'▰':marker.key==='radar'?'◉':'●' }}</button>
            <div class="map-legend"><span><i class="critical"></i>วิกฤต</span><span><i class="warning"></i>เฝ้าระวัง</span></div>
          </div>
          <div class="selected-reading"><div><span>{{ selectedMeasurement.type }} · {{ selectedMeasurement.status }}</span><b>{{ selectedMeasurement.station }}</b><small>{{ selectedMeasurement.code }} · {{ selectedMeasurement.owner }} · {{ selectedMeasurement.time }}</small></div><strong>{{ selectedMeasurement.value }}<small>{{ selectedMeasurement.unit }}</small></strong><p>{{ selectedMeasurement.reason }}</p></div>
        </article>

        <aside class="warning-causes">
          <header><span class="kicker">ข้อมูลที่ต้องติดตาม</span><h3>{{ alertSources.length }} ค่าเฝ้าระวัง</h3></header>
          <button v-for="item in alertSources" :key="item.key" type="button" :class="[item.tone,{active:selectedMetric===item.key}]" @click="selectedMetric=item.key">
            <i></i><span><b>{{ item.type }} · {{ item.status }}</b><small>{{ item.code }} · {{ item.station }}</small></span><strong>{{ item.value }}<small>{{ item.unit }}</small></strong>
          </button>
        </aside>
      </div>
    </section>

    <section class="next-monitor">
      <header class="section-head"><div><span class="kicker">สิ่งที่ต้องติดตามต่อ</span><h2>แนวโน้มและเงื่อนไขเปลี่ยนระดับ</h2></div></header>
      <div class="monitor-grid">
        <article><span>01 · ฝนสะสม</span><b>เพิ่ม 49 มม. ใน 3 ชม.</b><p>ติดตาม G15006-5501 ทุก 15 นาที หากเพิ่มต่อเนื่องให้ตรวจสถานีรอบข้าง</p><i class="spark rising"></i></article>
        <article><span>02 · น้ำท่า</span><b>105% ระดับตลิ่ง</b><p>ติดตาม TW-RV-640300 และพื้นที่ริมน้ำ หากเพิ่มอีก 10% ให้ประสานพื้นที่ทันที</p><i class="spark critical"></i></article>
        <article><span>03 · Radar Composite</span><b>กลุ่มฝนเคลื่อนเข้า</b><p>ติดตามทิศทางและความเข้ม 52 dBZ รอบถัดไป เพื่อประเมินฝนล่วงหน้า 1–3 ชม.</p><i class="spark radar"></i></article>
        <article><span>04 · คุณภาพข้อมูล</span><b>พร้อมใช้ {{ selectedArea.stations }}</b><p>ยืนยันข้อมูลช้าและออฟไลน์ก่อนใช้ประกอบการแจ้งเตือนระดับพื้นที่</p><i class="spark quality"></i></article>
      </div>
    </section>

    <section class="measurement-dashboard">
      <header class="section-head"><div><span class="kicker">ชุดข้อมูลที่ระบบมีจริง</span><h2>Sensor ของเรา 9 ค่า + ข้อมูลหน่วยงานอื่น</h2><p>เลือกดูเฉพาะค่าที่ทำให้เตือน หรือเปิดดูชุดข้อมูลทั้งหมด</p></div><div class="metric-tabs"><button type="button" :class="{active:metricGroup==='alert'}" @click="metricGroup='alert'">ค่าที่เตือน</button><button type="button" :class="{active:metricGroup==='own'}" @click="metricGroup='own'">Sensor ของเรา 9 ค่า</button><button type="button" :class="{active:metricGroup==='external'}" @click="metricGroup='external'">หน่วยงานอื่น 3 ประเภท</button></div></header>
      <div class="metric-grid">
        <article v-for="item in visibleMeasurements" :key="item.key" :class="[item.tone,{active:selectedMetric===item.key}]" @click="selectedMetric=item.key">
          <header><b>{{ item.type }}</b><span>{{ item.status }}</span></header><strong>{{ item.value }} <small>{{ item.unit }}</small></strong><p>{{ item.reason }}</p><footer><b>{{ item.code }}</b><span>{{ item.station }}</span><small>{{ item.owner }} · {{ item.time }}</small></footer>
        </article>
      </div>
    </section>

    <footer class="footer-note"><span>ต้นแบบ: ใช้ค่าจำลองเพื่อแสดงลำดับ UX และที่มาข้อมูล</span><span>ระบบจริงต้องเชื่อม API ของ ปภ., สสน., กรมชลประทาน และ Radar Composite</span></footer>
  </main>
</template>

<style scoped>
@font-face{font-family:Sarabun;src:url('/assets/bcc369502f7b45efbd73f6a2c5708ac0.ttf') format('truetype');font-weight:400;font-display:swap}
@font-face{font-family:Sarabun;src:url('/assets/66d1a1f409f1d7267b7159f42f977071.ttf') format('truetype');font-weight:700;font-display:swap}
*{box-sizing:border-box}.situation{--bg:#111214;--panel:#1b1c1f;--panel2:#22242a;--line:#343741;--text:#f8fafc;--muted:#9ca3af;min-height:100vh;background:var(--bg);color:var(--text);font-family:Sarabun,system-ui,sans-serif;padding-bottom:24px}.situation.light{--bg:#f4f6f8;--panel:#fff;--panel2:#eef1f5;--line:#d7dce3;--text:#172033;--muted:#64748b}.topbar{height:82px;padding:0 28px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:1fr auto 1fr;align-items:center}.brand{display:flex;align-items:center;gap:10px}.brand img{width:34px;height:50px;object-fit:contain}.brand b,.brand span{display:block}.brand b{font-size:15px}.brand span{font-size:11px;color:var(--muted)}.topbar nav{display:flex;gap:4px;padding:4px;background:var(--panel2);border-radius:24px}.topbar nav button{height:40px;border:0;border-radius:20px;background:transparent;color:var(--muted);padding:0 16px;font:700 12px Sarabun}.topbar nav button.active{background:#3b3d42;color:#fff}.top-actions{justify-self:end;display:flex;gap:8px;position:relative}.round,.user,.admin{border:1px solid var(--line);background:var(--panel);color:var(--text);font-family:inherit}.round{width:40px;height:40px;border-radius:50%}.user{height:40px;border-radius:8px;padding:0 12px}.admin{position:absolute;right:0;top:45px;height:38px;width:160px;border-radius:7px;z-index:10}.page-head,.area-overview,.drilldown,.next-monitor,.measurement-dashboard,.footer-note{max-width:1440px;margin-left:auto;margin-right:auto}.page-head{display:flex;justify-content:space-between;align-items:end;padding:24px 2px 16px}.page-head>div:first-child>span,.kicker{font-size:10px;color:#60a5fa;font-weight:700}.page-head h1{font-size:30px;margin:4px 0}.page-head p,.section-head p{font-size:12px;color:var(--muted);margin:0}.head-time{text-align:right}.head-time b,.head-time span{display:block}.head-time b{font-size:12px}.head-time span{font-size:10px;color:var(--muted)}.area-overview,.drilldown,.next-monitor,.measurement-dashboard{border:1px solid var(--line);background:var(--panel);border-radius:12px;padding:17px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:13px}.section-head h2{font-size:20px;margin:2px 0}.mode-switch,.metric-tabs{display:flex;gap:4px;padding:4px;background:var(--panel2);border-radius:8px;overflow:auto}.mode-switch button,.metric-tabs button{height:34px;border:0;border-radius:6px;background:transparent;color:var(--muted);padding:0 13px;white-space:nowrap;font:700 11px Sarabun}.mode-switch button.active,.metric-tabs button.active{background:#2563eb;color:#fff}.overview-grid{display:grid;grid-template-columns:minmax(480px,1.1fr) minmax(420px,.9fr);gap:11px}.area-list{display:flex;flex-direction:column;gap:7px}.area-row{min-height:75px;display:grid;grid-template-columns:36px minmax(150px,1fr) 120px 125px;align-items:center;gap:10px;padding:9px 12px;border:1px solid var(--line);border-left:4px solid #22c55e;background:var(--bg);color:var(--text);border-radius:8px;text-align:left;font-family:inherit}.area-row.critical{border-left-color:#f43f5e}.area-row.warning{border-left-color:#f59e0b}.area-row.active{box-shadow:0 0 0 1px #3b82f6;background:#17255455}.severity{width:29px;height:29px;border-radius:50%;background:#334155;display:grid;place-items:center;font-weight:700}.area-name b,.area-name small,.area-signal b,.area-signal small,.area-trend b,.area-trend small{display:block}.area-name b{font-size:13px}.area-name small,.area-signal small,.area-trend small{font-size:9px;color:var(--muted)}.area-signal b,.area-trend b{font-size:11px}.area-row.critical .area-signal b{color:#fb7185}.area-row.warning .area-signal b{color:#fbbf24}.area-summary{border:1px solid #334155;border-top:4px solid #22c55e;border-radius:9px;padding:18px;background:linear-gradient(145deg,#182233,var(--bg))}.area-summary.critical{border-top-color:#f43f5e}.area-summary.warning{border-top-color:#f59e0b}.area-summary>header{display:flex;justify-content:space-between;color:var(--muted);font-size:10px}.area-summary>header b{color:#fb7185}.area-summary h2{font-size:26px;margin:9px 0 2px}.area-summary>p{font-size:13px;color:#cbd5e1;margin:0}.summary-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:17px 0}.summary-kpis div{background:#ffffff08;border:1px solid #334155;border-radius:7px;padding:10px}.summary-kpis span,.summary-kpis b{display:block}.summary-kpis span{font-size:9px;color:#94a3b8}.summary-kpis b{font-size:17px;margin-top:3px}.source-chips{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.source-chips span{font-size:9px;color:#94a3b8}.source-chips b{padding:4px 8px;border-radius:12px;background:#1d4ed8;color:#dbeafe;font-size:9px}.area-answer{margin-top:14px;padding:10px;border-radius:7px;background:#0f2949;border:1px solid #28588c;color:#bfdbfe;font-size:10px;line-height:1.5}.drilldown,.next-monitor,.measurement-dashboard{margin-top:12px}.map-link{height:36px;border:1px solid #3b82f6;background:#172a4e;color:#bfdbfe;border-radius:7px;padding:0 13px;font:700 11px Sarabun}.drill-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(320px,.7fr);gap:11px}.focus-map,.warning-causes{border:1px solid var(--line);border-radius:9px;background:var(--bg);padding:10px}.map-canvas{height:365px;position:relative;overflow:hidden;border-radius:7px;background:#293248 url('/assets/dd65fa0593bd6884efcd4d08f98989bd.jpg') center 42%/cover no-repeat}.map-canvas::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,#020617a8);pointer-events:none}.map-label,.map-legend{position:absolute;z-index:2;background:#0f172add;color:#fff;border:1px solid #475569;border-radius:5px;font-size:9px}.map-label{top:10px;left:10px;padding:6px 9px;font-weight:700}.map-legend{left:10px;bottom:10px;padding:5px 8px;display:flex;gap:10px}.map-legend span{display:flex;align-items:center;gap:4px}.map-legend i{width:7px;height:7px;border-radius:50%}.map-legend i.critical{background:#f43f5e}.map-legend i.warning{background:#f59e0b}.marker{position:absolute;z-index:3;width:34px;height:34px;transform:translate(-50%,-50%);border:3px solid #ffffff55;border-radius:50%;color:#fff;background:#f59e0b;box-shadow:0 0 0 5px #f59e0b35;font-weight:700}.marker.critical{background:#f43f5e;box-shadow:0 0 0 5px #f43f5e35}.marker.active{width:43px;height:43px;box-shadow:0 0 0 8px #60a5fa55}.selected-reading{display:grid;grid-template-columns:minmax(0,1fr) 150px minmax(170px,.7fr);align-items:center;gap:12px;padding:11px 6px 2px}.selected-reading div span,.selected-reading div b,.selected-reading div small,.selected-reading strong small{display:block}.selected-reading div span{font-size:9px;color:#60a5fa}.selected-reading div b{font-size:12px}.selected-reading div small{font-size:8px;color:var(--muted)}.selected-reading>strong{text-align:right;font-size:25px}.selected-reading strong small{font-size:8px;color:var(--muted)}.selected-reading>p{margin:0;padding-left:12px;border-left:1px solid var(--line);font-size:9px;color:#fca5a5}.warning-causes>header{padding:5px 5px 9px}.warning-causes h3{font-size:17px;margin:2px 0}.warning-causes>button{width:100%;min-height:62px;display:grid;grid-template-columns:4px 1fr 78px;gap:8px;align-items:center;text-align:left;border:0;border-top:1px solid var(--line);background:transparent;color:var(--text);padding:7px 5px}.warning-causes>button.active{background:#17255477}.warning-causes button>i{height:35px;background:#f59e0b;border-radius:3px}.warning-causes button.critical>i{background:#f43f5e}.warning-causes button span b,.warning-causes button span small,.warning-causes button strong small{display:block}.warning-causes button span b{font-size:10px}.warning-causes button span small{font-size:8px;color:var(--muted)}.warning-causes button>strong{text-align:right;font-size:15px}.warning-causes button strong small{font-size:7px;color:var(--muted)}.monitor-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.monitor-grid article{position:relative;overflow:hidden;border:1px solid var(--line);background:var(--bg);border-radius:8px;padding:12px;min-height:126px}.monitor-grid article>span{font-size:9px;color:#60a5fa}.monitor-grid article>b{display:block;font-size:14px;margin:5px 0}.monitor-grid article>p{font-size:9px;color:var(--muted);line-height:1.5;margin:0;max-width:90%}.spark{position:absolute;right:-8px;bottom:-14px;width:90px;height:48px;border-top:3px solid #3b82f6;border-radius:50% 0 0 0;transform:rotate(-10deg);opacity:.45}.spark.critical{border-color:#f43f5e}.spark.radar{border-color:#a855f7}.spark.quality{border-color:#22c55e}.measurement-dashboard>.section-head{align-items:center}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.metric-grid article{border:1px solid var(--line);border-top:3px solid #22c55e;border-radius:8px;background:var(--bg);padding:11px;cursor:pointer}.metric-grid article.critical{border-top-color:#f43f5e}.metric-grid article.warning{border-top-color:#f59e0b}.metric-grid article.info{border-top-color:#3b82f6}.metric-grid article.active{box-shadow:0 0 0 1px #3b82f6}.metric-grid article>header{display:flex;justify-content:space-between}.metric-grid header b{font-size:11px}.metric-grid header span{font-size:8px;color:var(--muted)}.metric-grid article>strong{display:block;font-size:22px;margin:8px 0}.metric-grid article>strong small{font-size:8px;color:var(--muted)}.metric-grid article>p{min-height:28px;font-size:8px;color:var(--muted);line-height:1.4}.metric-grid footer{padding-top:7px;border-top:1px solid var(--line)}.metric-grid footer b,.metric-grid footer span,.metric-grid footer small{display:block}.metric-grid footer b{font-size:8px;color:#93c5fd}.metric-grid footer span{font-size:9px;font-weight:700}.metric-grid footer small{font-size:7px;color:var(--muted)}.footer-note{display:flex;justify-content:space-between;border-top:1px solid var(--line);margin-top:12px;padding:12px 2px 0;color:var(--muted);font-size:9px}
@media(max-width:1100px){.page-head,.area-overview,.drilldown,.next-monitor,.measurement-dashboard,.footer-note{margin-left:20px;margin-right:20px}.overview-grid,.drill-grid{grid-template-columns:1fr}.metric-grid{grid-template-columns:repeat(3,1fr)}.monitor-grid{grid-template-columns:repeat(2,1fr)}.topbar{grid-template-columns:1fr auto}.topbar nav{position:absolute;top:88px;left:50%;transform:translateX(-50%);z-index:5}.page-head{padding-top:72px}}
@media(max-width:720px){.topbar{height:70px;padding:0 12px}.brand b{font-size:11px}.brand span{font-size:8px}.user{display:none}.page-head,.area-overview,.drilldown,.next-monitor,.measurement-dashboard,.footer-note{margin-left:10px;margin-right:10px}.page-head{display:block}.head-time{text-align:left;margin-top:8px}.page-head h1{font-size:24px}.section-head{align-items:flex-start;flex-direction:column}.mode-switch,.metric-tabs{width:100%}.area-row{grid-template-columns:30px 1fr 90px}.area-trend{display:none}.summary-kpis{grid-template-columns:1fr}.map-canvas{height:290px}.selected-reading{grid-template-columns:1fr auto}.selected-reading>p{grid-column:1/-1;border-left:0;border-top:1px solid var(--line);padding:8px 0 0}.monitor-grid,.metric-grid{grid-template-columns:1fr}.footer-note{display:block;padding-bottom:60px}.footer-note span{display:block;margin-bottom:4px}}
.trend-stations{margin-top:13px;border:1px solid #334155;border-radius:8px;background:#ffffff05;overflow:hidden}.trend-stations>header{display:flex;align-items:center;justify-content:space-between;padding:9px 10px;border-bottom:1px solid #334155}.trend-stations>header b,.trend-stations>header small{display:block}.trend-stations>header b{font-size:10px}.trend-stations>header small{font-size:8px;color:var(--muted);margin-top:2px}.trend-stations>header>span{padding:3px 7px;border-radius:10px;background:#123b2d;color:#86efac;font-size:8px;font-weight:700}.trend-station-list article{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:8px 10px;border-top:1px solid #ffffff0d}.trend-station-list article:first-child{border-top:0}.trend-station-list article b,.trend-station-list article small,.station-values strong{display:block}.trend-station-list article b{font-size:9px}.trend-station-list article small{font-size:7px;color:var(--muted)}.station-values{text-align:right}.station-values strong{font-size:10px;color:#4ade80;margin-top:2px}.trend-stations>p{margin:0;padding:11px;color:var(--muted);font-size:8px}
@media(max-width:720px){.trend-station-list article{grid-template-columns:1fr}.station-values{text-align:left}}
</style>
