import { effectiveThreshold } from '../threshold-settings.js';
import { RAIN_LEVELS, RAIN_COLORS } from '../rain-criteria.js';
import { DCLogic, createElement } from '../runtime.js';

export default class Component extends DCLogic {
  criteriaContext(r, metric, period, value, unit, metricLabel) {
    const status = this.dataStat(r);
    const index = this.data().R.findIndex(item => item[0] === r[0]);
    const code = r[0].startsWith('tw-') ? r[0].slice(3) : 'G15006-' + (5501 + index * 13);
    return { id: r[0], code, name: r[1], location: 'ต.' + r[2] + ' อ.' + r[3] + ' จ.' + r[4],
      metric, period, value, unit, metricLabel, province:r[4], offline: !!status.silent };
  }
  scrollTab() {
    try {
      document.querySelectorAll('.ex-tabs').forEach((box) => {
        const on = box.querySelector('.ex-tab.on'); if (!on) return;
        const want = on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2;
        box.scrollTo({ left: Math.max(0, want), behavior: 'smooth' });
      });
    } catch (e) {}
  }
  componentDidMount() {
    this.fit = () => {
      const w = window.innerWidth || 1920, h = window.innerHeight || 1080;
      const k = Math.min(w / 1920, h / 1080);
      const dw = Math.max(0, Math.floor(w / k - 1920));
      const f = { k, dw, x: dw ? 0 : Math.round((w - 1920 * k) / 2), y: Math.round((h - 1080 * k) / 2) };
      const o = this.state.fit;
      if (!o || Math.abs(o.k - f.k) > 0.0005 || o.x !== f.x || o.y !== f.y || o.dw !== f.dw) this.setState({ fit: f });
    };
    this.fit();
    this.scheduleToasts();
    this.attachWheel();
    window.addEventListener('resize', this.fit);
    this.onKey = (e) => { if (e.key !== 'Escape') return; if (this.state.ssOpen) { this.setState({ ssOpen: false }); return; } if (this.state.dd) { this.setState({ dd: null }); return; } if (this.state.inbox) this.setState({ inbox: false }); else if (this.state.mOpen) this.setState({ mOpen: false }); else if (this.state.lyOpen) this.setState({ lyOpen: false }); else if (this.state.tw) this.setState({ tw: null }); else if (this.state.bmOpen) this.setState({ bmOpen: false }); else if (this.state.hist) this.setState({ hist: null }); else if (this.state.qr) this.setState({ qr: false }); else if (this.state.st) this.setState({ st: null }); };
    window.addEventListener('keydown', this.onKey);
    // demo: a new alert arrives now and then (max 4)
    this.sim = setInterval(() => {
      const ex = this.state.extra || [];
      if (ex.length >= 4) { clearInterval(this.sim); return; }
      const { R } = this.data();
      const pool = R.filter((r) => r[7] != null && r[7] > 20 && r[7] <= 35);
      const r = pool[(ex.length * 7 + 3) % pool.length];
      this.setState({ extra: [{ id: 'new' + ex.length + ':' + r[0], st: r[0], v: Math.round((36 + ex.length * 9.3) * 10) / 10 }].concat(ex) });
    }, 25000);
  }

  // toasts close themselves ~8 s after they appear (hovering keeps one open)
  scheduleToasts() {
    this._tT = this._tT || {};
    (this._tq || []).forEach((id) => {
      if (this._tT[id]) return;
      const fire = () => { if (this._tHold === id) { this._tT[id] = setTimeout(fire, 2000); return; } this.setState((st) => ({ gone: Object.assign({}, st.gone, { [id]: true }), tstCut: true })); };
      this._tT[id] = setTimeout(fire, 8000);
    });
  }
  // mouse-wheel zoom on the map (non-passive listener so the page / canvas does not scroll instead)
  attachWheel() {
    const el = document.querySelector('.ex .ex-map');
    if (!el || el === this._wEl) return;
    if (this._wEl) this._wEl.removeEventListener('wheel', this._onWheel);
    this._onWheel = this._onWheel || ((e) => { e.preventDefault(); const now = Date.now(); if (Math.abs(e.deltaY) < 2 || now - (this._wT || 0) < 160) return; this._wT = now; if (this._wheelFn) this._wheelFn(e); });
    el.addEventListener('wheel', this._onWheel, { passive: false });
    this._wEl = el;
  }
  componentDidUpdate() { this.scheduleToasts(); this.attachWheel(); }

  componentWillUnmount() { if (this._wEl && this._onWheel) this._wEl.removeEventListener('wheel', this._onWheel); if (this._tT) Object.values(this._tT).forEach((t) => clearTimeout(t)); if (this.sim) clearInterval(this.sim); if (this.fit) window.removeEventListener('resize', this.fit); if (this.onKey) window.removeEventListener('keydown', this.onKey); }

  constructor(props) {
    super(props);
    this.state = { theme: 'dark', crit: 'tw', amp: '', tam: '', zi: 0, zc: null, hl: true, basin: '', inbox: false, ibTab: 'all', ibLv: 'all', readIds: {}, gone: {}, extra: [], lyOwn: true, lyTw: true, nocl: false, layHid: { runoff: true, dam: true, vil: true }, rainExp: true, lyOpen: false, pnl: null, cctvOff: true, agDd: true, damDd: false, exB: false, exP: false, exA: false, exW: false, exR: false, wx: false, wxVar: 'cloud', rainObs: false, rainT: 2, rainFc: false, radar: false, mp: {}, bsel: {}, psel: {}, tw: null, metric: 'rain', mOpen: false, stAll: false, basemap: 'dark', bmOpen: false, hr: false, screen: globalThis.location?.hash.startsWith('#stations') ? 'admin' : 'map', period: 'd1', hidden: {}, legend: true, page: 1, size: 10, sel: null, tip: null, menu: false, prov: '' };
  }

  data() {
    // sample stations (same set as the reference screenshot): [id, name, tambon, amphoe, province, x, y, 24h, 3d, 5d]
    const R = [["s1","องค์การบริหารส่วนตำบลขุนน่าน","ขุนน่าน","เฉลิมพระเกียรติ","น่าน",380,140,270,437.7,577.2],["s2","โรงเรียนบ้านวังเบน","บ่อทอง","ทองแสนขัน","อุตรดิตถ์",313,288,158.2,215.8,290.6],["s3","องค์การบริหารส่วนตำบลเวียงทอง","เวียงทอง","สูงเม่น","แพร่",282,265,98.8,128.1,173.1],["s4","โรงเรียนบ้านปง(วัฒนาวิทยาคาร)","ต้าผามอก","ลอง","แพร่",257,268,94,152.4,192.1],["s5","เทศบาลตำบลนาน้อย","นาน้อย","นาน้อย","น่าน",347,238,91.6,124.3,177],["s6","องค์การบริหารส่วนตำบลบ่อเบี้ย","บ่อเบี้ย","บ้านโคก","อุตรดิตถ์",367,270,80.2,107.1,135.8],["s7","โรงเรียนบ้านบ้านใหม่","บ้านใหม่","เมืองอุบลราชธานี","อุบลราชธานี",745,564,51,71.4,83.4],["s8","โรงเรียนบ้านวังหิน","วังหิน","เมืองเพชรบูรณ์","เพชรบูรณ์",370,456,59.9,87.3,114],["s9","โรงเรียนบ้านหนองแวง","หนองแวง","เมืองร้อยเอ็ด","ร้อยเอ็ด",672,485,59.1,74.3,91.4],["s10","องค์การบริหารส่วนตำบลห้วยไร่","ห้วยไร่","เมืองสระบุรี","สระบุรี",364,629,62.6,82.7,95.9],["s11","เทศบาลตำบลห้วยทราย","ห้วยทราย","เมืองชัยภูมิ","ชัยภูมิ",458,464,54,91.9,106.3],["s12","โรงเรียนบ้านศรีสำราญ","ศรีสำราญ","เมืองปราจีนบุรี","ปราจีนบุรี",394,672,65.1,112,150.2],["s13","โรงเรียนบ้านทุ่งโพธิ์","ทุ่งโพธิ์","เมืองเพชรบูรณ์","เพชรบูรณ์",359,463,45.7,71.2,99.5],["s14","เทศบาลตำบลแม่สิน","แม่สิน","เมืองขอนแก่น","ขอนแก่น",586,396,42.5,63,77.8],["s15","เทศบาลตำบลแม่สิน","แม่สิน","เมืองสระแก้ว","สระแก้ว",460,723,35.9,48.6,66.1],["s16","โรงเรียนบ้านคำเตย","คำเตย","เมืองชลบุรี","ชลบุรี",378,720,36.1,58.6,74.7],["s17","องค์การบริหารส่วนตำบลสันทราย","สันทราย","เมืองศรีสะเกษ","ศรีสะเกษ",682,543,43,75,104.6],["s18","โรงเรียนบ้านโนนสูง","โนนสูง","เมืองแม่ฮ่องสอน","แม่ฮ่องสอน",114,174,40.9,60.8,72.9],["s19","องค์การบริหารส่วนตำบลม่วงหวาน","ม่วงหวาน","เมืองอุตรดิตถ์","อุตรดิตถ์",269,324,38.8,63.4,76.8],["s20","เทศบาลตำบลโคกสูง","โคกสูง","เมืองเชียงใหม่","เชียงใหม่",207,170,45.6,78.6,95.2],["s21","องค์การบริหารส่วนตำบลดงมะไฟ","ดงมะไฟ","เมืองสระบุรี","สระบุรี",383,600,44.9,61.9,88.6],["s22","เทศบาลตำบลดงมะไฟ","ดงมะไฟ","เมืองสุโขทัย","สุโขทัย",240,378,43,57.2,82.5],["s23","โรงเรียนบ้านโคกสูง","โคกสูง","เมืองจันทบุรี","จันทบุรี",462,769,35.1,50.2,67.9],["s24","โรงเรียนบ้านห้วยไร่","ห้วยไร่","เมืองอุทัยธานี","อุทัยธานี",308,517,42.2,66.1,92.1],["s25","เทศบาลตำบลวังหิน","วังหิน","เมืองขอนแก่น","ขอนแก่น",527,424,37.3,47.8,59.2],["s26","เทศบาลตำบลป่าแดง","ป่าแดง","เมืองชลบุรี","ชลบุรี",384,701,47.9,76.4,110.9],["s27","โรงเรียนบ้านทุ่งใหญ่","ทุ่งใหญ่","เมืองอุตรดิตถ์","อุตรดิตถ์",305,312,47.7,61.3,84.7],["s28","โรงเรียนบ้านบ่อแก้ว","บ่อแก้ว","เมืองนครสวรรค์","นครสวรรค์",261,530,42.5,68.7,95.8],["s29","โรงเรียนบ้านเขาดิน","เขาดิน","เมืองตาก","ตาก",179,393,46.4,64,92.2],["s30","องค์การบริหารส่วนตำบลวังหิน","วังหิน","เมืองระยอง","ระยอง",407,803,46,70.4,97.8],["s31","เทศบาลตำบลบ่อแก้ว","บ่อแก้ว","เมืองเพชรบุรี","เพชรบุรี",256,758,27.6,39.9,54.5],["s32","องค์การบริหารส่วนตำบลศรีสำราญ","ศรีสำราญ","เมืองนครราชสีมา","นครราชสีมา",480,543,24.8,43.2,56.2],["s33","องค์การบริหารส่วนตำบลทุ่งโพธิ์","ทุ่งโพธิ์","เมืองสุพรรณบุรี","สุพรรณบุรี",265,610,21,28.8,37.8],["s34","เทศบาลตำบลหนองหิน","หนองหิน","เมืองเลย","เลย",455,285,24.4,32.8,40.4],["s35","องค์การบริหารส่วนตำบลทุ่งใหญ่","ทุ่งใหญ่","เมืองกาฬสินธุ์","กาฬสินธุ์",648,417,31,43.8,59.8],["s36","โรงเรียนบ้านบ่อแก้ว","บ่อแก้ว","เมืองปราจีนบุรี","ปราจีนบุรี",425,684,21.4,31.9,44.1],["s37","โรงเรียนบ้านทุ่งโพธิ์","ทุ่งโพธิ์","เมืองศรีสะเกษ","ศรีสะเกษ",679,578,27.7,47.6,57.2],["s38","องค์การบริหารส่วนตำบลห้วยทราย","ห้วยทราย","เมืองพะเยา","พะเยา",251,162,32,41.4,57.8],["s39","โรงเรียนบ้านคำเตย","คำเตย","เมืองสกลนคร","สกลนคร",689,317,34.9,49,64.1],["s40","องค์การบริหารส่วนตำบลวังยาง","วังยาง","เมืองน่าน","น่าน",358,186,21.5,27.1,39.1],["s41","โรงเรียนบ้านนาโพธิ์","นาโพธิ์","เมืองสุพรรณบุรี","สุพรรณบุรี",273,609,28.6,36.4,47.8],["s42","เทศบาลตำบลท่าสะอาด","ท่าสะอาด","เมืองนครสวรรค์","นครสวรรค์",273,484,33.6,55.3,65.3],["s43","โรงเรียนบ้านห้วยไร่","ห้วยไร่","เมืองชัยภูมิ","ชัยภูมิ",485,505,16.5,26.1,38],["s44","เทศบาลตำบลนาแก","นาแก","เมืองสุพรรณบุรี","สุพรรณบุรี",282,652,15.5,22.5,28.1],["s45","โรงเรียนบ้านทุ่งโพธิ์","ทุ่งโพธิ์","เมืองอุทัยธานี","อุทัยธานี",300,535,16,26.5,33.5],["s46","องค์การบริหารส่วนตำบลศรีสำราญ","ศรีสำราญ","เมืองอุบลราชธานี","อุบลราชธานี",736,566,11.6,19.1,24.1],["s47","โรงเรียนบ้านสันทราย","สันทราย","เมืองเชียงราย","เชียงราย",245,89,10.5,17.7,23.8],["s48","โรงเรียนบ้านหนองหิน","หนองหิน","เมืองอุบลราชธานี","อุบลราชธานี",791,557,10.6,16.5,21.9],["s49","โรงเรียนบ้านบ่อแก้ว","บ่อแก้ว","เมืองนครราชสีมา","นครราชสีมา",479,594,11,14.5,17.5],["s50","โรงเรียนบ้านนาจาน","นาจาน","เมืองขอนแก่น","ขอนแก่น",566,438,2.9,5.2,6.6],["s51","เทศบาลตำบลวังหิน","วังหิน","เมืองพะเยา","พะเยา",302,174,6.2,10.5,13.5],["s52","องค์การบริหารส่วนตำบลม่วงหวาน","ม่วงหวาน","เมืองกาญจนบุรี","กาญจนบุรี",179,664,1.2,1.9,2.7],["s53","เทศบาลตำบลสันทราย","สันทราย","เมืองกาฬสินธุ์","กาฬสินธุ์",600,461,2.3,4.1,5.9],["s54","เทศบาลตำบลวังยาง","วังยาง","เมืองอุตรดิตถ์","อุตรดิตถ์",256,303,4.7,7.1,10],["s55","เทศบาลตำบลหัวฝาย","หัวฝาย","เมืองชัยภูมิ","ชัยภูมิ",486,473,7.9,10,14],["s56","เทศบาลตำบลนาหว้า","นาหว้า","เมืองศรีสะเกษ","ศรีสะเกษ",671,565,8.7,13.1,16.2],["s57","เทศบาลตำบลศรีสำราญ","ศรีสำราญ","เมืองชลบุรี","ชลบุรี",391,745,7.7,12.3,16.1],["s58","เทศบาลตำบลดงมะไฟ","ดงมะไฟ","เมืองบุรีรัมย์","บุรีรัมย์",594,544,2.5,4,5.2],["s59","โรงเรียนบ้านห้วยไร่","ห้วยไร่","เมืองกาญจนบุรี","กาญจนบุรี",215,622,7.9,10.8,15.3],["s60","เทศบาลตำบลม่วงหวาน","ม่วงหวาน","เมืองสกลนคร","สกลนคร",698,387,2.6,3.8,5.1],["s61","โรงเรียนบ้านห้วยทราย","ห้วยทราย","เมืองสุโขทัย","สุโขทัย",227,361,null,null,null],["s62","เทศบาลตำบลหนองหิน","หนองหิน","เมืองลพบุรี","ลพบุรี",359,591,null,null,null],["s63","โรงเรียนบ้านดงมะไฟ","ดงมะไฟ","เมืองชัยภูมิ","ชัยภูมิ",501,469,null,null,null],["s64","โรงเรียนบ้านบ้านใหม่","บ้านใหม่","เมืองเพชรบุรี","เพชรบุรี",274,779,null,null,null],["s65","องค์การบริหารส่วนตำบลบ้านใหม่","บ้านใหม่","เมืองสกลนคร","สกลนคร",667,361,null,null,null],["s66","องค์การบริหารส่วนตำบลแม่สิน","แม่สิน","เมืองพะเยา","พะเยา",245,155,null,null,null],["s67","เทศบาลตำบลท่าสะอาด","ท่าสะอาด","เมืองเพชรบูรณ์","เพชรบูรณ์",393,466,null,null,null],["s68","โรงเรียนบ้านคำเตย","คำเตย","เมืองเพชรบุรี","เพชรบุรี",268,766,null,null,null],["s69","โรงเรียนบ้านโนนสูง","โนนสูง","เมืองศรีสะเกษ","ศรีสะเกษ",674,543,null,null,null],["s70","เทศบาลตำบลศรีสำราญ","ศรีสำราญ","เมืองพะเยา","พะเยา",229,144,null,null,null]];
    // pin positions measured from the reference map (px inside the 885×867 map) with their 24h level
    const P = [["c90",118,142],["c90",720,161],["c90",396,430],["c90",295,446],["c90",268,718],["c70",293,678],["c50",369,174],["c50",167,200],["c50",689,297],["c50",832,348],["c50",230,410],["c50",307,818],["c35",284,56],["c35",106,96],["c35",309,128],["c35",543,185],["c35",337,198],["c35",699,234],["c35",210,286],["c35",262,324],["c35",561,330],["c35",297,380],["c35",529,414],["c35",258,452],["c35",363,452],["c35",156,469],["c35",179,520],["c35",315,580],["c35",291,655],["c35",275,743],["c20",325,98],["c20",172,180],["c20",247,256],["c20",441,255],["c20",615,266],["c20",371,316],["c20",202,357],["c20",470,372],["c20",271,416],["c20",890,424],["c20",791,450],["c20",187,468],["c10",377,143],["c10",569,202],["c10",524,240],["c10",211,404],["c10",610,428],["c10",339,546],["c10",272,660],["c0",423,20],["c0",181,92],["c0",399,128],["c0",581,152],["c0",195,208],["c0",331,478],["c0",287,484],["c0",373,552],["c0",233,579],["c0",501,668],["c0",293,740],["none",282,285],["none",652,360],["none",524,599]];
    // pin positions on the wide map (1864×867) — all kept inside the Thailand border (Natural Earth 50m, same Web-Mercator fit)
    const PW = [["c90",537,142],["c90",1139,161],["c90",815,430],["c90",714,446],["c90",687,718],["c70",712,678],["c50",788,174],["c50",586,200],["c50",1108,297],["c50",1251,348],["c50",649,410],["c50",726,818],["c35",703,56],["c35",525,96],["c35",728,128],["c35",962,185],["c35",756,198],["c35",1118,234],["c35",629,286],["c35",681,324],["c35",980,330],["c35",716,380],["c35",948,414],["c35",677,452],["c35",782,452],["c35",575,469],["c35",598,520],["c35",734,580],["c35",710,655],["c35",694,743],["c20",744,98],["c20",591,180],["c20",666,256],["c20",860,255],["c20",1034,266],["c20",790,316],["c20",621,357],["c20",889,372],["c20",690,416],["c20",1309,424],["c20",1210,450],["c20",606,468],["c10",796,143],["c10",988,202],["c10",943,240],["c10",630,404],["c10",1029,428],["c10",758,546],["c10",691,660],["c0",842,20],["c0",600,92],["c0",818,128],["c0",1000,152],["c0",614,208],["c0",750,478],["c0",706,484],["c0",792,552],["c0",652,579],["c0",920,668],["c0",712,740],["none",701,285],["none",1071,360],["none",943,599]];
    // ThaiWater (thaiwater.net) rain gauges — real 24 h rainfall snapshot (7 ต.ค. 2569), only those inside the map view
    // [code, name, tambon, amphoe, province, lat, lon, rain24h, agency, time, wideX, wideY]  (wideX/Y = px on the 1864×867 map, Web-Mercator fit)
    const TW = [["313781236","บ้านปางสวรรค์","คอกควาย","บ้านไร่","อุทัยธานี",15.20317,99.42024,57,"ทน.","14:00",710,451],["313778435","หน่วยพิทักษ์ป่าเขาปันโส","คอกควาย","บ้านไร่","อุทัยธานี",15.23958,99.40895,56.8,"พพภ","15:00",709,446],["313779815","อบต.คลองตะเกรา","คลองตะเกรา","ท่าตะเกียบ","ฉะเชิงเทรา",13.41823,101.64146,47.2,"สสน.","15:00",981,677],["313782640","โรงเรียนอนุบาลแม่เปิน","แม่เปิน","แม่เปิน","นครสวรรค์",15.66647,99.44863,38.5,"ทน.","15:00",714,392],["313778862","หน่วยจัดการต้นน้ำและพัฒนาชุมชนในพื้นที่ป่าอนุรักษ์คลองงู","ชะแล","ทองผาภูมิ","กาญจนบุรี",14.84977,98.824,35.2,"พพภ","15:00",637,496],["313781235","บ้านกระแหน่","คอกควาย","บ้านไร่","อุทัยธานี",15.29466,99.43493,33,"ทน.","14:00",712,439],["313781303","บ้านวังหินเหนือ (บ้านโป่งเจ็ดหัว)","วังหิน","วังโป่ง","เพชรบูรณ์",16.38968,100.77583,33,"ทน.","14:00",875,300],["313781232","บ้านเขาแหลม","แม่เปิน","แม่เปิน","นครสวรรค์",15.64634,99.42494,29.5,"ทน.","14:00",711,395],["313778686","สถานีวิจัยต้นน้ำยม","บ้านเวียง","ร้องกวาง","แพร่",18.2346,100.3548,24.4,"พพภ","15:00",824,62],["313780142","อบต.บึงสามพัน","บึงสามพัน","บึงสามพัน","เพชรบูรณ์",15.77805,101.02094,19.8,"สสน.","15:00",905,378],["313781274","บ้านขุนห้วยแม่สอด","พระธาตุผาแดง","แม่สอด","ตาก",16.71689,98.66336,19.5,"ทน.","14:00",618,258],["313780028","ทต.บ่อเกลือใต้","บ่อเกลือใต้","บ่อเกลือ","น่าน",19.07989,101.15386,16.8,"สสน.","15:00",921,-47],["313780125","โพธิ์ประทับช้าง","โพธิ์ประทับช้าง","โพธิ์ประทับช้าง","พิจิตร",16.31077,100.27173,16,"สสน.","15:00",814,310],["313780989","บ้านสบมาง","ภูฟ้า","บ่อเกลือ","น่าน",18.99464,101.21343,14.5,"ทน.","14:00",929,-36],["313778639","หน่วยจัดการต้นน้ำและพัฒนาชุมชนในพื้นที่ป่าอนุรักษ์สะแกกรัง","ระบำ","ลานสัก","อุทัยธานี",15.50239,99.46196,14,"พพภ","15:00",715,413],["313782681","ศาลากลางสมุทรปราการ","ปากน้ำ","เมืองสมุทรปราการ","สมุทรปราการ",13.59801,100.59622,13.5,"ทน.","15:00",853,655],["313771070","บ้านปางอ้า","เวียงมอก","เถิน","ลำปาง",17.42823,99.36144,13,"ทน.","12:00",703,166],["313781298","บ้านทุ่งนาดี","วังยาง","เนินมะปราง","พิษณุโลก",16.46144,100.73239,13,"ทน.","14:00",870,291],["313778791","หน่วยจัดการต้นน้ำและพัฒนาชุมชนในพื้นที่ป่าอนุรักษ์ปางมะผ้า","สบป่อง","ปางมะผ้า","แม่ฮ่องสอน",19.51652,98.25083,10.6,"พพภ","15:00",568,-104],["313782737","น้ำแม่วงก์ที่บ้านคลองสาลี","ลาดยาว","ลาดยาว","นครสวรรค์",15.7721,99.70132,10.5,"ทน.","15:00",744,379],["313768347","อุ้มผาง","อุ้มผาง","อุ้มผาง","ตาก",16.02472,98.86444,10.2,"อต.","13:00",642,346],["313781215","บ้านแม่จอ","แม่โถ","แม่ลาน้อย","แม่ฮ่องสอน",18.64583,98.03918,10,"ทน.","14:00",542,9],["313781857","บ้านแม่ช่อฟ้า","ทุ่งผึ้ง","แจ้ห่ม","ลำปาง",18.86359,99.73004,7,"ทน.","14:00",748,-19],["313781207","บ้านดง","ป่าแป๋","แม่สะเรียง","แม่ฮ่องสอน",18.34127,98.08036,5,"ทน.","14:00",547,49],["313781343","บ้านหนองบาง","ลิ่นถิ่น","ทองผาภูมิ","กาญจนบุรี",14.5767,98.82079,4,"ทน.","14:00",637,531],["313780864","บ้านบุญแจ่ม","น้ำเลา","ร้องกวาง","แพร่",18.26741,100.33358,3,"ทน.","14:00",821,58],["313781952","บ้านซับสมบูรณ์","วังข่อย","ไพศาลี","นครสวรรค์",15.56629,100.77857,2.5,"ทน.","14:00",876,405],["313779685","บ้านแม่น้ำน้อย","ไทรโยค","ไทรโยค","กาญจนบุรี",14.44497,98.80493,2,"กฟผ.","14:00",635,547],["313779860","สตึก","นิคม","สตึก","บุรีรัมย์",15.29989,103.29234,1.6,"สสน.","15:00",1182,439],["313779265","ที่ทำการ อบต.วังปลาป้อม","วังปลาป้อม","นาวัง","หนองบัวลำภู",17.41722,102.00153,1.4,"ปภ.","14:50",1025,168],["313780971","อ่างเก็บน้ำหนองเข้","ยกกระบัตร","สามเงา","ตาก",17.34999,99.06564,1.2,"สสน.","15:00",667,177],["313781189","บ้านปางตอง","แม่อูคอ","ขุนยวม","แม่ฮ่องสอน",18.84359,98.0643,1,"ทน.","14:00",545,-16],["313781334","บ้านพุน้ำร้อน","บ้านเก่า","เมืองกาญจนบุรี","กาญจนบุรี",13.93116,99.08294,1,"ทน.","14:00",669,612],["313778773","หน่วยจัดการต้นน้ำและพัฒนาชุมชนในพื้นที่ป่าอนุรักษ์น้ำหมาวหมอก","บ่อเกลือใต้","บ่อเกลือ","น่าน",19.06172,101.10231,0.6,"พพภ","15:00",915,-45],["313780438","สะพานข้ามคลองเกรียงไกร","บางเคียน","ชุมแสง","นครสวรรค์",15.84312,100.21149,0.6,"สสน.","15:00",807,370],["313780821","บ้านป่าเห่ว","บ้านขอ","เมืองปาน","ลำปาง",18.68573,99.47137,0.5,"ทน.","14:00",716,4],["313781792","บ้านดงลึก","วังศาล","วังโป่ง","เพชรบูรณ์",16.28454,100.81179,0.5,"ทน.","14:00",880,313],["313779280","บ้านผู้ใหญ่บ้านคนเก่า หมู่6","นางพญา","ท่าปลา","อุตรดิตถ์",17.95179,100.39925,0.4,"ปภ.","14:50",829,99],["313780889","อ่างเก็บน้ำห้วยไคร้","ทาปลาดุก","แม่ทา","ลำพูน",18.50746,99.22739,0.4,"สสน.","15:00",687,27],["313778609","หน่วยพิทักษ์อุทยานแห่งชาติที่ ทล. ๓ (ลำแปรง)","ลำเพียก","ครบุรี","นครราชสีมา",14.2047,102.211,0.2,"พพภ","15:00",1050,578],["313768341","เพชรบูรณ์","ในเมือง","เมืองเพชรบูรณ์","เพชรบูรณ์",16.43333,101.15,0.2,"อต.","13:00",921,294],["313778415","หน่วยพิทักษ์อุทยานฯ ที่ ดป.๔ (โครงการบ้านเล็กฯ)","แม่สาว","แม่อาย","เชียงใหม่",20.08058,99.18115,0.2,"พพภ","15:00",681,-177],["313779173","วัดพุศิลามงคล หมู่ 13","บ้านบึง","บ้านคา","ราชบุรี",13.29503,99.43167,0.1,"ปภ.","14:50",711,693]]; // สถาบันสารสนเทศทรัพยากรน้ำ rain_24h (api-v3.thaiwater.net thaiwater30/public/rain_24h, 9 ต.ค. 2569 ~15:00) · sample across levels, rain > 0, inside the map frame
    // ThaiWater stations in the station list: same row shape as own stations; agency from the ThaiWater code. Only 24 h rain is real (other periods null).
    // ThaiWater stations: each one is randomly assigned one of the five external agencies (seeded, so the same every render)
    const AG5 = ['กรมทรัพยากรน้ำ', 'สถาบันสารสนเทศทรัพยากรน้ำ (องค์การมหาชน)', 'บริษัท ไทยเบฟเวอเรจ จำกัด (มหาชน)', 'กรมชลประทาน', 'กรมอุตุนิยมวิทยา'];
    let rs = 20261015; const rnd = () => { rs = (Math.imul(rs, 1103515245) + 12345) >>> 0; return rs / 4294967296; };
    const TWR = TW.map((t) => ['tw-' + t[0], t[1], t[2], t[3], t[4], Math.round((t[6] - 97.15) * 100), Math.round((20.62 - t[5]) * 100), t[7], null, null, AG5[Math.floor(rnd() * AG5.length)], t[9]]);
    return { R, P, PW, TW, TWR };
  }

