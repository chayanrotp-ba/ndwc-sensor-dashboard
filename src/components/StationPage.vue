<script setup>
import { computed, ref } from 'vue';
import StationPhotoCarousel from './StationPhotoCarousel.vue';
import ExactLogic from './Exact.js';
import CriteriaComparison from './CriteriaComparison.vue';
const props=defineProps({code:String});
const model=new ExactLogic({});
const rows=model.data().R;
const station=rows.find((r,i)=>'G15006-'+(5501+i*13)===props.code);
if(station) model.state.st=station[0];
const view=computed(()=>station?model.renderVals():null);
const photo=ref(0);
const photos=['4c25bd342f475f24ffee0630da9e320a.jpg','debfa4f497673172a9a6052cb3775156.jpg','7cb7125fdc60fd4b663030a3f25ca65c.jpg'];
const asset=name=>import.meta.env.BASE_URL+'assets/'+name;
const home=import.meta.env.BASE_URL;
const readings=computed(()=>station?model.metricDefs('d1','own').filter(m=>!m.dir).map(m=>({name:m.name,unit:m.unitTh,value:model.dataStat(station).silent?null:m.key==='rain'?model.rainOf(station,'d1'):model.meas(station)[m.key]})):[]);
</script>
<template>
 <main class="station-page">
  <nav><a :href="home">← หน้าแผนที่</a><span>รายละเอียดสถานี · เปิดผ่าน QR Code</span></nav>
  <template v-if="view">
   <header><span class="station-demo">MOCKUP · ข้อมูลสาธิต</span><h1>{{ view.spName }}</h1><p>{{ code }} · {{ view.spLoc }}</p><p>{{ view.spAgency }}</p></header>
   <div class="station-page-grid">
    <section class="station-photos"><h2>รูปภาพสถานี</h2><StationPhotoCarousel :name="view.spName" :status="view.spOnline" /><small>ภาพตัวอย่างจากต้นฉบับ Mockup</small></section>
    <section class="station-contact"><h2>ข้อมูลสถานี</h2><dl><dt>ผู้ดูแลอุปกรณ์ / ผู้ประสานงาน</dt><dd>{{ view.spPerson }}</dd><dt>โทรศัพท์</dt><dd><a :href="view.spTel">{{ view.spPhoneFmt }}</a></dd><dt>ลุ่มน้ำ</dt><dd>{{ view.spBasin }}</dd><dt>พิกัด</dt><dd>{{ view.spLatLon }}</dd><dt>พิกัด UTM</dt><dd>{{ view.spUtm }}</dd><dt>สถานะข้อมูล</dt><dd>{{ view.spDataStat }}</dd></dl></section>
   </div>
   <section class="station-readings"><h2>ค่าตรวจวัดล่าสุด</h2><p>เวลาอ้างอิงข้อมูลสาธิต · {{ view.spTime }}</p><div><article v-for="reading in readings" :key="reading.name"><span>{{ reading.name }}</span><strong>{{ reading.value??'ไม่มีข้อมูล' }} <small>{{ reading.value==null?'':reading.unit }}</small></strong></article></div></section>
   <div class="ex station-page-criteria"><CriteriaComparison :context="view.spComparison" /></div>
  </template>
  <section v-else><h1>ไม่พบสถานี</h1><p>ไม่พบรหัส {{ code }} ในข้อมูลตัวอย่าง</p></section>
 </main>
</template>
<style>
.station-page{min-height:100dvh;background:#191b20;color:#f1f5f9;font:15px/1.6 Sarabun,sans-serif;padding:24px max(18px,calc((100vw - 1160px)/2));}.station-page a{color:#93c5fd}.station-page nav{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;border-bottom:1px solid #414855;padding-bottom:16px}.station-page nav span,.station-page dt,.station-page small{color:#adbbce}.station-page header{padding:24px 0}.station-page h1{font-size:28px;margin:8px 0}.station-page h2{font-size:19px;margin:0 0 14px}.station-page p{margin:5px 0}.station-demo{color:#fcd34d;font-size:12px;border:1px solid #85682a;padding:3px 8px;border-radius:5px}.station-page-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:20px}.station-page section{border:1px solid #414855;border-radius:12px;background:#24272e;padding:20px}.station-photos img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:8px}.station-photos>div{display:flex;gap:8px;margin:10px 0}.station-page button{border:1px solid #657089;background:#303640;color:#fff;padding:7px 14px;border-radius:6px;font:inherit;cursor:pointer}.station-page button[aria-pressed=true]{background:#2563eb}.station-page :focus-visible{outline:2px solid #60a5fa;outline-offset:3px}.station-contact dd{margin:3px 0 14px}.station-readings{margin:20px 0}.station-readings>div{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px}.station-readings article{padding:12px;background:#191b20;border-radius:8px}.station-readings article>span,.station-readings strong{display:block}.station-readings strong{font-size:22px;margin-top:5px}.station-readings strong small{font-size:13px}.station-page .station-page-criteria{font:inherit;background:transparent;color:inherit;position:static;width:100%;height:auto;transform:none}.station-page .criteria-comparison{margin:0}@media(max-width:700px){.station-page-grid{grid-template-columns:1fr}.station-readings>div{grid-template-columns:repeat(2,1fr)}.station-page h1{font-size:22px}.station-page section{padding:14px}}
</style>
