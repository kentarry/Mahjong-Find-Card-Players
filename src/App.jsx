import { useState, useEffect } from "react";

// ─── Tag Categories (expanded) ─────────────────────────────────────
const TAG_CATS = {
  facility: { label: "🏠 場地設施", color: { bg: "rgba(74,222,128,0.08)", fg: "#6ee7a0", bd: "rgba(74,222,128,0.18)" }, items: [
    "有廁所","有冷氣","有停車位","有電動麻將桌","手動麻將桌","有茶水","有零食飲料","有Wi-Fi","有貓狗","近捷運站","有電梯","有充電座",
  ]},
  smoking: { label: "🚬 菸酒規定", color: { bg: "rgba(251,191,36,0.08)", fg: "#fbbf24", bd: "rgba(251,191,36,0.18)" }, items: [
    "禁菸","可菸","可電子菸","禁電子菸","可飲酒","禁酒","可帶外食",
  ]},
  gender: { label: "👤 性別／身份限制", color: { bg: "rgba(244,114,182,0.08)", fg: "#f9a8d4", bd: "rgba(244,114,182,0.18)" }, items: [
    "限女性","限男性","不限性別","限學生","限上班族","限年滿18歲","限年滿20歲",
  ]},
  rules: { label: "🀄 牌規", color: { bg: "rgba(167,139,250,0.08)", fg: "#c4b5fd", bd: "rgba(167,139,250,0.18)" }, items: [
    "台灣麻將16張","廣東麻將13張","日本麻將","禁短牌","花牌","哩咕","嚦咕嚦咕","門清有平胡","台數限制","自摸加倍","連莊拉莊","放槍全包",
  ]},
  vibe: { label: "🎯 玩家偏好", color: { bg: "rgba(56,189,248,0.08)", fg: "#7dd3fc", bd: "rgba(56,189,248,0.18)" }, items: [
    "新手友善","快手","安靜打牌","歡樂場","認真場","可聊天","可帶朋友","固定咖","臨時湊人","教學局",
  ]},
};
const ALL_TAG_ITEMS = Object.values(TAG_CATS).flatMap(c => c.items);
const TAG_COLOR_MAP = {};
Object.values(TAG_CATS).forEach(c => c.items.forEach(item => { TAG_COLOR_MAP[item] = c.color; }));

const REGIONS = {
  "台北市": ["中正區","大同區","中山區","松山區","大安區","萬華區","信義區","士林區","北投區","內湖區","南港區","文山區"],
  "新北市": ["板橋區","三重區","中和區","永和區","新莊區","新店區","土城區","蘆洲區","樹林區","汐止區","鶯歌區","三峽區","淡水區","林口區"],
  "桃園市": ["桃園區","中壢區","大溪區","楊梅區","蘆竹區","龜山區","八德區","平鎮區"],
  "台中市": ["中區","東區","南區","西區","北區","北屯區","西屯區","南屯區","豐原區","大里區","太平區"],
  "台南市": ["中西區","東區","南區","北區","安平區","安南區","永康區","新營區"],
  "高雄市": ["新興區","前金區","苓雅區","鹽埕區","鼓山區","旗津區","前鎮區","三民區","楠梓區","小港區","左營區","鳳山區"],
  "基隆市": ["仁愛區","信義區","中正區","中山區","安樂區","暖暖區","七堵區"],
  "新竹市": ["東區","北區","香山區"],
  "嘉義市": ["東區","西區"],
};
const V_TYPES = ["公開棋牌社","私人住宅","其他"];
const RPT_REASONS = ["放鳥（未到場）","詐騙（金錢糾紛）","騷擾（言語或行為）","與事實不符（資訊造假）","其他"];
const STAKES_QUICK = ["50/10","100/20","100/50","200/50","300/100","500/100","500/200","1000/300"];

// ─── Mock Data ──────────────────────────────────────────────────────
const MOCK = [
  { id:1, host:{ name:"麻將小王子", avatar:"🀄", tid:"@mahjong_prince", bio:"打牌十年，歡迎新手" }, city:"台北市", dist:"中山區", venue:"XX棋牌社", vType:"公開棋牌社", slots:2, filled:1, time:new Date(Date.now()+7200000).toISOString(), stakes:"300/100", tags:["禁菸","有茶水","有電動麻將桌","有廁所","有冷氣","花牌","新手友善","歡樂場","不限性別","近捷運站","台灣麻將16張"], status:"open", reports:0 },
];

// ─── Helpers ────────────────────────────────────────────────────────
function fmtTime(iso) { const d=new Date(iso),h=String(d.getHours()).padStart(2,"0"),m=String(d.getMinutes()).padStart(2,"0"),t=new Date(),n=new Date(t);n.setDate(n.getDate()+1);const w=["日","一","二","三","四","五","六"][d.getDay()];if(d.toDateString()===t.toDateString())return"今天 "+h+":"+m;if(d.toDateString()===n.toDateString())return"明天 "+h+":"+m;return(d.getMonth()+1)+"/"+d.getDate()+"（"+w+"）"+h+":"+m; }
function fmtFull(iso) { const d=new Date(iso);return d.getFullYear()+"/"+(d.getMonth()+1)+"/"+d.getDate()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); }
function until(iso) { const df=new Date(iso).getTime()-Date.now();if(df<0)return null;const h=Math.floor(df/36e5),m=Math.floor(df%36e5/6e4);if(h>48)return null;if(h>0)return h+"時"+(m>0?m+"分":"")+"後";return m+"分鐘後"; }
function getStat(g) { const n=Date.now(),s=new Date(g.time).getTime();if(g.status==="closed"||g.status==="suspended")return"full";if(s<n-72e5)return"expired";if(s<=n)return"expired";if(s-n<36e5)return"soon";return"open"; }
function pBase(s) { return parseInt(s?.split("/")[0])||0; }

