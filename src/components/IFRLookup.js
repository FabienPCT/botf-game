// src/components/IFRLookup.js
// Interactive IFR depth-point lookup shown for Stage 3 Option A
// Interpolates Dec / Dip / Btot baseline values between IFR points

import { useState } from "react";

// IFR data sets — keyed by well
const IFR_DATA = {
  AA16: {
    label: "AA16 (Target Well)",
    model: "GRGM2013",
    date:  "April 10, 2008",
    btot:  50329.88,
    dip:   70.76,
    dec:   0.52,
    note:  "Depth relative to 24.5 m above MSL",
    toolcode: "MWD_OWSG_Rev5 + IFR",
    points: [
      { id:"P01", tvdss:0,    md:0,    dec:0.50, dip:70.78, btot:50297.60 },
      { id:"P02", tvdss:200,  md:240,  dec:0.50, dip:70.77, btot:50296.30 },
      { id:"P03", tvdss:1202, md:1250, dec:0.51, dip:70.76, btot:50308.70 },
      { id:"P04", tvdss:2378, md:2600, dec:0.52, dip:70.75, btot:50337.50 },
      { id:"P05", tvdss:3628, md:4050, dec:0.54, dip:70.75, btot:50359.20 },
      { id:"P06", tvdss:4565, md:5125, dec:0.55, dip:70.74, btot:50380.00 },
    ],
  },
  RW: {
    label: "Relief Well",
    model: "Reference 2013",
    date:  "June 15, 2013",
    btot:  50034.06,
    dip:   69.68,
    dec:   -0.16,
    note:  "Depth relative to MSL",
    toolcode: "MWD_OWSG_Rev5 + IFR",
    points: [
      { id:"P01", tvdss:200,  md:null, dec:-0.17, dip:69.68, btot:50057.40 },
      { id:"P02", tvdss:1000, md:null, dec:-0.17, dip:69.68, btot:50036.10 },
      { id:"P03", tvdss:1800, md:null, dec:-0.17, dip:69.68, btot:50033.10 },
      { id:"P04", tvdss:2600, md:null, dec:-0.16, dip:69.67, btot:50021.70 },
      { id:"P05", tvdss:3400, md:null, dec:-0.16, dip:69.67, btot:50022.00 },
    ],
  },
};

function lerp(a, b, t) { return a + (b - a) * t; }

function interpolate(points, tvdss) {
  if (tvdss <= points[0].tvdss) return points[0];
  if (tvdss >= points[points.length-1].tvdss) return points[points.length-1];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p1 = points[i+1];
    if (tvdss >= p0.tvdss && tvdss <= p1.tvdss) {
      const t = (tvdss - p0.tvdss) / (p1.tvdss - p0.tvdss);
      return {
        dec:  lerp(p0.dec,  p1.dec,  t),
        dip:  lerp(p0.dip,  p1.dip,  t),
        btot: lerp(p0.btot, p1.btot, t),
      };
    }
  }
  return null;
}

