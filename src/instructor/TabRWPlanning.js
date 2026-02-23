// src/instructor/TabRWPlanning.js
import { useState, useRef, useEffect } from "react";
import { db } from "../firebase.js";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { TEAMS } from "../data/teams.js";

// ── Firestore doc key for RW planning data ────────────────────
const RW_DOC = "rwplanning";
const COL    = "botf";

// ── Field / well constants ────────────────────────────────────
const A04_REF = [
  {md:0,   inc:0,    azi:0  }, {md:121, inc:1,    azi:250},
  {md:256, inc:7.3,  azi:235}, {md:426, inc:20,   azi:194},
  {md:640, inc:38.8, azi:196}, {md:853, inc:51,   azi:191},
  {md:1066,inc:47.3, azi:190}, {md:1341,inc:54,   azi:193},
  {md:1645,inc:50,   azi:197}, {md:1908,inc:48.75,azi:197},
  {md:2103,inc:51.25,azi:198}, {md:2316,inc:48.5, azi:196},
];
const A04_SURFACE    = { N: 600606.769, E: 524209.527 };
const INTERCEPT_TVDSS = 1780;
const RT_MSL          = 27;

// ── Initial per-team state ────────────────────────────────────
function buildInitialRW() {
  const teams = {};
  TEAMS.forEach(t => {
    teams[t.id] = {
      s11Released: false,
      s12Released: false,
      s11Submitted: false,
      s12Submitted: false,
      surfaceN: "",
      surfaceE: "",
      surveyText: "",
    };
  });
  return { teams, mapLayers: {}, activeMapLayer: "none" };
}

// ── Survey math ───────────────────────────────────────────────
function minCurv(surveys, surfN, surfE, rtMsl = RT_MSL) {
  const pts = [{ md:0, inc:0, azi:0, N:surfN, E:surfE, tvdss:-rtMsl }];
  for (let i = 1; i < surveys.length; i++) {
    const p = surveys[i-1], c = surveys[i];
    const dmd = c.md - p.md;
    if (dmd <= 0) continue;
    const i1 = p.inc*Math.PI/180, i2 = c.inc*Math.PI/180;
    const a1 = p.azi*Math.PI/180, a2 = c.azi*Math.PI/180;
    const l = pts[pts.length-1];
    pts.push({
      md:  c.md,  inc: c.inc, azi: c.azi,
      N:   l.N   + dmd/2*(Math.sin(i1)*Math.cos(a1)+Math.sin(i2)*Math.cos(a2)),
      E:   l.E   + dmd/2*(Math.sin(i1)*Math.sin(a1)+Math.sin(i2)*Math.sin(a2)),
      tvdss: l.tvdss + dmd/2*(Math.cos(i1)+Math.cos(i2)),
    });
  }
  return pts;
}

function parseSurvey(text) {
  return (text||"").trim().split("\n")
    .map(l => l.trim().split(/[\s,;\t]+/).map(Number))
    .filter(r => r.length >= 3 && r.every(n => !isNaN(n)))
    .map(([md,inc,azi]) => ({md,inc,azi}));
}

