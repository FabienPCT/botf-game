// src/InstructorDashboard.js
import { useState, useEffect, useRef } from "react";
import { db } from "./firebase.js";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { STAGES, RIG_DAILY, AMR_DAILY } from "./data/stages";
import { TEAMS } from "./data/teams";
import TabOverview  from "./instructor/TabOverview";
import TabStages    from "./instructor/TabStages";
import TabTeams     from "./instructor/TabTeams";
import TabTimeline  from "./instructor/TabTimeline";
import TabCosts     from "./instructor/TabCosts";
import TabPenalties from "./instructor/TabPenalties";
import TabChat      from "./instructor/TabChat";

const COL = "botf";

const INITIAL_STATE = (() => {
  const s = {};
  TEAMS.forEach(t => {
    s[t.id] = { hazard: null };
    STAGES.forEach(st => {
      s[t.id][st.id] = { option:null, status:"—", penalty:false, notes:"", md:"", tortuosity:"", released:false };
    });
  });
  return s;
})();

const TABS = ["overview","stages","teams","timeline","costs","penalties","chat","session"];

function useFirestore(docKey, initial) {
  const [data, setData]     = useState(initial);
  const [synced, setSynced] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, COL, docKey), snap => {
      if (snap.exists()) setData(snap.data().value ?? initial);
      setSynced(true);
    });
    return () => unsub();
  }, [docKey]);

  const save = (newData) => {
    setData(newData);
    setSaving(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await setDoc(doc(db, COL, docKey), { value: newData });
      setSaving(false);
    }, 700);
  };

  return { data, save, synced, saving };
}

function useChat() {
  const [chat, setChat] = useState({});
  useEffect(() => {
    const unsub = onSnapshot(doc(db, COL, "chat"), snap => {
      if (snap.exists()) setChat(snap.data().value ?? {});
    });
    return () => unsub();
  }, []);
  const send = async (teamId, text) => {
    const msg = { from:"instructor", text, time:new Date().toLocaleTimeString() };
    const updated = { ...chat, [teamId]: [...(chat[teamId]||[]), msg] };
    setChat(updated);
    await setDoc(doc(db, COL, "chat"), { value: updated });
  };
  return { chat, send };
}

// ── Firestore helpers ─────────────────────────────────────────
async function readDoc(key) {
  const snap = await getDoc(doc(db, COL, key));
  return snap.exists() ? (snap.data().value ?? {}) : {};
}
async function writeDoc(key, value) {
  await setDoc(doc(db, COL, key), { value });
}

