// src/components/StageRWPlanningTeam.js
//
// Drop-in replacement for StageCard when stage.id === 11 or stage.id === 12.
// Reads/writes from the same "botf/rwplanning" Firestore doc as TabRWPlanning.
//
// Usage in StageCard.js (or TeamDashboard.js):
//
//   import StageRWPlanningTeam from "./StageRWPlanningTeam";
//
//   if (stage.id === 11 || stage.id === 12) {
//     return (
//       <StageRWPlanningTeam
//         stageId={stage.id}
//         teamId={teamId}
//         clr={clr}
//       />
//     );
//   }

import { useState, useEffect } from "react";
import { db } from "../firebase.js";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const COL    = "botf";
const RW_DOC = "rwplanning";

// A04 surface (WGS84 / UTM48N) — used for live separation feedback
const A04_SURFACE = { N: 600606.769, E: 524209.527 };

// ── helpers ───────────────────────────────────────────────────
function parseSurvey(text) {
  return (text || "").trim().split("\n")
    .map(l => l.trim().split(/[\s,;\t]+/).map(Number))
    .filter(r => r.length >= 3 && r.every(n => !isNaN(n)))
    .map(([md, inc, azi]) => ({ md, inc, azi }));
}

function sepColor(dist) {
  if (isNaN(dist) || dist <= 0) return "#9ca3af";
  if (dist < 300)  return "#f87171";
  if (dist < 600)  return "#facc15";
  return "#4ade80";
}

// ── Stage 11 sub-component ────────────────────────────────────
function Stage11Panel({ teamId, td, clr, onUpdate }) {
  const [localN, setLocalN] = useState(td.surfaceN || "");
  const [localE, setLocalE] = useState(td.surfaceE || "");

  // sync if another client updates
  useEffect(() => { setLocalN(td.surfaceN || ""); }, [td.surfaceN]);
  useEffect(() => { setLocalE(td.surfaceE || ""); }, [td.surfaceE]);

  const N    = parseFloat(localN);
  const E    = parseFloat(localE);
  const dN   = N - A04_SURFACE.N;
  const dE   = E - A04_SURFACE.E;
  const dist = Math.sqrt(dN**2 + dE**2);

  const handleSubmit = () => {
    if (isNaN(N) || isNaN(E)) return;
    onUpdate({ surfaceN: N.toFixed(3), surfaceE: E.toFixed(3), s11Submitted: true });
  };

  if (!td.s11Released) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 text-center border border-gray-700">
        <span className="text-2xl">🔒</span>
        <p className="text-xs text-gray-500 mt-2">
          Stage 11 not yet released by the instructor. Stand by.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* CRS reminder */}
      <div className="bg-blue-950 border border-blue-800 rounded-lg px-3 py-2 text-xs text-blue-300">
        <span className="font-bold">CRS:</span> WGS84 / UTM zone 48N (EPSG:32648) —
        from Stage 1 Option C · Stage 2 Option B · Stage 3 Option A
      </div>

      {/* Coordinate inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1 font-semibold">
            Northing (m)
          </label>
          <input
            className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-xs
              font-mono rounded px-2 py-1.5 focus:outline-none focus:border-yellow-500"
            value={localN}
            onChange={e => setLocalN(e.target.value)}
            placeholder="e.g. 600420.000"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1 font-semibold">
            Easting (m)
          </label>
          <input
            className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-xs
              font-mono rounded px-2 py-1.5 focus:outline-none focus:border-yellow-500"
            value={localE}
            onChange={e => setLocalE(e.target.value)}
            placeholder="e.g. 524200.000"
          />
        </div>
      </div>

      {/* Live separation feedback */}
      <div className="bg-gray-900 rounded-lg px-3 py-2 text-xs border border-gray-700">
        <span className="text-gray-400">Separation from A04 wellhead: </span>
        <span className="font-mono font-bold" style={{ color: sepColor(dist) }}>
          {isNaN(dist) || dist <= 0 ? "enter coordinates above" : (
            <>
              ΔN = {dN.toFixed(1)} m &nbsp;|&nbsp;
              ΔE = {dE.toFixed(1)} m &nbsp;|&nbsp;
              2D = {dist.toFixed(0)} m
              {dist < 300 && " ⚠️ too close"}
              {dist >= 300 && dist < 600 && " ⚠️ marginal"}
              {dist >= 600 && " ✓ ok"}
            </>
          )}
        </span>
      </div>

      {/* Constraints reminder */}
      <div className="bg-gray-900 rounded-lg px-3 py-2 text-xs text-gray-400 border border-gray-700 space-y-0.5">
        <p className="font-semibold text-gray-300 mb-1">Selection criteria to consider:</p>
        <p>• Shallow hazards (gas, cables, pipelines, anchors)</p>
        <p>• Seabed slope &lt; 3–5° preferred</p>
        <p>• Wind from W-NW — do not position downwind of blowout</p>
        <p>• Current ESE→SE · Waves from W-NW</p>
        <p>• Vessel ingress/regress (SIMOPS)</p>
        <p>• Target A04 direction &amp; MSA correction azimuth</p>
      </div>

      {/* Submit */}
      {td.s11Submitted ? (
        <div className="rounded-lg px-3 py-2 text-xs font-semibold text-center
          bg-green-900 text-green-300 border border-green-700">
          ✅ Stage 11 submitted — N={td.surfaceN} m | E={td.surfaceE} m
          <button
            onClick={() => onUpdate({ s11Submitted: false })}
            className="ml-3 text-green-500 hover:text-green-300 underline font-normal">
            Edit
          </button>
        </div>
      ) : (
        <button
          disabled={isNaN(N) || isNaN(E)}
          onClick={handleSubmit}
          style={{ background: clr ? undefined : "#ca8a04" }}
          className={`w-full py-2 rounded-lg text-white text-xs font-bold transition-opacity
            hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed
            ${clr ? clr.btn : ""}`}>
          ✅ Submit Stage 11 — Surface Location
        </button>
      )}
    </div>
  );
}

