// src/components/StageCard.js
import { useState } from "react";

const OPT_COLORS = {
  A: "bg-yellow-900 border-yellow-600 text-yellow-200",
  B: "bg-green-900  border-green-600  text-green-200",
  C: "bg-blue-900   border-blue-600   text-blue-200",
};
const OPT_LABEL = { A: "Opt A", B: "Opt B", C: "Opt C" };

// ── DataTable ─────────────────────────────────────────────────
function DataTable({ table, clr }) {
  const [copied, setCopied] = useState(false);

  const copyTSV = () => {
    const lines = [table.headers.join("\t"), ...table.rows.map(r => r.join("\t"))];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const downloadCSV = () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [table.headers.map(esc).join(","), ...table.rows.map(r => r.map(esc).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${table.title.replace(/[^a-z0-9]/gi, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-gray-700 overflow-hidden">
      <div className="flex items-start justify-between gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-100 leading-snug">{table.title}</p>
          {table.note && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{table.note}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={copyTSV} className="px-2 py-1 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300">
            {copied ? "✓" : "📋"}
          </button>
          <button onClick={downloadCSV} className="px-2 py-1 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300">
            ⬇
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {table.headers.map((h, i) => (
                <th key={i} className={`px-2 py-1.5 text-left font-semibold whitespace-nowrap border-b border-gray-700
                  ${table.highlight?.includes(i) ? `${clr.text} bg-green-900 bg-opacity-20` : "text-gray-300 bg-gray-800"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-gray-900" : "bg-gray-850"}>
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-2 py-1 whitespace-nowrap border-b border-gray-800
                    ${table.highlight?.includes(ci) ? `font-bold ${clr.text}` : "text-gray-200"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── WellTablePanel — groups tables by well, shows casing + survey ─────────────
function WellTablePanel({ tables, clr, stageId, opt }) {

  // Group consecutive pairs: even index = survey OR casing, odd = the other
  // Tables alternate: Survey, Casing, Survey, Casing ...
  // We detect by checking title for "Casing"
  const wells = [];
  for (let i = 0; i < tables.length; i++) {
    const t = tables[i];
    const isCasing = t.title.toLowerCase().includes("casing");
    const isSurvey = !isCasing;

    // Extract well name from title (e.g. "A01-QC — Directional Survey" → "A01")
    const nameMatch = t.title.match(/^([A-Za-z0-9]+(?:-[A-Za-z]+)?)/);
    const wellName  = nameMatch ? nameMatch[1] : `Well ${i}`;

    // Find or create well entry
    let well = wells.find(w => w.name === wellName);
    if (!well) { well = { name: wellName, survey: null, casing: null }; wells.push(well); }
    if (isCasing) well.casing = t;
    else          well.survey = t;
  }

  const [selectedWell, setSelectedWell] = useState(wells[0]?.name ?? "");
  const current = wells.find(w => w.name === selectedWell) ?? wells[0];

  const downloadAllCSV = () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    let csv = "";
    tables.forEach(t => {
      csv += `\n# ${t.title}\n`;
      if (t.note) csv += `# ${t.note}\n`;
      csv += t.headers.map(esc).join(",") + "\n";
      csv += t.rows.map(r => r.map(esc).join(",")).join("\n") + "\n";
    });
    const blob = new Blob([csv.trim()], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `Stage${stageId}_${opt || "all"}_tables.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-gray-700 overflow-hidden">

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className={`text-xs font-bold ${clr.text}`}>📊 DATA TABLES — {wells.length} wells</span>
        <button onClick={downloadAllCSV}
          className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium">
          ⬇ All CSV
        </button>
      </div>

      {/* Well selector */}
      <div className="px-3 py-2 bg-gray-850 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 shrink-0">Well:</span>
          <select
            value={selectedWell}
            onChange={e => setSelectedWell(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-green-500"
          >
            {wells.map(w => (
              <option key={w.name} value={w.name}>{w.name}</option>
            ))}
          </select>
          {/* Prev / Next buttons */}
          <button
            onClick={() => {
              const idx = wells.findIndex(w => w.name === selectedWell);
              if (idx > 0) setSelectedWell(wells[idx - 1].name);
            }}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs"
          >◀</button>
          <button
            onClick={() => {
              const idx = wells.findIndex(w => w.name === selectedWell);
              if (idx < wells.length - 1) setSelectedWell(wells[idx + 1].name);
            }}
            className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs"
          >▶</button>
          <span className="text-xs text-gray-500 shrink-0">
            {wells.findIndex(w => w.name === selectedWell) + 1}/{wells.length}
          </span>
        </div>
      </div>

      {/* Casing on top, Survey below */}
      <div className="p-3 space-y-3 bg-gray-900">
        {current?.casing && <DataTable table={current.casing} clr={clr} />}
        {current?.survey && <DataTable table={current.survey} clr={clr} />}
        {!current?.casing && !current?.survey && (
          <p className="text-xs text-gray-500 text-center py-4">No data for this well</p>
        )}
      </div>
    </div>
  );
}

// ── StageCard ─────────────────────────────────────────────────
export default function StageCard({
  stage, sd, clr, teamId,
  localIn, onLocalInput, onOpenTrajectory,
}) {
  const released        = sd?.released ?? false;
  const opt             = sd?.option ? String(sd.option).toUpperCase() : null;
  const option          = opt ? stage.options[opt] : null;
  const effectiveOption = option ?? Object.values(stage.options || {})[0] ?? null;
  const tables          = released ? (effectiveOption?.tables ?? []) : [];

  // Decide layout: use well-panel for stage 4 (many wells), plain list otherwise
  const useWellPanel = stage.id === 4 && tables.length > 2;

  // ── locked ──
  if (!released) {
    return (
      <div className="rounded-xl border border-gray-700 overflow-hidden">
        <div className="waiting-bar px-4 py-3 flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
            {stage.id}
          </span>
          <div className="min-w-0">
            <p className="font-bold text-gray-300 text-sm">{stage.title}</p>
            <p className="text-xs text-gray-500">Day {stage.day} · {stage.duration} · Waiting for instructor…</p>
          </div>
        </div>
      </div>
    );
  }

  const downloadAllCSV = () => {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    let csv = "";
    tables.forEach(t => {
      csv += `\n# ${t.title}\n`;
      if (t.note) csv += `# ${t.note}\n`;
      csv += t.headers.map(esc).join(",") + "\n";
      csv += t.rows.map(r => r.map(esc).join(",")).join("\n") + "\n";
    });
    const blob = new Blob([csv.trim()], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `Stage${stage.id}_${opt || "all"}_tables.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── released ──
  return (
    <div className={`rounded-xl border ${clr.border} overflow-hidden fadein`}>

      {/* header */}
      <div className={`${clr.h} px-4 py-2.5 flex items-center gap-3`}>
        <span className="w-7 h-7 rounded-full bg-black bg-opacity-30 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {stage.id}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-sm leading-snug">{stage.title}</p>
          <p className="text-xs text-white text-opacity-70">Day {stage.day} · {stage.duration}</p>
        </div>
        {opt && (
          <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded border ${OPT_COLORS[opt]}`}>
            {OPT_LABEL[opt]} – {option?.label}
          </span>
        )}
      </div>

      {/* body */}
      <div className={`${clr.light} px-4 py-3 space-y-3`}>

        {stage.description && <p className="text-xs text-gray-400">{stage.description}</p>}

        {/* option details */}
        {option && (
          <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5">
            <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${clr.text}`}>
              📁 Option {opt}: {option.label}
              <span className="ml-2 font-normal text-gray-400">({option.cost} kUSD)</span>
            </p>
            <ul className="space-y-1">
              {option.items?.map((item, i) => (
                <li key={i} className="text-xs text-gray-300 flex gap-1.5">
                  <span className="text-gray-600 shrink-0">•</span><span>{item}</span>
                </li>
              ))}
            </ul>
            {option.penaltyNote && <p className="mt-2 text-xs text-orange-400 italic">{option.penaltyNote}</p>}
          </div>
        )}

        {/* data tables — well panel for stage 4, plain list for others */}
        {tables.length > 0 && (
          useWellPanel
            ? <WellTablePanel tables={tables} clr={clr} stageId={stage.id} opt={opt} />
            : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${clr.text}`}>📊 DATA TABLES ({tables.length})</span>
                  <button onClick={downloadAllCSV}
                    className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium">
                    ⬇ All CSV
                  </button>
                </div>
                <div className="space-y-2">
                  {tables.map((tbl, i) => <DataTable key={i} table={tbl} clr={clr} />)}
                </div>
              </div>
            )
        )}

        {/* trajectory viewer — stage 4 only */}
        {stage.id === 4 && (
          <button onClick={onOpenTrajectory}
            className={`w-full text-xs font-semibold py-2 rounded-lg border ${clr.border} ${clr.btn} text-white`}>
            🛰 Open Trajectory Viewer
          </button>
        )}

        {/* pitfalls */}
        {stage.pitfalls?.length > 0 && (
          <div className="rounded-lg border border-yellow-800 bg-yellow-950 bg-opacity-40 px-3 py-2">
            <p className="text-xs font-bold text-yellow-400 mb-1">⚠️ WATCH OUT</p>
            <ul className="space-y-0.5">
              {stage.pitfalls.map((p, i) => (
                <li key={i} className="text-xs text-yellow-300 flex gap-1.5">
                  <span className="shrink-0 text-yellow-600">•</span>{p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* deliverables */}
        {stage.deliverables?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">✅ Deliverables</p>
            <ul className="space-y-1">
              {stage.deliverables.map((d, i) => {
                const key  = `${stage.id}_del_${i}`;
                const done = localIn?.[key] ?? false;
                return (
                  <li key={i} className="flex items-start gap-2">
                    <input type="checkbox" checked={done}
                      onChange={e => onLocalInput(stage.id, key, e.target.checked)}
                      className="mt-0.5 accent-green-500 shrink-0" />
                    <span className={`text-xs ${done ? "line-through text-gray-600" : "text-gray-300"}`}>{d}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* team input (Stage 10 / 13) */}
        {stage.hasTeamInput && (
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">📝 {stage.teamInputLabel}</label>
            <input type="text" value={localIn?.teamInput ?? ""}
              onChange={e => onLocalInput(stage.id, "teamInput", e.target.value)}
              placeholder="Enter value…"
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-green-500" />
          </div>
        )}

        {/* tortuosity (Stage 10) */}
        {stage.tortuosityOptions && (
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1">🔧 Tortuosity Assessment</p>
            <div className="flex flex-wrap gap-2">
              {stage.tortuosityOptions.map(o => {
                const active = localIn?.tortuosity === o;
                return (
                  <button key={o} onClick={() => onLocalInput(stage.id, "tortuosity", o)}
                    className={`text-xs px-3 py-1 rounded border font-medium transition-colors
                      ${active ? `${clr.btn} ${clr.border} text-white` : "border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}