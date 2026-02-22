// src/components/ChatPanel.js
import { useRef, useEffect, useState } from "react";

export default function ChatPanel({ clr, team, msgs, onSend, onClose }) {
  const [msg, setMsg]   = useState("");
  const endRef          = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [msgs.length]);

  const send = () => {
    if (!msg.trim()) return;
    onSend(msg.trim());
    setMsg("");
  };

  return (
    <div className={`fixed right-3 bottom-16 w-72 bg-gray-800 border ${clr.border} rounded-xl shadow-2xl z-50 flex flex-col`}
      style={{height:"340px"}}>
      {/* Header */}
      <div className={`${clr.h} px-3 py-2 flex items-center justify-between rounded-t-xl`}>
        <div className="flex items-center gap-2">
          <img src={team?.logo} alt={team?.name}
            className="w-5 h-5 rounded-full object-cover"
            onError={e => e.target.style.display="none"} />
          <span className="text-white text-xs font-bold">💬 Message Instructor</span>
        </div>
        <button onClick={onClose} className="text-white opacity-70 hover:opacity-100">✕</button>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {msgs.length === 0 && (
          <div className="text-gray-600 text-xs text-center mt-6">
            No messages yet.<br />Ask your instructor anything!
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === "team" ? "justify-end" : "justify-start"} fadein`}>
            <div className={`max-w-48 rounded-xl px-2.5 py-1.5 text-xs
              ${m.from === "team" ? `${clr.h} text-white` : "bg-gray-700 text-gray-200"}`}>
              <div>{m.text}</div>
              <div className="opacity-50 text-xs mt-0.5">
                {m.from === "team" ? "You" : "Instructor"} · {m.time}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {/* Input */}
      <div className="px-2 pb-2 flex gap-1.5">
        <input
          className="flex-1 bg-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-yellow-400"
          placeholder="Type a message…"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()} />
        <button onClick={send} className={`${clr.btn} text-white text-xs px-2.5 py-1.5 rounded-lg font-bold`}>→</button>
      </div>
    </div>
  );
}