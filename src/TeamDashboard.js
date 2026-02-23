// src/TeamDashboard.js
import { useState, useEffect } from "react";
import { db } from "./firebase.js";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { STAGES } from "./data/stages";
import { TEAMS, CLR } from "./data/teams.js";
import Login            from "./components/Login.js";
import StageCard        from "./components/StageCard.js";
import ChatPanel        from "./components/ChatPanel.js";
import FooterBar        from "./components/FooterBar.js";
import TrajectoryViewer from "./components/TrajectoryViewer.js";

const COL = "botf";

const STYLE = `
  @keyframes waiting { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes fadein  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .waiting-bar { background:linear-gradient(90deg,#374151 25%,#92400e 50%,#374151 75%);
    background-size:200% 100%; animation:waiting 2.5s linear infinite; }
  .fadein { animation:fadein 0.3s ease both; }
`;

export default function TeamDashboard() {
  const [teamId, setTeamId]           = useState(null);
  const [activeDay, setActiveDay]     = useState(1);
  const [localInputs, setLocalInputs] = useState({});
  const [chatOpen, setChatOpen]       = useState(false);
  const [newMsg, setNewMsg]           = useState(false);
  const [gameState, setGameState]     = useState(null);
  const [allChat, setAllChat]         = useState({});
  const [synced, setSynced]           = useState(false);
  const [showTrajectory, setShowTrajectory] = useState(false);

  // Firestore: game state
  useEffect(() => {
    const unsub = onSnapshot(doc(db, COL, "gameState"), snap => {
      if (snap.exists()) setGameState(snap.data().value);
      setSynced(true);
    });
    return () => unsub();
  }, []);

  // Firestore: chat
  useEffect(() => {
    const unsub = onSnapshot(doc(db, COL, "chat"), snap => {
      if (!snap.exists()) return;
      const val = snap.data().value || {};
      setAllChat(val);
      if (teamId) {
        const lastInstructor = (val[teamId]||[]).filter(m=>m.from==="instructor").slice(-1)[0];
        if (lastInstructor && !chatOpen) setNewMsg(true);
      }
    });
    return () => unsub();
  }, [teamId, chatOpen]);

  const sendChat = async (text) => {
    const msg = { from:"team", text, time:new Date().toLocaleTimeString() };
    const updated = { ...allChat, [teamId]: [...(allChat[teamId]||[]), msg] };
    await setDoc(doc(db, COL, "chat"), { value: updated });
  };

  const getSD = sid => gameState?.[teamId]?.[sid] ?? null;

  const calcCost = () => {
    if (!gameState || !teamId) return 0;
    return STAGES.reduce((t, s) => {
      const sd = getSD(s.id);
      return t + (sd?.option && sd?.released ? (s.options[sd.option]?.cost || 0) : 0);
    }, 0);
  };

  const setLocalInput = (sid, field, val) =>
    setLocalInputs(p => ({...p, [sid]:{...p[sid],[field]:val}}));

  const team = TEAMS.find(t => t.id === teamId);
  const clr  = team ? CLR[team.color] : CLR.gray;
  const unlockedCount = STAGES.filter(s => { const sd=getSD(s.id); return sd?.released&&sd?.option; }).length;
  const DAYS = [1,2,3,4];

  // ── Login ──
  if (!teamId) return (
    <>
      <style>{STYLE}</style>
      <Login onLogin={id => { setTeamId(id); setActiveDay(1); }} />
    </>
  );

  // ── Dashboard ──
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100" style={{fontFamily:"system-ui,sans-serif",fontSize:"13px"}}>
      <style>{STYLE}</style>

      {/* Trajectory viewer — full-screen overlay */}
      {showTrajectory && (
        <div className="fixed inset-0 z-50 overflow-auto">
          <TrajectoryViewer onClose={() => setShowTrajectory(false)} />
        </div>
      )}

      {/* Header */}
      <div className={`${clr.h} px-4 py-2.5 flex items-center gap-3`}>
        <img src={team?.logo} alt={team?.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-white border-opacity-30 shrink-0"
          onError={e => e.target.style.display="none"} />
        <span className="font-black text-white text-lg">BOTF</span>
        <span className="font-bold text-white text-sm">{team?.name}</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="bg-black bg-opacity-25 rounded-full px-3 py-1 text-xs text-white font-bold">
            💰 {calcCost()} kUSD
          </div>
          <button onClick={() => setShowTrajectory(true)}
            className="bg-black bg-opacity-25 hover:bg-opacity-40 text-white px-3 py-1 rounded-full text-xs font-medium">
            🛰 Trajectories
          </button>
          <button onClick={() => { setChatOpen(o=>!o); setNewMsg(false); }}
            className="relative bg-black bg-opacity-25 hover:bg-opacity-40 text-white px-3 py-1 rounded-full text-xs font-medium">
            💬 Chat
            {newMsg && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full" />}
          </button>
          <button onClick={() => setTeamId(null)}
            className="bg-black bg-opacity-20 hover:bg-opacity-40 text-white px-2 py-1 rounded text-xs">
            ⬅ Exit
          </button>
        </div>
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <ChatPanel
          clr={clr} team={team}
          msgs={allChat[teamId] || []}
          onSend={sendChat}
          onClose={() => setChatOpen(false)} />
      )}

      {/* Day tabs */}
      <div className="flex gap-0.5 px-3 pt-2 bg-gray-800 border-b border-gray-700">
        {DAYS.map(d => {
          const dayUnlocked = STAGES.filter(s=>s.day===d).some(s=>{ const sd=getSD(s.id); return sd?.released&&sd?.option; });
          return (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`px-4 py-1.5 rounded-t text-xs font-semibold flex items-center gap-1.5
                ${activeDay===d ? `${clr.light} ${clr.text} border border-b-0 ${clr.border}` : "text-gray-500 hover:text-gray-300"}`}>
              Day {d}
              {dayUnlocked && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
            </button>
          );
        })}
      </div>

      {/* Stage cards */}
      <div className="p-3 space-y-3 pb-16">
        {STAGES.filter(s => s.day === activeDay).map(stage => (
          <StageCard
            key={stage.id}
            stage={stage}
            sd={getSD(stage.id)}
            clr={clr}
			teamId={teamId} 
            localIn={localInputs[stage.id]}
            onLocalInput={setLocalInput}
            onOpenTrajectory={() => setShowTrajectory(true)} />
        ))}
      </div>

      <FooterBar
        clr={clr} synced={synced}
        unlockedCount={unlockedCount}
        totalStages={STAGES.length}
        runningCost={calcCost()} />
    </div>
  );
}