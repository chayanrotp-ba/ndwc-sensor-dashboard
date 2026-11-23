<script setup>
import { computed } from 'vue';

const props = defineProps({
  theme: { type: String, default: 'dark' },
  goMap: { type: Function, default: null },
  goAdmin: { type: Function, default: null },
});

const dashboardUrl = computed(() => `${import.meta.env.BASE_URL}ddpm-cctv-monitoring-dashboard/index.html?theme=${props.theme === 'light' ? 'light' : 'dark'}&v=map-shell-4`);
</script>

<template>
  <div class="cloned-dashboard-shell" :class="{ light: theme === 'light' }">
    <iframe
      class="cloned-dashboard-frame"
      :src="dashboardUrl"
      title="DDPM CCTV monitoring dashboard"
    />
  </div>
</template>

<style scoped>
.cloned-dashboard-shell{min-height:100vh;background:#111214;color:#f8fafc;font-family:Sarabun,system-ui,sans-serif;display:flex;flex-direction:column}
.cloned-dashboard-shell.light{background:#f4f6f8;color:#172033}
.cloned-dashboard-toolbar{height:48px;display:flex;align-items:center;gap:16px;padding:0 18px;border-bottom:1px solid #34363c;background:#181a1e;font-size:12px}
.light .cloned-dashboard-toolbar{background:#fff;border-color:#d7dce3}
.cloned-dashboard-toolbar button{border:1px solid #52617a;border-radius:6px;background:#202b3b;color:#dbeafe;padding:6px 10px;font:inherit;cursor:pointer}
.light .cloned-dashboard-toolbar button{background:#eaf2ff;color:#1d4ed8}
.cloned-dashboard-frame{display:block;width:100%;height:100vh;border:0;background:#111214}
</style>