// ── Canvas: Plan View ─────────────────────────────────────────
function PlanView({ rwPaths, a04Path, visTeams, bgImage, showA04, w=620, h=500 }) {
  const cvRef = useRef(null);

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // background
      if (bgImage) {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0, w, h); overlay(ctx); };
        img.src = bgImage;
      } else {
        ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, w, h);
        overlay(ctx);
      }
    };

    const overlay = (ctx) => {
      const allPts = [...a04Path, ...rwPaths.flatMap(p => p.pts)];
      if (!allPts.length) return;

      const Ns = allPts.map(p => p.N), Es = allPts.map(p => p.E);
      const minN = Math.min(...Ns)-150, maxN = Math.max(...Ns)+150;
      const minE = Math.min(...Es)-150, maxE = Math.max(...Es)+150;
      const sc = Math.min((w-40)/(maxE-minE), (h-40)/(maxN-minN));
      const ox = (w-(maxE-minE)*sc)/2, oy = (h-(maxN-minN)*sc)/2;
      const toX = E => ox+(E-minE)*sc;
      const toY = N => h-oy-(N-minN)*sc;

      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 0.5;
      for (let i=0; i<=10; i++) {
        ctx.beginPath(); ctx.moveTo(i*w/10,0);   ctx.lineTo(i*w/10,h);   ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i*h/10);   ctx.lineTo(w,i*h/10);   ctx.stroke();
      }

      // scale bar
      const scalePx = 200*sc;
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(20, h-20); ctx.lineTo(20+scalePx, h-20); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("200 m", 20+scalePx/2, h-8);
      ctx.textAlign = "left";

      // compass
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "bold 11px sans-serif";
      ctx.fillText("N", w-22, 26);
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(w-18, 30); ctx.lineTo(w-18, 14); ctx.stroke();

      // A04 path
      if (showA04 && a04Path.length > 1) {
        ctx.strokeStyle = "#facc15"; ctx.lineWidth = 2.5;
        ctx.setLineDash([7, 4]); ctx.globalAlpha = 0.85;
        ctx.beginPath();
        a04Path.forEach((p,i) => i===0 ? ctx.moveTo(toX(p.E),toY(p.N)) : ctx.lineTo(toX(p.E),toY(p.N)));
        ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        // A04 surface marker
        ctx.fillStyle = "#facc15"; ctx.strokeStyle = "#111"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(toX(A04_SURFACE.E), toY(A04_SURFACE.N), 6, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#facc15"; ctx.font = "bold 10px sans-serif";
        ctx.fillText("A04", toX(A04_SURFACE.E)+8, toY(A04_SURFACE.N)-5);
      }

      // intercept zone
      const ip = a04Path.find(p => p.tvdss <= -INTERCEPT_TVDSS) || a04Path[a04Path.length-1];
      if (ip) {
        ctx.strokeStyle = "#f87171"; ctx.lineWidth = 2; ctx.setLineDash([5,3]);
        ctx.beginPath(); ctx.arc(toX(ip.E), toY(ip.N), 18, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#f87171"; ctx.font = "bold 10px sans-serif";
        ctx.fillText("⊕ Target", toX(ip.E)+20, toY(ip.N)+4);
      }

      // RW paths
      rwPaths.forEach(({ team, pts, color }) => {
        if (!visTeams.includes(team.id) || pts.length < 2) return;
        ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.9;
        ctx.beginPath();
        pts.forEach((p,i) => i===0 ? ctx.moveTo(toX(p.E),toY(p.N)) : ctx.lineTo(toX(p.E),toY(p.N)));
        ctx.stroke(); ctx.globalAlpha = 1;
        // surface dot
        ctx.fillStyle = color; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(toX(pts[0].E), toY(pts[0].N), 6, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px sans-serif";
        ctx.fillText(team.id, toX(pts[0].E)+8, toY(pts[0].N)-5);
        // TD dot
        const td = pts[pts.length-1];
        ctx.fillStyle = "#fff"; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(toX(td.E), toY(td.N), 4, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
      });

      // legend
      const lh = 22 + TEAMS.length*16;
      ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(8, 8, 122, lh);
      ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 0.5; ctx.strokeRect(8, 8, 122, lh);
      ctx.fillStyle = "#facc15"; ctx.font = "bold 10px sans-serif";
      ctx.fillText("Plan View (N/E)", 14, 22);
      TEAMS.forEach((t, i) => {
        const vis = visTeams.includes(t.id);
        ctx.fillStyle = vis ? t.color : "#444"; ctx.fillRect(14, 30+i*16, 10, 10);
        ctx.fillStyle = vis ? "#ddd" : "#555"; ctx.font = "10px sans-serif";
        ctx.fillText(t.name, 28, 39+i*16);
      });
    };

    draw();
  }, [rwPaths, a04Path, visTeams, bgImage, showA04, w, h]);

  return (
    <canvas ref={cvRef} width={w} height={h}
      className="rounded-lg border border-gray-600 w-full" style={{ maxWidth: w }} />
  );
}

