<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  goMap: { type: Function, default: () => {} },
  goAdmin: { type: Function, default: () => {} },
  theme: { type: String, default: 'dark' },
  setTheme: { type: Function, default: () => {} },
});

const period = ref('24h');
const area = ref('country');
const openMenu = ref(false);
const selectedSensor = ref('rain');

const periods = [
  { key: '1h', label: '1 ชม.' },
  { key: '24h', label: '24 ชม.' },
  { key: 'today', label: 'วันนี้' },
  { key: '3d', label: '3 วัน' },
  { key: '7d', label: '7 วัน' },
];

const areas = [
  { key: 'country', label: 'ทั่วประเทศ' },
  { key: 'north', label: 'ภาคเหนือ' },
  { key: 'nan', label: 'จังหวัดน่าน' },
];

const hazardSensors = [
  { key: 'rain', type: 'ฝนสะสม', icon: '☂', status: 'วิกฤต', value: '270', unit: 'มม. / 24 ชม.', name: 'องค์การบริหารส่วนตำบลขุนน่าน', code: 'G15006-5501', owner: 'ปภ. · กรมป้องกันและบรรเทาสาธารณภัย', time: '11:00 น.', location: 'อ.เฉลิมพระเกียรติ จ.น่าน', note: 'เกินเกณฑ์ฝนหนักมาก > 90 มม.', color: '#f43f5e', x: 34, y: 26 },
  { key: 'river', type: 'ระดับน้ำท่า', icon: '≋', status: 'ล้นตลิ่ง', value: '105', unit: '% ของระดับตลิ่ง', name: 'สถานีน้ำท่าแม่น้ำปิง ตาก', code: 'TW-RV-640300', owner: 'สถาบันสารสนเทศทรัพยากรน้ำ', time: '10:55 น.', location: 'อ.เมืองตาก จ.ตาก', note: 'ระดับเพิ่มต่อเนื่อง ต้องเฝ้าระวังพื้นที่ริมน้ำ', color: '#a855f7', x: 39, y: 48 },
  { key: 'dam', type: 'อ่างเก็บน้ำ', icon: '▰', status: 'เกินความจุ', value: '103', unit: '% ความจุ', name: 'เขื่อนแม่งัดสมบูรณ์ชล', code: 'RID-DAM-001', owner: 'กรมชลประทาน', time: '10:45 น.', location: 'อ.แม่แตง จ.เชียงใหม่', note: 'ติดตามการระบายและพื้นที่ท้ายน้ำ', color: '#a855f7', x: 25, y: 20 },
  { key: 'wind', type: 'ลมกระโชก', icon: '↝', status: 'เฝ้าระวัง', value: '48', unit: 'กม./ชม.', name: 'สถานีอุตุนิยมวิทยาน่าน', code: 'TMD-48331', owner: 'กรมอุตุนิยมวิทยา', time: '11:00 น.', location: 'อ.เมืองน่าน จ.น่าน', note: 'อาจกระทบพื้นที่ฝนฟ้าคะนอง', color: '#f59e0b', x: 48, y: 31 },
  { key: 'forecast', type: 'ฝนคาดการณ์', icon: '◉', status: 'เพิ่มขึ้น', value: '80–120', unit: 'มม. / 24 ชม.', name: 'แบบจำลองฝนภาคเหนือ', code: 'TMD-WRF-24H', owner: 'กรมอุตุนิยมวิทยา', time: 'รอบ 10:00 น.', location: 'น่าน · แพร่ · อุตรดิตถ์', note: 'ใช้ประกอบการติดตาม ไม่ใช่ค่าตรวจวัดจริง', color: '#3b82f6', x: 43, y: 39 },
  { key: 'health', type: 'ความพร้อมข้อมูล', icon: '⌁', status: 'ตรวจสอบ', value: '103/113', unit: 'สถานีออนไลน์', name: 'ระบบรับข้อมูล Sensor Gateway', code: 'DDPM-IOT-GW', owner: 'ศภช. · กรม ปภ.', time: '11:00 น.', location: 'ทั่วประเทศ', note: 'ออฟไลน์ 10 · ข้อมูลมาช้า 14 สถานี', color: '#22c55e', x: 62, y: 52 },
];
const selectedSensorData = computed(() => hazardSensors.find((sensor) => sensor.key === selectedSensor.value) || hazardSensors[0]);

const trendSets = {
  '1h': [8, 10, 9, 12, 11, 18, 22, 31, 46, 58, 69, 74],
  '24h': [18, 24, 31, 39, 52, 65, 82, 105, 137, 168, 221, 270],
  today: [0, 4, 11, 23, 38, 57, 76, 102, 128, 151, 183, 205],
  '3d': [61, 74, 92, 116, 145, 181, 229, 278, 331, 376, 405, 438],
  '7d': [122, 156, 188, 231, 278, 335, 402, 469, 521, 566, 604, 641],
};