  // ---------- history modal (ข้อมูลย้อนหลัง) ----------
  // hourly series behind the history chart (index 0 = hour ending 11:00 today) — shared by the history modal and the popup preview
  histSeries(id, sensor, st) {
    // deterministic sample data per station + sensor
    let seed = 7;
    const key = id + ':' + sensor;
    for (let i = 0; i < key.length; i++) seed = (Math.imul(seed, 31) + key.charCodeAt(i)) >>> 0;
    const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let x = seed; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const NOW = new Date(2026, 9, 9, 11, 0, 0);
    const HN = 12 + 30 * 24;
    const at = (i) => new Date(NOW.getTime() - i * 3600000);
    const hr = [];
    if (sensor === 'rain') {
      let wet = 0;
      for (let i = 0; i < HN; i++) { wet = wet ? (rnd() < 0.72 ? 1 : 0) : (rnd() < 0.14 ? 1 : 0); hr.push(wet ? Math.pow(rnd(), 1.6) * 9 : 0); }
      const v1 = st[7] || 0, v3 = st[8] == null ? v1 : st[8], v5 = st[9] == null ? v3 : st[9];
      const fit = (a, b, target) => {
        let sum = 0; for (let i = a; i < b; i++) sum += hr[i];
        if (target <= 0) { for (let i = a; i < b; i++) hr[i] = 0; return; }
        if (sum <= 0) { hr[a + 3] = target; return; }
        for (let i = a; i < b; i++) hr[i] = hr[i] * target / sum;
      };
      fit(0, 24, v1); fit(24, 72, Math.max(0, v3 - v1)); fit(72, 120, Math.max(0, v5 - v3));
      let rest = 0; for (let i = 120; i < HN; i++) rest += hr[i];
      const want = (v5 / 120) * (HN - 120) * 0.8;
      if (rest > 0) for (let i = 120; i < HN; i++) hr[i] = hr[i] * want / rest;
      for (let i = 0; i < HN; i++) hr[i] = Math.round(hr[i] * 10) / 10;
    } else {
      const P = { temp: [28, 4, 0.6, 14, 18, 40], hum: [76, -14, 3, 14, 35, 100], wind: [8, 4, 2.5, 15, 0, 60], pres: [1009, 1.4, 0.3, 10, 995, 1025], co2: [425, -22, 6, 15, 380, 600], pm: [24, -7, 4, 15, 2, 200] }[sensor];
      let day = -1, off = 0;
      for (let i = 0; i < HN; i++) {
        const t = at(i), d = Math.floor((NOW - t) / 86400000);
        if (d !== day) { day = d; off = (rnd() - 0.5) * Math.abs(P[1]) * 0.8; }
        const di = Math.cos((t.getHours() - P[3]) / 24 * 2 * Math.PI);
        let v = P[0] + off + P[1] * di + (rnd() - 0.5) * 2 * P[2];
        v = Math.min(P[5], Math.max(P[4], v));
        hr.push(Math.round(v * 10) / 10);
      }
    }
    return { hr, rnd, NOW, HN, at };
  }

  // opt (popup preview): { h, W, H, onSet } — same chart engine as the history modal, smaller and with its own state
  histVals(s, R, lt, opt) {
    const h = opt ? opt.h : s.hist;
    if (!h) return { hist: false };
    const E = createElement;
    const idx = Math.max(0, R.findIndex((r) => r[0] === h.id));
    const st = R[idx];
    const code = st[0].indexOf('tw-') === 0 ? st[0].slice(3) : 'G15006-' + (5501 + idx * 13);
    const SENS = [
      ['rain', 'ปริมาณน้ำฝน', 'มม.', '#3b82f6', 'กราฟปริมาณฝนสะสมย้อนหลัง', 'ฝนสะสม', 'ปริมาณฝน'],
      ['temp', 'อุณหภูมิ', '°C', '#f97316', 'กราฟอุณหภูมิย้อนหลัง', 'อุณหภูมิเฉลี่ย', 'อุณหภูมิ'],
      ['hum', 'ความชื้น', '%', '#06b6d4', 'กราฟความชื้นสัมพัทธ์ย้อนหลัง', 'ความชื้นเฉลี่ย', 'ความชื้น'],
      ['wind', 'ความเร็วลม', 'กม./ชม.', '#a78bfa', 'กราฟความเร็วลมย้อนหลัง', 'ความเร็วลมเฉลี่ย', 'ความเร็วลม'],
      ['pres', 'ความกดอากาศ', 'hPa', '#94a3b8', 'กราฟความกดอากาศย้อนหลัง', 'ความกดอากาศเฉลี่ย', 'ความกดอากาศ'],
      ['co2', 'CO₂', 'ppm', '#22c55e', 'กราฟ CO₂ ย้อนหลัง', 'CO₂ เฉลี่ย', 'CO₂'],
      ['pm', 'PM 2.5', 'µg/m³', '#eab308', 'กราฟ PM 2.5 ย้อนหลัง', 'PM 2.5 เฉลี่ย', 'PM 2.5']
    ];
    const sen = SENS.find((x) => x[0] === h.sensor) || SENS[0];
    const rain = sen[0] === 'rain';
    // the panel's period tab above the table drives the default range
    const PMAP = { d1: '24h', d3: '72h', d5: '5d', d7: '7d', d15: '15d' };
    const range = h.range || PMAP[s.period] || '24h';
    const setH = opt ? opt.onSet : (o) => this.setState({ hist: Object.assign({}, s.hist, o) });

    const HS = this.histSeries(h.id, sen[0], st); const hr = HS.hr, rnd = HS.rnd, NOW = HS.NOW, HN = HS.HN, at = HS.at;
    // calendar days: d = 0 is today (00:00–11:00), d >= 1 earlier days
    const dayIdx = (d) => (d === 0 ? [0, 12] : [12 + (d - 1) * 24, 12 + d * 24]);
    const dayVal = (d) => { const [a, b] = dayIdx(d); let sum = 0; for (let i = a; i < b; i++) sum += hr[i]; return Math.round((rain ? sum : sum / (b - a)) * 10) / 10; };
    const dayDate = (d) => new Date(2026, 9, 9 - d);
    const MRAIN = [8, 18, 35, 75, 170, 165, 185, 215, 255, 175, 55, 12];
    const MTEMP = [25.5, 27.5, 29.5, 31, 30, 29, 28.5, 28.3, 28, 27.5, 26.5, 25];
    const monthVal = (m) => {
      const dt = new Date(2026, 9 - m, 1), mo = dt.getMonth();
      if (m === 0) { let sum = 0; for (let d = 0; d < 9; d++) sum += dayVal(d); return Math.round((rain ? sum : sum / 9) * 10) / 10; }
      const j = 0.75 + rnd() * 0.5;
      if (rain) return Math.round(MRAIN[mo] * j * 10) / 10;
      const base = { temp: MTEMP[mo], hum: 62 + MRAIN[mo] / 12, wind: 6 + (mo < 3 || mo > 9 ? 3 : 0), pres: 1012 - MRAIN[mo] / 80, co2: 418 + (mo < 4 ? 10 : 0), pm: 12 + (mo < 4 || mo > 10 ? 38 : 0) }[sen[0]];
      return Math.round(base * (0.97 + rnd() * 0.06) * 10) / 10;
    };

    const TM = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const pad = (n) => (n < 10 ? '0' : '') + n;
    let pts = [], kind = 'h';
    if (h.gran === 'day') {
      const dayStartHour = 7, elapsed = NOW.getHours() - dayStartHour;
      const hrs = { '1h': 1, today: elapsed >= 0 ? elapsed : elapsed + 24, yesterday:24, '24h': 24, '48h': 48, '72h': 72 }[range];
      if (hrs) { for (let i = hrs - 1; i >= 0; i--) pts.push({ t: at(i + (range === 'yesterday' ? (elapsed >= 0 ? elapsed : elapsed + 24) : 0)), v: hr[i + (range === 'yesterday' ? (elapsed >= 0 ? elapsed : elapsed + 24) : 0)] }); kind = 'h'; }
      else { const n = { '5d': 5, '7d': 7, '15d': 15 }[range]; for (let d = n - 1; d >= 0; d--) pts.push({ t: dayDate(d), v: dayVal(d) }); kind = 'd'; }
    } else if (h.gran === 'month') {
      for (let d = 29; d >= 0; d--) pts.push({ t: dayDate(d), v: dayVal(d) }); kind = 'd';
    } else {
      for (let m = 11; m >= 0; m--) pts.push({ t: new Date(2026, 9 - m, 1), v: monthVal(m) }); kind = 'm';
    }
    const fmtV = (v) => (Math.round(v * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 });
    const dLabel = (t) => t.getDate() + ' ' + TM[t.getMonth()];
    const mLabel = (t) => TM[t.getMonth()] + ' ' + String((t.getFullYear() + 543) % 100);

    // ----- chart (SVG built with React elements) -----
    const extH = String(h.id).indexOf('tw-') === 0; // other-agency (ThaiWater) station: rainfall chart only — no metric tabs, no log panel
    const wide = h.full || extH;
    const W = opt ? opt.W : wide ? 1022 : 648, H = opt ? opt.H : 300, pl = 4, pr = 50, pt = 32, pb = 50;
    const ink = lt ? '#64748b' : '#94a3b8', grid = lt ? '#e2e8f0' : '#404040', base = lt ? '#cbd5e1' : '#71717a';
    const vs = pts.map((p) => p.v);
    let mx = Math.max.apply(null, vs), mn = Math.min.apply(null, vs);
    const nice = (x) => { const p = Math.pow(10, Math.floor(Math.log10(x))); const f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
    let lo, hi, step;
    if (rain || sen[0] === 'wind') { lo = 0; step = nice(Math.max(mx, 4) / 4); hi = Math.ceil(Math.max(mx, 4) / step) * step; }
    else { step = nice(Math.max(mx - mn, 1) / 4); lo = Math.floor(mn / step) * step; hi = Math.ceil(mx / step) * step; if (hi <= lo) hi = lo + step; }
    const n = pts.length, pw = W - pl - pr, slot = pw / n;
    const X = (i) => pl + slot * (i + 0.5);
    const Y = (v) => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
    const kids = [];
    kids.push(E('text', { key: 'u', x: W, y: 12, textAnchor: 'end', fontSize: 15, fill: ink }, sen[6] + ' (' + sen[2] + ')'));
    for (let v = lo, k = 0; v <= hi + step / 1000; v += step, k++) {
      const y = Y(v);
      kids.push(E('line', { key: 'g' + k, x1: pl, x2: W - pr, y1: y, y2: y, stroke: v === lo ? base : grid, strokeWidth: 1 }));
      kids.push(E('text', { key: 'gl' + k, x: W - 4, y: y + 4, textAnchor: 'end', fontSize: 15, fill: ink }, fmtV(v)));
    }
    const tip = (p) => (kind === 'h' ? dLabel(p.t) + ' ' + pad(p.t.getHours()) + ':00' : kind === 'd' ? dLabel(p.t) : mLabel(p.t)) + ' · ' + fmtV(p.v) + ' ' + sen[2];
    if (rain) {
      const bw = Math.max(2, Math.min(28, slot * 0.62));
      pts.forEach((p, i) => { const y = Y(p.v); kids.push(E('rect', { key: 'b' + i, x: X(i) - bw / 2, y, width: bw, height: Math.max(0, Y(lo) - y), rx: 1.5, fill: sen[3] }, E('title', null, tip(p)))); });
    } else {
      const line = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' ');
      kids.push(E('path', { key: 'ar', d: line + ' L' + X(n - 1).toFixed(1) + ' ' + Y(lo) + ' L' + X(0).toFixed(1) + ' ' + Y(lo) + ' Z', fill: sen[3], opacity: 0.14 }));
      kids.push(E('path', { key: 'ln', d: line, fill: 'none', stroke: sen[3], strokeWidth: 2, strokeLinejoin: 'round' }));
      if (n <= 31) pts.forEach((p, i) => kids.push(E('circle', { key: 'c' + i, cx: X(i), cy: Y(p.v), r: 3, fill: sen[3] }, E('title', null, tip(p)))));
      else pts.forEach((p, i) => kids.push(E('rect', { key: 'h' + i, x: X(i) - slot / 2, y: pt, width: slot, height: H - pt - pb, fill: 'transparent' }, E('title', null, tip(p)))));
    }
    const nl = Math.min(n, wide ? 9 : 6);
    for (let j = 0; j < nl; j++) {
      const i = nl === 1 ? 0 : Math.round(j * (n - 1) / (nl - 1)), p = pts[i];
      const l1 = kind === 'm' ? mLabel(p.t) : dLabel(p.t) + ' ' + String((p.t.getFullYear() + 543) % 100);
      const ax = j === 0 && nl > 1 ? 'start' : j === nl - 1 && nl > 1 ? 'end' : 'middle', xx = ax === 'start' ? Math.max(pl, X(i) - slot / 2) : ax === 'end' ? Math.min(W - pr, X(i) + slot / 2) : X(i);
      kids.push(E('text', { key: 'x' + j, x: xx, y: H - pb + 19, textAnchor: ax, fontSize: 14, fill: ink }, l1));
      if (kind === 'h') kids.push(E('text', { key: 'xt' + j, x: xx, y: H - pb + 36, textAnchor: ax, fontSize: 14, fill: ink }, pad(p.t.getHours()) + ':00'));
    }
    // ----- hover: guide line + tooltip (state s.hxHover = { k, i }) -----
    const HK = opt ? 'mini' : 'full', hv = s.hxHover && s.hxHover.k === HK ? s.hxHover.i : -1;
    if (hv >= 0 && hv < n) {
      const p = pts[hv], x = X(hv), y = Y(p.v);
      kids.push(E('line', { key: 'hvl', x1: x, x2: x, y1: pt, y2: H - pb, stroke: lt ? '#94a3b8' : '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3', pointerEvents: 'none' }));
      if (rain) { const bw = Math.max(2, Math.min(28, slot * 0.62)) + 2; kids.push(E('rect', { key: 'hvb', x: x - bw / 2, y: y - 1, width: bw, height: Math.max(0, Y(lo) - y) + 1, rx: 2, fill: 'none', stroke: lt ? '#0f172a' : '#ffffff', strokeWidth: 1.5, pointerEvents: 'none' })); }
      else kids.push(E('circle', { key: 'hvc', cx: x, cy: y, r: 5, fill: sen[3], stroke: lt ? '#ffffff' : '#18181b', strokeWidth: 2, pointerEvents: 'none' }));
      const t1 = kind === 'h' ? dLabel(p.t) + ' ' + String((p.t.getFullYear() + 543) % 100) + ' · ' + pad(p.t.getHours()) + ':00 น.' : kind === 'd' ? dLabel(p.t) + ' ' + (p.t.getFullYear() + 543) : TM[p.t.getMonth()] + ' ' + (p.t.getFullYear() + 543);
      const t2 = fmtV(p.v) + ' ' + sen[2];
      const tw = Math.max(t1.length * 8.2, t2.length * 10.8) + 24, th = 56;
      let tx = x + 10; if (tx + tw > W - pr) tx = x - 10 - tw; tx = Math.max(pl, tx);
      const ty = Math.max(pt, Math.min(H - pb - th, y - th - 8));
      kids.push(E('g', { key: 'hvt', pointerEvents: 'none' },
        E('rect', { x: tx, y: ty, width: tw, height: th, rx: 8, fill: lt ? '#0f172a' : '#fafafa', opacity: 0.96 }),
        E('text', { x: tx + 10, y: ty + 21, fontSize: 15, fill: lt ? '#cbd5e1' : '#52525b' }, t1),
        E('text', { x: tx + 10, y: ty + 45, fontSize: 18, fontWeight: 700, fill: lt ? '#ffffff' : '#18181b' }, t2)));
    }
    // invisible hit areas (one per point, full height) — mouse and keyboard-free hover
    pts.forEach((p, i) => kids.push(E('rect', { key: 'hit' + i, x: X(i) - slot / 2, y: pt, width: slot, height: H - pt - pb, fill: 'transparent', style: { cursor: 'crosshair' },
      onMouseEnter: () => { if (!(s.hxHover && s.hxHover.k === HK && s.hxHover.i === i)) this.setState({ hxHover: { k: HK, i } }); } })));
    const chart = E('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': sen[4] + ' ' + n + ' จุดข้อมูล', onMouseLeave: () => this.setState({ hxHover: null }) }, kids);

