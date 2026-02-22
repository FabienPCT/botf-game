// src/instructor/TabCosts.js
import { STAGES, RIG_DAILY, AMR_DAILY } from "../data/stages";
import { TEAMS, CLR } from "../data/teams";

export default function TabCosts({ state, calcCost, calcDays }) {
  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
          Rig: <span className="text-yellow-300">{RIG_DAILY} kUSD/day</span>
        </div>
        <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
          AMR: <span className="text-yellow-300">{AMR_DAILY} kUSD/day</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-800 text-gray-400">
              <th className="p-1.5 text-left border border-gray-600">Team</th>
              {STAGES.map(s => (
                <th key={s.id} className={`p-1 border border-gray-600 text-center ${s.placeholder?"opacity-50":""}`}
                  style={{fontSize:"11px"}}>S{s.id}</th>
              ))}
              <th className="p-1.5 border border-gray-600 text-center text-green-400">Opt</th>
              <th className="p-1.5 border border-gray-600 text-center text-red-400">Pen</th>
              <th className="p-1.5 border border-gray-600 text-center text-blue-400">+Days</th>
              <th className="p-1.5 border border-gray-600 text-center text-yellow-400">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {TEAMS.map(t => {
              const c   = CLR[t.color];
              const tot = calcCost(t.id);
              const ed  = calcDays(t.id);
              return (
                <tr key={t.id} className={`border-b border-gray-700 ${c.light}`}>
                  <td className={`p-1.5 border border-gray-600 font-bold ${c.text} whitespace-nowrap`}>
                    <div className="flex items-center gap-1.5">
                      <img src={t.logo} alt={t.name} className="w-4 h-4 rounded-full object-cover"
                        onError={e => e.target.style.display="none"} />
                      {t.name}
                    </div>
                  </td>
                  {STAGES.map(s => {
                    const cc  = state[t.id]?.[s.id] || {};
                    const opt = cc.option ? s.options[cc.option] : null;
                    if (!opt) return <td key={s.id} className="p-1 border border-gray-600 text-center text-gray-700">·</td>;
                    return (
                      <td key={s.id} className="p-1 border border-gray-600 text-center" style={{fontSize:"11px"}}>
                        <span className="text-green-300">{opt.cost}</span>
                        {cc.penalty && opt.penalty ? <span className="text-red-400">+{opt.penalty}</span> : null}
                      </td>
                    );
                  })}
                  <td className="p-1.5 border border-gray-600 text-center text-green-300">{tot.cost}</td>
                  <td className="p-1.5 border border-gray-600 text-center text-red-400">{tot.pen > 0 ? `+${tot.pen}` : "-"}</td>
                  <td className="p-1.5 border border-gray-600 text-center text-blue-300">{ed > 0 ? `+${ed}` : "-"}</td>
                  <td className="p-1.5 border border-gray-600 text-center font-bold text-yellow-300">{tot.total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}