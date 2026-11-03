import { DCLogic, createElement } from '../runtime.js';

export default class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { theme: 'dark' };
  }

  static icon(k) {
    const E = createElement;
    const P = {
      rain: [['path', { d: 'M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2' }], ['path', { d: 'M16 14v6' }], ['path', { d: 'M8 14v6' }], ['path', { d: 'M12 16v6' }]],
      temp: [['path', { d: 'M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z' }]],
      hum: [['path', { d: 'M7 16.3c2.2 0 4-1.8 4-4.1 0-1.2-.6-2.3-1.8-3.3S7.3 6.6 7 5.3c-.3 1.3-1 2.6-2.2 3.6S3 11 3 12.2c0 2.3 1.8 4.1 4 4.1Z' }], ['path', { d: 'M12.6 6.6A11 11 0 0 0 14 3.5c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.9 4.9' }]],
      wind: [['path', { d: 'M12.8 19.6A2 2 0 1 0 14 16H2' }], ['path', { d: 'M17.5 8a2.5 2.5 0 1 1 2 4H2' }], ['path', { d: 'M9.8 4.4A2 2 0 1 1 11 8H2' }]],
      dir: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'm16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z' }]],
      pres: [['path', { d: 'M12 2a10 10 0 1 0 10 10' }], ['path', { d: 'M12 6v6l4 2' }], ['path', { d: 'M17 2.5a10 10 0 0 1 4.5 4.5' }]],
      co2: [['path', { d: 'M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2' }], ['path', { d: 'M8 19v1' }], ['path', { d: 'M8 14v1' }], ['path', { d: 'M16 19v1' }], ['path', { d: 'M16 14v1' }], ['path', { d: 'M12 21v1' }], ['path', { d: 'M12 16v1' }]],
      pm: [['path', { d: 'M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2' }], ['path', { d: 'M16 17H7' }], ['path', { d: 'M17 21H9' }]]
    }[k] || [];
    return E('svg', { className: 'rc-i', viewBox: '0 0 24 24', width: 24, height: 24, 'aria-hidden': 'true' }, P.map((p, i) => E(p[0], Object.assign({ key: i }, p[1]))));
  }

  static sample() {
    return [
      { key: 'rain', label: 'ปริมาณน้ำฝน', value: '339.5', unit: 'mm', status: 'bad' },
      { key: 'temp', label: 'อุณหภูมิอากาศ', value: '27', unit: '°C', status: 'ok' },
      { key: 'hum', label: 'ความชื้นสัมพัทธ์', value: '98', unit: '%RH', status: 'warn' },
      { key: 'wind', label: 'ความเร็วลม', value: '8.5', unit: 'm/s', status: 'none' },
      { key: 'dir', label: 'ทิศทางลม', value: '180°', unit: '', extra: 'ใต้ (S)', status: 'none' },
      { key: 'pres', label: 'ความกดอากาศ', value: '982.8', unit: 'hPa', status: 'ok' },
      { key: 'co2', label: 'ก๊าซคาร์บอนไดออกไซด์', value: '385', unit: 'ppm', status: 'none' },
      { key: 'pm', label: 'ฝุ่น PM 2.5', value: '5', unit: 'µg/m³', status: 'none' }
    ];
  }

  static sampleHourly() {
    return { endHour: 11, values: [0, 0, 0.4, 1.2, 3.5, 8.2, 12.6, 18.4, 22.1, 15.3, 9.8, 6.2, 4.1, 2.6, 1.8, 0.9, 0.4, 0, 0, 2.2, 9.6, 24.8, 38.5, 41.6].map((x) => x * 1) };
  }

  renderVals() {
    const p = this.props || {};
    const embedded = Array.isArray(p.readings);
    const theme = p.theme || this.state.theme || 'dark';
    const lt = theme === 'light';
    const NAME = { ok: 'ปกติ', warn: 'เฝ้าระวัง', bad: 'วิกฤต', none: '' };
    // icon tile follows the criteria colour of the value (pale colours get a darker stroke so the glyph stays readable)
    const icOf = (c) => { if (!c) return ''; const n = parseInt(c.slice(1), 16), L = (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; const ink = L > 0.62 ? 'color-mix(in srgb, ' + c + ' 55%, #111827)' : c;
      return 'color: ' + ink + '; box-shadow: inset 0 0 0 2px ' + c + '; background: color-mix(in srgb, ' + c + ' 16%, #ffffff);'; };
    const vOf = (c) => { if (!c) return ''; const n = parseInt(c.slice(1), 16), L = (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; return 'color: ' + (L > 0.62 && lt ? 'color-mix(in srgb, ' + c + ' 55%, #111827)' : c) + ';'; };
    const toCard = (r) => ({ icStyle: icOf(r.color), vStyle: vOf(r.color),
      cls: 'rc-card s-' + (r.status || 'none') + (r.hl ? ' hl' : ''), icon: Component.icon(r.key), label: r.label, value: r.value, unit: r.unit || '', extra: r.extra || '',
      aria: r.label + ' ' + r.value + ' ' + (r.unit || '') + (r.extra ? ' ' + r.extra : '') + (NAME[r.status] ? ' · ' + NAME[r.status] : '')
    });
    const list = embedded ? p.readings : Component.sample();
    const cards = list.map(toCard);
    const variant = p.variant === 'single' || p.variant === 'all' ? p.variant : (list.length === 1 ? 'single' : 'all');
    const oneSrc = embedded ? list[0] : Component.sample()[0];
    // hourly rain bars: prop hourly = { values: [24 numbers, oldest → newest], endHour: 11, note } (only for rain 24 ชม.)
    const hrSrc = embedded ? p.hourly : Component.sampleHourly();
    const hr = (() => {
      if (!hrSrc || !Array.isArray(hrSrc.values) || !hrSrc.values.length) return null;
      const V = hrSrc.values, n = V.length, end = hrSrc.endHour == null ? 11 : hrSrc.endHour;
      const top = Math.max(1, ...V), nice = top <= 5 ? 5 : top <= 10 ? 10 : top <= 20 ? 20 : top <= 40 ? 40 : Math.ceil(top / 20) * 20;
      const hh = (k) => String(((k % 24) + 24) % 24).padStart(2, '0') + ':00';
      const r1 = (x) => Math.round(x * 10) / 10;
      const last3 = r1(V.slice(-3).reduce((a, b) => a + b, 0)), prev3 = r1(V.slice(-6, -3).reduce((a, b) => a + b, 0));
      let pk = 0; V.forEach((x, i) => { if (x >= V[pk]) pk = i; });
      const trend = last3 > prev3 * 1.3 && last3 - prev3 >= 1 ? 'เพิ่มขึ้น' : last3 < prev3 * 0.7 && prev3 - last3 >= 1 ? 'ลดลง' : 'ทรงตัว';
      const bars = V.map((x, i) => { const h1 = end - n + i, h2 = h1 + 1; return {
        cls: (x <= 0 ? 'z' : '') + (i >= n - 3 ? ' r3' : ''), style: 'height: ' + (x <= 0 ? 0 : Math.max(3, Math.round(x / nice * 100))) + '%;' + (hrSrc.color && x > 0 ? ' background: ' + hrSrc.color + ';' : ''),
        tip: hh(h1) + '–' + hh(h2) + ' น. · ' + r1(x) + ' มม.' }; });
      const ticks = [0, 6, 12, 18, 24].map((k) => ({ label: k === 24 ? hh(end) : hh(end - n + k), style: 'left: ' + (k / n * 100) + '%;' }));
      return { title: 'ข้อมูลย้อนหลัง 24 ชม.', sub: 'ปริมาณฝนรายชั่วโมง', hasMore: typeof hrSrc.more === 'function', more: hrSrc.more || (() => {}), last3: last3 + ' มม.', trend: (trend === 'เพิ่มขึ้น' ? '↑ ' : trend === 'ลดลง' ? '↓ ' : '→ ') + trend, trCls: 'rc-hr-tr ' + (trend === 'เพิ่มขึ้น' ? 'up' : trend === 'ลดลง' ? 'dn' : 'eq'),
        peak: r1(V[pk]) + ' มม.', peakAt: hh(end - n + pk).slice(0, 2) + '–' + hh(end - n + pk + 1).slice(0, 2) + ' น.', ymax: String(nice),
        sum: '3 ชม.ล่าสุด ' + last3 + ' มม. (' + trend + ') · สูงสุด ' + r1(V[pk]) + ' มม. เวลา ' + hh(end - n + pk) + '–' + hh(end - n + pk + 1),
        recStyle: 'left: calc(' + ((n - 3) / n * 100) + '% - 1px); width: calc(' + (3 / n * 100) + '% + 2px);', recLabel: '3 ชม.',
        bars, ticks, aria: 'ฝนรายชั่วโมง 24 ชั่วโมงที่ผ่านมา · 3 ชั่วโมงล่าสุด ' + last3 + ' มม. ' + trend + ' · สูงสุด ' + r1(V[pk]) + ' มม.' };
    })();
    const one = Object.assign(toCard(oneSrc), { cls: 'rc-one s-' + (oneSrc.status || 'none'), pill: oneSrc.band || NAME[oneSrc.status] || '', pillStyle: oneSrc.color ? 'background: ' + oneSrc.color + '; color: ' + (oneSrc.ink || '#ffffff') + ';' : '' });
    // band/color/ink props: show the criteria band name in its own color (ThaiWater-style) instead of ปกติ/เฝ้าระวัง/วิกฤต
    const states = [
      { key: 'temp', label: 'ปกติ (ok)', value: '27', unit: '°C', status: 'ok' },
      { key: 'hum', label: 'เฝ้าระวัง (warn)', value: '98', unit: '%RH', status: 'warn' },
      { key: 'rain', label: 'วิกฤต (bad)', value: '339.5', unit: 'mm', status: 'bad' },
      { key: 'wind', label: 'ไม่มีเกณฑ์ (none)', value: '8.5', unit: 'm/s', status: 'none' }
    ].map(toCard);
    return {
      embedded, showcase: !embedded, rootCls: lt ? 'rc lt' : 'rc', showCls: lt ? 'rc rc-show lt' : 'rc rc-show',
      isAll: variant === 'all', isSingle: variant === 'single', cards, one, states, hasHr: !!hr, hr: hr || { bars: [], ticks: [] },
      oneNote: p.note || 'สถานีนี้ตรวจวัดค่าเดียว',
      hasStats: embedded ? Array.isArray(p.stats) && p.stats.length > 0 : true,
      stats: (embedded ? (p.stats || []) : [{ label: 'ฝน 24 ชม.', value: '339.5 mm', on: true }, { label: 'ฝน 3 วัน', value: '412.0 mm' }, { label: 'ฝน 5 วัน', value: '455.3 mm' }]).map((m) => ({ label: m.label, value: m.value, on: !!m.on, cls: (m.on ? 'on' : '') + (m.pick ? '' : ' ro'), pick: m.pick || (() => {}) })),
      themes: [['dark', 'มืด'], ['light', 'สว่าง']].map(([k, l]) => ({ label: l, on: theme === k, cls: theme === k ? 'on' : '', pick: () => this.setState({ theme: k }) }))
    };
  }
}