// ── Canvas: Section View ──────────────────────────────────────
function SectionView({ rwPaths, a04Path, visTeams, showA04, w=620, h=340 }) {
  const cvRef = useRef(null);

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, w, h);

    const allPts = [...a04Path, ...rwPaths.flatMap(p => p.pts)];
    if (!allPts.length) return;

    const pad = { t:20, b:38, l:58, r:20 };
    const W = w-pad.l-pad.r, H = h-pad.t-pad.b;
    const maxMD  = Math.max(...allPts.map(p=>p.md))+100;
    const minTVD = Math.min(...allPts.map(p=>p.tvdss))-80;
    const maxTVD = 30;
    const toX = md   => pad.l + md/maxMD*W;
    const toY = tvd  => pad.t + (tvd-maxTVD)/(minTVD-maxTVD)*H;

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 0.5;
    for (let i=0; i<=10; i++) {
      ctx.beginPath(); ctx.moveTo(pad.l+i*W/10, pad.t); ctx.lineTo(pad.l+i*W/10, h-pad.b); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t+i*H/10); ctx.lineTo(w-pad.r, pad.t+i*H/10); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1;
    ctx.strokeRect(pad.l, pad.t, W, H);

    // axis labels
    ctx.fillStyle = "#777"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("MD (m)", pad.l+W/2, h-5);
    ctx.save(); ctx.translate(13, pad.t+H/2); ctx.rotate(-Math.PI/2);
    ctx.fillText("TVDSS (m)", 0, 0); ctx.restore();
    ctx.textAlign = "left";

    // tick labels
    for (let i=0; i<=5; i++) {
      ctx.fillStyle = "#555"; ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(Math.round(maxMD*i/5), toX(maxMD*i/5), h-pad.b+12);
      ctx.textAlign = "right";
      const tvd = maxTVD+(minTVD-maxTVD)*i/5;
      ctx.fillText(Math.round(tvd), pad.l-4, toY(tvd)+3);
    }
    ctx.textAlign = "left";

    // seabed line
    const seaY = toY(-94.5);
    if (seaY > pad.t && seaY < h-pad.b) {
      ctx.strokeStyle = "rgba(80,120,255,0.4)"; ctx.lineWidth=1; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(pad.l,seaY); ctx.lineTo(w-pad.r,seaY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(80,120,255,0.7)"; ctx.font = "9px sans-serif";
      ctx.fillText("Seabed ~94.5m", pad.l+2, seaY-2);
    }

    // 9-5/8" casing shoe
    const shoeY = toY(-1908+RT_MSL);
    if (shoeY > pad.t && shoeY < h-pad.b) {
      ctx.strokeStyle = "rgba(180,100,255,0.4)"; ctx.lineWidth=1; ctx.setLineDash([2,4]);
      ctx.beginPath(); ctx.moveTo(pad.l,shoeY); ctx.lineTo(w-pad.r,shoeY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(180,100,255,0.7)"; ctx.font = "9px sans-serif";
      ctx.fillText('9⅝" shoe @1908m', pad.l+2, shoeY-2);
    }

    // intercept band
    const iy = toY(-INTERCEPT_TVDSS);
    ctx.fillStyle = "rgba(248,113,113,0.08)"; ctx.fillRect(pad.l, iy-10, W, 20);
    ctx.strokeStyle = "#f87171"; ctx.lineWidth = 1.5; ctx.setLineDash([4,2]);
    ctx.beginPath(); ctx.moveTo(pad.l,iy); ctx.lineTo(w-pad.r,iy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f87171"; ctx.font = "9px sans-serif";
    ctx.fillText(`Intercept zone ~${INTERCEPT_TVDSS}m TVDSS`, pad.l+2, iy-3);

    // A04
    if (showA04 && a04Path.length > 1) {
      ctx.strokeStyle = "#facc15"; ctx.lineWidth = 2; ctx.setLineDash([6,3]); ctx.globalAlpha = 0.85;
      ctx.beginPath();
      a04Path.forEach((p,i) => i===0 ? ctx.moveTo(toX(p.md),toY(p.tvdss)) : ctx.lineTo(toX(p.md),toY(p.tvdss)));
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      const la = a04Path[a04Path.length-1];
      ctx.fillStyle = "#facc15"; ctx.font = "9px sans-serif";
      ctx.fillText("A04", toX(la.md)+3, toY(la.tvdss));
    }

    // RW paths
    rwPaths.forEach(({ team, pts, color }) => {
      if (!visTeams.includes(team.id) || pts.length < 2) return;
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
      ctx.beginPath();
      pts.forEach((p,i) => i===0 ? ctx.moveTo(toX(p.md),toY(p.tvdss)) : ctx.lineTo(toX(p.md),toY(p.tvdss)));
      ctx.stroke(); ctx.globalAlpha = 1;
      const td = pts[pts.length-1];
      ctx.fillStyle = color; ctx.font = "9px sans-serif";
      ctx.fillText(team.id, toX(td.md)+3, toY(td.tvdss));
    });
  }, [rwPaths, a04Path, visTeams, showA04, w, h]);

  return (
    <canvas ref={cvRef} width={w} height={h}
      className="rounded-lg border border-gray-600 w-full" style={{ maxWidth: w }} />
  );
}

