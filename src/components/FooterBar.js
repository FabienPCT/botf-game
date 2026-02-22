// src/components/FooterBar.js
export default function FooterBar({ clr, synced, unlockedCount, totalStages, runningCost }) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 ${clr.light} border-t ${clr.border} px-4 py-2 flex items-center justify-between z-40`}>
      <div className="text-xs text-gray-500 flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full inline-block ${synced ? "bg-green-400" : "bg-yellow-400"}`} />
        {synced ? "Live – real-time sync" : "Connecting…"}
        <span className="ml-2">{unlockedCount}/{totalStages} stages unlocked</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Option costs so far:</span>
        <span className="font-bold text-yellow-300">{runningCost} kUSD</span>
      </div>
    </div>
  );
}