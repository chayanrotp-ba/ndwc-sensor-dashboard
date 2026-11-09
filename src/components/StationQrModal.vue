<script setup>
import {ref,onMounted,onBeforeUnmount,nextTick} from 'vue';
import StationQrPage from './StationQrPage.vue';
const props=defineProps({code:String,close:Function});
const panel=ref(null);
const previousFocus=document.activeElement;
const previousOverflow=document.body.style.overflow;
function keyboard(event){
 if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();props.close();}
 if(event.key==='Tab'){
  const items=[...panel.value.querySelectorAll('button:not(:disabled),a[href]')];
  const first=items[0],last=items.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
}
onMounted(async()=>{document.body.style.overflow='hidden';window.addEventListener('keydown',keyboard,true);await nextTick();panel.value.querySelector('button').focus();});
onBeforeUnmount(()=>{window.removeEventListener('keydown',keyboard,true);document.body.style.overflow=previousOverflow;nextTick(()=>previousFocus?.focus());});
</script>
<template>
 <Teleport to="body"><div class="station-qr-overlay" @click.self="close">
  <section ref="panel" class="station-qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
   <button class="station-qr-close" aria-label="ปิดรูปสถานีและ QR กลับรายละเอียดสถานี" @click="close">×</button>
   <StationQrPage :code="code" embedded />
  </section>
 </div></Teleport>
</template>
<style>
.station-qr-overlay{position:fixed;inset:0;background:#000a;backdrop-filter:blur(3px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}.station-qr-modal{position:relative;box-sizing:border-box;width:min(1000px,100%);max-height:calc(100dvh - 48px);overflow:auto;background:#191b20;border:1px solid #667085;border-radius:16px;box-shadow:0 24px 90px #000b}.station-qr-close{position:absolute;top:12px;right:12px;margin:0;z-index:2;width:36px;height:36px;border:1px solid #738198;border-radius:8px;background:#303b4b;color:white;font-size:26px;cursor:pointer}.station-qr-close:focus-visible{outline:2px solid #60a5fa;outline-offset:3px}@media(max-width:720px){.station-qr-overlay{padding:0}.station-qr-modal{height:100dvh;max-height:100dvh;border-radius:0;border:0}}
</style>
