// src/components/StageCard.js
import DataTable from "./DataTable.js";

export default function StageCard({ stage, sd, clr, localIn, onLocalInput, onOpenTrajectory }) {
  const released = sd?.released && sd?.option;
  const opt      = sd?.option;
  const optData  = opt ? stage.options[opt] : null;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-300 fadein ${released ? clr.border : "border-gray-700"}`}>

      {/* Header */}
      <div className={`px-4 py-3 flex items-center gap-3 ${released ? clr.light : "bg-gray-800"}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0
          ${released ? clr.h + " text-white" : "bg-gray-700 text-gray-500"}`}>
          {stage.id}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm ${released ? "text-white" : "text-gray-500"}`}>{stage.title}</div>
          <div className={`text-xs ${released ? "text-gray-400" : "text-gray-600"}`}>Day {stage.day} · {stage.duration}</div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {/* Trajectory viewer button — only show for stage 4 (or wherever relevant) */}
          {released && stage.showTrajectory && onOpenTrajectory && (
            <button
              onClick={onOpenTrajectory}
              className="text-xs font-semibold px-2 py-1 rounded bg-blue-900 text-blue-300 border border-blue-700 hover:bg-blue-800">
              🛰 Trajectories
            </button>
          )}
          {released
            ? <span className={`text-xs font-bold px-2 py-1 rounded-full ${clr.badge}`}>Opt {opt} – {optData?.label}</span>
            : <span className="text-xs text-yellow-600 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" style={{animation:"waiting 2s linear infinite"}}></span>
                Waiting for instructor…
              </span>
          }
        </div>
      </div>

      {/* Locked state */}
      {!released && (
        <div className="bg-gray-900 px-4 py-4 border-t border-gray-800">
          <div className="w-full rounded-full h-1.5 overflow-hidden mb-2">
            <div className="waiting-bar h-full rounded-full" />
          </div>
          <div className="text-center text-xs text-gray-600">
            Your instructor will release the input data for this stage shortly
          </div>
        </div>
      )}

      {/* Released state */}
      {released && (
        <div className="bg-gray-900 px-4 py-3 fadein">

          {/* ── Instructor note ── */}
          {sd?.note && (
            <div className="mb-3 flex items-start gap-2 bg-yellow-950 border border-yellow-700 rounded-lg px-3 py-2">
              <span className="text-yellow-400 text-sm shrink-0">📢</span>
              <p className="text-xs text-yellow-200 leading-relaxed">{sd.note}</p>
            </div>
          )}

          {stage.description && <p className="text-xs text-gray-400 mb-3 leading-relaxed">{stage.description}</p>}

          {/* Option label */}
          <div className={`text-xs font-bold ${clr.text} mb-3 uppercase tracking-wide flex items-center gap-2`}>
            <span>📂 Option {opt}: {optData?.label}</span>
            {optData?.cost > 0 && <span className="text-green-400 normal-case font-normal">({optData.cost} kUSD)</span>}
          </div>

          {/* Bullet items */}
          {optData?.items?.length > 0 && (
            <div className={`${clr.light} rounded-lg p-3 border ${clr.border} space-y-1.5 mb-4`}>
              {optData.items.map((item, i) => (
                <div key={i} className={`flex gap-2 text-xs ${item.startsWith("⚠️") ? "text-orange-300" : "text-gray-300"}`}>
                  <span className="shrink-0 mt-0.5">{item.startsWith("⚠️") ? "" : "•"}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Data tables */}
          {optData?.tables?.map((tbl, i) => (
            <DataTable key={i} table={tbl} clr={clr} />
          ))}

          {/* Deliverables */}
          {stage.deliverables && (
            <div className="mb-3">
              <div className="text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">✅ Deliverables</div>
              <div className="space-y-1">
                {stage.deliverables.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-green-500 shrink-0 mt-0.5">☐</span><span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team input */}
          {stage.hasTeamInput && (
            <div className={`mt-3 pt-3 border-t ${clr.border}`}>
              <div className={`text-xs font-bold ${clr.text} mb-2 uppercase tracking-wide`}>📝 Submit Your Answer</div>
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">{stage.teamInputLabel}:</label>
                  <input
                    className={`bg-gray-800 border ${clr.border} ${clr.text} text-sm font-bold rounded px-2 py-1 w-28 focus:outline-none`}
                    placeholder="e.g. 1828"
                    value={localIn?.md || ""}
                    onChange={e => onLocalInput(stage.id, "md", e.target.value)} />
                </div>
                {stage.tortuosityOptions && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Tortuosity:</label>
                    <select
                      className={`bg-gray-800 border ${clr.border} ${clr.text} text-xs rounded px-2 py-1 focus:outline-none`}
                      value={localIn?.tortuosity || ""}
                      onChange={e => onLocalInput(stage.id, "tortuosity", e.target.value)}>
                      <option value="">— Select —</option>
                      {stage.tortuosityOptions.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {(localIn?.md || localIn?.tortuosity) && (
                <div className={`mt-2 text-xs ${clr.text} ${clr.light} rounded px-2 py-1.5 inline-flex items-center gap-2 border ${clr.border}`}>
                  <span>Recorded:</span>
                  {localIn.md && <strong>{localIn.md}m</strong>}
                  {localIn.tortuosity && <span>| {localIn.tortuosity}</span>}
                  <span className="text-gray-500">→ show to your instructor</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}