const SM = { open:{e:"🟢",l:"招募中",c:"#34d399",bg:"rgba(52,211,153,0.12)",bd:"rgba(52,211,153,0.3)"}, soon:{e:"🟡",l:"即將開打",c:"#fbbf24",bg:"rgba(251,191,36,0.12)",bd:"rgba(251,191,36,0.3)"}, full:{e:"🔴",l:"已滿局",c:"#f87171",bg:"rgba(248,113,113,0.12)",bd:"rgba(248,113,113,0.3)"}, expired:{e:"⚫",l:"已結束",c:"#6b7280",bg:"rgba(107,114,128,0.12)",bd:"rgba(107,114,128,0.3)"} };

// ─── Style tokens ───────────────────────────────────────────────────
const C = { bg:"#07080c", c1:"#0f1119", c2:"#151925", c3:"#1b2030", inp:"#0b0d14", acc:"#e8a838", acc2:"rgba(232,168,56,0.14)", tx:"#e8eaf0", tx2:"#9ca3b4", tx3:"#5a6174", bd:"rgba(255,255,255,0.06)", bd2:"rgba(255,255,255,0.1)", red:"#f87171" };
const bBtn = { display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer", border:"1px solid transparent", whiteSpace:"nowrap" };
const bAcc = { ...bBtn, background:C.acc, color:"#0a0b10", borderColor:C.acc };
const bOut = { ...bBtn, background:"transparent", color:C.tx2, borderColor:C.bd2 };
const bGh = { ...bBtn, background:"transparent", color:C.tx3, border:"none", padding:"6px 10px", fontSize:12 };
const bDng = { ...bBtn, background:"rgba(248,113,113,0.1)", color:C.red, borderColor:"rgba(248,113,113,0.2)" };
const bSm = { padding:"5px 12px", fontSize:12 };
const bBig = { padding:"14px 28px", fontSize:15, borderRadius:14, fontWeight:700, width:"100%" };
const crd = { background:C.c1, border:"1px solid "+C.bd, borderRadius:14, position:"relative" };
const inpS = { background:C.inp, color:C.tx, border:"1px solid "+C.bd, borderRadius:5, padding:"6px 8px", fontFamily:"inherit", fontSize:12, width:"100%" };
const lblS = { fontSize:9, color:C.tx3, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:2 };

// ─── Components ─────────────────────────────────────────────────────
function SmartTag({ name }) {
  const tc = TAG_COLOR_MAP[name] || { bg:"rgba(255,255,255,0.05)", fg:C.tx2, bd:C.bd };
  return <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:14, fontSize:11, fontWeight:500, background:tc.bg, color:tc.fg, border:"1px solid "+tc.bd }}>{name}</span>;
}
function Pill({ status }) { const s=SM[status]; return <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:14, fontSize:11, fontWeight:700, background:s.bg, color:s.c, border:"1px solid "+s.bd }}>{s.e} {s.l}</span>; }
function Ov({ children, onClose }) { return <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", backdropFilter:"blur(14px)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}><div onClick={e=>e.stopPropagation()} style={{ background:C.c1, border:"1px solid "+C.bd2, borderRadius:14, width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto", position:"relative" }}>{children}</div></div>; }
function ICell({ icon, label, children, accent }) { return <div style={{ background:C.c2, padding:"12px 14px", display:"flex", flexDirection:"column", gap:2 }}><div style={{ fontSize:9, color:C.tx3, fontWeight:700, textTransform:"uppercase", letterSpacing:0.6 }}>{icon} {label}</div><div style={{ fontSize:15, fontWeight:800, color:accent?C.acc:C.tx }}>{children}</div></div>; }

function SafetyBanner() {
  return <div style={{ margin:"0 20px 0", padding:"10px 12px", borderRadius:8, background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", fontSize:11, color:"#fca5a5", lineHeight:1.6 }}>
    ⚠️ <b>安全提醒：</b>前往不熟悉的場地前，請告知親友您的去向與預計回家時間。優先選擇公開棋牌社。本平台不介入任何糾紛，請自行評估風險。
  </div>;
}

// ─── Tag Picker (for forms, with category grouping) ─────────────────
function TagPicker({ selected, onChange }) {
  const toggle = (t) => onChange(selected.includes(t) ? selected.filter(x=>x!==t) : [...selected, t]);
  const tagS = (on) => ({ padding:"4px 12px", borderRadius:18, fontSize:11, cursor:"pointer", border:"1px solid "+(on?"rgba(232,168,56,0.35)":C.bd), background:on?C.acc2:"transparent", color:on?C.acc:C.tx3, fontFamily:"inherit", userSelect:"none" });
  return <div>
    {Object.entries(TAG_CATS).map(([key, cat]) => (
      <div key={key} style={{ marginBottom:12 }}>
        <div style={{ fontSize:10, fontWeight:700, color:C.acc, textTransform:"uppercase", letterSpacing:1, marginBottom:6, paddingBottom:4, borderBottom:"1px solid "+C.bd }}>{cat.label}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {cat.items.map(t => <button key={t} type="button" style={tagS(selected.includes(t))} onClick={()=>toggle(t)}>{t}</button>)}
        </div>
      </div>
    ))}
  </div>;
}

// ─── Detail Modal ───────────────────────────────────────────────────
function Detail({ game:g, user, onClose, onReport, onBlock, onFlash, onCloseGame, onDeleteGame, isMine }) {
  if(!g)return null;
  const s=getStat(g), sc=SM[s], cd=until(g.time), left=g.slots-g.filled;
  const dots=Array.from({length:g.slots},(_,i)=>i<g.filled);
  const tb = g.vType==="公開棋牌社"?{i:"🏢",bg:"rgba(74,222,128,0.1)",c:"#4ade80"}:g.vType==="私人住宅"?{i:"🏠",bg:"rgba(251,191,36,0.1)",c:"#facc15"}:{i:"📍",bg:"rgba(167,139,250,0.1)",c:"#a78bfa"};
  return <Ov onClose={onClose}>
    <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:C.c3, border:"none", color:C.tx2, width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1 }}>✕</button>
    <div style={{ padding:"28px 20px 14px", display:"flex", gap:14 }}>
      <div style={{ width:56, height:56, borderRadius:"50%", background:C.c3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, border:"3px solid "+C.bd2, flexShrink:0 }}>{g.host.avatar}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:18, fontWeight:800 }}>{g.host.name}</div>
        <div style={{ fontSize:12, color:C.tx3, marginTop:1 }}>{g.host.tid}</div>
        {g.host.bio&&<div style={{ fontSize:12, color:C.tx2, marginTop:4, lineHeight:1.6 }}>{g.host.bio}</div>}
        <div style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:700, marginTop:6, background:tb.bg, color:tb.c }}>{tb.i} {g.vType}</div>
      </div>
    </div>
    <div style={{ margin:"0 20px", padding:"10px 14px", borderRadius:10, display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700, background:sc.bg, color:sc.c, border:"1px solid "+sc.bd }}>
      {sc.e} {sc.l}
      {cd&&<span style={{ marginLeft:"auto", fontSize:11, color:"#fbbf24" }}>{"⏰ "+cd}</span>}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, margin:"12px 20px 0", background:C.bd, borderRadius:10, overflow:"hidden" }}>
      <ICell icon="📍" label="地點"><div>{g.city}{g.dist}</div><div style={{ fontSize:11, color:C.tx3, marginTop:1 }}>{g.venue}</div></ICell>
      <ICell icon="🕐" label="開打時間"><div>{fmtTime(g.time)}</div><div style={{ fontSize:10, color:C.tx3, marginTop:1 }}>{fmtFull(g.time)}</div></ICell>
      <ICell icon="💰" label="底/台" accent>{g.stakes}</ICell>
      <ICell icon="👥" label="缺額"><div>{"缺 "+(left>0?left:0)+" 人"}</div><div style={{ display:"flex", gap:5, marginTop:4 }}>{dots.map((f,i)=><div key={i} style={{ width:12, height:12, borderRadius:"50%", background:f?C.acc:"transparent", border:f?"none":"2.5px solid "+C.acc }}/>)}</div></ICell>
    </div>
    {g.tags.length>0&&<div style={{ padding:"14px 20px 0" }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.tx3, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>條件標籤</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{g.tags.map(t=><SmartTag key={t} name={t}/>)}</div>
    </div>}
    <div style={{ padding:"12px 20px 0" }}><SafetyBanner/></div>
    <div style={{ padding:"16px 20px 8px" }}>
      {user&&(s==="open"||s==="soon")&&!isMine&&<button style={{ ...bAcc, ...bBig }} onClick={()=>{ onFlash("跳轉至 "+g.host.name+" 的 Threads"); window.open("https://www.threads.net/"+g.host.tid.replace("@",""),"_blank"); }}>{"💬 我有興趣，前往 Threads 聯繫"}</button>}
      {!user&&(s==="open"||s==="soon")&&<div style={{ textAlign:"center", color:C.tx3, fontSize:12, padding:8 }}>請先登入才能聯繫主揪</div>}
      {isMine&&<div style={{ display:"flex", gap:8 }}>
        {(s==="open"||s==="soon")&&<button style={{ ...bOut, flex:1 }} onClick={()=>onCloseGame(g.id)}>標記已滿局</button>}
        <button style={{ ...bDng, flex:1 }} onClick={()=>onDeleteGame(g.id)}>刪除此局</button>
      </div>}
    </div>
    {user&&!isMine&&<div style={{ display:"flex", gap:16, justifyContent:"center", padding:"8px 20px 20px" }}>
      <button style={{ fontSize:11, color:C.tx3, cursor:"pointer", background:"none", border:"none", fontFamily:"inherit" }} onClick={onReport}>🚩 檢舉</button>
      <button style={{ fontSize:11, color:C.tx3, cursor:"pointer", background:"none", border:"none", fontFamily:"inherit" }} onClick={onBlock}>🚫 封鎖</button>
    </div>}
  </Ov>;
}

