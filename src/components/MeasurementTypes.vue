<script setup>
import {measurements} from '../warning-criteria.js';

const props = defineProps({
  modelValue: Number,
  disabled: Boolean,
  sensors: Array,
});
defineEmits(['update:modelValue']);

function unavailable(index) {
  return props.sensors && !props.sensors.includes(index);
}
</script>

<template>
  <div class="measurement-types">
    <span class="measurement-types-label">ประเภทการตรวจวัด</span>
    <div class="measurement-types-list" role="group" aria-label="ประเภทการตรวจวัด">
      <button
        v-for="(name,index) in measurements"
        :key="name"
        type="button"
        :aria-pressed="modelValue===index"
        :class="{selected:modelValue===index}"
        :disabled="disabled || unavailable(index)"
        :title="unavailable(index)?'สถานีนี้ไม่มีเซนเซอร์ประเภทนี้':name"
        @click="$emit('update:modelValue',index)"
      >{{ name }}</button>
    </div>
    <small v-if="disabled">บันทึกหรือยกเลิกการแก้ไขก่อนเปลี่ยนประเภท</small>
  </div>
</template>

<style>
.measurement-types{display:grid;gap:10px;margin:8px 0 16px;min-width:0;color:#e2e8f0}
.measurement-types-label{font-weight:600;font-size:14px}
.measurement-types-list{display:flex;flex-wrap:wrap;gap:8px}
.measurement-types-list button{font:inherit;font-size:13px;line-height:1.5;min-height:38px;padding:8px 14px;border:1px solid #4b5563;border-radius:24px;background:#252830;color:#dbe4f2;cursor:pointer}
.measurement-types-list button:hover:not(:disabled){background:#344258;border-color:#93c5fd}
.measurement-types-list button.selected{background:#2563eb;border-color:#60a5fa;color:#fff}
.measurement-types-list button:disabled{opacity:.48;cursor:not-allowed}
.measurement-types-list button:focus-visible{outline:2px solid #93c5fd;outline-offset:3px}
.measurement-types small{color:#b9c7da;font-size:12px}
.sx.lt .measurement-types{color:#172033}
.sx.lt .measurement-types-list button{background:#f1f5f9;color:#334155;border-color:#94a3b8}
.sx.lt .measurement-types-list button.selected{background:#2563eb;color:#fff;border-color:#2563eb}
.sx.lt .measurement-types small{color:#475569}
@media(max-width:550px){.measurement-types-list{gap:6px}.measurement-types-list button{font-size:12px;padding:8px 11px}}
</style>
