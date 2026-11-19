import { DCLogic, createElement } from '../runtime.js';
import { activeMeasurement, activeWarning, hasMeasurementCustom, measurements, measurementLevels, measurementUnits, warningCustom, warningMaster } from '../warning-criteria.js';
import { LINE_SENSOR_TYPES, THAI_RIVER_BASINS, defaultLineTypeState, loadLineTypeState, saveLineTypeState, loadLineFrequencyState, saveLineFrequencyState } from '../line-oa-policy.js';
import { recordAudit } from '../audit-log.js';

function frequencyShape(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    ...source,
    scope: 'all',
    mode: source.mode === 'on-update' ? 'on-update' : 'interval',
    hours: [1, 6, 12].includes(Number(source.hours)) ? Number(source.hours) : 6,
    basins: source.basins && typeof source.basins === 'object' ? source.basins : {}
  };
}

export default class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = {
      form: null, delId: null, rowMenu: null, q: '', filter: 'all', sortK: null, sortDir: 1, quota: false, toast: '', undo: null, seq: 5, linePage: 'rules',
      measurementEnabled: loadLineTypeState(), frequency: loadLineFrequencyState(), frequencyDirty: false, frequencyTab: 'system', frequencyQuery: '',
      rules: [
        { id: 'r1', name: 'NDWC CTI', group: 'โต๊ะประชุมข่าวเช้า', sel: ['G15006-2201','G15006-2202','G15006-2203','G15006-2204','G15006-1801','G15006-1802','G15006-1810','G15006-1822','G15006-4012'], st: 9, time: '06:00 – 22:00', tags: [1, 2], on: false },
        { id: 'r2', name: 'NDWC North', group: 'โต๊ะประชุมข่าวเช้า', sel: ['G15006-0821','G15006-0823','G15006-0830','G15006-0841','G15006-0855','G15006-0862','G15006-0512','G15006-0515','G15006-0520','G15006-0531','G15006-0544'], st: 11, time: '00:00 – 08:00', tags: [2], on: true },
        { id: 'r3', name: 'NDWC North ค่าตลิ่ง', group: 'โต๊ะประชุมข่าวเช้า', sel: ['G15006-0512','G15006-0515','G15006-0520','G15006-0531','G15006-0544'], st: 5, time: '07:00 – 08:00', tags: [1], on: true },
        { id: 'r4', name: 'ทดสอบกลุ่มไลน์', group: 'CCTV Prod [Test]', sel: ['G15006-4001'], st: 1, time: '24 ชั่วโมง', tags: [2], on: false },
        { id: 'r5', name: 'ลุ่มน้ำชี กลุ่ม Line ทดสอบ Prod', group: 'CCTV Prod [Test]', sel: ['G15006-4002'], st: 1, time: '06:00 – 22:00', tags: [1, 2], on: false }
      ]
    };
    // Demo rules intentionally cover different sensor types so the
    // per-rule selection is visible without creating a new rule first.
    const demoTypes = { r1: [1], r2: [2], r3: [3, 4], r4: [5], r5: [7] };
    for (const rule of this.state.rules) {
      const types = demoTypes[rule.id] || [];
      if (!rule.conditions && types.length) {
        rule.conditions = { 0: this.conditionsForRule(rule)[0] || [] };
        for (const type of types) {
          const levels = this.levelsForType(type);
          if (levels.length) rule.conditions[type] = [levels[Math.max(0, levels.length - 2)].id];
        }
      }
    }
  }

  levelsForType(type) {
    try { return type === 0 ? warningMaster('24h') : measurementLevels(type); }
    catch { return []; }
  }

  levelRange(type, levels, index) {
    let cuts = [];
    try {
      cuts = type === 0 ? activeWarning('', levels)['24h'] : activeMeasurement(type, '', levels);
    } catch { return 'ยังไม่มีช่วงค่ากลาง'; }
    const unit = measurementUnits[type] || '';
    if (!cuts.length) return 'ยังไม่มีช่วงค่ากลาง';
    if (index === 0) return `ตั้งแต่ 0 ถึง ${cuts[0]} ${unit}`;
    if (index >= cuts.length) return `มากกว่า ${cuts.at(-1)} ${unit}`;
    return `มากกว่า ${cuts[index - 1]} ถึง ${cuts[index]} ${unit}`;
  }

  conditionsForRule(rule) {
    if (rule.conditions) return Object.fromEntries(Object.entries(rule.conditions).map(([type, ids]) => [type, [...ids]]));
    const rain = this.levelsForType(0);
    const ids = (rule.tags || []).map((tag) => tag === 1 ? rain[1]?.id : rain.at(-1)?.id).filter(Boolean);
    return ids.length ? { 0: ids } : {};
  }

  conditionChips(rule, enabledTypes = this.state?.measurementEnabled || defaultLineTypeState()) {
    const result = [];
    for (const [typeKey, selected] of Object.entries(this.conditionsForRule(rule))) {
      const type = Number(typeKey);
      for (const level of this.levelsForType(type).filter((item) => selected.includes(item.id))) {
        const color = level.color || '#94a3b8';
        const enabled = enabledTypes?.[type] !== false;
        result.push({
          label: measurements[type] + ' · ' + level.name + (enabled ? '' : ' · ปิดการใช้งาน'),
          cls: enabled ? 'lr-tag' : 'lr-tag paused',
          vars: `--tag-color:${color};--tag-bg:${color}24`,
        });
      }
    }
    return result;
  }

  toggleMeasurementType(type) {
    const current = this.state.measurementEnabled;
    const measurementEnabled = saveLineTypeState({ ...current, [type]: current[type] === false });
    this.setState({ measurementEnabled });
    recordAudit({ item: 'ประเภทข้อมูล Sensor สำหรับ LINE OA', action: 'แก้ไข', target: measurements[type], detail: measurementEnabled[type] ? 'เปิดใช้งานประเภทข้อมูลสำหรับ LINE OA' : 'ปิดการใช้งานประเภทข้อมูลสำหรับ LINE OA' });
  }

  setAllMeasurementTypes(enabled) {
    const measurementEnabled = saveLineTypeState(Object.fromEntries(LINE_SENSOR_TYPES.map((type) => [type, enabled])));
    this.setState({ measurementEnabled });
    recordAudit({ item: 'ประเภทข้อมูล Sensor สำหรับ LINE OA', action: 'แก้ไข', target: 'ทุกประเภทตรวจวัด', detail: enabled ? 'เปิดใช้งานทุกประเภท' : 'ปิดการใช้งานทุกประเภท' });
  }


  basins() {
    const main = {
      'ลุ่มน้ำปิง': [['G15006-0821', 'อบต.ปิงโค้ง', 'อ.เชียงดาว จ.เชียงใหม่'], ['G15006-0823', 'โรงเรียนบ้านแม่นะ', 'อ.เชียงดาว จ.เชียงใหม่'], ['G15006-0830', 'ฝายแม่ริม', 'อ.แม่ริม จ.เชียงใหม่'], ['G15006-0841', 'เทศบาลตำบลสันกำแพง', 'อ.สันกำแพง จ.เชียงใหม่'], ['G15006-0855', 'สะพานนวรัฐ', 'อ.เมือง จ.เชียงใหม่'], ['G15006-0862', 'อบต.ดอยหล่อ', 'อ.ดอยหล่อ จ.เชียงใหม่']],
      'ลุ่มน้ำน่าน': [['G15006-0512', 'สถานีบ้านกอ', 'อ.แม่จริม จ.น่าน'], ['G15006-0515', 'โรงเรียนบ้านน้ำปาย', 'อ.แม่จริม จ.น่าน'], ['G15006-0520', 'สะพานพัฒนาภาคเหนือ', 'อ.เมือง จ.น่าน'], ['G15006-0531', 'อบต.ท่าวังผา', 'อ.ท่าวังผา จ.น่าน'], ['G15006-0544', 'เทศบาลตำบลเวียงสา', 'อ.เวียงสา จ.น่าน']],
      'ลุ่มน้ำชี': [['G15006-4001', 'เทศบาลตำบลสะอาด', 'อ.น้ำพอง จ.ขอนแก่น'], ['G15006-4002', 'ที่ว่าการอำเภอน้ำพอง', 'อ.น้ำพอง จ.ขอนแก่น'], ['G15006-4006', 'อบต.ป่าปอ', 'อ.บ้านไผ่ จ.ขอนแก่น'], ['G15006-4012', 'สะพานบ้านท่าพระ', 'อ.เมือง จ.ขอนแก่น'], ['G15006-4020', 'อบต.ลาดใหญ่', 'อ.เมือง จ.ชัยภูมิ']],
      'ลุ่มน้ำเจ้าพระยา': [['G15006-1801', 'ที่ว่าการอำเภอเมืองชัยนาท', 'อ.เมือง จ.ชัยนาท'], ['G15006-1802', 'ศูนย์พัฒนาเด็กเล็ก วัดฝาง', 'อ.เมือง จ.ชัยนาท'], ['G15006-1810', 'เขื่อนเจ้าพระยา', 'อ.สรรพยา จ.ชัยนาท'], ['G15006-1822', 'อบต.บางระจัน', 'อ.ค่ายบางระจัน จ.สิงห์บุรี']],
      'ลุ่มน้ำชายฝั่งทะเลตะวันออก': [['G15006-2201', 'หอประชุม ม.17', 'อ.แก่งหางแมว จ.จันทบุรี'], ['G15006-2202', 'เทศบาลตำบลบ่อเวฬุ ม.2', 'อ.ขลุง จ.จันทบุรี'], ['G15006-2203', 'ศาลา ม.6', 'อ.มะขาม จ.จันทบุรี'], ['G15006-2204', 'ศาลา ม.8', 'อ.มะขาม จ.จันทบุรี']]
    };
    const areas = [
      { province: 'เชียงใหม่', district: 'เชียงดาว', subdistrict: 'แม่นะ' },
      { province: 'น่าน', district: 'แม่จริม', subdistrict: 'หนองแดง' },
      { province: 'ขอนแก่น', district: 'น้ำพอง', subdistrict: 'สะอาด' },
      { province: 'ชัยนาท', district: 'เมืองชัยนาท', subdistrict: 'เขาท่าพระ' },
      { province: 'จันทบุรี', district: 'แก่งหางแมว', subdistrict: 'บ่อเวฬุ' },
    ];
    const names = Object.keys(main);
    names.forEach((basin, basinIndex) => {
      const stations = main[basin];
      while (stations.length < 14) {
        const no = String(stations.length + 1).padStart(2, '0');
        stations.push([`DPM-${String(basinIndex + 1).padStart(2, '0')}-${no}`, `สถานีตรวจวัด ปภ. ${no}`, basin, 'กรมป้องกันและบรรเทาสาธารณภัย', false, [...LINE_SENSOR_TYPES]]);
      }
      main[basin] = stations.map((station, index) => [
        station[0], station[1], station[2], station[3] || 'กรมป้องกันและบรรเทาสาธารณภัย', station[4] || false,
        station[5] || [...LINE_SENSOR_TYPES], areas[basinIndex]
      ]);
      main[basin].push(
        [`EXT-${String(basinIndex + 1).padStart(2, '0')}-01`, `สถานีหน่วยงานร่วม ${basinIndex + 1}`, basin, 'หน่วยงานภายนอก', true, [0, 7, 8], areas[basinIndex]],
        [`EXT-${String(basinIndex + 1).padStart(2, '0')}-02`, `สถานีอุตุนิยมวิทยา ${basinIndex + 1}`, basin, 'กรมอุตุนิยมวิทยา', true, [0, 1, 2, 3, 4, 5, 6], areas[basinIndex]]
      );
    });
    return main;
  }

  openEdit(r) {
    const m = /^(\d\d:\d\d) – (\d\d:\d\d)( \(\+1\))?$/.exec(r.time || '');
    const BS = this.basins();
    const first = (r.sel || [])[0];
    const basin = Object.keys(BS).find((b) => BS[b].some((x) => x[0] === first)) || '';
    const includeOther = Object.values(BS).some((stations) => stations.some((station) => station[4] && (r.sel || []).includes(station[0])));
    this.setState({ quota: false, form: Object.assign(this.blankForm(), {
      editId: r.id, name: r.name, group: r.group, basin, includeOther, sel: (r.sel || []).slice(), conditions: this.conditionsForRule(r), on: r.on,
      timeOn: !!m, from: m ? m[1] : '06:00', to: m ? m[2] : '22:00', overnight: !!(m && m[3])
    }) });
  }

  blankForm() { return { name: '', group: '', basin: '', stationType: '0', stationTypeDetail: null, includeOther: false, scopeError: false, sq: '', sel: [], summaryType: null, timeOn: true, from: '06:00', to: '22:00', overnight: false, conditions: { 0: [] }, on: true, tried: false }; }

  componentDidMount() { this.measure(); }
  componentDidUpdate() { this.measure(); }
  // count tags hidden by the column width -> drives the "+N" chip and the hover tooltip
  measure() {
    if (typeof document === 'undefined') return;
    const ov = {};
    document.querySelectorAll('[data-rule-tags]').forEach((el) => {
      const w = el.clientWidth; let hidden = 0;
      Array.from(el.children).forEach((c) => { if (c.offsetLeft + c.offsetWidth > w - 40 + (el.classList.contains('ov') ? 0 : 40)) hidden++; });
      if (el.scrollWidth > w + 1 && hidden === 0) hidden = 1;
      if (hidden) ov[el.getAttribute('data-rule-tags')] = hidden;
    });
    const k = JSON.stringify(ov);
    if (k !== this._ovk) { this._ovk = k; this.setState({ ov }); }
  }

  renderVals() {
    const s = this.state;
    const theme = (this.props && this.props.theme) || this.state.theme || 'dark';
    const setTheme = (v) => { if (this.props && typeof this.props.setTheme === 'function') this.props.setTheme(v); else this.setState({ theme: v }); };
    const say = (msg, undo) => { clearTimeout(this._t); this.setState({ toast: msg, undo: undo || null }); this._t = setTimeout(() => this.setState({ toast: '', undo: null }), 4000); };
    const ql = s.q.trim().toLowerCase();
    const match = s.rules.filter((r) => !ql || (r.name + ' ' + r.group).toLowerCase().indexOf(ql) >= 0);
    const list = match.filter((r) => s.filter === 'all' || (s.filter === 'on') === r.on);
    const key = (r) => (s.sortK === 'name' ? r.name : r.group);
    const sorted = s.sortK ? list.slice().sort((a, b) => s.sortDir * key(a).localeCompare(key(b), 'th')) : list;
    const rows = sorted.map((r, i) => {
      const conditionTags = this.conditionChips(r);
      return ({
      no: i + 1, name: r.name, group: r.group, st: r.st, time: r.time,
      tags: conditionTags,
      id: r.id, tagCount: conditionTags.length, more: (s.ov || {})[r.id] || 0,
      tagsCls: (s.ov || {})[r.id] ? 'lr-tags ov' : 'lr-tags', tcwCls: (s.ov || {})[r.id] ? 'lr-tcw ov' : 'lr-tcw',
      tabIdx: (s.ov || {})[r.id] ? '0' : undefined, tagsAria: 'เงื่อนไขการแจ้งเตือน: ' + conditionTags.map((tag) => tag.label).join(', '),
      on: r.on, stLabel: r.on ? 'เปิด' : 'ปิด', stCls: r.on ? 'lr-st on' : 'lr-st', stAria: 'เปิดการแจ้งเตือน ' + r.name,
      toggle: () => { this.setState({ rules: s.rules.map((q) => (q.id === r.id ? Object.assign({}, q, { on: !q.on }) : q)) }); recordAudit({ item: 'กฎแจ้งเตือน LINE', action: 'แก้ไข', target: r.name, detail: r.on ? 'ปิดการใช้งานกฎ' : 'เปิดการใช้งานกฎ' }); },
      edAria: 'แก้ไข ' + r.name, delAria: 'ลบ ' + r.name,
      menu: s.rowMenu === r.id, kbCls: s.rowMenu === r.id ? 'lr-kb on' : 'lr-kb', kbAria: 'จัดการ ' + r.name,
      mnCls: i >= sorted.length - 2 && sorted.length > 3 ? 'lr-mn up' : 'lr-mn',
      openMenu: () => this.setState({ rowMenu: s.rowMenu === r.id ? null : r.id }),
      edit: () => { this.setState({ rowMenu: null }); this.openEdit(r); },
      del: () => this.setState({ rowMenu: null, delId: r.id, quota: false })
      });
    });

    // ----- create drawer -----
    const BS = this.basins();
    const ALL = {}; Object.keys(BS).forEach((b) => BS[b].forEach((x) => {
      const area = x[6] || {};
      ALL[x[0]] = { code: x[0], name: x[1], loc: x[2], basin: b, agency: x[3], external: !!x[4], types: x[5] || [0], province: area.province || '', district: area.district || '', subdistrict: area.subdistrict || '' };
    }));
    const fm = s.form;
    const setF = (patch) => this.setState({ form: Object.assign({}, this.state.form, patch) });
    let cr = { open: false };
    if (fm) {
      const t2m = (t) => { const p = (t || '0:0').split(':'); return (+p[0]) * 60 + (+p[1]); };
      const eName = fm.tried && !fm.name.trim() ? 'กรุณากรอกชื่อกฎ' : '';
      const eGroup = fm.tried && !fm.group ? 'กรุณาเลือก Line Group' : '';
      const eSt = fm.tried && !fm.sel.length ? 'กรุณาเลือกอย่างน้อย 1 สถานี' : '';
      // Keep the rule's own type selection visible even when a global LINE OA
      // switch is off. The global switch pauses evaluation; it must not hide
      // or erase the rule-level configuration.
      const selectedTypes = Object.keys(fm.conditions || {}).map(Number).filter((type) => LINE_SENSOR_TYPES.includes(type));
      const selectedConditionCount = selectedTypes.reduce((count, type) => count + (fm.conditions[type] || []).length, 0);
      const alertTypes = selectedTypes.filter((type) => (fm.conditions[type] || []).length > 0);
      const eType = fm.tried && !selectedTypes.length ? 'กรุณาเลือกประเภทการตรวจวัดอย่างน้อย 1 ประเภท' :
        fm.tried && !selectedConditionCount ? 'กรุณาเลือกระดับแจ้งเตือนอย่างน้อย 1 ระดับ' : '';
      const crosses = t2m(fm.to) <= t2m(fm.from);
      const timeHint = fm.timeOn && crosses && !fm.overnight ? 'เวลาสิ้นสุดน้อยกว่าเวลาเริ่มต้น — ติ๊ก "ข้ามวัน" ถ้าต้องการให้ส่งข้ามเที่ยงคืน' : '';
      const eTime = fm.tried && timeHint ? 'ช่วงเวลาไม่ถูกต้อง' : '';
      const sql = fm.sq.trim().toLowerCase();
      const stationType = fm.stationType === '' ? null : Number(fm.stationType);
      const visibleTypes = LINE_SENSOR_TYPES.filter(type => this.levelsForType(type).length);
      const filteredStations = Object.values(ALL).filter((station) =>
        (!fm.basin || station.basin === fm.basin) &&
        (fm.includeOther || !station.external) &&
        (stationType === null || station.types.includes(stationType)) &&
        (!sql || `${station.code} ${station.name} ${station.loc} ${station.subdistrict} ${station.district} ${station.province}`.toLowerCase().includes(sql))
      );
      const allOn = filteredStations.length > 0 && filteredStations.every((station) => fm.sel.includes(station.code));
      const selectedExternal = fm.sel.filter((code) => ALL[code]?.external);
      const selectedStationTypes = LINE_SENSOR_TYPES.filter((type) => fm.sel.some((code) => ALL[code]?.types.includes(type)));
      const otherScopeError = fm.scopeError && selectedExternal.length
        ? 'ไม่สามารถปิดได้ เนื่องจากยังมีสถานีหน่วยงานอื่นที่ถูกเลือกอยู่ กรุณานำสถานีดังกล่าวออกก่อน'
        : '';
      const unsupportedStations = fm.sel.map(code => ALL[code]).filter((station) => station && alertTypes.some(type => !station.types.includes(type)));
      const eSupport = fm.tried && !eType && unsupportedStations.length ? `สถานีที่เลือก ${unsupportedStations.length} แห่ง ไม่รองรับประเภทการแจ้งเตือนที่กำหนด` : '';
      const errs = [eName, eGroup, eSt, eSupport, eTime, eType].filter(Boolean);
      cr = {
        open: true, title: fm.editId ? 'แก้ไขกฎ' : 'สร้างกฎใหม่', okLabel: fm.editId ? 'บันทึกการแก้ไข' : 'ยืนยัน',
        close: () => this.setState({ form: null }),
        name: fm.name, setName: (e) => setF({ name: e.target.value }), nameCls: eName ? 'cr-in bad' : 'cr-in', eName,
        groupOpts: [{ v: '', l: 'เลือก Line Group', on: !fm.group }].concat(['โต๊ะประชุมข่าวเช้า', 'CCTV Prod [Test]', 'ศูนย์ปฏิบัติการ ปภ.', 'เจ้าหน้าที่ภาคเหนือ', 'เจ้าหน้าที่ภาคตะวันออกเฉียงเหนือ'].map((g) => ({ v: g, l: g, on: fm.group === g }))),
        setGroup: (e) => setF({ group: e.target.value }), groupCls: eGroup ? 'cr-sel bad' : 'cr-sel', eGroup,
        basinOpts: [{ v: '', l: 'ทุกลุ่มน้ำ', on: !fm.basin }].concat(Object.keys(BS).map((b) => ({ v: b, l: b + ' (' + BS[b].filter(x=>!x[4]).length + ')', on: fm.basin === b }))),
        setBasin: (e) => setF({ basin: e.target.value }),
        stationTypeOpts: [{ v: '', l: 'ทุกประเภทการตรวจวัด', on: stationType === null }].concat(visibleTypes.map((type) => ({ v: String(type), l: measurements[type] + (s.measurementEnabled[type] === false ? ' · ปิดการใช้งาน' : ''), on: stationType === type }))),
        stationType: fm.stationType,
        setStationType: (e) => setF({ stationType: e.target.value }),
        includeOther: fm.includeOther,
        otherScopeError,
        toggleIncludeOther: () => {
          if (fm.includeOther && selectedExternal.length) { setF({ scopeError: true }); return; }
          setF({ includeOther: !fm.includeOther, scopeError: false });
        },
        sq: fm.sq, setSq: (e) => setF({ sq: e.target.value }),
        hasList: filteredStations.length > 0, noMatch: filteredStations.length === 0,
        listCount: filteredStations.length,
        allLabel: allOn ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด',
        toggleAll: () => { const codes = filteredStations.map((station) => station.code); setF({ sel: allOn ? fm.sel.filter((code) => !codes.includes(code)) : Array.from(new Set(fm.sel.concat(codes))), scopeError: false }); },
        list: filteredStations.map((station) => {
          const on = fm.sel.includes(station.code);
          const typeBadges = station.types.map(type => ({ label: measurements[type] }));
          const hasInlineTypes = station.external;
          return {
            code: station.code, name: station.name, loc: station.loc, agency: station.agency,
            sourceLabel: station.external ? 'สถานีหน่วยงานอื่น' : 'สถานีในโครงการ ปภ.', sourceCls: station.external ? 'cr-source-badge other' : 'cr-source-badge dpm',
            supportLabel: `${station.types.length} ประเภท`, supportDetail: typeBadges.map(type=>type.label).join(', '),
            supportCls: station.external ? 'cr-support-badge' : 'cr-support-badge dpm-support',
            hasInlineTypes: true, typeBadges, hasDetailTrigger: false, detailOpen: false,
            toggleDetail: (event) => { event.preventDefault(); event.stopPropagation(); setF({ stationTypeDetail: fm.stationTypeDetail === station.code ? null : station.code }); },
            on, toggle: () => setF({ sel: on ? fm.sel.filter((code) => code !== station.code) : fm.sel.concat(station.code), scopeError: false })
          };
        }),
        selCount: fm.sel.length, noSel: !fm.sel.length, hasSel: fm.sel.length > 0, eSt,
        dpmStations: fm.sel.filter(code=>ALL[code] && !ALL[code].external).map((code) => ({ name: ALL[code].name, aria: 'เอา ' + ALL[code].name + ' ออก', rm: () => setF({ sel: fm.sel.filter((q) => q !== code) }) })),
        otherStations: fm.sel.filter(code=>ALL[code]?.external).map((code) => ({ name: ALL[code].name, aria: 'เอา ' + ALL[code].name + ' ออก', rm: () => setF({ sel: fm.sel.filter((q) => q !== code) }) })),
        hasDpmStations: fm.sel.some(code=>ALL[code] && !ALL[code].external),
        hasOtherStations: fm.sel.some(code=>ALL[code]?.external),
        dpmCount: fm.sel.filter(code=>ALL[code] && !ALL[code].external).length,
        otherCount: fm.sel.filter(code=>ALL[code]?.external).length,
        hasCoverage: selectedStationTypes.length > 0,
        hiddenTypeCount: LINE_SENSOR_TYPES.length - selectedStationTypes.length,
        hasHiddenTypes: selectedStationTypes.length < LINE_SENSOR_TYPES.length,
        coverage: selectedStationTypes.map((type) => {
          const supported = fm.sel.filter(code => ALL[code]?.types.includes(type)).length;
          return { type, label: measurements[type], supported, total: fm.sel.length, cls: 'cr-coverage-item' + (fm.summaryType === type ? ' open' : ''), open: fm.summaryType === type, toggle: () => setF({ summaryType: fm.summaryType === type ? null : type }) };
        }),
        hasCoverageDetail: fm.summaryType !== null && selectedStationTypes.includes(fm.summaryType),
        coverageDetailTitle: fm.summaryType === null ? '' : measurements[fm.summaryType],
        coverageDetail: fm.summaryType === null ? [] : fm.sel.filter(code=>ALL[code]?.types.includes(fm.summaryType)).map((code) => {
          const station = ALL[code];
          return {
            name: station.name,
            code,
            external: station.external,
            cls: 'cr-detail-station',
            aria: 'เอา ' + station.name + ' ออก',
            rm: () => setF({ sel: fm.sel.filter((q) => q !== code), scopeError: false })
          };
        }),
        coverageProject: fm.summaryType === null ? [] : fm.sel.filter(code=>ALL[code]?.types.includes(fm.summaryType) && !ALL[code].external).map((code) => ({ name: ALL[code].name, aria: 'เอา ' + ALL[code].name + ' ออก', rm: () => setF({ sel: fm.sel.filter((q) => q !== code), scopeError: false }) })),
        coverageOther: fm.summaryType === null ? [] : fm.sel.filter(code=>ALL[code]?.types.includes(fm.summaryType) && ALL[code].external).map((code) => ({ name: ALL[code].name, aria: 'เอา ' + ALL[code].name + ' ออก', rm: () => setF({ sel: fm.sel.filter((q) => q !== code), scopeError: false }) })),
        hasCoverageProject: fm.summaryType !== null && fm.sel.some(code=>ALL[code]?.types.includes(fm.summaryType) && !ALL[code].external),
        hasCoverageOther: fm.summaryType !== null && fm.sel.some(code=>ALL[code]?.types.includes(fm.summaryType) && ALL[code].external),
        eSupport, unsupported: unsupportedStations.map(station => ({ name: station.name, code: station.code, agency: station.agency })),
        timeOn: fm.timeOn, timeTg: fm.timeOn ? 'cr-tg on' : 'cr-tg', toggleTime: () => setF({ timeOn: !fm.timeOn }),
        from: fm.from, to: fm.to, setFrom: (e) => setF({ from: e.target.value }), setTo: (e) => setF({ to: e.target.value }),
        overnight: fm.overnight, toggleOvernight: () => setF({ overnight: !fm.overnight }), timeHint,
        measurements: measurements.map((label,type) => ({label,type})).filter(({type}) => LINE_SENSOR_TYPES.includes(type) && this.levelsForType(type).length).map(({label,type}) => {
          const on=Object.hasOwn(fm.conditions,type);
          return {label,on,cls:on?'cr-measurement on':'cr-measurement',toggle:()=>{
            const conditions={...fm.conditions};
            if(on) delete conditions[type]; else conditions[type]=[];
            setF({conditions});
          }};
        }),
        hasMeasurements:LINE_SENSOR_TYPES.length>0,
        conditionGroups:LINE_SENSOR_TYPES.filter(type=>this.levelsForType(type).length).map(type=>{
          const typeSelected=Object.hasOwn(fm.conditions,type);
          const globallyEnabled=s.measurementEnabled[type] !== false;
          return ({
          name:measurements[type],
          on:typeSelected,
          cls:typeSelected?'cr-level-group on':'cr-level-group',
          paused:!globallyEnabled,
          note:(type===0?'อ้างอิงชื่อและสีเกณฑ์การเฝ้าระวังภัย (ปภ.) · ฝน 24 ชั่วโมง':'อ้างอิงชื่อและสีจากเกณฑ์กลาง') + (!globallyEnabled ? ' · ปิดการใช้งานจากส่วนกลาง' : ''),
          toggle:()=>{
            const conditions={...fm.conditions};
            if(typeSelected) delete conditions[type]; else conditions[type]=[];
            setF({conditions});
          },
          levels:this.levelsForType(type).map(level=>{
            const on=(fm.conditions[type]||[]).includes(level.id);
            const index=this.levelsForType(type).findIndex(item=>item.id===level.id);
            return {name:level.name,range:this.levelRange(type,this.levelsForType(type),index),on,disabled:!typeSelected,cls:on?'cr-level on':'cr-level',vars:`--c:${level.color};--bg:${level.color}24`,toggle:()=>{
              const current=fm.conditions[type]||[];
              const conditions={...fm.conditions,[type]:on?current.filter(id=>id!==level.id):[...current,level.id]};
              setF({conditions});
            }};
          }),
        });
        }),
        eType,
        on: fm.on, onTg: fm.on ? 'cr-tg on' : 'cr-tg', onLabel: fm.on ? 'เปิด' : 'ปิด', toggleOn: () => setF({ on: !fm.on }),
        sum: fm.tried && errs.length ? 'ยังบันทึกไม่ได้ — กรอกข้อมูลที่จำเป็นให้ครบ (' + errs.length + ' จุด)' : '',
        submit: () => {
          const ok = fm.name.trim() && fm.group && fm.sel.length && selectedTypes.length && selectedConditionCount && !unsupportedStations.length && !(fm.timeOn && crosses && !fm.overnight);
          if (!ok) { setF({ tried: true }); return; }
          const id = fm.editId || 'r' + (s.seq + 1);
          const rule = { id, sel: fm.sel.slice(), name: fm.name.trim(), group: fm.group, st: fm.sel.length, time: fm.timeOn ? fm.from + ' – ' + fm.to + (fm.overnight ? ' (+1)' : '') : '24 ชั่วโมง', conditions:Object.fromEntries(Object.entries(fm.conditions).map(([type,ids])=>[type,[...ids]])), on: fm.on };
          if (fm.editId) { this.setState({ rules: s.rules.map((q) => (q.id === id ? rule : q)), form: null }); recordAudit({ item: 'กฎแจ้งเตือน LINE', action: 'แก้ไข', target: rule.name, basin: fm.basin || '-', detail: 'ปรับข้อมูลกฎและเงื่อนไขการแจ้งเตือน' }); say('บันทึกการแก้ไข "' + rule.name + '" แล้ว'); return; }
          this.setState({ rules: s.rules.concat(rule), seq: s.seq + 1, form: null, filter: 'all', q: '' });
          recordAudit({ item: 'กฎแจ้งเตือน LINE', action: 'เพิ่ม', target: rule.name, basin: fm.basin || '-', detail: 'สร้างกฎการแจ้งเตือนใหม่' });
          say('สร้างกฎ "' + rule.name + '" แล้ว');
        }
      };
    }
    const sortIcon = (k) => (s.sortK !== k ? 'M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4' : s.sortDir > 0 ? 'M3 6h10M3 12h7M3 18h4M17 20V4M13 8l4-4 4 4' : 'M3 6h4M3 12h7M3 18h10M17 4v16M13 16l4 4 4-4');
    const sortBy = (k) => () => this.setState({ sortK: k, sortDir: s.sortK === k ? -s.sortDir : 1 });
    const cnt = { all: match.length, on: match.filter((r) => r.on).length, off: match.filter((r) => !r.on).length };
    const dr = s.delId ? s.rules.find((q) => q.id === s.delId) : null;
    const dl = dr ? {
      open: true, name: dr.name, group: dr.group, st: dr.st, isOn: dr.on,
      cancel: () => this.setState({ delId: null }),
      confirm: () => { const prev = s.rules; this.setState({ rules: s.rules.filter((q) => q.id !== dr.id), delId: null }); recordAudit({ item: 'กฎแจ้งเตือน LINE', action: 'ลบ', target: dr.name, detail: 'ลบกฎการแจ้งเตือน' }); say('ลบกฎ "' + dr.name + '" แล้ว', prev); }
    } : { open: false };
    const frequency = frequencyShape(s.frequency);
    const updateFrequency = (patch) => this.setState({ frequency: { ...frequency, ...patch }, frequencyDirty: true });
    // Frequency is a national control.  It must list all official basins,
    // independent from which basins happen to have mock stations today.
    const basinNames = THAI_RIVER_BASINS;
    const basinQuery = s.frequencyQuery.trim().toLowerCase();
    const shownBasins = basinNames.filter((basin) => basin.toLowerCase().includes(basinQuery));
    const basinSetting = (basin) => frequency.basins?.[basin] || null;
    const updateBasinFrequency = (basin, patch) => {
      const existing = basinSetting(basin) || { mode: frequency.mode, hours: frequency.hours };
      this.setState({ frequency: { ...frequency, basins: { ...frequency.basins, [basin]: { ...existing, ...patch } } }, frequencyDirty: true });
    };
    const resetBasinFrequency = (basin) => {
      const basins = { ...frequency.basins };
      delete basins[basin];
      this.setState({ frequency: { ...frequency, basins }, frequencyDirty: true });
    };
    const showRules = s.linePage !== 'frequency';
    const showFrequency = s.linePage === 'frequency';
    return {
      rowMenu: !!s.rowMenu, closeMenu: () => this.setState({ rowMenu: null }),
      isLight: theme === 'light', isDark: theme !== 'light', thLightCls: theme === 'light' ? 'on' : '', thDarkCls: theme !== 'light' ? 'on' : '',
      setLight: () => setTheme('light'), setDark: () => setTheme('dark'), rootCls: theme === 'light' ? 'sx lt' : 'sx',
      goCriteria: () => this.props.goCriteria?.(),
      showRules, showFrequency,
      rulesMenuCls: showRules ? 'msub on' : 'msub off', frequencyMenuCls: showFrequency ? 'msub on' : 'msub off',
      pageTitle: showFrequency ? 'ตั้งค่าความถี่การแจ้งเตือน' : 'จัดการการแจ้งเตือนไลน์',
      pageSubtitle: showFrequency ? 'ควบคุมความถี่การแจ้งเตือนซ้ำของระบบ LINE OA' : 'ใช้เกณฑ์ชุดเดียวกับหน้ารายการสถานี · ตั้งค่ากลุ่มผู้รับ ช่วงเวลา และช่องทาง LINE ที่นี่',
      goRules: () => this.setState({ linePage: 'rules', form: null, rowMenu: null, quota: false }),
      goFrequency: () => this.setState({ linePage: 'frequency', form: null, rowMenu: null, quota: false }),
      goMaster: () => this.props.goMaster?.(),
      goCentral: () => this.props.goCentral?.(),
      goMap: () => { if (this.props && typeof this.props.goMap === 'function') this.props.goMap(); },
      dl, cr, stop: (e) => e.stopPropagation(), openCreate: () => this.setState({ form: this.blankForm(), quota: false }),
      lineTypes: LINE_SENSOR_TYPES.map((type) => {
        const enabled = s.measurementEnabled[type] !== false;
        const supported = this.levelsForType(type).length > 0;
        return {
          type, label: measurements[type], enabled, supported,
          cls: enabled ? 'lr-type-setting on' : 'lr-type-setting',
          switchCls: enabled ? 'lr-type-switch on' : 'lr-type-switch',
          status: enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน',
          hint: supported ? 'มีเกณฑ์แจ้งเตือนจาก Master Data' : 'ยังไม่มีเกณฑ์แจ้งเตือนรองรับ',
          toggle: () => this.toggleMeasurementType(type),
        };
      }),
      enabledTypeCount: LINE_SENSOR_TYPES.filter((type) => s.measurementEnabled[type] !== false).length,
      lineTypeTotal: LINE_SENSOR_TYPES.length,
      enableAllTypes: () => this.setAllMeasurementTypes(true),
      disableAllTypes: () => this.setAllMeasurementTypes(false),
      allTypesEnabled: LINE_SENSOR_TYPES.every((type) => s.measurementEnabled[type] !== false),
      allTypesDisabled: LINE_SENSOR_TYPES.every((type) => s.measurementEnabled[type] === false),
      frequencyTab: s.frequencyTab, frequencySystemTabCls: s.frequencyTab === 'system' ? 'on' : '', frequencyBasinTabCls: s.frequencyTab === 'basin' ? 'on' : '',
      showFrequencySystem: s.frequencyTab === 'system', showFrequencyBasins: s.frequencyTab === 'basin',
      setFrequencyTab: (event) => this.setState({ frequencyTab: event?.currentTarget?.dataset?.value || event?.target?.dataset?.value || 'system' }),
      frequencyOnUpdate: frequency.mode === 'on-update', frequencyOnUpdateCls: frequency.mode === 'on-update' ? 'lr-freq-option on' : 'lr-freq-option',
      setFrequencyMode: (event) => updateFrequency({ mode: event?.currentTarget?.dataset?.value || event?.target?.dataset?.value || 'on-update' }),
      frequencyHourOptions: [1, 6, 12].map((hours) => ({ hours, label: `ทุก ${hours} ชั่วโมง`, on: frequency.mode !== 'on-update' && frequency.hours === hours, cls: frequency.mode !== 'on-update' && frequency.hours === hours ? 'lr-freq-option on' : 'lr-freq-option', pick: () => updateFrequency({ mode: 'interval', hours }) })),
      frequencyQuery: s.frequencyQuery, setFrequencyQuery: (e) => this.setState({ frequencyQuery: e.target.value }),
      frequencyBasinCount: `แสดง ${shownBasins.length} จาก ${basinNames.length} ลุ่มน้ำ`,
      frequencyBasinsEmpty: shownBasins.length === 0,
      frequencyBasins: shownBasins.map((basin) => {
        const setting = basinSetting(basin);
        const target = setting || frequency;
        return { basin, isCustom: !!setting, mode: target.mode, hours: target.hours, summary: target.mode === 'on-update' ? 'แจ้งเมื่อมีข้อมูลใหม่' : `ทุก ${target.hours} ชั่วโมง`,
          defaultLabel: setting ? 'ตั้งค่าเฉพาะลุ่มน้ำ' : 'ใช้ค่าเริ่มต้นของระบบ',
          hours: [1, 6, 12].map((hours) => { const on = target.mode !== 'on-update' && target.hours === hours; return { hours, label: `${hours} ชม.`, on, cls: on ? 'on' : '', pick: () => updateBasinFrequency(basin, { mode: 'interval', hours }) }; }),
          onUpdate: target.mode === 'on-update', onUpdateCls: target.mode === 'on-update' ? 'on' : '', setOnUpdate: () => updateBasinFrequency(basin, { mode: 'on-update' }), reset: () => resetBasinFrequency(basin) };
      }),
      frequencyDirty: s.frequencyDirty, frequencySaveDisabled: !s.frequencyDirty,
      saveFrequency: () => { const saved = saveLineFrequencyState(frequency); this.setState({ frequency: saved, frequencyDirty: false, toast: 'บันทึกการตั้งค่าความถี่การแจ้งเตือนแล้ว' }); recordAudit({ item: 'ความถี่การแจ้งเตือน', action: 'แก้ไข', target: 'ค่าเริ่มต้นของระบบ', detail: frequency.mode === 'on-update' ? 'แจ้งเมื่อมีข้อมูลใหม่' : `ห้ามแจ้งซ้ำภายใน ${frequency.hours} ชั่วโมง` }); },
      frequencySummary: frequency.mode === 'on-update' ? 'แจ้งเมื่อมีข้อมูลใหม่ (เฉพาะระดับเท่าเดิมหรือสูงขึ้น)' : `แจ้งซ้ำได้ทุก ${frequency.hours} ชั่วโมง เมื่อระดับเท่าเดิมหรือสูงขึ้น`,
      scrollFrequency: () => globalThis.document?.getElementById('lr-frequency')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      goStations: () => { if (this.props && typeof this.props.goStations === 'function') this.props.goStations(); },
      goAudit: () => { if (this.props && typeof this.props.goAudit === 'function') this.props.goAudit(); },
      q: s.q, setQ: (e) => this.setState({ q: e.target.value }),
      filters: [['all', 'ทั้งหมด'], ['on', 'เปิดการแจ้งเตือน'], ['off', 'ปิดการแจ้งเตือน']].map(([v, l]) => ({ label: l, count: cnt[v], on: s.filter === v, cls: s.filter === v ? 'on' : '', pick: () => this.setState({ filter: v }) })),
      rows, empty: rows.length === 0,
      resultTxt: 'แสดง ' + rows.length + ' จาก ' + s.rules.length + ' กฎ', hasFilter: !!s.q.trim() || s.filter !== 'all', clearFilter: () => this.setState({ q: '', filter: 'all' }),
      sortName: sortBy('name'), sortGroup: sortBy('group'),
      sortNameCls: s.sortK === 'name' ? 'lr-sort on' : 'lr-sort', sortGroupCls: s.sortK === 'group' ? 'lr-sort on' : 'lr-sort',
      iconName: sortIcon('name'), iconGroup: sortIcon('group'),
      ariaName: s.sortK === 'name' ? (s.sortDir > 0 ? 'ascending' : 'descending') : 'none',
      ariaGroup: s.sortK === 'group' ? (s.sortDir > 0 ? 'ascending' : 'descending') : 'none',
      from: rows.length ? 1 : 0, to: rows.length, total: rows.length,
      quotaOpen: s.quota, quotaCls: s.quota ? 'lr-btn2 on' : 'lr-btn2', toggleQuota: () => this.setState({ quota: !s.quota }),
      toast: s.toast, canUndo: !!s.undo, undo: () => { this.setState({ rules: s.undo, undo: null, toast: 'เรียกคืนกฎแล้ว' }); }
    };
  }
}
