export const LINE_TYPE_STATE_KEY = 'ndwc.line-oa.sensor-types.v1';
export const LINE_FREQUENCY_STATE_KEY = 'ndwc.line-oa.frequency.v1';
// Shared with the central DDPM monitoring-threshold setting screen.
export const WARNING_ALERT_STATE_KEY = 'ndwc.warning-ddpm.v1';
export const LINE_DEDUP_WINDOW_MS = 30 * 60 * 1000;

// LINE OA follows every measurement type available in Master Data (indices 0-8).
export const LINE_SENSOR_TYPES = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8]);

// 22 river basins defined for Thailand by the Royal Decree on River Basin
// Designation B.E. 2564.  This catalogue controls notification-frequency
// overrides; it deliberately does not imply that a station exists in every
// basin in the current data source.
export const THAI_RIVER_BASINS = Object.freeze([
  'ลุ่มน้ำสาละวิน',
  'ลุ่มน้ำโขงเหนือ',
  'ลุ่มน้ำโขงตะวันออกเฉียงเหนือ',
  'ลุ่มน้ำชี',
  'ลุ่มน้ำมูล',
  'ลุ่มน้ำปิง',
  'ลุ่มน้ำวัง',
  'ลุ่มน้ำยม',
  'ลุ่มน้ำน่าน',
  'ลุ่มน้ำเจ้าพระยา',
  'ลุ่มน้ำสะแกกรัง',
  'ลุ่มน้ำป่าสัก',
  'ลุ่มน้ำท่าจีน',
  'ลุ่มน้ำแม่กลอง',
  'ลุ่มน้ำบางปะกง',
  'ลุ่มน้ำโตนเลสาบ',
  'ลุ่มน้ำชายฝั่งทะเลตะวันออก',
  'ลุ่มน้ำเพชรบุรี-ประจวบคีรีขันธ์',
  'ลุ่มน้ำภาคใต้ฝั่งตะวันออกตอนบน',
  'ลุ่มน้ำทะเลสาบสงขลา',
  'ลุ่มน้ำภาคใต้ฝั่งตะวันออกตอนล่าง',
  'ลุ่มน้ำภาคใต้ฝั่งตะวันตก',
]);

export function defaultLineTypeState() {
  return Object.fromEntries(LINE_SENSOR_TYPES.map((type) => [type, true]));
}