// ─── Compact Card ───────────────────────────────────────────────────
function Card({ game:g, onClick }) {
  const s=getStat(g), sc=SM[s], left=g.slots-g.filled, cd=until(g.time), dim=s==="expired"||s==="full";
  return <div onClick={dim?undefined:onClick} style={{ ...crd, padding:"14px 16px", cursor:dim?"default":"pointer", opacity:dim?0.3:1, filter:dim?"grayscale(0.5)":"none" }}>
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:40, height:40, borderRadius:"50%", background:C.c3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, border:"2px solid "+C.bd2, flexShrink:0 }}>{g.host.avatar}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:6 }}>{g.host.name}<span style={{ fontSize:10, color:C.tx3, fontWeight:400 }}>{g.host.tid}</span></div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"3px 12px", marginTop:3, fontSize:12, color:C.tx2 }}>
          <span>{"📍 "+g.city+g.dist+" · "+g.venue}</span>
          <span>{"🕐 "+fmtTime(g.time)}</span>
          <span style={{ color:C.acc, fontWeight:700 }}>{"💰 "+g.stakes}</span>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
        <Pill status={s}/>
        {(s==="open"||s==="soon")&&<div style={{ fontSize:14, fontWeight:800, color:C.acc }}>{"缺"+left+"人"}</div>}
        {cd&&<div style={{ fontSize:10, color:"#facc15", fontWeight:600 }}>{"⏰ "+cd}</div>}
        {!dim&&<div style={{ color:C.tx3, fontSize:18, marginTop:2 }}>›</div>}
      </div>
    </div>
  </div>;
}

