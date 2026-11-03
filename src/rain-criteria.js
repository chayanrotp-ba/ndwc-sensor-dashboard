// Exact default five-level rainfall intensity cuts from the supplied v56.
// Prototype reference only: these are not operational notification thresholds.
export const RAIN_CRITERIA = Object.freeze({
  '1h': { label: '1 ชั่วโมง', cuts: [0.5, 5, 25, 50] },
  '24h': { label: '24 ชั่วโมง', cuts: [0.5, 10, 35, 90] },
  '72h': { label: '3 วัน (72 ชม.)', cuts: [50, 100, 150, 200], draft: true },
});
export const RAIN_LEVELS = ['ฝนละออง', 'ฝนเล็กน้อย', 'ฝนปานกลาง', 'ฝนหนัก', 'ฝนหนักมาก'];
export const RAIN_COLORS = ['#9dd9ef', '#90c881', '#f0d447', '#f99c38', '#ff3656'];
export const STATION_MOCK_CUTS = {
  '1h': [0.5, 8, 30, 60],
  '24h': [1, 15, 50, 120],
  '72h': [60, 120, 180, 250],
};
export function rainfallResult(range, value, offline = false, scope = 'central') {
  const reference = RAIN_CRITERIA[range];
  const criterion = reference && (scope === 'station' ? { ...reference, cuts: STATION_MOCK_CUTS[range], mockOverride: true } : scope === 'area' ? { ...reference, cuts: reference.cuts.map(cut => Math.round(cut * 0.8 * 100) / 100), mockOverride: true } : reference);
  if (!criterion) return { available: false, label: 'ไม่มีเกณฑ์ช่วงนี้ใน v56', bands: [] };
  const bands = RAIN_LEVELS.map((label, i) => ({ label, color: RAIN_COLORS[i], range: i === 4 ? `>${criterion.cuts[3]}` : `${i ? '>' + criterion.cuts[i - 1] : '>0'}–${criterion.cuts[i]}` }));
  if (offline || value == null || !Number.isFinite(value) || value < 0) return { available: false, label: offline ? 'ออฟไลน์ · ประเมินไม่ได้' : 'ไม่มีข้อมูลพร้อมประเมิน', bands, criterion };
  if (value === 0) return { available: true, label: 'ไม่มีฝน', color: '#94a3b8', position: 0, bands, criterion };
  let index = criterion.cuts.findIndex(cut => value <= cut);
  if (index < 0) index = 4;
  const low = index ? criterion.cuts[index - 1] : 0;
  const high = index === 4 ? low * 2 : criterion.cuts[index];
  return { available: true, label: RAIN_LEVELS[index], color: RAIN_COLORS[index],
    position: Math.min(98, index * 20 + Math.min(1, (value - low) / (high - low)) * 20), bands, criterion };
}
