// src/components/Stage6SagTool.js
//
// Drop-in replacement for StageCard when stage.id === 6.
// Receives the option already chosen by the team (via sd.option from Firestore).
//
// Usage in StageCard.js:
//
//   import Stage6SagTool from "./Stage6SagTool";
//
//   if (stage.id === 6 && released) {
//     return <Stage6SagTool option={opt} clr={clr} />;
//   }
//
// Props:
//   option  "A" | "B" | "C"
//   clr     team colour object (unused internally but kept for consistency)

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── RAW ACCELEROMETER DATA ─────────────────────────────────────────────────
const RAW_DATA = [
  {md:1698.54,gz:185.37,gx:535.14, gy: 819.94},
  {md:1708.08,gz:190.37,gx:863.41, gy:-459.69},
  {md:1733.58,gz:199.86,gx:969.34, gy:-114.42},
  {md:1750.79,gz:200.36,gx:-965.34,gy: -17.99},
  {md:1790.63,gz:200.36,gx:-677.54,gy: 704.52},
  {md:1831.22,gz:199.36,gx:-810.45,gy:-547.63},
  {md:1872.19,gz:200.36,gx:-951.35,gy:-226.35},
  {md:1913.6, gz:198.87,gx:-366.75,gy:-906.38},
  {md:1953.42,gz:200.36,gx: 973.84,gy:  30.98},
  {md:1994.57,gz:199.86,gx:-784.97,gy: 583.10},
  {md:2035.22,gz:199.36,gx:-962.85,gy: 181.38},
  {md:2077.36,gz:197.87,gx: 336.27,gy:-917.38},
  {md:2117.12,gz:199.86,gx: 930.87,gy: 294.30},
  {md:2199.1, gz:200.86,gx:-760.98,gy: 613.08},
  {md:2238.66,gz:199.36,gx: 130.41,gy:-968.34},
  {md:2280.71,gz:199.86,gx:-753.99,gy: 622.08},
  {md:2312.35,gz:199.86,gx: 911.88,gy:-348.26},
  {md:2333.66,gz:199.86,gx:-102.43,gy: 971.34},
  {md:2382.78,gz:200.36,gx:-355.76,gy: 909.88},
  {md:2444.37,gz:199.36,gx:-372.75,gy:-903.39},
  {md:2484.86,gz:199.36,gx:-973.84,gy:  90.44},
  {md:2546.72,gz:183.38,gx:-366.25,gy: 909.38},
  {md:2606.21,gz:182.88,gx: 376.74,gy:-904.89},
  {md:2646.4, gz:182.88,gx:-738.50,gy:-646.06},
  {md:2688.39,gz:191.87,gx: 538.63,gy: 816.45},
  {md:2728.69,gz:191.37,gx:-928.37,gy:-312.79},
  {md:2790.84,gz:200.36,gx:-966.84,gy:-146.40},
  {md:2828.89,gz:199.36,gx:-906.38,gy: 366.75},
  {md:2891.87,gz:196.87,gx:-161.39,gy:-964.35},
  {md:2932.6, gz:191.87,gx:-972.84,gy:-111.92},
  {md:2973.35,gz:192.37,gx:-794.46,gy:-572.61},
  {md:3013.16,gz:172.38,gx: 876.90,gy:-440.70},
  {md:3055.04,gz:155.89,gx: 139.41,gy:-974.84},
  {md:3061.22,gz:151.90,gx: 853.92,gy: 490.67},
];

function calcInc(d) {
  const mag = Math.sqrt(d.gx ** 2 + d.gy ** 2 + d.gz ** 2);
  return +(Math.acos(d.gz / mag) * 180 / Math.PI).toFixed(2);
}

// ── SENSOR POSITION CANDIDATES ─────────────────────────────────────────────
// Correct: GWD = 11.94 m (sag +0.18°) | MWD = 27.66 m (sag −0.07°)
const GWD_POS = [
  { label: "11.65 m", sag: +0.28, correct: false },
  { label: "11.80 m", sag: +0.23, correct: false },
  { label: "11.94 m", sag: +0.18, correct: true  },
  { label: "12.10 m", sag: +0.13, correct: false },
];
const MWD_POS = [
  { label: "27.66 m", sag: -0.07, correct: true  },
  { label: "27.81 m", sag: -0.05, correct: false },
  { label: "27.96 m", sag: -0.03, correct: false },
  { label: "28.11 m", sag: -0.09, correct: false },
];

