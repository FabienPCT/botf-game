// src/instructor/TabChat.js
import { useRef, useEffect, useState } from "react";
import { TEAMS, CLR } from "../data/teams";

export default function TabChat({ chat, onSend }) {
  const [replyText, setReplyText] = useState({});
  const endRefs = useRef({});
  const totalUnread = TEAMS.filter(t => (chat[t.id]||[]).some(m => m.from==="team")).length;

  useEffect(() => {
    TEAMS.forEach(t => endRefs.current[t.id]?.scrollIntoView({ behavior:"smooth" }));
  }, [chat]);

  const send = (tid) => {
    const txt = (replyText[tid] || "").trim();
    if (!txt) return;
    onSend(tid, txt);
    setReplyText(p => ({...p, [tid]:""}));
  };

  return (
    <div>
      <h2 className="font-bold text-yellow-400 mb-3">
        Team Messages
        {totalUnread > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{totalUnread} new</span>
        )}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {TEAMS.map(t => {
          const c      = CLR[t.color];
          const msgs   = chat[t.id] || [];
          const hasNew = msgs.some(m => m.from==="team");
          return (
            <div key={t.id} className={`${c.light} border ${hasNew ? "border-yellow-500" : c.border} rounded-lg p-3`}>
              {/* Team header */}
              <div className={`font-bold text-xs ${c.text} mb-2 flex items-center gap-2`}>
                <img src={t.logo} alt={t.name} className="w-5 h-5 rounded-full object-cover"
                  onError={e => e.target.style.display="none"} />
                {t.name}
                {hasNew && <span className="bg-yellow-500 text-gray-900 text-xs rounded-full px-1.5 py-0.5 font-bold">New</span>}
              </div>

              {/* Messages */}
              <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
                {msgs.length === 0 && <div className="text-gray-600 text-xs">No messages yet</div>}
                {msgs.map((m, i) => (
                  <div key={i} className={`flex ${m.from==="instructor" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs rounded-lg px-2.5 py-1.5 text-xs
                      ${m.from==="instructor" ? "bg-blue-800 text-blue-100" : "bg-gray-700 text-gray-200"}`}>
                      <div>{m.text}</div>
                      <div className="opacity-50 text-xs mt-0.5">
                        {m.from==="instructor" ? "You" : t.name} · {m.time}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={el => { if (el) endRefs.current[t.id] = el; }} />
              </div>

              {/* Reply input */}
              <div className="flex gap-1.5">
                <input
                  className="flex-1 bg-gray-800 text-gray-200 text-xs rounded px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder={`Reply to ${t.name}…`}
                  value={replyText[t.id] || ""}
                  onChange={e => setReplyText(p => ({...p,[t.id]:e.target.value}))}
                  onKeyDown={e => e.key==="Enter" && send(t.id)} />
                <button onClick={() => send(t.id)}
                  className="bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded font-bold">
                  Send
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}