<script setup>
import {ref,computed} from 'vue';
import {measurements,measurementUnits,measurementLevels,activeMeasurement,hasMeasurementCustom,saveMeasurement} from '../warning-criteria.js';

const props=defineProps({type:Number,code:String,canManage:{type:Boolean,default:true}});
const emit=defineEmits(['dirty']);
const levels=ref([]);
const cuts=ref([]);
const message=ref('');
const error=ref('');
const editing=ref(false);
const confirming=ref(false);
const custom=computed(()=>hasMeasurementCustom(props.type,props.code));
const unit=computed(()=>measurementUnits[props.type]);
const valid=computed(()=>cuts.value.length===levels.value.length-1 && cuts.value.every((value,index)=>
  typeof value==='number' && Number.isFinite(value) && (props.type===1 || value>0) &&
  (!index || value>cuts.value[index-1]) && (props.type!==2 || value<100) && (props.type!==4 || value<360)));

function load() {
  try {
    levels.value=measurementLevels(props.type);
    cuts.value=activeMeasurement(props.type,props.code,levels.value);
    error.value='';
  } catch (failure) {
    error.value=failure.message;
  }
}
load();

function finish() {
  load();
  editing.value=false;
  confirming.value=false;
  emit('dirty',false);
}

function store(reset=false) {
  if (!props.canManage || (!reset && !valid.value)) return;
  try {
    saveMeasurement(props.type,props.code,reset?null:cuts.value,levels.value,props.canManage);
    finish();
    message.value=reset?'กลับไปใช้เกณฑ์กลางแล้ว':'บันทึกเกณฑ์'+measurements[props.type]+'แล้ว';
  } catch (failure) {
    message.value=failure.message;
  }
}
</script>

<template>
<div class="measurement-rules">
  <div class="ste-source-note">
    <strong>Warning DDPM Criteria — {{custom?'Custom':'Default'}}</strong>
    <p>{{measurements[type]}} · {{props.code?'เฉพาะสถานี '+props.code:'เกณฑ์กลางของทั้งระบบ'}}</p>
    <small>ตัวเลขสาธิตสำหรับทดสอบการตั้งค่า</small>
  </div>
  <section class="ste-levels">
    <div class="ste-section-title"><h3>{{measurements[type]}} · {{unit}}</h3><span class="ste-badge">{{editing?'ฉบับแก้ไข':custom?'Custom':'Default'}}</span></div>
    <p v-if="error" class="ste-error" role="alert">{{error}} <button @click="load">ลองใหม่</button></p>
    <template v-else>
      <div class="ste-band-grid">
        <label v-for="(level,index) in levels" :key="level.id||index" :style="{'--level-color':level.color}">
          <b>{{level.name}}</b>
          <span v-if="index">{{props.type===4?'ตั้งแต่ ':'มากกว่า '}}{{cuts[index-1]}} {{unit}}</span>
          <span v-else>{{props.type===1||props.type===5?'ช่วงค่าต่ำสุด':'ตั้งแต่ 0 '+unit}}</span>
          <template v-if="index<levels.length-1">
            <span>{{props.type===4?'น้อยกว่า':'ถึง'}} ({{unit}})</span>
            <input v-if="editing" v-model.number="cuts[index]" type="number" step="any"
              :aria-label="measurements[type]+' ขอบบนระดับ '+(index+1)"
              @input="emit('dirty',true);message=''">
            <strong v-else>{{cuts[index]}}</strong>
          </template>
          <strong v-else-if="type===4">ถึง 360°</strong>
          <strong v-else-if="type===2">ถึง 100%</strong>
        </label>
      </div>
      <p v-if="type===4" class="ste-hint">แบ่งช่วงองศาต่อเนื่องตั้งแต่ 0 ถึง 360 · ค่า 360 เทียบเท่า 0 องศา</p>
      <p v-else class="ste-hint">รวมขอบบนในระดับนั้น · ระดับถัดไปเริ่มมากกว่าขอบเดิม</p>
      <div v-if="canManage" class="ste-periods measure-actions">
        <template v-if="confirming">
          <span>กลับไปใช้เกณฑ์กลางเฉพาะ{{measurements[type]}}ของสถานีนี้?</span>
          <button @click="store(true)">ยืนยัน</button><button @click="confirming=false">ยกเลิก</button>
        </template>
        <template v-else-if="editing">
          <button :disabled="!valid" @click="store()">บันทึก</button>
          <button @click="finish">ยกเลิก</button>
          <span v-if="!valid" role="alert">กรอกขอบช่วงให้ครบ เรียงจากน้อยไปมาก และอยู่ในขอบเขตของประเภท</span>
        </template>
        <template v-else>
          <button @click="editing=true">{{code?'กำหนด Custom เฉพาะสถานี':'แก้ไขเกณฑ์กลาง'}}</button>
          <button v-if="custom" @click="confirming=true">Reset to Default</button>
        </template>
      </div>
    </template>
    <p role="status">{{message}}</p>
  </section>
</div>
</template>

<style>
.measurement-rules{display:grid;gap:16px}
.measure-actions{margin-top:16px}
.ste-band-grid input{color-scheme:dark;background:#272c35;color:#f1f5f9;border:1px solid #6b778c}
.sx.lt .ste-band-grid input{color-scheme:light;background:#f1f5f9;color:#172033;border-color:#94a3b8}
</style>