const trend = computed(() => trendSets[period.value] || trendSets['24h']);
const chartPoints = computed(() => {
  const values = trend.value;
  const max = Math.max(...values) * 1.12;
  return values.map((value, index) => ({
    value,
    x: 18 + (index * 564) / (values.length - 1),
    y: 180 - (value / max) * 146,
  }));
});
const chartPath = computed(() => chartPoints.value.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' '));
const chartArea = computed(() => `${chartPath.value} L 582 180 L 18 180 Z`);
const provinces = [
  { rank: 1, province: 'น่าน', district: 'เฉลิมพระเกียรติ', value: 270, level: 'ฝนหนักมาก', color: '#f43f5e', stations: '5 สถานี' },
  { rank: 2, province: 'อุตรดิตถ์', district: 'ทองแสนขัน', value: 158.2, level: 'ฝนหนักมาก', color: '#f43f5e', stations: '3 สถานี' },
  { rank: 3, province: 'แพร่', district: 'สูงเม่น · ลอง', value: 98.8, level: 'ฝนหนักมาก', color: '#f43f5e', stations: '2 สถานี' },
  { rank: 4, province: 'สระแก้ว', district: 'เมืองสระแก้ว', value: 54.6, level: 'ฝนหนัก', color: '#fb923c', stations: '8 สถานี' },
  { rank: 5, province: 'เชียงใหม่', district: 'เมืองเชียงใหม่', value: 45.6, level: 'ฝนหนัก', color: '#fb923c', stations: '6 สถานี' },
];

const levels = [
  { label: 'ฝนหนักมาก', range: '> 90 มม.', count: 5, pct: 4.4, color: '#f43f5e' },
  { label: 'ฝนหนัก', range: '> 35–90 มม.', count: 30, pct: 26.5, color: '#fb923c' },
  { label: 'ฝนปานกลาง', range: '> 10–35 มม.', count: 35, pct: 31, color: '#facc15' },
  { label: 'ฝนเล็กน้อย', range: '> 0.5–10 มม.', count: 25, pct: 22.1, color: '#7fcc3c' },
  { label: 'ฝนละออง', range: '> 0–0.5 มม.', count: 8, pct: 7.1, color: '#9ddbf2' },
];

function toggleTheme() {
  props.setTheme(props.theme === 'light' ? 'dark' : 'light');
}
</script>

