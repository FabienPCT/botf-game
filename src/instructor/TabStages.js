// src/instructor/TabStages.js
import { useState } from "react";
import { STAGES, REF_MD } from "../data/stages";
import { TEAMS, CLR } from "../data/teams";

const ST_OPT = ["—","In Progress","Complete","Blocked"];
const DAYS = [1,2,3,4];

export default function TabStages({ state, set, releaseStage, lockStage, releaseAll }) {
  const [activeStage, setActiveStage] = useState(1);
  const [showPitfalls, setShowPitfalls] = useState({});
  const [showItems, setShowItems]     = useState({});

  const stage = STAGES.find(s => s.id === activeStage);

  return (
    <div className="flex gap-3">
      {/* Sidebar */}
      <div className="flex flex-col gap-0.5 w-40 shrink-0">
        {DAYS.map(d => (
          <div key={d}>
            <div className="text-xs text-gray-500 font-bold px-1 py-1 mt-1">Day {d}</div>
            {STAGES.filter(s => s.day === d).map(s => (
              <button key={s.id} onClick={() => setActiveStage(s.id)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs mb-0.5 transition-colors
                  ${activeStage === s.id ? "bg-yellow-600 text-gray-900 font-bold" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}
                  ${s.placeholder ? "opacity-60" : ""}`}>
                <span className="font-bold">S{s.id}</span> {s.title.split(" ").slice(0,3).join(" ")}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Stage detail */}
      {stage && (
        <div className="flex-1 min-w-0">
          {/* Stage header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-bold text-yellow-400">Stage {stage.id} – {stage.title}</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">Day {stage.day} | {stage.duration}</span>
            {stage.placeholder && <span className="text-xs bg-orange-900 text-orange-300 px-2 py-0.5 rounded">Placeholder</span>}
            <button onClick={() => releaseAll(stage.id)}
              className="ml-auto text-xs bg-green-900 hover:bg-green-800 text-green-300 px-2 py-1 rounded">
              ✅ Release all teams
            </button>
            <button onClick={() => setShowPitfalls(p => ({...p,[stage.id]:!p[stage.id]}))}
              className="text-xs bg-orange-900 hover:bg-orange-800 text-orange-300 px-2 py-1 rounded">
              {showPitfalls[stage.id] ? "Hide" : "Show"} Pitfalls
            </button>
          </div>

          {/* Pitfalls */}
          {showPitfalls[stage.id] && (
            <div className="bg-orange-950 border border-orange-800 rounded p-2 mb-2 text-xs">
              <div className="text-orange-400 font-bold mb-1">⚠️ Instructor Pitfalls</div>
              {stage.pitfalls?.map((p, i) => <div key={i} className="text-orange-200 mb-0.5">• {p}</div>)}
            </div>
          )}

          {/* Option cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {Object.entries(stage.options).map(([oid, opt]) => (
              <div key={oid} className="bg-gray-800 rounded p-2 border border-gray-600">
                <div className="font-bold text-blue-300 text-xs mb-1">Option {oid} – {opt.label}</div>
                <div className="text-xs text-green-400">Cost: {opt.cost} kUSD</div>
                {opt.penalty  > 0 && <div className="text-xs text-red-400">Penalty: +{opt.penalty} kUSD</div>}
                {opt.timePenalty > 0 && <div className="text-xs text-yellow-400">Time: +{opt.timePenalty} days</div>}
                <div className="text-xs text-gray-400 mt-1 mb-2">{opt.penaltyNote}</div>
                <button onClick={() => setShowItems(p => ({...p,[`${stage.id}-${oid}`]:!p[`${stage.id}-${oid}`]}))}
                  className="text-xs bg-blue-900 hover:bg-blue-800 text-blue-300 px-2 py-0.5 rounded w-full">
                  {showItems[`${stage.id}-${oid}`] ? "Hide" : "Show"} Items
                </button>
                {showItems[`${stage.id}-${oid}`] && (
                  <div className="mt-1 bg-gray-900 rounded p-1.5 space-y-0.5">
                    {opt.items?.map((d, i) => <div key={i} className="text-xs text-gray-300">• {d}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Team rows */}
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Team Choices</div>
          <div className="space-y-1.5">
            {TEAMS.map(t => {
              const c  = CLR[t.color];
              const cc = state[t.id]?.[stage.id] || {};
              const opt = cc.option ? stage.options[cc.option] : null;
              return (
                <div key={t.id} className={`${c.light} border ${c.border} rounded p-2`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 w-36 shrink-0">
                      <img src={t.logo} alt={t.name} className="w-5 h-5 rounded-full object-cover"
                        onError={e => e.target.style.display="none"} />
                      <span className={`font-bold text-xs ${c.text}`}>{t.name}</span>
                    </div>

                    {/* Option buttons */}
                    <div className="flex gap-1">
                      {Object.keys(stage.options).map(oid => (
                        <button key={oid}
                          onClick={() => set(t.id, stage.id, "option", cc.option === oid ? null : oid)}
                          className={`px-2 py-0.5 rounded text-xs font-bold
                            ${cc.option === oid ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}>
                          {oid}
                        </button>
                      ))}
                    </div>

                    {/* Status */}
                    <select className="bg-gray-800 text-gray-200 text-xs rounded px-1 py-0.5"
                      value={cc.status || "—"}
                      onChange={e => set(t.id, stage.id, "status", e.target.value)}>
                      {ST_OPT.map(s => <option key={s}>{s}</option>)}
                    </select>

                    {/* Penalty checkbox */}
                    {opt?.penalty > 0 && (
                      <label className="flex items-center gap-1 text-xs text-red-400 cursor-pointer">
                        <input type="checkbox" checked={cc.penalty || false}
                          onChange={e => set(t.id, stage.id, "penalty", e.target.checked)} />
                        +{opt.penalty}k
                      </label>
                    )}

                    {opt && <span className="text-yellow-400 text-xs">{opt.cost + (cc.penalty && opt.penalty ? opt.penalty : 0)} kUSD</span>}

                    {/* Release / Lock */}
                    {cc.option && (
                      cc.released
                        ? <button onClick={() => lockStage(t.id, stage.id)}
                            className="ml-auto text-xs bg-green-800 hover:bg-red-900 text-green-300 hover:text-red-300 px-2 py-0.5 rounded border border-green-700 hover:border-red-700">
                            ✅ Released – lock
                          </button>
                        : <button onClick={() => releaseStage(t.id, stage.id)}
                            className="ml-auto text-xs bg-gray-700 hover:bg-green-800 text-gray-400 hover:text-green-300 px-2 py-0.5 rounded border border-gray-600 hover:border-green-700">
                            🔒 Release →
                          </button>
                    )}
                  </div>

                  {/* Team input fields */}
                  {stage.hasTeamInput && (
                    <div className="flex gap-3 mt-1 flex-wrap items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">{stage.teamInputLabel}:</span>
                        <input className="bg-gray-800 text-blue-300 text-xs rounded px-1 py-0.5 w-24 font-bold"
                          placeholder="e.g. 1828" value={cc.md || ""}
                          onChange={e => set(t.id, stage.id, "md", e.target.value)} />
                        {stage.id === 10 && REF_MD[t.id] && cc.md && (
                          <span className={`text-xs px-1 rounded
                            ${Math.abs(Number(cc.md) - REF_MD[t.id]) < 5  ? "bg-green-800 text-green-300" :
                              Math.abs(Number(cc.md) - REF_MD[t.id]) < 30 ? "bg-yellow-800 text-yellow-300" : "bg-red-900 text-red-300"}`}>
                            ref:{REF_MD[t.id]}m
                          </span>
                        )}
                      </div>
                      {stage.tortuosityOptions && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">Tortuosity:</span>
                          <select className="bg-gray-800 text-gray-200 text-xs rounded px-1 py-0.5"
                            value={cc.tortuosity || ""}
                            onChange={e => set(t.id, stage.id, "tortuosity", e.target.value)}>
                            <option value="">—</option>
                            {stage.tortuosityOptions.map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <input className="bg-gray-800 text-gray-200 text-xs rounded px-1 py-0.5 w-full mt-1"
                    placeholder="Instructor notes…" value={cc.notes || ""}
                    onChange={e => set(t.id, stage.id, "notes", e.target.value)} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}