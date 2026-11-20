<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { AUDIT_CENTRAL_CRITERIA_TARGET, AUDIT_CRITERIA_SETS, AUDIT_LOG_KEY, AUDIT_TARGETS, auditColumnsFor, auditDetailFieldsFor, loadAuditLog } from '../audit-log.js';

const props = defineProps({ theme: { type: String, default: 'dark' } });
const allowedRows = (records) => records.filter(row => AUDIT_TARGETS.includes(row.item));
const rows = ref(allowedRows(loadAuditLog()));
const query = ref('');
const item = ref('');
const criteriaSet = ref('');
const basin = ref('');
const action = ref('');
const date = ref('');
const selected = ref(null);

const items = computed(() => AUDIT_TARGETS);
const criteriaSets = computed(() => [...new Set([...AUDIT_CRITERIA_SETS, ...rows.value.map(row => row.criteriaSet).filter(Boolean)])]);
const showCriteriaSetFilter = computed(() => item.value === AUDIT_CENTRAL_CRITERIA_TARGET);
const featureColumns = computed(() => auditColumnsFor(item.value));
const basins = computed(() => [...new Set(rows.value.map(row => row.basin).filter(value => value && value !== '-'))]);
const filtered = computed(() => {
  const q = query.value.trim().toLocaleLowerCase('th-TH');
  return rows.value.filter(row =>
    (!q || [row.item, row.target, row.actor, row.basin, row.detail].join(' ').toLocaleLowerCase('th-TH').includes(q)) &&
    (!item.value || row.item === item.value) &&
    (!criteriaSet.value || row.criteriaSet === criteriaSet.value) &&
    (!basin.value || row.basin === basin.value) &&
    (!action.value || row.action === action.value) &&
    (!date.value || row.at.includes(date.value))
  );
});
function clear() { query.value = ''; item.value = ''; criteriaSet.value = ''; basin.value = ''; action.value = ''; date.value = ''; }
function stationOf(row) {
  return {
    code: row.station?.code || '—', location: row.station?.location || 'ไม่ระบุ (บันทึกเดิม)',
    frequency: row.station?.frequency || '—', owner: row.station?.owner || row.actor || '—',
    updatedAt: row.station?.updatedAt || row.at, status: row.station?.status || '—',
    visible: typeof row.station?.visible === 'boolean' ? row.station.visible : null,
  };
}
function auditValue(row, key) {
  if (key === 'station') return `${row.target}${stationOf(row).code === '—' ? '' : ` · ${stationOf(row).code}`}`;
  if (key === 'target') return row.target;
  if (key === 'basin') return row.basin;
  if (key === 'criteriaSet') return row.criteriaSet || '—';
  if (key === 'location' || key === 'frequency' || key === 'owner' || key === 'updatedAt' || key === 'status' || key === 'visible') {
    const station = stationOf(row);
    if (key === 'visible') return station.visible === null ? (row.fields?.visible || '—') : station.visible ? 'แสดง' : 'ซ่อน';
    return row.fields?.[key] || station[key] || '—';
  }
  return row.fields?.[key] || '—';
}
function detailFields(row) { return auditDetailFieldsFor(row.item).filter(([key]) => auditValue(row, key) !== '—'); }
function sync(event) { if (event.key === AUDIT_LOG_KEY) rows.value = allowedRows(loadAuditLog()); }
watch(item, (value) => { if (value !== AUDIT_CENTRAL_CRITERIA_TARGET) criteriaSet.value = ''; });
onMounted(() => window.addEventListener('storage', sync));
onBeforeUnmount(() => window.removeEventListener('storage', sync));
</script>