// ── Stage 12 sub-component ────────────────────────────────────
function Stage12Panel({ teamId, td, clr, onUpdate }) {
  const [localSurvey, setLocalSurvey] = useState(td.surveyText || "");

  useEffect(() => { setLocalSurvey(td.surveyText || ""); }, [td.surveyText]);

  const parsed  = parseSurvey(localSurvey);
  const maxMD   = parsed.length ? parsed[parsed.length-1].md : 0;
  const maxInc  = parsed.length ? Math.max(...parsed.map(p => p.inc)) : 0;
  const spacing = parsed.length > 1
    ? ((parsed[parsed.length-1].md - parsed[0].md) / (parsed.length-1)).toFixed(0)
    : "—";

  const handleSubmit = () => {
    if (parsed.length < 2) return;
    onUpdate({ surveyText: localSurvey, s12Submitted: true });
  };

  if (!td.s12Released) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 text-center border border-gray-700">
        <span className="text-2xl">🔒</span>
        <p className="text-xs text-gray-500 mt-2">
          Stage 12 not yet released by the instructor. Stand by.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* Format reminder */}
      <div className="bg-blue-950 border border-blue-800 rounded-lg px-3 py-2 text-xs text-blue-300">
        <span className="font-bold">Format:</span>&nbsp;
        <span className="font-mono bg-blue-900 px-1 rounded">MD(m) &nbsp; Inc(°) &nbsp; Azi(°)</span>
        &nbsp;— one row per line, ~30m spacing, tab or space separated.
        Survey from RT. Azi = Grid azimuth.
      </div>

      {/* Survey textarea */}
      <textarea
        className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-xs
          font-mono rounded px-2 py-1.5 focus:outline-none focus:border-cyan-500 resize-y"
        rows={16}
        value={localSurvey}
        onChange={e => setLocalSurvey(e.target.value)}
        placeholder={
          "0\t0\t0\n" +
          "30\t1.2\t198.5\n" +
          "60\t2.6\t197.8\n" +
          "90\t4.1\t197.2\n" +
          "120\t6.0\t196.8\n" +
          "...\n" +
          "1933\t49.0\t196.0"
        }
      />

      {/* Live parse feedback */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {[
          { label:"Stations",  value: parsed.length || "—" },
          { label:"Max MD",    value: maxMD ? `${maxMD} m` : "—" },
          { label:"Max Inc",   value: maxInc ? `${maxInc.toFixed(1)}°` : "—" },
          { label:"Avg spacing", value: spacing !== "—" ? `${spacing} m` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 rounded px-2 py-1.5 border border-gray-700 text-center">
            <div className="text-gray-500">{label}</div>
            <div className="font-mono font-bold text-gray-200 mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Validation warnings */}
      {localSurvey.trim() && parsed.length === 0 && (
        <div className="text-xs text-red-400 bg-red-950 border border-red-800 rounded px-3 py-2">
          ⚠️ No valid rows parsed. Check format: MD Inc Azi (numbers only, one row per line).
        </div>
      )}
      {parsed.length > 0 && parsed.length < 5 && (
        <div className="text-xs text-yellow-400 bg-yellow-950 border border-yellow-800 rounded px-3 py-2">
          ⚠️ Only {parsed.length} stations — a full RW trajectory to ~1933m should have ~60+ stations at 30m spacing.
        </div>
      )}
      {parsed.length > 0 && maxMD < 1800 && (
        <div className="text-xs text-yellow-400 bg-yellow-950 border border-yellow-800 rounded px-3 py-2">
          ⚠️ Max MD is {maxMD}m — target intercept is ~1933m. Ensure trajectory reaches the intercept depth.
        </div>
      )}
      {spacing !== "—" && parseFloat(spacing) > 60 && (
        <div className="text-xs text-yellow-400 bg-yellow-950 border border-yellow-800 rounded px-3 py-2">
          ⚠️ Average spacing is {spacing}m — aim for ~30m spacing for accurate trajectory computation.
        </div>
      )}

      {/* Planning criteria reminder */}
      <div className="bg-gray-900 rounded-lg px-3 py-2 text-xs text-gray-400 border border-gray-700 space-y-0.5">
        <p className="font-semibold text-gray-300 mb-1">Trajectory criteria (from Stage 12 assessment):</p>
        <p>• KOP as shallow as feasible · Max DLS ≤ 3°/30m</p>
        <p>• Incidence angle 3–10° at intercept (prefer ~5°)</p>
        <p>• Pass-by executed close to A04 for active ranging</p>
        <p>• Interception between 9⅝" shoe @1908m and packer @1948m</p>
        <p>• Smooth trajectory — minimise tortuosity in 12¼" section</p>
      </div>

      {/* Submit */}
      {td.s12Submitted ? (
        <div className="rounded-lg px-3 py-2 text-xs font-semibold text-center
          bg-green-900 text-green-300 border border-green-700">
          ✅ Stage 12 submitted — {parseSurvey(td.surveyText).length} stations,
          max MD {parseSurvey(td.surveyText).slice(-1)[0]?.md ?? "?"} m
          <button
            onClick={() => onUpdate({ s12Submitted: false })}
            className="ml-3 text-green-500 hover:text-green-300 underline font-normal">
            Edit
          </button>
        </div>
      ) : (
        <button
          disabled={parsed.length < 2}
          onClick={handleSubmit}
          className="w-full py-2 rounded-lg text-white text-xs font-bold transition-opacity
            hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed bg-cyan-700">
          ✅ Submit Stage 12 — Relief Well Trajectory
        </button>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function StageRWPlanningTeam({ stageId, teamId, clr }) {
  const [rwState, setRwState] = useState(null);

  // Real-time Firestore listener (same doc as TabRWPlanning)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, COL, RW_DOC), snap => {
      setRwState(snap.exists() ? (snap.data().value ?? null) : null);
    });
    return () => unsub();
  }, []);

  const updateTeam = async (patch) => {
    if (!rwState) return;
    const next = {
      ...rwState,
      teams: {
        ...rwState.teams,
        [teamId]: { ...rwState.teams[teamId], ...patch },
      },
    };
    setRwState(next);
    await setDoc(doc(db, COL, RW_DOC), { value: next });
  };

  if (!rwState) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-xs text-gray-500 text-center">
        Loading…
      </div>
    );
  }

  const td = rwState.teams?.[teamId];
  if (!td) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-xs text-red-400 text-center">
        Team data not found for {teamId}.
      </div>
    );
  }

  const stageConfig = {
    11: {
      icon: "📍",
      title: "Stage 11 — Relief Well Surface Location",
      color: "text-yellow-400",
      border: "border-yellow-800",
    },
    12: {
      icon: "🛰",
      title: "Stage 12 — Relief Well Trajectory",
      color: "text-cyan-400",
      border: "border-cyan-800",
    },
  }[stageId];

  return (
    <div className={`bg-gray-800 rounded-xl border ${stageConfig.border} overflow-hidden`}>

      {/* Card header */}
      <div className={`px-4 py-2.5 flex items-center gap-2 border-b border-gray-700
        ${clr ? clr.light : "bg-gray-750"}`}>
        <span className="text-base">{stageConfig.icon}</span>
        <span className={`text-sm font-bold ${stageConfig.color}`}>
          {stageConfig.title}
        </span>
        {/* Release / submission badges */}
        <div className="ml-auto flex gap-2">
          {stageId === 11 && (
            <>
              {td.s11Released
                ? <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full border border-green-700">Released ✓</span>
                : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Locked 🔒</span>}
              {td.s11Submitted &&
                <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700">Submitted ✓</span>}
            </>
          )}
          {stageId === 12 && (
            <>
              {td.s12Released
                ? <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full border border-green-700">Released ✓</span>
                : <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">Locked 🔒</span>}
              {td.s12Submitted &&
                <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700">Submitted ✓</span>}
            </>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {stageId === 11 && (
          <Stage11Panel teamId={teamId} td={td} clr={clr} onUpdate={updateTeam} />
        )}
        {stageId === 12 && (
          <Stage12Panel teamId={teamId} td={td} clr={clr} onUpdate={updateTeam} />
        )}
      </div>
    </div>
  );
}