import { Flame, AlertTriangle, RotateCcw } from "lucide-react";

export const ChaosInjector = ({ onCrashHDFC, onSpikeSBI, onReset }) => {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-4"
      data-testid="chaos-injector"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="font-display font-bold text-[#002970] text-sm">Bank Chaos Injector</div>
        <div className="text-[10px] text-slate-500 font-mono-ui">tactical ops</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          data-testid="chaos-crash-hdfc-btn"
          onClick={onCrashHDFC}
          className="press-shrink rounded-xl bg-rose-600 text-white px-2 py-2 text-xs font-display font-semibold flex items-center justify-center gap-1 hover:bg-rose-700"
        >
          <Flame className="w-3.5 h-3.5" /> Crash HDFC
        </button>
        <button
          data-testid="chaos-spike-sbi-btn"
          onClick={onSpikeSBI}
          className="press-shrink rounded-xl bg-amber-500 text-white px-2 py-2 text-xs font-display font-semibold flex items-center justify-center gap-1 hover:bg-amber-600"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Spike SBI
        </button>
        <button
          data-testid="chaos-reset-btn"
          onClick={onReset}
          className="press-shrink rounded-xl bg-[#002970] text-white px-2 py-2 text-xs font-display font-semibold flex items-center justify-center gap-1 hover:bg-[#001c54]"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Normal
        </button>
      </div>
    </div>
  );
};
