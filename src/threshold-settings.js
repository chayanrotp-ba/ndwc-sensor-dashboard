import { reactive } from 'vue';
import { RAIN_CRITERIA, rainfallResult } from './rain-criteria.js';
export const SETTINGS_KEY = 'ndwc.station-thresholds.v2';
export const defaultRain = () => Object.fromEntries(Object.entries(RAIN_CRITERIA).map(([key, value]) => [key, [...value.cuts]]));
let saved;
try { saved = JSON.parse(globalThis.localStorage?.getItem(SETTINGS_KEY) || 'null'); } catch { /* Use demo defaults if storage is unavailable. */ }
export const thresholdSettings = reactive({ types: saved?.types || { rain: defaultRain() }, stations: saved?.stations || {} });
// Seed one visible prototype example once; returning it to Default stays respected.
thresholdSettings.customDemoSeeded = true;
if (!saved?.customDemoSeeded) {
  if (!thresholdSettings.stations['G15006-5501']?.rain) {
    const demo = defaultRain();
    demo['24h'] = [1,15,50,300];
    demo.today = [...demo['24h']]; demo.yesterday = [...demo['24h']];
    thresholdSettings.stations['G15006-5501'] = { rain:demo };
  }
  try { globalThis.localStorage?.setItem(SETTINGS_KEY,JSON.stringify(thresholdSettings)); } catch { /* Keep the example usable in memory. */ }
}
// Upgrade prior demo data to the linked daily windows and lower hourly bounds.
for (const values of [thresholdSettings.types.rain, ...Object.values(thresholdSettings.stations).map(s=>s.rain)]) {
  if (!values?.['24h']) continue;
  values.today=[...values['24h']]; values.yesterday=[...values['24h']];
  if(values['1h']?.some((v,i)=>v>=values['24h'][i])) values['1h']=values['24h'].map(v=>Math.round(v*0.4*10000)/10000);
}
export function validCuts(cuts) {
  return Array.isArray(cuts) && cuts.length === 4 && cuts.every((v, i) => typeof v === 'number' && Number.isFinite(v) && v > 0 && (!i || v > cuts[i - 1]));
}
export const thresholdRange = range => ['today','yesterday'].includes(range) ? '24h' : range;
export function hasCustomThreshold(code, range) {
  const values = thresholdSettings.stations[code]?.rain;
  return range ? validCuts(values?.[thresholdRange(range)]) : !!values && Object.values(values).some(validCuts);
}
export function thresholdComparisons(code, range, value, offline) {
  const result = [{ key:'central', name:'เกณฑ์กลาง (Default ระบบ)', scope:'ค่าเริ่มต้นของระบบ', icon:'▥', result:effectiveRainfall('',range,value,offline) }];
  if (hasCustomThreshold(code,range)) result.push({key:'station',name:'เกณฑ์กำหนดเองรายสถานี',scope:code+' · กำหนดเกณฑ์เอง',icon:'⌖',result:effectiveRainfall(code,range,value,offline)});
  return result;
}
export function effectiveThreshold(code, range) {
  range = thresholdRange(range);
  const own = thresholdSettings.stations[code]?.rain?.[range];
  const common = thresholdSettings.types.rain?.[range];
  return { cuts: validCuts(own) ? own : validCuts(common) ? common : RAIN_CRITERIA[range]?.cuts,
    source: validCuts(own) ? 'เกณฑ์รายสถานี' : 'เกณฑ์กลาง (Default ระบบ)' };
}
export function effectiveRainfall(code, range, value, offline) {
  return rainfallResult(range, value, offline, effectiveThreshold(code, range).cuts);
}
export function saveThresholds(scope, code, values) {
  if (!Object.keys(RAIN_CRITERIA).every(key => validCuts(values[key]))) throw new Error('กรุณากำหนดค่าจุดแบ่งครบและเรียงจากน้อยไปมาก');
  if (values['1h'].some((v,i)=>v >= values['24h'][i])) throw new Error('เกณฑ์ฝน 1 ชั่วโมงต้องต่ำกว่าฝน 24 ชั่วโมงทุกระดับ');
  values = {...values,today:[...values['24h']],yesterday:[...values['24h']]};
  const next = JSON.parse(JSON.stringify(thresholdSettings));
  if (scope === 'station') next.stations[code] = { ...next.stations[code], rain: values };
  else next.types.rain = values;
  globalThis.localStorage?.setItem(SETTINGS_KEY, JSON.stringify(next));
  Object.assign(thresholdSettings, next);
}
export function inheritThresholds(code) {
  const next = JSON.parse(JSON.stringify(thresholdSettings));
  if (next.stations[code]) { delete next.stations[code].rain; if (!Object.keys(next.stations[code]).length) delete next.stations[code]; }
  globalThis.localStorage?.setItem(SETTINGS_KEY, JSON.stringify(next));
  Object.assign(thresholdSettings, next);
}