// ── BHA (80 m display) ─────────────────────────────────────────────────────
const BHA = [
  { name: '12 1/4" PDC',           grade: 'G-105', len: 0.35,  cum: 0.35,   od: 7.94,  maxOd: 12.25, stab: true,  hl: null  },
  { name: 'RSS 12 1/4"',           grade: 'P550',  len: 4.18,  cum: 4.53,   od: 9.00,  maxOd: 11.96, stab: false, hl: null  },
  { name: 'Receiver Sub w/sleeve', grade: 'G-105', len: 2.34,  cum: 6.86,   od: 8.38,  maxOd: 12.13, stab: true,  hl: null  },
  { name: 'PLF9-BA Flex Collar',   grade: 'G-105', len: 2.92,  cum: 9.79,   od: 9.50,  maxOd:  9.50, stab: false, hl: null  },
  { name: 'GWD',                   grade: 'P550',  len: 8.27,  cum: 18.055, od: 9.125, maxOd:  9.50, stab: false, hl: 'gwd' },
  { name: 'arcVISION 900',         grade: 'P550',  len: 5.90,  cum: 23.96,  od: 9.13,  maxOd: 10.00, stab: false, hl: null  },
  { name: 'MWD',                   grade: 'P550',  len: 8.57,  cum: 32.53,  od: 9.63,  maxOd:  9.63, stab: false, hl: 'mwd' },
  { name: 'NM Crossover',          grade: 'G-105', len: 0.91,  cum: 33.44,  od: 9.50,  maxOd:  9.50, stab: false, hl: null  },
  { name: '8 1/4" NM Pony Collar', grade: 'G-105', len: 2.49,  cum: 35.93,  od: 8.00,  maxOd:  8.00, stab: false, hl: null  },
  { name: '12 1/8" Stabilizer',    grade: 'G-105', len: 2.35,  cum: 38.28,  od: 8.25,  maxOd: 12.13, stab: true,  hl: null  },
  { name: '8" NMDC',               grade: 'G-105', len: 8.11,  cum: 46.39,  od: 8.06,  maxOd:  8.06, stab: false, hl: null  },
  { name: 'Rhino Reamer XC',       grade: 'G-105', len: 6.35,  cum: 52.74,  od: 11.75, maxOd: 11.75, stab: true,  hl: null  },
  { name: '8" DC',                 grade: 'G-105', len: 9.47,  cum: 62.21,  od: 8.00,  maxOd:  8.00, stab: false, hl: null  },
  { name: '12 1/16" Stabilizer',   grade: 'G-105', len: 2.30,  cum: 64.50,  od: 8.38,  maxOd: 12.06, stab: true,  hl: null  },
  { name: '8" DC',                 grade: 'G-105', len: 9.46,  cum: 73.96,  od: 8.00,  maxOd:  8.00, stab: false, hl: null  },
  { name: 'Ball Catcher',          grade: 'G-105', len: 1.94,  cum: 75.91,  od: 8.25,  maxOd:  8.25, stab: false, hl: null  },
  { name: 'Well Commander',        grade: 'G-105', len: 2.26,  cum: 78.17,  od: 8.25,  maxOd:  8.25, stab: false, hl: null  },
];

const MAX_CUM    = 80;
const BAR_H      = 36;   // px nominal pipe height
const MAX_OD_REF = 12.25; // largest OD for scaling

