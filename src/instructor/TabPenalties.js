// src/instructor/TabPenalties.js
import { STAGES, HAZARD_CARDS } from "../data/stages";
import { TEAMS, CLR } from "../data/teams";

export default function TabPenalties({ state }) {
  return (
    <div>
      <h2 className="font-bold text-yellow-400 mb-3">Active Penalties & Hazard Cards</h2>
      {TEAMS.map(t => {
        const c    = CLR[t.color];
        const pens = STAGES.flatMap(s => {
          const cc = state[t.id]?.[s.id] || {};
          if (!cc.penalty || !cc.option) return [];
          const opt = s.options[cc.option];
          if (!opt?.penalty) return [];
          return [{ s, opt }];
        });
        const haz = state[t.id]?.hazard
          ? HAZARD_CARDS.find(h => h.id === state[t.id].hazard)
          : null;
        if (!pens.length && !haz) return null;
        return (
          <div key={t.id} className={`${c.light} border ${c.border} rounded p-3 mb-2`}>
            <div className="flex items-center gap-2 mb-1">
              <img src={t.logo} alt={t.name} className="w-5 h-5 rounded-full object-cover"
                onError={e => e.target.style.display="none"} />
              <span className={`font-bold ${c.text}`}>{t.name}</span>
            </div>
            {haz && <div className="text-xs text-orange-300 mb-1">🃏 {haz.label}</div>}
            {pens.map(({ s, opt }) => (
              <div key={s.id} className="text-xs text-red-300 mb-0.5 flex gap-2 flex-wrap">
                <span className="text-gray-400">S{s.id}:</span>
                <span className="text-red-400 font-bold">+{opt.penalty} kUSD</span>
                <span className="text-gray-500">{opt.penaltyNote}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}