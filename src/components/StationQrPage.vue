<script setup>
import {ref,onMounted} from 'vue';
import StationPhotoCarousel from './StationPhotoCarousel.vue';
import QRCode from 'qrcode';
import ExactLogic from './Exact.js';
const props=defineProps({code:String,embedded:Boolean});
const model=new ExactLogic({});
const station=model.data().R.find((r,i)=>'G15006-'+(5501+i*13)===props.code);
const qrImage=ref('');
const photos=['4c25bd342f475f24ffee0630da9e320a.jpg','debfa4f497673172a9a6052cb3775156.jpg','7cb7125fdc60fd4b663030a3f25ca65c.jpg'];
const scanUrl=new URL(location.href);scanUrl.search='';scanUrl.hash='';scanUrl.searchParams.set('station',props.code);
onMounted(async()=>{qrImage.value=await QRCode.toDataURL(scanUrl.href,{width:320,margin:4,errorCorrectionLevel:'M'});});
</script>
<template>
 <main :class="['station-qr-page',{'station-qr-embedded':embedded}]">
  <a v-if="!embedded" :href="'./'">← หน้าแผนที่</a>
  <template v-if="station">
   <header><small>MOCKUP · ภาพและข้อมูลสาธิต</small><h1 id="qr-modal-title">รูปสถานีและ QR Code</h1><h2>{{ station[1] }}</h2><p>{{ code }} · ต.{{ station[2] }} อ.{{ station[3] }} จ.{{ station[4] }}</p></header>
   <div class="station-qr-grid">
    <section class="station-qr-photo"><StationPhotoCarousel :name="station[1]" :status="model.dataStat(station).silent?'ออฟไลน์':'ออนไลน์'" /></section>
    <section class="station-qr-card"><h2>สแกนเพื่อดูรายละเอียดสถานี</h2><img v-if="qrImage" :src="qrImage" :alt="'QR Code เปิดรายละเอียดสถานี '+code"><p v-else>กำลังสร้าง QR Code…</p><strong>{{ code }}</strong><p>ใช้กล้องโทรศัพท์สแกน QR Code<br>เพื่อเปิดหน้ารายละเอียดสถานี</p><a :href="scanUrl.href" target="_blank" rel="noopener noreferrer">ตัวอย่างกรณีสแกนเเล้ว</a></section>
   </div>
  </template>
  <h1 v-else>ไม่พบสถานี {{ code }}</h1>
 </main>
</template>
<style>
.station-qr-page{box-sizing:border-box;min-height:100dvh;background:#191b20;color:#f1f5f9;padding:24px max(20px,calc((100vw - 1080px)/2));font:15px/1.6 Sarabun,sans-serif}
.station-qr-page *{box-sizing:border-box}.station-qr-page a{color:#93c5fd;text-underline-offset:4px}.station-qr-page header{padding:20px 0}.station-qr-page header small{color:#fcd34d;font-size:11px}.station-qr-page h1{font-size:24px;line-height:1.35;margin:4px 0 8px}.station-qr-page h2{font-size:17px;line-height:1.5;margin:0}.station-qr-page p{color:#b9c7da;margin:4px 0;font-size:13px}
.station-qr-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(230px,1fr);gap:20px;align-items:start}.station-qr-photo{min-width:0}.station-qr-photo>.station-carousel{display:block;margin:0}.station-qr-card{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:16px;background:#252830;border:1px solid #465064;border-radius:12px}.station-qr-card h2{font-size:16px}.station-qr-card>img{display:block;width:min(100%,220px);height:auto;border-radius:8px}.station-qr-card strong{font-size:15px}.station-qr-card>a{font-size:13px;padding:4px}.station-qr-page :focus-visible{outline:2px solid #60a5fa;outline-offset:3px}
.station-qr-embedded{min-height:0;padding:20px 24px 24px}.station-qr-embedded header{padding:0 40px 16px 0}.station-qr-embedded .station-carousel>img{aspect-ratio:4/3;max-height:380px}.station-qr-embedded .station-qr-grid{align-items:center}
@media(min-width:721px) and (max-height:650px){.station-qr-embedded{padding:16px 20px}.station-qr-embedded header{padding-bottom:8px}.station-qr-embedded header small{display:none}.station-qr-embedded .station-qr-card p{font-size:12px;margin:0}.station-qr-embedded h1{font-size:20px;margin-bottom:4px}.station-qr-embedded h2{font-size:15px}.station-qr-embedded .station-carousel>img{max-height:220px;aspect-ratio:16/10}.station-qr-embedded .station-qr-card{gap:4px;padding:12px}.station-qr-embedded .station-qr-card>img{width:140px}}
@media(max-width:720px){.station-qr-page{padding:16px}.station-qr-grid{grid-template-columns:1fr;gap:16px}.station-qr-page h1{font-size:21px}.station-qr-embedded header{padding-right:36px}.station-qr-embedded .station-carousel>img{aspect-ratio:16/10;max-height:320px}.station-qr-card>img{width:210px}}
</style>
