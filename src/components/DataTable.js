// src/components/DataTable.js
import { useState } from "react";

export default function DataTable({ table, clr }) {
  const [copied, setCopied] = useState(false);

  const copyTSV = () => {
    const lines = [table.headers.join("\t"), ...table.rows.map(r => r.join("\t"))];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className={`mb-4 rounded-lg border ${clr.border} overflow-hidden`}>
      {/* Table header */}
      <div className={`${clr.light} px-3 py-2 flex items-start justify-between gap-2`}>
        <div>
          <div className={`text-xs font-bold ${clr.text}`}>{table.title}</div>
          {table.note && <div className="text-xs text-gray-500 mt-0.5 italic">{table.note}</div>}
        </div>
        <button onClick={copyTSV}
          className="shrink-0 text-xs px-2 py-1 rounded border border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
          {copied ? "✅ Copied!" : "📋 Copy TSV"}
        </button>
      </div>
      {/* Scrollable table */}
      <div className="overflow-x-auto bg-gray-950 p-2">
        <table style={{borderCollapse:"collapse", width:"100%", fontSize:"11px"}}>
          <thead>
            <tr>
              {table.headers.map((h,i) => (
                <th key={i} style={{
                  background:"#1f2937", color:"#9ca3af", padding:"4px 8px",
                  textAlign:"left", border:"1px solid #374151", whiteSpace:"nowrap"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} style={{}} onMouseEnter={e=>e.currentTarget.style.background="#1f2937"}
                onMouseLeave={e=>e.currentTarget.style.background=""}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding:"3px 8px", border:"1px solid #374151", whiteSpace:"nowrap",
                    fontFamily:"monospace", color: table.highlight?.includes(ci) ? "#fde68a" : "#d1d5db",
                    background: table.highlight?.includes(ci) ? "#78350f" : "transparent",
                    fontWeight: table.highlight?.includes(ci) ? "bold" : "normal",
                  }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}