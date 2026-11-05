import { DCLogic } from '../runtime.js';
import { thresholdSettings, hasCustomThreshold } from '../threshold-settings.js';
export default class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { page:'stations', q:'', basin:'', stat:'', menu:null, modal:null, hidden:{'G15006-2204':true,'G15006-4006':true}, toast:'' };
    if(globalThis.location?.hash === '#stations/master') this.state.page='master';
    const direct = /^#stations\/(G\d+-\d+)\/thresholds$/.exec(globalThis.location?.hash || '');
    if (direct && this.stations().some(station => station.code === direct[1])) this.state.modal = direct[1];
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
      ['G15006-0821', 'อบต.ปิงโค้ง', 'ต.ปิงโค้ง อ.เชียงดาว จ.เชียงใหม่', 'ลุ่มน้ำปิง', '30 นาที', 'กิตติ ทองดี', '09/07/2568 12:40', true, 'กรมทรัพยากรน้ำ'],
      ['G15006-5501', 'องค์การบริหารส่วนตำบลขุนน่าน', 'ต.ขุนน่าน อ.เฉลิมพระเกียรติ จ.น่าน', 'ลุ่มน้ำน่าน', '15 นาที', 'นายสมชาย วงศ์ศรี', '09/10/2569 11:00', true, 'กรมป้องกันและบรรเทาสาธารณภัย']
    ].map((r, i) => ({ code: r[0], name: r[1], loc: r[2], basin: r[3], freq: r[4], owner: r[5], upd: r[6], online: r[7], agency: r[8], no: 61 + i }));
  }

  renderVals() {
    const s=this.state;
    const theme=this.props.theme || s.theme || 'dark';
    const setTheme=v=>this.props.setTheme ? this.props.setTheme(v) : this.setState({theme:v});
    const stations=this.stations();
    const list=stations.filter(x=>(!s.q.trim() || (x.code+x.name+x.loc).includes(s.q.trim())) && (!s.basin || x.basin===s.basin) && (!s.stat || (s.stat==='on')===x.online));
    const rows=list.map(x=>({
      ...x,loc1:x.loc.split(' จ.')[0],loc2:'จ.'+x.loc.split(' จ.')[1],updD:x.upd.split(' ')[0],updT:x.upd.split(' ')[1],
      own:hasCustomThreshold(x.code),source:thresholdSettings.stations[x.code]?.rain ? 'รายสถานี' : 'กลาง Default',
      st:x.online?'Online':'Offline',stCls:x.online?'st-on':'st-off',show:!s.hidden[x.code],tgCls:s.hidden[x.code]?'tgx':'tgx on',tgAria:'แสดงผล '+x.name,
      toggle:()=>this.setState({hidden:{...s.hidden,[x.code]:!s.hidden[x.code]}}),
      menu:s.menu===x.code,kbCls:s.menu===x.code?'kb on':'kb',kbAria:'จัดการ '+x.name,
      openMenu:()=>this.setState({menu:s.menu===x.code?null:x.code}),openTh:()=>this.setState({menu:null,modal:x.code})
    }));
    return {
      isLight:theme==='light',isDark:theme!=='light',thLightCls:theme==='light'?'on':'',thDarkCls:theme!=='light'?'on':'',
      setLight:()=>setTheme('light'),setDark:()=>setTheme('dark'),rootCls:theme==='light'?'sx lt':'sx',theme,setThemeFn:setTheme,
      goMap:()=>this.props.goMap?.(),masterCurrent:s.page==='master'?'master':'stations',onBackoffice:s.page!=='line',onMaster:s.page==='master',stationNav:s.page==='stations'?'mi on':'mi',masterNav:s.page==='master'?'mi on':'mi',masterUrl:import.meta.env.BASE_URL+'master-data.html',onStations:s.page==='stations',onLine:s.page==='line',
      goMaster:()=>this.setState({page:'master',menu:null,modal:null}),goStations:()=>this.setState({page:'stations'}),goLine:()=>this.setState({page:'line',menu:null,modal:null}),
      q:s.q,setQ:e=>this.setState({q:e.target.value}),
      basinOpts:[{v:'',l:'ลุ่มแม่น้ำ: ทั้งหมด',on:!s.basin},...Array.from(new Set(stations.map(x=>x.basin))).map(b=>({v:b,l:b,on:s.basin===b}))],
      setBasin:e=>this.setState({basin:e.target.value}),
      statOpts:[['','สถานะ: ทั้งหมด'],['on','สถานะ: Online'],['off','สถานะ: Offline']].map(([v,l])=>({v,l,on:s.stat===v})),setStat:e=>this.setState({stat:e.target.value}),
      rows,anyMenu:!!s.menu,closeMenu:()=>this.setState({menu:null}),modalOpen:!!s.modal,selectedStation:stations.find(x=>x.code===s.modal),
      closeModal:()=>this.setState({modal:null}),savedThreshold:message=>{this.setState({modal:null,toast:message});clearTimeout(this._t);this._t=setTimeout(()=>this.setState({toast:''}),3500);},toast:s.toast
    };
  }
  componentWillUnmount(){clearTimeout(this._t);}
}
