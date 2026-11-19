<script setup>
import {ref,watch} from 'vue';

const props=defineProps({url:String,theme:String});
const frame=ref(null);
function syncTheme(){
  frame.value?.contentWindow?.postMessage({
    type:'ndwc-backoffice-theme',
    theme:props.theme==='light'?'light':'dark',
  },location.origin);
}
watch(()=>props.theme,syncTheme);
</script>
<template>
  <iframe ref="frame" title="ตั้งค่าเกณฑ์ระดับการเตือนภัยกลาง" :src="url" @load="syncTheme"></iframe>
</template>