<template>
  <main class="rain-report" :class="{ light: theme === 'light' }">
    <header class="rr-header">
      <div class="rr-brand">
        <img src="/assets/b820c1ee4f82dbfcefb07b5f5491f09e.png" alt="ตราสัญลักษณ์ ปภ." />
        <div><strong>ระบบรวบรวมข้อมูลและติดตามสถานะ</strong><span>ชุดอุปกรณ์ตรวจวัดสภาพแวดล้อม (Sensor)</span></div>
      </div>
      <nav class="rr-main-nav" aria-label="เมนูหลัก">
        <button type="button" @click="goMap"><span aria-hidden="true">⌂</span> แผนที่</button>
        <button type="button" class="active" aria-current="page"><span aria-hidden="true">⌁</span> รายงานข้อมูล</button>
      </nav>
      <div class="rr-head-actions">
        <button type="button" class="icon-button" :aria-label="theme === 'light' ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง'" @click="toggleTheme">{{ theme === 'light' ? '☾' : '☀' }}</button>
        <button type="button" class="rr-user" @click="openMenu = !openMenu"><span class="avatar">♙</span><span><b>ผู้ดูแลระบบ</b><small>Super admin</small></span><span>⌄</span></button>
        <button v-if="openMenu" type="button" class="rr-admin-link" @click="goAdmin">ไปหน้า Backoffice</button>
      </div>
    </header>

    <section class="rr-toolbar" aria-label="ตัวกรองรายงาน">
      <div class="rr-title-block">
        <span class="eyebrow">MOCKUP · รายงานข้อมูล / ติดตามปริมาณน้ำฝน</span>
        <h1>ศูนย์เฝ้าระวังและติดตามปริมาณน้ำฝน</h1>
        <p>เห็นสถานการณ์รวม · รู้พื้นที่กระทบ · ตัดสินใจสิ่งที่ต้องทำต่อ</p>
      </div>
      <div class="rr-filters">
        <label>พื้นที่<select v-model="area"><option v-for="item in areas" :key="item.key" :value="item.key">{{ item.label }}</option></select></label>
        <label>ช่วงสะสม<select v-model="period"><option v-for="item in periods" :key="item.key" :value="item.key">{{ item.label }}</option></select></label>
        <button type="button" class="outline" @click="goMap">ดูบนแผนที่</button>
      </div>
    </section>

    <section class="rr-summary" aria-label="สรุปสถานการณ์">
      <article class="rr-status-card danger">
        <div class="status-icon">☂</div><div><span>สถานการณ์สูงสุด</span><strong>ฝนหนักมาก</strong><small>G15006-5501 · อบต.ขุนน่าน</small></div>
      </article>
      <article class="rr-kpi"><span>ฝนสะสมสูงสุด</span><strong>270 <small>มม. / 24 ชม.</small></strong><small>G15006-5501 · 11:00 น.</small></article>
      <article class="rr-kpi"><span>พื้นที่ฝนหนักมาก</span><strong>5 <small>สถานี</small></strong><small>จากสถานีวัดฝน 113 แห่ง</small></article>
      <article class="rr-kpi"><span>สถานีที่รับข้อมูล</span><strong>103 <small>/ 113</small></strong><small><i class="ok-dot"></i> DDPM-IOT-GW · 11:00 น.</small></article>
    </section>

    <section class="rr-alert" aria-live="polite">
      <div class="alert-mark">!</div><div><b>สถานการณ์ที่ต้องติดตาม</b><p>สถานี G15006-5501 · อบต.ขุนน่าน ตรวจวัดฝนสะสม 270 มม. / 24 ชม. เวลา 11:00 น. สูงกว่าเกณฑ์ฝนหนักมาก และแนวโน้มยังเพิ่มขึ้น</p></div>
      <button type="button" @click="goMap">ดูสถานีบนแผนที่ →</button>
    </section>

    <section class="rr-ops-grid" aria-label="แผนที่และเหตุการณ์สำคัญ">
      <article class="rr-live-map">
        <header><div><span class="panel-kicker">สถานการณ์เชิงพื้นที่</span><h2>แผนที่จุดเฝ้าระวัง</h2><p>เลือกจุดเพื่อดูค่าและ Sensor ต้นทาง</p></div><button type="button" @click="goMap">เปิดแผนที่เต็ม ↗</button></header>
        <div class="hazard-map">
          <button v-for="sensor in hazardSensors.slice(0,5)" :key="sensor.key" type="button" :class="['map-sensor', { active: selectedSensor === sensor.key }]" :style="{ left: sensor.x + '%', top: sensor.y + '%', '--sensor-color': sensor.color }" :aria-label="`${sensor.type} ${sensor.value} ${sensor.unit} จาก ${sensor.name}`" @click="selectedSensor = sensor.key"><span>{{ sensor.icon }}</span></button>
          <div class="map-scope">ภาคเหนือ · 3 จังหวัดเฝ้าระวัง</div>
          <div class="map-source"><span>● ค่าตรวจวัดจริง</span><span>◉ ค่าคาดการณ์</span></div>
        </div>
        <div class="selected-source">
          <span class="source-icon" :style="{ background: selectedSensorData.color }">{{ selectedSensorData.icon }}</span>
          <div class="source-main"><small>{{ selectedSensorData.type }} · {{ selectedSensorData.status }}</small><b>{{ selectedSensorData.name }}</b><span>{{ selectedSensorData.code }} · {{ selectedSensorData.location }}</span></div>
          <div class="source-value"><b>{{ selectedSensorData.value }}</b><span>{{ selectedSensorData.unit }}</span></div>
          <div class="source-meta"><b>{{ selectedSensorData.owner }}</b><span>อัปเดต {{ selectedSensorData.time }}</span><small>{{ selectedSensorData.note }}</small></div>
        </div>
      </article>

      <aside class="rr-event-feed">
        <header><div><span class="panel-kicker">เหตุการณ์สำคัญ</span><h2>ค่าที่ต้องจับตา</h2><p>เรียงตามผลกระทบต่อภัย</p></div><span class="feed-live">● LIVE</span></header>
        <button v-for="sensor in hazardSensors.slice(0,5)" :key="sensor.key" type="button" :class="{ active: selectedSensor === sensor.key }" @click="selectedSensor = sensor.key">
          <i :style="{ background: sensor.color }"></i><span><b>{{ sensor.type }} · {{ sensor.status }}</b><small>{{ sensor.code }} · {{ sensor.name }}</small></span><strong>{{ sensor.value }}<small>{{ sensor.unit }}</small></strong>
        </button>
      </aside>
    </section>

    <section class="rr-sensor-dashboard" aria-labelledby="sensor-dashboard-title">
      <header><div><span class="panel-kicker">Dashboard ตามประเภทค่าที่จำเป็นต่อภัย</span><h2 id="sensor-dashboard-title">ตัวชี้วัดสำหรับเฝ้าระวังและตัดสินใจ</h2><p>ทุกค่าแสดง Sensor ต้นทาง หน่วยงานเจ้าของข้อมูล และเวลาอัปเดต</p></div></header>
      <div class="sensor-grid">
        <article v-for="sensor in hazardSensors" :key="sensor.key" :class="{ active: selectedSensor === sensor.key }" @click="selectedSensor = sensor.key">
          <header><span :style="{ color: sensor.color }">{{ sensor.icon }}</span><div><b>{{ sensor.type }}</b><small>{{ sensor.status }}</small></div></header>
          <strong>{{ sensor.value }} <small>{{ sensor.unit }}</small></strong>
          <p>{{ sensor.note }}</p>
          <footer><b>{{ sensor.code }}</b><span>{{ sensor.name }}</span><small>{{ sensor.owner }} · {{ sensor.time }}</small></footer>
        </article>
      </div>
    </section>

    <div class="rr-grid">
      <section class="rr-panel trend-panel" aria-labelledby="trend-title">
        <header><div><span class="panel-kicker">แนวโน้ม</span><h2 id="trend-title">ปริมาณฝนสะสม {{ periods.find(p => p.key === period)?.label }}</h2><p>{{ areas.find(a => a.key === area)?.label }} · 12 ช่วงเวลาล่าสุด</p></div><div class="trend-value"><b>{{ trend[trend.length - 1].toLocaleString() }}</b><span>มม.</span></div></header>
        <div class="chart-wrap" role="img" :aria-label="`กราฟแนวโน้มฝนสะสม ค่าล่าสุด ${trend[trend.length - 1]} มิลลิเมตร`">
          <svg viewBox="0 0 600 205" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="rainArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82f6" stop-opacity=".45"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></linearGradient></defs>
            <g class="grid-lines"><line v-for="y in [35,72,108,145,180]" :key="y" x1="18" :y1="y" x2="582" :y2="y" /></g>
            <path :d="chartArea" fill="url(#rainArea)"/><path :d="chartPath" class="trend-line"/>
            <circle v-for="(p, index) in chartPoints" :key="index" :cx="p.x" :cy="p.y" r="3.5"/>
          </svg>
          <div class="chart-labels"><span>00:00</span><span>03:00</span><span>06:00</span><span>09:00</span><span>11:00</span></div>
        </div>
        <footer><span><i class="legend-line"></i> ฝนสะสม</span><span class="trend-note">↗ เพิ่มขึ้น 49 มม. ใน 3 ชั่วโมงล่าสุด</span></footer>
      </section>

      <section class="rr-panel distribution" aria-labelledby="distribution-title">
        <header><div><span class="panel-kicker">การกระจายสถานี</span><h2 id="distribution-title">ระดับปริมาณฝน</h2><p>สถานีที่มีข้อมูล 103 แห่ง</p></div></header>
        <div class="stacked-bar" aria-hidden="true"><i v-for="item in levels" :key="item.label" :style="{ width: item.pct + '%', background: item.color }"></i><i style="width:8.9%;background:#52525b"></i></div>
        <ul>
          <li v-for="item in levels" :key="item.label"><i :style="{ background: item.color }"></i><span><b>{{ item.label }}</b><small>{{ item.range }}</small></span><strong>{{ item.count }}</strong></li>
        </ul>
        <div class="offline"><span><i></i>ไม่มีฝน / ไม่มีข้อมูล</span><b>10 สถานี</b></div>
      </section>

      <section class="rr-panel watch-panel" aria-labelledby="watch-title">
        <header><div><span class="panel-kicker">พื้นที่เฝ้าระวัง</span><h2 id="watch-title">จังหวัดที่ต้องติดตาม</h2><p>เรียงตามปริมาณฝนสูงสุด</p></div><button type="button" @click="goMap">ดูทั้งหมด</button></header>
        <div class="watch-list">
          <article v-for="item in provinces" :key="item.rank">
            <span class="rank">{{ item.rank }}</span><i :style="{ background: item.color }"></i><div><b>{{ item.province }}</b><small>{{ item.district }}</small></div><span class="level">{{ item.level }}<small>{{ item.stations }}</small></span><strong>{{ item.value }}<small>มม.</small></strong>
          </article>
        </div>
      </section>

      <section class="rr-panel quality-panel" aria-labelledby="quality-title">
        <header><div><span class="panel-kicker">ความพร้อมของข้อมูล</span><h2 id="quality-title">สถานะสถานีตรวจวัด</h2><p>ตรวจสอบก่อนใช้ตัดสินใจ</p></div></header>
        <div class="quality-score"><div class="ring"><strong>91%</strong><span>พร้อมใช้</span></div><div><b>ข้อมูลโดยรวมอยู่ในเกณฑ์ดี</b><p>103 จาก 113 สถานีส่งข้อมูลล่าสุด</p></div></div>
        <dl><div><dt><i class="q-ok"></i>ปกติ</dt><dd>71</dd></div><div><dt><i class="q-gap"></i>ข้อมูลขาดช่วง</dt><dd>18</dd></div><div><dt><i class="q-late"></i>ข้อมูลมาช้า</dt><dd>14</dd></div><div><dt><i class="q-off"></i>ออฟไลน์</dt><dd>10</dd></div></dl>
        <button type="button" class="wide-button" @click="goMap">ตรวจสอบสถานีบนแผนที่</button>
      </section>
    </div>

    <footer class="rr-footer"><span>ต้นแบบ: ค่าฝนใช้ชุดข้อมูลสถานีเดิม ส่วนระดับน้ำ เขื่อน ลม และคาดการณ์เป็นข้อมูลจำลองเพื่อออกแบบหน้าจอ</span><span>ระบบจริงต้องเชื่อม API และแสดงเวลาอัปเดตจากหน่วยงานต้นทาง</span></footer>
  </main>