// ── Session Panel ─────────────────────────────────────────────
function SessionPanel({ liveState, setLiveState }) {
  const [sessions, setSessions]     = useState([]);
  const [saveName, setSaveName]     = useState("");
  const [busy, setBusy]             = useState(false);
  const [msg, setMsg]               = useState(null);
  const [confirm, setConfirm]       = useState(null);

  useEffect(() => { refreshList(); }, []);

  const refreshList = async () => {
    try {
      const s = await readDoc("sessions");
      const list = Object.entries(s)
        .map(([name, d]) => ({ name, savedAt: d.savedAt }))
        .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
      setSessions(list);
    } catch {}
  };

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const run = async (label, fn) => {
    setBusy(true);
    setConfirm(null);
    try {
      await fn();
      flash(label + " ✓");
      await refreshList();
    } catch (e) {
      flash(e.message || "Error", false);
    } finally {
      setBusy(false);
    }
  };

  const ask = (label, fn) => setConfirm({ label, fn });

  // ── actions ──
  const doResetTeam = async (teamId) => {
    const [gs, chat] = await Promise.all([readDoc("gameState"), readDoc("chat")]);
    // rebuild this team's state from INITIAL_STATE
    const freshTeam = INITIAL_STATE[teamId];
    await Promise.all([
      writeDoc("gameState", { ...gs,   [teamId]: freshTeam }),
      writeDoc("chat",      { ...chat, [teamId]: []        }),
    ]);
    // also update the live state in the parent so UI reflects immediately
    setLiveState({ ...liveState, [teamId]: freshTeam });
  };

  const doResetAll = async () => {
    await Promise.all([
      writeDoc("gameState", INITIAL_STATE),
      writeDoc("chat",      {}),
    ]);
    setLiveState(INITIAL_STATE);
  };

  const doSave = async () => {
    const name = saveName.trim();
    if (!name) throw new Error("Session name is required");
    const [gs, chat] = await Promise.all([readDoc("gameState"), readDoc("chat")]);
    const existing = await readDoc("sessions");
    await writeDoc("sessions", {
      ...existing,
      [name]: { savedAt: new Date().toISOString(), gameState: gs, chat },
    });
    setSaveName("");
  };

  const doLoad = async (name) => {
    const sessions = await readDoc("sessions");
    const slot = sessions[name];
    if (!slot) throw new Error(`Session "${name}" not found`);
    await Promise.all([
      writeDoc("gameState", slot.gameState),
      writeDoc("chat",      slot.chat),
    ]);
    setLiveState(slot.gameState);
  };

  const doDelete = async (name) => {
    const sessions = await readDoc("sessions");
    const { [name]: _, ...rest } = sessions;
    await writeDoc("sessions", rest);
  };

  // ── render ──
  const btn = (cls) =>
    `px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-40 ${cls}`;

  return (
    <div className="max-w-xl space-y-6">

      {/* Flash */}
      {msg && (
        <div className={`px-3 py-2 rounded text-xs font-medium ${msg.ok
          ? "bg-green-900 text-green-300 border border-green-700"
          : "bg-red-900 text-red-300 border border-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div className="bg-yellow-950 border border-yellow-700 rounded-lg px-4 py-3 space-y-2">
          <p className="text-xs text-yellow-200 font-semibold">⚠️ {confirm.label} — are you sure?</p>
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => run(confirm.label, confirm.fn)}
              className={btn("bg-red-700 hover:bg-red-600 text-white cursor-pointer")}>
              Yes, proceed
            </button>
            <button onClick={() => setConfirm(null)}
              className={btn("bg-gray-700 hover:bg-gray-600 text-gray-200 cursor-pointer")}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── RESET ── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">🔄 Reset</h3>
        <div className="space-y-2 mb-3">
          {TEAMS.map(team => (
            <div key={team.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <img src={team.logo} alt="" className="w-5 h-5 rounded-full object-cover"
                  onError={e => e.target.style.display="none"} />
                <span className="text-xs font-semibold text-gray-200">{team.name}</span>
              </div>
              <button disabled={busy}
                onClick={() => ask(`Reset ${team.name}`, () => doResetTeam(team.id))}
                className={btn("bg-orange-800 hover:bg-orange-700 text-orange-100 cursor-pointer")}>
                Reset team
              </button>
            </div>
          ))}
        </div>
        <button disabled={busy}
          onClick={() => ask("Reset ALL teams", doResetAll)}
          className={btn("bg-red-800 hover:bg-red-700 text-red-100 cursor-pointer w-full")}>
          ⚠️ Reset ALL teams
        </button>
      </section>

      {/* ── SAVE ── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">💾 Save current session</h3>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
            placeholder='e.g. "June 2026 – Group A"'
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => e.key==="Enter" && saveName.trim() && run(`Saved "${saveName}"`, doSave)} />
          <button disabled={busy || !saveName.trim()}
            onClick={() => run(`Saved "${saveName}"`, doSave)}
            className={btn("bg-blue-700 hover:bg-blue-600 text-white cursor-pointer")}>
            Save
          </button>
        </div>
      </section>

      {/* ── SAVED SESSIONS ── */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">📂 Saved sessions</h3>
        {sessions.length === 0
          ? <p className="text-xs text-gray-600 italic">No saved sessions yet.</p>
          : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.name} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-200 truncate">{s.name}</div>
                    <div className="text-xs text-gray-500">{new Date(s.savedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button disabled={busy}
                      onClick={() => ask(`Load "${s.name}"`, () => doLoad(s.name))}
                      className={btn("bg-green-800 hover:bg-green-700 text-green-100 cursor-pointer")}>
                      ▶ Load
                    </button>
                    <button disabled={busy}
                      onClick={() => ask(`Delete "${s.name}"`, () => doDelete(s.name))}
                      className={btn("bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer")}>
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </section>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function InstructorDashboard() {
  const { data:state, save:setState, saving, synced } = useFirestore("gameState", INITIAL_STATE);
  const { chat, send:sendChat } = useChat();
  const [tab, setTab] = useState("overview");

  const set = (tid, sid, f, v) =>
    setState({ ...state, [tid]:{ ...state[tid], [sid]:{ ...state[tid][sid], [f]:v } } });

  const setHazard = (tid, v) =>
    setState({ ...state, [tid]:{ ...state[tid], hazard: v||null } });

  const releaseStage = (tid, sid) => set(tid, sid, "released", true);
  const lockStage    = (tid, sid) => set(tid, sid, "released", false);

  const releaseAll = (sid) => {
    const n = { ...state };
    TEAMS.forEach(t => {
      if (n[t.id][sid]?.option)
        n[t.id] = { ...n[t.id], [sid]:{ ...n[t.id][sid], released:true } };
    });
    setState(n);
  };

  const calcCost = (tid) => {
    let cost=0, pen=0;
    STAGES.forEach(s => {
      const c = state[tid]?.[s.id];
      if (!c?.option) return;
      const o = s.options[c.option];
      if (!o) return;
      cost += o.cost || 0;
      if (c.penalty && o.penalty) pen += o.penalty;
    });
    return { cost, pen, total: cost+pen };
  };

  const calcDays = (tid) => STAGES.reduce((d, s) => {
    const c = state[tid]?.[s.id];
    if (!c?.option) return d;
    const o = s.options[c.option];
    return d + (c.penalty && o?.timePenalty ? o.timePenalty : 0);
  }, 0);

  const totalUnread = TEAMS.filter(t => (chat[t.id]||[]).some(m=>m.from==="team")).length;
  const syncLabel   = !synced ? "🔴 Connecting…" : saving ? "⏳ Saving…" : "🟢 Live";

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100" style={{fontFamily:"system-ui,sans-serif",fontSize:"13px"}}>

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center gap-3">
        <span className="font-black text-yellow-400 text-xl">BOTF</span>
        <span className="text-gray-400 text-xs">Instructor Dashboard</span>
        <span className="ml-auto text-xs text-gray-500">{syncLabel}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-800 px-3 pt-2 border-b border-gray-700 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-t text-xs font-semibold capitalize flex items-center gap-1
              ${tab===t ? "bg-gray-700 text-yellow-400 border border-b-0 border-gray-600" : "text-gray-500 hover:text-gray-300"}`}>
            {t}
            {t==="chat" && totalUnread>0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{totalUnread}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-3">
        {tab==="overview"  && <TabOverview  state={state} calcCost={calcCost} calcDays={calcDays} setHazard={setHazard} />}
        {tab==="stages"    && <TabStages    state={state} set={set} releaseStage={releaseStage} lockStage={lockStage} releaseAll={releaseAll} />}
        {tab==="teams"     && <TabTeams     state={state} calcCost={calcCost} calcDays={calcDays} setHazard={setHazard} />}
        {tab==="timeline"  && <TabTimeline  state={state} calcDays={calcDays} RIG_DAILY={RIG_DAILY} AMR_DAILY={AMR_DAILY} />}
        {tab==="costs"     && <TabCosts     state={state} calcCost={calcCost} calcDays={calcDays} />}
        {tab==="penalties" && <TabPenalties state={state} />}
        {tab==="chat"      && <TabChat      chat={chat}   onSend={sendChat} />}
        {tab==="session"   && <SessionPanel liveState={state} setLiveState={setState} />}
      </div>
    </div>
  );
}