    // ----- records table -----
    const recs = pts.slice().reverse();
    const PS = 6, pages = Math.max(1, Math.ceil(recs.length / PS)), pg = Math.min(h.pg || 1, pages);
    const hxRows = recs.slice((pg - 1) * PS, pg * PS).map((p) => ({
      d: kind === 'm' ? TM[p.t.getMonth()] + ' ' + (p.t.getFullYear() + 543) : p.t.getDate() + ' ' + TM[p.t.getMonth()] + (p.t.getFullYear() + 543),
      tm: kind === 'h' ? pad(p.t.getHours()) + ':00' : kind === 'd' ? 'ทั้งวัน' : 'ทั้งเดือน',
      fq: kind === 'h' ? '1 ชม.' : kind === 'd' ? '1 วัน' : '1 เดือน',
      v: fmtV(p.v) + ' ' + sen[2]
    }));
    const nums = pages <= 4 ? Array.from({ length: pages }, (_, i) => i + 1) : pg <= 2 ? [1, 2, 3, 'gap', pages] : pg >= pages - 1 ? [1, 'gap', pages - 2, pages - 1, pages] : [1, 'gap', pg, 'gap', pages];
    const hxPages = nums.map((x) => (x === 'gap' ? { n: '…', cls: '', gap: true, cur: undefined, pick: null } : { n: x, cls: x === pg ? 'on' : '', gap: false, cur: x === pg ? 'page' : undefined, pick: () => setH({ pg: x }) }));

