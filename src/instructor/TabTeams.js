// src/instructor/TabTeams.js
import { useState } from "react";
import { STAGES, HAZARD_CARDS, RIG_DAILY, AMR_DAILY } from "../data/stages";
import { TEAMS, CLR } from "../data/teams";

const ST_CLR = {
  "—":"bg-gray-700 text-gray-500",
  "In Progress":"bg-yellow-700 text-yellow-200",
  "Complete":"bg-green-800 text-green-200",
  "Blocked":"bg-red-900 text-red-300",
};

export default function TabTeams({ state, calcCost, calcDays, setHazard }) {
  const [activeTeam, setActiveTeam] = useState("IBD");
  const teamObj = TEAMS.find(t => t.id === activeTeam);
  const c = teamObj ? CLR[teamObj.color] : CLR.gray;
  const tot = calcCost(activeTeam);
  const ed  = calcDays(activeTeam);

  return (
    <div>
      {/* Team tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {TEAMS.map(t => {
          const tc = CLR[t.color];
          return (
            <button key={t.id} onClick={() => setActiveTeam(t.id)}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5
                ${activeTeam === t.id ? `${tc.btn} text-white` : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              <img src={t.logo} alt={t.name} className="w-4 h-4 rounded-full object-cover"
                onError={e => e.target.style.display="none"} />
              {t.name}
            </button>
          );
        })}
      </div>

      {teamObj && (
        <div>
          {/* Summary cards */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <div className={`${c.light} border ${c.border} rounded px-3 py-2`}>
              <div className="text-xs text-gray-400">Total Cost</div>
              <div className="font-bold text-yellow-300 text-lg">{tot.total} kUSD</div>
              <div className="text-xs text-gray-500">{tot.cost}k option + {tot.pen}k penalty</div>
            </div>
            <div className={`${c.light} border ${c.border} rounded px-3 py-2`}>
              <div className="text-xs text-gray-400">Extra Days</div>
              <div className="font-bold text-blue-300 text-lg">+{ed}</div>
              <div className="text-xs text-gray-500">≈ +{ed * (RIG_DAILY + AMR_DAILY)}k rig cost</div>
            </div>
            <div className={`${c.light} border ${c.border} rounded px-3 py-2`}>
              <div className="text-xs text-gray-400">Hazard Card</div>
              <select className="bg-gray-800 text-orange-300 text-xs rounded px-1 py-0.5 mt-0.5"
                value={state[teamObj.id]?.hazard || ""}
                onChange={e => setHazard(teamObj.id, e.target.value)}>
                <option value="">— None —</option>
                {HAZARD_CARDS.map(h => <option key={h.id} value={h.id}>{h.id}</option>)}
              </select>
            </div>
          </div>

          {/* Stage list */}
          <div className="space-y-1">
            {STAGES.map(s => {
              const cc  = state[teamObj.id]?.[s.id] || {};
              const opt = cc.option ? s.options[cc.option] : null;
              return (
                <div key={s.id} className={`rounded p-2 border-l-4
                  ${cc.option ? `${c.light} ${c.border}` : "bg-gray-800 border-gray-700"}
                  ${s.placeholder ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">D{s.day} S{s.id}</span>
                    <span className="text-xs font-medium text-gray-200">{s.title}</span>
                    {cc.option && <span className={`text-xs rounded px-1.5 py-0.5 ${ST_CLR[cc.status||"—"]}`}>{cc.status||"—"}</span>}
                    {cc.released && <span className="text-xs text-green-400">✅</span>}
                    {opt && <span className="ml-auto text-yellow-400 text-xs">{opt.cost + (cc.penalty&&opt.penalty?opt.penalty:0)} kUSD</span>}
                  </div>
                  {opt && <div className="text-xs text-gray-500 mt-0.5">Option {cc.option}: {opt.penaltyNote}</div>}
                  {cc.notes && <div className="text-xs text-yellow-200 italic mt-0.5">📝 {cc.notes}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}