// ─── Lobby ──────────────────────────────────────────────────────────
function Lobby({ games, user, onOpen }) {
  const [showF, setShowF] = useState(false);
  const [city, setCity] = useState(""); const [dist, setDist] = useState("");
  const [df, setDf] = useState(""); const [dt, setDt] = useState(""); const [tf, setTf] = useState(""); const [tt, setTt] = useState("");
  const [sMin, setSMin] = useState(""); const [sMax, setSMax] = useState("");
  const [vt, setVt] = useState(""); const [tags, setTags] = useState([]); const [hideEnd, setHideEnd] = useState(true);
  const togTag = (t) => setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  const clear = () => { setCity("");setDist("");setDf("");setDt("");setTf("");setTt("");setSMin("");setSMax("");setVt("");setTags([]); };
  const fN = [city,dist,df,dt,tf,tt,sMin,sMax,vt].filter(Boolean).length+tags.length;
  const chipS = (on) => ({ padding:"3px 9px", borderRadius:14, fontSize:10, cursor:"pointer", border:"1px solid "+(on?"rgba(232,168,56,0.3)":C.bd), background:on?C.acc2:"transparent", color:on?C.acc:C.tx3, fontFamily:"inherit" });

  const filtered = games.filter(g=>{
    const s=getStat(g); if(hideEnd&&(s==="expired"||s==="full"))return false;
    if(city&&g.city!==city)return false; if(dist&&g.dist!==dist)return false; if(vt&&g.vType!==vt)return false;
    const gd=new Date(g.time);
    if(df){const d=new Date(df);d.setHours(0,0,0,0);if(gd<d)return false;} if(dt){const d=new Date(dt);d.setHours(23,59,59,999);if(gd>d)return false;}
    if(tf){const[h,m]=tf.split(":").map(Number);if(gd.getHours()*60+gd.getMinutes()<h*60+m)return false;} if(tt){const[h,m]=tt.split(":").map(Number);if(gd.getHours()*60+gd.getMinutes()>h*60+m)return false;}
    const b=pBase(g.stakes); if(sMin&&b<+sMin)return false; if(sMax&&b>+sMax)return false;
    if(tags.length>0&&!tags.every(t=>g.tags.includes(t)))return false;
    return true;
  }).sort((a,b)=>new Date(a.time)-new Date(b.time));
  const openN = games.filter(g=>getStat(g)==="open"||getStat(g)==="soon").length;

  // Popular quick-filter tags
  const quickTags = ["新手友善","禁菸","有電動麻將桌","限女性","可電子菸","有廁所","歡樂場","快手","日本麻將","教學局"];

  return <div>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
      <div><div style={{ fontFamily:"'DM Serif Display',serif", fontSize:24 }}>找牌局</div><div style={{ color:C.tx3, fontSize:12, marginTop:2 }}>{openN} 桌招募中</div></div>
      <label style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:C.tx3, cursor:"pointer" }}><input type="checkbox" checked={hideEnd} onChange={e=>setHideEnd(e.target.checked)} style={{ accentColor:C.acc }}/>隱藏已結束</label>
    </div>
    <div onClick={()=>setShowF(!showF)} style={{ display:"flex", alignItems:"center", gap:8, margin:"14px 0 10px", cursor:"pointer", userSelect:"none" }}>
      <span style={{ fontSize:12, fontWeight:600, color:C.tx2 }}>🔍 篩選條件</span>
      {fN>0&&<span style={{ fontSize:10, background:C.acc, color:"#0a0b10", padding:"1px 7px", borderRadius:10, fontWeight:700 }}>{fN}</span>}
      <span style={{ fontSize:10, color:C.tx3, transform:showF?"rotate(180deg)":"none" }}>▼</span>
      {fN>0&&<button onClick={e=>{e.stopPropagation();clear()}} style={{ fontSize:10, color:C.tx3, cursor:"pointer", background:"none", border:"none", fontFamily:"inherit", textDecoration:"underline", marginLeft:"auto" }}>清除全部</button>}
    </div>
    {showF&&<div style={{ ...crd, padding:14, marginBottom:12 }}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"flex-end", marginBottom:8 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}><div style={lblS}>縣市</div><select style={inpS} value={city} onChange={e=>{setCity(e.target.value);setDist("")}}><option value="">全部</option>{Object.keys(REGIONS).map(c=><option key={c}>{c}</option>)}</select></div>
        {city&&REGIONS[city]&&<div style={{ display:"flex", flexDirection:"column", gap:2 }}><div style={lblS}>行政區</div><select style={inpS} value={dist} onChange={e=>setDist(e.target.value)}><option value="">全部</option>{REGIONS[city].map(d=><option key={d}>{d}</option>)}</select></div>}
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}><div style={lblS}>場地</div><select style={inpS} value={vt} onChange={e=>setVt(e.target.value)}><option value="">全部</option>{V_TYPES.map(v=><option key={v}>{v}</option>)}</select></div>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"flex-end", marginBottom:8 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}><div style={lblS}>日期從</div><input style={inpS} type="date" value={df} onChange={e=>setDf(e.target.value)}/></div>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}><div style={lblS}>日期到</div><input style={inpS} type="date" value={dt} onChange={e=>setDt(e.target.value)}/></div>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}><div style={lblS}>時間從</div><input style={inpS} type="time" value={tf} onChange={e=>setTf(e.target.value)}/></div>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}><div style={lblS}>時間到</div><input style={inpS} type="time" value={tt} onChange={e=>setTt(e.target.value)}/></div>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"flex-end", marginBottom:8 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}><div style={lblS}>底注最低</div><input style={{ ...inpS, width:80 }} type="number" min="0" placeholder="0" value={sMin} onChange={e=>setSMin(e.target.value)}/></div>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}><div style={lblS}>底注最高</div><input style={{ ...inpS, width:80 }} type="number" min="0" placeholder="不限" value={sMax} onChange={e=>setSMax(e.target.value)}/></div>
      </div>
      <div style={{ fontSize:9, fontWeight:700, color:C.tx3, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>快速標籤篩選（交集）</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{quickTags.map(t=><button key={t} style={chipS(tags.includes(t))} onClick={()=>togTag(t)}>{t}</button>)}</div>
    </div>}
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {filtered.length===0?<div style={{ textAlign:"center", padding:"40px 16px", color:C.tx3 }}><div style={{ fontSize:40, marginBottom:10, opacity:0.35 }}>🔍</div><div style={{ fontSize:13 }}>沒有符合條件的牌局</div></div>
      :filtered.map(g=><Card key={g.id} game={g} onClick={()=>onOpen(g.id)}/>)}
    </div>
  </div>;
}

