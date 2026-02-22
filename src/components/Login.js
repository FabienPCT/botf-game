// src/components/Login.js
import { useState } from "react";
import { TEAMS, CLR } from "../data/teams";

export default function Login({ onLogin }) {
  const [selTeam, setSelTeam] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");

  const handleLogin = () => {
    if (!selTeam)                                          { setError("Please select your team."); return; }
    const team = TEAMS.find(t => t.id === selTeam);
    if (!team || password !== team.password)               { setError("Incorrect password. Ask your instructor."); return; }
    onLogin(selTeam);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
      <img src="/images/botf-logo.png" alt="BOTF"
        className="w-24 h-24 object-contain mb-3"
        onError={e => e.target.style.display="none"} />
      <div className="text-5xl font-black text-yellow-400 mb-1">BOTF</div>
      <div className="text-gray-400 text-sm mb-8">Relief Well Roleplay Game</div>

      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-xs border border-gray-700 shadow-2xl">
        <div className="text-white font-bold text-center mb-4">Team Login</div>

        {/* Team selector */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-1.5">Select your team</label>
          <div className="space-y-1.5">
            {TEAMS.map(t => {
              const c = CLR[t.color];
              return (
                <button key={t.id}
                  onClick={() => { setSelTeam(t.id); setError(""); }}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium text-left flex items-center gap-2.5 border transition-all
                    ${selTeam === t.id
                      ? `${c.h} text-white border-transparent`
                      : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"}`}>
                  <img src={t.logo} alt={t.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 bg-gray-600"
                    onError={e => e.target.style.display="none"} />
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-1.5">Team password</label>
          <input type="password" placeholder="Enter password"
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>

        {error && <div className="text-red-400 text-xs mb-3 text-center">{error}</div>}

        <button onClick={handleLogin}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg text-sm transition-colors">
          Enter Dashboard →
        </button>
        <div className="text-center text-xs text-gray-600 mt-3">Ask your instructor for the team password</div>
      </div>
    </div>
  );
}