// ── BHA VISUALISER ─────────────────────────────────────────────────────────
function BHAVis({ option, gwdSel, mwdSel, setGwdSel, setMwdSel }) {
  const display = BHA.filter(c => c.cum <= MAX_CUM);
  return (
    <div style={{ position: 'relative', marginBottom: 52, marginTop: 24 }}>

      {/* GWD labels — above the bar */}
      {option === 'A' && GWD_POS.map((p, i) => (
        <div key={i} onClick={() => setGwdSel(i)}
          style={{
            position: 'absolute', left: `${(parseFloat(p.label) / MAX_CUM) * 100}%`,
            top: -26, transform: 'translateX(-50%)', fontSize: 9,
            color: gwdSel === i ? '#f59e0b' : '#78716c', cursor: 'pointer',
            fontWeight: gwdSel === i ? 'bold' : 'normal', textAlign: 'center', whiteSpace: 'nowrap',
          }}>
          {p.label} {gwdSel === i ? '▼' : '▽'}
        </div>
      ))}
      {(option === 'B' || option === 'C') && (
        <div style={{
          position: 'absolute', left: `${(11.94 / MAX_CUM) * 100}%`, top: -26,
          transform: 'translateX(-50%)', fontSize: 9, color: '#f59e0b',
          fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap',
        }}>
          GWD 11.94 m ▼
        </div>
      )}

      {/* Pipe body */}
      <div style={{ position: 'relative', height: BAR_H + 28, background: '#1e293b', borderRadius: 4, overflow: 'visible' }}>
        {/* Bit */}
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 8,
          height: BAR_H + 28, background: '#dc2626', borderRadius: '4px 0 0 4px', zIndex: 2,
        }} />

        {display.map((c, i) => {
          const x   = ((c.cum - c.len) / MAX_CUM) * 100;
          const w   = Math.max((c.len  / MAX_CUM) * 100, 0.3);
          const h   = Math.round((c.maxOd / MAX_OD_REF) * (BAR_H + 24));
          const top = Math.round((BAR_H + 28 - h) / 2);
          const col = c.hl === 'gwd' ? '#f59e0b'
                    : c.hl === 'mwd' ? '#06b6d4'
                    : c.stab         ? '#16a34a'
                    : c.grade === 'P550' ? '#8b5cf6' : '#475569';
          return (
            <div key={i} title={`${c.name}\n${c.cum.toFixed(2)} m cum | OD ${c.od}" | Max OD ${c.maxOd}"`}
              style={{
                position: 'absolute', left: `${x}%`, width: `${w}%`,
                top, height: h, background: col,
                borderRight: '1px solid #0f172a', zIndex: 1,
                borderRadius: c.stab ? 3 : 0,
              }} />
          );
        })}

        {/* Scale ticks */}
        {[0, 10, 20, 30, 40, 50, 60, 70, 80].map(m => (
          <div key={m} style={{
            position: 'absolute', left: `${(m / MAX_CUM) * 100}%`,
            bottom: -18, transform: 'translateX(-50%)', fontSize: 9, color: '#64748b',
          }}>{m}m</div>
        ))}
      </div>

      {/* MWD labels — below the bar */}
      {option === 'A' && MWD_POS.map((p, i) => (
        <div key={i} onClick={() => setMwdSel(i)}
          style={{
            position: 'absolute', left: `${(parseFloat(p.label) / MAX_CUM) * 100}%`,
            bottom: -30, transform: 'translateX(-50%)', fontSize: 9,
            color: mwdSel === i ? '#06b6d4' : '#78716c', cursor: 'pointer',
            fontWeight: mwdSel === i ? 'bold' : 'normal', textAlign: 'center', whiteSpace: 'nowrap',
          }}>
          {mwdSel === i ? '▲' : '△'} {p.label}
        </div>
      ))}
      {(option === 'B' || option === 'C') && (
        <div style={{
          position: 'absolute', left: `${(27.66 / MAX_CUM) * 100}%`, bottom: -30,
          transform: 'translateX(-50%)', fontSize: 9, color: '#06b6d4',
          fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap',
        }}>
          ▲ MWD 27.66 m
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 42, fontSize: 10 }}>
        {[['Bit','#dc2626'],['GWD','#f59e0b'],['MWD','#06b6d4'],
          ['Stabilizer','#16a34a'],['P550','#8b5cf6'],['G-105','#475569']].map(([l, c]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94a3b8' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: c, borderRadius: 2 }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 4-CURVE INCLINATION CHART ──────────────────────────────────────────────
function IncChart({ rawData, gwdSag, mwdSag }) {
  const cd = rawData.map(r => {
    const raw = r.rawInc;
    return {
      md:       r.md,
      gwdRaw:   raw,
      gwdCorr:  gwdSag !== null ? +(raw - gwdSag).toFixed(2) : undefined,
      mwdRaw:   raw,
      mwdCorr:  mwdSag !== null ? +(raw - mwdSag).toFixed(2) : undefined,
    };
  });

  const lines = [
    { key: 'gwdRaw',  label: 'GWD — Raw Inc',       color: '#f97316', dash: ''    },
    { key: 'gwdCorr', label: 'GWD — Sag Corrected', color: '#f59e0b', dash: '5 3' },
    { key: 'mwdRaw',  label: 'MWD — Raw Inc',       color: '#38bdf8', dash: ''    },
    { key: 'mwdCorr', label: 'MWD — Sag Corrected', color: '#06b6d4', dash: '5 3' },
  ];

  return (
    <div style={{ background: '#1e293b', borderRadius: 8, padding: 12, height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={cd} margin={{ top: 8, right: 24, left: 0, bottom: 20 }}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
          <XAxis dataKey="md" tick={{ fill: '#94a3b8', fontSize: 9 }}
            label={{ value: 'MD (m)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} domain={[77.5, 82]}
            label={{ value: 'Inclination (°)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', fontSize: 10 }}
            labelFormatter={v => `MD: ${v} m`} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
          <ReferenceLine y={78.75} stroke="#475569" strokeDasharray="4 4"
            label={{ value: 'Plan 78.75°', fill: '#64748b', fontSize: 8, position: 'right' }} />
          {lines.map(l =>
            cd[0]?.[l.key] !== undefined
              ? <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color}
                  strokeDasharray={l.dash} dot={{ r: 1.5 }} strokeWidth={1.8} name={l.label} />
              : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function Stage6SagTool({ option = 'A' }) {
  const [tab, setTab]           = useState(0);

  // Option A state
  const [gwdSel,    setGwdSel]  = useState(null);
  const [mwdSel,    setMwdSel]  = useState(null);
  const [sagSign,   setSagSign] = useState(null); // "minus" | "plus"
  const [submitted, setSubmitted] = useState(false);

  // Option B state — GWD default intentionally wrong (index 0)
  const [gwdSelB, setGwdSelB]   = useState(0);
  const [mwdSelB, setMwdSelB]   = useState(0);

  const resetA = () => { setGwdSel(null); setMwdSel(null); setSagSign(null); setSubmitted(false); };

  // ── Active sag values ─────────────────────────────────────────────────────
  const gwdSag = useMemo(() => {
    if (option === 'C') return +0.18;
    if (option === 'B') return GWD_POS[gwdSelB].sag;
    if (option === 'A' && submitted && gwdSel !== null && sagSign) {
      const v = GWD_POS[gwdSel].sag;
      return sagSign === 'minus' ? v : -v;
    }
    return null;
  }, [option, gwdSel, gwdSelB, sagSign, submitted]);

  const mwdSag = useMemo(() => {
    if (option === 'C') return -0.07;
    if (option === 'B') return MWD_POS[mwdSelB].sag;
    if (option === 'A' && submitted && mwdSel !== null && sagSign) {
      const v = MWD_POS[mwdSel].sag;
      return sagSign === 'minus' ? v : -v;
    }
    return null;
  }, [option, mwdSel, mwdSelB, sagSign, submitted]);

  const rawData = useMemo(() => RAW_DATA.map(d => ({ md: d.md, rawInc: calcInc(d), ...d })), []);
  const DEPTHS  = Array.from({ length: 15 }, (_, i) => 1700 + i * 100);

  const gwdCorrA = option === 'A' && submitted && gwdSel !== null && GWD_POS[gwdSel].correct && sagSign === 'minus';
  const mwdCorrA = option === 'A' && submitted && mwdSel !== null && MWD_POS[mwdSel].correct && sagSign === 'minus';
  const gwdCorrB = GWD_POS[gwdSelB].correct;
  const mwdCorrB = MWD_POS[mwdSelB].correct;

  function downloadCSV() {
    const hdr  = 'MD(m),Raw Inc(deg),GWD Sag Corr Inc(deg),MWD Sag Corr Inc(deg)';
    const rows = rawData.map(r => {
      const gc = gwdSag !== null ? +(r.rawInc - gwdSag).toFixed(2) : '';
      const mc = mwdSag !== null ? +(r.rawInc - mwdSag).toFixed(2) : '';
      return `${r.md},${r.rawInc},${gc},${mc}`;
    }).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([hdr + '\n' + rows], { type: 'text/csv' }));
    a.download = 'Stage6_SagCorrected.csv';
    a.click();
  }

  // ── Shared mini-styles ────────────────────────────────────────────────────
  const card = { background: '#1e293b', borderRadius: 8, padding: 14, marginBottom: 12 };
  const th   = { padding: '5px 8px', textAlign: 'left', borderBottom: '1px solid #334155', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: 11 };
  const trBg = i => ({ background: i % 2 === 0 ? '#1e293b' : '#172032' });

  const TABS = option === 'C'
    ? ["BHA & Sag Report", "Raw Data (G's)", "Inclination Plot", "Export"]
    : ["BHA & Raw Data",   "Sag Report",     "Inclination Plot"];

  const safeTab = Math.min(tab, TABS.length - 1);

  return (
    <div style={{ fontFamily: 'Arial,sans-serif', fontSize: 13, background: '#0f172a', color: '#e2e8f0', minHeight: '100vh', padding: 12 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#0c4a6e)', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: '#38bdf8' }}>
          Stage 6 – BHA Sag Correction | A02 @ Slot01 | 12¼" Section
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
          Mud Weight: 1.22 SG | Hole Dia: 12.25" | Off-bottom drilling | Open hole
        </div>
        {option === 'A' && <div style={{ marginTop: 5, fontSize: 11, color: '#fbbf24' }}>⚠️ Option A: Exact sensor positions <strong>not disclosed</strong>. Four candidates per sensor. Calculate inclination from G's, identify the right position and apply the correction yourself.</div>}
        {option === 'B' && <div style={{ marginTop: 5, fontSize: 11, color: '#7dd3fc' }}>ℹ️ Option B: Sensor positions provided — but the <strong>default GWD position is wrong</strong>. Select the correct one. Raw inclination is pre-calculated.</div>}
        {option === 'C' && <div style={{ marginTop: 5, fontSize: 11, color: '#86efac' }}>✅ Option C: Sag correction already applied. Do <strong>NOT</strong> apply it again.</div>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 'bold',
            background: safeTab === i ? '#0284c7' : '#1e293b',
            color:      safeTab === i ? 'white'   : '#94a3b8',
          }}>{t}</button>
        ))}
      </div>

      {/* ── TAB 0 — BHA & Raw Data (A & B) ─────────────────────────────── */}
      {safeTab === 0 && option !== 'C' && (
        <div>
          <div style={card}>
            <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: 8, fontSize: 13 }}>
              BHA Visualization — first 80 m from bit
            </div>
            {option === 'A' && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                Click GWD candidates (above bar) and MWD candidates (below bar) to select positions. Cross-check with the component table.
              </div>
            )}
            <BHAVis option={option} gwdSel={gwdSel} mwdSel={mwdSel} setGwdSel={setGwdSel} setMwdSel={setMwdSel} />
          </div>

          <div style={{ ...card, overflowX: 'auto' }}>
            <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: 6, fontSize: 13 }}>
              MWD Raw Accelerometer Data
              {option === 'A' && <span style={{ color: '#94a3b8', fontWeight: 'normal', fontSize: 11 }}> — G's only; apply I = cos⁻¹(Gz / √(Gx²+Gy²+Gz²)) yourself</span>}
              {option === 'B' && <span style={{ color: '#94a3b8', fontWeight: 'normal', fontSize: 11 }}> — inclination pre-calculated</span>}
            </div>
            <div style={{ background: '#0c2d4a', borderRadius: 5, padding: '5px 12px', fontFamily: 'monospace', fontSize: 11, color: '#7dd3fc', marginBottom: 8, display: 'inline-block' }}>
              I = cos⁻¹( Gz / √(Gx² + Gy² + Gz²) )
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
              <thead><tr>
                <th style={th}>MD (m)</th>
                <th style={{ ...th, color: '#a3e635' }}>Gz (g)</th>
                <th style={{ ...th, color: '#818cf8' }}>Gx (g)</th>
                <th style={{ ...th, color: '#f9a8d4' }}>Gy (g)</th>
                {option === 'B' && <th style={{ ...th, color: '#e2e8f0' }}>Raw Inc (°)</th>}
              </tr></thead>
              <tbody>{RAW_DATA.map((d, i) => (
                <tr key={i} style={trBg(i)}>
                  <td style={{ padding: '3px 8px', fontWeight: 'bold' }}>{d.md}</td>
                  <td style={{ padding: '3px 8px', color: '#a3e635' }}>{d.gz}</td>
                  <td style={{ padding: '3px 8px', color: '#818cf8' }}>{d.gx}</td>
                  <td style={{ padding: '3px 8px', color: '#f9a8d4' }}>{d.gy}</td>
                  {option === 'B' && <td style={{ padding: '3px 8px', fontWeight: 'bold' }}>{calcInc(d)}</td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 0 — BHA & Sag Report (C) ────────────────────────────────── */}
      {safeTab === 0 && option === 'C' && (
        <div>
          <div style={card}>
            <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: 8, fontSize: 13 }}>BHA Visualization — first 80 m from bit</div>
            <BHAVis option="C" gwdSel={null} mwdSel={null} setGwdSel={() => {}} setMwdSel={() => {}} />
          </div>
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid #f59e0b', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 11 }}>
            <strong style={{ color: '#fbbf24' }}>⚠️ Option C:</strong> Sag already applied. Do <strong>NOT</strong> apply again.
          </div>
          <div style={{ ...card, overflowX: 'auto' }}>
            <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: 6, fontSize: 13 }}>Pre-Drilling Sag Report (Planned A02)</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8, fontSize: 11 }}>
              {[['GWD Position', '11.94 m from bit', '#f59e0b'], ['GWD Sag', '+0.18°', '#f59e0b'],
                ['MWD Position', '27.66 m from bit', '#06b6d4'], ['MWD Sag', '−0.07°', '#06b6d4']].map(([l, v, c]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '5px 10px', borderLeft: `3px solid ${c}` }}>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{l}</div>
                  <div style={{ fontWeight: 'bold', color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
              <thead><tr>
                <th style={th}>Depth (m)</th><th style={th}>Planned Inc (°)</th>
                <th style={{ ...th, color: '#f59e0b' }}>GWD Corr Inc (°)</th>
                <th style={{ ...th, color: '#f59e0b' }}>GWD Sag (°)</th>
                <th style={{ ...th, color: '#06b6d4' }}>MWD Corr Inc (°)</th>
                <th style={{ ...th, color: '#06b6d4' }}>MWD Sag (°)</th>
              </tr></thead>
              <tbody>{DEPTHS.map((dep, i) => (
                <tr key={i} style={trBg(i)}>
                  <td style={{ padding: '3px 8px', fontWeight: 'bold' }}>{dep}</td>
                  <td style={{ padding: '3px 8px' }}>78.75</td>
                  <td style={{ padding: '3px 8px', color: '#f59e0b' }}>78.57</td>
                  <td style={{ padding: '3px 8px', color: '#f59e0b' }}>+0.18</td>
                  <td style={{ padding: '3px 8px', color: '#06b6d4' }}>78.82</td>
                  <td style={{ padding: '3px 8px', color: '#06b6d4' }}>−0.07</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 1 — Sag Report (A) ───────────────────────────────────────── */}
      {safeTab === 1 && option === 'A' && (
        <div>
          <div style={card}>
            <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: 8, fontSize: 13 }}>
              Sag Report — 4 Candidate Sensor Positions
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
              Four possible positions listed per sensor. Cross-check with the BHA to identify the correct one, then apply the right sign convention.
            </div>

            {/* GWD selector */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 'bold', color: '#f59e0b', marginBottom: 6, fontSize: 12 }}>GWD Sensor — Select position:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {GWD_POS.map((p, i) => (
                  <button key={i} onClick={() => setGwdSel(i)} style={{
                    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                    border: `2px solid ${gwdSel === i ? '#f59e0b' : '#334155'}`,
                    background: gwdSel === i ? 'rgba(245,158,11,0.15)' : '#0f172a',
                    color: gwdSel === i ? '#f59e0b' : '#64748b',
                  }}>
                    {p.label}<br />
                    <span style={{ fontSize: 10 }}>Sag = {p.sag > 0 ? '+' : ''}{p.sag}°</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MWD selector */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 'bold', color: '#06b6d4', marginBottom: 6, fontSize: 12 }}>MWD Sensor — Select position:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MWD_POS.map((p, i) => (
                  <button key={i} onClick={() => setMwdSel(i)} style={{
                    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                    border: `2px solid ${mwdSel === i ? '#06b6d4' : '#334155'}`,
                    background: mwdSel === i ? 'rgba(6,182,212,0.15)' : '#0f172a',
                    color: mwdSel === i ? '#06b6d4' : '#64748b',
                  }}>
                    {p.label}<br />
                    <span style={{ fontSize: 10 }}>Sag = {p.sag > 0 ? '+' : ''}{p.sag}°</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sign convention */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 'bold', color: '#e2e8f0', marginBottom: 6, fontSize: 12 }}>
                Sign convention — Corrected Inc = Raw Inc <span style={{ color: '#fbbf24' }}>___</span> Sag:
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['minus', '− Subtract'], ['plus', '+ Add']].map(([v, l]) => (
                  <button key={v} onClick={() => setSagSign(v)} style={{
                    padding: '6px 18px', borderRadius: 6, fontWeight: 'bold', fontSize: 12, cursor: 'pointer',
                    border: `2px solid ${sagSign === v ? '#fbbf24' : '#334155'}`,
                    background: sagSign === v ? 'rgba(251,191,36,0.15)' : '#0f172a',
                    color: sagSign === v ? '#fbbf24' : '#64748b',
                  }}>{l}</button>
                ))}
              </div>
            </div>

            <button onClick={() => setSubmitted(true)}
              disabled={gwdSel === null || mwdSel === null || !sagSign}
              style={{
                padding: '7px 22px', borderRadius: 8, border: 'none', fontWeight: 'bold', fontSize: 12,
                cursor: gwdSel === null || mwdSel === null || !sagSign ? 'not-allowed' : 'pointer',
                background: gwdSel === null || mwdSel === null || !sagSign ? '#334155' : '#0284c7',
                color: 'white',
              }}>
              Apply Correction & View Results
            </button>
            {submitted && (
              <button onClick={resetA} style={{ marginLeft: 8, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#334155', color: '#94a3b8', fontSize: 11 }}>
                Reset
              </button>
            )}
          </div>

          {submitted && (
            <div style={card}>
              <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: 8, fontSize: 13 }}>Your Results</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                {[[gwdCorrA, 'GWD', '#f59e0b', GWD_POS[gwdSel]], [mwdCorrA, 'MWD', '#06b6d4', MWD_POS[mwdSel]]].map(([ok, lbl, col, p]) => (
                  <div key={lbl} style={{
                    flex: 1, minWidth: 200, borderRadius: 8, padding: 10,
                    background: ok ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                    borderLeft: `3px solid ${ok ? '#16a34a' : '#dc2626'}`,
                  }}>
                    <div style={{ fontWeight: 'bold', color: col, marginBottom: 3 }}>{lbl}</div>
                    <div style={{ fontSize: 11 }}>{p.label} → Sag {p.sag > 0 ? '+' : ''}{p.sag}°</div>
                    <div style={{ fontSize: 11, marginTop: 3, color: ok ? '#86efac' : '#fca5a5' }}>
                      {ok ? '✓ Correct!' : '✗ Not quite — review BHA and/or sign convention'}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>→ Go to Inclination Plot to visualise all 4 curves.</div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 1 — Sag Report (B) ───────────────────────────────────────── */}
      {safeTab === 1 && option === 'B' && (
        <div style={card}>
          <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: 8, fontSize: 13 }}>Sag Report — Select Correct Sensor Positions</div>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 6, padding: 8, marginBottom: 12, fontSize: 11, color: '#fca5a5' }}>
            ⚠️ Default GWD position is <strong>incorrect</strong>. Compare with the BHA and select the right one. The table updates live.
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 14 }}>
            {/* GWD */}
            <div>
              <div style={{ fontWeight: 'bold', color: '#f59e0b', marginBottom: 6, fontSize: 12 }}>GWD Sensor Position:</div>
              {GWD_POS.map((p, i) => (
                <button key={i} onClick={() => setGwdSelB(i)} style={{
                  display: 'flex', justifyContent: 'space-between', gap: 24, width: 240,
                  padding: '6px 12px', borderRadius: 6, marginBottom: 4, cursor: 'pointer', fontSize: 11,
                  border: `2px solid ${gwdSelB === i ? '#f59e0b' : '#334155'}`,
                  background: gwdSelB === i ? 'rgba(245,158,11,0.15)' : '#0f172a',
                  color: gwdSelB === i ? '#f59e0b' : '#64748b',
                }}>
                  <span>{p.label} {i === 0 && <span style={{ color: '#ef4444', fontSize: 9 }}>(default)</span>}</span>
                  <span>Sag {p.sag > 0 ? '+' : ''}{p.sag}°</span>
                </button>
              ))}
              <div style={{ fontSize: 11, marginTop: 4, color: gwdCorrB ? '#86efac' : '#fca5a5' }}>
                {gwdCorrB ? '✓ Correct GWD position' : '✗ Wrong — check the BHA'}
              </div>
            </div>
            {/* MWD */}
            <div>
              <div style={{ fontWeight: 'bold', color: '#06b6d4', marginBottom: 6, fontSize: 12 }}>MWD Sensor Position:</div>
              {MWD_POS.map((p, i) => (
                <button key={i} onClick={() => setMwdSelB(i)} style={{
                  display: 'flex', justifyContent: 'space-between', gap: 24, width: 240,
                  padding: '6px 12px', borderRadius: 6, marginBottom: 4, cursor: 'pointer', fontSize: 11,
                  border: `2px solid ${mwdSelB === i ? '#06b6d4' : '#334155'}`,
                  background: mwdSelB === i ? 'rgba(6,182,212,0.15)' : '#0f172a',
                  color: mwdSelB === i ? '#06b6d4' : '#64748b',
                }}>
                  <span>{p.label} {i === 0 && <span style={{ color: '#86efac', fontSize: 9 }}>(default)</span>}</span>
                  <span>Sag {p.sag > 0 ? '+' : ''}{p.sag}°</span>
                </button>
              ))}
              <div style={{ fontSize: 11, marginTop: 4, color: mwdCorrB ? '#86efac' : '#fca5a5' }}>
                {mwdCorrB ? '✓ Correct MWD position' : '✗ Check BHA'}
              </div>
            </div>
          </div>
          {/* Live table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
              <thead><tr>
                <th style={th}>Depth (m)</th>
                <th style={th}>Planned Inc (°)</th>
                <th style={{ ...th, color: gwdCorrB ? '#86efac' : '#ef4444' }}>
                  GWD Corr Inc [{GWD_POS[gwdSelB].sag > 0 ? '+' : ''}{GWD_POS[gwdSelB].sag}°]
                </th>
                <th style={{ ...th, color: '#94a3b8' }}>
                  MWD Corr Inc [{MWD_POS[mwdSelB].sag > 0 ? '+' : ''}{MWD_POS[mwdSelB].sag}°]
                </th>
              </tr></thead>
              <tbody>{DEPTHS.map((dep, i) => (
                <tr key={i} style={trBg(i)}>
                  <td style={{ padding: '3px 8px', fontWeight: 'bold' }}>{dep}</td>
                  <td style={{ padding: '3px 8px' }}>78.75</td>
                  <td style={{ padding: '3px 8px', color: '#f59e0b' }}>{+(78.75 - GWD_POS[gwdSelB].sag).toFixed(2)}</td>
                  <td style={{ padding: '3px 8px', color: '#06b6d4' }}>{+(78.75 - MWD_POS[mwdSelB].sag).toFixed(2)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 1 — Raw Data G's (C) ─────────────────────────────────────── */}
      {safeTab === 1 && option === 'C' && (
        <div style={{ ...card, overflowX: 'auto' }}>
          <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: 6, fontSize: 13 }}>Raw Accelerometer Data + Calculated Inclination</div>
          <div style={{ background: '#0c2d4a', borderRadius: 5, padding: '5px 12px', fontFamily: 'monospace', fontSize: 11, color: '#7dd3fc', marginBottom: 8, display: 'inline-block' }}>
            I = cos⁻¹( Gz / √(Gx² + Gy² + Gz²) )
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
            <thead><tr>
              <th style={th}>MD (m)</th>
              <th style={{ ...th, color: '#a3e635' }}>Gz (g)</th>
              <th style={{ ...th, color: '#818cf8' }}>Gx (g)</th>
              <th style={{ ...th, color: '#f9a8d4' }}>Gy (g)</th>
              <th style={th}>Raw Inc (°)</th>
              <th style={{ ...th, color: '#f59e0b' }}>GWD Corr Inc (°)</th>
              <th style={{ ...th, color: '#06b6d4' }}>MWD Corr Inc (°)</th>
            </tr></thead>
            <tbody>{RAW_DATA.map((d, i) => {
              const raw = calcInc(d);
              return (
                <tr key={i} style={trBg(i)}>
                  <td style={{ padding: '3px 8px', fontWeight: 'bold' }}>{d.md}</td>
                  <td style={{ padding: '3px 8px', color: '#a3e635' }}>{d.gz}</td>
                  <td style={{ padding: '3px 8px', color: '#818cf8' }}>{d.gx}</td>
                  <td style={{ padding: '3px 8px', color: '#f9a8d4' }}>{d.gy}</td>
                  <td style={{ padding: '3px 8px' }}>{raw}</td>
                  <td style={{ padding: '3px 8px', color: '#f59e0b' }}>{+(raw - 0.18).toFixed(2)}</td>
                  <td style={{ padding: '3px 8px', color: '#06b6d4' }}>{+(raw + 0.07).toFixed(2)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}

      {/* ── TAB 2 — Inclination Plot (all options) ───────────────────────── */}
      {safeTab === 2 && (
        <div>
          <div style={card}>
            <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: 6, fontSize: 13 }}>
              Inclination — Raw vs Sag Corrected (GWD &amp; MWD — 4 curves)
            </div>
            {option === 'A' && !submitted && (
              <div style={{ color: '#fbbf24', fontSize: 11 }}>⚠️ Go to Sag Report tab first — select positions and sign convention, then click Apply.</div>
            )}
            {option === 'A' && submitted && (
              <div style={{ color: '#94a3b8', fontSize: 11 }}>
                GWD sag used: {GWD_POS[gwdSel].sag > 0 ? '+' : ''}{GWD_POS[gwdSel].sag}° | MWD sag used: {MWD_POS[mwdSel].sag > 0 ? '+' : ''}{MWD_POS[mwdSel].sag}°
                {(!gwdCorrA || !mwdCorrA) && ' — one or more selections incorrect.'}
              </div>
            )}
            {option === 'B' && (
              <div style={{ color: '#94a3b8', fontSize: 11 }}>
                Live: GWD {GWD_POS[gwdSelB].label} ({GWD_POS[gwdSelB].sag > 0 ? '+' : ''}{GWD_POS[gwdSelB].sag}°) | MWD {MWD_POS[mwdSelB].label} ({MWD_POS[mwdSelB].sag > 0 ? '+' : ''}{MWD_POS[mwdSelB].sag}°)
              </div>
            )}
          </div>
          <IncChart rawData={rawData} gwdSag={gwdSag} mwdSag={mwdSag} />
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            {[['+0.18°', 'GWD sag positive → BHA bends upward → corrected inc LOWER than raw', '#f59e0b'],
              ['−0.07°', 'MWD sag negative → BHA bends downward → corrected inc HIGHER than raw', '#06b6d4']].map(([t, d, c]) => (
              <div key={t} style={{ flex: 1, minWidth: 220, background: '#1e293b', borderRadius: 7, padding: 9, borderLeft: `3px solid ${c}` }}>
                <div style={{ fontWeight: 'bold', color: c, marginBottom: 3, fontSize: 12 }}>{t}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3 — Export (C only) ──────────────────────────────────────── */}
      {safeTab === 3 && option === 'C' && (
        <div>
          <div style={card}>
            <div style={{ fontWeight: 'bold', color: '#38bdf8', fontSize: 14, marginBottom: 8 }}>Export Sag-Corrected Inclination Data</div>
            <button onClick={downloadCSV} style={{
              padding: '9px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#0284c7,#0369a1)', color: 'white', fontWeight: 'bold', fontSize: 13,
            }}>⬇ Download CSV</button>
          </div>
          <div style={{ ...card, overflowX: 'auto' }}>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>Preview — first 10 rows</div>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
              <thead><tr>
                <th style={th}>MD (m)</th>
                <th style={th}>Raw Inc (°)</th>
                <th style={{ ...th, color: '#f59e0b' }}>GWD Corr (°)</th>
                <th style={{ ...th, color: '#06b6d4' }}>MWD Corr (°)</th>
              </tr></thead>
              <tbody>{rawData.slice(0, 10).map((r, i) => (
                <tr key={i} style={trBg(i)}>
                  <td style={{ padding: '3px 8px', fontWeight: 'bold' }}>{r.md}</td>
                  <td style={{ padding: '3px 8px' }}>{r.rawInc}</td>
                  <td style={{ padding: '3px 8px', color: '#f59e0b' }}>{+(r.rawInc - 0.18).toFixed(2)}</td>
                  <td style={{ padding: '3px 8px', color: '#06b6d4' }}>{+(r.rawInc + 0.07).toFixed(2)}</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ color: '#64748b', fontSize: 10, marginTop: 5 }}>{rawData.length} total rows in CSV</div>
          </div>
        </div>
      )}
    </div>
  );
}