</template>

<style scoped>
@font-face{font-family:Sarabun;src:url('/assets/bcc369502f7b45efbd73f6a2c5708ac0.ttf') format('truetype');font-weight:400;font-display:swap}
@font-face{font-family:Sarabun;src:url('/assets/66d1a1f409f1d7267b7159f42f977071.ttf') format('truetype');font-weight:700;font-display:swap}
*{box-sizing:border-box}.rain-report{--bg:#111214;--panel:#1b1c1f;--panel-2:#232428;--line:#34363c;--muted:#9ca3af;--text:#f8fafc;--blue:#2f6fed;min-height:100vh;background:var(--bg);color:var(--text);font-family:Sarabun,system-ui,sans-serif;padding-bottom:24px}.rain-report.light{--bg:#f4f6f8;--panel:#fff;--panel-2:#eef1f5;--line:#d7dce3;--muted:#64748b;--text:#172033}.rr-header{height:84px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:minmax(300px,1fr) auto minmax(300px,1fr);align-items:center;padding:0 28px;position:relative;background:color-mix(in srgb,var(--bg) 94%,transparent)}.rr-brand{display:flex;align-items:center;gap:12px}.rr-brand img{width:34px;height:50px;object-fit:contain}.rr-brand strong,.rr-brand span{display:block}.rr-brand strong{font-size:16px}.rr-brand span{font-size:12px;color:#cbd5e1}.light .rr-brand span{color:var(--muted)}.rr-main-nav{display:flex;padding:4px;border-radius:26px;background:var(--panel-2);gap:4px}.rr-main-nav button{border:0;background:transparent;color:var(--muted);height:44px;border-radius:22px;padding:0 18px;font:600 14px Sarabun;cursor:pointer}.rr-main-nav button.active{background:#3a3b3f;color:#fff}.light .rr-main-nav button.active{background:#fff;color:#172033;box-shadow:0 1px 8px #0002}.rr-head-actions{justify-self:end;display:flex;align-items:center;gap:10px;position:relative}.icon-button,.rr-user{border:1px solid var(--line);background:var(--panel);color:var(--text);cursor:pointer}.icon-button{width:42px;height:42px;border-radius:50%;font-size:20px}.rr-user{height:48px;border-radius:10px;padding:0 12px;display:flex;align-items:center;gap:9px}.rr-user b,.rr-user small{display:block;text-align:left}.rr-user b{font-size:13px}.rr-user small{font-size:11px;color:var(--muted)}.avatar{font-size:18px}.rr-admin-link{position:absolute;top:54px;right:0;width:170px;height:40px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);z-index:10;cursor:pointer}.rr-toolbar{max-width:1500px;margin:0 auto;padding:26px 30px 18px;display:flex;justify-content:space-between;gap:24px;align-items:end}.eyebrow,.panel-kicker{color:#60a5fa;font-size:12px;font-weight:700}.rr-title-block h1{font-size:30px;line-height:1.2;margin:5px 0}.rr-title-block p,.rr-panel header p{color:var(--muted);font-size:13px;margin:0}.rr-filters{display:flex;align-items:end;gap:10px}.rr-filters label{font-size:12px;color:var(--muted)}.rr-filters select{display:block;margin-top:5px;height:42px;min-width:150px;border-radius:7px;border:1px solid var(--line);background:var(--panel);color:var(--text);padding:0 34px 0 12px;font-family:inherit}.outline{height:42px;border:1px solid #3b82f6;background:#172a4e;color:#bfdbfe;border-radius:7px;padding:0 16px;font-family:inherit;font-weight:700;cursor:pointer}.light .outline{background:#eaf2ff;color:#1d4ed8}.rr-audience,.rr-summary,.rr-alert,.rr-grid,.rr-footer{max-width:1440px;margin-left:auto;margin-right:auto}.rr-audience{margin-top:2px;padding:10px 12px 10px 16px;border:1px solid var(--line);background:var(--panel);border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:20px}.rr-audience>div:first-child b,.rr-audience>div:first-child span{display:block}.rr-audience>div:first-child span{font-size:11px;color:var(--muted)}.audience-tabs{display:flex;gap:6px;overflow:auto}.audience-tabs button{height:38px;border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:7px;padding:0 14px;font:600 13px Sarabun;white-space:nowrap;cursor:pointer}.audience-tabs button.active{background:#215bc7;border-color:#2f6fed;color:#fff}.short-label{display:none}.rr-summary{display:grid;grid-template-columns:1.35fr repeat(3,1fr);gap:12px;margin-top:14px}.rr-status-card,.rr-kpi{min-height:112px;background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:17px}.rr-status-card{display:flex;align-items:center;gap:14px}.rr-status-card.danger{border-color:#7f1d2d;background:linear-gradient(135deg,#3c1820,var(--panel) 65%)}.light .rr-status-card.danger{background:linear-gradient(135deg,#fff1f2,#fff 65%)}.status-icon{width:48px;height:48px;border-radius:12px;background:#f43f5e;color:#fff;display:grid;place-items:center;font-size:24px}.rr-status-card span,.rr-status-card strong,.rr-status-card small,.rr-kpi span,.rr-kpi strong,.rr-kpi small{display:block}.rr-status-card span,.rr-kpi span{font-size:12px;color:var(--muted)}.rr-status-card strong{font-size:23px;color:#fb7185;margin:2px 0}.rr-status-card small,.rr-kpi small{font-size:11px;color:var(--muted)}.rr-kpi strong{font-size:28px;margin:6px 0 2px}.rr-kpi strong small{display:inline;font-size:13px}.ok-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:4px}.rr-alert{margin-top:12px;border:1px solid #265797;background:#142944;border-radius:10px;min-height:66px;display:flex;align-items:center;gap:12px;padding:12px 16px}.light .rr-alert{background:#eaf2ff}.alert-mark{width:30px;height:30px;border-radius:50%;background:#2f6fed;display:grid;place-items:center;font-weight:700}.rr-alert>div:nth-child(2){flex:1}.rr-alert b{font-size:14px}.rr-alert p{margin:2px 0 0;color:#bfdbfe;font-size:12px}.light .rr-alert p{color:#475569}.rr-alert button,.watch-panel header button{border:0;background:transparent;color:#93c5fd;font:700 12px Sarabun;cursor:pointer;white-space:nowrap}.rr-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.75fr);gap:12px;margin-top:12px}.rr-panel{background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:18px;min-width:0}.rr-panel>header{display:flex;justify-content:space-between;gap:16px;align-items:start}.rr-panel h2{font-size:18px;margin:2px 0}.trend-value{text-align:right}.trend-value b{font-size:32px}.trend-value span{font-size:12px;color:var(--muted);margin-left:4px}.chart-wrap{height:230px;margin-top:8px;position:relative}.chart-wrap svg{width:100%;height:205px;overflow:visible}.grid-lines line{stroke:var(--line);stroke-width:1}.trend-line{fill:none;stroke:#3b82f6;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.chart-wrap circle{fill:#60a5fa;stroke:var(--panel);stroke-width:2}.chart-labels{display:flex;justify-content:space-between;color:var(--muted);font-size:10px;padding:0 2%}.trend-panel footer{display:flex;justify-content:space-between;color:var(--muted);font-size:11px;border-top:1px solid var(--line);padding-top:11px}.legend-line{display:inline-block;width:20px;height:3px;background:#3b82f6;border-radius:2px;margin-right:6px;vertical-align:middle}.trend-note{color:#93c5fd}.stacked-bar{display:flex;height:11px;border-radius:6px;overflow:hidden;margin:22px 0 14px}.distribution ul{list-style:none;margin:0;padding:0}.distribution li{display:grid;grid-template-columns:10px 1fr auto;gap:9px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)}.distribution li>i,.offline i{width:9px;height:9px;border-radius:50%}.distribution li span b,.distribution li span small{display:block}.distribution li span b{font-size:12px}.distribution li span small{font-size:10px;color:var(--muted)}.distribution li strong{font-size:15px}.offline{display:flex;justify-content:space-between;align-items:center;padding-top:10px;color:var(--muted);font-size:11px}.offline span{display:flex;align-items:center;gap:9px}.offline i{display:inline-block;background:#52525b}.offline b{color:var(--text)}.watch-panel{padding-bottom:9px}.watch-panel header{margin-bottom:8px}.watch-list article{min-height:64px;display:grid;grid-template-columns:24px 5px minmax(120px,1fr) minmax(110px,.7fr) 72px;align-items:center;gap:10px;border-top:1px solid var(--line)}.watch-list article>i{height:34px;border-radius:3px}.rank{color:var(--muted);font-size:12px;text-align:center}.watch-list article div b,.watch-list article div small,.watch-list .level small,.watch-list article>strong small{display:block}.watch-list article div b{font-size:13px}.watch-list article div small,.watch-list .level,.watch-list .level small{font-size:10px;color:var(--muted)}.watch-list article>strong{text-align:right;font-size:17px}.watch-list article>strong small{font-size:9px;color:var(--muted)}.quality-score{display:flex;align-items:center;gap:15px;margin:20px 0}.ring{width:86px;height:86px;border-radius:50%;display:grid;place-content:center;text-align:center;background:radial-gradient(circle,var(--panel) 57%,transparent 59%),conic-gradient(#22c55e 0 91%,#3f3f46 91%)}.ring strong{font-size:21px}.ring span{font-size:10px;color:var(--muted)}.quality-score>div:last-child b{font-size:13px}.quality-score p{font-size:11px;color:var(--muted);margin:5px 0}.quality-panel dl{margin:0}.quality-panel dl>div{display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid var(--line);font-size:12px}.quality-panel dt{display:flex;align-items:center;gap:8px}.quality-panel dt i{width:8px;height:8px;border-radius:50%}.q-ok{background:#22c55e}.q-gap{background:#8b5cf6}.q-late{background:#eab308}.q-off{background:#71717a}.quality-panel dd{margin:0;font-weight:700}.wide-button{width:100%;height:38px;margin-top:12px;border:1px solid #315b9b;background:#172a4e;color:#bfdbfe;border-radius:7px;font:700 12px Sarabun;cursor:pointer}.light .wide-button{background:#eaf2ff;color:#1d4ed8}.rr-footer{margin-top:14px;border-top:1px solid var(--line);padding:14px 4px 0;display:flex;justify-content:space-between;color:var(--muted);font-size:10px}
@media(max-width:1100px){.rr-header{grid-template-columns:1fr auto}.rr-main-nav{order:3;grid-column:1/-1;justify-self:center;margin-bottom:-54px;transform:translateY(15px);z-index:2}.rr-header{height:112px;align-items:start;padding-top:15px}.rr-summary{grid-template-columns:repeat(2,1fr)}.rr-audience,.rr-summary,.rr-alert,.rr-grid,.rr-footer{margin-left:20px;margin-right:20px}.rr-toolbar{padding-left:20px;padding-right:20px}.rr-audience{align-items:flex-start;flex-direction:column}.audience-tabs{width:100%}.rr-grid{grid-template-columns:1fr}.distribution{order:3}.quality-panel{order:4}}
@media(max-width:720px){.rr-header{height:76px;padding:10px 14px;grid-template-columns:1fr auto}.rr-brand img{width:28px;height:42px}.rr-brand strong{font-size:12px}.rr-brand span{font-size:9px}.rr-main-nav{position:fixed;bottom:10px;left:50%;transform:translateX(-50%);margin:0;z-index:50;box-shadow:0 8px 28px #0008;border:1px solid var(--line)}.rr-main-nav button{height:42px;padding:0 14px}.rr-user span:not(.avatar){display:none}.rr-user{width:42px;padding:0;justify-content:center}.rr-head-actions{gap:6px}.rr-toolbar{display:block;padding:18px 14px 12px}.rr-title-block h1{font-size:24px}.rr-filters{margin-top:14px;display:grid;grid-template-columns:1fr 1fr}.rr-filters label select{width:100%;min-width:0}.rr-filters .outline{grid-column:1/-1}.rr-audience,.rr-summary,.rr-alert,.rr-grid,.rr-footer{margin-left:12px;margin-right:12px}.rr-audience{padding:12px}.audience-tabs button{padding:0 12px}.long-label{display:none}.short-label{display:inline}.rr-summary{grid-template-columns:1fr 1fr;gap:8px}.rr-status-card{grid-column:1/-1}.rr-kpi{min-height:98px;padding:13px}.rr-kpi strong{font-size:23px}.rr-alert{align-items:flex-start;flex-wrap:wrap}.rr-alert button{margin-left:42px}.rr-panel{padding:14px}.chart-wrap{height:205px}.chart-wrap svg{height:180px}.watch-list article{grid-template-columns:20px 4px minmax(100px,1fr) 64px}.watch-list .level{display:none}.rr-footer{display:block;padding-bottom:70px}.rr-footer span{display:block;margin-bottom:4px}}
@media(max-width:420px){.rr-summary{grid-template-columns:1fr}.rr-kpi{min-height:88px}.rr-filters{grid-template-columns:1fr}.rr-filters .outline{grid-column:auto}.watch-list article>strong{font-size:14px}.rr-audience>div:first-child span{display:none}}
</style>

<style scoped>
.rr-ops-grid,.rr-sensor-dashboard{max-width:1440px;margin-left:auto;margin-right:auto}
.rr-ops-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(330px,.7fr);gap:12px;margin-top:12px}
.rr-live-map,.rr-event-feed,.rr-sensor-dashboard{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;min-width:0}
.rr-live-map>header,.rr-event-feed>header,.rr-sensor-dashboard>header{display:flex;justify-content:space-between;align-items:start;gap:12px;margin-bottom:12px}
.rr-live-map h2,.rr-event-feed h2,.rr-sensor-dashboard h2{font-size:19px;margin:2px 0}.rr-live-map header p,.rr-event-feed header p,.rr-sensor-dashboard header p{font-size:11px;color:var(--muted);margin:0}
.rr-live-map>header button{border:1px solid #315b9b;background:#172a4e;color:#bfdbfe;border-radius:7px;height:34px;padding:0 12px;font:700 11px Sarabun;cursor:pointer}
.hazard-map{height:390px;position:relative;overflow:hidden;border-radius:9px;border:1px solid #3f4657;background:#293248 url('/assets/dd65fa0593bd6884efcd4d08f98989bd.jpg') center 42%/cover no-repeat}
.hazard-map::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(5,8,15,.65));pointer-events:none}
.map-sensor{position:absolute;z-index:2;width:36px;height:36px;transform:translate(-50%,-50%);border:4px solid color-mix(in srgb,var(--sensor-color) 35%,transparent);background:var(--sensor-color);color:#fff;border-radius:50%;box-shadow:0 0 0 5px color-mix(in srgb,var(--sensor-color) 22%,transparent),0 4px 14px #0009;display:grid;place-items:center;cursor:pointer}.map-sensor span{font-size:15px}.map-sensor.active{width:44px;height:44px;box-shadow:0 0 0 8px color-mix(in srgb,var(--sensor-color) 28%,transparent),0 5px 18px #000}
.map-scope{position:absolute;z-index:2;top:12px;left:12px;padding:6px 10px;border-radius:6px;background:#0f172ad9;border:1px solid #475569;color:#fff;font-size:11px;font-weight:700}.map-source{position:absolute;z-index:2;bottom:10px;left:12px;display:flex;gap:12px;padding:5px 8px;border-radius:5px;background:#0f172ad9;color:#cbd5e1;font-size:9px}
.selected-source{display:grid;grid-template-columns:42px minmax(0,1.25fr) minmax(120px,.45fr) minmax(180px,.8fr);align-items:center;gap:12px;margin-top:10px;padding:11px;border:1px solid var(--line);border-radius:8px;background:var(--bg)}
.source-icon{width:38px;height:38px;border-radius:9px;display:grid;place-items:center;color:#fff;font-size:18px}.source-main small,.source-main b,.source-main span,.source-value b,.source-value span,.source-meta b,.source-meta span,.source-meta small{display:block}.source-main small{font-size:9px;color:#60a5fa}.source-main b{font-size:12px}.source-main span,.source-meta{font-size:9px;color:var(--muted)}.source-value{text-align:right}.source-value b{font-size:25px}.source-value span{font-size:9px;color:var(--muted)}.source-meta{padding-left:12px;border-left:1px solid var(--line)}.source-meta b{color:var(--text);font-size:9px}.source-meta small{color:#fca5a5;margin-top:3px}
.feed-live{font-size:9px;color:#86efac;background:#123524;padding:3px 7px;border-radius:10px}.rr-event-feed>button{width:100%;min-height:67px;display:grid;grid-template-columns:4px minmax(0,1fr) 78px;gap:9px;align-items:center;text-align:left;border:0;border-top:1px solid var(--line);background:transparent;color:var(--text);padding:8px 0;cursor:pointer}.rr-event-feed>button.active{background:#17255466}.rr-event-feed>button>i{height:37px;border-radius:3px}.rr-event-feed button span b,.rr-event-feed button span small,.rr-event-feed button>strong small{display:block}.rr-event-feed button span b{font-size:11px}.rr-event-feed button span small{font-size:8px;color:var(--muted);line-height:1.35}.rr-event-feed button>strong{text-align:right;font-size:16px}.rr-event-feed button>strong small{font-size:8px;color:var(--muted);font-weight:400}
.rr-sensor-dashboard{margin-top:12px}.sensor-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.sensor-grid article{border:1px solid var(--line);border-radius:9px;background:var(--bg);padding:12px;cursor:pointer}.sensor-grid article.active{border-color:#3b82f6;box-shadow:0 0 0 1px #3b82f655}.sensor-grid article>header{display:flex;align-items:center;gap:8px}.sensor-grid article>header>span{width:32px;height:32px;border-radius:7px;background:var(--panel-2);display:grid;place-items:center;font-size:17px}.sensor-grid header b,.sensor-grid header small{display:block}.sensor-grid header b{font-size:12px}.sensor-grid header small{font-size:9px;color:var(--muted)}.sensor-grid article>strong{display:block;font-size:23px;margin:10px 0 4px}.sensor-grid article>strong small{font-size:9px;color:var(--muted)}.sensor-grid article>p{min-height:30px;margin:0 0 8px;color:var(--muted);font-size:9px;line-height:1.5}.sensor-grid footer{padding-top:8px;border-top:1px solid var(--line)}.sensor-grid footer b,.sensor-grid footer span,.sensor-grid footer small{display:block}.sensor-grid footer b{color:#93c5fd;font-size:9px}.sensor-grid footer span{font-size:10px;font-weight:700}.sensor-grid footer small{font-size:8px;color:var(--muted)}
@media(max-width:1100px){.rr-ops-grid,.rr-sensor-dashboard{margin-left:20px;margin-right:20px}.rr-ops-grid{grid-template-columns:1fr}.sensor-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hazard-map{height:360px}}
@media(max-width:720px){.rr-ops-grid,.rr-sensor-dashboard{margin-left:12px;margin-right:12px}.rr-live-map,.rr-event-feed,.rr-sensor-dashboard{padding:12px}.hazard-map{height:300px}.selected-source{grid-template-columns:38px 1fr auto}.source-meta{grid-column:2/-1;border-left:0;border-top:1px solid var(--line);padding:8px 0 0}.sensor-grid{grid-template-columns:1fr}.rr-event-feed>button{grid-template-columns:4px 1fr 70px}}
</style>

<style scoped>
.rr-role-section,.rr-monitor-flow{max-width:1440px;margin-left:auto;margin-right:auto}
.rr-role-section{margin-top:12px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px}
.role-header{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:14px}
.role-header h2,.rr-monitor-flow h2{font-size:20px;margin:3px 0}
.role-header p{color:var(--muted);font-size:12px;margin:0}
.role-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.role-card{border:1px solid var(--line);border-top:3px solid #3b82f6;background:var(--bg);border-radius:10px;padding:14px;cursor:pointer;transition:.18s ease}
.role-card.green{border-top-color:#22c55e}.role-card.orange{border-top-color:#f59e0b}.role-card.blue{border-top-color:#3b82f6}
.role-card.muted{opacity:.48}.role-card.active{box-shadow:0 0 0 1px color-mix(in srgb,#3b82f6 55%,transparent)}
.role-card>header{display:flex;align-items:center;gap:10px}.role-icon{width:36px;height:36px;border-radius:9px;background:var(--panel-2);display:grid;place-items:center;font-size:20px}
.role-card header small,.role-card header h3{display:block;margin:0}.role-card header small{font-size:10px;color:var(--muted)}.role-card header h3{font-size:17px}
.live-chip{margin-left:auto;border-radius:12px;padding:3px 8px;background:#123524;color:#86efac;font-size:9px}
.role-question{min-height:40px;margin:12px 0 7px;color:var(--muted);font-size:11px;line-height:1.55}.role-headline{display:block;min-height:42px;font-size:14px;line-height:1.45}
.role-card dl{margin:10px 0 12px}.role-card dl>div{display:flex;justify-content:space-between;gap:10px;border-top:1px solid var(--line);padding:7px 0}
.role-card dt{color:var(--muted);font-size:10px}.role-card dd{margin:0;text-align:right;font-size:10px;font-weight:700}
.role-card>button{width:100%;height:34px;border:1px solid var(--line);border-radius:7px;background:var(--panel-2);color:var(--text);font:700 11px Sarabun;cursor:pointer}
.rr-monitor-flow{margin-top:12px;border:1px solid #294f87;background:linear-gradient(90deg,#12233c,var(--panel));border-radius:11px;padding:14px 16px}
.rr-monitor-flow>header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.updated{font-size:10px;color:#86efac}
.flow-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.flow-grid article{display:grid;grid-template-columns:24px 4px 1fr auto;align-items:center;gap:8px;border:1px solid #334155;background:#111827;border-radius:8px;padding:10px}
.step-no{color:#64748b;font-size:10px}.flow-grid article>i{height:32px;border-radius:3px}.flow-grid b,.flow-grid small{display:block}.flow-grid b{font-size:12px}.flow-grid small{font-size:9px;color:#94a3b8}.flow-grid strong{font-size:13px;white-space:nowrap}
@media(max-width:1100px){.rr-role-section,.rr-monitor-flow{margin-left:20px;margin-right:20px}.role-header{align-items:flex-start;flex-direction:column}.role-header .audience-tabs{width:100%}.role-grid{grid-template-columns:1fr}.flow-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:720px){.rr-role-section,.rr-monitor-flow{margin-left:12px;margin-right:12px}.role-card.muted{opacity:.7}.flow-grid{grid-template-columns:1fr}.rr-monitor-flow>header{align-items:flex-start;gap:8px}.updated{margin-top:4px}.role-question,.role-headline{min-height:0}}
</style>