export function loadLineTypeState(storage = globalThis.localStorage) {
  const defaults = defaultLineTypeState();
  try {
    const saved = JSON.parse(storage?.getItem(LINE_TYPE_STATE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    return Object.fromEntries(LINE_SENSOR_TYPES.map((type) => [type, saved[type] !== false]));
  } catch {
    return defaults;
  }
}

export function saveLineTypeState(state, storage = globalThis.localStorage) {
  const normalized = Object.fromEntries(LINE_SENSOR_TYPES.map((type) => [type, state?.[type] !== false]));
  storage?.setItem(LINE_TYPE_STATE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function loadWarningAlertState(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(WARNING_ALERT_STATE_KEY) || 'null');
    return saved && typeof saved === 'object' ? saved : { alertLevels: {} };
  } catch {
    return { alertLevels: {} };
  }
}

export function isProjectStation(reading) {
  return reading?.external !== true && reading?.isProject !== false;
}

export function warningAlertStateKey(reading) {
  if (reading?.alertKey) return reading.alertKey;
  const type = Number(reading?.type);
  if (type === 0) return `rainfall:${reading?.periodKey || reading?.period || '24h'}`;
  return `sensor:${type}`;
}

export function isWarningAlertEnabledForReading(state, reading) {
  // Central DDPM level switches deliberately do not change external-agency
  // evaluation. Their rules can retain their own criteria.
  if (!isProjectStation(reading)) return true;
  return state?.alertLevels?.[warningAlertStateKey(reading)]?.[reading?.levelId] !== false;
}

export function defaultLineFrequencyState() {
  return { scope: 'all', mode: 'interval', hours: 6, basins: {}, ruleId: '', rules: {} };
}

export function loadLineFrequencyState(storage = globalThis.localStorage) {
  const defaults = defaultLineFrequencyState();
  try {
    const saved = JSON.parse(storage?.getItem(LINE_FREQUENCY_STATE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    return {
      // `rule` is retained only to read an earlier local prototype setting.
      // New settings are a system default plus optional basin overrides.
      scope: saved.scope === 'rule' ? 'rule' : 'all',
      mode: saved.mode === 'on-update' ? 'on-update' : 'interval',
      hours: [1, 6, 12].includes(Number(saved.hours)) ? Number(saved.hours) : 6,
      basins: saved.basins && typeof saved.basins === 'object' ? saved.basins : {},
      ruleId: typeof saved.ruleId === 'string' ? saved.ruleId : '',
      rules: saved.rules && typeof saved.rules === 'object' ? saved.rules : {}
    };
  } catch { return defaults; }
}

export function saveLineFrequencyState(state, storage = globalThis.localStorage) {
  const normalized = loadLineFrequencyState({ getItem: () => JSON.stringify(state) });
  storage?.setItem(LINE_FREQUENCY_STATE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function frequencyForRule(settings, ruleId, fallbackMs = LINE_DEDUP_WINDOW_MS) {
  if (!settings) return { mode: 'interval', windowMs: fallbackMs };
  const chosen = settings.scope === 'rule' && settings.rules?.[ruleId] ? settings.rules[ruleId] : settings;
  if (chosen.mode === 'on-update') return { mode: 'on-update', windowMs: 0 };
  const hours = [1, 6, 12].includes(Number(chosen.hours)) ? Number(chosen.hours) : 6;
  return { mode: 'interval', windowMs: hours * 60 * 60 * 1000 };
}

export function frequencyForBasin(settings, basin, fallbackMs = LINE_DEDUP_WINDOW_MS) {
  if (!settings) return { mode: 'interval', windowMs: fallbackMs, source: 'default' };
  const candidate = basin && settings.basins?.[basin];
  const chosen = candidate && typeof candidate === 'object' ? candidate : settings;
  if (chosen.mode === 'on-update') return { mode: 'on-update', windowMs: 0, source: candidate ? 'basin' : 'default' };
  const hours = [1, 6, 12].includes(Number(chosen.hours)) ? Number(chosen.hours) : 6;
  return { mode: 'interval', windowMs: hours * 60 * 60 * 1000, source: candidate ? 'basin' : 'default' };
}

function readingLevelRank(reading) {
  for (const key of ['levelRank', 'levelIndex', 'levelOrder']) {
    if (Number.isFinite(Number(reading?.[key]))) return Number(reading[key]);
  }
  return 0;
}

export function eligibleRuleConditions(rule, enabledTypes) {
  if (!rule?.on) return {};
  return Object.fromEntries(Object.entries(rule.conditions || {})
    .filter(([type, levels]) => enabledTypes?.[type] !== false && LINE_SENSOR_TYPES.includes(Number(type)) && Array.isArray(levels) && levels.length)
    .map(([type, levels]) => [type, [...levels]]));
}

export function evaluateLineRule({ rule, enabledTypes, readings = [], dedup = {}, now = Date.now(), dedupWindowMs = LINE_DEDUP_WINDOW_MS, frequency, warningAlertState = loadWarningAlertState() }) {
  const conditions = eligibleRuleConditions(rule, enabledTypes);
  const selectedStations = new Set(rule?.sel || []);
  const alerts = [];
  const nextDedup = { ...dedup };
  for (const reading of readings) {
    const type = Number(reading.type);
    if (!selectedStations.has(reading.stationCode) || !conditions[type]?.includes(reading.levelId)) continue;
    if (!isWarningAlertEnabledForReading(warningAlertState, reading)) continue;
    const eventKey = reading.eventId || reading.levelId;
    const fingerprint = `${rule.id}|${type}|${reading.stationCode}|${eventKey}`;
    const stationKey = `${rule.id}|${type}|${reading.stationCode}|latest`;
    const previousEvent = Number(dedup[fingerprint] || 0);
    const previousStation = dedup[stationKey];
    const previousAt = typeof previousStation === 'object' ? Number(previousStation.sentAt || 0) : previousEvent;
    const previousRank = typeof previousStation === 'object' ? Number(previousStation.levelRank) : null;
    const levelRank = readingLevelRank(reading);
    // A lower (less severe) level never produces a repeat while the station is
    // still in alert. Equal or higher levels may repeat when their frequency is due.
    const frequencyPolicy = frequencyForBasin(frequency, reading.basin, dedupWindowMs);
    if (previousRank !== null && Number.isFinite(previousRank) && levelRank < previousRank) continue;
    if (previousAt && now - previousAt < frequencyPolicy.windowMs) continue;
    alerts.push({ ...reading, ruleId: rule.id, fingerprint });
    nextDedup[fingerprint] = now;
    nextDedup[stationKey] = { sentAt: now, levelRank };
  }

  return { alerts, dedup: nextDedup };
}
