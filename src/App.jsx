import { useState, useMemo, useEffect } from "react";
const HS = "'Hind Siliguri', sans-serif";
const LOGO_SRC = "data:image/png;base64,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";

/* ── Theme ─────────────────────────────────────────────────────────── */
function mkT(dark) {
  return {
    bg:      dark?"#0a0d14":"#f0f2f5",
    surface: dark?"#13172a":"#ffffff",
    sur2:    dark?"#1c2238":"#f5f7fa",
    sur3:    dark?"#242840":"#eef0f4",
    border:  dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",
    text:    dark?"#eef0f6":"#0d1117",
    textS:   dark?"#8892b0":"#4a5568",
    textM:   dark?"#4a5568":"#a0aec0",
    green:   dark?"#00e676":"#00875a",
    greenBg: dark?"rgba(0,230,118,0.1)":"#e3fcef",
    greenBr: dark?"rgba(0,230,118,0.25)":"rgba(0,135,90,0.3)",
    gold:    "#f5a623",
    red:     dark?"#ff5252":"#e53e3e",
    hdr:     dark?"linear-gradient(135deg,#0d1117,#1a1f35)":"linear-gradient(135deg,#00875a,#006644)",
    glow:    dark?"0 4px 20px rgba(0,0,0,0.3)":"0 2px 12px rgba(0,0,0,0.06)",
    cdone:   dark?"#1c2238":"#eee",
    ct:      dark?"#4a5568":"#888",
  };
}

/* ── Logo ──────────────────────────────────────────────────────────── */
function WCLogo({ size=40, dark }) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",overflow:"hidden",flexShrink:0,
      border:`2px solid ${dark?"rgba(0,230,118,0.3)":"rgba(255,255,255,0.5)"}`,
      background:"rgba(0,0,0,0.2)"}}>
      <img src={LOGO_SRC} alt="" style={{width:"100%",height:"100%",objectFit:"cover",
        filter:dark?"brightness(1.4)":"brightness(1.1)"}}/>
    </div>
  );
}

/* ── Flags ─────────────────────────────────────────────────────────── */
const FE={
  "Argentina":"🇦🇷","Brazil":"🇧🇷","France":"🇫🇷","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Spain":"🇪🇸",
  "Portugal":"🇵🇹","Germany":"🇩🇪","Netherlands":"🇳🇱","Morocco":"🇲🇦","Japan":"🇯🇵",
  "USA":"🇺🇸","Canada":"🇨🇦","Mexico":"🇲🇽","Colombia":"🇨🇴","Senegal":"🇸🇳",
  "Croatia":"🇭🇷","Switzerland":"🇨🇭","Uruguay":"🇺🇾","Belgium":"🇧🇪","South Korea":"🇰🇷",
  "Australia":"🇦🇺","Turkey":"🇹🇷","Iran":"🇮🇷","Sweden":"🇸🇪","Norway":"🇳🇴",
  "Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Bosnia":"🇧🇦","Paraguay":"🇵🇾","Ecuador":"🇪🇨","Ghana":"🇬🇭",
  "Panama":"🇵🇦","Egypt":"🇪🇬","Cape Verde":"🇨🇻","Saudi Arabia":"🇸🇦","South Africa":"🇿🇦",
  "Haiti":"🇭🇹","Czechia":"🇨🇿","Qatar":"🇶🇦","Iraq":"🇮🇶","Algeria":"🇩🇿","Austria":"🇦🇹",
  "Jordan":"🇯🇴","DR Congo":"🇨🇩","Uzbekistan":"🇺🇿","Ivory Coast":"🇨🇮","Curacao":"🇨🇼",
  "Tunisia":"🇹🇳","New Zealand":"🇳🇿",
};
const BTW="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/";
const FU={};
Object.entries(FE).forEach(([t,e])=>{
  const c=[];for(const ch of e){const p=ch.codePointAt(0);if(p!==0xFE0F)c.push(p.toString(16));}
  FU[t]=BTW+c.join("-")+".svg";
});

