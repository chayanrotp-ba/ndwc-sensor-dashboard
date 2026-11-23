// Status and telemetry are mock data; map locations follow the supplied 70-station list.
import { sensorLocations } from './sensor-device-locations.js';

export const DEVICE_STATUS = Object.freeze({
  normal: { label: 'ปกติ', color: '#7fc63d', rank: 3 },
  offline: { label: 'ออฟไลน์', color: '#737373', rank: 0 },
  abnormal: { label: 'ผิดปกติ', color: '#f59e0b', rank: 2 },
  frequent: { label: 'มีความผิดปกติบ่อย', color: '#f97316', rank: 1 },
});

export const SENSOR_TYPES = Object.freeze([
  { name: 'ปริมาณฝนสะสม', value: '24.0 มม.' },
  { name: 'อุณหภูมิอากาศ', value: '31.5 °C' },
  { name: 'ความชื้นสัมพัทธ์', value: '68 %' },
  { name: 'ความเร็วลม', value: '2.4 ม./วินาที' },
  { name: 'ทิศทางลม', value: 'ตะวันออกเฉียงเหนือ' },
  { name: 'ความกดอากาศ', value: '1,008 hPa' },
  { name: 'ก๊าซคาร์บอนไดออกไซด์', value: '420 ppm' },
  { name: 'ฝุ่นละออง PM2.5', value: '18 µg/m³' },
  { name: 'ฝุ่นละออง PM10', value: '32 µg/m³' },
]);

export function makeDemoSensors(now = Date.now()) {
  return sensorLocations.map((location, index) => {
    const number = index + 1;
    const condition = number % 19 === 0 ? 'maintenance' : number % 17 === 0 ? 'missing' : number % 11 === 0 ? 'offline' : number % 7 === 0 ? 'delayed' : 'online';
    const gapEvents7d = condition === 'offline' ? 6 + index : condition === 'delayed' && number % 3 === 0 ? 5 + index % 3 : condition === 'delayed' || condition === 'missing' ? 1 + number % 4 : 0;
    const status = condition === 'offline' ? 'offline' : gapEvents7d >= 5 ? 'frequent' : condition === 'online' ? 'normal' : 'abnormal';
    const ageMinutes = condition === 'offline' ? 70 + index * 13 : condition === 'delayed' ? 18 + index * 2 : condition === 'online' ? 2 + index : null;
    return {
      code: `DEMO-SEN-${String(number).padStart(3, '0')}`,
      name: `จุดตรวจวัดตัวอย่าง ต.${location.tambon}`,
      province: location.province, district: location.district, subdistrict: location.tambon,
      agency: 'กรมป้องกันและบรรเทาสาธารณภัย',
      coordinator: 'ผู้ประสานงานโครงการ (ข้อมูลตัวอย่าง)', contactPhone: '08X-XXX-XXXX',
      lon: location.lon, lat: location.lat, coordinateSource: location.coordinateSource, status,
      lastReceived: ageMinutes === null ? null : new Date(now - ageMinutes * 60_000).toISOString(),
      gapMinutes: ageMinutes,
      measurements: SENSOR_TYPES.map(item => ({ type: item.name, value: condition === 'missing' ? 'ไม่มีข้อมูล' : item.value })),
      gapEvents24h: condition === 'offline' ? 3 : condition === 'delayed' ? 1 : 0,
      gapEvents7d,
    };
  });
}

export function filterDemoSensors(stations, filters) {
  const query = (filters.query || '').trim().toLocaleLowerCase('th');
  return stations.filter(station =>
    (!filters.province || station.province === filters.province) &&
    (!filters.district || station.district === filters.district) &&
    (!filters.tambon || station.subdistrict === filters.tambon) &&
    (!filters.agency || station.agency === filters.agency) &&
    (!filters.type || station.measurements?.some(measurement => measurement.type === filters.type)) &&
    (!filters.status || station.status === filters.status) &&
    (!query || [station.code, station.name, station.province, station.district, station.subdistrict].some(value => value.toLocaleLowerCase('th').includes(query)))
  ).sort((a, b) => DEVICE_STATUS[a.status].rank - DEVICE_STATUS[b.status].rank || (b.gapMinutes ?? -1) - (a.gapMinutes ?? -1) || a.code.localeCompare(b.code));
}
