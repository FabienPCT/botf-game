import { useState, useRef, useEffect, useCallback } from "react";

// ── Firestore via Anthropic API (simulated with persistent storage) ──────────
// We use window.storage as the Firestore stand-in

const STORAGE_KEY = "botf_s11s12";

async function loadState() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}

async function saveState(data) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data));
  } catch(e) { console.error("Save failed", e); }
}

// ── constants ────────────────────────────────────────────────
const TEAMS = [
  { id:"IBD", name:"Iron Bore Drillers",     color:"#6b7280" },
  { id:"GM",  name:"GeoMax",                color:"#16a34a" },
  { id:"AC",  name:"AquaCore Drillers",     color:"#0891b2" },
  { id:"VF",  name:"VolcanoForge",          color:"#ea580c" },
  { id:"SC",  name:"Stellar Core Drillers", color:"#9333ea" },
];

const A04_REF = [
  {md:0,inc:0,azi:0},{md:121,inc:1,azi:250},{md:256,inc:7.3,azi:235},
  {md:426,inc:20,azi:194},{md:640,inc:38.8,azi:196},{md:853,inc:51,azi:191},
  {md:1066,inc:47.3,azi:190},{md:1341,inc:54,azi:193},{md:1645,inc:50,azi:197},
  {md:1908,inc:48.75,azi:197},{md:2103,inc:51.25,azi:198},{md:2316,inc:48.5,azi:196},
];
const A04_SURFACE = { N:600606.769, E:524209.527 };
const INTERCEPT_MD = 1933;
const INTERCEPT_TVDSS = 1780;
const RT_MSL = 27;

const DEMO_SURVEYS = {
  IBD:[{md:0,inc:0,azi:0},{md:120,inc:2,azi:200},{md:400,inc:15,azi:197},{md:700,inc:30,azi:196},{md:1000,inc:42,azi:195},{md:1300,inc:48,azi:196},{md:1600,inc:50,azi:196},{md:1933,inc:49,azi:196}],
  GM: [{md:0,inc:0,azi:0},{md:130,inc:1.5,azi:205},{md:450,inc:12,azi:200},{md:750,inc:28,azi:197},{md:1050,inc:40,azi:196},{md:1350,inc:46,azi:196},{md:1650,inc:49,azi:196},{md:1933,inc:48.5,azi:196}],
  AC: [{md:0,inc:0,azi:0},{md:110,inc:2.5,azi:195},{md:380,inc:18,azi:196},{md:680,inc:33,azi:196},{md:980,inc:44,azi:195},{md:1280,inc:49,azi:196},{md:1580,inc:50,azi:196},{md:1933,inc:49,azi:196}],
  VF: [{md:0,inc:0,azi:0},{md:115,inc:1.8,azi:210},{md:420,inc:14,azi:200},{md:720,inc:29,azi:197},{md:1020,inc:41,azi:196},{md:1320,inc:47,azi:196},{md:1620,inc:50,azi:196},{md:1933,inc:49,azi:196}],
  SC: [{md:0,inc:0,azi:0},{md:125,inc:2.2,azi:202},{md:430,inc:16,azi:198},{md:730,inc:31,azi:196},{md:1030,inc:43,azi:195},{md:1330,inc:48,azi:196},{md:1630,inc:50,azi:196},{md:1933,inc:49,azi:196}],
};
const DEMO_SURFACES = {
  IBD:{N:600450,E:524180}, GM:{N:600420,E:524260},
  AC:{N:600380,E:524150},  VF:{N:600460,E:524300}, SC:{N:600400,E:524230},
};

function buildInitialState() {
  const teams = {};
  TEAMS.forEach(t => {
    teams[t.id] = {
      s11Released: false,
      s12Released: false,
      s11Submitted: false,
      s12Submitted: false,
      surfaceN: DEMO_SURFACES[t.id].N.toFixed(3),
      surfaceE: DEMO_SURFACES[t.id].E.toFixed(3),
      surveyText: DEMO_SURVEYS[t.id].map(r=>`${r.md}\t${r.inc}\t${r.azi}`).join("\n"),
      s11Locked: false, // instructor can lock after review
    };
  });
  return {
    teams,
    mapLayers: { hazardsImg: null, slopeImg: null, windImg: null, currentImg: null, wavesImg: null },
    activeMapLayer: "none",
  };
}