// ─── Post Game ──────────────────────────────────────────────────────
function PostGame({ onSubmit, onCancel }) {
  const [city,setCity]=useState("");const [dist,setDist]=useState("");const [venue,setVenue]=useState("");const [vType,setVType]=useState("公開棋牌社");const [slots,setSlots]=useState("2");const [date,setDate]=useState("");const [time,setTime]=useState("");const [stakes,setStakes]=useState("");const [tags,setTags]=useState([]);const [errs,setErrs]=useState({});
  const validate = () => { const e={};if(!city)e.city="請選擇";if(!venue.trim())e.venue="請填寫";if(!date||!time)e.time="請選擇";else if(new Date(date+"T"+time)<=new Date())e.time="不能早於現在";if(!stakes.trim())e.stakes="請填寫";setErrs(e);return Object.keys(e).length===0; };
  const submit = () => { if(!validate())return; onSubmit({ city, dist, venue:venue.trim(), vType, slots:+slots, time:new Date(date+"T"+time).toISOString(), stakes:stakes.trim(), tags }); };
  const today = new Date().toISOString().split("T")[0];
  const iS = { background:C.inp, color:C.tx, border:"1px solid "+C.bd, borderRadius:5, padding:"8px 10px", fontFamily:"inherit", fontSize:13, width:"100%" };
  const lS = { fontSize:11, color:C.tx2, fontWeight:500, marginBottom:2 };
  const sqS = (on) => ({ padding:"3px 10px", borderRadius:12, fontSize:11, cursor:"pointer", background:on?C.acc:C.c3, color:on?"#0a0b10":C.tx3, border:"1px solid "+(on?C.acc:C.bd), fontFamily:"inherit", fontWeight:on?700:400 });

  return <div>
    <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:24 }}>開一局</div>
    <div style={{ color:C.tx3, fontSize:12, marginTop:2, marginBottom:14 }}>填寫資訊，讓牌友找到你</div>
    <div style={{ ...crd, padding:20, maxWidth:640 }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.acc, textTransform:"uppercase", letterSpacing:1, marginBottom:10, paddingBottom:5, borderBottom:"1px solid "+C.bd }}>必填資訊</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8 }}>
        <div><div style={lS}>縣市 <span style={{ color:C.red }}>*</span></div><select style={iS} value={city} onChange={e=>{setCity(e.target.value);setDist("")}}><option value="">請選擇</option>{Object.keys(REGIONS).map(c=><option key={c}>{c}</option>)}</select>{errs.city&&<div style={{ fontSize:10, color:C.red, marginTop:1 }}>{errs.city}</div>}</div>
        <div><div style={lS}>行政區</div><select style={iS} value={dist} onChange={e=>setDist(e.target.value)} disabled={!city}><option value="">請選擇</option>{city&&REGIONS[city]?.map(d=><option key={d}>{d}</option>)}</select></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8 }}>
        <div><div style={lS}>場地名稱 <span style={{ color:C.red }}>*</span></div><input style={iS} placeholder="XX棋牌社 / 自宅" value={venue} onChange={e=>setVenue(e.target.value)}/>{errs.venue&&<div style={{ fontSize:10, color:C.red, marginTop:1 }}>{errs.venue}</div>}</div>
        <div><div style={lS}>場地類型 <span style={{ color:C.red }}>*</span></div><select style={iS} value={vType} onChange={e=>setVType(e.target.value)}>{V_TYPES.map(v=><option key={v}>{v}</option>)}</select></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8 }}>
        <div><div style={lS}>缺額人數 <span style={{ color:C.red }}>*</span></div><select style={iS} value={slots} onChange={e=>setSlots(e.target.value)}><option value="1">缺 1 人</option><option value="2">缺 2 人</option><option value="3">缺 3 人</option></select></div>
        <div><div style={lS}>開打時間 <span style={{ color:C.red }}>*</span></div><div style={{ display:"flex", gap:4 }}><input style={{ ...iS, flex:1 }} type="date" min={today} value={date} onChange={e=>setDate(e.target.value)}/><input style={{ ...iS, flex:1 }} type="time" value={time} onChange={e=>setTime(e.target.value)}/></div>{errs.time&&<div style={{ fontSize:10, color:C.red, marginTop:1 }}>{errs.time}</div>}</div>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={lS}>底/台 金額 <span style={{ color:C.red }}>*</span></div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:6 }}>{STAKES_QUICK.map(s=><button key={s} type="button" style={sqS(stakes===s)} onClick={()=>setStakes(s)}>{s}</button>)}</div>
        <input style={iS} placeholder="自行輸入，如 300/100" value={stakes} onChange={e=>setStakes(e.target.value)}/>
        <div style={{ fontSize:10, color:C.tx3, marginTop:2 }}>點擊快速填入或自由輸入</div>
        {errs.stakes&&<div style={{ fontSize:10, color:C.red, marginTop:1 }}>{errs.stakes}</div>}
      </div>
      <div style={{ fontSize:10, fontWeight:700, color:C.acc, textTransform:"uppercase", letterSpacing:1, marginBottom:10, paddingBottom:5, borderBottom:"1px solid "+C.bd }}>條件標籤（選填，可複選）</div>
      <TagPicker selected={tags} onChange={setTags}/>
      <div style={{ display:"flex", gap:6, justifyContent:"flex-end", marginTop:16 }}>
        <button style={bOut} onClick={onCancel}>取消</button>
        <button style={bAcc} onClick={submit}>發布牌局 🀄</button>
      </div>
    </div>
  </div>;
}