<template>
  <main class="audit-page" :class="theme === 'light' ? 'light' : ''">
    <nav class="audit-crumb" aria-label="breadcrumb">หน้าแรก <span>›</span> ประวัติการเพิ่ม ลบ แก้ไข</nav>
    <header class="audit-header"><div><h1>ประวัติการเพิ่ม ลบ แก้ไข</h1><p>บันทึกกิจกรรม CRUD และการตั้งค่าที่ส่งผลต่อการทำงานของระบบ</p></div><span class="audit-count">{{ rows.length }} รายการ</span></header>

    <section class="audit-card" aria-label="ตัวกรองประวัติการทำรายการ">
      <div class="audit-filters" :class="{ 'has-criteria-filter': showCriteriaSetFilter }">
        <label class="audit-search"><span>ค้นหา</span><input v-model="query" type="search" placeholder="ชื่อรายการ ชื่อเป้าหมาย ผู้ดำเนินการ"></label>
        <label><span>รายการ</span><select v-model="item"><option value="">ทั้งหมด</option><option v-for="value in items" :key="value" :value="value">{{ value }}</option></select></label>
        <label v-if="showCriteriaSetFilter"><span>ชุดเกณฑ์</span><select v-model="criteriaSet"><option value="">ทั้งหมด</option><option v-for="value in criteriaSets" :key="value" :value="value">{{ value }}</option></select></label>
        <label><span>ลุ่มแม่น้ำ</span><select v-model="basin"><option value="">ทั้งหมด</option><option v-for="value in basins" :key="value" :value="value">{{ value }}</option></select></label>
        <label><span>การดำเนินการ</span><select v-model="action"><option value="">ทั้งหมด</option><option>เพิ่ม</option><option>แก้ไข</option><option>ลบ</option></select></label>
        <label><span>วันที่</span><input v-model="date" type="search" placeholder="วว/ดด/ปปปป"></label>
        <button class="audit-clear" type="button" @click="clear">ล้างตัวกรอง</button>
      </div>

      <div class="audit-table-wrap">
        <table v-if="featureColumns.length" class="audit-table audit-feature-table" :class="{ 'audit-station-table': item === 'รายการสถานี Sensor' }">
          <thead><tr><th>ลำดับ</th><th v-for="column in featureColumns" :key="column[0]">{{ column[1] }}</th><th>การดำเนินการ</th><th>วันที่ดำเนินการ</th><th>เจ้าหน้าที่</th><th>ดูรายละเอียด</th></tr></thead>
          <tbody>
            <tr v-for="(row, index) in filtered" :key="row.id">
              <td>{{ index + 1 }}</td><td v-for="column in featureColumns" :key="column[0]"><strong v-if="column[0] === 'station' || column[0] === 'target'">{{ auditValue(row, column[0]) }}</strong><span v-else>{{ auditValue(row, column[0]) }}</span></td><td><span class="audit-action" :class="'action-' + row.action">{{ row.action }}</span><small class="audit-subitem">{{ row.detail }}</small></td><td>{{ row.at }}</td><td>{{ row.actor }}</td><td><button class="audit-view" type="button" :aria-label="'ดูรายละเอียด ' + row.target" @click="selected = row">ดู</button></td>
            </tr>
            <tr v-if="!filtered.length"><td :colspan="featureColumns.length + 5" class="audit-empty">ไม่พบประวัติที่ตรงกับเงื่อนไข</td></tr>
          </tbody>
        </table>
        <table v-else class="audit-table">
          <thead><tr><th>ลำดับ</th><th>รายการ</th><th>การดำเนินการ</th><th>ชื่อสถานี/ชื่อประวัติ</th><th>ลุ่มแม่น้ำ</th><th>วันที่ดำเนินการ</th><th>เจ้าหน้าที่ดำเนินการ</th><th>ดูรายละเอียด</th></tr></thead>
          <tbody>
            <tr v-for="(row, index) in filtered" :key="row.id">
              <td>{{ index + 1 }}</td><td><strong>{{ row.item }}</strong><small v-if="row.criteriaSet" class="audit-subitem">{{ row.criteriaSet }}</small></td><td><span class="audit-action" :class="'action-' + row.action">{{ row.action }}</span></td><td><strong>{{ row.target }}</strong></td><td>{{ row.basin }}</td><td>{{ row.at }}</td><td>{{ row.actor }}</td><td><button class="audit-view" type="button" :aria-label="'ดูรายละเอียด ' + row.target" @click="selected = row">ดู</button></td>
            </tr>
            <tr v-if="!filtered.length"><td colspan="8" class="audit-empty">ไม่พบประวัติที่ตรงกับเงื่อนไข</td></tr>
          </tbody>
        </table>
      </div>
      <footer class="audit-footer">แสดง {{ filtered.length }} จาก {{ rows.length }} รายการ</footer>
    </section>

    <div v-if="selected" class="audit-overlay" @click.self="selected = null"><section class="audit-modal" role="dialog" aria-modal="true" aria-labelledby="auditDetailTitle"><header><h2 id="auditDetailTitle">รายละเอียดการดำเนินการ</h2><button type="button" aria-label="ปิด" @click="selected = null">×</button></header><dl><div><dt>รายการ</dt><dd>{{ selected.item }}</dd></div><div class="audit-detail-heading"><dt>ฟิลด์จากหน้าแก้ไข</dt><dd>ข้อมูล ณ เวลาที่บันทึก</dd></div><div v-for="column in detailFields(selected)" :key="column[0]"><dt>{{ column[1] }}</dt><dd>{{ auditValue(selected, column[0]) }}</dd></div><div><dt>การดำเนินการ</dt><dd>{{ selected.action }}</dd></div><div><dt>รายละเอียด</dt><dd>{{ selected.detail }}</dd></div><div><dt>ผู้ดำเนินการ</dt><dd>{{ selected.actor }} · {{ selected.at }}</dd></div></dl><footer><button type="button" @click="selected = null">ปิด</button></footer></section></div>
  </main>
</template>