export default function IFRLookup({ clr }) {
  const [well, setWell]       = useState("AA16");
  const [tvdss, setTvdss]     = useState("");
  const [result, setResult]   = useState(null);
  const [copied, setCopied]   = useState(false);

  const data = IFR_DATA[well];

  const lookup = () => {
    const v = parseFloat(tvdss);
    if (isNaN(v)) { setResult(null); return; }
    setResult(interpolate(data.points, v));
  };

  const copyResult = () => {
    if (!result) return;
    const txt = `Well: ${data.label}\nTVDSS: ${tvdss} m\nDeclination: ${result.dec.toFixed(3)}°\nDip: ${result.dip.toFixed(3)}°\nBtot: ${result.btot.toFixed(1)} nT`;
    navigator.clipboard.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };

  return (
    <div className={`rounded-lg border ${clr.border} overflow-hidden mb-4`}>
      {/* Header */}
      <div className={`${clr.h} px-3 py-2 flex items-center gap-2`}>
        <span className="text-white text-xs font-bold">🧭 IFR Depth Lookup</span>
        <span className="text-white text-xs opacity-70 ml-1">— interpolate between IFR points</span>
      </div>

      <div className={`${clr.light} p-3`}>
        {/* Well selector */}
        <div className="flex gap-2 mb-3">
          {Object.entries(IFR_DATA).map(([k, d]) => (
            <button key={k} onClick={() => { setWell(k); setResult(null); setTvdss(""); }}
              className={`px-3 py-1 rounded text-xs font-bold border transition-all
                ${well === k ? `${clr.h} text-white border-transparent` : "bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700"}`}>
              {d.label}
            </button>
          ))}
        </div>

        {/* Model info */}
        <div className="bg-gray-900 rounded p-2 mb-3 text-xs space-y-0.5">
          <div className="flex gap-4 flex-wrap">
            <span className="text-gray-400">Model: <span className="text-blue-300 font-bold">{data.model}</span></span>
            <span className="text-gray-400">Date: <span className="text-blue-300">{data.date}</span></span>
            <span className="text-gray-400">Toolcode: <span className="text-green-300">{data.toolcode}</span></span>
          </div>
          <div className="flex gap-4 flex-wrap">
            <span className="text-gray-400">Btot: <span className="text-yellow-300">{data.btot} nT</span></span>
            <span className="text-gray-400">Dip: <span className="text-yellow-300">{data.dip}°</span></span>
            <span className="text-gray-400">Dec: <span className="text-yellow-300">{data.dec}°</span></span>
          </div>
          <div className="text-gray-600 italic">{data.note}</div>
        </div>

        {/* IFR point reference table */}
        <div className="overflow-x-auto mb-3">
          <table style={{borderCollapse:"collapse", fontSize:"11px", width:"100%"}}>
            <thead>
              <tr>
                {["Point","TVDSS (m)","MD (m)","Dec Baseline (°)","Dip Baseline (°)","Btot Baseline (nT)"].map((h,i) => (
                  <th key={i} style={{background:"#1f2937",color:"#9ca3af",padding:"3px 8px",border:"1px solid #374151",whiteSpace:"nowrap",textAlign:"left"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.points.map((p, i) => (
                <tr key={i}
                  onClick={() => { setTvdss(String(p.tvdss)); setResult({dec:p.dec, dip:p.dip, btot:p.btot}); }}
                  style={{cursor:"pointer"}}
                  onMouseEnter={e => e.currentTarget.style.background="#1f2937"}
                  onMouseLeave={e => e.currentTarget.style.background=""}>
                  <td style={{padding:"3px 8px",border:"1px solid #374151",color:"#60a5fa",fontWeight:"bold",fontFamily:"monospace"}}>{p.id}</td>
                  <td style={{padding:"3px 8px",border:"1px solid #374151",color:"#d1d5db",fontFamily:"monospace"}}>{p.tvdss}</td>
                  <td style={{padding:"3px 8px",border:"1px solid #374151",color:"#d1d5db",fontFamily:"monospace"}}>{p.md ?? "—"}</td>
                  <td style={{padding:"3px 8px",border:"1px solid #374151",color:"#fde68a",fontWeight:"bold",fontFamily:"monospace"}}>{p.dec.toFixed(2)}</td>
                  <td style={{padding:"3px 8px",border:"1px solid #374151",color:"#fde68a",fontWeight:"bold",fontFamily:"monospace"}}>{p.dip.toFixed(2)}</td>
                  <td style={{padding:"3px 8px",border:"1px solid #374151",color:"#fde68a",fontWeight:"bold",fontFamily:"monospace"}}>{p.btot.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-gray-600 mt-1 italic">Click a row to select it, or enter a custom TVDSS below</div>
        </div>

        {/* Interpolation input */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-gray-400 shrink-0">Enter TVDSS (m):</label>
          <input
            type="number"
            className={`bg-gray-800 border ${clr.border} text-white text-sm font-bold rounded px-2 py-1 w-32 focus:outline-none`}
            placeholder="e.g. 800"
            value={tvdss}
            onChange={e => { setTvdss(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === "Enter" && lookup()} />
          <button onClick={lookup}
            className={`${clr.btn} text-white text-xs px-3 py-1.5 rounded font-bold`}>
            Lookup →
          </button>
          {result && (
            <button onClick={copyResult}
              className="text-xs px-2 py-1.5 rounded border border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white">
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-3 rounded-lg border ${clr.border} ${clr.light} p-3`}>
            <div className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wide">
              Interpolated values @ TVDSS {tvdss} m — {data.label}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:"Declination", value:result.dec.toFixed(3), unit:"°", color:"text-orange-300" },
                { label:"Dip (Inc)",   value:result.dip.toFixed(3), unit:"°", color:"text-cyan-300"   },
                { label:"Btot",        value:result.btot.toFixed(1), unit:"nT",color:"text-yellow-300" },
              ].map(f => (
                <div key={f.label} className="bg-gray-900 rounded p-2 text-center">
                  <div className="text-xs text-gray-500 mb-0.5">{f.label}</div>
                  <div className={`text-lg font-black ${f.color}`}>{f.value}<span className="text-xs ml-0.5 font-normal text-gray-500">{f.unit}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}