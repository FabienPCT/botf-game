// src/instructor/TabOverview.js
import { STAGES, HAZARD_CARDS } from "../data/stages";
import { TEAMS, CLR } from "../data/teams";

const ST_CLR = {
  "—":"bg-gray-700 text-gray-500",
  "In Progress":"bg-yellow-700 text-yellow-200",
  "Complete":"bg-green-800 text-green-200",
  "Blocked":"bg-red-900 text-red-300",
};

export default function TabOverview({ state, calcCost, calcDays, setHazard }) {
  return (
    <div>
      {/* Hazard card selectors */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {TEAMS.map(t => {
          const c = CLR[t.color];
          return (
            <div key={t.id} className={`${c.light} border ${c.border} rounded p-2 flex-1 min-w-36`}>
              <div className={`text-xs font-bold ${c.text} mb-1`}>{t.name}</div>
              <select className="bg-gray-800 text-gray-200 text-xs rounded px-1 py-0.5 w-full"
                value={state[t.id]?.hazard || ""}
                onChange={e => setHazard(t.id, e.target.value)}>
                <option value="">— No hazard card —</option>
                {HAZARD_CARDS.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
              </select>
            </div>
          );
        })}
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-800 text-gray-400">
              <th className="p-1.5 text-left border border-gray-600">Team</th>
              {STAGES.map(s => (
                <th key={s.id} className={`p-1 border border-gray-600 text-center ${s.placeholder ? "opacity-50" : ""}`}>
                  <div className="text-yellow-400 font-bold">S{s.id}</div>
                  <div className="text-gray-600" style={{fontSize:"10px"}}>D{s.day}</div>
                </th>
              ))}
              <th className="p-1 border border-gray-600 text-center text-yellow-400">kUSD</th>
              <th className="p-1 border border-gray-600 text-center text-blue-400">+Days</th>
            </tr>
          </thead>
          <tbody>
            {TEAMS.map(t => {
              const c = CLR[t.color];
              const tot = calcCost(t.id);
              const ed  = calcDays(t.id);
              return (
                <tr key={t.id} className={`${c.light} border-b border-gray-700`}>
                  <td className={`p-1.5 border border-gray-600 font-bold ${c.text} whitespace-nowrap`}>
                    <div className="flex items-center gap-1.5">
                      <img src={t.logo} alt={t.name} className="w-5 h-5 rounded-full object-cover"
                        onError={e => e.target.style.display="none"} />
                      {t.name}
                    </div>
                  </td>
                  {STAGES.map(s => {
                    const cc = state[t.id]?.[s.id];
                    return (
                      <td key={s.id} className={`p-1 border border-gray-600 text-center ${s.placeholder ? "opacity-60" : ""}`}>
                        {cc?.option ? (
                          <div>
                            <div className={`font-bold text-xs ${cc.released ? "text-green-400" : "text-blue-300"}`}>{cc.option}</div>
                            <div className={`rounded px-0.5 ${ST_CLR[cc.status]}`} style={{fontSize:"10px"}}>
                              {cc.status === "—" ? "·" : cc.status.slice(0,2)}
                            </div>
                            {cc.penalty  && <div className="text-red-400"   style={{fontSize:"10px"}}>⚠️</div>}
                            {cc.released && <div className="text-green-500" style={{fontSize:"10px"}}>✅</div>}
                          </div>
                        ) : <span className="text-gray-700">·</span>}
                      </td>
                    );
                  })}
                  <td className="p-1.5 border border-gray-600 text-center font-bold text-yellow-300">{tot.total}</td>
                  <td className="p-1.5 border border-gray-600 text-center font-bold text-blue-300">{ed > 0 ? `+${ed}` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-2 flex gap-2 flex-wrap" style={{fontSize:"11px"}}>
        {Object.entries(ST_CLR).map(([k,v]) => <span key={k} className={`px-1.5 py-0.5 rounded ${v}`}>{k}</span>)}
        <span className="text-red-400 ml-1">⚠️ penalty</span>
        <span className="text-green-400 ml-1">✅ data released to team</span>
      </div>
    </div>
  );
}