<style scoped>
.audit-page{height:100%;overflow:auto;padding:28px;background:#111318;color:#edf3ff;font:14px/1.5 Sarabun,'Leelawadee UI',sans-serif}.audit-page.light{background:#f5f7fb;color:#172033}.audit-crumb{font-size:13px;color:#9db2cf}.audit-crumb span{margin:0 6px;color:#71809a}.audit-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:6px 0 22px}.audit-header h1{margin:0;font-size:24px;line-height:1.3}.audit-header p{margin:5px 0 0;color:#9db2cf}.audit-count{padding:5px 10px;border-radius:99px;background:#1f3b70;color:#b8d5ff;font-size:12px;white-space:nowrap}.audit-card{border:1px solid #303846;border-radius:12px;background:#191d24;overflow:hidden}.light .audit-card{background:#fff;border-color:#d8e0ec}.audit-filters{display:grid;grid-template-columns:minmax(230px,1.5fr) repeat(4,minmax(135px,1fr)) auto;gap:12px;padding:18px;border-bottom:1px solid #303846}.audit-filters.has-criteria-filter{grid-template-columns:minmax(230px,1.5fr) repeat(5,minmax(135px,1fr)) auto}.light .audit-filters{border-color:#d8e0ec}.audit-filters label{display:grid;gap:5px;min-width:0;color:#a8b8d1;font-size:12px}.audit-filters input,.audit-filters select{width:100%;box-sizing:border-box;min-height:38px;border:1px solid #47536a;border-radius:7px;background:#232a35;color:inherit;padding:8px 10px;font:14px inherit}.light .audit-filters input,.light .audit-filters select{background:#fff;border-color:#cbd5e1}.audit-clear{align-self:end;min-height:38px;border:1px solid #4d5e78;border-radius:7px;background:transparent;color:#bfd7ff;padding:8px 12px;font:inherit;cursor:pointer}.audit-table-wrap{overflow:auto}.audit-table{width:100%;min-width:1050px;border-collapse:collapse}.audit-station-table{min-width:1580px}.audit-table th{padding:12px 14px;background:#202938;color:#dbeafe;text-align:left;white-space:nowrap;font-size:13px}.audit-table td{padding:13px 14px;border-bottom:1px solid #2b3341;color:#c8d2e3;vertical-align:middle}.audit-table td strong{display:block}.audit-subitem{display:block;margin-top:3px;color:#8db6f2;font-size:12px;line-height:1.35}.audit-status{font-size:12px;font-weight:600}.audit-status.is-online{color:#5ee6a8}.audit-status.is-offline{color:#ff8b99}.light .audit-table th{background:#e9eef6;color:#172033}.light .audit-table td{border-color:#e5eaf2;color:#334155}.light .audit-subitem{color:#315f9c}.audit-table tbody tr:hover{background:#202735}.light .audit-table tbody tr:hover{background:#f7faff}.audit-action{font-weight:600}.action-เพิ่ม{color:#5ee6a8}.action-แก้ไข{color:#7db5ff}.action-ลบ{color:#ff8b99}.audit-view{border:1px solid #4c79c9;border-radius:6px;background:#173364;color:#cfe3ff;padding:5px 10px;font:inherit;cursor:pointer}.audit-empty{text-align:center;padding:32px!important;color:#9db2cf}.audit-footer{padding:12px 16px;color:#9db2cf;font-size:12px}.audit-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:#000a}.audit-modal{width:min(580px,100%);max-height:calc(100dvh - 40px);display:flex;flex-direction:column;border:1px solid #424d60;border-radius:12px;background:#1b2029;color:#edf3ff;box-shadow:0 24px 70px #0008;overflow:hidden}.audit-modal header,.audit-modal footer{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid #343d4d}.audit-modal footer{justify-content:flex-end;border-top:1px solid #343d4d;border-bottom:0}.audit-modal h2{font-size:18px;margin:0}.audit-modal button{border:1px solid #4d5e78;border-radius:7px;background:#2c3544;color:#fff;padding:7px 12px;font:inherit;cursor:pointer}.audit-modal header button{border:0;background:transparent;font-size:24px;padding:0 5px}.audit-modal dl{display:grid;gap:0;margin:0;padding:8px 18px;overflow:auto}.audit-modal dl div{display:grid;grid-template-columns:150px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid #303846}.audit-modal .audit-detail-heading{margin:6px -4px 0;padding:10px 12px;background:#172d55;border:1px solid #315d9d;border-radius:7px;color:#dbeafe}.audit-detail-heading dt{color:#bfdbfe;font-weight:600}.audit-modal dt{color:#9db2cf}.audit-modal dd{margin:0;word-break:break-word}@media(max-width:900px){.audit-page{padding:18px}.audit-filters,.audit-filters.has-criteria-filter{grid-template-columns:repeat(2,minmax(0,1fr))}.audit-search{grid-column:span 2}.audit-clear{justify-self:start}}@media(max-width:520px){.audit-page{padding:14px;padding-top:70px}.audit-header{display:block}.audit-count{display:inline-block;margin-top:12px}.audit-filters,.audit-filters.has-criteria-filter{grid-template-columns:1fr}.audit-search{grid-column:auto}.audit-modal dl div{grid-template-columns:1fr;gap:2px}}
</style>
