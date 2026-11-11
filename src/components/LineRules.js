import { DCLogic, createElement } from '../runtime.js';

export default class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = {
      form: null, delId: null, rowMenu: null, q: '', filter: 'all', sortK: null, sortDir: 1, quota: false, toast: '', undo: null, seq: 5,
      rules: [
        { id: 'r1', name: 'NDWC CTI', group: 'โต๊ะประชุมข่าวเช้า', sel: ['G15006-2201','G15006-2202','G15006-2203','G15006-2204','G15006-1801','G15006-1802','G15006-1810','G15006-1822','G15006-4012'], st: 9, time: '06:00 – 22:00', tags: [1, 2], on: false },
        { id: 'r2', name: 'NDWC North', group: 'โต๊ะประชุมข่าวเช้า', sel: ['G15006-0821','G15006-0823','G15006-0830','G15006-0841','G15006-0855','G15006-0862','G15006-0512','G15006-0515','G15006-0520','G15006-0531','G15006-0544'], st: 11, time: '00:00 – 08:00', tags: [2], on: true },
        { id: 'r3', name: 'NDWC North ค่าตลิ่ง', group: 'โต๊ะประชุมข่าวเช้า', sel: ['G15006-0512','G15006-0515','G15006-0520','G15006-0531','G15006-0544'], st: 5, time: '07:00 – 08:00', tags: [1], on: true },
        { id: 'r4', name: 'ทดสอบกลุ่มไลน์', group: 'CCTV Prod [Test]', sel: ['G15006-4001'], st: 1, time: '24 ชั่วโมง', tags: [2], on: false },
        { id: 'r5', name: 'ลุ่มน้ำชี กลุ่ม Line ทดสอบ Prod', group: 'CCTV Prod [Test]', sel: ['G15006-4002'], st: 1, time: '06:00 – 22:00', tags: [1, 2], on: false }
      ]
    };
  }


  basins() {
    // sample stations per basin (design data)
    return {
      'ลุ่มน้ำปิง': [['G15006-0821', 'อบต.ปิงโค้ง', 'อ.เชียงดาว จ.เชียงใหม่'], ['G15006-0823', 'โรงเรียนบ้านแม่นะ', 'อ.เชียงดาว จ.เชียงใหม่'], ['G15006-0830', 'ฝายแม่ริม', 'อ.แม่ริม จ.เชียงใหม่'], ['G15006-0841', 'เทศบาลตำบลสันกำแพง', 'อ.สันกำแพง จ.เชียงใหม่'], ['G15006-0855', 'สะพานนวรัฐ', 'อ.เมือง จ.เชียงใหม่'], ['G15006-0862', 'อบต.ดอยหล่อ', 'อ.ดอยหล่อ จ.เชียงใหม่']],
      'ลุ่มน้ำน่าน': [['G15006-0512', 'สถานีบ้านกอ', 'อ.แม่จริม จ.น่าน'], ['G15006-0515', 'โรงเรียนบ้านน้ำปาย', 'อ.แม่จริม จ.น่าน'], ['G15006-0520', 'สะพานพัฒนาภาคเหนือ', 'อ.เมือง จ.น่าน'], ['G15006-0531', 'อบต.ท่าวังผา', 'อ.ท่าวังผา จ.น่าน'], ['G15006-0544', 'เทศบาลตำบลเวียงสา', 'อ.เวียงสา จ.น่าน']],
      'ลุ่มน้ำชี': [['G15006-4001', 'เทศบาลตำบลสะอาด', 'อ.น้ำพอง จ.ขอนแก่น'], ['G15006-4002', 'ที่ว่าการอำเภอน้ำพอง', 'อ.น้ำพอง จ.ขอนแก่น'], ['G15006-4006', 'อบต.ป่าปอ', 'อ.บ้านไผ่ จ.ขอนแก่น'], ['G15006-4012', 'สะพานบ้านท่าพระ', 'อ.เมือง จ.ขอนแก่น'], ['G15006-4020', 'อบต.ลาดใหญ่', 'อ.เมือง จ.ชัยภูมิ']],
      'ลุ่มแม่น้ำเจ้าพระยา': [['G15006-1801', 'ที่ว่าการอำเภอเมืองชัยนาท', 'อ.เมือง จ.ชัยนาท'], ['G15006-1802', 'ศูนย์พัฒนาเด็กเล็ก วัดฝาง', 'อ.เมือง จ.ชัยนาท'], ['G15006-1810', 'เขื่อนเจ้าพระยา', 'อ.สรรพยา จ.ชัยนาท'], ['G15006-1822', 'อบต.บางระจัน', 'อ.ค่ายบางระจัน จ.สิงห์บุรี']],
      'ลุ่มน้ำชายฝั่งทะเลตะวันออก': [['G15006-2201', 'หอประชุม ม.17', 'อ.แก่งหางแมว จ.จันทบุรี'], ['G15006-2202', 'เทศบาลตำบลบ่อเวฬุ ม.2', 'อ.ขลุง จ.จันทบุรี'], ['G15006-2203', 'ศาลา ม.6', 'อ.มะขาม จ.จันทบุรี'], ['G15006-2204', 'ศาลา ม.8', 'อ.มะขาม จ.จันทบุรี']]
    };
  }

  openEdit(r) {
    const m = /^(\d\d:\d\d) – (\d\d:\d\d)( \(\+1\))?$/.exec(r.time || '');
    const BS = this.basins();
    const first = (r.sel || [])[0];
    const basin = Object.keys(BS).find((b) => BS[b].some((x) => x[0] === first)) || '';
    this.setState({ quota: false, form: Object.assign(this.blankForm(), {
      editId: r.id, name: r.name, group: r.group, basin, sel: (r.sel || []).slice(), types: r.tags.slice(), on: r.on,
      timeOn: !!m, from: m ? m[1] : '06:00', to: m ? m[2] : '22:00', overnight: !!(m && m[3])
    }) });
  }

  blankForm() { return { name: '', group: '', basin: '', sq: '', sel: [], timeOn: true, from: '06:00', to: '22:00', overnight: false, types: [], on: true, tried: false }; }

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
    const TAG = { 1: ['เฝ้าระวัง', 'lr-tag lr-t1'], 2: ['วิกฤต', 'lr-tag lr-t3'] };
    const say = (msg, undo) => { clearTimeout(this._t); this.setState({ toast: msg, undo: undo || null }); this._t = setTimeout(() => this.setState({ toast: '', undo: null }), 4000); };
    const ql = s.q.trim().toLowerCase();
    const match = s.rules.filter((r) => !ql || (r.name + ' ' + r.group).toLowerCase().indexOf(ql) >= 0);
    const list = match.filter((r) => s.filter === 'all' || (s.filter === 'on') === r.on);
    const key = (r) => (s.sortK === 'name' ? r.name : r.group);
    const sorted = s.sortK ? list.slice().sort((a, b) => s.sortDir * key(a).localeCompare(key(b), 'th')) : list;
    const rows = sorted.map((r, i) => ({
      no: i + 1, name: r.name, group: r.group, st: r.st, time: r.time,
      tags: r.tags.map((t) => ({ label: TAG[t][0], cls: TAG[t][1] })),
      id: r.id, tagCount: r.tags.length, more: (s.ov || {})[r.id] || 0,
      tagsCls: (s.ov || {})[r.id] ? 'lr-tags ov' : 'lr-tags', tcwCls: (s.ov || {})[r.id] ? 'lr-tcw ov' : 'lr-tcw',
      tabIdx: (s.ov || {})[r.id] ? '0' : undefined, tagsAria: 'การแจ้งเตือน: ' + r.tags.map((t) => TAG[t][0]).join(', '),
      on: r.on, stLabel: r.on ? 'เปิด' : 'ปิด', stCls: r.on ? 'lr-st on' : 'lr-st', stAria: 'เปิดการแจ้งเตือน ' + r.name,
      toggle: () => this.setState({ rules: s.rules.map((q) => (q.id === r.id ? Object.assign({}, q, { on: !q.on }) : q)) }),
      edAria: 'แก้ไข ' + r.name, delAria: 'ลบ ' + r.name,
      menu: s.rowMenu === r.id, kbCls: s.rowMenu === r.id ? 'lr-kb on' : 'lr-kb', kbAria: 'จัดการ ' + r.name,
      mnCls: i >= sorted.length - 2 && sorted.length > 3 ? 'lr-mn up' : 'lr-mn',
      openMenu: () => this.setState({ rowMenu: s.rowMenu === r.id ? null : r.id }),
      edit: () => { this.setState({ rowMenu: null }); this.openEdit(r); },
      del: () => this.setState({ rowMenu: null, delId: r.id, quota: false })
    }));

    // ----- create drawer -----
    const BS = this.basins();
    const ALL = {}; Object.keys(BS).forEach((b) => BS[b].forEach((x) => { ALL[x[0]] = { code: x[0], name: x[1], loc: x[2], basin: b }; }));
    const fm = s.form;
    const setF = (patch) => this.setState({ form: Object.assign({}, this.state.form, patch) });
    let cr = { open: false };
    if (fm) {
      const t2m = (t) => { const p = (t || '0:0').split(':'); return (+p[0]) * 60 + (+p[1]); };
      const eName = fm.tried && !fm.name.trim() ? 'กรุณากรอกชื่อกฎ' : '';
      const eGroup = fm.tried && !fm.group ? 'กรุณาเลือก Line Group' : '';
      const eSt = fm.tried && !fm.sel.length ? 'กรุณาเลือกอย่างน้อย 1 สถานี' : '';
      const eType = fm.tried && !fm.types.length ? 'กรุณาเลือกประเภทการแจ้งเตือนอย่างน้อย 1 แบบ' : '';
      const crosses = t2m(fm.to) <= t2m(fm.from);
      const timeHint = fm.timeOn && crosses && !fm.overnight ? 'เวลาสิ้นสุดน้อยกว่าเวลาเริ่มต้น — ติ๊ก "ข้ามวัน" ถ้าต้องการให้ส่งข้ามเที่ยงคืน' : '';
      const eTime = fm.tried && timeHint ? 'ช่วงเวลาไม่ถูกต้อง' : '';
      const sql = fm.sq.trim();
      const inBasin = fm.basin ? BS[fm.basin].filter((x) => !sql || (x[0] + x[1]).indexOf(sql) >= 0) : [];
      const allOn = inBasin.length > 0 && inBasin.every((x) => fm.sel.indexOf(x[0]) >= 0);
      const TYPES = [[1, 'เฝ้าระวัง', 'แจ้งเมื่อปริมาณฝนถึงเกณฑ์เฝ้าระวังของสถานี', '#eab308', 'rgba(234,179,8,.18)'], [2, 'วิกฤต', 'แจ้งเมื่อปริมาณฝนถึงเกณฑ์วิกฤตของสถานี', '#ef4444', 'rgba(239,68,68,.18)']];
      const errs = [eName, eGroup, eSt, eTime, eType].filter(Boolean);
      cr = {
        open: true, title: fm.editId ? 'แก้ไขกฎ' : 'สร้างกฎใหม่', okLabel: fm.editId ? 'บันทึกการแก้ไข' : 'ยืนยัน',
        close: () => this.setState({ form: null }),
        name: fm.name, setName: (e) => setF({ name: e.target.value }), nameCls: eName ? 'cr-in bad' : 'cr-in', eName,
        groupOpts: [{ v: '', l: 'เลือก Line Group', on: !fm.group }].concat(['โต๊ะประชุมข่าวเช้า', 'CCTV Prod [Test]', 'ศูนย์ปฏิบัติการ ปภ.', 'เจ้าหน้าที่ภาคเหนือ', 'เจ้าหน้าที่ภาคตะวันออกเฉียงเหนือ'].map((g) => ({ v: g, l: g, on: fm.group === g }))),
        setGroup: (e) => setF({ group: e.target.value }), groupCls: eGroup ? 'cr-sel bad' : 'cr-sel', eGroup,
        basinOpts: [{ v: '', l: 'เลือกลุ่มแม่น้ำ', on: !fm.basin }].concat(Object.keys(BS).map((b) => ({ v: b, l: b + ' (' + BS[b].length + ')', on: fm.basin === b }))),
        setBasin: (e) => setF({ basin: e.target.value, sq: '' }),
        sq: fm.sq, setSq: (e) => setF({ sq: e.target.value }),
        noBasin: !fm.basin, hasList: inBasin.length > 0, noMatch: !!fm.basin && inBasin.length === 0,
        listCount: fm.basin ? BS[fm.basin].length : 0,
        allLabel: allOn ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด',
        toggleAll: () => { const codes = inBasin.map((x) => x[0]); setF({ sel: allOn ? fm.sel.filter((c) => codes.indexOf(c) < 0) : Array.from(new Set(fm.sel.concat(codes))) }); },
        list: inBasin.map((x) => { const on = fm.sel.indexOf(x[0]) >= 0; return { code: x[0], name: x[1], loc: x[2], on, toggle: () => setF({ sel: on ? fm.sel.filter((c) => c !== x[0]) : fm.sel.concat(x[0]) }) }; }),
        selCount: fm.sel.length, noSel: !fm.sel.length, hasSel: fm.sel.length > 0, eSt,
        sel: fm.sel.map((c) => ({ name: ALL[c].name, aria: 'เอา ' + ALL[c].name + ' ออก', rm: () => setF({ sel: fm.sel.filter((q) => q !== c) }) })),
        timeOn: fm.timeOn, timeTg: fm.timeOn ? 'cr-tg on' : 'cr-tg', toggleTime: () => setF({ timeOn: !fm.timeOn }),
        from: fm.from, to: fm.to, setFrom: (e) => setF({ from: e.target.value }), setTo: (e) => setF({ to: e.target.value }),
        overnight: fm.overnight, toggleOvernight: () => setF({ overnight: !fm.overnight }), timeHint,
        types: TYPES.map(([id, label, desc, c, bg]) => { const on = fm.types.indexOf(id) >= 0; return { label, desc, on, cls: on ? 'cr-type on' : 'cr-type', vars: '--c: ' + c + '; --bg: ' + bg + ';', toggle: () => setF({ types: on ? fm.types.filter((q) => q !== id) : fm.types.concat(id).sort() }) }; }),
        eType,
        on: fm.on, onTg: fm.on ? 'cr-tg on' : 'cr-tg', onLabel: fm.on ? 'เปิด' : 'ปิด', toggleOn: () => setF({ on: !fm.on }),
        sum: fm.tried && errs.length ? 'ยังบันทึกไม่ได้ — กรอกข้อมูลที่จำเป็นให้ครบ (' + errs.length + ' จุด)' : '',
        submit: () => {
          const ok = fm.name.trim() && fm.group && fm.sel.length && fm.types.length && !(fm.timeOn && crosses && !fm.overnight);
          if (!ok) { setF({ tried: true }); return; }
          const id = fm.editId || 'r' + (s.seq + 1);
          const rule = { id, sel: fm.sel.slice(), name: fm.name.trim(), group: fm.group, st: fm.sel.length, time: fm.timeOn ? fm.from + ' – ' + fm.to + (fm.overnight ? ' (+1)' : '') : '24 ชั่วโมง', tags: fm.types.slice(), on: fm.on };
          if (fm.editId) { this.setState({ rules: s.rules.map((q) => (q.id === id ? rule : q)), form: null }); say('บันทึกการแก้ไข "' + rule.name + '" แล้ว'); return; }
          this.setState({ rules: s.rules.concat(rule), seq: s.seq + 1, form: null, filter: 'all', q: '' });
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
      confirm: () => { const prev = s.rules; this.setState({ rules: s.rules.filter((q) => q.id !== dr.id), delId: null }); say('ลบกฎ "' + dr.name + '" แล้ว', prev); }
    } : { open: false };
    return {
      rowMenu: !!s.rowMenu, closeMenu: () => this.setState({ rowMenu: null }),
      isLight: theme === 'light', isDark: theme !== 'light', thLightCls: theme === 'light' ? 'on' : '', thDarkCls: theme !== 'light' ? 'on' : '',
      setLight: () => setTheme('light'), setDark: () => setTheme('dark'), rootCls: theme === 'light' ? 'sx lt' : 'sx',
      goCriteria: () => this.props.goCriteria?.(),
      goMaster: () => this.props.goMaster?.(),
      goCentral: () => this.props.goCentral?.(),
      goMap: () => { if (this.props && typeof this.props.goMap === 'function') this.props.goMap(); },
      dl, cr, stop: (e) => e.stopPropagation(), openCreate: () => this.setState({ form: this.blankForm(), quota: false }),
      goStations: () => { if (this.props && typeof this.props.goStations === 'function') this.props.goStations(); },
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