// ─── Profile ────────────────────────────────────────────────────────
function Profile({ user, games, my, bl, onUnblock, onClose, onDelete, onLogout, onOpen }) {
  const [tab, setTab] = useState("my");
  const list = games.filter(g=>my.includes(g.id));
  return <div>
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
      <div style={{ width:52, height:52, borderRadius:"50%", background:C.c3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, border:"2px solid "+C.acc, flexShrink:0 }}>{user.avatar}</div>
      <div><div style={{ fontSize:16, fontWeight:700 }}>{user.name}</div><div style={{ color:C.tx3, fontSize:11 }}>{user.tid}</div>{user.bio&&<div style={{ color:C.tx2, fontSize:11, marginTop:1 }}>{user.bio}</div>}</div>
      <button style={{ ...bGh, marginLeft:"auto" }} onClick={onLogout}>登出</button>
    </div>
    <div style={{ display:"flex", gap:8, marginBottom:16 }}>
      {[{n:list.length,l:"開局數"},{n:list.filter(g=>getStat(g)==="open"||getStat(g)==="soon").length,l:"進行中"},{n:bl.length,l:"黑名單"}].map(s=>
        <div key={s.l} style={{ flex:1, background:C.c3, border:"1px solid "+C.bd, borderRadius:8, padding:10, textAlign:"center" }}><div style={{ fontSize:20, fontWeight:900, color:C.acc }}>{s.n}</div><div style={{ fontSize:9, color:C.tx3, marginTop:1 }}>{s.l}</div></div>
      )}
    </div>
    <div style={{ display:"flex", gap:2, marginBottom:16, background:C.c3, borderRadius:8, padding:3 }}>
      {["my","bl"].map(t=><button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:7, textAlign:"center", fontSize:12, fontWeight:600, color:tab===t?"#0a0b10":C.tx3, cursor:"pointer", borderRadius:5, border:"none", background:tab===t?C.acc:"none", fontFamily:"inherit" }}>{t==="my"?"我的牌局":"黑名單"}</button>)}
    </div>
    {tab==="my"&&<div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {list.length===0?<div style={{ textAlign:"center", padding:40, color:C.tx3 }}><div style={{ fontSize:40, marginBottom:10, opacity:0.35 }}>🀄</div><div style={{ fontSize:13 }}>還沒開過局</div></div>
      :list.map(g=>{const s=getStat(g);return <div key={g.id} style={{ ...crd, padding:"14px 16px", cursor:"pointer" }} onClick={()=>onOpen(g.id)}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", fontSize:13 }}><span style={{ fontWeight:700 }}>{"📍 "+g.city+g.dist+" · "+g.venue}</span><span style={{ color:C.tx2 }}>{"🕐 "+fmtTime(g.time)}</span><span style={{ color:C.acc, fontWeight:700 }}>{"💰 "+g.stakes}</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><Pill status={s}/><span style={{ color:C.tx3, fontSize:18 }}>›</span></div>
        </div>
      </div>;})}
    </div>}
    {tab==="bl"&&<div style={{ ...crd, padding:14 }}>
      {bl.length===0?<div style={{ textAlign:"center", padding:16, color:C.tx3, fontSize:12 }}>黑名單是空的</div>
      :bl.map(id=><div key={id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid "+C.bd }}><span style={{ fontSize:12 }}>{id}</span><button style={{ ...bGh, ...bSm }} onClick={()=>onUnblock(id)}>解除封鎖</button></div>)}
    </div>}
  </div>;
}

// ─── App ────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);const [page,setPage]=useState("lobby");const [games,setGames]=useState(MOCK);const [toast,setToast]=useState(null);const [dOk,setDOk]=useState(false);const [showD,setShowD]=useState(false);const [rptId,setRptId]=useState(null);const [bl,setBl]=useState([]);const [my,setMy]=useState([]);const [dtl,setDtl]=useState(null);

  useEffect(()=>{const iv=setInterval(()=>{setGames(p=>p.map(g=>{const s=getStat(g);return s==="expired"&&g.status!=="expired"?{...g,status:"expired"}:g}))},6e4);return()=>clearInterval(iv)},[]);

  const flash=(m)=>{setToast(m);setTimeout(()=>setToast(null),2500)};
  const login=()=>{if(!dOk){setShowD(true);return;}setUser({name:"我的帳號",avatar:"🀄",tid:"@my_threads",bio:"熱愛麻將"});flash("登入成功！")};
  const post=(d)=>{const g={id:Date.now(),host:user,...d,filled:0,status:"open",reports:0};setGames(p=>[g,...p]);setMy(p=>[g.id,...p]);setPage("lobby");flash("發布成功！🀄")};
  const closeG=(id)=>{setGames(p=>p.map(g=>g.id===id?{...g,status:"closed"}:g));flash("已標記已滿局");setDtl(null)};
  const delG=(id)=>{setGames(p=>p.filter(g=>g.id!==id));setMy(p=>p.filter(i=>i!==id));flash("已刪除");setDtl(null)};
  const rpt=(id,r)=>{setGames(p=>p.map(g=>{if(g.id!==id)return g;const c=g.reports+1;return c>=3?{...g,reports:c,status:"suspended"}:{...g,reports:c}}));setRptId(null);flash("檢舉已送出")};
  const block=(tid)=>{if(!bl.includes(tid)){setBl(p=>[...p,tid]);flash("已封鎖")}};
  const unblock=(tid)=>{setBl(p=>p.filter(i=>i!==tid));flash("已解除封鎖")};

  const vis=games.filter(g=>!bl.includes(g.host.tid)&&g.status!=="suspended");
  const dtlG=dtl?games.find(g=>g.id===dtl):null;

  return <div style={{ minHeight:"100vh", background:C.bg, color:C.tx, fontFamily:"'Noto Sans TC',system-ui,sans-serif" }}>

    <header style={{ position:"sticky", top:0, zIndex:100, background:"rgba(7,8,12,0.92)", backdropFilter:"blur(20px)", borderBottom:"1px solid "+C.bd, padding:"0 16px" }}>
      <div style={{ maxWidth:860, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:54 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:7, cursor:"pointer" }} onClick={()=>{setPage("lobby");setDtl(null)}}>
          <span style={{ fontSize:20 }}>🀄</span><span style={{ fontFamily:"'DM Serif Display',serif", fontSize:21, color:C.acc, fontWeight:700 }}>湊咖</span><span style={{ fontSize:9, color:C.tx3, letterSpacing:2, textTransform:"uppercase" }}>Còukā</span>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {user?<>
            <button style={{ ...bAcc, ...bSm }} onClick={()=>setPage("post")}>＋ 開局</button>
            <button style={{ ...bOut, ...bSm }} onClick={()=>{setPage("lobby");setDtl(null)}}>大廳</button>
            <button style={bGh} onClick={()=>setPage("profile")}>{user.avatar} 我的</button>
          </>:<button style={{ ...bBtn, background:"rgba(255,255,255,0.05)", color:C.tx, borderColor:C.bd2, gap:8, padding:"10px 20px", fontSize:14 }} onClick={login}>使用 Threads 登入</button>}
        </div>
      </div>
    </header>

    {/* ── Comprehensive Disclaimer ── */}
    {showD&&<Ov onClose={()=>setShowD(false)}>
      <div style={{ padding:20 }}>
        <div style={{ fontSize:17, fontWeight:700, marginBottom:12 }}>⚠️ 使用條款與免責聲明</div>
        <div style={{ background:"rgba(248,113,113,0.05)", border:"1px solid rgba(248,113,113,0.15)", borderRadius:14, padding:18, marginBottom:10 }}>
          <div style={{ color:"#fca5a5", fontWeight:700, marginBottom:8, fontSize:14 }}>🔴 重要安全聲明</div>
          <div style={{ color:C.tx2, fontSize:12, lineHeight:2.0 }}>
            1. 本平台「湊咖」<b style={{color:C.tx}}>僅提供麻將牌局資訊媒合服務</b>，非博弈平台，不經手、不介入、不擔保任何金錢交易。<br/>
            2. 所有牌局之賭注金額、規則、場地等事項，<b style={{color:C.tx}}>皆由主揪與參與者自行協商</b>，本平台不承擔任何責任。<br/>
            3. 本平台<b style={{color:C.tx}}>不對使用者之人身安全承擔任何責任</b>。前往不熟悉的場地時，請務必：<br/>
            <span style={{ paddingLeft:16, display:"block" }}>・告知親友您的去向、場地地址與預計回家時間<br/>・優先選擇公開棋牌社而非私人住宅<br/>・避免單獨前往陌生人的私宅<br/>・隨身攜帶手機並保持電量充足</span>
            4. 使用者在平台上發布之資訊應<b style={{color:C.tx}}>真實正確</b>，若刻意提供虛假資訊將被停權處分。<br/>
            5. 若您遭遇任何糾紛、詐騙或危險，請<b style={{color:C.tx}}>立即報警（110）</b>並使用平台內檢舉功能回報。<br/>
            6. 本平台保留隨時修改服務條款及停止服務之權利。<br/>
            7. <b style={{color:"#fca5a5"}}>本平台之工具製作者與營運方不承擔因使用本服務所產生之任何直接、間接損失，包括但不限於財產損失、人身傷害、精神損害等。</b>
          </div>
        </div>
        <div style={{ background:"rgba(232,168,56,0.04)", border:"1px solid rgba(232,168,56,0.12)", borderRadius:14, padding:14, marginBottom:14 }}>
          <div style={{ color:C.acc, fontWeight:700, marginBottom:6, fontSize:12 }}>📋 使用者行為守則</div>
          <div style={{ color:C.tx2, fontSize:11, lineHeight:1.9 }}>
            ・不得利用本平台從事非法賭博或任何違法行為<br/>
            ・不得發布虛假、誤導或歧視性內容<br/>
            ・不得騷擾、威脅、恐嚇其他使用者<br/>
            ・放鳥（無故不到場）將累計記錄，多次將被停權<br/>
            ・請尊重每位玩家，維護良好遊戲環境
          </div>
        </div>
        <label style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12, cursor:"pointer", marginBottom:14, lineHeight:1.7 }}>
          <input type="checkbox" checked={dOk} onChange={e=>setDOk(e.target.checked)} style={{ accentColor:C.acc, width:16, height:16, marginTop:3, flexShrink:0 }}/>
          <span>我已詳閱並完全同意上述所有條款，理解本平台僅提供資訊媒合服務，<b style={{ color:"#fca5a5" }}>所有風險由本人自行承擔</b>。</span>
        </label>
        <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
          <button style={bOut} onClick={()=>setShowD(false)}>取消</button>
          <button style={{ ...bAcc, opacity:dOk?1:0.35 }} disabled={!dOk} onClick={()=>{setShowD(false);login()}}>同意並繼續</button>
        </div>
      </div>
    </Ov>}

    {/* Report */}
    {rptId!==null&&<Ov onClose={()=>setRptId(null)}><div style={{ padding:20 }}>
      <div style={{ fontSize:16, fontWeight:700, marginBottom:10 }}>🚩 檢舉此揪團</div>
      <div style={{ color:C.tx2, fontSize:11, marginBottom:10, lineHeight:1.6 }}>您的檢舉將被記錄。同一帳號累計收到 3 次檢舉將自動停權。</div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {RPT_REASONS.map(r=><button key={r} style={{ ...bOut, justifyContent:"flex-start" }} onClick={()=>rpt(rptId,r)}>{r}</button>)}
      </div>
      <button style={{ ...bGh, marginTop:8, width:"100%" }} onClick={()=>setRptId(null)}>取消</button>
    </div></Ov>}

    {/* Detail */}
    {dtlG&&<Detail game={dtlG} user={user} onClose={()=>setDtl(null)} onReport={()=>{setDtl(null);setRptId(dtlG.id)}} onBlock={()=>{block(dtlG.host.tid);setDtl(null)}} onFlash={flash} onCloseGame={closeG} onDeleteGame={delG} isMine={my.includes(dtlG.id)}/>}

    <div style={{ maxWidth:860, margin:"0 auto", padding:16 }}>
      {page==="lobby"&&<Lobby games={vis} user={user} onOpen={setDtl}/>}
      {page==="post"&&user&&<PostGame onSubmit={post} onCancel={()=>setPage("lobby")}/>}
      {page==="profile"&&user&&<Profile user={user} games={games} my={my} bl={bl} onUnblock={unblock} onClose={closeG} onDelete={delG} onLogout={()=>{setUser(null);setPage("lobby")}} onOpen={setDtl}/>}
    </div>

    {toast&&<div style={{ position:"fixed", bottom:16, left:"50%", transform:"translateX(-50%)", background:C.acc, color:"#0a0b10", padding:"9px 20px", borderRadius:8, fontSize:12, fontWeight:700, zIndex:300, boxShadow:"0 6px 28px rgba(232,168,56,0.35)" }}>{toast}</div>}
  </div>;
}
