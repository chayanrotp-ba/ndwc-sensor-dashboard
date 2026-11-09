<script setup>
import {ref} from 'vue';
defineProps({name:String,status:{type:String,default:'ออนไลน์'}});
const photo=ref(0);
const photos=['4c25bd342f475f24ffee0630da9e320a.jpg','debfa4f497673172a9a6052cb3775156.jpg','7cb7125fdc60fd4b663030a3f25ca65c.jpg'];
function move(direction){photo.value=(photo.value+direction+photos.length)%photos.length;}
</script>
<template>
 <div class="station-carousel" role="region" aria-roledescription="ภาพสไลด์" :aria-label="'รูปสถานี '+name" @keydown.left.prevent="move(-1)" @keydown.right.prevent="move(1)">
  <img :src="'./assets/'+photos[photo]" :alt="'ภาพตัวอย่างสถานี '+name+' รูปที่ '+(photo+1)">
  <span :class="['station-carousel-status',{offline:status==='ออฟไลน์'}]">{{ status }}</span>
  <button type="button" class="station-carousel-arrow prev" aria-label="รูปก่อนหน้า" @click="move(-1)">‹</button>
  <button type="button" class="station-carousel-arrow next" aria-label="รูปถัดไป" @click="move(1)">›</button>
  <div class="station-carousel-dots"><button v-for="(item,i) in photos" :key="item" type="button" :class="{active:photo===i}" :aria-label="'รูปที่ '+(i+1)" :aria-pressed="photo===i" @click="photo=i"></button></div>
  <span class="station-carousel-sr" aria-live="polite">รูปที่ {{ photo+1 }} จาก {{ photos.length }}</span>
 </div>
</template>
<style>
.station-carousel{position:relative;width:100%;overflow:hidden;border-radius:10px;background:#15181e}.station-carousel>img{display:block;width:100%;aspect-ratio:16/10;max-height:430px;object-fit:cover}.station-carousel .station-carousel-status{position:absolute;top:10px;right:10px;padding:1px 7px;background:#f0fff5;color:#14803a;border:1px solid #86efac;border-radius:5px;font-size:13px;font-weight:700}.station-carousel .station-carousel-status.offline{color:#64748b;background:#f1f5f9;border-color:#cbd5e1}.station-carousel button.station-carousel-arrow{position:absolute;top:50%;transform:translateY(-50%);display:grid;place-items:center;border:0;border-radius:50%;width:36px;height:36px;min-height:36px;padding:0;background:#33415599;color:white;font-size:30px;line-height:1;cursor:pointer}.station-carousel .prev{left:10px}.station-carousel .next{right:10px}.station-carousel-arrow:hover{background:#1e293bcc!important}.station-carousel-dots{position:absolute;bottom:9px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px}.station-carousel .station-carousel-dots button{width:9px;height:9px;min-height:0;padding:0;border:0;border-radius:8px;background:#ffffffe6;cursor:pointer;box-shadow:0 1px 4px #0005}.station-carousel .station-carousel-dots button.active{width:23px;background:#2563eb}.station-carousel :focus-visible{outline:2px solid #60a5fa;outline-offset:3px}.station-carousel-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
</style>
<style>.station-qr-photo>.station-carousel,.station-photos>.station-carousel{display:block;margin:0}.station-photos .station-carousel>img{aspect-ratio:16/10}</style>
