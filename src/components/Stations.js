import { DCLogic, createElement } from '../runtime.js';

export default class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { page: 'stations', q: '', basin: '', stat: '', menu: null, modal: null, mode: 'edit', draft: null, overrides: {}, hidden: { 'G15006-2204': true, 'G15006-4006': true }, toast: '' };
  }

  // Area Threshold List (inherited) — [watch, critical] in mm; critical null = no critical level. Sample values.
  base() {
    return [
      ['h1', 'ฝนสะสม 1 ชม.', 40, null],
      ['h3', 'ฝนสะสม 3 ชม.', 30, 50],
      ['h24', 'ฝนสะสม 24 ชม.', 30, 80],
      ['d3', 'ฝนสะสม 3 วัน', 80, 160],
      ['d5', 'ฝนสะสม 5 วัน', 100, 190],
      ['d7', 'ฝนสะสม 7 วัน', 120, 220]
    ];
  }

  stations() {
    // sample rows (design data)
    return [
      ['G15006-1801', 'ที่ว่าการอำเภอเมืองชัยนาท', 'ต.ในเมือง อ.เมือง จ.ชัยนาท', 'ลุ่มแม่น้ำเจ้าพระยา', '15 นาที', 'สมชาย ใจดี', '27/07/2568 14:30', true, 'กรมทรัพยากรน้ำ'],
      ['G15006-1802', 'ศูนย์พัฒนาเด็กเล็ก วัดฝาง', 'ต.ชัยนาท อ.เมือง จ.ชัยนาท', 'ลุ่มแม่น้ำเจ้าพระยา', '15 นาที', 'สมศรี วงค์แก้ว', '27/07/2568 13:15', true, 'กรมทรัพยากรน้ำ'],
      ['G15006-2201', 'หอประชุม ม.17', 'ต.ขุนซ่อง อ.แก่งหางแมว จ.จันทบุรี', 'ลุ่มน้ำชายฝั่งทะเลตะวันออก', '30 นาที', 'วิมล จันทร์สว่าง', '25/07/2568 10:00', false, 'กรมป้องกันและบรรเทาสาธารณภัย'],
      ['G15006-2204', 'ศาลา ม.8', 'ต.ปัถวี อ.มะขาม จ.จันทบุรี', 'ลุ่มน้ำชายฝั่งทะเลตะวันออก', '15 นาที', 'ประยุทธ์ ชาวนา', '24/07/2568 09:45', false, 'กรมป้องกันและบรรเทาสาธารณภัย'],
      ['G15006-2202', 'เทศบาลตำบลบ่อเวฬุ ม.2', 'ต.บ่อเวฬุ อ.ขลุง จ.จันทบุรี', 'ลุ่มน้ำชายฝั่งทะเลตะวันออก', '15 นาที', 'มานี ปิ่นแก้ว', '20/07/2568 16:20', true, 'กรมป้องกันและบรรเทาสาธารณภัย'],
      ['G15006-2203', 'ศาลา ม.6', 'ต.ปัถวี อ.มะขาม จ.จันทบุรี', 'ลุ่มน้ำชายฝั่งทะเลตะวันออก', '15 นาที', 'วรรณา สุขใจ', '22/07/2568 11:30', true, 'กรมป้องกันและบรรเทาสาธารณภัย'],
      ['G15006-4001', 'เทศบาลตำบลสะอาด', 'ต.สะอาด อ.น้ำพอง จ.ขอนแก่น', 'ลุ่มน้ำชี', '30 นาที', 'ศิริพร ดอกไม้', '18/07/2568 08:00', false, 'กรมทรัพยากรน้ำ'],
      ['G15006-4002', 'ที่ว่าการอำเภอน้ำพอง', 'ต.วังชัย อ.น้ำพอง จ.ขอนแก่น', 'ลุ่มน้ำชี', '15 นาที', 'อนุชา มาลัย', '15/07/2568 14:00', true, 'กรมทรัพยากรน้ำ'],
      ['G15006-4006', 'อบต.ป่าปอ', 'ต.ป่าปอ อ.บ้านไผ่ จ.ขอนแก่น', 'ลุ่มน้ำชี', '15 นาที', 'พิชัย ศรีทอง', '12/07/2568 10:30', false, 'กรมทรัพยากรน้ำ'],
      ['G15006-0512', 'สถานีบ้านกอ', 'ต.แม่จริม อ.แม่จริม จ.น่าน', 'ลุ่มน้ำน่าน', '15 นาที', 'ธนพล คำมา', '11/07/2568 07:20', true, 'กรมทรัพยากรน้ำ'],
      ['G15006-0515', 'โรงเรียนบ้านน้ำปาย', 'ต.น้ำปาย อ.แม่จริม จ.น่าน', 'ลุ่มน้ำน่าน', '15 นาที', 'ณัฐธิดา ใจงาม', '10/07/2568 18:05', true, 'กรมทรัพยากรน้ำ'],
      ['G15006-0821', 'อบต.ปิงโค้ง', 'ต.ปิงโค้ง อ.เชียงดาว จ.เชียงใหม่', 'ลุ่มน้ำปิง', '30 นาที', 'กิตติ ทองดี', '09/07/2568 12:40', true, 'กรมทรัพยากรน้ำ']
    ].map((r, i) => ({ code: r[0], name: r[1], loc: r[2], basin: r[3], freq: r[4], owner: r[5], upd: r[6], online: r[7], agency: r[8], no: 61 + i }));
  }

  renderVals() {
    const s = this.state;
    const theme = (this.props && this.props.theme) || this.state.theme || 'dark';
    const setTheme = (v) => { if (this.props && typeof this.props.setTheme === 'function') this.props.setTheme(v); else this.setState({ theme: v }); };
    const ST = this.stations();
    const B = this.base();
    const ql = s.q.trim();
    const list = ST.filter((x) => (!ql || (x.code + x.name + x.loc).indexOf(ql) >= 0) && (!s.basin || x.basin === s.basin) && (!s.stat || (s.stat === 'on') === x.online));
    const closeMenu = () => this.setState({ menu: null });
    const cp = (o) => JSON.parse(JSON.stringify(o));
    const openTh = (x) => () => {
      const ov = s.overrides[x.code] || {};
      const vals = {};
      B.forEach(([k, , w, c]) => { vals[k] = ov[k] ? ov[k].slice() : [w, c]; });
      this.setState({ menu: null, modal: x.code, mode: 'edit', draft: vals });
    };
    const rows = list.map((x) => ({
      no: x.no, code: x.code, name: x.name, loc: x.loc, loc1: x.loc.split(' จ.')[0], loc2: x.loc.indexOf(' จ.') >= 0 ? 'จ.' + x.loc.split(' จ.')[1] : '', updD: x.upd.split(' ')[0], updT: x.upd.split(' ')[1], basin: x.basin, freq: x.freq, owner: x.owner, upd: x.upd,
      own: !!s.overrides[x.code],
      st: x.online ? 'Online' : 'Offline', stCls: x.online ? 'st-on' : 'st-off',
      show: !s.hidden[x.code], tgCls: s.hidden[x.code] ? 'tgx' : 'tgx on', tgAria: 'แสดงผล ' + x.name,
      toggle: () => this.setState({ hidden: Object.assign({}, s.hidden, { [x.code]: !s.hidden[x.code] }) }),
      menu: s.menu === x.code, kbCls: s.menu === x.code ? 'kb on' : 'kb', kbAria: 'จัดการ ' + x.name,
      openMenu: () => this.setState({ menu: s.menu === x.code ? null : x.code }),
      openTh: openTh(x)
    }));
    const basins = Array.from(new Set(ST.map((x) => x.basin)));

    // ----- modal -----
    let m = { rows: [] };
    const x = s.modal ? ST.find((q) => q.code === s.modal) : null;
    if (x && s.draft) {
      const d = s.draft;
      const isView = false;
      const errs = [];
      const setV = (k, i) => (e) => {
        const raw = e.target.value;
        const v = raw === '' ? null : Math.max(0, parseFloat(raw));
        const n = cp(this.state.draft); n[k][i] = isNaN(v) ? null : v; this.setState({ draft: n });
      };
      m = {
        name: x.name, code: x.code, agency: x.agency, loc: x.loc.replace(' อ.', ' อ.'),
        isView, isEdit: !isView, viewCls: isView ? 'on' : '', editCls: isView ? '' : 'on',
        rows: B.map(([k, label, bw, bc]) => {
          const [w, c] = d[k];
          const own = w !== bw || c !== bc;
          const wBad = w == null || !(w > 0);
          const cBad = c != null && w != null && !(c > w);
          if (wBad) errs.push(label + ' ต้องมีค่าเฝ้าระวัง');
          if (cBad) errs.push(label + ' ค่าวิกฤตต้องมากกว่าเฝ้าระวัง');
          return {
            label, w: w == null ? '' : w, c: c == null ? '' : c,
            wHint: 'และ < ' + (c == null ? '—' : c) + ' มม.',
            wAria: label + ' เฝ้าระวัง (มม.)', cAria: label + ' วิกฤต (มม.)',
            wCls: wBad ? 'bad' : (w !== bw ? 'ch' : ''), cCls: cBad ? 'bad' : (c !== bc ? 'ch' : ''),
            own, src: own ? 'รายสถานี' : 'Inherit List', srcCls: own ? 'chp c-st' : 'chp c-in',
            base: bw + ' / ' + (bc == null ? '—' : bc) + ' มม.',
            setW: setV(k, 0), setC: setV(k, 1),
            reset: () => { const n = cp(this.state.draft); n[k] = [bw, bc]; this.setState({ draft: n }); }
          };
        }),
        err: errs.join(' · '),
        saveDis: isView || errs.length > 0
      };
    }
    const save = () => {
      const d = s.draft; const ov = {};
      B.forEach(([k, , w, c]) => { if (d[k][0] !== w || d[k][1] !== c) ov[k] = d[k].slice(); });
      const o = Object.assign({}, s.overrides);
      if (Object.keys(ov).length) o[s.modal] = ov; else delete o[s.modal];
      const n = Object.keys(ov).length;
      this.setState({ overrides: o, modal: null, draft: null, toast: n ? 'บันทึกเกณฑ์รายสถานีของ ' + x.name + ' แล้ว (' + n + ' ช่วงสะสม)' : x.name + ' กลับไปใช้เกณฑ์จาก Area List' });
      clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: '' }), 3000);
    };

    return {
      isLight: theme === 'light', isDark: theme !== 'light', thLightCls: theme === 'light' ? 'on' : '', thDarkCls: theme !== 'light' ? 'on' : '',
      setLight: () => setTheme('light'), setDark: () => setTheme('dark'), rootCls: theme === 'light' ? 'sx lt' : 'sx',
      goMap: () => { if (this.props && typeof this.props.goMap === 'function') this.props.goMap(); },
      theme, setThemeFn: setTheme,
      onStations: s.page === 'stations', onLine: s.page === 'line', onCriteria: s.page === 'criteria', goCriteria: () => this.setState({ page: 'criteria', menu: null, modal: null }),
      goLine: () => this.setState({ page: 'line', menu: null, modal: null }), goStations: () => this.setState({ page: 'stations' }),
      q: s.q, setQ: (e) => this.setState({ q: e.target.value }),
      basinOpts: [{ v: '', l: 'ลุ่มแม่น้ำ: ทั้งหมด', on: !s.basin }].concat(basins.map((b) => ({ v: b, l: 'ลุ่มแม่น้ำ: ' + b.replace('ลุ่มแม่น้ำ', '').replace('ลุ่มน้ำ', ''), on: s.basin === b }))),
      setBasin: (e) => this.setState({ basin: e.target.value }),
      statOpts: [['', 'สถานะ: ทั้งหมด'], ['on', 'สถานะ: Online'], ['off', 'สถานะ: Offline']].map(([v, l]) => ({ v, l, on: s.stat === v })),
      setStat: (e) => this.setState({ stat: e.target.value }),
      rows, anyMenu: !!s.menu, closeMenu,
      modalOpen: !!x, m,
      stop: (e) => e.stopPropagation(),
      closeModal: () => this.setState({ modal: null, draft: null }),
      setView: () => this.setState({ mode: 'view' }), setEdit: () => this.setState({ mode: 'edit' }),
      resetAll: () => { const n = {}; B.forEach(([k, , w, c]) => { n[k] = [w, c]; }); this.setState({ draft: n }); },
      save,
      toast: s.toast
    };
  }
}
