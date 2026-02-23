// src/components/StageCard.js
import { useState } from "react";
// tables are injected into option.tables by src/data/stages/index.js

// ── tiny helpers ─────────────────────────────────────────────
const OPT_COLORS = {
  A: "bg-yellow-900 border-yellow-600 text-yellow-200",
  B: "bg-green-900  border-green-600  text-green-200",
  C: "bg-blue-900   border-blue-600   text-blue-200",
};
const OPT_LABEL = { A: "Opt A", B: "Opt B", C: "Opt C" };

// ── DataTable ─────────────────────────────────────────────────
function DataTable({ table, clr }) {
  const copyTSV = () => {
  const lines = [
    table.headers.join("\t"),
    ...table.rows.map(r => r.join("\t")),
  ];
  navigator.clipboard.writeText(lines.join("\n")).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  });
};

const downloadCSV = () => {
  const esc = v => `"${String(v).replace(/"/g,'""')}"`;
  const csv = [
    table.headers.map(esc).join(","),
    ...table.rows.map(r => r.map(esc).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type:"text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `${table.title.replace(/[^a-z0-9]/gi,"_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

  return (
    <div className="mt-3 rounded-lg border border-gray-700 overflow-hidden">
      {/* table header bar */}
      <div className="flex items-start justify-between gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-100 leading-snug">{table.title}</p>
          {table.note && (
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">{table.note}</p>
          )}
        <div className="flex gap-1 shrink-0">
  <button
    onClick={copyTSV}
    className="px-2 py-1 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
  >
    {copied ? "✓ Copied" : "📋 Copy"}
  </button>
  <button
    onClick={downloadCSV}
    className="px-2 py-1 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
  >
    ⬇ CSV
  </button>
</div>

      {/* scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-750">
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-2 py-1.5 text-left font-semibold whitespace-nowrap border-b border-gray-700
                    ${table.highlight?.includes(i)
                      ? `${clr.text} bg-opacity-20 bg-green-900`
                      : "text-gray-300"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr
                key={ri}
                className={ri % 2 === 0 ? "bg-gray-900" : "bg-gray-850"}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-2 py-1 whitespace-nowrap border-b border-gray-800
                      ${table.highlight?.includes(ci)
                        ? `font-bold ${clr.text}`
                        : "text-gray-200"}`}
                  >
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

// ── StageCard ─────────────────────────────────────────────────
export default function StageCard({
  stage, sd, clr, teamId,
  localIn, onLocalInput, onOpenTrajectory,
}) {
  const [tablesOpen, setTablesOpen] = useState(true);

  const released = sd?.released;
const opt      = sd?.option ? String(sd.option).toUpperCase() : null;  // normalise case
const option   = opt ? stage.options[opt] : null;

// If option lookup fails, try first available option as fallback
const effectiveOption = option ?? Object.values(stage.options || {})[0] ?? null;

// Show tables whenever stage is released (even if option is ambiguous)
const tables = released ? (effectiveOption?.tables ?? []) : [];

  // ── locked state ──
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

  // ── released state ──
  return (
    <div className={`rounded-xl border ${clr.border} overflow-hidden fadein`}>

      {/* ── card header ── */}
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

      {/* ── body ── */}
      <div className={`${clr.light} px-4 py-3 space-y-3`}>

        {/* description */}
        {stage.description && (
          <p className="text-xs text-gray-400">{stage.description}</p>
        )}

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
                  <span className="text-gray-600 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {option.penaltyNote && (
              <p className="mt-2 text-xs text-orange-400 italic">{option.penaltyNote}</p>
            )}
          </div>
        )}

        {/* ── data tables ── */}
        {tables.length > 0 && (
  <div>
    <div className="flex items-center justify-between mb-1">
      <button
        onClick={() => setTablesOpen(o => !o)}
        className={`flex items-center gap-2 text-xs font-bold ${clr.text}`}
      >
        <span>{tablesOpen ? "▾" : "▸"}</span>
        <span>📊 DATA TABLES ({tables.length})</span>
      </button>
      <button
        onClick={() => {
          const esc = v => `"${String(v).replace(/"/g,'""')}"`;
          let csv = "";
          tables.forEach(t => {
            csv += `\n# ${t.title}\n`;
            if (t.note) csv += `# ${t.note}\n`;
            csv += t.headers.map(esc).join(",") + "\n";
            csv += t.rows.map(r => r.map(esc).join(",")).join("\n") + "\n";
          });
          const blob = new Blob([csv.trim()], { type:"text/csv" });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          a.href = url;
          a.download = `Stage${stage.id}_${opt || "all"}_tables.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium"
        title="Download all tables for this stage as a single CSV"
      >
        ⬇ All CSV
      </button>
    </div>
            {tablesOpen && (
              <div className="space-y-1">
                {tables.map((tbl, i) => (
                  <DataTable key={i} table={tbl} clr={clr} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* trajectory viewer shortcut — shown for stage 4 */}
        {stage.id === 4 && (
          <button
            onClick={onOpenTrajectory}
            className={`w-full text-xs font-semibold py-2 rounded-lg border ${clr.border} ${clr.btn} text-white`}
          >
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
              ✅ Deliverables
            </p>
            <ul className="space-y-1">
              {stage.deliverables.map((d, i) => {
                const key   = `${stage.id}_del_${i}`;
                const done  = localIn?.[key] ?? false;
                return (
                  <li key={i} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={e => onLocalInput(stage.id, key, e.target.checked)}
                      className="mt-0.5 accent-green-500 shrink-0"
                    />
                    <span className={`text-xs ${done ? "line-through text-gray-600" : "text-gray-300"}`}>
                      {d}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* team input fields (Stage 10 / 13) */}
        {stage.hasTeamInput && (
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">
              📝 {stage.teamInputLabel}
            </label>
            <input
              type="text"
              value={localIn?.teamInput ?? ""}
              onChange={e => onLocalInput(stage.id, "teamInput", e.target.value)}
              placeholder="Enter value…"
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-green-500"
            />
          </div>
        )}

        {/* tortuosity options (Stage 10) */}
        {stage.tortuosityOptions && (
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1">🔧 Tortuosity Assessment</p>
            <div className="flex flex-wrap gap-2">
              {stage.tortuosityOptions.map(opt => {
                const active = localIn?.tortuosity === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => onLocalInput(stage.id, "tortuosity", opt)}
                    className={`text-xs px-3 py-1 rounded border font-medium transition-colors
                      ${active
                        ? `${clr.btn} ${clr.border} text-white`
                        : "border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200"}`}
                  >
                    {opt}
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