// ── Main export ───────────────────────────────────────────────
export default function TabRWPlanning() {
  const [rwState, setRwState] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [visTeams, setVisTeams]  = useState(TEAMS.map(t => t.id));
  const [showA04,  setShowA04]   = useState(true);
  const [activeTab, setActiveTab] = useState("plan");
  const [detailTeam, setDetailTeam] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  // ── Firestore real-time listener ──────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, COL, RW_DOC), snap => {
      setRwState(snap.exists() ? (snap.data().value ?? buildInitialRW()) : buildInitialRW());
    });
    return () => unsub();
  }, []);

  const persist = async (newState) => {
    setRwState(newState);
    setSaving(true);
    await setDoc(doc(db, COL, RW_DOC), { value: newState });
    setSaving(false);
  };

  const updateTeam = (tid, patch) => {
    if (!rwState) return;
    const next = { ...rwState, teams: { ...rwState.teams, [tid]: { ...rwState.teams[tid], ...patch } } };
    persist(next);
  };

  const handleImageUpload = (layerKey, file) => {
    const reader = new FileReader();
    reader.onload = e => {
      const next = { ...rwState, mapLayers: { ...rwState.mapLayers, [layerKey+"Img"]: e.target.result } };
      persist(next);
      showToast(`${layerKey} map uploaded ✓`);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (layerKey) => {
    const next = { ...rwState, mapLayers: { ...rwState.mapLayers, [layerKey+"Img"]: null } };
    persist(next);
    showToast(`${layerKey} map removed`);
  };

  if (!rwState) return <div className="text-xs text-gray-500 p-4">Loading RW planning data…</div>;

  const { teams, mapLayers, activeMapLayer } = rwState;
  const a04Path = minCurv(A04_REF, A04_SURFACE.N, A04_SURFACE.E);

  const rwPaths = TEAMS.map(team => {
    const td = teams[team.id];
    if (!td?.s12Submitted) return { team, color: team.color, pts: [] };
    const parsed = parseSurvey(td.surveyText);
    const N = parseFloat(td.surfaceN) || A04_SURFACE.N;
    const E = parseFloat(td.surfaceE) || A04_SURFACE.E;
    return { team, color: team.color, pts: parsed.length > 1 ? minCurv(parsed, N, E) : [] };
  });

  const currentBg = activeMapLayer !== "none" ? (mapLayers[activeMapLayer+"Img"] || null) : null;
  const toggleTeam = id => setVisTeams(v => v.includes(id) ? v.filter(x=>x!==id) : [...v, id]);

  const MAP_LAYERS = [
    { key:"none",    label:"Plain" },
    { key:"hazards", label:"🔶 Hazards" },
    { key:"slope",   label:"🏔 Slope" },
    { key:"wind",    label:"💨 Wind" },
    { key:"current", label:"🌊 Current" },
    { key:"waves",   label:"🌊 Waves" },
  ];

  const syncLabel = saving ? "⏳ saving…" : "🟢 live";

  return (
    <div className="space-y-3" style={{ fontFamily:"system-ui,sans-serif", fontSize:"13px" }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-3 right-3 z-50 px-4 py-2 rounded-lg text-xs font-bold shadow-lg
          ${toast.ok ? "bg-green-800 text-green-200 border border-green-600"
                     : "bg-yellow-800 text-yellow-200 border border-yellow-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Release gates ── */}
      <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Stage Release Gates</h3>
          <span className="text-xs text-gray-500">{syncLabel}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEAMS.map(t => {
            const td = teams[t.id];
            return (
              <div key={t.id}
                className="flex items-center gap-1.5 bg-gray-900 rounded-lg px-2.5 py-1.5 border border-gray-700">
                <span className="text-xs font-bold w-8" style={{ color: t.color }}>{t.id}</span>

                {/* S11 toggle */}
                <button onClick={() => updateTeam(t.id, { s11Released: !td.s11Released })}
                  title="Toggle Stage 11 release"
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-all
                    ${td.s11Released
                      ? "bg-green-700 text-green-100"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>
                  S11 {td.s11Released ? "✓" : "🔒"}
                </button>

                {/* S12 toggle */}
                <button onClick={() => updateTeam(t.id, { s12Released: !td.s12Released })}
                  title="Toggle Stage 12 release"
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-all
                    ${td.s12Released
                      ? "bg-green-700 text-green-100"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>
                  S12 {td.s12Released ? "✓" : "🔒"}
                </button>

                {/* Submission status */}
                <span className={`text-xs ${td.s11Submitted ? "text-blue-400" : "text-gray-600"}`}
                  title="Stage 11 submitted">📍</span>
                <span className={`text-xs ${td.s12Submitted ? "text-blue-400" : "text-gray-600"}`}
                  title="Stage 12 submitted">🛰</span>
              </div>
            );
          })}
          {/* Release all shortcuts */}
          <button
            onClick={() => {
              const next = { ...rwState };
              TEAMS.forEach(t => {
                next.teams[t.id] = { ...next.teams[t.id], s11Released: true, s12Released: true };
              });
              persist(next);
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-green-900 text-green-300 hover:bg-green-800 border border-green-800 font-semibold">
            Release all ✓
          </button>
          <button
            onClick={() => {
              const next = { ...rwState };
              TEAMS.forEach(t => {
                next.teams[t.id] = { ...next.teams[t.id], s11Released: false, s12Released: false };
              });
              persist(next);
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-red-900 text-red-300 hover:bg-red-800 border border-red-800 font-semibold">
            Lock all 🔒
          </button>
        </div>
      </div>

      {/* ── Viewer controls ── */}
      <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 space-y-2">

        {/* Team visibility */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-gray-400 mr-1 font-semibold">Show RWs:</span>
          {TEAMS.map(t => (
            <button key={t.id} onClick={() => toggleTeam(t.id)}
              style={{
                borderColor: t.color,
                color: visTeams.includes(t.id) ? "#fff" : t.color,
                background: visTeams.includes(t.id) ? t.color : "transparent",
                opacity: teams[t.id]?.s12Submitted ? 1 : 0.4,
              }}
              className="px-2 py-0.5 rounded-full text-xs font-bold border-2 transition-all flex items-center gap-1">
              {t.id}
              {teams[t.id]?.s12Submitted
                ? <span style={{color: visTeams.includes(t.id)?"#d1fae5":"#4ade80"}}>✓</span>
                : <span className="text-gray-500">○</span>}
            </button>
          ))}
          <button onClick={() => setVisTeams(TEAMS.map(t=>t.id))}
            className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 ml-1">All</button>
          <button onClick={() => setVisTeams([])}
            className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600">None</button>
          <button onClick={() => setShowA04(v => !v)}
            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold border-2 transition-all
              ${showA04
                ? "bg-yellow-500 border-yellow-500 text-gray-900"
                : "border-yellow-500 text-yellow-400"}`}>
            A04 target
          </button>
        </div>

        {/* Map layer selector */}
        <div className="flex flex-wrap gap-1.5 items-center pt-2 border-t border-gray-700">
          <span className="text-xs text-gray-400 mr-1 font-semibold">Map overlay:</span>
          {MAP_LAYERS.map(o => (
            <button key={o.key}
              onClick={() => persist({ ...rwState, activeMapLayer: o.key })}
              className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-all
                ${activeMapLayer === o.key
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "border-gray-600 text-gray-400 hover:text-gray-200"}`}>
              {o.label}
              {o.key !== "none" && mapLayers[o.key+"Img"] && <span className="ml-1 text-green-400">●</span>}
            </button>
          ))}
        </div>

        {/* Image upload row */}
        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-1.5">
            Upload your own map images (PNG/JPG) — used as overlay background:
          </p>
          <div className="flex flex-wrap gap-2">
            {["hazards","slope","wind","current","waves"].map(k => (
              <div key={k} className="flex items-center gap-1">
                <label className={`cursor-pointer flex items-center gap-1 rounded px-2 py-1 text-xs transition-all
                  ${mapLayers[k+"Img"]
                    ? "bg-green-900 text-green-300 border border-green-700"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"}`}>
                  <span className="capitalize">{k}</span>
                  {mapLayers[k+"Img"] ? <span>✓</span> : <span>↑</span>}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files[0] && handleImageUpload(k, e.target.files[0])} />
                </label>
                {mapLayers[k+"Img"] && (
                  <button onClick={() => removeImage(k)}
                    className="text-xs text-red-400 hover:text-red-300 px-1" title="Remove image">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── View tabs ── */}
      <div className="flex gap-1 border-b border-gray-700">
        {[
          { id:"plan",    label:"🗺 Plan View" },
          { id:"section", label:"📐 Section" },
          { id:"table",   label:"📊 Data Table" },
          { id:"summary", label:"📋 Summary" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 text-xs font-semibold transition-all
              ${activeTab===t.id
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "text-gray-500 hover:text-gray-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-3">

        {/* Plan view */}
        {activeTab === "plan" && (
          <div className="space-y-2">
            <PlanView rwPaths={rwPaths} a04Path={a04Path} visTeams={visTeams}
              bgImage={currentBg} showA04={showA04} w={620} h={500} />
            <p className="text-xs text-gray-500 text-center">
              Filled circles = surface locations &nbsp;|&nbsp; Small circles = TD &nbsp;|&nbsp;
              🟡 A04 target (dashed) &nbsp;|&nbsp; ⊕ = Intercept zone
            </p>
          </div>
        )}

        {/* Section view */}
        {activeTab === "section" && (
          <div className="space-y-2">
            <SectionView rwPaths={rwPaths} a04Path={a04Path} visTeams={visTeams}
              showA04={showA04} w={620} h={340} />
            <p className="text-xs text-gray-500 text-center">
              MD vs TVDSS — dashed horizontal = intercept zone
            </p>
          </div>
        )}

        {/* Data table */}
        {activeTab === "table" && (
          <div>
            <div className="flex gap-2 mb-3 flex-wrap">
              {TEAMS.map(t => (
                <button key={t.id}
                  onClick={() => setDetailTeam(detailTeam===t.id ? null : t.id)}
                  style={{
                    borderColor: t.color,
                    color: detailTeam===t.id ? "#fff" : t.color,
                    background: detailTeam===t.id ? t.color : "transparent",
                  }}
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold border-2 transition-all">
                  {t.name}
                  {!teams[t.id]?.s12Submitted && <span className="ml-1 text-gray-500">○</span>}
                </button>
              ))}
            </div>

            {detailTeam ? (() => {
              const td  = teams[detailTeam];
              const rw  = rwPaths.find(r => r.team.id === detailTeam);
              const N   = parseFloat(td.surfaceN);
              const E   = parseFloat(td.surfaceE);
              const dist = Math.sqrt((N-A04_SURFACE.N)**2+(E-A04_SURFACE.E)**2);
              return (
                <div>
                  <div className="text-xs text-gray-400 mb-2 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Surface: N={isNaN(N)?"—":N.toFixed(3)} m &nbsp;|&nbsp; E={isNaN(E)?"—":E.toFixed(3)} m</span>
                    <span>CRS: WGS84 / UTM48N (EPSG:32648)</span>
                    <span style={{ color: dist<300?"#f87171":dist<600?"#facc15":"#4ade80" }}>
                      Dist to A04: {isNaN(dist)?"—":dist.toFixed(0)} m
                    </span>
                  </div>
                  {rw.pts.length > 0 ? (
                    <div className="overflow-auto max-h-96">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-700 sticky top-0">
                          <tr>
                            {["MD (m)","Inc (°)","Azi (°)","Northing (m)","Easting (m)","TVDSS (m)"].map(h => (
                              <th key={h} className="px-2 py-1 text-left text-gray-300 font-semibold whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rw.pts.map((p, i) => (
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
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      {td.s12Submitted ? "No valid trajectory data." : "Stage 12 not yet submitted."}
                    </p>
                  )}
                </div>
              );
            })() : (
              <p className="text-xs text-gray-500 italic">Select a team above to view their computed trajectory.</p>
            )}
          </div>
        )}

        {/* Summary */}
        {activeTab === "summary" && (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-700">
                <tr>
                  {["Team","S11","S12","Surface N (m)","Surface E (m)",
                    "Dist A04 (m)","Stations","Max MD (m)","TD TVDSS (m)"].map(h => (
                    <th key={h} className="px-2 py-1.5 text-left text-gray-300 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TEAMS.map((team, i) => {
                  const td   = teams[team.id];
                  const rw   = rwPaths.find(r => r.team.id === team.id);
                  const N    = parseFloat(td.surfaceN);
                  const E    = parseFloat(td.surfaceE);
                  const dist = Math.sqrt((N-A04_SURFACE.N)**2+(E-A04_SURFACE.E)**2);
                  const last = rw.pts[rw.pts.length-1];
                  const distColor = dist<300?"#f87171":dist<600?"#facc15":"#4ade80";
                  return (
                    <tr key={team.id} className={i%2===0?"bg-gray-900":"bg-gray-800"}>
                      <td className="px-2 py-1.5">
                        <span className="font-bold" style={{ color: team.color }}>{team.name}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {td.s11Submitted
                          ? <span className="text-green-400">✓</span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {td.s12Submitted
                          ? <span className="text-green-400">✓</span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-2 py-1.5 font-mono">{isNaN(N)?"—":N.toFixed(3)}</td>
                      <td className="px-2 py-1.5 font-mono">{isNaN(E)?"—":E.toFixed(3)}</td>
                      <td className="px-2 py-1.5 font-mono font-bold"
                        style={{ color: isNaN(dist)?"#666":distColor }}>
                        {isNaN(dist)?"—":dist.toFixed(0)}
                      </td>
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
              <span className="text-green-400">●</span> &gt;600m: good separation from A04
            </p>
          </div>
        )}
      </div>
    </div>
  );
}