    const per = kind === 'h' ? 'รายชั่วโมง' : kind === 'd' ? 'รายวัน' : 'รายเดือน';
    const download = () => {
      const rows = [['วันที่', 'เวลา', sen[6] + ' (' + sen[2] + ')']].concat(recs.map((p) => [p.t.getDate() + '/' + (p.t.getMonth() + 1) + '/' + (p.t.getFullYear() + 543), kind === 'h' ? pad(p.t.getHours()) + ':00' : '', String(p.v)]));
      const a = document.createElement('a');
      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('﻿' + rows.map((r) => r.join(',')).join('\n'));
      a.download = code + '_' + sen[0] + '_' + (h.gran === 'day' ? range : h.gran) + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
    };
    return {
      hist: true, closeHist: () => this.setState({ hist: null }), closeAll: () => this.setState({ hist: null, st: null, qr: false }),
      hxSub: code + ' ' + st[1] + ' ต.' + st[2] + ' อ.' + st[3] + ' จ.' + st[4],
      hxSens: SENS.map((x) => ({ label: x[1], on: x[0] === sen[0], cls: x[0] === sen[0] ? 'on' : '', pick: () => setH({ sensor: x[0], pg: 1 }) })),
      hxTitle: sen[4],
      hxGrans: [['day', 'รายวัน'], ['month', 'รายเดือน'], ['year', 'รายปี']].map(([k, l]) => ({ label: l, on: h.gran === k, cls: h.gran === k ? 'on' : '', pick: () => setH({ gran: k, pg: 1 }) })),
      hxDaily: h.gran === 'day', hxCapOn: h.gran !== 'day', hxCap: h.gran === 'month' ? 'สรุปรายวัน · 30 วันล่าสุด' : 'สรุปรายเดือน · 12 เดือนล่าสุด',
      hxRanges: [['1h','ฝน 1 ชั่วโมง'], ['24h','24 ชม.'], ['today','ฝนวันนี้'], ['yesterday','ฝนวานนี้'], ['72h','3 วัน'], ['5d','5 วัน'], ['7d','7 วัน'], ['15d','15 วัน']].map(([k, l]) => ({ label: l, on: range === k, cls: range === k ? 'on' : '', pick: () => setH({ range: k, pg: 1 }) })),
      hxDownload: download,
      hxPdf: () => {
        const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        const svgEl = document.querySelector('section.hx .hx-chart svg');
        let svg = svgEl ? svgEl.outerHTML : '';
        svg = svg.replace(/<g[^>]*pointer-events[^>]*>[\s\S]*?<\/g>/g, '');   // drop hover tooltip if one is showing
        const rows = recs.map((p) => '<tr><td>' + p.t.getDate() + ' ' + TM[p.t.getMonth()] + ' ' + (p.t.getFullYear() + 543) + '</td><td>' + (kind === 'h' ? pad(p.t.getHours()) + ':00' : kind === 'd' ? 'ทั้งวัน' : 'ทั้งเดือน') + '</td><td class="r">' + fmtV(p.v) + ' ' + esc(sen[2]) + '</td></tr>').join('');
        const html = '<!doctype html><html lang="th"><head><meta charset="utf-8"><title>' + esc(code + '_' + sen[0]) + '</title><style>'
          + "@page{size:A4;margin:14mm}body{font-family:'Sarabun','Leelawadee UI',Tahoma,sans-serif;color:#0f172a;margin:0}h1{font-size:20px;margin:0 0 4px}p.s{margin:0 0 12px;color:#475569;font-size:13px}"
          + '.c{border:1px solid #e2e8f0;border-radius:8px;padding:8px;margin:0 0 14px}.c svg{width:100%;height:auto}.c svg text{fill:#334155}'
          + 'table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #e2e8f0;padding:5px 8px;text-align:left}th{background:#f1f5f9}td.r,th.r{text-align:right}tr{break-inside:avoid}'
          + '.f{margin-top:10px;font-size:11px;color:#64748b}</sty' + 'le></head><body>'
          + '<h1>' + esc(sen[4]) + '</h1><p class="s">' + esc(code + ' ' + st[1] + ' ต.' + st[2] + ' อ.' + st[3] + ' จ.' + st[4]) + ' · ' + esc(per) + ' · ' + n + ' รายการ</p>'
          + '<div class="c">' + svg + '</div>'
          + '<table><thead><tr><th>วันที่</th><th>เวลา</th><th class="r">' + esc(sen[6] + ' (' + sen[2] + ')') + '</th></tr></thead><tbody>' + rows + '</tbody></table>'
          + '<p class="f">ระบบรวบรวมข้อมูลและติดตามสถานะชุดอุปกรณ์ตรวจวัดสภาพแวดล้อม (Sensor) · พิมพ์เมื่อ 9 ต.ค. 2569 11:00 น.</p></body></html>';
        const fr = document.createElement('iframe');
        fr.setAttribute('aria-hidden', 'true'); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
        document.body.appendChild(fr);
        const d = fr.contentWindow.document; d.open(); d.write(html); d.close();
        setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) {} setTimeout(() => fr.remove(), 2000); }, 300);
      }, hxFull: !!h.full, hxFullOn: !extH, hxFullLabel: h.full ? 'ย่อกราฟ' : 'ขยายกราฟเต็มกรอบ', hxToggleFull: () => setH({ full: !h.full }),
      hxFullIcon: h.full ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
      hxBack: !!s.st, hxStats: (() => {
        const ptLab = (p) => (kind === 'h' ? dLabel(p.t) + ' ' + pad(p.t.getHours()) + ':00 น.' : kind === 'd' ? dLabel(p.t) + ' ' + (p.t.getFullYear() + 543) : TM[p.t.getMonth()] + ' ' + (p.t.getFullYear() + 543));
        const per1 = kind === 'h' ? 'ชม.' : kind === 'd' ? 'วัน' : 'เดือน';
        let ix = 0, iv = 0; pts.forEach((p, i) => { if (p.v > pts[ix].v) ix = i; if (p.v < pts[iv].v) iv = i; });
        const sum = pts.reduce((t, p) => t + p.v, 0), last = pts[pts.length - 1], u = ' ' + sen[2];
        const hot = 'color: ' + (lt ? '#dc2626' : '#f87171') + ';';
        return rain ? [
          { label: 'ฝนรวมช่วงนี้', value: fmtV(sum) + u, sub: n + ' ' + per1 + 'ล่าสุด', style: '' },
          { label: 'สูงสุด', value: fmtV(pts[ix].v) + u, sub: ptLab(pts[ix]), style: pts[ix].v > 0 ? hot : '' },
          { label: 'ช่วงที่มีฝน', value: pts.filter((p) => p.v > 0).length + ' / ' + n + ' ' + per1, sub: 'มีฝนมากกว่า 0 มม.', style: '' },
          { label: 'ล่าสุด', value: fmtV(last.v) + u, sub: ptLab(last), style: '' }
        ] : [
          { label: 'เฉลี่ย', value: fmtV(sum / n) + u, sub: n + ' ' + per1 + 'ล่าสุด', style: '' },
          { label: 'สูงสุด', value: fmtV(pts[ix].v) + u, sub: ptLab(pts[ix]), style: '' },
          { label: 'ต่ำสุด', value: fmtV(pts[iv].v) + u, sub: ptLab(pts[iv]), style: '' },
          { label: 'ล่าสุด', value: fmtV(last.v) + u, sub: ptLab(last), style: '' }
        ];
      })(),
      hxChart: chart, hxSw: 'background: ' + sen[3] + ';', hxLegend: sen[5] + ' (' + per + ')',
      hxSide: !h.full && !extH, hxSensOn: !extH, hxColName: sen[6], hxRows, hxPages,
      hxPrevDis: pg <= 1, hxNextDis: pg >= pages, hxPrev: () => setH({ pg: pg - 1 }), hxNext: () => setH({ pg: pg + 1 })
    };
  }

  // ---------- measured values: 8 metrics, one shown on the map at a time ----------
  // rainfall periods: 24 ชม. / 3 / 5 / 7 / 15 วัน / เดือนนี้ / ปีนี้. k = criteria multiplier vs the 24 h thresholds (ข้อเสนอ)
  periods() {
    return [['1h', 'ฝน 1 ชั่วโมง', 1], ['d1', '24 ชม.', 1], ['today', 'ฝนวันนี้', 1], ['yesterday', 'ฝนวานนี้', 1], ['d3', '3 วัน', 1.5], ['d5', '5 วัน', 2], ['d7', '7 วัน', 2.5], ['d15', '15 วัน', 4]];
  }

  // accumulated rain of a station for a period (sample data beyond 5 days, deterministic)
  rainOf(r, p) {
    if (['1h','today','yesterday'].includes(p)) {
      if (r[7] == null) return null;
      const hours = this.histSeries(r[0], 'rain', r).hr;
      const values = p === '1h' ? hours.slice(0,1) : p === 'today' ? hours.slice(0,4) : hours.slice(4,28);
      return Math.round(values.reduce((sum,v)=>sum+v,0)*10)/10;
    }
    const IDX = { d1: 7, d3: 8, d5: 9 };
    if (IDX[p]) return r[IDX[p]];
    if (r[9] == null) return null;
    let h = 13; for (let i = 0; i < r[0].length; i++) h = (Math.imul(h, 31) + r[0].charCodeAt(i)) >>> 0;
    const f = (k) => ((h >>> k) % 100) / 100;
    const d7 = r[9] * (1.12 + 0.3 * f(1)), d15 = d7 * (1.35 + 0.5 * f(3)), mo = d15 * (1.5 + 0.6 * f(5)), yr = 150 + 0.4 * mo + 2000 * Math.pow(((h * 2654435761) >>> 0) % 1000 / 1000, 1.4);
    return Math.round({ d7, d15, m: mo, y: yr }[p] * 10) / 10;
  }

  // main river basin per province (sample mapping — confirm with the real station table)
  basinOf(r) {
    const B = { 'อุตรดิตถ์': 'น่าน', 'น่าน': 'น่าน', 'ชัยภูมิ': 'ชี', 'ขอนแก่น': 'ชี', 'กาฬสินธุ์': 'ชี', 'ร้อยเอ็ด': 'ชี', 'ศรีสะเกษ': 'มูล', 'อุบลราชธานี': 'มูล', 'นครราชสีมา': 'มูล', 'บุรีรัมย์': 'มูล',
      'พะเยา': 'โขงเหนือ', 'เชียงราย': 'โขงเหนือ', 'สกลนคร': 'โขงตะวันออกเฉียงเหนือ', 'เลย': 'โขงตะวันออกเฉียงเหนือ', 'เพชรบูรณ์': 'ป่าสัก', 'สระบุรี': 'ป่าสัก', 'ลพบุรี': 'ป่าสัก',
      'ชลบุรี': 'ชายฝั่งทะเลตะวันออก', 'ระยอง': 'ชายฝั่งทะเลตะวันออก', 'จันทบุรี': 'ชายฝั่งทะเลตะวันออก', 'เพชรบุรี': 'เพชรบุรี-ประจวบคีรีขันธ์', 'สุพรรณบุรี': 'ท่าจีน',
      'แพร่': 'ยม', 'สุโขทัย': 'ยม', 'ปราจีนบุรี': 'บางปะกง', 'อุทัยธานี': 'สะแกกรัง', 'นครสวรรค์': 'เจ้าพระยา', 'กาญจนบุรี': 'แม่กลอง', 'สระแก้ว': 'โตนเลสาบ',
      'แม่ฮ่องสอน': 'สาละวิน', 'เชียงใหม่': 'ปิง', 'ตาก': 'ปิง' };
    return B[r[4]] || 'เจ้าพระยา';
  }

  // alert store: every station/metric at "เฝ้าระวัง" (yellow) or worse becomes an alert (sample, deterministic)
  alertRec(r, d, v, c, ago, extra) {
    return Object.assign({ id: r[0] + ':' + d.key, st: r[0], metric: d.key, mName: d.name, unit: d.dir ? '' : d.unitTh, v, cat: d.key + ':' + c[0], lvl: c[5], label: c[3], band: c[2], chip: (d.key === 'rain' ? '' : d.col + ' ') + c[2], color: c[4], lo: d.cats.length - d.cats.indexOf(c) + (d.key === 'rain' ? 100 : 0), ago }, extra || {});
  }

  buildAlerts(crit) {
    const { R } = this.data();
    const MD = this.metricDefs('d1', crit);
    const out = [];
    R.forEach((r) => {
      if (r[7] == null) return;
      const M = this.meas(r);
      MD.forEach((d) => {
        if (d.dir) return;
        const v = d.key === 'rain' ? r[7] : M[d.key];
        if (v == null) return;
        const c = d.cats.find((x) => x[1](v)) || d.cats[d.cats.length - 1];
        if (c[5] !== 'bad' && c[5] !== 'warn') return;
        let h = 17; const key = r[0] + d.key; for (let i = 0; i < key.length; i++) h = (Math.imul(h, 31) + key.charCodeAt(i)) >>> 0;
        out.push(this.alertRec(r, d, v, c, 3 + h % 600));
      });
    });
    return out.sort((a, b) => a.ago - b.ago);
  }

  // ThaiWater rainfall criteria (thaiwater.net, rainfallStatus + legend tables) · [id, test, label, short, color, level]
  // 24 ชม.: 7 ช่วง · 3/5/7/15 วัน: 12 ช่วง · รายเดือน / รายปี: สเกลสีต่อเนื่อง 30 ช่วง (ไม่มีชื่อระดับ)
  // ThaiWater rain for a period (24 ชม. is real sample data; longer periods synthesised from it, deterministic)
  twRainOf(r, p) {
    if (['1h','today','yesterday'].includes(p)) return null;
    const d1 = r[7]; if (d1 == null) return null; if (p === 'd1' || !p) return d1;
    let h = 29; for (let i = 0; i < r[0].length; i++) h = (Math.imul(h, 31) + r[0].charCodeAt(i)) >>> 0;
    const f = (k) => ((h >>> k) % 100) / 100;
    const d3 = d1 * (1.3 + 0.5 * f(1)), d5 = d3 * (1.15 + 0.3 * f(2)), d7 = d5 * (1.1 + 0.25 * f(3)), d15 = d7 * (1.4 + 0.5 * f(4)), mo = d15 * (1.5 + 0.6 * f(5)), yr = 300 + 0.5 * mo + 1600 * f(6);
    return Math.round({ d3, d5, d7, d15, m: mo, y: yr }[p] * 10) / 10;
  }

  inkOn(hex) { const n = parseInt(String(hex).slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? '#111827' : '#ffffff'; }

  twRain(period, scale = 1) {
    if (period === 'today' || period === 'yesterday') period = 'd1';
    if (period === '1h') return this.twRain('d1', 50/90);
    const nf = (x) => (Math.round(x*scale*100)/100).toLocaleString('en-US');
    const gt = (x) => (v) => v > x*scale, any = () => true;
    const mk = (rows, unitLab) => rows.map(([lo, hi, short, color, lv], i) => ['t' + lo, i === rows.length - 1 ? any : gt(lo), (hi == null ? '>' + nf(lo) : '>' + nf(lo) + '-' + nf(hi)) + ' มม.' + (short ? ' ' + short : ''), short || ('>' + nf(lo) + (hi == null ? '' : '-' + nf(hi)) + ' มม.'), color, lv]);
    if (period === 'd1') return mk([[90, null, 'ฝนหนักมาก', '#da352e', 'bad'], [70, 90, 'ฝนหนัก', '#bd6a27', 'warn'], [50, 70, 'ฝนหนัก', '#ef9036', 'warn'], [35, 50, 'ฝนหนัก', '#f0d447', 'warn'],
      [20, 35, 'ฝนปานกลาง', '#7fc63c', 'none'], [10, 20, 'ฝนปานกลาง', '#aeecb7', 'none'], [0, 10, 'ฝนเล็กน้อย', '#aed3ff', 'none']]);
    if (period === 'm' || period === 'y') {
      const C = ['#fffff5', '#ffffcc', '#ffff99', '#ffff66', '#ffff33', '#ffff0d', '#ffff00', '#ccff00', '#99ff00', '#66ff00', '#33ff00', '#00ff33', '#00ff66', '#00ff99', '#00ffcc', '#00ffff', '#00ccff', '#0099ff', '#0066ff', '#0033ff', '#0000ff', '#4300f8', '#6600ff', '#9900ff', '#cc00ff', '#ff00ff', '#ff00cc', '#ff0099', '#ff0066', '#ec0420'];
      const E = period === 'm' ? [0, 20, 40, 60, 80, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 400, 500, 700, 1000, 3000]
        : [0, 200, 400, 600, 800, 1000, 1040, 1080, 1120, 1160, 1200, 1260, 1320, 1380, 1440, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 3000, 3500, 4000, 5000, 8000];
      return mk(C.map((c, i) => [E[i], i === C.length - 1 ? null : E[i + 1], '', c, 'none']).reverse());
    }
    return mk([[300, null, 'ฝนหนักมาก', '#9931cf', 'bad'], [200, 300, 'ฝนหนักมาก', '#891b1d', 'bad'], [150, 200, 'ฝนหนักมาก', '#cc2723', 'bad'], [90, 150, 'ฝนหนักมาก', '#ee141f', 'bad'],
      [70, 90, 'ฝนหนัก', '#bd6a27', 'warn'], [50, 70, 'ฝนหนัก', '#ef9036', 'warn'], [35, 50, 'ฝนหนัก', '#f6d300', 'warn'], [20, 35, 'ฝนปานกลาง', '#7fc63c', 'none'], [10, 20, 'ฝนปานกลาง', '#aeecb7', 'none'],
      [5, 10, 'ฝนเล็กน้อย', '#aed3ff', 'none'], [1, 5, 'ฝนเล็กน้อย', '#cce3ff', 'none'], [0, 1, 'ฝนเล็กน้อย', '#fffff5', 'none']]);
  }

  rainCategories(period, code = '') {
    const range = ({d1:'24h',d3:'72h',d5:'5d',d7:'7d',d15:'15d'})[period] || period;
    const cuts = effectiveThreshold(code,range).cuts || effectiveThreshold(code,'24h').cuts;
    return RAIN_LEVELS.map((label,i)=>['rain'+i, v=>i===0 || v>cuts[i-1],
      (i===4 ? '>'+cuts[3] : (i ? '>'+cuts[i-1] : '>0')+'–'+cuts[i])+' มม. '+label,
      label, RAIN_COLORS[i], i===4?'bad':i===3?'warn':'none']).reverse();
  }

  metricDefs(period, crit) {
    const gt = (x) => (v) => v > x, lt = (x) => (v) => v < x, any = () => true;
    const RAIN = crit === 'own' ? this.rainCategories(period) : this.twRain(period);
    const D8 = [['N', 'เหนือ', '#60a5fa'], ['NE', 'ตะวันออกเฉียงเหนือ', '#22d3ee'], ['E', 'ตะวันออก', '#34d399'], ['SE', 'ตะวันออกเฉียงใต้', '#a3e635'], ['S', 'ใต้', '#facc15'], ['SW', 'ตะวันตกเฉียงใต้', '#fb923c'], ['W', 'ตะวันตก', '#f472b6'], ['NW', 'ตะวันตกเฉียงเหนือ', '#a78bfa']];
    return [
      { key: 'rain', hist: 'rain', label: 'ปริมาณน้ำฝน (Rainfall)', name: 'ปริมาณน้ำฝน', unit: 'mm', unitTh: 'มม.', col: 'ฝนสะสม', title: 'เกณฑ์ปริมาณฝนสะสม', critName: crit === 'own' ? 'เกณฑ์ ปภ.' : 'เกณฑ์ สถาบันสารสนเทศทรัพยากรน้ำ', cats: RAIN,
        icon: 'M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2 M16 14v6 M8 14v6 M12 16v6' },
      { key: 'temp', hist: 'temp', label: 'อุณหภูมิอากาศ (Temperature)', name: 'อุณหภูมิอากาศ', unit: '°C', unitTh: '°C', col: 'อุณหภูมิ', title: 'เกณฑ์อุณหภูมิอากาศ',
        cats: [['t40', gt(40), '>40 °C ร้อนจัด', 'ร้อนจัด', '#fb2c36', 'bad'], ['t35', gt(35), '>35-40 °C ร้อน', 'ร้อน', '#f59a3a', 'warn'], ['t30', gt(30), '>30-35 °C อุ่น', 'อุ่น', '#f0d447', 'ok'], ['t25', gt(25), '>25-30 °C ปกติ', 'ปกติ', '#7fc63d', 'ok'], ['t0', any, '≤25 °C เย็น', 'เย็น', '#93c5fd', 'ok']],
        icon: 'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z' },
      { key: 'hum', hist: 'hum', label: 'ความชื้นสัมพัทธ์ (Relative Humidity)', name: 'ความชื้นสัมพัทธ์', unit: '%RH', unitTh: '%RH', col: 'ความชื้น', title: 'เกณฑ์ความชื้นสัมพัทธ์',
        cats: [['h95', gt(95), '>95 %RH อิ่มตัว', 'อิ่มตัว', '#1d4ed8', 'warn'], ['h80', gt(80), '>80-95 %RH ชื้นมาก', 'ชื้นมาก', '#60a5fa', 'ok'], ['h60', gt(60), '>60-80 %RH ปกติ', 'ปกติ', '#7fc63d', 'ok'], ['h40', gt(40), '>40-60 %RH แห้ง', 'แห้ง', '#f0d447', 'ok'], ['h0', any, '≤40 %RH แห้งมาก', 'แห้งมาก', '#f59a3a', 'warn']],
        icon: 'M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97' },
      { key: 'wind', hist: 'wind', label: 'ความเร็วลม (Wind Speed)', name: 'ความเร็วลม', unit: 'm/s', unitTh: 'm/s', col: 'ความเร็วลม', title: 'เกณฑ์ความเร็วลม',
        cats: [['w17', gt(17.2), '>17.2 m/s พายุ', 'พายุ', '#fb2c36', 'bad'], ['w11', gt(10.8), '>10.8-17.2 m/s ลมแรง', 'ลมแรง', '#f59a3a', 'warn'], ['w5', gt(5.5), '>5.5-10.8 m/s ปานกลาง', 'ปานกลาง', '#f0d447', 'none'], ['w1', gt(1.5), '>1.5-5.5 m/s ลมเบา', 'ลมเบา', '#7fc63d', 'none'], ['w0', any, '≤1.5 m/s ลมสงบ', 'ลมสงบ', '#afd3ff', 'none']],
        icon: 'M12.8 19.6A2 2 0 1 0 14 16H2 M17.5 8a2.5 2.5 0 1 1 2 4H2 M9.8 4.4A2 2 0 1 1 11 8H2' },
      { key: 'dir', hist: 'wind', label: 'ทิศทางลม (Wind Direction)', name: 'ทิศทางลม', unit: '°', unitTh: 'องศา', col: 'ทิศทางลม', title: 'ทิศทางลม (ลมพัดมาจาก)',
        cats: D8.map((d, i) => ['d' + d[0], (v) => Math.round(v / 45) % 8 === i, d[1] + ' (' + d[0] + ')', d[1], d[2], 'none']), dir: true,
        icon: 'M12 20V4 M6 10l6-6 6 6' },
      { key: 'pres', hist: 'pres', label: 'ความกดอากาศ (Atmospheric Pressure)', name: 'ความกดอากาศ', unit: 'hPa', unitTh: 'hPa', col: 'ความกดอากาศ', title: 'เกณฑ์ความกดอากาศ',
        cats: [['p990', lt(990), '<990 hPa ต่ำมาก (พายุ)', 'ต่ำมาก', '#fb2c36', 'bad'], ['p1000', lt(1000), '990-1000 hPa ต่ำ', 'ต่ำ', '#f59a3a', 'warn'], ['p1015', lt(1015), '1000-1015 hPa ปกติ', 'ปกติ', '#7fc63d', 'ok'], ['p9', any, '≥1015 hPa สูง', 'สูง', '#60a5fa', 'ok']],
        icon: 'M12 14l4-4 M3.34 19a10 10 0 1 1 17.32 0' },
      { key: 'co2', hist: 'co2', label: 'ก๊าซคาร์บอนไดออกไซด์ (CO₂)', name: 'ก๊าซคาร์บอนไดออกไซด์', unit: 'ppm', unitTh: 'ppm', col: 'CO₂', title: 'เกณฑ์ก๊าซคาร์บอนไดออกไซด์',
        cats: [['o2000', gt(2000), '>2,000 ppm สูงมาก', 'สูงมาก', '#fb2c36', 'bad'], ['o1000', gt(1000), '>1,000-2,000 ppm สูง', 'สูง', '#f59a3a', 'warn'], ['o600', gt(600), '>600-1,000 ppm ปานกลาง', 'ปานกลาง', '#f0d447', 'none'], ['o0', any, '≤600 ppm ดี', 'ดี', '#7fc63d', 'ok']],
        icon: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' },
      { key: 'pm', hist: 'pm', label: 'ฝุ่นละอองขนาดไม่เกิน 2.5 ไมครอน (PM2.5)', name: 'ฝุ่น PM 2.5', unit: 'µg/m³', unitTh: 'µg/m³', col: 'PM 2.5', title: 'เกณฑ์ฝุ่น PM 2.5',
        cats: [['m75', gt(75), '>75 µg/m³ มีผลกระทบต่อสุขภาพ', 'มีผลกระทบ', '#fb2c36', 'bad'], ['m37', gt(37.5), '>37.5-75 เริ่มมีผลกระทบ', 'เริ่มมีผลกระทบ', '#f59a3a', 'warn'], ['m25', gt(25), '>25-37.5 ปานกลาง', 'ปานกลาง', '#f0d447', 'none'], ['m15', gt(15), '>15-25 ดี', 'ดี', '#7fc63d', 'ok'], ['m0', any, '≤15 µg/m³ ดีมาก', 'ดีมาก', '#60a5fa', 'ok']],
        icon: 'M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2 M16 17H7 M17 21H9' }
    ];
  }

  // data status per station (sample, deterministic). silent / late / gap / events — see board "สัญลักษณ์สถานะบนแผนที่"
  // Data status per station (sample, deterministic).
  // Two clocks decide it:  seenMin = now − last time the GATEWAY received anything from the station (station side)
  //                        lag     = now − ts of the newest PROCESSED sample (system side)
  //   ออฟไลน์  : seenMin > 30            → station stopped sending  → ทีมภาคสนาม
  //   ข้อมูลมาช้า : seenMin ≤ 30 and lag > 10 → station sends, pipeline behind → ทีมระบบ
  dataStat(st) {
    const hhmm = (min) => { const d = new Date(2026, 9, 9, 11, 0 - min); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
    if (st[7] == null) { let q = 3; for (let i = 0; i < st[0].length; i++) q = (Math.imul(q, 33) + st[0].charCodeAt(i) * 7) >>> 0; const seen = 35 + q % 400; return { kind: 'silent', silent: true, seenMin: seen, seenAt: hhmm(seen), lag: seen, late: 0, gap: 0, recv: 0, events: [] }; }
    let h = 7; for (let i = 0; i < st[0].length; i++) h = (Math.imul(h, 31) + st[0].charCodeAt(i)) >>> 0;
    h = h % 100;
    const lateOn = h < 9 || h % 13 === 5;
    const lag = lateOn ? 12 + (h % 9) * 5 : 1 + (h % 6);
    const seen = 1 + (h % 4);
    const gap = (h >= 9 && h < 20) || h % 17 === 3 ? 1 + (h % 3) : 0;
    const recv = gap ? 144 - gap * 6 - (h % 5) : 144;
    const EV = [['ค่ากระโดดผิดปกติ (spike)', 'warn'], ['เซนเซอร์ค้าง (flatline)', 'crit'], ['แบตเตอรี่ต่ำ', 'info'], ['ค่าเกินช่วงวัด', 'warn']];
    const events = (h >= 20 && h < 31) || h % 11 === 4 ? [{ type: EV[h % 4][0], sev: EV[h % 4][1] }] : [];
    // this phase: rainfall stations use only ออฟไลน์ (silent) and ข้อมูลขาดช่วง (gap); late data and event statuses are off
    const late = lateOn ? lag : 0;
    return { kind: gap ? 'gap' : late ? 'late' : 'ok', silent: false, seenMin: seen, seenAt: hhmm(seen), lag: late, late, valAt: hhmm(late ? late : seen), gap, recv, events: [] };
  }

  // latest values of the non-rain metrics (sample, deterministic per station; offline stations have none)
  meas(st) {
    if (st[7] == null) return { temp: null, hum: null, wind: null, dir: null, pres: null, co2: null, pm: null };
    let seed = 29;
    const key = st[0] + ':m';
    for (let i = 0; i < key.length; i++) seed = (Math.imul(seed, 31) + key.charCodeAt(i)) >>> 0;
    const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let x = seed; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const r1 = (x) => Math.round(x * 10) / 10;
    return {
      temp: r1(22 + Math.pow(rnd(), 2.2) * 21), hum: Math.round(35 + rnd() * 64), wind: r1(Math.pow(rnd(), 2.2) * 21), dir: (Math.floor(rnd() * 8) % 8) * 45,
      pres: r1(986 + rnd() * 32), co2: Math.round(380 + Math.pow(rnd(), 3) * 2000), pm: Math.round(4 + Math.pow(rnd(), 2.4) * 95)
    };
  }

  // ---------- station data popup ----------
  // station switcher in the popup header: searchable list (name / code / amphoe / province), sort near · value · name, keyboard ↑ ↓ Enter Esc
  inArea(s, r) { return (!s.basin || this.basinOf(r) === s.basin) && (!s.prov || r[4] === s.prov) && (!s.amp || r[3] === s.amp) && (!s.tam || r[2] === s.tam); }

  ssVals(s, R, lt, met, MS, st) {
    const geo = (r) => [20.62 - r[6] / 100, r[5] / 100 + 97.15];
    const km = (a, b) => { const d = Math.PI / 180, x = (b[1] - a[1]) * d * Math.cos((a[0] + b[0]) / 2 * d), y = (b[0] - a[0]) * d; return Math.sqrt(x * x + y * y) * 6371; };
    const here = geo(st), q = (s.ssQ || '').trim().toLowerCase(), sort = s.ssSort || 'near';
    const val = (r) => (met.key === 'rain' ? this.rainOf(r, s.period) : (MS[r[0]] || this.meas(r))[met.key]);
    const cat = (v) => (v == null ? null : met.cats.find((c) => c[1](v)) || met.cats[met.cats.length - 1]);
    let L = R.map((r, i) => ({ r, code: 'G15006-' + (5501 + i * 13), v: val(r), d: km(here, geo(r)) })).filter((o) => o.r[0] !== st[0]);
    if (q) L = L.filter((o) => (o.r[1] + ' ' + o.code + ' ' + o.r[2] + ' ' + o.r[3] + ' ' + o.r[4]).toLowerCase().indexOf(q) >= 0);
    L.sort(sort === 'val' ? (a, b) => (b.v == null ? -1e9 : b.v) - (a.v == null ? -1e9 : a.v) : sort === 'name' ? (a, b) => a.r[1].localeCompare(b.r[1], 'th') : (a, b) => a.d - b.d);
    const hi = Math.min(Math.max(0, s.ssHi || 0), Math.max(0, L.length - 1));
    const go = (id) => this.setState({ st: id, sel: id, stPh: 0, qr: false, ssOpen: false, ssQ: '', ssHi: 0, sph: null });
    const scrollHi = () => { try { const el = document.querySelector('.sp-ss-list .on'); if (el) el.scrollIntoView({ block: 'nearest' }); } catch (e) {} };
    const unit = met.dir ? '°' : ' ' + met.unitTh;
    return {
      ssOpen: !!s.ssOpen,
      ssToggle: () => this.setState({ ssOpen: !s.ssOpen, ssHi: 0 }, () => { try { const i = document.querySelector('.sp-ss-in input'); if (i) i.focus(); } catch (e) {} }),
      ssQ: s.ssQ || '', ssHasQ: !!(s.ssQ || ''), ssClear: () => this.setState({ ssQ: '', ssHi: 0 }, () => { try { document.querySelector('.sp-ss-in input').focus(); } catch (e) {} }),
      ssInput: (e) => this.setState({ ssQ: e.target.value, ssHi: 0 }),
      ssKey: (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); this.setState({ ssHi: Math.min(L.length - 1, hi + 1) }, scrollHi); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); this.setState({ ssHi: Math.max(0, hi - 1) }, scrollHi); }
        else if (e.key === 'Enter') { e.preventDefault(); if (L[hi]) go(L[hi].r[0]); }
      },
      ssActive: L.length ? 'ss-' + L[hi].r[0] : '',
      ssCount: (q ? 'พบ ' : 'ทั้งหมด ') + L.length + ' สถานี',
      ssSorts: [['near', 'ใกล้สถานีนี้'], ['val', met.dir ? 'ค่า' : 'ค่ามากสุด']].map(([k, l]) => ({ label: l, on: sort === k, cls: sort === k ? 'on' : '', pick: () => this.setState({ ssSort: k, ssHi: 0 }) })),
      ssItems: L.slice(0, 200).map((o, i) => { const c = cat(o.v); const col = c ? c[4] : '#71717a'; return {
        domId: 'ss-' + o.r[0], on: i === hi, cls: i === hi ? 'on' : '',
        dot: 'background: ' + col + ';', name: o.r[1], sub: o.code + ' · อ.' + o.r[3] + ' จ.' + o.r[4],
        val: o.v == null ? 'ออฟไลน์' : (Math.round(o.v * 10) / 10).toLocaleString('en-US') + unit, vStyle: c && (c[5] === 'bad' || c[5] === 'warn') ? 'color: ' + (c[5] === 'bad' ? (lt ? '#dc2626' : '#f87171') : (lt ? '#b45309' : '#fbbf24')) + ';' : '',
        dist: o.d < 1 ? '< 1 กม.' : Math.round(o.d).toLocaleString('en-US') + ' กม.',
        hover: () => { if (i !== hi) this.setState({ ssHi: i }); }, pick: () => go(o.r[0]) }; }),
      ssEmpty: L.length === 0
    };
  }

  stVals(s, R, lt, MD, met, MS) {
    if (!s.st || s.hist) return { stOpen: false };
    const E = createElement;
    const idx = Math.max(0, R.findIndex((r) => r[0] === s.st));
    const st = R[idx];
    const ext = st[0].indexOf('tw-') === 0; // ThaiWater (other agency) station: rainfall only, no photo/contact/admin
    if (ext && met.key !== 'rain') met = MD.find((d) => d.key === 'rain') || met;
    const code = ext ? st[0].slice(3) : 'G15006-' + (5501 + idx * 13);
    let seed = 11;
    for (let i = 0; i < st[0].length; i++) seed = (Math.imul(seed, 31) + st[0].charCodeAt(i)) >>> 0;
    const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let x = seed; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const IDX = { d1: 7, d3: 8, d5: 9 };
    const DS = this.dataStat(st);
    if (ext && st[11]) { DS.valAt = st[11]; DS.seenAt = st[11]; }
    const dsTxtOld = DS.silent ? 'ออฟไลน์ · ไม่ได้รับข้อมูล ' + DS.lastMin + ' นาที' : [DS.late ? 'ข้อมูลมาช้า ' + DS.late + ' นาที' : 'รับข้อมูลล่าสุด ' + DS.lastMin + ' นาทีที่แล้ว', DS.gap ? 'ข้อมูลขาดช่วง ' + DS.gap + ' ช่วง (' + DS.recv + '/144 ใน 24 ชม.)' : '', DS.events.length ? 'event เปิด ' + DS.events.length + ': ' + DS.events[0].type : ''].filter(Boolean).join(' · ');
    const M = MS[st[0]] || this.meas(st);
    const vOf = (d) => (d.key === 'rain' ? this.rainOf(st, s.period) : M[d.key]);
    const catOf = (d) => { const v = vOf(d); if (v == null) return null; const cats=d.key==='rain' && s.crit==='own'?this.rainCategories(s.period,code):d.cats; return cats.find(x=>x[1](v)) || cats[cats.length-1]; };
    const lvOf = (d) => { const c = catOf(d); return c ? c[5] : 'none'; };
    const v = vOf(met), mLv = lvOf(met);
    const mCat = catOf(met);
    // badge = the criteria band itself (ThaiWater-style: no วิกฤต/เฝ้าระวัง wording, only the amount band)
    const lvl = v == null ? ['ออฟไลน์', 'b-none', 'none', ''] : [mCat[3], 'b-cat', mLv, 'background: ' + mCat[4] + '; color: ' + this.inkOn(mCat[4]) + ';'];
    const lat = 20.62 - st[6] / 100 + rnd() * 0.009, lon = st[5] / 100 + 97.15 + rnd() * 0.009;
    const utm = (la, lo) => {
      const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
      const zone = Math.floor((lo + 180) / 6) + 1, lo0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
      const p = la * Math.PI / 180, l = lo * Math.PI / 180, sn = Math.sin(p), cs = Math.cos(p), tn = Math.tan(p);
      const N = a / Math.sqrt(1 - e2 * sn * sn), T = tn * tn, C = ep2 * cs * cs, A = cs * (l - lo0);
      const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * p - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p) + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p) - (35 * e2 ** 3 / 3072) * Math.sin(6 * p));
      const Ee = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000;
      const Nn = k0 * (M + N * tn * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
      return 'Zone ' + zone + 'N, E ' + Ee.toFixed(2) + ', N ' + Nn.toFixed(2);
    };
    const PEOPLE = ['นายสมชาย วงศ์ศรี', 'นางสาวพิมพ์ชนก แก้วมณี', 'นายประเสริฐ ทองดี', 'นางวิไลวรรณ ศรีสุข', 'นายอนุชา บุญมา', 'นายธีรวัฒน์ ใจดี'];
    const phone = '08' + String(10000000 + Math.floor(rnd() * 89999999));
    // latest readings (sample values, deterministic per station)
    const r1 = (x) => Math.round(x * 10) / 10;
    const D8 = { 0: ['เหนือ', 'N'], 45: ['ตะวันออกเฉียงเหนือ', 'NE'], 90: ['ตะวันออก', 'E'], 135: ['ตะวันออกเฉียงใต้', 'SE'], 180: ['ใต้', 'S'], 225: ['ตะวันตกเฉียงใต้', 'SW'], 270: ['ตะวันตก', 'W'], 315: ['ตะวันตกเฉียงเหนือ', 'NW'] };
    const PER = (this.periods().find((q) => q[0] === s.period) || [0, '24 ชม.'])[1];
    const SHORT = { rain: 'ปริมาณน้ำฝน', temp: 'อุณหภูมิอากาศ', hum: 'ความชื้นสัมพัทธ์', wind: 'ความเร็วลม', dir: 'ทิศทางลม', pres: 'ความกดอากาศ', co2: 'ก๊าซคาร์บอนไดออกไซด์', pm: 'ฝุ่น PM 2.5' };
    const card = (d) => {
      const x = vOf(d), sel = d.key === met.key;
      const cc = d.dir ? null : catOf(d);
      const base = Object.assign({ key: d.key, unit: d.dir ? '' : d.unit, status: lvOf(d), hl: sel }, cc ? { band: cc[3], color: cc[4], ink: this.inkOn(cc[4]) } : {});
      if (x == null) return Object.assign(base, { label: SHORT[d.key], value: '–' });
      if (d.dir) return Object.assign(base, { label: 'ทิศทางลม · ' + D8[x][0], value: x + '°', extra: '(' + D8[x][1] + ')' });
      return Object.assign(base, { label: d.key === 'rain' ? 'ปริมาณน้ำฝน · ' + PER : SHORT[d.key], value: d.key === 'pres' ? x.toFixed(1) : String(x) });
    };
    const readings = MD.map(card);
    const one = Object.assign(card(met), { hl: false });
    // supporting numbers for the hero card
    const fmtS = (x) => (x == null ? '–' : (Math.round(x * 10) / 10) + (met.dir ? '°' : ' ' + met.unit));
    // popup preview = the history chart itself (ข้อมูลย้อนหลัง): same tabs (รายวัน / รายเดือน / รายปี) and ranges, own state s.sph
    const sph = Object.assign({ gran: s.period === 'm' ? 'month' : s.period === 'y' ? 'year' : 'day', range: ({ '1h':'1h',today:'today',yesterday:'yesterday',d1: '24h', d3: '72h', d5: '5d', d7: '7d', d15: '15d' })[s.period] || '24h' }, s.sph || {});
    const MINI = met.dir || DS.silent ? null : this.histVals(s, R, lt, { h: { id: st[0], sensor: met.hist, gran: sph.gran, range: sph.range, pg: 1, full: false }, W: ext ? 1000 : 660, H: 230,
      onSet: (o) => this.setState({ sph: Object.assign({}, sph, { gran: o.gran || sph.gran, range: o.range || sph.range }) }) });
    const comparisonRanges = [['24h','24 ชม.'], ['72h','3 วัน'], ['5d','5 วัน'], ['7d','7 วัน'], ['15d','15 วัน']];
    const comparisonPeriod = sph.gran === 'month' ? 'm' : sph.gran === 'year' ? 'y' : { '24h': 'd1', '72h': 'd3', '5d': 'd5', '7d': 'd7', '15d': 'd15' }[sph.range];
    const dailyRanges = [['1h','ฝน 1 ชั่วโมง'],['24h','24 ชม. (Default)'],['today','ฝนวันนี้'],['yesterday','ฝนวานนี้']];
    const dailyKey = ['1h','24h','today','yesterday'].includes(sph.range);
    const rainHours = this.histSeries(st[0], 'rain', st);
    const since7 = (rainHours.NOW.getHours() - 7 + 24) % 24;
    const dailyRain = sph.range === '1h' ? rainHours.hr[0] : ['today','yesterday'].includes(sph.range) ? Math.round(rainHours.hr.slice(sph.range === 'today' ? 0 : since7, sph.range === 'today' ? since7 : since7 + 24).reduce((a,b)=>a+b,0)*10)/10 : null;
    const comparisonLabel = sph.gran === 'month' ? 'รายเดือน' : sph.gran === 'year' ? 'รายปี' : ([...dailyRanges,...comparisonRanges].find((p) => p[0] === sph.range) || [0, sph.range === 'today' ? 'วันนี้' : 'ไม่ระบุช่วงเวลา'])[1];
    const spComparison = { code, province: st[4], range: sph.gran === 'day' ? sph.range : sph.gran, offline: !!DS.silent, periodLabel: comparisonLabel,
      value: DS.silent ? null : sph.gran === 'day' && ['1h','today','yesterday'].includes(sph.range) ? dailyRain : comparisonPeriod ? this.rainOf(st, comparisonPeriod) : null,
      dailyGroup: sph.gran === 'day' && dailyKey, dailyDescription: sph.range === 'today' ? 'ตั้งแต่ 07:00 น. ของวันปัจจุบันถึงเวลาปัจจุบัน' : sph.range === 'yesterday' ? 'ตั้งแต่ 07:00 น. ของวันก่อนหน้า ถึง 07:00 น. ของวันปัจจุบัน' : sph.range === '1h' ? 'สะสมย้อนหลัง 1 ชั่วโมง นับจากเวลาปัจจุบัน' : 'สะสมย้อนหลัง 24 ชั่วโมง นับจากเวลาปัจจุบัน',
      dailyOptions: dailyRanges.map(([key,label])=>({key,label,selected:sph.range===key,pick:()=>this.setState({sph:{gran:'day',range:key}})})),
      periods: comparisonRanges.map(([key, label]) => ({ key, label, selected: sph.gran === 'day' && (sph.range === key || key === '24h' && dailyKey),
        pick: () => this.setState({ sph: { gran: 'day', range: key } }) })) };
    const spHourly = null;
    const spStats = met.key === 'rain'
      ? ({ d1: ['d1', 'd3', 'd5'], d3: ['d1', 'd3', 'd5'], d5: ['d3', 'd5', 'd7'], d7: ['d5', 'd7', 'd15'], d15: ['d7', 'd15', 'm'], m: ['d15', 'm', 'y'], y: ['d15', 'm', 'y'] }[s.period] || ['d1', 'd3', 'd5']).map((pk) => { const q = this.periods().find((x) => x[0] === pk); const x = this.rainOf(st, pk); return { label: 'ฝน ' + q[1], value: x == null ? '–' : x.toLocaleString('en-US') + ' mm', on: s.period === pk, pick: () => this.setState({ period: pk, page: 1 }) }; })
      : met.dir ? [] : v == null ? [] : (() => {
        const sp = { temp: 4.5, hum: 14, wind: 3.2, pres: 2.4, co2: 140, pm: 12 }[met.key] || 1;
        return [{ label: 'ต่ำสุดวันนี้', value: fmtS(Math.max(0, v - sp)) }, { label: 'สูงสุดวันนี้', value: fmtS(v + sp * 0.6) }, { label: 'เฉลี่ย 24 ชม.', value: fmtS(v - sp * 0.2) }];
      })();
    // QR (illustrative pattern from the station code)
    const n = 25, cell = 5, qk = [];
    let qs = 0; for (let i = 0; i < code.length; i++) qs = (Math.imul(qs, 33) + code.charCodeAt(i)) >>> 0;
    const qr = () => { qs = (Math.imul(qs, 1103515245) + 12345) >>> 0; return (qs >>> 16) & 1; };
    const finder = (x, y) => [[x, y, 7], [x + 1, y + 1, 5], [x + 2, y + 2, 3]].forEach(([a, b, w], j) => qk.push(E('rect', { key: 'f' + x + y + j, x: a * cell, y: b * cell, width: w * cell, height: w * cell, fill: j === 1 ? '#ffffff' : '#0f172a' })));
    const inF = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inF(x, y) && qr()) qk.push(E('rect', { key: x + '-' + y, x: x * cell, y: y * cell, width: cell, height: cell, fill: '#0f172a' }));
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    const PH = ['./assets/4c25bd342f475f24ffee0630da9e320a.jpg', './assets/debfa4f497673172a9a6052cb3775156.jpg', './assets/7cb7125fdc60fd4b663030a3f25ca65c.jpg'];
    const ph = (s.stPh || 0) % PH.length;
    const setP = (i) => this.setState({ stPh: (i + PH.length) % PH.length });
    return {
      stOpen: true, stClose: () => this.setState({ st: null, qr: false, sph: null, ssOpen: false, ssQ: '' }),
      spBadge: lvl[0], spBadgeCls: 'sp-bd ' + lvl[1], spBadgeStyle: lvl[3] || '', spTitle: code + ' ' + st[1], spName: st[1], spLoc: 'ต.' + st[2] + ' อ.' + st[3] + ' จ.' + st[4], spAgency: this.agLabel(st[10] || 'กรมป้องกันและบรรเทาสาธารณภัย'), spCode: code,
      ...this.ssVals(s, R, lt, met, MS, st),
      spPhStyle: 'background-image: url(' + PH[ph] + ');', spPhAria: 'ภาพสถานี ' + st[1] + ' (' + (ph + 1) + '/' + PH.length + ')',
      spOnline: DS.silent ? 'ออฟไลน์' : DS.late ? 'มาช้า ' + DS.late + ' น.' : 'ออนไลน์', spOnCls: DS.silent ? 'sp-on off' : DS.late ? 'sp-on late' : 'sp-on',
      spPrev: () => setP(ph - 1), spNext: () => setP(ph + 1),
      spDots: PH.map((_, i) => ({ cls: i === ph ? 'on' : '', cur: i === ph ? 'true' : undefined, aria: 'รูปที่ ' + (i + 1), pick: () => setP(i) })),
      spInfo: [
        { k: 'ลุ่มน้ำ', v: 'ลุ่มน้ำ' + this.basinOf(st) },
        { k: 'ผู้ดูแลอุปกรณ์/ผู้ประสานงาน', v: PEOPLE[idx % PEOPLE.length] },
        { k: 'โทรศัพท์', v: 'โทร : ' + phone },
        { k: 'ละติจูด', v: lat.toFixed(14) },
        { k: 'ลองจิจูด', v: lon.toFixed(14) },
        { k: 'พิกัด UTM', v: utm(lat, lon) },
        { k: 'สถานะข้อมูล', v: DS.silent ? 'ออฟไลน์ · ไม่ส่งข้อมูลมา ' + DS.seenMin + ' นาที' : DS.late ? 'ข้อมูลมาช้า ' + DS.late + ' นาที · สถานีส่งล่าสุด ' + DS.seenAt : (DS.gap ? 'ข้อมูลขาดช่วง ' + DS.gap + ' ช่วง (' + DS.recv + '/144 ใน 24 ชม.) · ' : 'ปกติ · ') + 'รับข้อมูลล่าสุด ' + DS.seenAt + (DS.events.length ? ' · event: ' + DS.events[0].type : '') }
      ],
      qrOpen: !!s.qr, toggleQr: () => this.setState({ qr: !s.qr }),
      spInfoOpen: !!s.spInfo, toggleInfo: () => this.setState({ spInfo: !s.spInfo }), spInfoChev: s.spInfo ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6',
      spInfoSum: 'ลุ่มน้ำ' + this.basinOf(st) + ' · ' + PEOPLE[idx % PEOPLE.length],
      spPerson: PEOPLE[idx % PEOPLE.length], spInit: PEOPLE[idx % PEOPLE.length].replace(/^(นาย|นางสาว|นาง)/, '').charAt(0),
      spTel: 'tel:' + phone, spPhoneFmt: phone.slice(0, 3) + '-' + phone.slice(3, 6) + '-' + phone.slice(6),
      spBasin: this.basinOf(st), spLatLon: lat.toFixed(5) + ', ' + lon.toFixed(5), spUtm: utm(lat, lon),
      spDataStat: DS.silent ? 'ออฟไลน์ · ไม่ส่งข้อมูลมา ' + DS.seenMin + ' นาที' : DS.late ? 'ข้อมูลมาช้า ' + DS.late + ' นาที · สถานีส่งล่าสุด ' + DS.seenAt : (DS.gap ? 'ข้อมูลขาดช่วง ' + DS.gap + ' ช่วง (' + DS.recv + '/144 ใน 24 ชม.) · ' : 'ปกติ · ') + 'รับข้อมูลล่าสุด ' + DS.seenAt + (DS.events.length ? ' · event: ' + DS.events[0].type : ''),
      spCopyTxt: s.copied === st[0] ? 'คัดลอกแล้ว' : 'คัดลอก',
      copyLatLon: () => { try { const pr = navigator.clipboard && navigator.clipboard.writeText(lat.toFixed(5) + ', ' + lon.toFixed(5)); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {} this.setState({ copied: st[0] }); setTimeout(() => this.setState((x) => (x.copied === st[0] ? { copied: null } : null)), 1800); },
      spQr: E('svg', { width: 125, height: 125, viewBox: '0 0 125 125', role: 'img', 'aria-label': 'QR Code ' + code }, qk),
      spHist: () => this.setState({ qr: false, hist: { id: st[0], sensor: met.hist, gran: s.period === 'm' ? 'month' : s.period === 'y' ? 'year' : 'day', range: null, pg: 1, full: false } }),
      spCls: s.stAll && !ext ? 'abs sp' : 'abs sp one' + (MINI ? ' hr' : '') + (ext ? ' sp-ext' : ''), spSingle: !s.stAll || ext, spMulti: !!s.stAll && !ext, spInt: !ext,
      spShowAll: () => this.setState({ stAll: true, qr: false }), spShowOne: () => this.setState({ stAll: false, qr: false }),
      spBanOn: !ext && (DS.silent || DS.late > 0),
      spBanCls: DS.silent ? 'sp-ban sil' : 'sp-ban late',
      spBanIcon: DS.silent ? 'M12 20h.01 M8.5 16.4a5 5 0 0 1 7 0 M5 12.9a10 10 0 0 1 5.2-2.8 M19 12.9a10 10 0 0 0-2.1-1.7 M2 8.8a15 15 0 0 1 4.2-2.7 M22 8.8a15 15 0 0 0-11.3-3.8 M2 2l20 20' : 'M12 6v6l4 2 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
      spBanTitle: DS.silent ? 'ออฟไลน์' : 'ข้อมูลมาช้า ' + DS.late + ' นาที',
      spBanText: DS.silent ? 'ไม่ได้รับข้อมูลจากสถานีมา ' + DS.seenMin + ' นาที (ส่งล่าสุด ' + DS.seenAt + ') · ปัญหาอยู่ที่อุปกรณ์หรือสัญญาณ ไม่มีค่าล่าสุดให้แสดง'
        : 'สถานียังส่งตามปกติ (ส่งล่าสุด ' + DS.seenAt + ') แต่ระบบประมวลผลตามไม่ทัน · ค่าที่แสดงเป็นของเวลา ' + DS.valAt + ' น.',
      spBanWho: DS.silent ? 'ส่งทีมออกหน้างาน' : 'แจ้งทีมระบบ',
      spComparison, spIsRain: met.key === 'rain', spIsOther: met.key !== 'rain', spCount: MD.length, spMetric: met.name, spOne: [one], spStats: [], spHourly,
      spMini: !!MINI, mnTitle: MINI ? MINI.hxTitle : '', mnGrans: MINI ? MINI.hxGrans : [], mnDaily: MINI ? MINI.hxDaily : false, mnCapOn: MINI ? MINI.hxCapOn : false, mnCap: MINI ? MINI.hxCap : '',
      mnRanges: MINI ? MINI.hxRanges : [], mnChart: MINI ? MINI.hxChart : null, mnSw: MINI ? MINI.hxSw : '', mnLegend: MINI ? MINI.hxLegend : '',
      mnMore: () => this.setState({ qr: false, hist: { id: st[0], sensor: met.hist, gran: sph.gran, range: sph.range, pg: 1, full: false } }),
      spCriteria: this.criteriaContext(st, met.key, s.period, v, met.unitTh, met.name), spReadings: readings, spNote: DS.silent ? 'ออฟไลน์ · ไม่มีค่าล่าสุดให้แสดง' : DS.late ? 'ข้อมูลมาช้า · ค่านี้เป็นของเวลา ' + DS.valAt + ' น.' : 'ค่าที่เลือกในตัวกรอง “ประเภทข้อมูล”', spTime: '9 ต.ค. 2569 ' + (ext && st[11] ? st[11] : '11:00') + ' น.' 
    };
  }

  // one dropdown model for every filter (basin / province / district / sub-district / agency)
  ddVals(v) {
    const s = this.state;
    const split = (l) => { const m = /^(.*) \((\d+)\)$/.exec(String(l)); return m ? [m[1], m[2]] : [String(l), '']; };
    const mk = (key, name, all, list, cur, setter, o2) => {
      o2 = o2 || {};
      const dis = !!o2.dis, open = s.dd === key && !dis;
      const sel = (list || []).find((o) => o.on);
      const selT = sel ? split(sel.label)[0] : '';
      const pickV = (val) => { this.setState({ dd: null }); setter({ target: { value: val } }); };
      const items = (o2.noAll ? [] : [{ v: '', label: all + (o2.allN != null ? ' (' + o2.allN + ')' : ''), on: !cur }]).concat(list || []).map((o) => {
        const [tx, n] = split(o.label), on = o.v === '' ? !cur : !!o.on;
        return { t: tx, n, nCls: n ? 'n' : 'n none', on, dis: !!o.dis, cls: 'dd-op' + (on ? ' on' : '') + (o.v === '' ? ' all' : ''), pick: () => { if (!o.dis) pickV(o.v); } };
      });
      return { name, open, dis, items, hasV: !!cur && !dis && !o2.noClear, label: sel ? selT : (o2.ph || all), aria: name + ': ' + (sel ? selT : all), clrAria: 'ล้างตัวกรอง' + name,
        cls: (o2.base || 'abs ex-f ex-dd') + ' dd-x' + (dis ? ' dis' : '') + (cur ? ' has' : '') + (open ? ' open' : ''),
        chev: open ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6',
        toggle: () => this.setState({ dd: open ? null : key, mOpen: false }), close: () => this.setState({ dd: null }),
        clear: (e) => { if (e && e.stopPropagation) e.stopPropagation(); pickV(''); } };
    };
    return {
      ddBasin: mk('basin', 'ลุ่มน้ำ', 'ลุ่มน้ำทั้งหมด', v.basins, s.basin, v.setBasin),
      ddProv: mk('prov', 'จังหวัด', 'จังหวัดทั้งหมด', v.provs, s.prov, v.setProv),
      ddAmp: mk('amp', 'อำเภอ', 'อำเภอทั้งหมด', v.amps, s.amp, v.setAmp, { dis: v.ampDis, ph: v.ampPh }),
      ddTam: mk('tam', 'ตำบล', 'ตำบลทั้งหมด', v.tams, s.tam, v.setTam, { dis: v.tamDis, ph: v.tamPh }),
      ddAg: mk('ag', 'หน่วยงาน', 'ทุกหน่วยงาน', v.agOpts, s.agf, v.setAgf, { base: 'ex-lf-ag ex-dd', allN: v.agAllN }),
      ddSize: mk('size', 'จำนวนรายการต่อหน้า', '', (v.sizes || []).map((z) => ({ v: z.v, label: String(z.v), on: z.on })), s.size || 10, v.setSize, { base: 'ex-sel ex-dd dd-up', noAll: true, noClear: true })
    };
  }

  // a click on a panel backdrop that lands on a map button also presses that button (one click to switch panels)
  passMbtn(e) { try { if (!e || e.clientX == null) return; const b = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.classList && x.classList.contains('ex-mbtn')); if (b) setTimeout(() => b.click(), 0); } catch (err) {} }

  // CCTV alert levels (ระบบเฝ้าระวังภัยพิบัติ)
  cctvLv() { return [['ติดตาม', '#4ade80'], ['เฝ้าระวัง', '#38bdf8'], ['เตรียมรับมือ', '#facc15'], ['อพยพ', '#f97316'], ['ต้องอพยพ', '#ef4444']]; }

  // weather + map-layer panels (controls + legend only; no map drawing yet)
  xlVals() {
    const s = this.state, pnl = s.pnl;
    const open = (k) => () => this.setState({ pnl: pnl === k ? null : k, lyOpen: false, bmOpen: false, dd: null, mOpen: false });
    const btn = (k, n) => 'abs ex-mbtn ' + n + (pnl === k ? ' on' : '');
    // ---- weather ----
    const WX = [['cloud', 'เมฆ', 'ปริมาณเมฆ', 'linear-gradient(90deg,#334155,#94a3b8,#f1f5f9)', '0%', '100%'],
      ['rain', 'ฝน', 'ฝน (มม./ชม.)', 'linear-gradient(90deg,#a5f3fc,#22d3ee,#2563eb,#7c3aed,#db2777)', '0.1', '50+'],
      ['temp', 'อุณหภูมิ', 'อุณหภูมิ (°C)', 'linear-gradient(90deg,#3b82f6,#22c55e,#facc15,#f97316,#dc2626)', '15', '40+'],
      ['wind', 'ความเร็วลม', 'ความเร็วลม (ม./วิ)', 'linear-gradient(90deg,#e0f2fe,#38bdf8,#22c55e,#facc15,#ef4444)', '0', '20+'],
      ['pres', 'ความกดอากาศ', 'ความกดอากาศ (hPa)', 'linear-gradient(90deg,#7c3aed,#3b82f6,#22c55e,#facc15,#ef4444)', '990', '1030']];
    const wxOn = s.wx !== false, wv = WX.find((w) => w[0] === s.wxVar) || WX[0];
    const rnOn = s.rainObs !== false, fc = !!s.rainFc;
    const TIMES = fc ? ['16:00', '17:00', '18:00'] : ['13:10', '14:10', '15:10'];
    const ti = Math.min(2, Math.max(0, s.rainT == null ? 2 : s.rainT));
    // ---- map layers ----
    const mp = Object.assign({ r1: false, r2: false, comm: false, trans: false, basin: false, plc: false, adm: false }, s.mp || {});  // default: only rain layers active
    const bsel = s.bsel || {}, psel = s.psel || {};
    const asel = Object.assign({ prov: true }, s.asel || {});
    const setMp = (k) => () => this.setState({ mp: Object.assign({}, mp, { [k]: !mp[k] }) });
    const MPR = [['r1', 'เส้นทางน้ำสายหลัก', 'sy-ln', 'border-top: 3px solid #2563eb;'], ['r2', 'เส้นทางน้ำสายรอง', 'sy-ln', 'border-top: 2px solid #60a5fa;'],
      ['comm', 'เขตพื้นที่ชุมชน', 'sy-ring', 'border-color: #a855f7; background: rgba(168,85,247,.35);'], ['trans', 'เส้นทางคมนาคม', 'sy-ln', 'border-top: 3px solid #f97316;'],
      ['basin', 'ลุ่มแม่น้ำหลัก', 'sy-tri', 'border-left-color: #22c55e;']];
    const BAS = ['สาละวิน', 'โขงเหนือ', 'โขงตะวันออกเฉียงเหนือ', 'ชี', 'มูล', 'ปิง', 'วัง', 'ยม', 'น่าน', 'สะแกกรัง', 'ป่าสัก', 'ท่าจีน', 'แม่กลอง', 'บางปะกง', 'โตนเลสาบ', 'ชายฝั่งทะเลตะวันออก', 'เพชรบุรี-ประจวบคีรีขันธ์', 'ภาคใต้ฝั่งตะวันออกตอนบน', 'ทะเลสาบสงขลา', 'ภาคใต้ฝั่งตะวันออกตอนล่าง'];
    const SHD = 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z';
    const PLC = [['edu', 'สถานศึกษา', '#2563eb', 'M22 10 12 5 2 10l10 5 10-5z M6 12v5c3 2 9 2 12 0v-5'], ['hos', 'โรงพยาบาล', '#ef4444', 'M4 4h16v16H4z M12 8v8 M8 12h8'],
      ['dz', 'ปภ.ศูนย์เขต', '#1d4ed8', SHD], ['dp', 'ปภ.จังหวัด', '#2563eb', SHD], ['rel', 'ศาสนสถาน', '#d97706', 'M12 2l3 5H9z M6 10h12v10H6z M10 20v-5h4v5'],
      ['db', 'ปภ.สาขา', '#3b82f6', SHD], ['opr', 'อปพร', '#b45309', 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M17 11a3 3 0 1 0 0-6 M21 20c0-2.6-1.7-4.9-4-5.7'],
      ['opt', 'อปท (อบต.)', '#0891b2', 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5']];
    const ADM = [['prov', 'ขอบเขตจังหวัด', 'border-top: 2px solid #94a3b8;'], ['amp', 'ขอบเขตอำเภอ', 'border-top: 2px dashed #94a3b8;'], ['tam', 'ขอบเขตตำบล', 'border-top: 2px dotted #94a3b8;']];
    const tog = (key, obj, k) => () => this.setState({ [key]: Object.assign({}, obj, { [k]: !obj[k] }) });
    const mpLegend = [];
    MPR.forEach((r) => { if (mp[r[0]]) mpLegend.push({ t: r[1] + (r[0] === 'basin' && BAS.some((b) => bsel[b]) ? ' (' + BAS.filter((b) => bsel[b]).length + ')' : ''), cls: r[2], style: r[3] }); });
    if (mp.plc) PLC.forEach((p) => { if (psel[p[0]]) mpLegend.push({ t: p[1], cls: 'sy-dot', style: 'background: ' + p[2] + ';' }); });
    if (mp.adm) ADM.forEach((a) => { if (asel[a[0]]) mpLegend.push({ t: a[1], cls: 'sy-ln', style: a[2] }); });
    const hid = s.layHid || {}, cctvOn = !s.cctvOff;
    const camTypes = [['run', 'น้ำท่า'], ['damM', 'อ่างกลาง'], ['damL', 'อ่างใหญ่'], ['vil', 'หมู่บ้านเสี่ยง']].filter((c) => !hid['cam:' + c[0]]).map((c) => c[1]);
    return {
      closePnl: (e) => { this.setState({ pnl: null }); this.passMbtn(e); },
      wxOpen: pnl === 'wx', wxBtnCls: btn('wx', 'mb2'), toggleWx: open('wx'),
      mpOpen: pnl === 'mp', mpBtnCls: btn('mp', 'mb4'), toggleMp: open('mp'),
      wxOn, wxToggle: () => this.setState({ wx: !wxOn, exW: !wxOn }),
      wxOpts: WX.map((w) => ({ label: w[1], on: w[0] === wv[0], dis: !wxOn, pick: () => this.setState({ wxVar: w[0] }) })),
      rainObsOn: rnOn, rainObsToggle: () => this.setState({ rainObs: !rnOn, exR: !rnOn }),
      rainFcOn: fc, rainFcDis: !rnOn, rainFcBtn: fc ? 'ปิด' : 'เปิด', rainFcCls: 'ly-fcb' + (fc ? ' on' : ''), rainFcToggle: () => this.setState({ rainFc: !fc, rainT: fc ? 2 : 0 }),
      rainTimes: TIMES.map((tm, i) => ({ label: (fc ? 'คาดการณ์ : ' : 'ตรวจวัด : ') + tm + ' น.', on: i === ti, dis: !rnOn, dotCls: !fc && i === 2 ? 'ly-live' : 'ly-live none', pick: () => this.setState({ rainT: i }) })),
      wxLgOn: wxOn, wxLgTitle: 'สภาพอากาศ · ' + wv[2], wxLgGrad: 'background: ' + wv[3] + ';', wxLgMin: wv[4], wxLgMax: wv[5],
      radarOn: !!s.radar, radarSub: s.radar ? 'ภาพเรดาร์รวมทั้งประเทศ · 15:10 น.' : 'ปิดอยู่', radarToggle: () => this.setState({ radar: !s.radar }),
      radarLgOn: !!s.radar, radarLegend: [['เบา', '#04e9e7'], ['ปานกลาง', '#02fd02'], ['ค่อนข้างหนัก', '#fdf802'], ['หนัก', '#fd9500'], ['หนักมาก', '#fd0000'], ['รุนแรง', '#f800fd']].map(([t2, c]) => ({ t: t2, style: 'background: ' + c + ';' })),
      rnLgOn: rnOn, rnLgTitle: (fc ? 'คาดการณ์ฝน · ' : 'เรดาร์ตรวจวัดฝน · ') + TIMES[ti] + ' น.', rnLgGrad: 'background: linear-gradient(90deg,#a5f3fc,#22c55e,#facc15,#f97316,#dc2626,#c026d3);',
      mpRows: MPR.map((r) => ({ label: r[1], on: !!mp[r[0]], symCls: 'ly-sym ' + r[2], symStyle: r[3], toggle: setMp(r[0]) })),
      basinRows: BAS.map((b) => ({ label: b, on: !!bsel[b], dis: !mp.basin, toggle: tog('bsel', bsel, b) })),
      routeRows: MPR.filter((r) => r[0] !== 'basin').map((r) => ({ label: r[1], on: !!mp[r[0]], symCls: 'ly-sym ' + r[2], symStyle: r[3], toggle: setMp(r[0]) })),
      basinOn: !!mp.basin, basinToggle: () => this.setState({ mp: Object.assign({}, mp, { basin: !mp.basin }), exB: !mp.basin }),
      basinExp: !!s.exB, basinExpTog: () => this.setState({ exB: !s.exB }),
      basinSub: (() => { const n = BAS.filter((b) => bsel[b]).length; return n ? 'เลือก ' + n + ' จาก ' + BAS.length + ' ลุ่มน้ำ' : 'ยังไม่ได้เลือกลุ่มน้ำ'; })(),
      basinBulkLbl: BAS.every((b) => bsel[b]) ? 'ล้าง' : 'เลือกทั้งหมด', basinBulkDis: !mp.basin,
      basinBulk: () => { if (BAS.every((b) => bsel[b])) this.setState({ bsel: {} }); else { const o = {}; BAS.forEach((b) => { o[b] = true; }); this.setState({ bsel: o }); } },
      plcExp: !!s.exP, plcExpTog: () => this.setState({ exP: !s.exP }),
      plcSub: (() => { const n = PLC.filter((p) => psel[p[0]]).length; return n ? 'เลือก ' + n + ' จาก ' + PLC.length + ' ประเภท' : 'ยังไม่ได้เลือกประเภท'; })(),
      admExp: !!s.exA, admExpTog: () => this.setState({ exA: !s.exA }),
      admSub: (() => { const n = ADM.filter((a) => asel[a[0]]).length; return n ? 'แสดง ' + n + ' ระดับ' : 'ยังไม่ได้เลือกระดับ'; })(),
      wxSub: wxOn ? 'กำลังแสดง: ' + wv[1] : 'ปิดอยู่', wxExp: !!s.exW, wxExpTog: () => this.setState({ exW: !s.exW }),
      rnSub: rnOn ? (fc ? 'คาดการณ์ ' : 'ตรวจวัด ') + TIMES[ti] + ' น.' : 'ปิดอยู่', rnExp: !!s.exR, rnExpTog: () => this.setState({ exR: !s.exR }),
      plcOn: mp.plc, plcToggle: () => this.setState({ mp: Object.assign({}, mp, { plc: !mp.plc }), exP: !mp.plc }),
      plcRows: PLC.map((p) => ({ label: p[1], on: !!psel[p[0]], dis: !mp.plc, d: p[3], icStyle: 'background: ' + p[2] + ';', toggle: tog('psel', psel, p[0]) })),
      admOn: mp.adm, admToggle: () => this.setState({ mp: Object.assign({}, mp, { adm: !mp.adm }), exA: !mp.adm }),
      admRows: ADM.map((a) => ({ label: a[1], on: !!asel[a[0]], dis: !mp.adm, lnStyle: a[2], toggle: tog('asel', asel, a[0]) })),
      mpLgOn: mpLegend.length > 0, mpLegend,
      cctvLgOn: cctvOn && camTypes.length > 0, cctvLgSub: '',
      cctvLegend: this.cctvLv().map((l) => ({ t: l[0], style: 'background: ' + l[1] + ';' }))
    };
  }

  renderVals() { const v = this.renderVals0(); return Object.assign(v, this.ddVals(v), this.xlVals()); }

  agList() { return [
    { name: 'กรมทรัพยากรน้ำ', code: 'DWR', abbr: 'ทน.', col: '#2c74d4' },
    { name: 'สถาบันสารสนเทศทรัพยากรน้ำ (องค์การมหาชน)', code: 'HII', abbr: 'สสน.', col: '#0ea5e9' },
    { name: 'กรมอุตุนิยมวิทยา', code: 'TMD', abbr: 'อต.', col: '#8b5cf6' },
    { name: 'กรมป้องกันและบรรเทาสาธารณภัย', code: 'DDPM', abbr: 'ปภ.', col: '#ef4444' },
    { name: 'กรมชลประทาน', code: 'RID', abbr: 'ชป.', col: '#10b981' },
    { name: 'บริษัท ไทยเบฟเวอเรจ จำกัด (มหาชน)', code: 'TBEV', abbr: 'ไทยเบฟ', col: '#f59e0b' }
  ]; }
  agLabel(name) { const m = this.agList().find((a) => a.name === name); return m ? m.abbr + ' · ' + name : name; }

  renderVals0() {
    const s = this.state;
    const lt = s.theme === 'light';
    const { R, P: P0, PW, TW, TWR } = this.data();
    const LIST = R.concat(TWR);
    // ---- rainfall agency model (used by map pins + layers panel) ----
    const AGENCIES = this.agList();
    const DDPM = 'กรมป้องกันและบรรเทาสาธารณภัย';
    const hid = s.layHid || {};
    const rainOn = !hid.rain;
    const agOn = (name) => rainOn && !hid['ag:' + name];
    const ownOn = !hid.own;  // our own Sensor (ปภ.) network, a separate layer
    const agCount = {}; AGENCIES.forEach((a) => { agCount[a.name] = 0; });
    LIST.forEach((r) => { const a = r[10] || DDPM; if (agCount[a] != null) agCount[a]++; });
    const dw = s.fit ? s.fit.dw : 0;
    const wide = !!(s.hl || s.hr || dw > 0);
    const mapW = (s.hl && s.hr ? 1866 : s.hr ? 1481 : s.hl ? 1270 : 885) + dw;
    const m = wide ? Math.max(1, mapW / 1864) : 1;
    const dx = wide ? Math.round((mapW - 1864 * m) / 2) : 0;
    const P = (wide ? PW : P0).map((p) => [p[0], Math.round(p[1] * m) + dx, Math.round(p[2] * m)]).filter((p) => p[1] > 4 && p[1] < mapW - 4 && p[2] < 863);
    // map zoom: ZL levels, centre s.zc as a fraction of the map; T() = base map px → screen px
    const ZL = [1, 1.5, 2.25, 3.2], ZMAX = ZL.length - 1, zi = Math.min(ZMAX, Math.max(0, s.zi || 0)), z = ZL[zi], MH = 867;
    const clampC = (v, L) => Math.min(L - L / (2 * z), Math.max(L / (2 * z), v));
    const cxb = clampC((s.zc ? s.zc[0] : 0.5) * mapW, mapW), cyb = clampC((s.zc ? s.zc[1] : 0.5) * MH, MH);
    const T = (x, y) => [Math.round((x - cxb) * z + mapW / 2), Math.round((y - cyb) * z + MH / 2)];
    const Tinv = (sx, sy) => [(sx - mapW / 2) / z + cxb, (sy - MH / 2) / z + cyb];
    const onMap = (x, y) => x > -24 && x < mapW + 24 && y > -24 && y < MH + 24;
    const zoomAt = (nzi, bx, by, sx, sy) => { nzi = Math.min(ZMAX, Math.max(0, nzi)); const nz = ZL[nzi]; const c = sx == null ? [bx, by] : [bx - (sx - mapW / 2) / nz, by - (sy - MH / 2) / nz]; this.setState({ zi: nzi, zc: nzi ? [c[0] / mapW, c[1] / MH] : null, tip: null }); };
    const mapStyle0 = 'width: ' + mapW + 'px; --mimg: url(' + (s.basemap === 'sat' ? (wide ? './assets/fda0c868746f83417d225dce8e2ecd1d.jpg' : './assets/ddb5dcaf4d8317ccc7d6efd90d8b8c25.jpg') : (wide ? './assets/a7aeb2c182daa3c59feb302d1ba42a22.jpg' : './assets/dd65fa0593bd6884efcd4d08f98989bd.jpg')) + '); --msz: ' + (wide ? Math.round(1864 * m * z) + 'px ' + Math.round(867 * m * z) + 'px' : Math.round(885 * z) + 'px ' + Math.round(867 * z) + 'px') + '; --mpos: ' + Math.round((dx - cxb) * z + mapW / 2) + 'px ' + Math.round((0 - cyb) * z + MH / 2) + 'px;';
    const mapStyle = mapStyle0 + (zi ? ' cursor: grab;' : '');
    const MD = this.metricDefs(s.period, s.crit || 'tw');
    const met = MD.find((x) => x.key === (s.metric || 'rain')) || MD[0];
    const isRain = met.key === 'rain';
    const CATS = met.cats;
    const COL = {}; CATS.forEach((c) => { COL[c[0]] = c[4]; }); COL.none = '#71717a';
    const LVL = {}; CATS.forEach((c) => { LVL[c[0]] = c[5]; });
    const IDX = { d1: 7, d3: 8, d5: 9 };
    const MS = {}; LIST.forEach((r) => { MS[r[0]] = this.meas(r); });
    const val = (r) => (isRain ? this.rainOf(r, s.period) : MS[r[0]][met.key]);
    const rainVal = (r) => this.rainOf(r, s.period);
    const catOf = (v,r) => { const cats=isRain && s.crit==='own' && r ? this.rainCategories(s.period,this.criteriaContext(r,'rain',s.period,v,'mm','').code) : CATS; return v == null ? 'none' : (cats.find(c=>c[1](v)) || cats[cats.length-1])[0]; };
    const TW24 = this.twRain('d1');
    const RC = [['c90', 90], ['c70', 70], ['c50', 50], ['c35', 35], ['c20', 20], ['c10', 10], ['c0', -1]];
    const rainCat = (v) => (v == null ? 'none' : RC.find((c) => v > c[1])[0]);
    const D8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const fmt = (v) => (v == null ? '–' : met.dir ? v + '° ' + D8[Math.round(v / 45) % 8] : String(v));
    const darken = (hex, k) => { const n = parseInt(hex.slice(1), 16); const c = (s0) => Math.round(((n >> s0) & 255) * k); return 'rgb(' + c(16) + ',' + c(8) + ',' + c(0) + ')'; };
    const ink = (k) => { const h = COL[k] || '#71717a'; const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? '#111111' : '#ffffff'; };
    const rank = (k) => (k === 'none' ? 99 : CATS.findIndex((c) => c[0] === k));
    const scoped = LIST.filter((r) => this.inArea(s, r));
    const counts = {}; scoped.forEach((r) => { const k = catOf(val(r),r); counts[k] = (counts[k] || 0) + 1; });
    const DSall = {}; LIST.forEach((r) => { DSall[r[0]] = this.dataStat(r); });
    // agency naming is driven by the layer's AGENCIES list, so the layer, the station popup, and the right-panel list + dropdown all match
    const AGL = AGENCIES.map((a) => a.name);
    const agOf = (r) => r[10] || DDPM;
    const agLabel = (name) => this.agLabel(name);
    const codeOf = (r) => (r[0].indexOf('tw-') === 0 ? r[0].slice(3) : 'G15006-' + (5501 + R.indexOf(r) * 13));
    const lq = (s.lq || '').trim().toLowerCase();
    const matchQ = (r) => !lq || [r[1], r[2], r[3], r[4], codeOf(r)].some((x) => String(x).toLowerCase().indexOf(lq) >= 0);
    const shown = scoped.filter((r) => !s.hidden[catOf(val(r),r)] && (!s.dsf || DSall[r[0]].kind === s.dsf) && (!s.agf || agOf(r) === s.agf) && matchQ(r));
    const sorted = isRain ? shown.slice().sort((a, b) => (val(b) == null ? -1 : val(b)) - (val(a) == null ? -1 : val(a)))
      : shown.slice().sort((a, b) => rank(catOf(val(a),a)) - rank(catOf(val(b),b)) || (met.key === 'pres' ? val(a) - val(b) : (val(b) || 0) - (val(a) || 0)));
    const pick = (id) => () => this.setState({ sel: id, st: id, stPh: 0, qr: false, tip: null, stAll: false });
    const loc = (r) => 'ต.' + r[2] + ' อ.' + r[3] + ' จ.' + r[4];
    const vCol = (k) => (LVL[k] === 'bad' ? (lt ? '#dc2626' : '#fb2c36') : (lt ? '#b45309' : '#fbbf24'));

    const alerts = sorted.filter((r) => val(r) != null && (LVL[catOf(val(r),r)] === 'bad' || LVL[catOf(val(r),r)] === 'warn')).map((r) => {
      const k = catOf(val(r),r), c = CATS.find((x) => x[0] === k);
      return { name: r[1], loc: loc(r), val: fmt(val(r)), unit: met.dir ? '' : met.unitTh, badge: c[3],
        bdStyle: 'background: ' + COL[k] + '; color: ' + ink(k) + ';',
        vStyle: 'color: ' + vCol(k) + ';',
        on: s.sel === r[0], cls: s.sel === r[0] ? 'ex-card on' : 'ex-card', pick: pick(r[0]) };
    });

    const pages = Math.max(1, Math.ceil(sorted.length / s.size));
    const page = Math.min(s.page, pages);
    const rows = sorted.slice((page - 1) * s.size, page * s.size).map((r) => {
      const k = catOf(val(r),r);
      const ds = DSall[r[0]];
      return { criteria: this.criteriaContext(r, met.key, s.period, val(r), met.unitTh, met.name), name: r[1], loc: (r[0].indexOf('tw-') === 0 ? 'รหัส ' + r[0].slice(3) + ' · ' : '') + loc(r),
        time: r[11] || (ds.silent ? ds.seenAt : ds.late ? ds.valAt : '11:00'), tmCls: ds.silent ? 'tm t-sil' : ds.late ? 'tm t-late' : 'tm',
        ag: agLabel(r[10] || DDPM), agCls: 'ag',
        // abnormal-transmission indicator, always in the same slot (bottom-right of the row): ออฟไลน์ / ข้อมูลขาดช่วง
        gpCls: ds.silent ? 'gp-d gp-sil' : ds.gap ? 'gp-d gp-gap' : ds.late ? 'gp-d gp-late' : 'gp-d none',
        gpTxt: ds.silent ? 'ออฟไลน์ ' + ds.seenMin + ' นาที' : ds.gap ? 'ข้อมูลขาดช่วง ' + ds.gap + ' ช่วง' : ds.late ? 'ข้อมูลมาช้า ' + ds.late + ' นาที' : '',
        val: ds.silent ? 'ออฟไลน์' : met.dir && val(r) != null ? val(r) + '°' : fmt(val(r)), plStyle: 'background: ' + COL[k] + '; color: ' + ink(k) + ';', cls: s.sel === r[0] ? 'ex-tr on' : 'ex-tr', pick: pick(r[0]),
        gAria: 'ดูกราฟข้อมูลย้อนหลัง ' + r[1], openHist: (e) => { if (e && e.stopPropagation) e.stopPropagation(); this.setState({ sel: r[0], hist: { id: r[0], sensor: met.hist, gran: s.period === 'm' ? 'month' : s.period === 'y' ? 'year' : 'day', range: null, pg: 1, full: false } }); } };
    });
    let nums = pages <= 5 ? Array.from({ length: pages }, (_, i) => i + 1) : (page <= 3 ? [1, 2, 3, 'gap'] : [1, 'gap', page, 'gap']);
    const pageBtns = nums.map((n) => (n === 'gap' ? { n: '...', cls: 'ex-pb', gap: true, cur: undefined, pick: null } : { n, cls: n === page ? 'ex-pb on' : 'ex-pb', gap: false, cur: n === page ? 'page' : undefined, pick: () => this.setState({ page: n }) }));

    const LG = CATS;
    const step = Math.min(28, 202 / (LG.length - 1));
    const legend = LG.map((c, i) => {
      const on = !s.hidden[c[0]];
      return { label: c[2], count: counts[c[0]] || 0, on, cls: on ? 'ex-lr' : 'ex-lr off', top: 'top: ' + Math.round(62 + i * step) + 'px;',
        sw: on ? 'background: ' + c[4] + ';' : 'box-shadow: inset 0 0 0 2px ' + c[4] + ';',
        cls2: on ? 'mlg-r' : 'mlg-r off', sw2: on ? 'background: ' + c[4] + '; box-shadow: inset 0 0 0 1px rgba(120,120,120,.45);' : 'background: transparent; box-shadow: inset 0 0 0 3px ' + c[4] + ';',
        toggle: () => this.setState({ hidden: Object.assign({}, s.hidden, { [c[0]]: on }), page: 1 }) };
    });

    const PERS = this.periods(), per = PERS.map((q) => q[0]), pi = Math.max(0, per.indexOf(s.period));
    const tabs = PERS.map(([k, l], i) => ({ label: l, on: s.period === k, cls: s.period === k ? 'ex-tab on' : 'ex-tab', pick: () => this.setState({ period: k, page: 1 }, () => this.scrollTab()) }));

    // pins: each map marker is tied to one station (sample mapping by rain level); colour = level of the selected metric
    // our stations always use the same station glyph (the metric only changes the colour)
    // wave strength per level: top 'bad' = 4, other 'bad' = 3, 'warn' right after a 'bad' = 2, other 'warn' = 1
    const WV = {}; CATS.forEach((c, i) => { if (c[5] === 'bad') WV[c[0]] = i === 0 ? 4 : 3; else if (c[5] === 'warn') WV[c[0]] = i > 0 && CATS[i - 1][5] === 'bad' ? 2 : 1; });
    const STATION_ICON = 'M6.5 3a3.5 3.5 0 0 1 3.5 3.5v11a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 3 17.5v-11A3.5 3.5 0 0 1 6.5 3z M11.4 12a1.4 1.4 0 1 0 2.8 0 1.4 1.4 0 1 0-2.8 0 M16.2 8.2a5.4 5.4 0 0 1 0 7.6 M19.2 5.2a9.6 9.6 0 0 1 0 13.6';
    const light = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.66; };
    const PK = { c90: '#e11d48', c70: '#c2611f', c50: '#ea7a12', c35: '#ca9a04', c20: '#5a9e26', c10: '#3fae5a', c0: '#4b8fe0', none: '#71717a' };
    const byRain = {}; R.forEach((r) => { const k = rainCat(r[7]); (byRain[k] = byRain[k] || []).push(r); });
    const used = {};
    const pinSt = P.map((p) => { const g = byRain[p[0]] && byRain[p[0]].length ? byRain[p[0]] : R; const k = (used[p[0]] = (used[p[0]] || 0) + 1) - 1; return g[k % g.length]; });
    const pinName = (k) => (k === 'none' ? 'ออฟไลน์ · ไม่ส่งข้อมูล' : (CATS.find((c) => c[0] === k) || [0, 0, ''])[2]);
    const pins = P.map((p, i) => {
      const r = pinSt[i], v = val(r), k = catOf(v,r);
      return { k, p, r, v };
    }).filter((o) => ownOn && !s.hidden[o.k] && (!s.dsf || this.dataStat(o.r).kind === s.dsf) && this.inArea(s, o.r)).map(({ k, p, r, v }) => {
      const bad = LVL[k] === 'bad', off = k === 'none';
      const ds = this.dataStat(r), ev = ds.events.length && !ds.silent ? ds.events[0] : null;
      const bds = ds.silent || zi < 1 ? [] : [ds.late ? { cls: 'pm-bd late', d: 'M12 7v5l3 2' } : null, ev ? { cls: 'pm-bd ev-' + ev.sev, d: 'M12 6v8 M12 18h.01' } : null, ds.gap ? { cls: 'pm-bd gap', d: 'M4 12h5 M15 12h5' } : null].filter(Boolean);
      const sTxt = ds.silent ? 'ออฟไลน์ · ไม่ส่งข้อมูลมา ' + ds.seenMin + ' นาที (ล่าสุด ' + ds.seenAt + ')' : [ds.late ? 'ข้อมูลมาช้า ' + ds.late + ' นาที · สถานียังส่งอยู่ · ค่าเป็นของ ' + ds.valAt : '', ev ? 'event: ' + ev.type : '', ds.gap ? 'ข้อมูลขาดช่วง ' + ds.gap + ' ช่วง' : ''].filter(Boolean).join(' · ');
      return {
        cls: (off ? 'ex-pin off' : 'ex-pin' + (bad && !ds.silent ? ' red' : '') + (WV[k] && !ds.silent && (zi > 0 || bad) ? ' wave w' + WV[k] : '')) + (s.sel === r[0] ? ' sel' : ''), bds,
        style: 'left: ' + T(p[1], p[2])[0] + 'px; top: ' + T(p[1], p[2])[1] + 'px; --pc: ' + COL[k] + '; --pi: #ffffff;',
        icD: STATION_ICON, icT: '', sx: T(p[1], p[2])[0], sy: T(p[1], p[2])[1], k, rk: ds.silent || v == null ? 99 : rank(k), src: 'own', id: r[0], nm: r[1], vt: v == null ? 'ออฟไลน์' : fmt(v),
        label: r[1] + (sTxt ? ' · ' + sTxt : '') + ' · ' + met.name + ' ' + (v == null ? 'ออฟไลน์' : fmt(v) + (met.dir ? '' : ' ' + met.unitTh)) + ' · กดเพื่อดูข้อมูล',
        open: () => this.setState({ sel: r[0], st: r[0], stPh: 0, qr: false, tip: null, stAll: false }),
        enter: () => this.setState({ tip: { x: T(p[1], p[2])[0], y: T(p[1], p[2])[1] - (bad ? 18 : 15), t: (v == null ? r[1] + ' · ออฟไลน์ · ไม่ส่งข้อมูลมา ' + ds.seenMin + ' นาที' : r[1] + ' · ' + fmt(v) + (met.dir ? '' : ' ' + met.unitTh)) + (sTxt && !ds.silent ? ' · ' + sTxt : '') } }), leave: () => this.setState({ tip: null })
      };
    });

    // ThaiWater layer (rain gauges only → shown when the metric is rainfall)
    const toMap = (x, y) => (wide ? [Math.round(x * m) + dx, Math.round(y * m)] : [x - 419, y]);
    // ThaiWater layer: same round pin as ours, droplet glyph = rain gauge from ThaiWater · colour/waves follow the active criteria + period
    const twVal = (r) => this.twRainOf(r, s.period);
    const twAll = TW.map((r) => { const xy = toMap(r[10], r[11]); const v = twVal(r); return { r, x: xy[0], y: xy[1], v, k: catOf(v,r) }; }).filter((o) => o.x > 4 && o.x < mapW - 4 && o.y > 4 && o.y < 863);
    const TW_ENABLED = true;
    // ---- sample CCTV / dam / runoff layers (styling to follow) ----
    // sample dams / reservoirs (wide map coords) — size: L/M/S
    const DAMS = [
      ['เขื่อนภูมิพล', 'L', 637, 240, 64], ['เขื่อนสิริกิติ์', 'L', 790, 120, 88],
      ['เขื่อนแควน้อยบำรุงแดน', 'M', 850, 290, 42], ['เขื่อนแม่งัดสมบูรณ์ชล', 'M', 600, 60, 103],
      ['เขื่อนกิ่วลม', 'M', 700, 120, 71], ];
    // sample CCTV cameras — kind: run (water-level station) / dam
    const CAMS = [
      ['CCTV ระดับน้ำ · ท่าน้ำนนทบุรี', 'run', 853, 655, 1], ['CCTV ระดับน้ำ · บางไทร', 'run', 814, 310, 0],
      ['CCTV ระดับน้ำ · แม่น้ำยม ร้องกวาง', 'run', 824, 62, 3], ['CCTV ระดับน้ำ · แม่น้ำวัง', 'run', 703, 166, 2],
      ['CCTV ระดับน้ำ · สมุทรปราการ', 'run', 853, 640, 4]
    ];
    const damCol = (p) => p > 100 ? '#9333ea' : p >= 81 ? '#2563eb' : p >= 51 ? '#22c55e' : p >= 31 ? '#f59e0b' : '#ef4444';
    const damBand = (p) => p > 100 ? 'เกินความจุ' : p >= 81 ? 'น้ำมาก' : p >= 51 ? 'ปกติ' : p >= 31 ? 'น้ำน้อย' : 'น้ำน้อยวิกฤต';
    // runoff / river-flow gauges (น้ำท่า) — ThaiWater river-level criteria (own colours, not the top-right rainfall criteria)
    const RUNOFF = [
      ['สถานีน้ำท่า · แม่น้ำน่าน เมืองน่าน', 905, -40, 58], ['สถานีน้ำท่า · แม่น้ำยม แพร่', 824, 70, 82],
      ['สถานีน้ำท่า · แม่น้ำวัง ลำปาง', 703, 150, 24], ['สถานีน้ำท่า · แม่น้ำปิง ตาก', 640, 300, 105],
      ['สถานีน้ำท่า · แม่น้ำเจ้าพระยา นครสวรรค์', 807, 370, 46], ['สถานีน้ำท่า · แม่น้ำป่าสัก เพชรบูรณ์', 921, 294, 7],
      ['สถานีน้ำท่า · แม่น้ำเจ้าพระยา อยุธยา', 850, 500, 71]
    ];
    const runCol = (p) => p > 100 ? '#9333ea' : p >= 71 ? '#f97316' : p >= 31 ? '#22c55e' : p >= 11 ? '#38bdf8' : '#94a3b8';
    const runBand = (p) => p > 100 ? 'ล้นตลิ่ง' : p >= 71 ? 'น้ำมาก' : p >= 31 ? 'ปกติ' : p >= 11 ? 'น้ำน้อย' : 'น้ำน้อยวิกฤต';
    const camRunN = CAMS.filter((c) => c[1] === 'run').length;
    const damN = { L: 0, M: 0, S: 0 }; DAMS.forEach((d) => { damN[d[1]]++; });
    const onScreen = (sx, sy) => sx > 8 && sx < mapW - 8 && sy > 8 && sy < 855;
    const mkMark = (wx, wy) => { const xy = toMap(wx, wy); return T(xy[0], xy[1]); };
    const tipAt = (sx, sy, txt) => ({ enter: () => this.setState({ tip: { x: sx, y: sy - 16, t: txt } }), leave: () => this.setState({ tip: null }) });
    const damPins = (s.dd || s.st || hid.dam ? [] : DAMS).filter((d) => !hid['dam:' + d[1]]).map((d) => {
      const p = mkMark(d[2], d[3]); if (!onScreen(p[0], p[1])) return null;
      const DL = { L: 'ขนาดใหญ่', M: 'ขนาดกลาง', S: 'ขนาดเล็ก' }[d[1]];
      return Object.assign({ cls: 'ex-mk mk-dam d-' + d[1], style: 'left: ' + p[0] + 'px; top: ' + p[1] + 'px; --mc: ' + damCol(d[4]) + ';', label: 'เขื่อน/อ่างเก็บน้ำ (' + DL + ') · ' + d[0] + ' · น้ำ ' + d[4] + '% (' + damBand(d[4]) + ')' }, tipAt(p[0], p[1], d[0] + ' · น้ำ ' + d[4] + '% · ' + damBand(d[4])));
    }).filter(Boolean);
    const runPins = (!hid.runoff && !(s.dd || s.st)) ? RUNOFF.map((o) => {
      const p = mkMark(o[1], o[2]); if (!onScreen(p[0], p[1])) return null;
      return Object.assign({ cls: 'ex-mk mk-run', style: 'left: ' + p[0] + 'px; top: ' + p[1] + 'px; --mc: ' + runCol(o[3]) + ';', label: o[0] + ' · ระดับ ' + o[3] + '% ของตลิ่ง (' + runBand(o[3]) + ')' }, tipAt(p[0], p[1], o[0] + ' · ' + o[3] + '% · ' + runBand(o[3])));
    }).filter(Boolean) : [];
    const camPins = (s.dd || s.st || s.cctvOff ? [] : CAMS).filter((c) => !hid['cam:' + c[1]]).map((c) => {
      const p = mkMark(c[2], c[3]); if (!onScreen(p[0], p[1])) return null;
      const CL = this.cctvLv()[c[4] || 0];
      return Object.assign({ cls: 'ex-mk mk-cam c-' + c[1], style: 'left: ' + p[0] + 'px; top: ' + p[1] + 'px; --mc: ' + CL[1] + ';', label: c[0] + ' · ' + CL[0] }, tipAt(p[0], p[1], c[0] + ' · ' + CL[0]));
    }).filter(Boolean);
    const PERL = 'ฝน ' + (this.periods().find((q) => q[0] === s.period) || [0, '24 ชม.'])[1];
    const twShow = TW_ENABLED && isRain && rainOn && !s.dsf;
    const twPins = !twShow ? [] : twAll.filter((o) => !s.hidden[o.k] && agOn(o.r[10] || DDPM) && this.inArea(s, o.r)).map(({ r, x, y, v, k }) => {
      const bad = LVL[k] === 'bad', c = COL[k] || '#71717a';
      const txt = 'สถาบันสารสนเทศทรัพยากรน้ำ · ' + r[1] + ' · ' + PERL + ' ' + fmt(v) + ' มม.';
      return {
        cls: 'ex-pin twd' + (bad ? ' red' : '') + (WV[k] && (zi > 0 || bad) ? ' wave w' + WV[k] : '') + (s.sel === 'tw-' + r[0] ? ' sel' : ''),
        style: 'left: ' + T(x, y)[0] + 'px; top: ' + T(x, y)[1] + 'px; --pc: ' + c + '; --pi: #ffffff;',
        sx: T(x, y)[0], sy: T(x, y)[1], k, rk: v == null ? 99 : rank(k), src: 'tw', id: 'tw' + r[0], nm: r[1], vt: fmt(v),
        label: txt + ' · กดเพื่อดูข้อมูล',
        open: () => this.setState({ sel: 'tw-' + r[0], st: 'tw-' + r[0], stPh: 0, qr: false, tip: null, stAll: false, tw: null }),
        enter: () => this.setState({ tip: { x: T(x, y)[0], y: T(x, y)[1] - (bad ? 18 : 15), t: txt } }), leave: () => this.setState({ tip: null })
      };
    });
    const twSel = twShow && s.tw ? twAll.find((o) => o.r[0] === s.tw) : null;
    // ---- clusters: pins closer than CL_R px on screen merge into one numbered marker until the most zoomed-in level ----
    // one map-wide switch: below PIN_FROM every station is in a cluster (a lone one shows “1”); from PIN_FROM up every station is a pin
    const PIN_FROM = 1, CL_R = 96;
    const allPins = pins.concat(twPins).filter((o) => onMap(o.sx, o.sy));
    const keep = new Set(), clusters = [];
    if (zi < PIN_FROM && !s.nocl) {
      const free = allPins.slice().sort((a, b) => a.rk - b.rk), used = new Set();
      free.forEach((a) => {
        if (used.has(a.id)) return;
        const g = free.filter((b) => !used.has(b.id) && b.id !== s.sel && a.id !== s.sel && Math.hypot(a.sx - b.sx, a.sy - b.sy) < CL_R);
        if (g.length < (a.id !== s.sel ? 1 : 2)) { keep.add(a.id); used.add(a.id); return; }
        g.forEach((b) => used.add(b.id));
        const cx = Math.round(g.reduce((t, o) => t + o.sx, 0) / g.length), cy = Math.round(g.reduce((t, o) => t + o.sy, 0) / g.length);
        const top = g[0], n = g.length, kc = {}; g.forEach((o) => { const kk = o.rk === 99 ? 'none' : o.k; kc[kk] = (kc[kk] || 0) + 1; });
        const order = Object.keys(kc).sort((x, y) => (x === 'none' ? 99 : rank(x)) - (y === 'none' ? 99 : rank(y)));
        let acc = 0; const ring = 'conic-gradient(' + order.map((kk) => { const a0 = acc; acc += kc[kk] / n * 360; return (COL[kk] || '#71717a') + ' ' + a0.toFixed(1) + 'deg ' + acc.toFixed(1) + 'deg'; }).join(', ') + ')';
        const pc = top.rk === 99 ? '#71717a' : COL[top.k], d = n >= 25 ? 48 : n >= 10 ? 42 : 36, nTw = g.filter((o) => o.src === 'tw').length;
        const lab = (kk) => (kk === 'none' ? 'ออฟไลน์' : (CATS.find((c) => c[0] === kk) || [0, 0, 0, kk])[3]);
        const lc = {}; order.forEach((kk) => { lc[lab(kk)] = (lc[lab(kk)] || 0) + kc[kk]; }); const brk = Object.keys(lc).map((l) => l + ' ' + lc[l]).join(' · ');
        const txt = n + ' สถานี' + (nTw ? ' (ปภ. ' + (n - nTw) + ' · สถาบันสารสนเทศทรัพยากรน้ำ ' + nTw + ')' : '') + ' · ' + brk + ' · สูงสุด ' + top.nm + ' ' + top.vt;
        const b = Tinv(cx, cy);
        clusters.push({
          cls: 'ex-pin ex-cl' + (top.rk !== 99 && LVL[top.k] === 'bad' ? ' wave w' + (WV[top.k] || 3) : ''),
          style: 'left: ' + cx + 'px; top: ' + cy + 'px; --pc: ' + pc + '; --ring: ' + ring + '; --d: ' + d + 'px;', n: String(n), hasTw: false,
          label: txt + ' · กดเพื่อซูมเข้า',
          open: () => zoomAt(PIN_FROM, b[0], b[1]),
          enter: () => this.setState({ tip: { x: cx, y: cy - d / 2 - 6, t: txt } }), leave: () => this.setState({ tip: null })
        });
      });
    } else {
      // pin levels: no clusters anywhere; stations still on the same spot fan out in a small circle
      allPins.forEach((o) => keep.add(o.id));
      const done = new Set();
      allPins.forEach((a) => {
        if (done.has(a.id)) return;
        const g = allPins.filter((b) => !done.has(b.id) && Math.hypot(a.sx - b.sx, a.sy - b.sy) < 22);
        g.forEach((b) => done.add(b.id));
        if (g.length < 2) return;
        const rad = 18 + g.length * 4;
        g.forEach((b, i) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / g.length; b.sx = Math.round(a.sx + rad * Math.cos(ang)); b.sy = Math.round(a.sy + rad * Math.sin(ang)); b.style = b.style.replace(/left: -?\d+px; top: -?\d+px;/, 'left: ' + b.sx + 'px; top: ' + b.sy + 'px;'); b.spread = true; });
      });
    }
    const pinsV = pins.filter((o) => keep.has(o.id)), twPinsV = twPins.filter((o) => keep.has(o.id));
    // zoom controls + pan
    this._wheelFn = (e) => { const r = this._wEl.getBoundingClientRect(), k = r.width / mapW; const sx = (e.clientX - r.left) / k, sy = (e.clientY - r.top) / k; const nz = zi + (e.deltaY < 0 ? 1 : -1); if (nz < 0 || nz > ZMAX) return; const b = Tinv(sx, sy); zoomAt(nz, b[0], b[1], sx, sy); };
    const zoomUI = {
      clusters, zLevel: (zi + 1) + '/' + ZL.length, zInDis: zi >= ZMAX, zOutDis: zi <= 0, zHome: zi > 0,
      zoomIn: () => zoomAt(zi + 1, cxb, cyb), zoomOut: () => zoomAt(zi - 1, cxb, cyb), zoomHome: () => this.setState({ zi: 0, zc: null, tip: null }),
      zHint: zi < PIN_FROM ? 'กดกลุ่ม / หมุนล้อเมาส์ เพื่อแสดงหมุดทุกสถานี' : zi < ZMAX ? 'แสดงทุกสถานีแยกกัน · หมุนล้อเมาส์เพื่อซูมต่อ' : 'ซูมสุด · แสดงทุกสถานีแยกกัน',
      mapDbl: (e) => { if (e.target !== e.currentTarget || zi >= ZMAX) return; const r = e.currentTarget.getBoundingClientRect(), k = r.width / mapW; const sx = (e.clientX - r.left) / k, sy = (e.clientY - r.top) / k; const b = Tinv(sx, sy); zoomAt(zi + 1, b[0], b[1], sx, sy); },
      mapDown: (e) => { if (e.target !== e.currentTarget || !zi) return; const r = e.currentTarget.getBoundingClientRect(); this._drag = { x: e.clientX, y: e.clientY, c: [cxb, cyb], k: r.width / mapW }; },
      mapMove: (e) => { const d = this._drag; if (!d) return; const nx = d.c[0] - (e.clientX - d.x) / d.k / z, ny = d.c[1] - (e.clientY - d.y) / d.k / z; if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = null; this.setState({ zc: [nx / mapW, ny / MH], tip: null }); }); },
      mapUp: () => { this._drag = null; }
    };
    // ---- alerts ----
    const CRIT = s.crit || 'tw';
    this._alerts = this._alerts || {};
    if (!this._alerts[CRIT]) this._alerts[CRIT] = this.buildAlerts(CRIT);
    const RD24 = this.metricDefs('d1', CRIT)[0];
    const byId0 = {}; LIST.forEach((r) => { byId0[r[0]] = r; });
    const EXTRA = (s.extra || []).map((x) => { const c = RD24.cats.find((q) => q[1](x.v)) || RD24.cats[RD24.cats.length - 1]; return this.alertRec(byId0[x.st], RD24, x.v, c, 0, { id: x.id, fresh: true }); });
    // alerts follow the filters in use: metric (ประเภทข้อมูล) + ลุ่มน้ำ + จังหวัด
    const ALL = EXTRA.concat(this._alerts[CRIT]).filter((a) => { const r = byId0[a.st]; return r && a.metric === met.key && this.inArea(s, r); });
    const fScope = met.name + (s.basin ? ' · ลุ่มน้ำ' + s.basin : '') + (s.prov ? ' · จ.' + s.prov : '') + (s.amp ? ' · อ.' + s.amp : '') + (s.tam ? ' · ต.' + s.tam : '');
    const RD = s.readIds || {};
    const isUnread = (a) => !RD[a.id] && (a.fresh || a.ago < 90);
    const byId = {}; LIST.forEach((r) => { byId[r[0]] = r; });
    const agoTxt = (m) => (m < 1 ? 'เมื่อสักครู่' : m < 60 ? m + ' นาทีที่แล้ว' : Math.floor(m / 60) + ' ชม. ' + (m % 60) + ' นาทีที่แล้ว');
    const lvTxt = (a) => a.label;
    const lvCol = (a) => (a.color === '#f0d447' && lt ? '#a16207' : a.color);
    const openAlert = (a) => () => this.setState({ readIds: Object.assign({}, RD, { [a.id]: true }), gone: Object.assign({}, s.gone, { [a.id]: true }), inbox: false, metric: a.metric, period: a.metric === 'rain' ? 'd1' : s.period, sel: a.st, st: a.st, stPh: 0, qr: false, stAll: false, tip: null });
    const unreadN = ALL.filter(isUnread).length;
    const ibF = ALL.filter((a) => (s.ibTab !== 'unread' || isUnread(a)) && (!s.ibLv || s.ibLv === 'all' || !ALL.some((x) => x.cat === s.ibLv) || a.cat === s.ibLv));
    const ibItems = ibF.slice(0, 80).map((a) => { const r = byId[a.st]; return {
      criteria: this.criteriaContext(r, a.metric, 'd1', a.v, a.unit, a.mName), cls: isUnread(a) ? 'ib-it unread' : 'ib-it', unread: isUnread(a), sw: 'background: ' + a.color + ';', lvl: lvTxt(a), lvStyle: 'color: ' + lvCol(a) + ';', metric: a.mName + ' ' + a.band.replace(' ' + a.label, ''),
      name: r[1], loc: 'จ.' + r[4] + ' · ลุ่มน้ำ' + this.basinOf(r), val: a.v + (a.unit ? ' ' + a.unit : ''), vStyle: 'color: ' + lvCol(a) + ';', ago: agoTxt(a.ago), open: openAlert(a) }; });
    const tq = ALL.filter((a) => isUnread(a) && !(s.gone || {})[a.id]);
    const tqShow = s.tstCut ? tq.filter((a) => a.fresh) : tq;
    this._tq = tqShow.slice(0, 2).map((a) => a.id);
    const toasts = tqShow.slice(0, 2).map((a) => { const r = byId[a.st]; return {
      bar: '--tc: ' + a.color + ';', chip: a.label, chipStyle: 'background: ' + a.color + '; color: ' + this.inkOn(a.color) + ';', ago: agoTxt(a.ago),
      val: String(a.v), unit: a.unit || '', vStyle: 'color: ' + lvCol(a) + ';', metric: a.metric === 'rain' ? 'ฝน 24 ชม.' : a.mName,
      name: r[1], loc: 'จ.' + r[4], code: 'G15006-' + (5501 + R.indexOf(r) * 13), addr: 'ต.' + r[2] + ' อ.' + r[3] + ' จ.' + r[4], aria: a.label + ' · ' + r[1] + ' G15006-' + (5501 + R.indexOf(r) * 13) + ' ต.' + r[2] + ' อ.' + r[3] + ' จ.' + r[4] + ' · ' + a.mName + ' ' + a.v + ' ' + (a.unit || '') + ' · กดเพื่อดูสถานี',
      open: openAlert(a), dismiss: () => this.setState({ gone: Object.assign({}, s.gone, { [a.id]: true }) }), hold: () => { this._tHold = a.id; }, release: () => { this._tHold = null; } }; });
    // map position of every station that has a pin (own: P slots, other agencies: ThaiWater frame)
    const POS = {}; P.forEach((p, i) => { const r = pinSt[i]; if (r && !POS[r[0]]) POS[r[0]] = [p[1], p[2]]; });
    twAll.forEach((o) => { POS['tw-' + o.r[0]] = [o.x, o.y]; });
    const locId = s.st, locP = locId ? POS[locId] : null;
    const HX = Object.assign(this.histVals(s, LIST, lt), this.stVals(s, LIST, lt, MD, met, MS), {
      spLocOn: !!locP,
      spLocate: () => { if (!locP) return; const tw = locId.indexOf('tw-') === 0; this.setState(Object.assign({ st: null, qr: false, sel: locId, zi: 2, zc: [locP[0] / mapW, locP[1] / MH], tip: null, hidden: {}, dsf: null }, tw ? { metric: 'rain', lyTw: true } : { lyOwn: true })); },
      bellCls: s.inbox ? 'abs ex-bell on' : 'abs ex-bell', bellAria: 'การแจ้งเตือน · ยังไม่อ่าน ' + unreadN + ' รายการ', hasUnread: unreadN > 0, unreadN: unreadN > 99 ? '99+' : unreadN,
      inboxOpen: !!s.inbox, toggleInbox: () => this.setState({ inbox: !s.inbox, mOpen: false, lyOpen: false, bmOpen: false }), closeInbox: () => this.setState({ inbox: false }),
      readAll: () => { const o = Object.assign({}, RD); ALL.forEach((a) => { o[a.id] = true; }); this.setState({ readIds: o }); },
      ibTabs: [['all', 'ทั้งหมด'], ['unread', 'ยังไม่อ่าน']].map(([k, l]) => ({ label: l, on: (s.ibTab || 'all') === k, cls: (s.ibTab || 'all') === k ? 'on' : '', pick: () => this.setState({ ibTab: k }) })),
      ibLv: [['all', 'ทุกเกณฑ์', '#a1a1aa']].concat(ALL.reduce((o, a) => { if (!o.find((q) => q[0] === a.cat)) o.push([a.cat, a.band.replace(' มม.', ''), a.color, a.lo]); return o; }, []).sort((x, y) => (y[3] || 0) - (x[3] || 0)).map((q) => [q[0], q[1], q[2]])).map(([k, l, c]) => ({ label: l, n: k === 'all' ? ALL.length : k === 'other' ? ALL.filter((a) => a.metric !== 'rain').length : ALL.filter((a) => a.cat === k).length, on: (s.ibLv || 'all') === k, cls: (s.ibLv || 'all') === k ? 'on' : '', sw: 'background: ' + c + ';', pick: () => this.setState({ ibLv: k }) })),
      ibScope: 'ตามตัวกรอง: ' + fScope + (met.key === 'rain' ? ' · ' + ((s.crit || 'tw') === 'own' ? 'ฝนหนักขึ้นไป (เกณฑ์ ปภ.)' : 'สีเหลืองขึ้นไป (สถาบันสารสนเทศทรัพยากรน้ำ)') : ''), ibItems, ibEmpty: ibItems.length === 0, ibEmptyScope: fScope, ibTotal: ALL.length,
      toasts, moreToasts: tq.length - toasts.length > 0, moreN: tq.length - toasts.length,
      ...zoomUI, twPins: twPinsV, twOn: twPins.length > 0, twOpen: false, twClose: () => this.setState({ tw: null }),
      twCardStyle: twSel ? 'left: ' + Math.min(mapW - 280, T(twSel.x, twSel.y)[0] + 16) + 'px; top: ' + Math.max(8, Math.min(867 - 170, T(twSel.x, twSel.y)[1] - 30)) + 'px;' : '',
      twName: twSel ? twSel.r[1] : '', twLoc: twSel ? 'ต.' + twSel.r[2] + ' อ.' + twSel.r[3] + ' จ.' + twSel.r[4] : '', twAgency: twSel ? twSel.r[8] : '',
      twVal: twSel ? fmt(twSel.v) : '', twVStyle: twSel ? 'color: ' + (LVL[twSel.k] === 'bad' ? '#ef4444' : LVL[twSel.k] === 'warn' ? (lt ? '#b45309' : '#f59e0b') : 'inherit') + ';' : '', twPer: PERL, twBand: twSel ? ((CATS.find((c) => c[0] === twSel.k) || [0, 0, ''])[2]) : '', twBandStyle: twSel ? 'background: ' + COL[twSel.k] + '; color: ' + this.inkOn(COL[twSel.k]) + ';' : '',
      twCode: twSel ? twSel.r[0] : '', twTime: twSel ? twSel.r[9] : '',
      lyBtnCls: s.lyOpen ? 'abs ex-mbtn mb1 on' : 'abs ex-mbtn mb1', lyOpen: !!s.lyOpen, toggleLy: () => this.setState({ lyOpen: !s.lyOpen, bmOpen: false, pnl: null }), closeLy: (e) => { this.setState({ lyOpen: false }); this.passMbtn(e); },
      ssOpen: s.pnl === 'ss', ssBtnCls: 'abs ex-mbtn mb3' + (s.pnl === 'ss' ? ' on' : ''),
      toggleSs: () => this.setState({ pnl: s.pnl === 'ss' ? null : 'ss', lyOpen: false, bmOpen: false, dd: null, mOpen: false }), closeSs: (e) => { this.setState({ pnl: null, agDd: false }); this.passMbtn(e); },
      damMOn: !hid['dam:M'], damLOn: !hid['dam:L'], vilOn: !hid.vil,
      damOn: !hid.dam, damToggle: () => this.setState({ layHid: Object.assign({}, hid, { dam: !hid.dam }), damDd: !!hid.dam, agDd: false }),
      damDdOpen: !!s.damDd, damDdToggle: () => this.setState({ damDd: !s.damDd }),
      damDdLabel: (() => { const on = [['L', 'อ่างขนาดใหญ่'], ['M', 'อ่างขนาดกลาง']].filter((z) => !hid['dam:' + z[0]]); return on.length === 2 ? 'ทุกขนาด (2)' : on.length ? on[0][1] : 'ยังไม่ได้เลือกขนาด'; })(),
      damDdAll: () => this.setState({ layHid: Object.assign({}, hid, { 'dam:M': false, 'dam:L': false }) }),
      damSizeRows: [['L', 'อ่างขนาดใหญ่', 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'], ['M', 'อ่างขนาดกลาง', 'M3 7h14v10H3z M7 10v4 M11 10v4 M17 10h3v4h-3']].map(([sz, lb, d]) => ({ aria: lb, label: lb, sub: '', d, n: damN[sz], on: !hid['dam:' + sz], dis: !!hid.dam,
        toggle: () => this.setState({ layHid: Object.assign({}, hid, { ['dam:' + sz]: !hid['dam:' + sz] }) }) })),
      damMToggle: () => this.setState({ layHid: Object.assign({}, hid, { 'dam:M': !hid['dam:M'] }) }),
      damLToggle: () => this.setState({ layHid: Object.assign({}, hid, { 'dam:L': !hid['dam:L'] }) }),
      vilToggle: () => this.setState({ layHid: Object.assign({}, hid, { vil: !hid.vil }) }),
      agDdOpen: !!s.agDd, agDdToggle: () => this.setState({ agDd: !s.agDd }),
      agDdLabel: (() => { const L = AGENCIES.filter((a) => a.name !== DDPM && agCount[a.name] > 0), on = L.filter((a) => !hid['ag:' + a.name]); return on.length === L.length ? 'ทุกหน่วยงาน (' + L.length + ')' : on.length === 0 ? 'ยังไม่ได้เลือกหน่วยงาน' : on.length === 1 ? on[0].abbr + ' ' + on[0].name : 'เลือก ' + on.length + ' จาก ' + L.length + ' หน่วยงาน'; })(),
      ...(() => { const L = AGENCIES.filter((a) => a.name !== DDPM && agCount[a.name] > 0), n = L.filter((a) => !hid['ag:' + a.name]).length, all = n === L.length;
        return { agDdCount: 'เลือก ' + n + ' จาก ' + L.length, agDdBulkLbl: all ? 'ล้าง' : 'เลือกทั้งหมด',
          agDdBulk: () => { const o = Object.assign({}, hid); L.forEach((a) => { if (all) o['ag:' + a.name] = true; else delete o['ag:' + a.name]; }); this.setState({ layHid: o }); } }; })(),
      ...(() => { const n = ['L', 'M'].filter((z) => !hid['dam:' + z]).length, all = n === 2;
        return { damDdCount: 'เลือก ' + n + ' จาก 2', damDdBulkLbl: all ? 'ล้าง' : 'เลือกทั้งหมด',
          damDdBulk: () => this.setState({ layHid: Object.assign({}, hid, { 'dam:M': all, 'dam:L': all }) }) }; })(),
      ...(() => { const L = AGENCIES.filter((a) => a.name !== DDPM && agCount[a.name] > 0), n = L.filter((a) => !hid['ag:' + a.name]).length;
        return { rainSub2: PERL.replace('ฝน ', 'ปริมาณฝน ') + ' · ' + (n === L.length ? 'ทุกหน่วยงาน' : n === 0 ? 'ไม่ได้เลือกหน่วยงาน' : n + ' จาก ' + L.length + ' หน่วยงาน'),
          rainCbCls: 'tr-cb' + (rainOn && n > 0 && n < L.length ? ' part' : '') }; })(),
      ...(() => { const n = ['L', 'M'].filter((z) => !hid['dam:' + z]).length;
        return { damSub2: 'เขื่อนและอ่างเก็บน้ำ · ' + (n === 2 ? 'ทุกขนาด' : n === 0 ? 'ไม่ได้เลือกขนาด' : n + ' จาก 2 ขนาด'), damCbCls: 'tr-cb' + (!hid.dam && n === 1 ? ' part' : '') }; })(),
      agDdAll: () => { const o = Object.assign({}, hid); AGENCIES.forEach((a) => { delete o['ag:' + a.name]; }); this.setState({ layHid: o }); },
      ownOn, ownN: R.length, ownToggle: () => this.setState({ layHid: Object.assign({}, hid, { own: !hid.own }) }),
      rainOn, rainExp: s.rainExp !== false, rainSub: twAll.length + ' สถานี · ' + (isRain ? PERL : 'วัดปริมาณฝน'),
      rainToggle: () => this.setState({ layHid: Object.assign({}, hid, { rain: rainOn }), tw: null, agDd: !rainOn, damDd: false }),
      rainToggleExp: () => this.setState({ rainExp: s.rainExp === false }),
      agRows: AGENCIES.filter((a) => a.name !== DDPM && agCount[a.name] > 0).map((a) => ({ aria: a.name, code: a.code, abbr: a.abbr, name: a.name, n: agCount[a.name], on: !hid['ag:' + a.name], dis: !rainOn,
        chipStyle: 'background: ' + a.col + ';', dotStyle: 'background: ' + a.col + ';',
        toggle: () => this.setState({ layHid: Object.assign({}, hid, { ['ag:' + a.name]: !hid['ag:' + a.name] }), tw: null }) })),
      camRunOn: !hid['cam:run'], camRunN, cctvOn: !s.cctvOff, cctvToggle: () => this.setState({ cctvOff: !s.cctvOff }),
      damLgOn: !hid.dam && (!hid['dam:L'] || !hid['dam:M']),
      cctvRows: [['run', 'สถานีวัดระดับน้ำท่า', camRunN, 'M2 8c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2 M2 14c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2'], ['damM', 'อ่างขนาดกลาง', 4, 'M3 7h14v10H3z M7 10v4 M11 10v4 M17 10h3v4h-3'], ['damL', 'อ่างขนาดใหญ่', 3, 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'], ['vil', 'หมู่บ้านพื้นที่เสี่ยง', 6, 'M3 11l9-7 9 7v9H3z M9 16a4 4 0 0 1 6 0 M10.8 18.2a1.6 1.6 0 0 1 2.4 0']].map(([k, lb, n, d]) => ({ label: lb, n, d, on: !hid['cam:' + k], dis: !!s.cctvOff,
        toggle: () => this.setState({ layHid: Object.assign({}, hid, { ['cam:' + k]: !hid['cam:' + k] }) }) })),
      camRunToggle: () => this.setState({ layHid: Object.assign({}, hid, { 'cam:run': !hid['cam:run'] }) }),
      damLegend: [['เกินความจุ', '#9333ea'], ['น้ำมาก', '#2563eb'], ['ปกติ', '#22c55e'], ['น้ำน้อย', '#f59e0b'], ['วิกฤต', '#ef4444']].map(([t2, c]) => ({ t: t2, style: 'background: ' + c + ';' })),
      damRows: [['L', 'ขนาดใหญ่'], ['M', 'ขนาดกลาง'], ['S', 'ขนาดเล็ก']].map(([sz, lb]) => ({ sz, label: lb, n: damN[sz], on: !hid['dam:' + sz],
        toggle: () => this.setState({ layHid: Object.assign({}, hid, { ['dam:' + sz]: !hid['dam:' + sz] }) }) })),
      camPins, damPins, runPins,
      runoffOn: !hid.runoff, runoffN: RUNOFF.length,
      runoffToggle: () => this.setState({ layHid: Object.assign({}, hid, { runoff: !hid.runoff }) }),
      runLegend: [['ล้นตลิ่ง', '#9333ea'], ['น้ำมาก', '#f97316'], ['ปกติ', '#22c55e'], ['น้ำน้อย', '#38bdf8'], ['วิกฤต', '#94a3b8']].map(([t2, c]) => ({ t: t2, style: 'background: ' + c + ';' })),
      clOn: s.nocl !== true, clNote: s.nocl ? 'แสดงทุกหมุดแยกกัน แม้ซูมออกสุด' : 'จับหมุดใกล้กันเป็นกลุ่มเมื่อซูมออก', toggleCl: () => this.setState({ nocl: s.nocl !== true, tip: null }),
    });
    const BM = [['ter', 'ภูมิประเทศ', './assets/993d7e7f61a264616455bb486ac9db17.png'], ['sat', 'ดาวเทียม', './assets/221a53d3ec0e9b9c745900aeb692a3b1.png'], ['dark', 'โหมดมืด', './assets/42e671c410768ea24b02fdada4af6fc1.png']];
    const bmCur = BM.find((b) => b[0] === s.basemap) || BM[2];
    Object.assign(HX, {
      bmOpen: !!s.bmOpen, toggleBm: () => this.setState({ bmOpen: !s.bmOpen, tip: null }), closeBm: () => this.setState({ bmOpen: false }),
      miniStyle: '--mthumb: url(' + bmCur[2] + ');', miniAria: 'เปลี่ยนแผนที่ฐาน (ตอนนี้: ' + bmCur[1] + ')',
      bms: BM.map((b) => ({ label: b[1], img: b[2], on: b[0] === s.basemap, cls: b[0] === s.basemap ? 'bm-op on' : 'bm-op', def: b[0] === 'dark', pick: () => this.setState({ basemap: b[0], bmOpen: false }) }))
    });
    return Object.assign(HX, {
      fitCls: lt ? 'ex-fit lt' : 'ex-fit', fitStyle: s.fit ? 'width: ' + (1920 + s.fit.dw) + 'px; --dw: ' + s.fit.dw + 'px; transform: translate(' + s.fit.x + 'px, ' + s.fit.y + 'px) scale(' + s.fit.k + ');' : '', mapStyle,
      rootCls: (lt ? 'ex lt' : 'ex') + (s.hl ? ' hl' : '') + (s.hr ? ' hr' : '') + (wide ? ' wd' : '') + ' bm-' + s.basemap, leftHidden: !!s.hl, rightHidden: !!s.hr,
      hideRight: () => this.setState({ hr: true, tip: null }), showRight: () => this.setState({ hr: false, tip: null }), isLight: lt, isDark: !lt, themeLabel: lt ? 'สลับเป็นโหมดมืด' : 'สลับเป็นโหมดสว่าง',
      toggleTheme: () => this.setState({ theme: lt ? 'dark' : 'light' }), theme: s.theme, setThemeFn: (v) => this.setState({ theme: v }),
      onMap: s.screen !== 'admin', onAdmin: s.screen === 'admin', goAdmin: () => this.setState({ screen: 'admin', menu: false, st: null, hist: null, qr: false }), goMap: () => this.setState({ screen: 'map' }),
      menu: s.menu, toggleMenu: () => this.setState({ menu: !s.menu }), menuChev: s.menu ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6',
      prov: s.prov, setProv: (e) => this.setState({ prov: e.target.value, amp: '', tam: '', page: 1, ibLv: 'all' }),
      ...(() => {   // อำเภอ / ตำบล follow จังหวัด (and ลุ่มน้ำ); disabled until a province is chosen
        const inB = (r) => (!s.basin || this.basinOf(r) === s.basin) && r[4] === s.prov;
        const cnt = (f, key) => { const c = {}; R.forEach((r) => { if (f(r)) c[r[key]] = (c[r[key]] || 0) + 1; }); return Object.keys(c).sort((x, y) => x.localeCompare(y, 'th')).map((v) => ({ v, n: c[v] })); };
        const amps = s.prov ? cnt(inB, 3) : [], tams = s.prov ? cnt((r) => inB(r) && (!s.amp || r[3] === s.amp), 2) : [];
        const area = [s.basin, s.prov, s.amp, s.tam].filter(Boolean).length + (Object.keys(s.hidden || {}).filter((k) => s.hidden[k]).length ? 1 : 0) + (s.dsf ? 1 : 0);
        return {
          ampDis: !s.prov, tamDis: !s.prov, ampCls: 'abs ex-f' + (s.prov ? '' : ' dis'), tamCls: 'abs ex-f' + (s.prov ? '' : ' dis'),
          ampPh: s.prov ? 'อำเภอทั้งหมด' : 'อำเภอ', tamPh: s.prov ? 'ตำบลทั้งหมด' : 'ตำบล',
          ampHint: s.prov ? '' : 'เลือกจังหวัดก่อน', tamHint: s.prov ? '' : 'เลือกจังหวัดก่อน',
          amps: amps.map((o) => ({ v: o.v, label: 'อ.' + o.v + ' (' + o.n + ')', on: s.amp === o.v })), tams: tams.map((o) => ({ v: o.v, label: 'ต.' + o.v + ' (' + o.n + ')', on: s.tam === o.v })),
          setAmp: (e) => this.setState({ amp: e.target.value, tam: '', page: 1 }), setTam: (e) => this.setState({ tam: e.target.value, page: 1 }),
          clrDis: area === 0, clrN: area ? String(area) : '',
          clearFilters: () => this.setState({ basin: '', prov: '', amp: '', tam: '', hidden: {}, dsf: null, lq: '', agf: '', page: 1, ibLv: 'all', tip: null })
        };
      })(),
      provs: (() => { const c = {}; R.forEach((r) => { if (!s.basin || this.basinOf(r) === s.basin) c[r[4]] = (c[r[4]] || 0) + 1; }); if (s.prov && !c[s.prov]) c[s.prov] = 0;
        return Object.keys(c).sort((x, y) => x.localeCompare(y, 'th')).map((v) => ({ v, label: v + ' (' + c[v] + ')', on: s.prov === v })); })(),
      setBasin: (e) => this.setState({ basin: e.target.value, prov: '', amp: '', tam: '', page: 1, ibLv: 'all' }),
      basins: ['สาละวิน', 'โขงเหนือ', 'โขงตะวันออกเฉียงเหนือ', 'ชี', 'มูล', 'ปิง', 'วัง', 'ยม', 'น่าน', 'เจ้าพระยา', 'สะแกกรัง', 'ป่าสัก', 'ท่าจีน', 'แม่กลอง', 'บางปะกง', 'โตนเลสาบ', 'ชายฝั่งทะเลตะวันออก', 'เพชรบุรี-ประจวบคีรีขันธ์', 'ภาคใต้ฝั่งตะวันออกตอนบน', 'ตาปี', 'ทะเลสาบสงขลา', 'ภาคใต้ฝั่งตะวันออกตอนล่าง', 'ภาคใต้ฝั่งตะวันตก']
        .map((b) => { const n = R.filter((r) => this.basinOf(r) === b).length; return { v: b, label: 'ลุ่มน้ำ' + b + ' (' + n + ')', on: s.basin === b, dis: n === 0 }; }),
      alerts, periodNote: isRain ? 'ฝนสะสม ' + (PERS.find((q) => q[0] === s.period) || PERS[0])[1] : 'ค่าล่าสุด 11:00 น.',
      noAlerts: alerts.length === 0, noAlertsMsg: met.dir ? 'ทิศทางลมไม่มีเกณฑ์เฝ้าระวัง · ดูค่าของแต่ละสถานีได้ในตารางด้านขวา' : 'ไม่มีสถานีที่' + met.name + 'ถึงเกณฑ์เฝ้าระวัง',
      dsChips: [['ok', 'ปกติ', 'สถานีส่งข้อมูลครบทุกช่วง'], ['gap', 'ข้อมูลขาดช่วง', 'สถานียังส่งอยู่ แต่ข้อมูลบางช่วงหายไป (ได้ไม่ครบ 144 ค่าใน 24 ชม.)'], ['late', 'ข้อมูลมาช้า', 'ค่าล่าสุดมาถึงช้ากว่าปกติ (เกิน 10 นาที)'], ['silent', 'ออฟไลน์', 'สถานีไม่ส่งข้อมูลเกิน 30 นาที → ออกหน้างาน']].map(([k, l, h]) => ({
        label: l, hint: h + ' · กดเพื่อกรอง', n: scoped.filter((r) => DSall[r[0]].kind === k).length, on: s.dsf === k, cls: 'mlg-r mlg-ds ' + k + (s.dsf === k ? ' on' : ''), pick: () => this.setState({ dsf: s.dsf === k ? null : k, page: 1, tip: null }) })),
      isRain, notRain: !isRain, legendTitle: met.title, critSw: isRain ? [['tw', 'สถาบันสารสนเทศทรัพยากรน้ำ', 'เกณฑ์สีตาม thaiwater.net'], ['own', 'ปภ.', 'เกณฑ์ระดับฝนรายสถานีตรวจวัด (ของเรา) · 5 ระดับ']].map(([k, l, h]) => ({ label: l, hint: h, on: (s.crit || 'tw') === k, cls: (s.crit || 'tw') === k ? 'on' : '', pick: () => this.setState({ crit: k, hidden: {}, ibLv: 'all', page: 1 }) })) : [], hasCritSw: isRain, critNote: ((s.crit || 'tw')==='own' ? 'เกณฑ์ ปภ. · ' : 'เกณฑ์ สถาบันสารสนเทศทรัพยากรน้ำ · ') + (this.periods().find(q=>q[0]===s.period)||[0,'24 ชม.'])[1] + ' · รายสถานีที่ตั้งเฉพาะ ดูช่วงค่าใน Popup', colTop: met.col, colUnit: met.unitTh,
      mLabel: met.label, mAria: 'ประเภทข้อมูล: ' + met.label, mOpen: !!s.mOpen, mChev: s.mOpen ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6',
      toggleM: () => this.setState({ mOpen: !s.mOpen, dd: null }), closeM: () => this.setState({ mOpen: false }),
      metrics: MD.map((x) => ({ label: x.label, on: x.key === met.key, cls: x.key === met.key ? 'on' : '', pick: () => this.setState({ metric: x.key, mOpen: false, page: 1, tip: null }) })),
      pins: pinsV, tip: s.tip ? s.tip.t : '', tipStyle: s.tip ? 'left: ' + s.tip.x + 'px; top: ' + s.tip.y + 'px;' : '',
      rightCls: 'abs ex-p ex-right', mName: met.name, mlgCls: s.legend ? 'abs mlg' : 'abs mlg closed', mlgChev: s.legend ? 'm6 9 6 6 6-6' : 'm18 15-6-6-6 6',
      lq: s.lq || '', setLq: (e) => this.setState({ lq: e.target.value, page: 1 }), setAgf: (e) => this.setState({ agf: e.target.value, page: 1 }),
      agAllN: scoped.length, agOpts: AGL.map((a) => ({ v: a, on: s.agf === a, label: agLabel(a) + ' (' + scoped.filter((r) => agOf(r) === a).length + ')' })), noRows: shown.length === 0,
      total: scoped.length, legendOpen: s.legend, toggleLegend: () => this.setState({ legend: !s.legend }),
      legendBtn: s.legend ? 'ซ่อนเกณฑ์' : 'แสดงเกณฑ์', legendIcon: s.legend ? 'M12 12h0' : 'M12 5v14', legend,
      tabs, prevPeriod: () => this.setState({ period: per[(pi + per.length - 1) % per.length], page: 1 }, () => this.scrollTab()), nextPeriod: () => this.setState({ period: per[(pi + 1) % per.length], page: 1 }, () => this.scrollTab()),
      rows, pages: pageBtns, prevDis: page <= 1, nextDis: page >= pages,
      prevPage: () => this.setState({ page: page - 1 }), nextPage: () => this.setState({ page: page + 1 }),
      sizes: [10, 20, 50].map((v) => ({ v, on: s.size === v })), setSize: (e) => this.setState({ size: +e.target.value, page: 1 })
    });
  }
}