// ── survey math ───────────────────────────────────────────────
function minCurv(surveys, surfN, surfE, rtMsl=RT_MSL) {
  const pts = [{md:0,inc:0,azi:0,N:surfN,E:surfE,tvdss:-rtMsl}];
  for (let i=1;i<surveys.length;i++) {
    const p=surveys[i-1], c=surveys[i];
    const dmd=c.md-p.md; if(dmd<=0) continue;
    const i1=p.inc*Math.PI/180, i2=c.inc*Math.PI/180;
    const a1=p.azi*Math.PI/180, a2=c.azi*Math.PI/180;
    const dTVD=dmd/2*(Math.cos(i1)+Math.cos(i2));
    const dN  =dmd/2*(Math.sin(i1)*Math.cos(a1)+Math.sin(i2)*Math.cos(a2));
    const dE  =dmd/2*(Math.sin(i1)*Math.sin(a1)+Math.sin(i2)*Math.sin(a2));
    const l=pts[pts.length-1];
    pts.push({md:c.md,inc:c.inc,azi:c.azi,N:l.N+dN,E:l.E+dE,tvdss:l.tvdss+dTVD});
  }
  return pts;
}

function parseSurvey(text) {
  return text.trim().split("\n")
    .map(l=>l.trim().split(/[\s,;	]+/).map(Number))
    .filter(r=>r.length>=3&&!isNaN(r[0])&&!isNaN(r[1])&&!isNaN(r[2]))
    .map(([md,inc,azi])=>({md,inc,azi}));
}

