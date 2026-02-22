// src/instructor/TabTimeline.js
import { TEAMS, CLR } from "../data/teams";
import { REF_MD } from "../data/stages";

export default function TabTimeline({ state, calcDays, RIG_DAILY, AMR_DAILY }) {
  return (
    <div>
      <h2 className="font-bold text-yellow-400 mb-3">Team Timeline Comparison</h2>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="bg-gray-800 text-gray-400">
              <th className="p-1.5 text-left border border-gray-600">Team</th>
              {[1,2,3].map(sid => <th key={sid} className="p-1.5 text-center border border-gray-600">S{sid}</th>)}
              <th className="p-1.5 text-center border border-gray-600">S10 MD</th>
              <th className="p-1.5 text-center border border-gray-600">Tortuosity</th>
              <th className="p-1.5 text-center border border-gray-600">S13 RW TD</th>
              <th className="p-1.5 text-center border border-gray-600 text-blue-400">+Days</th>
              <th className="p-1.5 text-center border border-gray-600 text-yellow-400">Extra Cost</th>
            </tr>
          </thead>
          <tbody>
            {TEAMS.map(t => {
              const c   = CLR[t.color];
              const ed  = calcDays(t.id);
              const s10 = state[t.id]?.[10] || {};
              const s13 = state[t.id]?.[13] || {};
              return (
                <tr key={t.id} className={`${c.light} border-b border-gray-700`}>
                  <td className={`p-1.5 border border-gray-600 font-bold ${c.text} whitespace-nowrap`}>
                    <div className="flex items-center gap-1.5">
                      <img src={t.logo} alt={t.name} className="w-4 h-4 rounded-full object-cover"
                        onError={e => e.target.style.display="none"} />
                      {t.name}
                    </div>
                  </td>
                  {[1,2,3].map(sid => {
                    const cc = state[t.id]?.[sid] || {};
                    return (
                      <td key={sid} className="p-1.5 border border-gray-600 text-center">
                        <span className={`font-bold ${cc.option ? "text-blue-300" : "text-gray-600"}`}>{cc.option || "—"}</span>
                        {cc.penalty && cc.option && <span className="text-red-400 ml-1">⚠️</span>}
                      </td>
                    );
                  })}
                  <td className="p-1.5 border border-gray-600 text-center">
                    {s10.md ? (
                      <span className={`font-bold px-1 rounded
                        ${REF_MD[t.id] && Math.abs(Number(s10.md)-REF_MD[t.id]) < 5  ? "text-green-300" :
                          REF_MD[t.id] && Math.abs(Number(s10.md)-REF_MD[t.id]) < 30 ? "text-yellow-300" : "text-red-300"}`}>
                        {s10.md}m
                      </span>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="p-1.5 border border-gray-600 text-center text-gray-300">{s10.tortuosity || "—"}</td>
                  <td className="p-1.5 border border-gray-600 text-center text-blue-300 font-bold">{s13.md || "—"}</td>
                  <td className="p-1.5 border border-gray-600 text-center font-bold text-blue-300">{ed > 0 ? `+${ed}` : "-"}</td>
                  <td className="p-1.5 border border-gray-600 text-center font-bold text-yellow-300">{ed > 0 ? `+${ed*(RIG_DAILY+AMR_DAILY)}k` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-500">S10 MD: 🟢 &lt;5m · 🟡 5–30m · 🔴 &gt;30m from reference</div>
    </div>
  );
}