function Flag({en,size=34}){
  const[ok,setOk]=useState(false);
  const[err,setErr]=useState(false);
  return(
    <div style={{width:size,height:size,borderRadius:"50%",overflow:"hidden",flexShrink:0,
      border:"1.5px solid rgba(128,128,128,0.2)",background:"rgba(128,128,128,0.1)",
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      {FU[en]&&!err&&<img src={FU[en]} alt={en} onLoad={()=>setOk(true)} onError={()=>setErr(true)}
        style={{width:"120%",height:"120%",objectFit:"cover",display:ok?"block":"none"}}/>}
      {(!ok||err)&&<span style={{fontSize:size*0.55,lineHeight:1,fontFamily:"Apple Color Emoji,Segoe UI Emoji,sans-serif"}}>{FE[en]||"🏳️"}</span>}
    </div>
  );
}

/* ── Teams ─────────────────────────────────────────────────────────── */
const TEAMS={
  "Argentina":{bn:"আর্জেন্টিনা",pop:true},"Brazil":{bn:"ব্রাজিল",pop:true},
  "France":{bn:"ফ্রান্স",pop:true},"England":{bn:"ইংল্যান্ড",pop:true},
  "Spain":{bn:"স্পেন",pop:true},"Portugal":{bn:"পর্তুগাল",pop:true},
  "Germany":{bn:"জার্মানি",pop:true},"Netherlands":{bn:"নেদারল্যান্ডস",pop:true},
  "Morocco":{bn:"মরক্কো",pop:true},"Japan":{bn:"জাপান",pop:true},
  "USA":{bn:"যুক্তরাষ্ট্র",pop:false},"Canada":{bn:"কানাডা",pop:false},
  "Mexico":{bn:"মেক্সিকো",pop:false},"Colombia":{bn:"কলম্বিয়া",pop:false},
  "Senegal":{bn:"সেনেগাল",pop:false},"Croatia":{bn:"ক্রোয়েশিয়া",pop:false},
  "Switzerland":{bn:"সুইজারল্যান্ড",pop:false},"Uruguay":{bn:"উরুগুয়ে",pop:false},
  "Belgium":{bn:"বেলজিয়াম",pop:false},"South Korea":{bn:"দক্ষিণ কোরিয়া",pop:false},
  "Australia":{bn:"অস্ট্রেলিয়া",pop:false},"Turkey":{bn:"তুরস্ক",pop:false},
  "Iran":{bn:"ইরান",pop:false},"Sweden":{bn:"সুইডেন",pop:false},
  "Norway":{bn:"নরওয়ে",pop:false},"Scotland":{bn:"স্কটল্যান্ড",pop:false},
  "Bosnia":{bn:"বসনিয়া",pop:false},"Paraguay":{bn:"প্যারাগুয়ে",pop:false},
  "Ecuador":{bn:"ইকুয়েডর",pop:false},"Ghana":{bn:"ঘানা",pop:false},
  "Panama":{bn:"পানামা",pop:false},"Egypt":{bn:"মিশর",pop:false},
  "Cape Verde":{bn:"কেপ ভার্দে",pop:false},"Saudi Arabia":{bn:"সৌদি আরব",pop:false},
  "South Africa":{bn:"দক্ষিণ আফ্রিকা",pop:false},"Haiti":{bn:"হাইতি",pop:false},
  "Czechia":{bn:"চেকিয়া",pop:false},"Qatar":{bn:"কাতার",pop:false},
  "Iraq":{bn:"ইরাক",pop:false},"Algeria":{bn:"আলজেরিয়া",pop:false},
  "Austria":{bn:"অস্ট্রিয়া",pop:false},"Jordan":{bn:"জর্ডান",pop:false},
  "DR Congo":{bn:"DR কঙ্গো",pop:false},"Uzbekistan":{bn:"উজবেকিস্তান",pop:false},
  "Ivory Coast":{bn:"আইভোরি কোস্ট",pop:false},"Curacao":{bn:"কুরাসাও",pop:false},
  "Tunisia":{bn:"তিউনিসিয়া",pop:false},"New Zealand":{bn:"নিউজিল্যান্ড",pop:false},
};
const AT=Object.keys(TEAMS);
const tn=(en,lang)=>lang==="bn"?(TEAMS[en]?.bn||en):en;

/* ── Matches ───────────────────────────────────────────────────────── */
const MATCHES=[
  {id:1,h:"Mexico",a:"South Africa",g:"A",d:"2026-06-12",t:"1:00 AM"},
  {id:2,h:"South Korea",a:"Czechia",g:"A",d:"2026-06-12",t:"8:00 AM"},
  {id:3,h:"Canada",a:"Bosnia",g:"B",d:"2026-06-13",t:"1:00 AM"},
  {id:4,h:"USA",a:"Paraguay",g:"D",d:"2026-06-13",t:"7:00 AM"},
  {id:5,h:"Qatar",a:"Switzerland",g:"B",d:"2026-06-14",t:"1:00 AM"},
  {id:6,h:"Brazil",a:"Morocco",g:"C",d:"2026-06-14",t:"4:00 AM"},
  {id:7,h:"Haiti",a:"Scotland",g:"C",d:"2026-06-14",t:"7:00 AM"},
  {id:8,h:"Australia",a:"Turkey",g:"D",d:"2026-06-14",t:"10:00 AM"},
  {id:9,h:"Germany",a:"Curacao",g:"E",d:"2026-06-14",t:"11:00 PM"},
  {id:10,h:"Netherlands",a:"Japan",g:"F",d:"2026-06-15",t:"2:00 AM"},
  {id:11,h:"Ivory Coast",a:"Ecuador",g:"E",d:"2026-06-15",t:"5:00 AM"},
  {id:12,h:"Sweden",a:"Tunisia",g:"F",d:"2026-06-15",t:"8:00 AM"},
  {id:13,h:"Spain",a:"Cape Verde",g:"H",d:"2026-06-15",t:"10:00 PM"},
  {id:14,h:"Belgium",a:"Egypt",g:"G",d:"2026-06-16",t:"1:00 AM"},
  {id:15,h:"Saudi Arabia",a:"Uruguay",g:"H",d:"2026-06-16",t:"4:00 AM"},
  {id:16,h:"Iran",a:"New Zealand",g:"G",d:"2026-06-16",t:"7:00 AM"},
  {id:17,h:"France",a:"Senegal",g:"I",d:"2026-06-17",t:"1:00 AM"},
  {id:18,h:"Iraq",a:"Norway",g:"I",d:"2026-06-17",t:"4:00 AM"},
  {id:19,h:"Argentina",a:"Algeria",g:"J",d:"2026-06-17",t:"7:00 AM"},
  {id:20,h:"Austria",a:"Jordan",g:"J",d:"2026-06-17",t:"10:00 AM"},
  {id:21,h:"Portugal",a:"DR Congo",g:"K",d:"2026-06-17",t:"11:00 PM"},
  {id:22,h:"England",a:"Croatia",g:"L",d:"2026-06-18",t:"2:00 AM"},
  {id:23,h:"Ghana",a:"Panama",g:"L",d:"2026-06-18",t:"5:00 AM"},
  {id:24,h:"Uzbekistan",a:"Colombia",g:"K",d:"2026-06-18",t:"8:00 AM"},
  {id:25,h:"Czechia",a:"South Africa",g:"A",d:"2026-06-18",t:"10:00 PM"},
  {id:26,h:"Switzerland",a:"Bosnia",g:"B",d:"2026-06-19",t:"1:00 AM"},
  {id:27,h:"Canada",a:"Qatar",g:"B",d:"2026-06-19",t:"4:00 AM"},
  {id:28,h:"Mexico",a:"South Korea",g:"A",d:"2026-06-19",t:"7:00 AM"},
  {id:29,h:"USA",a:"Australia",g:"D",d:"2026-06-20",t:"1:00 AM"},
  {id:30,h:"Scotland",a:"Morocco",g:"C",d:"2026-06-20",t:"4:00 AM"},
  {id:31,h:"Brazil",a:"Haiti",g:"C",d:"2026-06-20",t:"7:00 AM"},
  {id:32,h:"Turkey",a:"Paraguay",g:"D",d:"2026-06-20",t:"10:00 AM"},
  {id:33,h:"Netherlands",a:"Sweden",g:"F",d:"2026-06-20",t:"11:00 PM"},
  {id:34,h:"Germany",a:"Ivory Coast",g:"E",d:"2026-06-21",t:"2:00 AM"},
  {id:35,h:"Ecuador",a:"Curacao",g:"E",d:"2026-06-21",t:"6:00 AM"},
  {id:36,h:"Tunisia",a:"Japan",g:"F",d:"2026-06-21",t:"10:00 AM"},
  {id:37,h:"Spain",a:"Saudi Arabia",g:"H",d:"2026-06-21",t:"10:00 PM"},
  {id:38,h:"Belgium",a:"Iran",g:"G",d:"2026-06-22",t:"1:00 AM"},
  {id:39,h:"Uruguay",a:"Cape Verde",g:"H",d:"2026-06-22",t:"4:00 AM"},
  {id:40,h:"New Zealand",a:"Egypt",g:"G",d:"2026-06-22",t:"7:00 AM"},
  {id:41,h:"Argentina",a:"Austria",g:"J",d:"2026-06-22",t:"11:00 PM"},
  {id:42,h:"France",a:"Iraq",g:"I",d:"2026-06-23",t:"3:00 AM"},
  {id:43,h:"Norway",a:"Senegal",g:"I",d:"2026-06-23",t:"6:00 AM"},
  {id:44,h:"Jordan",a:"Algeria",g:"J",d:"2026-06-23",t:"9:00 AM"},
  {id:45,h:"Portugal",a:"Uzbekistan",g:"K",d:"2026-06-23",t:"11:00 PM"},
  {id:46,h:"England",a:"Ghana",g:"L",d:"2026-06-24",t:"2:00 AM"},
  {id:47,h:"Panama",a:"Croatia",g:"L",d:"2026-06-24",t:"5:00 AM"},
  {id:48,h:"Colombia",a:"DR Congo",g:"K",d:"2026-06-24",t:"8:00 AM"},
  {id:49,h:"Switzerland",a:"Canada",g:"B",d:"2026-06-25",t:"1:00 AM"},
  {id:50,h:"Bosnia",a:"Qatar",g:"B",d:"2026-06-25",t:"1:00 AM"},
  {id:51,h:"Scotland",a:"Brazil",g:"C",d:"2026-06-25",t:"4:00 AM"},
  {id:52,h:"Morocco",a:"Haiti",g:"C",d:"2026-06-25",t:"4:00 AM"},
  {id:53,h:"Czechia",a:"Mexico",g:"A",d:"2026-06-25",t:"7:00 AM"},
  {id:54,h:"South Africa",a:"South Korea",g:"A",d:"2026-06-25",t:"7:00 AM"},
  {id:55,h:"Curacao",a:"Ivory Coast",g:"E",d:"2026-06-26",t:"2:00 AM"},
  {id:56,h:"Ecuador",a:"Germany",g:"E",d:"2026-06-26",t:"2:00 AM"},
  {id:57,h:"Japan",a:"Sweden",g:"F",d:"2026-06-26",t:"5:00 AM"},
  {id:58,h:"Tunisia",a:"Netherlands",g:"F",d:"2026-06-26",t:"5:00 AM"},
  {id:59,h:"Turkey",a:"USA",g:"D",d:"2026-06-26",t:"8:00 AM"},
  {id:60,h:"Paraguay",a:"Australia",g:"D",d:"2026-06-26",t:"8:00 AM"},
  {id:61,h:"Norway",a:"France",g:"I",d:"2026-06-27",t:"1:00 AM"},
  {id:62,h:"Senegal",a:"Iraq",g:"I",d:"2026-06-27",t:"1:00 AM"},
  {id:63,h:"Cape Verde",a:"Saudi Arabia",g:"H",d:"2026-06-27",t:"6:00 AM"},
  {id:64,h:"Uruguay",a:"Spain",g:"H",d:"2026-06-27",t:"6:00 AM"},
  {id:65,h:"Egypt",a:"Iran",g:"G",d:"2026-06-27",t:"9:00 AM"},
  {id:66,h:"New Zealand",a:"Belgium",g:"G",d:"2026-06-27",t:"9:00 AM"},
  {id:67,h:"Panama",a:"England",g:"L",d:"2026-06-28",t:"3:00 AM"},
  {id:68,h:"Croatia",a:"Ghana",g:"L",d:"2026-06-28",t:"3:00 AM"},
  {id:69,h:"Colombia",a:"Portugal",g:"K",d:"2026-06-28",t:"5:30 AM"},
  {id:70,h:"DR Congo",a:"Uzbekistan",g:"K",d:"2026-06-28",t:"5:30 AM"},
  {id:71,h:"Algeria",a:"Austria",g:"J",d:"2026-06-28",t:"8:00 AM"},
  {id:72,h:"Jordan",a:"Argentina",g:"J",d:"2026-06-28",t:"8:00 AM"},
];

function tSort(m){
  const[tm,ap]=m.t.split(" ");const[h,mn]=tm.split(":").map(Number);
  let h2=h;if(ap==="PM"&&h!==12)h2+=12;if(ap==="AM"&&h===12)h2=0;
  return new Date(`${m.d}T${String(h2).padStart(2,"0")}:${String(mn).padStart(2,"0")}`);
}
const SORTED=[...MATCHES].sort((a,b)=>tSort(a)-tSort(b));

/* ── Knockout schedule ─────────────────────────────────────────────── */
const GRP={
  A:["Mexico","South Africa","South Korea","Czechia"],
  B:["Canada","Bosnia","Qatar","Switzerland"],
  C:["Brazil","Morocco","Haiti","Scotland"],
  D:["USA","Paraguay","Australia","Turkey"],
  E:["Germany","Curacao","Ivory Coast","Ecuador"],
  F:["Netherlands","Japan","Sweden","Tunisia"],
  G:["Belgium","Egypt","Iran","New Zealand"],
  H:["Spain","Cape Verde","Saudi Arabia","Uruguay"],
  I:["France","Senegal","Iraq","Norway"],
  J:["Argentina","Algeria","Austria","Jordan"],
  K:["Portugal","DR Congo","Uzbekistan","Colombia"],
  L:["England","Croatia","Ghana","Panama"],
};

const R32=[
  {id:73,h:"2A",    a:"2B",     d:"2026-06-29",t:"1:00 AM",  venue:"Los Angeles Stadium"},
  {id:74,h:"1C",    a:"2F",     d:"2026-06-29",t:"11:00 PM", venue:"Houston Stadium"},
  {id:75,h:"1E",    a:"3ABCDF", d:"2026-06-30",t:"2:30 AM",  venue:"Boston Stadium"},
  {id:76,h:"1F",    a:"2C",     d:"2026-06-30",t:"7:00 AM",  venue:"Monterrey Stadium"},
  {id:77,h:"2E",    a:"2I",     d:"2026-06-30",t:"11:00 PM", venue:"Dallas Stadium"},
  {id:78,h:"1I",    a:"3CDFGH", d:"2026-07-01",t:"3:00 AM",  venue:"New York NJ Stadium"},
  {id:79,h:"1A",    a:"3CEFHI", d:"2026-07-01",t:"7:00 AM",  venue:"Mexico City Stadium"},
  {id:80,h:"1L",    a:"3EHIJK", d:"2026-07-01",t:"10:00 PM", venue:"Atlanta Stadium"},
  {id:81,h:"1G",    a:"3AEHIJ", d:"2026-07-02",t:"2:00 AM",  venue:"Seattle Stadium"},
  {id:82,h:"1D",    a:"3BEFIJ", d:"2026-07-02",t:"6:00 AM",  venue:"San Francisco Bay Area Stadium"},
  {id:83,h:"1H",    a:"2J",     d:"2026-07-03",t:"1:00 AM",  venue:"Los Angeles Stadium"},
  {id:84,h:"2K",    a:"2L",     d:"2026-07-03",t:"5:00 AM",  venue:"Toronto Stadium"},
  {id:85,h:"1B",    a:"3EFGIJ", d:"2026-07-03",t:"9:00 AM",  venue:"BC Place Vancouver"},
  {id:86,h:"1J",    a:"2H",     d:"2026-07-04",t:"4:00 AM",  venue:"Miami Stadium"},
  {id:87,h:"2D",    a:"2G",     d:"2026-07-04",t:"12:00 AM", venue:"Dallas Stadium"},
  {id:88,h:"1K",    a:"3DEIJL", d:"2026-07-04",t:"7:30 AM",  venue:"Kansas City Stadium"},
];
const R16=[
  {id:89,h:"2A/2B",    a:"1F/2C",     d:"2026-07-04",t:"11:00 PM",venue:"Houston Stadium"},
  {id:90,h:"1E/3ABCDF",a:"1I/3CDFGH", d:"2026-07-05",t:"3:00 AM", venue:"Philadelphia Stadium"},
  {id:91,h:"1C/2F",    a:"2E/2I",     d:"2026-07-06",t:"2:00 AM", venue:"New York New Jersey Stadium"},
  {id:92,h:"1A/3CEFHI",a:"1L/3EHIJK", d:"2026-07-06",t:"6:00 AM", venue:"Mexico City Stadium"},
  {id:93,h:"2K/2L",    a:"1H/2J",     d:"2026-07-07",t:"1:00 AM", venue:"Dallas Stadium"},
  {id:94,h:"1D/3BEFIJ",a:"1G/3AEHIJ", d:"2026-07-07",t:"6:00 AM", venue:"Seattle Stadium"},
  {id:95,h:"1J/2H",    a:"2D/2G",     d:"2026-07-07",t:"10:00 PM",venue:"Atlanta Stadium"},
  {id:96,h:"1B/3EFGIJ",a:"1K/3DEIJL", d:"2026-07-08",t:"2:00 AM", venue:"BC Place Vancouver"},
];
const QF=[
  {id:97, h:"W EF1",a:"W EF2",d:"2026-07-10",t:"2:00 AM",  venue:"Boston Stadium"},
  {id:98, h:"W EF5",a:"W EF6",d:"2026-07-11",t:"1:00 AM",  venue:"Los Angeles Stadium"},
  {id:99, h:"W EF3",a:"W EF4",d:"2026-07-12",t:"3:00 AM",  venue:"Miami Stadium"},
  {id:100,h:"W EF7",a:"W EF8",d:"2026-07-12",t:"7:00 AM",  venue:"Kansas City Stadium"},
];
const SF=[
  {id:101,h:"W QF1",a:"W QF2",d:"2026-07-15",t:"1:00 AM",venue:"Dallas Stadium"},
  {id:102,h:"W QF3",a:"W QF4",d:"2026-07-16",t:"1:00 AM",venue:"Atlanta Stadium"},
];
const FINAL=[
  {id:103,h:"Loser SF 1",a:"Loser SF 2",d:"2026-07-19",t:"3:00 AM", venue:"Miami Stadium",              label:"🥉 Bronze Final"},
  {id:104,h:"Winner SF 1",a:"Winner SF 2",d:"2026-07-20",t:"1:00 AM",venue:"New York New Jersey Stadium",label:"🏆 Final"},
];

/* ── Date helpers ──────────────────────────────────────────────────── */
const END=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const BND=["রোববার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"];
const ENM=["January","February","March","April","May","June","July","August","September","October","November","December"];
const BNM=["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

function dl(d,lang){
  const dt=new Date(d+"T00:00:00");
  return lang==="en"
    ?`${END[dt.getDay()]}, ${ENM[dt.getMonth()]} ${dt.getDate()}`
    :`${BND[dt.getDay()]}, ${dt.getDate()} ${BNM[dt.getMonth()]}`;
}
function dL(d){const t=new Date();t.setHours(0,0,0,0);return Math.round((new Date(d+"T00:00:00")-t)/86400000);}

function Chip({d,lang,T}){
  const n=dL(d);
  const s={fontFamily:HS,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:500};
  if(n<0)  return <span style={{...s,background:T.cdone,color:T.ct}}>{lang==="bn"?"শেষ":"Done"}</span>;
  if(n===0)return <span style={{...s,background:T.greenBg,color:T.green,fontWeight:700}}>{lang==="bn"?"আজ!":"Today!"}</span>;
  if(n===1)return <span style={{...s,background:"#fff3cc",color:"#7a5500"}}>{lang==="bn"?"আগামীকাল":"Tomorrow"}</span>;
  return <span style={{...s,background:"#fff5e0",color:"#b06800"}}>{lang==="bn"?`${n} দিন পর`:`In ${n} days`}</span>;
}

function getStatus(m){
  const now=new Date(),start=tSort(m),end=new Date(start.getTime()+2*60*60*1000);
  if(now<start)return "up";if(now<=end)return "live";return "ft";
}

function useCountdown(targetMs){
  const[diff,setDiff]=useState(Math.max(0,(targetMs||0)-Date.now()));
  useEffect(()=>{
    if(!targetMs)return;
    const id=setInterval(()=>setDiff(Math.max(0,targetMs-Date.now())),1000);
    return()=>clearInterval(id);
  },[targetMs]);
  const s=Math.floor(diff/1000),m=Math.floor(s/60),h=Math.floor(m/60);
  return{days:Math.floor(h/24),hours:h%24,mins:m%60,secs:s%60,done:diff===0};
}

/* ── Standings ─────────────────────────────────────────────────────── */
function calcStandings(teams,scores){
  const st={};teams.forEach(t=>{st[t]={mp:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};});
  MATCHES.forEach(m=>{
    if(!teams.includes(m.h))return;
    const sc=scores[m.id];
    if(!sc||sc.hg===""||sc.ag==="")return;
    const hg=parseInt(sc.hg),ag=parseInt(sc.ag);
    if(isNaN(hg)||isNaN(ag))return;
    st[m.h].mp++;st[m.a].mp++;
    st[m.h].gf+=hg;st[m.h].ga+=ag;
    st[m.a].gf+=ag;st[m.a].ga+=hg;
    if(hg>ag){st[m.h].w++;st[m.h].pts+=3;st[m.a].l++;}
    else if(hg<ag){st[m.a].w++;st[m.a].pts+=3;st[m.h].l++;}
    else{st[m.h].d++;st[m.h].pts++;st[m.a].d++;st[m.a].pts++;}
  });
  return Object.entries(st).map(([en,s])=>({en,...s,gd:s.gf-s.ga}))
    .sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
}

/* ── Calendar & Share ──────────────────────────────────────────────── */
function addToGCal(m,lang){
  const[tm,ap]=m.t.split(" ");const[h,mn]=tm.split(":").map(Number);
  let h24=h;if(ap==="PM"&&h!==12)h24+=12;if(ap==="AM"&&h===12)h24=0;
  const utcH=h24-6;
  const start=new Date(`${m.d}T00:00:00Z`);
  start.setUTCHours(utcH<0?utcH+24:utcH);start.setUTCMinutes(mn);
  if(utcH<0)start.setUTCDate(start.getUTCDate()-1);
  const end=new Date(start.getTime()+2*60*60*1000);
  const fmt=dt=>dt.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const title=lang==="bn"?`⚽ ${tn(m.h,lang)} বনাম ${tn(m.a,lang)}`:`⚽ ${m.h} vs ${m.a}`;
  window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}`,"_blank");
}
function shareMatch(m,lang){
  const text=lang==="bn"
    ?`⚽ ${tn(m.h,lang)} বনাম ${tn(m.a,lang)}\n📅 ${dl(m.d,lang)}\n🕐 ${m.t} (বাংলাদেশ সময়)\nগ্রুপ ${m.g}`
    :`⚽ ${m.h} vs ${m.a}\n📅 ${dl(m.d,lang)}\n🕐 ${m.t} BST\nGroup ${m.g}`;
  if(navigator.share)navigator.share({text}).catch(()=>{});
  else{navigator.clipboard?.writeText(text);alert(lang==="bn"?"কপি হয়েছে!":"Copied!");}
}

/* ── ScoreModal ────────────────────────────────────────────────────── */
function ScoreModal({m,lang,T,scores,setScores,onClose}){
  const sc=scores[m.id]||{hg:"",ag:""};
  const[hg,setHg]=useState(sc.hg);
  const[ag,setAg]=useState(sc.ag);
  const save=()=>{setScores(s=>({...s,[m.id]:{hg,ag}}));onClose();};
  const clear=()=>{setScores(s=>{const n={...s};delete n[m.id];return n;});onClose();};
  const inp={width:54,height:50,textAlign:"center",fontSize:22,fontWeight:800,
    border:`2px solid ${T.border}`,borderRadius:12,background:T.sur2,color:T.text,outline:"none",fontFamily:HS};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:999,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:T.surface,borderRadius:20,padding:28,width:"100%",maxWidth:320}} onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:HS,fontWeight:700,fontSize:17,color:T.text,textAlign:"center",marginBottom:4}}>
          {lang==="bn"?"স্কোর এন্ট্রি":"Score Entry"}
        </div>
        <div style={{fontFamily:HS,fontSize:12,color:T.textM,textAlign:"center",marginBottom:20}}>
          {tn(m.h,lang)} vs {tn(m.a,lang)}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:24}}>
          <div style={{textAlign:"center"}}>
            <Flag en={m.h} size={40}/>
            <div style={{fontFamily:HS,fontSize:11,color:T.textS,margin:"6px 0"}}>{tn(m.h,lang)}</div>
            <input value={hg} onChange={e=>setHg(e.target.value)} style={inp} placeholder="0" maxLength={2}/>
          </div>
          <div style={{fontFamily:HS,fontSize:24,fontWeight:700,color:T.textM,paddingTop:24}}>–</div>
          <div style={{textAlign:"center"}}>
            <Flag en={m.a} size={40}/>
            <div style={{fontFamily:HS,fontSize:11,color:T.textS,margin:"6px 0"}}>{tn(m.a,lang)}</div>
            <input value={ag} onChange={e=>setAg(e.target.value)} style={inp} placeholder="0" maxLength={2}/>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={clear} style={{flex:1,padding:11,borderRadius:12,border:`1px solid ${T.border}`,
            background:T.sur2,color:T.textS,fontFamily:HS,fontSize:13,cursor:"pointer"}}>
            {lang==="bn"?"মুছুন":"Clear"}
          </button>
          <button onClick={save} style={{flex:2,padding:11,borderRadius:12,border:"none",
            background:T.green,color:"#fff",fontFamily:HS,fontSize:14,fontWeight:700,cursor:"pointer"}}>
            {lang==="bn"?"সংরক্ষণ":"Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── FixRow ────────────────────────────────────────────────────────── */
function FixRow({m,lang,onTeam,T,scores,setScores}){
  const[showScore,setShowScore]=useState(false);
  const[showAct,setShowAct]=useState(false);
  const sc=scores[m.id];const hasScore=sc&&sc.hg!==""&&sc.ag!=="";
  const status=getStatus(m);const[tn2,ap]=m.t.split(" ");
  return(
    <>
      <div style={{borderBottom:`1px solid ${T.border}`,background:T.surface,
        borderLeft:`3px solid ${hasScore?T.green:status==="live"?T.red:"transparent"}`}}>
        <div style={{display:"flex",alignItems:"center",padding:"11px 10px",gap:4}}>
          <div onClick={()=>onTeam(m.h)} style={{flex:1,display:"flex",alignItems:"center",
            justifyContent:"flex-end",gap:6,cursor:"pointer",minWidth:0}}>
            <span style={{fontFamily:HS,fontSize:13,fontWeight:500,color:T.text,
              textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {tn(m.h,lang)}
            </span>
            <Flag en={m.h} size={30}/>
          </div>
          <div style={{width:72,textAlign:"center",flexShrink:0,cursor:"pointer"}} onClick={()=>setShowScore(true)}>
            {hasScore?(
              <div style={{background:T.greenBg,borderRadius:8,padding:"3px 6px",border:`1px solid ${T.greenBr}`}}>
                <span style={{fontFamily:HS,fontSize:15,fontWeight:800,color:T.green}}>{sc.hg}–{sc.ag}</span>
              </div>
            ):(
              <div>
                <span style={{fontFamily:HS,fontSize:14,fontWeight:700,color:status==="live"?T.red:T.text}}>{tn2}</span>
                <span style={{fontFamily:HS,fontSize:8,color:T.textM}}>{ap}</span>
                <div style={{fontFamily:HS,fontSize:9,color:T.textM}}>Grp {m.g}</div>
              </div>
            )}
          </div>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:6,minWidth:0}}>
            <Flag en={m.a} size={30}/>
            <span onClick={()=>onTeam(m.a)} style={{fontFamily:HS,fontSize:13,fontWeight:500,color:T.text,
              cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {tn(m.a,lang)}
            </span>
          </div>
          <button onClick={()=>setShowAct(v=>!v)}
            style={{background:"transparent",border:"none",color:T.textM,fontSize:18,cursor:"pointer",padding:"0 2px",flexShrink:0}}>
            ⋯
          </button>
        </div>
        {showAct&&(
          <div style={{display:"flex",gap:8,padding:"8px 10px 10px",borderTop:`1px solid ${T.border}`,background:T.sur2}}>
            <button onClick={()=>{setShowScore(true);setShowAct(false);}}
              style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,
                background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:7,
                cursor:"pointer",fontFamily:HS,fontSize:12,color:T.textS}}>
              ✏️ <span style={{fontFamily:HS}}>{lang==="bn"?"স্কোর":"Score"}</span>
            </button>
            <button onClick={()=>{addToGCal(m,lang);setShowAct(false);}}
              style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,
                background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:7,
                cursor:"pointer",fontFamily:HS,fontSize:12,color:T.textS}}>
              📅 <span style={{fontFamily:HS}}>{lang==="bn"?"ক্যালেন্ডার":"Calendar"}</span>
            </button>
            <button onClick={()=>{shareMatch(m,lang);setShowAct(false);}}
              style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,
                background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:7,
                cursor:"pointer",fontFamily:HS,fontSize:12,color:T.textS}}>
              🔗 <span style={{fontFamily:HS}}>{lang==="bn"?"শেয়ার":"Share"}</span>
            </button>
          </div>
        )}
      </div>
      {showScore&&<ScoreModal m={m} lang={lang} T={T} scores={scores} setScores={setScores} onClose={()=>setShowScore(false)}/>}
    </>
  );
}

/* ── GroupTab ──────────────────────────────────────────────────────── */
function GroupTab({lang,onTeam,T,scores,setScores}){
  const[ft,setFt]=useState(null);const[sf,setSf]=useState(false);const[sq,setSq]=useState("");
  const fil=ft?SORTED.filter(m=>m.h===ft||m.a===ft):SORTED;
  const grpd=useMemo(()=>{
    const mp={};fil.forEach(m=>{(mp[m.d]=mp[m.d]||[]).push(m);});
    return Object.entries(mp).sort((a,b)=>new Date(a[0])-new Date(b[0]));
  },[fil]);
  const sr=AT.filter(en=>en.toLowerCase().includes(sq.toLowerCase())||(TEAMS[en]?.bn||"").includes(sq));

  return(
    <div>
      <div style={{background:T.surface,padding:"10px 12px 0",borderBottom:`1px solid ${T.border}`}}>

        <div style={{display:"flex",gap:8,paddingBottom:10}}>
          <button onClick={()=>{setSf(true);setSq("");}} style={{display:"flex",alignItems:"center",gap:6,
            background:ft?T.greenBg:T.sur2,border:`1.5px solid ${ft?T.greenBr:T.border}`,
            borderRadius:20,padding:"6px 14px",cursor:"pointer",fontFamily:HS,fontSize:13,
            fontWeight:ft?700:400,color:ft?T.green:T.textS}}>
            {ft?<><Flag en={ft} size={18}/><span style={{fontFamily:HS}}>{tn(ft,lang)}</span></>
              :<span style={{fontFamily:HS}}>{lang==="bn"?"▾ দল বেছে নিন":"▾ Filter"}</span>}
          </button>
          {ft&&<button onClick={()=>setFt(null)} style={{background:"transparent",border:`1px solid ${T.border}`,
            borderRadius:20,padding:"6px 12px",cursor:"pointer",fontFamily:HS,fontSize:12,color:T.textM}}>
            {lang==="bn"?"✕ সব":"✕ All"}
          </button>}
        </div>
      </div>
      <div style={{paddingBottom:80}}>
        {grpd.map(([date,ms])=>(
          <div key={date}>
            <div style={{fontFamily:HS,fontWeight:700,fontSize:13,color:T.textS,
              background:T.sur2,padding:"8px 14px",borderBottom:`1px solid ${T.border}`}}>
              {dl(date,lang).toUpperCase()}
            </div>
            {ms.map(m=><FixRow key={m.id} m={m} lang={lang} onTeam={onTeam} T={T} scores={scores} setScores={setScores}/>)}
          </div>
        ))}
      </div>
      {sf&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:999,
          display:"flex",alignItems:"flex-end"}} onClick={()=>setSf(false)}>
          <div style={{background:T.surface,borderRadius:"20px 20px 0 0",width:"100%",
            maxHeight:"75vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"14px 14px 10px",borderBottom:`1px solid ${T.border}`}}>
              <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 12px"}}/>
              <input value={sq} onChange={e=>setSq(e.target.value)}
                placeholder={lang==="bn"?"দলের নাম...":"Search team..."}
                style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${T.border}`,
                  borderRadius:12,padding:"10px 14px",fontFamily:HS,fontSize:14,
                  background:T.sur2,color:T.text,outline:"none"}}/>
            </div>
            <div style={{overflowY:"auto",padding:"6px 14px 28px"}}>
              {sr.map(en=>(
                <div key={en} onClick={()=>{setFt(en);setSf(false);}}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px 4px",
                    borderBottom:`1px solid ${T.border}`,cursor:"pointer",
                    background:ft===en?T.greenBg:"transparent"}}>
                  <Flag en={en} size={36}/>
                  <span style={{fontFamily:HS,fontSize:15,color:T.text,fontWeight:ft===en?700:400}}>{tn(en,lang)}</span>
                  {ft===en&&<span style={{marginLeft:"auto",color:T.green,fontSize:18}}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── TableTab ──────────────────────────────────────────────────────── */
function TableTab({lang,T,scores}){
  const th={fontFamily:HS,fontSize:11,fontWeight:700,color:T.textS,padding:"6px 3px",textAlign:"center"};
  const td={fontFamily:HS,fontSize:12,padding:"8px 3px",textAlign:"center",color:T.text};
  return(
    <div style={{paddingBottom:90}}>
      {Object.entries(GRP).map(([g,teams])=>{
        const rows=calcStandings(teams,scores);
        return(
          <div key={g} style={{background:T.surface,marginBottom:8}}>
            <div style={{padding:"10px 14px 6px"}}>
              <span style={{fontFamily:HS,fontWeight:700,fontSize:14,color:T.text}}>
                {lang==="bn"?`গ্রুপ ${g}`:`Grp. ${g}`}
              </span>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  <th style={{...th,textAlign:"left",paddingLeft:10,width:"38%"}}>{lang==="bn"?"দল":"Team"}</th>
                  {["Pl","W","D","L","+/-","GD","Pts"].map(h=><th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={r.en} style={{borderBottom:i<3?`1px solid ${T.border}`:"none"}}>
                    <td style={{...td,textAlign:"left",paddingLeft:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:3,height:34,background:i<2?T.green:i===2?T.gold:"transparent",borderRadius:2,flexShrink:0}}/>
                        <span style={{fontFamily:HS,fontSize:11,color:T.textM,width:14,textAlign:"center"}}>{i+1}</span>
                        <Flag en={r.en} size={22}/>
                        <span style={{fontFamily:HS,fontSize:12,fontWeight:i<2?600:400,color:T.text,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:72}}>
                          {tn(r.en,lang)}
                        </span>
                      </div>
                    </td>
                    {[r.mp,r.w,r.d,r.l,`${r.gf}-${r.ga}`,r.gd,r.pts].map((v,vi)=>(
                      <td key={vi} style={{...td,fontWeight:vi===6?800:400,color:vi===6?T.green:T.text,fontSize:vi===6?13:12}}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

/* ── KO Card components ────────────────────────────────────────────── */
function KOMatchCard({m,hLabel,aLabel,hTeam,aTeam,T,lang,scores}){
  const sc=scores?scores[m.id]:null;
  const hasScore=sc&&sc.hg!==""&&sc.ag!=="";
  const[tn2,ap]=m.t.split(" ");
  return(
    <div style={{background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,
      marginBottom:10,overflow:"hidden",boxShadow:T.glow}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px 6px",
        borderBottom:`1px solid ${T.border}`}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:hTeam?T.green:T.textM,flexShrink:0}}/>
        <span style={{fontFamily:HS,fontSize:12,fontWeight:600,color:T.textS}}>{m.label||m.venue}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",padding:"12px 14px",gap:8}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {hTeam?<Flag en={hTeam} size={26}/>:<div style={{width:26,height:26,borderRadius:"50%",background:T.sur2,border:`1px dashed ${T.border}`,flexShrink:0}}/>}
            {hTeam
              ?<span style={{fontFamily:HS,fontSize:13,fontWeight:600,color:T.text}}>{tn(hTeam,lang)}</span>
              :<span style={{fontFamily:HS,fontSize:11,color:T.textM}}>{hLabel}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {aTeam?<Flag en={aTeam} size={26}/>:<div style={{width:26,height:26,borderRadius:"50%",background:T.sur2,border:`1px dashed ${T.border}`,flexShrink:0}}/>}
            {aTeam
              ?<span style={{fontFamily:HS,fontSize:13,fontWeight:600,color:T.text}}>{tn(aTeam,lang)}</span>
              :<span style={{fontFamily:HS,fontSize:11,color:T.textM}}>{aLabel}</span>}
          </div>
        </div>
        <div style={{textAlign:"center",flexShrink:0,minWidth:76}}>
          {hasScore?(
            <div style={{background:T.greenBg,borderRadius:8,padding:"4px 10px"}}>
              <div style={{fontFamily:HS,fontSize:18,fontWeight:800,color:T.green}}>{sc.hg}</div>
              <div style={{fontFamily:HS,fontSize:18,fontWeight:800,color:T.green}}>{sc.ag}</div>
            </div>
          ):(
            <>
              <div style={{display:"inline-flex",alignItems:"baseline",gap:2,marginBottom:2}}>
                <span style={{fontFamily:HS,fontSize:15,fontWeight:700,color:T.text}}>{tn2}</span>
                <span style={{fontFamily:HS,fontSize:9,color:T.textM}}>{ap}</span>
              </div>
              <div style={{fontFamily:HS,fontSize:10,color:T.textM}}>{dl(m.d,lang)}</div>
              <div style={{display:"flex",justifyContent:"center",gap:4,marginTop:6}}>
                <button onClick={()=>addToGCal({...m,h:hLabel||"?",a:aLabel||"?",g:"KO"},lang)}
                  style={{background:T.sur2,border:`1px solid ${T.border}`,borderRadius:6,
                    width:24,height:24,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>📅</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── KnockoutTab ───────────────────────────────────────────────────── */
function KnockoutTab({lang,T,scores}){
  const[round,setRound]=useState("R32");

  const qualified=useMemo(()=>{
    const q={};
    Object.entries(GRP).forEach(([g,teams])=>{
      const rows=calcStandings(teams,scores);
      const allDone=MATCHES.filter(m=>teams.includes(m.h)).every(m=>{
        const sc=scores[m.id];return sc&&sc.hg!==""&&sc.ag!=="";
      });
      if(allDone){q["1"+g]=rows[0]?.en||null;q["2"+g]=rows[1]?.en||null;}
    });
    return q;
  },[scores]);

  const getTeam=k=>qualified[k]||null;

  const tabs=[
    {k:"R32",l:lang==="bn"?"রাউন্ড অব ৩২":"Round of 32"},
    {k:"R16",l:lang==="bn"?"রাউন্ড অব ১৬":"Round of 16"},
    {k:"QF",l:lang==="bn"?"কোয়ার্টার":"Quarter-final"},
    {k:"SF",l:lang==="bn"?"সেমি":"Semi-final"},
    {k:"F",l:lang==="bn"?"ফাইনাল":"Final"},
  ];

  return(
    <div>
      <div style={{display:"flex",gap:6,padding:"10px 12px",background:T.surface,
        borderBottom:`1px solid ${T.border}`,overflowX:"auto",scrollbarWidth:"none"}}>
        {tabs.map(t=>(
          <button key={t.k} onClick={()=>setRound(t.k)} style={{
            fontFamily:HS,fontSize:12,fontWeight:round===t.k?700:400,
            padding:"6px 14px",borderRadius:20,cursor:"pointer",border:"none",flexShrink:0,
            background:round===t.k?T.green:T.sur2,
            color:round===t.k?"#fff":T.textS,transition:"all 0.2s"}}>
            {t.l}
          </button>
        ))}
      </div>
      <div style={{padding:"12px 12px 90px"}}>
        {round==="R32"&&R32.map(m=>(
          <KOMatchCard key={m.id} m={m}
            hLabel={m.h} aLabel={m.a}
            hTeam={getTeam(m.h)} aTeam={getTeam(m.a)}
            T={T} lang={lang} scores={scores}/>
        ))}
        {round==="R16"&&R16.map(m=>(
          <KOMatchCard key={m.id} m={m} hLabel={m.h||"?"} aLabel={m.a||"?"} hTeam={null} aTeam={null} T={T} lang={lang} scores={scores}/>
        ))}
        {round==="QF"&&QF.map(m=>(
          <KOMatchCard key={m.id} m={m} hLabel={m.h||"?"} aLabel={m.a||"?"} hTeam={null} aTeam={null} T={T} lang={lang} scores={scores}/>
        ))}
        {round==="SF"&&SF.map(m=>(
          <KOMatchCard key={m.id} m={m} hLabel={m.h||"?"} aLabel={m.a||"?"} hTeam={null} aTeam={null} T={T} lang={lang} scores={scores}/>
        ))}
        {round==="F"&&FINAL.map(m=>(
          <KOMatchCard key={m.id} m={m} hLabel={m.h||"?"} aLabel={m.a||"?"} hTeam={null} aTeam={null} T={T} lang={lang} scores={scores}/>
        ))}
      </div>
    </div>
  );
}

/* ── AddModal ──────────────────────────────────────────────────────── */
function AddModal({favs,onAdd,onClose,lang,T}){
  const[q,setQ]=useState("");
  const list=AT.filter(en=>!favs.includes(en)&&(en.toLowerCase().includes(q.toLowerCase())||(TEAMS[en]?.bn||"").includes(q)));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:999,
      display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",width:"100%",
        maxHeight:"72vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 14px 10px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{width:36,height:4,background:T.border,borderRadius:2,margin:"0 auto 12px"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)}
            placeholder={lang==="bn"?"নাম লিখুন...":"Search..."}
            style={{width:"100%",boxSizing:"border-box",border:`1.5px solid ${T.border}`,
              borderRadius:12,padding:"10px 14px",fontFamily:HS,fontSize:14,
              background:T.sur2,color:T.text,outline:"none"}}/>
        </div>
        <div style={{overflowY:"auto",padding:"6px 14px 28px"}}>
          {list.map(en=>(
            <div key={en} onClick={()=>{onAdd(en);onClose();}}
              style={{display:"flex",alignItems:"center",gap:12,padding:"10px 4px",
                borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}>
              <Flag en={en} size={36}/>
              <span style={{fontFamily:HS,fontSize:15,color:T.text}}>{tn(en,lang)}</span>
              <span style={{marginLeft:"auto",color:T.green,fontSize:22,fontWeight:600}}>+</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── TeamPage ──────────────────────────────────────────────────────── */
function TeamCountdown({m,lang,T}){
  const cd=useCountdown(tSort(m).getTime());
  if(cd.done)return null;
  return(
    <div style={{marginTop:14,background:"rgba(255,255,255,0.1)",borderRadius:14,
      padding:"12px 16px",border:"1px solid rgba(255,255,255,0.15)"}}>
      <div style={{fontFamily:HS,fontSize:11,color:"rgba(255,255,255,0.7)",marginBottom:8,textAlign:"center"}}>
        {lang==="bn"?"পরবর্তী ম্যাচ শুরু হতে":"Next match in"}
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:16}}>
        {[{v:cd.days,l:lang==="bn"?"দিন":"Days"},{v:cd.hours,l:lang==="bn"?"ঘণ্টা":"Hrs"},{v:cd.mins,l:lang==="bn"?"মিনিট":"Min"},{v:cd.secs,l:lang==="bn"?"সেকেন্ড":"Sec"}].map(({v,l})=>(
          <div key={l} style={{textAlign:"center"}}>
            <div style={{fontFamily:HS,fontSize:22,fontWeight:800,color:"#fff",lineHeight:1}}>{String(v).padStart(2,"0")}</div>
            <div style={{fontFamily:HS,fontSize:10,color:"rgba(255,255,255,0.6)",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamPage({en,lang,onBack,T,scores,setScores}){
  const[showScore,setShowScore]=useState(null);
  const ms=MATCHES.filter(m=>m.h===en||m.a===en).sort((a,b)=>new Date(a.d)-new Date(b.d));
  const now2=new Date();now2.setHours(0,0,0,0);
  const nextMatch=ms.find(m=>new Date(m.d+"T00:00:00")>=now2&&getStatus(m)==="up")||null;
  return(
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:HS}}>
      <div style={{background:T.hdr,padding:"14px 14px 20px"}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",
          borderRadius:20,padding:"6px 16px",fontSize:13,cursor:"pointer",fontFamily:HS,marginBottom:18}}>
          {lang==="bn"?"← ফিরে যান":"← Back"}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <Flag en={en} size={56}/>
          <div>
            <div style={{fontFamily:HS,fontSize:22,fontWeight:800,color:"#fff"}}>{tn(en,lang)}</div>
            <div style={{fontFamily:HS,fontSize:12,color:"rgba(255,255,255,0.65)",marginTop:3}}>
              {ms.length}{lang==="bn"?"টি গ্রুপ পর্যায়ের ম্যাচ":" group stage matches"}
            </div>
          </div>
        </div>
        {nextMatch&&(
          <TeamCountdown m={nextMatch} lang={lang} T={T}/>
        )}
      </div>
      {ms.map(m=>{
        const[tn2,ap]=m.t.split(" ");
        const sc=scores[m.id];const hasScore=sc&&sc.hg!==""&&sc.ag!=="";
        return(
          <div key={m.id} style={{background:T.surface,marginBottom:6,padding:"14px 16px",
            borderLeft:`4px solid ${hasScore?T.green:"transparent"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontFamily:HS,fontSize:12,color:T.textM}}>{dl(m.d,lang)}</span>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Chip d={m.d} lang={lang} T={T}/>
                <button onClick={()=>addToGCal(m,lang)} style={{background:T.sur2,border:`1px solid ${T.border}`,
                  borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>📅</button>
                <button onClick={()=>shareMatch(m,lang)} style={{background:T.sur2,border:`1px solid ${T.border}`,
                  borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>🔗</button>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Flag en={m.h} size={40}/>
              <span style={{fontFamily:HS,fontSize:14,fontWeight:600,color:T.text,flex:1}}>{tn(m.h,lang)}</span>
              <div onClick={()=>setShowScore(m)} style={{textAlign:"center",minWidth:76,cursor:"pointer"}}>
                {hasScore?(
                  <div style={{background:T.greenBg,borderRadius:10,padding:"6px 12px",border:`1px solid ${T.greenBr}`}}>
                    <span style={{fontFamily:HS,fontSize:20,fontWeight:800,color:T.green}}>{sc.hg}–{sc.ag}</span>
                  </div>
                ):(
                  <>
                    <span style={{fontFamily:HS,fontSize:18,fontWeight:700,color:T.text}}>{tn2}</span>
                    <span style={{fontFamily:HS,fontSize:10,color:T.textM}}>{ap}</span>
                    <div style={{fontFamily:HS,fontSize:9,color:T.textM}}>{lang==="bn"?"বাংলাদেশ সময়":"BST"}</div>
                  </>
                )}
              </div>
              <span style={{fontFamily:HS,fontSize:14,fontWeight:600,color:T.text,flex:1,textAlign:"right"}}>{tn(m.a,lang)}</span>
              <Flag en={m.a} size={40}/>
            </div>
          </div>
        );
      })}
      {showScore&&<ScoreModal m={showScore} lang={lang} T={T} scores={scores} setScores={setScores} onClose={()=>setShowScore(null)}/>}
    </div>
  );
}

/* ── HomeTab ───────────────────────────────────────────────────────── */
function HomeTab({lang,favs,setFavs,onTeam,setSM,T}){
  const pop=AT.filter(en=>TEAMS[en].pop);
  function gN(en){
    const now=new Date();now.setHours(0,0,0,0);
    return SORTED.filter(m=>(m.h===en||m.a===en)&&new Date(m.d+"T00:00:00")>=now)[0]||null;
  }
  function Row({en}){
    const nx=gN(en),iF=favs.includes(en),opp=nx?(nx.h===en?nx.a:nx.h):null;
    const cd=useCountdown(nx?tSort(nx).getTime():null);
    const showCd=nx&&!cd.done&&cd.days<3;
    return(
      <div style={{background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,
        padding:"12px 13px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
        <div onClick={()=>onTeam(en)} style={{display:"flex",alignItems:"center",gap:10,flex:1,cursor:"pointer"}}>
          <Flag en={en} size={44}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:HS,fontSize:15,fontWeight:600,color:T.text}}>{tn(en,lang)}</div>
            {nx?(
              <>
                <div style={{fontFamily:HS,fontSize:12,color:T.textS,marginTop:2}}>
                  {lang==="bn"?"পরবর্তী: ":"Next: "}{tn(opp,lang)}
                </div>
                <div style={{fontFamily:HS,fontSize:12,color:T.textS,marginTop:1}}>
                  📅 {dl(nx.d,lang)} · 🕐 <span style={{color:T.green,fontWeight:600}}>{nx.t}</span>
                </div>
                {showCd&&(
                  <div style={{display:"flex",gap:6,marginTop:5}}>
                    {[{v:cd.days,l:lang==="bn"?"দিন":"d"},{v:cd.hours,l:lang==="bn"?"ঘণ্টা":"h"},{v:cd.mins,l:lang==="bn"?"মিনিট":"m"},{v:cd.secs,l:lang==="bn"?"সেকেন্ড":"s"}].map(({v,l})=>(
                      <div key={l} style={{background:T.sur2,borderRadius:8,padding:"3px 7px",textAlign:"center",border:`1px solid ${T.border}`}}>
                        <div style={{fontFamily:HS,fontSize:14,fontWeight:700,color:T.green,lineHeight:1}}>{String(v).padStart(2,"0")}</div>
                        <div style={{fontFamily:HS,fontSize:9,color:T.textM}}>{l}</div>
                      </div>
                    ))}
                  </div>
                )}
                {!showCd&&<div style={{marginTop:4}}><Chip d={nx.d} lang={lang} T={T}/></div>}
              </>
            ):(
              <div style={{fontFamily:HS,fontSize:12,color:T.textM,marginTop:2}}>
                {lang==="bn"?"গ্রুপ পর্ব শেষ":"Group stage over"}
              </div>
            )}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {nx&&<button onClick={e=>{e.stopPropagation();addToGCal(nx,lang);}} style={{background:T.sur2,border:`1px solid ${T.border}`,borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>📅</button>}
          <button onClick={()=>iF?setFavs(f=>f.filter(x=>x!==en)):setFavs(f=>[...f,en])}
            style={{fontFamily:HS,fontSize:11,cursor:"pointer",borderRadius:20,padding:"4px 10px",
              background:iF?T.greenBg:T.sur2,border:`1px solid ${iF?T.greenBr:T.border}`,
              color:iF?T.green:T.textS,whiteSpace:"nowrap"}}>
            {iF?"⭐":"+ ⭐"}
          </button>
        </div>
      </div>
    );
  }
  return(
    <div style={{padding:"14px 14px 90px"}}>
      {favs.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontFamily:HS,fontWeight:700,fontSize:13,color:T.textS,marginBottom:10}}>
            ⭐ {lang==="bn"?"প্রিয় দল":"MY TEAMS"}
          </div>
          {favs.map(en=><Row key={en} en={en}/>)}
        </div>
      )}
      <div style={{fontFamily:HS,fontWeight:700,fontSize:13,color:T.textS,marginBottom:10}}>
        🔥 {lang==="bn"?"জনপ্রিয় দল":"POPULAR TEAMS"}
      </div>
      {pop.map(en=><Row key={en} en={en}/>)}
      <button onClick={()=>setSM(true)} style={{width:"100%",marginTop:8,background:T.surface,
        border:`1.5px dashed ${T.green}55`,borderRadius:14,padding:14,fontSize:14,
        color:T.green,cursor:"pointer",fontFamily:HS,fontWeight:600}}>
        {lang==="bn"?"+ অন্য দল যোগ করুন":"+ Add Another Team"}
      </button>
    </div>
  );
}

/* ── App ───────────────────────────────────────────────────────────── */
export default function App(){
  const[dark,setDark]=useState(true);
  const[lang,setLang]=useState("bn");
  const[mt,setMt]=useState("home");
  const[wt,setWt]=useState("table");
  const[favs,setFavs]=useState([]);
  const[tp,setTp]=useState(null);
  const[sm,setSm]=useState(false);
  const[scores,setScores]=useState({});
  const T=mkT(dark);
  const aF=en=>setFavs(f=>f.includes(en)?f:[...f,en]);

  const openTeam=en=>{window.history.pushState({team:en},"","");setTp(en);};
  const closeTeam=()=>setTp(null);
  useEffect(()=>{
    const onPop=()=>setTp(null);
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  },[]);

  if(tp) return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <TeamPage en={tp} lang={lang} onBack={closeTeam} T={T} scores={scores} setScores={setScores}/>
    </>
  );

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`*{-webkit-tap-highlight-color:transparent;}`}</style>
      <div style={{background:T.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto",fontFamily:HS}}>

        {/* Sticky header */}
        <div style={{background:T.hdr,position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 20px rgba(0,0,0,0.3)"}}>
          {/* Top bar */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 14px 12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <WCLogo size={40} dark={dark}/>
              <div>
                <div style={{fontFamily:HS,fontSize:18,fontWeight:800,color:"#fff",lineHeight:1}}>
                  {lang==="bn"?"খেলা কখন?":"Khela Kokhon?"}
                </div>
                <div style={{fontFamily:HS,fontSize:10,color:"rgba(255,255,255,0.5)",letterSpacing:1}}>
                  FIFA WORLD CUP 2026
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setDark(d=>!d)} style={{background:"rgba(255,255,255,0.12)",
                border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:20,
                width:36,height:36,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {dark?"☀️":"🌙"}
              </button>
              <button onClick={()=>setLang(l=>l==="bn"?"en":"bn")} style={{fontFamily:HS,
                background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",
                color:"#fff",borderRadius:20,padding:"0 12px",height:36,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                {lang==="bn"?"EN":"বাং"}
              </button>
            </div>
          </div>
          {/* Main tabs */}
          <div style={{display:"flex",borderTop:"1px solid rgba(255,255,255,0.12)"}}>
            {[["home",lang==="bn"?"🏠 হোম":"🏠 Home"],["wc",lang==="bn"?"🏆 বিশ্বকাপ":"🏆 World Cup"]].map(([id,lb])=>(
              <button key={id} onClick={()=>setMt(id)} style={{flex:1,background:"transparent",border:"none",
                borderBottom:`2.5px solid ${mt===id?"#fff":"transparent"}`,
                color:mt===id?"#fff":"rgba(255,255,255,0.45)",
                fontFamily:HS,fontSize:14,fontWeight:mt===id?700:400,padding:"10px 0",cursor:"pointer"}}>
                {lb}
              </button>
            ))}
          </div>
          {/* WC sub-tabs — inside sticky header */}
          {mt==="wc"&&(
            <div style={{display:"flex",borderTop:"1px solid rgba(255,255,255,0.12)"}}>
              {[["table",lang==="bn"?"টেবিল":"Table"],["knockout",lang==="bn"?"নকআউট":"Knockout"],["fixture",lang==="bn"?"গ্রুপ পর্ব":"Group Stage"]].map(([id,lb])=>(
                <button key={id} onClick={()=>setWt(id)} style={{flex:1,background:"transparent",border:"none",
                  borderBottom:`2.5px solid ${wt===id?"#fff":"transparent"}`,
                  color:wt===id?"#fff":"rgba(255,255,255,0.5)",
                  fontFamily:HS,fontSize:13,fontWeight:wt===id?700:400,padding:"10px 0",cursor:"pointer"}}>
                  {lb}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        {mt==="home"&&<HomeTab lang={lang} favs={favs} setFavs={setFavs} onTeam={openTeam} setSM={setSm} T={T}/>}
        {mt==="wc"&&wt==="table"&&<TableTab lang={lang} T={T} scores={scores}/>}
        {mt==="wc"&&wt==="knockout"&&<KnockoutTab lang={lang} T={T} scores={scores}/>}
        {mt==="wc"&&wt==="fixture"&&<GroupTab lang={lang} onTeam={openTeam} T={T} scores={scores} setScores={setScores}/>}

        {sm&&<AddModal favs={favs} onAdd={aF} onClose={()=>setSm(false)} lang={lang} T={T}/>}

        {/* Footer */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:T.surface,
          borderTop:`1px solid ${T.border}`,padding:"10px 16px",textAlign:"center",zIndex:30}}>
          <div style={{fontFamily:HS,fontSize:11,color:T.textM}}>
            {lang==="bn"?"ডেভেলপ করেছেন ":"Developed by "}
            <span style={{fontWeight:700,color:T.textS}}>{lang==="bn"?"মাহবুব হাসান তন্ময়":"Mahbub Hasan Tonmoy"}</span>
          </div>
        </div>
      </div>
    </>
  );
}
