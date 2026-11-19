import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../public/master-data.html', import.meta.url), 'utf8');

test('central criteria edits require an explicit confirmation before persistence', () => {
  assert.match(source, /id="centralConfirmOverlay"/);
  assert.match(source, /ยืนยันการแก้ไขเกณฑ์การเฝ้าระวังภัย \(ปภ\.\)/);
  assert.match(source, /ทุกสถานีที่ใช้เกณฑ์ Default/);
  assert.match(source, /สถานีที่กำหนดเกณฑ์เฉพาะสถานี \(Custom\) จะไม่ถูกแก้ไข/);
  assert.match(source, /function saveInline\(\)[\s\S]*?pendingCentralEdit=\{/);
  assert.match(source, /function confirmCentralEdit\(\)\{[\s\S]*?if\(!persist\(\)\)return/);
  assert.match(source, /function cancelCentralConfirm\(\)[\s\S]*?cuts\.splice/);
  assert.match(source, /const isWarningCriteria=active===0&&rainCategory==='warning'/);
  assert.match(source, /centralConfirmImpact'\)\.hidden=!isWarningCriteria/);
  assert.match(source, /ยืนยันการแก้ไขเกณฑ์มาตรฐานอ้างอิง/);
  assert.match(source, /id="centralConfirmType"/);
  assert.match(source, /การเปลี่ยนแปลงนี้มีผลเฉพาะข้อความ Legend และสีที่ใช้แสดงผล โดยไม่เปลี่ยนแปลงค่าขอบช่วงของเกณฑ์มาตรฐานอ้างอิง/);
  assert.match(source, /ตรวจสอบชื่อ สี และค่าขอบช่วงก่อนยืนยัน ระบบจะบันทึกการตั้งค่าเกณฑ์กลางในเบราว์เซอร์นี้/);
});

test('central warning table keeps compact columns and uses the deletion confirmation', () => {
  assert.match(source, /central-warning-container\{max-width:none;width:100%\}/);
  assert.match(source, /<th>ช่วงค่า<\/th>/);
  assert.match(source, /<th class="warning-alert-cell">การแจ้งเตือน<\/th>/);
  assert.match(source, /role="switch"/);
  assert.match(source, /function requestWarningAlertToggle\(levelId\)/);
  assert.match(source, /warningSettings\.alertLevels/);
  assert.match(source, /id="warningAlertConfirmOverlay"/);
  assert.match(source, /ยืนยันการปิดการแจ้งเตือน/);
  assert.match(source, /การปิดการแจ้งเตือนจะทำให้ระบบไม่ใช้ระดับเกณฑ์นี้ในการประเมิน Trigger Alert สำหรับสถานีในโครงการ/);
  assert.match(source, /function confirmWarningAlertOff\(\)[\s\S]*?saveWarningAlert\(pending\.levelId,false\)/);
  assert.match(source, /function requestWarningAlertToggle\(levelId\)[\s\S]*?saveWarningAlert\(levelId,true\)/);
  assert.match(source, /สถานีตรวจวัดในโครงการ ไม่กระทบค่าตรวจวัด สีตามเกณฑ์ หรือสถานีหน่วยงานอื่น/);
  assert.match(source, /class="action-button icon-only delete"[\s\S]*?onclick="openDelete/);
  assert.match(source, />ยืนยันการลบ<\/button>/);
  assert.match(source, /function confirmDelete\(\)\{\s*if\(!deletingId\)return/);
});