// ── Canvas plan view ──────────────────────────────────────────
function PlanView({rwPaths, a04Path, visTeams, bgImage, showA04, width=580, height=500}) {
  const cv = useRef(null);
  useEffect(()=>{
    const c=cv.current; if(!c) return;
    const ctx=c.getContext("2d");
    ctx.clearRect(0,0,width,height);

    // background
    if (bgImage) {
      const img=new Image();
      img.onload=()=>{ ctx.drawImage(img,0,0,width,height); drawOverlay(ctx); };
      img.src=bgImage;
    } else {
      ctx.fillStyle="#111827"; ctx.fillRect(0,0,width,height);
      drawOverlay(ctx);
    }

    function drawOverlay(ctx) {
      const allPts=[...a04Path,...rwPaths.flatMap(p=>p.pts)];
      if(!allPts.length) return;
      const Ns=allPts.map(p=>p.N), Es=allPts.map(p=>p.E);
      const minN=Math.min(...Ns)-150, maxN=Math.max(...Ns)+150;
      const minE=Math.min(...Es)-150, maxE=Math.max(...Es)+150;
      const sc=Math.min((width-40)/(maxE-minE),(height-40)/(maxN-minN));
      const ox=(width-(maxE-minE)*sc)/2, oy=(height-(maxN-minN)*sc)/2;
      const toX=E=>ox+(E-minE)*sc;
      const toY=N=>height-oy-(N-minN)*sc;

      // semi-transparent grid
      ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.lineWidth=0.5;
      for(let i=0;i<=10;i++){
        ctx.beginPath(); ctx.moveTo(i*width/10,0); ctx.lineTo(i*width/10,height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i*height/10); ctx.lineTo(width,i*height/10); ctx.stroke();
      }

      // scale bar
      const scaleM=200, scalePx=scaleM*sc;
      ctx.strokeStyle="rgba(255,255,255,0.7)"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(20,height-20); ctx.lineTo(20+scalePx,height-20); ctx.stroke();
      ctx.fillStyle="#fff"; ctx.font="10px sans-serif";
      ctx.fillText(`${scaleM} m`, 20+scalePx/2-12, height-8);

      // compass
      ctx.font="bold 11px sans-serif"; ctx.fillStyle="rgba(255,255,255,0.7)";
      ctx.fillText("N", width-22, 26);
      ctx.strokeStyle="rgba(255,255,255,0.5)"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(width-18,30); ctx.lineTo(width-18,14); ctx.stroke();

      // A04 path
      if (showA04 && a04Path.length>1) {
        ctx.strokeStyle="#facc15"; ctx.lineWidth=2.5; ctx.setLineDash([7,4]); ctx.globalAlpha=0.85;
        ctx.beginPath(); a04Path.forEach((p,i)=>i===0?ctx.moveTo(toX(p.E),toY(p.N)):ctx.lineTo(toX(p.E),toY(p.N)));
        ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1;
        ctx.fillStyle="#facc15"; ctx.font="bold 10px sans-serif";
        const la=a04Path[a04Path.length-1];
        ctx.fillText("A04",toX(la.E)+4,toY(la.N));
        // surface marker
        ctx.fillStyle="#facc15"; ctx.strokeStyle="#111";ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(toX(A04_SURFACE.E),toY(A04_SURFACE.N),6,0,Math.PI*2);
        ctx.fill(); ctx.stroke();
      }

      // intercept circle
      const ip=a04Path.find(p=>p.md>=INTERCEPT_MD)||a04Path[a04Path.length-1];
      if(ip){
        ctx.strokeStyle="#f87171"; ctx.lineWidth=2; ctx.setLineDash([5,3]);
        ctx.beginPath(); ctx.arc(toX(ip.E),toY(ip.N),16,0,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle="#f87171"; ctx.font="bold 10px sans-serif";
        ctx.fillText("⊕ Target",toX(ip.E)+18,toY(ip.N)+4);
      }

      // RW paths
      rwPaths.forEach(({team,pts,color})=>{
        if(!visTeams.includes(team.id)||pts.length<2) return;
        ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.setLineDash([]); ctx.globalAlpha=0.9;
        ctx.beginPath(); pts.forEach((p,i)=>i===0?ctx.moveTo(toX(p.E),toY(p.N)):ctx.lineTo(toX(p.E),toY(p.N)));
        ctx.stroke(); ctx.globalAlpha=1;
        // surface dot
        ctx.fillStyle=color; ctx.strokeStyle="#fff"; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(toX(pts[0].E),toY(pts[0].N),6,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle="#fff"; ctx.font="bold 10px sans-serif";
        ctx.fillText(team.id,toX(pts[0].E)+8,toY(pts[0].N)-5);
        // TD dot
        const td=pts[pts.length-1];
        ctx.fillStyle="#fff"; ctx.strokeStyle=color; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(toX(td.E),toY(td.N),4,0,Math.PI*2); ctx.fill(); ctx.stroke();
      });

      // legend box
      const lx=8, ly=8, lw=120, lh=22+TEAMS.length*16;
      ctx.fillStyle="rgba(0,0,0,0.65)"; ctx.fillRect(lx,ly,lw,lh);
      ctx.strokeStyle="rgba(255,255,255,0.15)"; ctx.lineWidth=0.5; ctx.strokeRect(lx,ly,lw,lh);
      ctx.fillStyle="#facc15"; ctx.font="bold 10px sans-serif"; ctx.fillText("Plan View (N/E)",lx+6,ly+14);
      TEAMS.forEach((t,i)=>{
        const vis=visTeams.includes(t.id);
        ctx.fillStyle=vis?t.color:"#555"; ctx.fillRect(lx+6,ly+20+i*16,10,10);
        ctx.fillStyle=vis?"#ddd":"#555"; ctx.font="10px sans-serif";
        ctx.fillText(t.name,lx+20,ly+29+i*16);
      });
    }
  },[rwPaths,a04Path,visTeams,bgImage,showA04,width,height]);

  return <canvas ref={cv} width={width} height={height} className="rounded-lg border border-gray-600 w-full" style={{maxWidth:width}} />;
}

function SectionView({rwPaths, a04Path, visTeams, showA04, width=580, height=320}) {
  const cv = useRef(null);
  useEffect(()=>{
    const c=cv.current; if(!c) return;
    const ctx=c.getContext("2d");
    ctx.fillStyle="#111827"; ctx.fillRect(0,0,width,height);
    const allPts=[...a04Path,...rwPaths.flatMap(p=>p.pts)];
    if(!allPts.length) return;
    const pad={t:20,b:35,l:55,r:20};
    const mds=allPts.map(p=>p.md), tvds=allPts.map(p=>p.tvdss);
    const maxMD=Math.max(...mds)+100, minTVD=Math.min(...tvds)-80, maxTVD=0;
    const W=width-pad.l-pad.r, H=height-pad.t-pad.b;
    const toX=md=>pad.l+md/maxMD*W;
    const toY=tvd=>pad.t+(tvd-maxTVD)/(minTVD-maxTVD)*H;

    // grid
    ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.lineWidth=0.5;
    for(let i=0;i<=10;i++){
      const x=pad.l+i*W/10; ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,height-pad.b); ctx.stroke();
      const y=pad.t+i*H/10; ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(width-pad.r,y); ctx.stroke();
    }
    ctx.strokeStyle="rgba(255,255,255,0.2)"; ctx.lineWidth=1; ctx.strokeRect(pad.l,pad.t,W,H);
    // axes labels
    ctx.fillStyle="#888"; ctx.font="10px sans-serif"; ctx.textAlign="center";
    ctx.fillText("MD (m)",pad.l+W/2,height-5);
    ctx.save(); ctx.translate(13,pad.t+H/2); ctx.rotate(-Math.PI/2);
    ctx.fillText("TVDSS (m)",0,0); ctx.restore(); ctx.textAlign="left";
    // tick labels
    for(let i=0;i<=5;i++){
      const md=maxMD*i/5;
      ctx.fillStyle="#666"; ctx.font="9px sans-serif"; ctx.textAlign="center";
      ctx.fillText(Math.round(md),toX(md),height-pad.b+12);
      const tvd=maxTVD+(minTVD-maxTVD)*i/5;
      ctx.textAlign="right"; ctx.fillText(Math.round(tvd),pad.l-4,toY(tvd)+3);
    }
    ctx.textAlign="left";

    // seabed
    const seaY=toY(-94.5);
    ctx.strokeStyle="rgba(80,120,255,0.4)"; ctx.lineWidth=1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(pad.l,seaY); ctx.lineTo(width-pad.r,seaY); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle="rgba(80,120,255,0.7)"; ctx.font="9px sans-serif";
    ctx.fillText("Seabed",pad.l+2,seaY-2);

    // 9-5/8" shoe
    const shoeY=toY(-1908+RT_MSL); // approx
    if(shoeY>pad.t&&shoeY<height-pad.b){
      ctx.strokeStyle="rgba(180,100,255,0.4)"; ctx.lineWidth=1; ctx.setLineDash([2,4]);
      ctx.beginPath(); ctx.moveTo(pad.l,shoeY); ctx.lineTo(width-pad.r,shoeY); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle="rgba(180,100,255,0.7)"; ctx.font="9px sans-serif";
      ctx.fillText('9⅝" shoe ~1908m',pad.l+2,shoeY-2);
    }

    // intercept band
    const iy=toY(-INTERCEPT_TVDSS);
    ctx.fillStyle="rgba(248,113,113,0.1)";
    ctx.fillRect(pad.l,iy-8,W,16);
    ctx.strokeStyle="#f87171"; ctx.lineWidth=1.5; ctx.setLineDash([4,2]);
    ctx.beginPath(); ctx.moveTo(pad.l,iy); ctx.lineTo(width-pad.r,iy); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle="#f87171"; ctx.font="9px sans-serif";
    ctx.fillText(`Intercept zone ~${INTERCEPT_TVDSS}m TVDSS`,pad.l+2,iy-3);

    // A04
    if(showA04&&a04Path.length>1){
      ctx.strokeStyle="#facc15"; ctx.lineWidth=2; ctx.setLineDash([6,3]); ctx.globalAlpha=0.85;
      ctx.beginPath(); a04Path.forEach((p,i)=>i===0?ctx.moveTo(toX(p.md),toY(p.tvdss)):ctx.lineTo(toX(p.md),toY(p.tvdss)));
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1;
      const la=a04Path[a04Path.length-1];
      ctx.fillStyle="#facc15"; ctx.font="9px sans-serif"; ctx.fillText("A04",toX(la.md)+3,toY(la.tvdss));
    }

    // RW paths
    rwPaths.forEach(({team,pts,color})=>{
      if(!visTeams.includes(team.id)||pts.length<2) return;
      ctx.strokeStyle=color; ctx.lineWidth=2; ctx.globalAlpha=0.9;
      ctx.beginPath(); pts.forEach((p,i)=>i===0?ctx.moveTo(toX(p.md),toY(p.tvdss)):ctx.lineTo(toX(p.md),toY(p.tvdss)));
      ctx.stroke(); ctx.globalAlpha=1;
      const td=pts[pts.length-1];
      ctx.fillStyle=color; ctx.font="9px sans-serif"; ctx.fillText(team.id,toX(td.md)+3,toY(td.tvdss));
    });
  },[rwPaths,a04Path,visTeams,showA04,width,height]);
  return <canvas ref={cv} width={width} height={height} className="rounded-lg border border-gray-600 w-full" style={{maxWidth:width}} />;
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [mode, setMode]           = useState("instructor");
  const [activeTeam, setActiveTeam] = useState("GM");
  const [visTeams, setVisTeams]   = useState(TEAMS.map(t=>t.id));
  const [showA04, setShowA04]     = useState(true);
  const [activeTab, setActiveTab] = useState("plan");
  const [selectedTeamDetail, setSelectedTeamDetail] = useState(null);
  const [saveBusy, setSaveBusy]   = useState(false);
  const [toast, setToast]         = useState(null);
  // local edits per team (not yet submitted)
  const [localEdits, setLocalEdits] = useState({});

  const showToast = (msg, ok=true) => {
    setToast({msg,ok}); setTimeout(()=>setToast(null),3000);
  };

  // load on mount
  useEffect(()=>{
    loadState().then(s=>{
      setAppState(s || buildInitialState());
      setLoading(false);
    });
  },[]);

  const persist = useCallback(async (newState) => {
    setAppState(newState);
    setSaveBusy(true);
    await saveState(newState);
    setSaveBusy(false);
  },[]);

  const updateTeam = useCallback((tid, patch) => {
    setAppState(prev=>{
      const next={...prev, teams:{...prev.teams, [tid]:{...prev.teams[tid],...patch}}};
      saveState(next);
      return next;
    });
  },[]);

  if (loading || !appState) return (
    <div className="min-h-screen bg-gray-900 text-gray-400 flex items-center justify-center text-sm">
      Loading BOTF data…
    </div>
  );

  const { teams, mapLayers, activeMapLayer } = appState;
  const a04Path = minCurv(A04_REF, A04_SURFACE.N, A04_SURFACE.E);

  const rwPaths = TEAMS.map(team => {
    const td = teams[team.id];
    if (!td?.s12Submitted) return {team, color:team.color, pts:[]};
    const parsed = parseSurvey(td.surveyText||"");
    const N = parseFloat(td.surfaceN)||DEMO_SURFACES[team.id].N;
    const E = parseFloat(td.surfaceE)||DEMO_SURFACES[team.id].E;
    return {team, color:team.color, pts: parsed.length>1 ? minCurv(parsed,N,E) : []};
  });

  const currentBg = activeMapLayer!=="none" ? (mapLayers[activeMapLayer+"Img"]||null) : null;

  const toggleTeam = id => setVisTeams(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);

  // ── image upload handler ──
  const handleImageUpload = (layerKey, file) => {
    const reader = new FileReader();
    reader.onload = e => {
      const newState = {...appState, mapLayers:{...mapLayers,[layerKey+"Img"]:e.target.result}};
      persist(newState);
      showToast(`${layerKey} map uploaded ✓`);
    };
    reader.readAsDataURL(file);
  };

  // ── INSTRUCTOR PANEL ──────────────────────────────────────────
  const InstructorPanel = () => {
    const mapOptions = [
      {key:"none",  label:"Plain"},
      {key:"hazards",label:"Shallow Hazards"},
      {key:"slope",  label:"Seabed Slope"},
      {key:"wind",   label:"Wind"},
      {key:"current",label:"Current"},
      {key:"waves",  label:"Waves"},
    ];

    return (
      <div className="space-y-3">
        {/* Top controls */}
        <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 space-y-2">
          {/* Release gates */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-gray-400 w-full">Stage Gates (release per team):</span>
            {TEAMS.map(t=>{
              const td=teams[t.id];
              return (
                <div key={t.id} className="flex items-center gap-1 bg-gray-900 rounded-lg px-2 py-1">
                  <span className="text-xs font-bold" style={{color:t.color}}>{t.id}</span>
                  <button onClick={()=>updateTeam(t.id,{s11Released:!td.s11Released})}
                    className={`px-1.5 py-0.5 rounded text-xs font-semibold ${td.s11Released?"bg-green-700 text-green-100":"bg-gray-700 text-gray-400"}`}>
                    S11{td.s11Released?"✓":"○"}
                  </button>
                  <button onClick={()=>updateTeam(t.id,{s12Released:!td.s12Released})}
                    className={`px-1.5 py-0.5 rounded text-xs font-semibold ${td.s12Released?"bg-green-700 text-green-100":"bg-gray-700 text-gray-400"}`}>
                    S12{td.s12Released?"✓":"○"}
                  </button>
                  <span className={`text-xs ${td.s11Submitted?"text-blue-400":"text-gray-600"}`}>📍{td.s11Submitted?"✓":"—"}</span>
                  <span className={`text-xs ${td.s12Submitted?"text-blue-400":"text-gray-600"}`}>🛰{td.s12Submitted?"✓":"—"}</span>
                </div>
              );
            })}
          </div>

          {/* Team visibility */}
          <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-gray-700">
            <span className="text-xs text-gray-400 mr-1">Show:</span>
            {TEAMS.map(t=>(
              <button key={t.id} onClick={()=>toggleTeam(t.id)}
                style={{borderColor:t.color, color:visTeams.includes(t.id)?"#fff":t.color,
                  background:visTeams.includes(t.id)?t.color:"transparent"}}
                className="px-2 py-0.5 rounded-full text-xs font-bold border-2 transition-all">
                {t.id}
              </button>
            ))}
            <button onClick={()=>setVisTeams(TEAMS.map(t=>t.id))} className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 ml-1">All</button>
            <button onClick={()=>setVisTeams([])} className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600">None</button>
            <button onClick={()=>setShowA04(v=>!v)}
              className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold border-2 transition-all ${showA04?"bg-yellow-500 border-yellow-500 text-gray-900":"border-yellow-500 text-yellow-400"}`}>
              A04 target
            </button>
          </div>

          {/* Map layer selector */}
          <div className="flex flex-wrap gap-1 items-center pt-1 border-t border-gray-700">
            <span className="text-xs text-gray-400 mr-1">Map overlay:</span>
            {mapOptions.map(o=>(
              <button key={o.key} onClick={()=>persist({...appState,activeMapLayer:o.key})}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-all
                  ${activeMapLayer===o.key?"bg-blue-600 border-blue-500 text-white":"border-gray-600 text-gray-400 hover:text-gray-200"}`}>
                {o.label}
                {o.key!=="none"&&mapLayers[o.key+"Img"] && <span className="ml-1 text-green-400">●</span>}
              </button>
            ))}
          </div>

          {/* Image uploads */}
          <div className="pt-1 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-1.5">Upload map images (PNG/JPG — will be used as overlay):</p>
            <div className="flex flex-wrap gap-2">
              {["hazards","slope","wind","current","waves"].map(k=>(
                <label key={k} className="cursor-pointer flex items-center gap-1 bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 text-xs text-gray-300 transition-all">
                  <span>{k==="hazards"?"🔶":k==="slope"?"🏔":k==="wind"?"💨":k==="current"?"🌊":"🌊"}</span>
                  <span className="capitalize">{k}</span>
                  {mapLayers[k+"Img"] && <span className="text-green-400 text-xs">✓</span>}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e=>e.target.files[0]&&handleImageUpload(k,e.target.files[0])} />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-1 border-b border-gray-700">
          {["plan","section","table","summary"].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)}
              className={`px-3 py-1.5 text-xs font-semibold capitalize transition-all
                ${activeTab===t?"border-b-2 border-yellow-400 text-yellow-400":"text-gray-500 hover:text-gray-300"}`}>
              {t==="plan"?"🗺 Plan":t==="section"?"📐 Section":t==="table"?"📊 Data":"📋 Summary"}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-3">
          {activeTab==="plan" && (
            <div className="space-y-2">
              <PlanView rwPaths={rwPaths} a04Path={a04Path} visTeams={visTeams}
                bgImage={currentBg} showA04={showA04} width={580} height={500} />
              <p className="text-xs text-gray-500 text-center">
                Filled circles = surface locations &nbsp;|&nbsp; Small circles = TD &nbsp;|&nbsp;
                🟡 A04 target (dashed) &nbsp;|&nbsp; ⊕ = Intercept zone
              </p>
            </div>
          )}
          {activeTab==="section" && (
            <div className="space-y-2">
              <SectionView rwPaths={rwPaths} a04Path={a04Path} visTeams={visTeams}
                showA04={showA04} width={580} height={340} />
              <p className="text-xs text-gray-500 text-center">MD vs TVDSS — dashed horizontal = intercept zone</p>
            </div>
          )}
          {activeTab==="table" && (
            <div>
              <div className="flex gap-2 mb-3 flex-wrap">
                {TEAMS.map(t=>(
                  <button key={t.id} onClick={()=>setSelectedTeamDetail(selectedTeamDetail===t.id?null:t.id)}
                    style={{borderColor:t.color, color:selectedTeamDetail===t.id?"#fff":t.color,
                      background:selectedTeamDetail===t.id?t.color:"transparent"}}
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold border-2">
                    {t.name}
                  </button>
                ))}
              </div>
              {selectedTeamDetail ? (() => {
                const rw=rwPaths.find(r=>r.team.id===selectedTeamDetail);
                const td=teams[selectedTeamDetail];
                const N=parseFloat(td.surfaceN), E=parseFloat(td.surfaceE);
                const dist=Math.sqrt((N-A04_SURFACE.N)**2+(E-A04_SURFACE.E)**2);
                return (
                  <div>
                    <div className="text-xs text-gray-400 mb-2 flex gap-4 flex-wrap">
                      <span>Surface: N={N.toFixed(3)} m | E={E.toFixed(3)} m</span>
                      <span>CRS: WGS84/UTM48N (EPSG:32648)</span>
                      <span style={{color:dist<300?"#f87171":dist<600?"#facc15":"#4ade80"}}>
                        Dist to A04: {dist.toFixed(0)} m
                      </span>
                    </div>
                    {rw.pts.length>0 ? (
                      <div className="overflow-auto max-h-[400px]">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-700 sticky top-0">
                            <tr>{["MD (m)","Inc (°)","Azi (°)","Northing (m)","Easting (m)","TVDSS (m)"].map(h=>(
                              <th key={h} className="px-2 py-1 text-left text-gray-300 font-semibold whitespace-nowrap">{h}</th>
                            ))}</tr>
                          </thead>
                          <tbody>
                            {rw.pts.map((p,i)=>(
                              <tr key={i} className={i%2===0?"bg-gray-900":"bg-gray-800"}>
                                <td className="px-2 py-0.5 font-mono">{p.md.toFixed(2)}</td>
                                <td className="px-2 py-0.5 font-mono">{p.inc.toFixed(2)}</td>
                                <td className="px-2 py-0.5 font-mono">{p.azi.toFixed(2)}</td>
                                <td className="px-2 py-0.5 font-mono">{p.N.toFixed(2)}</td>
                                <td className="px-2 py-0.5 font-mono">{p.E.toFixed(2)}</td>
                                <td className="px-2 py-0.5 font-mono">{p.tvdss.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <p className="text-xs text-gray-500 italic">No trajectory submitted yet.</p>}
                  </div>
                );
              })() : <p className="text-xs text-gray-500 italic">Select a team above to view their computed trajectory.</p>}
            </div>
          )}
          {activeTab==="summary" && (
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-700">
                  <tr>{["Team","S11","S12","Surface N (m)","Surface E (m)","Dist A04 (m)","Stations","Max MD (m)","TD TVDSS (m)"].map(h=>(
                    <th key={h} className="px-2 py-1.5 text-left text-gray-300 font-semibold whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {TEAMS.map((team,i)=>{
                    const td=teams[team.id];
                    const rw=rwPaths.find(r=>r.team.id===team.id);
                    const N=parseFloat(td.surfaceN), E=parseFloat(td.surfaceE);
                    const dist=Math.sqrt((N-A04_SURFACE.N)**2+(E-A04_SURFACE.E)**2);
                    const last=rw.pts[rw.pts.length-1];
                    const distColor=dist<300?"#f87171":dist<600?"#facc15":"#4ade80";
                    return (
                      <tr key={team.id} className={i%2===0?"bg-gray-900":"bg-gray-800"}>
                        <td className="px-2 py-1.5"><span className="font-bold" style={{color:team.color}}>{team.name}</span></td>
                        <td className="px-2 py-1.5 text-center">{td.s11Submitted?<span className="text-green-400">✓</span>:<span className="text-gray-600">—</span>}</td>
                        <td className="px-2 py-1.5 text-center">{td.s12Submitted?<span className="text-green-400">✓</span>:<span className="text-gray-600">—</span>}</td>
                        <td className="px-2 py-1.5 font-mono text-xs">{N.toFixed(3)}</td>
                        <td className="px-2 py-1.5 font-mono text-xs">{E.toFixed(3)}</td>
                        <td className="px-2 py-1.5 font-mono font-bold" style={{color:distColor}}>{dist.toFixed(0)}</td>
                        <td className="px-2 py-1.5 font-mono">{rw.pts.length||"—"}</td>
                        <td className="px-2 py-1.5 font-mono">{last?.md?.toFixed(0)||"—"}</td>
                        <td className="px-2 py-1.5 font-mono">{last?.tvdss?.toFixed(0)||"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-2">
                <span className="text-red-400">●</span> &lt;300m: too close &nbsp;|&nbsp;
                <span className="text-yellow-400">●</span> 300–600m: marginal &nbsp;|&nbsp;
                <span className="text-green-400">●</span> &gt;600m: good separation
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── TEAM PANEL ────────────────────────────────────────────────
  const TeamPanel = () => {
    const team = TEAMS.find(t=>t.id===activeTeam);
    const td = teams[activeTeam];
    const le = localEdits[activeTeam]||{};
    const localN = le.surfaceN ?? td.surfaceN ?? "";
    const localE = le.surfaceE ?? td.surfaceE ?? "";
    const localSurvey = le.surveyText ?? td.surveyText ?? "";
    const setLocal = (k,v) => setLocalEdits(p=>({...p,[activeTeam]:{...p[activeTeam],[k]:v}}));

    const parsed = parseSurvey(localSurvey);
    const distToA04 = Math.sqrt((parseFloat(localN)-A04_SURFACE.N)**2+(parseFloat(localE)-A04_SURFACE.E)**2);

    const submit11 = () => {
      if (!td.s11Released) { showToast("Stage 11 not yet released by instructor","warn"); return; }
      const N=parseFloat(localN), E=parseFloat(localE);
      if (isNaN(N)||isNaN(E)) { showToast("Invalid coordinates","warn"); return; }
      updateTeam(activeTeam, {surfaceN:N.toFixed(3), surfaceE:E.toFixed(3), s11Submitted:true});
      showToast(`Stage 11 submitted for ${team.name} ✓`);
    };

    const submit12 = () => {
      if (!td.s12Released) { showToast("Stage 12 not yet released by instructor","warn"); return; }
      if (parsed.length<2) { showToast("Need at least 2 valid survey rows","warn"); return; }
      updateTeam(activeTeam, {surveyText:localSurvey, s12Submitted:true});
      showToast(`Stage 12 trajectory submitted (${parsed.length} stations) ✓`);
    };

    return (
      <div className="space-y-4">
        {/* Team selector */}
        <div className="flex gap-2 flex-wrap">
          {TEAMS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTeam(t.id)}
              style={{borderColor:t.color, color:activeTeam===t.id?"#fff":t.color,
                background:activeTeam===t.id?t.color:"transparent"}}
              className="px-3 py-1 rounded-full text-xs font-bold border-2 transition-all">
              {t.id}
            </button>
          ))}
        </div>

        {/* Stage 11 */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-bold text-yellow-400">📍 Stage 11 – Relief Well Surface Location</h3>
            {td.s11Released
              ? <span className="text-xs bg-green-800 text-green-300 px-2 py-0.5 rounded-full">Released ✓</span>
              : <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Locked 🔒</span>}
            {td.s11Submitted && <span className="text-xs bg-blue-800 text-blue-300 px-2 py-0.5 rounded-full">Submitted ✓</span>}
          </div>
          <p className="text-xs text-gray-400 mb-3">
            CRS: WGS84 / UTM zone 48N (EPSG:32648) — per Stage 1 Option C, Stage 2 Option B, Stage 3 Option A
          </p>
          {td.s11Released ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Northing (m)</label>
                  <input className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-yellow-500 font-mono"
                    value={localN} onChange={e=>setLocal("surfaceN",e.target.value)} placeholder="e.g. 600420.000" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Easting (m)</label>
                  <input className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-yellow-500 font-mono"
                    value={localE} onChange={e=>setLocal("surfaceE",e.target.value)} placeholder="e.g. 524200.000" />
                </div>
              </div>
              <div className="mt-2 bg-gray-900 rounded p-2 text-xs text-gray-400">
                <span>Separation from A04: </span>
                <span className={`font-mono font-bold ${distToA04<300?"text-red-400":distToA04<600?"text-yellow-400":"text-green-400"}`}>
                  ΔN={((parseFloat(localN)||0)-A04_SURFACE.N).toFixed(1)}m &nbsp;|&nbsp;
                  ΔE={((parseFloat(localE)||0)-A04_SURFACE.E).toFixed(1)}m &nbsp;|&nbsp;
                  2D={isNaN(distToA04)?"?":distToA04.toFixed(0)}m
                </span>
              </div>
              <button onClick={submit11} style={{background:team.color}}
                className="mt-3 w-full text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">
                ✅ Submit Stage 11 – Surface Location
              </button>
            </>
          ) : (
            <div className="bg-gray-900 rounded p-3 text-xs text-gray-500 text-center">
              🔒 Stage 11 not yet released by the instructor. Stand by.
            </div>
          )}
        </div>

        {/* Stage 12 */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-bold text-cyan-400">🛰 Stage 12 – Relief Well Trajectory</h3>
            {td.s12Released
              ? <span className="text-xs bg-green-800 text-green-300 px-2 py-0.5 rounded-full">Released ✓</span>
              : <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Locked 🔒</span>}
            {td.s12Submitted && <span className="text-xs bg-blue-800 text-blue-300 px-2 py-0.5 rounded-full">Submitted ✓</span>}
          </div>
          {td.s12Released ? (
            <>
              <p className="text-xs text-gray-400 mb-2">
                Paste survey: <span className="font-mono bg-gray-700 px-1 rounded">MD(m) &nbsp; Inc(°) &nbsp; Azi(°)</span> — one row per line, ~30m spacing. Tab or space separated.
              </p>
              <textarea
                className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500 resize-y"
                rows={14} value={localSurvey} onChange={e=>setLocal("surveyText",e.target.value)}
                placeholder={"0\t0\t0\n30\t1.2\t198\n60\t2.4\t197\n90\t3.8\t196\n..."} />
              <div className="mt-1 flex gap-4 text-xs text-gray-500">
                <span>{parsed.length} stations parsed</span>
                <span>Max MD: {parsed.slice(-1)[0]?.md??0} m</span>
                <span>Max Inc: {Math.max(0,...parsed.map(p=>p.inc)).toFixed(1)}°</span>
              </div>
              <button onClick={submit12} style={{background:"#0891b2"}}
                className="mt-2 w-full text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity">
                ✅ Submit Stage 12 – Trajectory
              </button>
            </>
          ) : (
            <div className="bg-gray-900 rounded p-3 text-xs text-gray-500 text-center">
              🔒 Stage 12 not yet released by the instructor. Stand by.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100" style={{fontFamily:"system-ui,sans-serif",fontSize:"13px"}}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-3 right-3 z-50 px-4 py-2 rounded-lg text-xs font-bold shadow-lg
          ${toast.ok===false||toast.ok==="warn"?"bg-yellow-800 text-yellow-200 border border-yellow-600":"bg-green-800 text-green-200 border border-green-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-3 flex-wrap">
        <span className="font-black text-yellow-400 text-xl">BOTF</span>
        <span className="text-gray-300 text-sm font-semibold">Stage 11 & 12 — RW Surface Location & Trajectory</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-600">{saveBusy?"⏳ saving…":"🟢 live"}</span>
          <button onClick={()=>setMode("team")}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${mode==="team"?"bg-blue-600 text-white":"bg-gray-700 text-gray-400 hover:text-gray-200"}`}>
            👤 Team Input
          </button>
          <button onClick={()=>setMode("instructor")}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${mode==="instructor"?"bg-yellow-600 text-white":"bg-gray-700 text-gray-400 hover:text-gray-200"}`}>
            🎓 Instructor
          </button>
        </div>
      </div>

      <div className="p-3 max-w-3xl mx-auto">
        {mode==="team" ? <TeamPanel /> : <InstructorPanel />}
      </div>
    </div>
  );
}