// Demonstration data for the proposed 70-device project. Coordinates and
// telemetry are illustrative; replace this source with the device registry.
const provinceGroups = [
  ['เชียงใหม่', 98.9853, 18.7883, ['เมืองเชียงใหม่', 'เชียงดาว']],
  ['เชียงราย', 99.8325, 19.9105, ['เมืองเชียงราย', 'แม่สาย']],
  ['น่าน', 100.7713, 18.7838, ['เมืองน่าน', 'บ่อเกลือ']],
  ['แพร่', 100.1410, 18.1446, ['เมืองแพร่', 'ร้องกวาง']],
  ['ตาก', 99.1258, 16.8840, ['เมืองตาก', 'แม่สอด']],
  ['พิษณุโลก', 100.2637, 16.8211, ['เมืองพิษณุโลก', 'นครไทย']],
  ['ขอนแก่น', 102.8350, 16.4419, ['เมืองขอนแก่น', 'น้ำพอง']],
  ['นครราชสีมา', 102.1005, 14.9799, ['เมืองนครราชสีมา', 'ปากช่อง']],
  ['อุบลราชธานี', 104.8565, 15.2448, ['เมืองอุบลราชธานี', 'วารินชำราบ']],
  ['พระนครศรีอยุธยา', 100.5689, 14.3532, ['พระนครศรีอยุธยา', 'บางบาล']],
  ['จันทบุรี', 102.1115, 12.6113, ['เมืองจันทบุรี', 'ขลุง']],
  ['สุราษฎร์ธานี', 99.3331, 9.1401, ['เมืองสุราษฎร์ธานี', 'พุนพิน']],
  ['ภูเก็ต', 98.3923, 7.8804, ['เมืองภูเก็ต', 'ถลาง']],
  ['สงขลา', 100.5954, 7.1898, ['เมืองสงขลา', 'หาดใหญ่']],
];

export const DEVICE_STATUS = Object.freeze({
  offline: { label: 'ขาดข้อมูล', color: '#ef4444', rank: 0 },
  delayed: { label: 'ส่งข้อมูลล่าช้า', color: '#fbbf24', rank: 1 },
  maintenance: { label: 'อยู่ระหว่างซ่อม', color: '#a78bfa', rank: 2 },
  unknown: { label: 'ยังไม่ทราบสถานะ', color: '#94a3b8', rank: 3 },
  online: { label: 'ส่งข้อมูลปกติ', color: '#4ade80', rank: 4 },
});

export function makeDemoSensors(now = Date.now()) {
  const offsets = [[-.42,.26], [.38,.28], [-.31,-.27], [.33,-.25], [0,0]];
  return provinceGroups.flatMap(([province, lon, lat, districts], group) => offsets.map(([dx, dy], index) => {
    const number = group * 5 + index + 1;
    const status = number % 19 === 0 ? 'maintenance' : number % 17 === 0 ? 'unknown' : number % 11 === 0 ? 'offline' : number % 7 === 0 ? 'delayed' : 'online';
    const ageMinutes = status === 'offline' ? 70 + index * 13 : status === 'delayed' ? 18 + index * 2 : status === 'online' ? 2 + index : null;
    return {
      code: `DEMO-SEN-${String(number).padStart(3, '0')}`,
      name: `จุดตรวจวัดตัวอย่าง ${province} ${String(index + 1).padStart(2, '0')}`,
      province, district: districts[index % 2], agency: `ทีมดูแลตัวอย่าง ${['ก', 'ข', 'ค'][number % 3]}`,
      type: ['ปริมาณน้ำฝน', 'ระดับน้ำ', 'สภาพอากาศ'][number % 3],
      lon: lon + dx, lat: lat + dy, status, expectedMinutes: 10,
      lastReceived: ageMinutes === null ? null : new Date(now - ageMinutes * 60_000).toISOString(),
      gapMinutes: ageMinutes,
      latestValue: status === 'unknown' ? 'ไม่มีข้อมูล' : ['24.0 มม.', '1.42 ม.', '31.5 °C'][number % 3],
      gapEvents24h: status === 'offline' ? 3 : status === 'delayed' ? 1 : 0,
    };
  }));
}

export function filterDemoSensors(stations, filters) {
  const query = (filters.query || '').trim().toLocaleLowerCase('th');
  return stations.filter(station =>
    (!filters.province || station.province === filters.province) &&
    (!filters.district || station.district === filters.district) &&
    (!filters.agency || station.agency === filters.agency) &&
    (!filters.type || station.type === filters.type) &&
    (!filters.status || station.status === filters.status) &&
    (!query || [station.code, station.name, station.province, station.district].some(value => value.toLocaleLowerCase('th').includes(query)))
  ).sort((a, b) => DEVICE_STATUS[a.status].rank - DEVICE_STATUS[b.status].rank || (b.gapMinutes ?? -1) - (a.gapMinutes ?? -1) || a.code.localeCompare(b.code));
}
