import { Flame, Gauge, RotateCcw } from "lucide-react";

export const ChaosInjector = ({ onCrashHDFC, onSpikeSBI, onReset }) => {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="chaos-injector">
      <span className="mr-auto text-xs font-medium text-slate-500">Simulate outage</span>
      <button
        type="button"
        data-testid="chaos-crash-hdfc-btn"
        onClick={onCrashHDFC}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-95"
      >
        <Flame className="h-3.5 w-3.5" /> Crash HDFC
      </button>
      <button
        type="button"
        data-testid="chaos-spike-sbi-btn"
        onClick={onSpikeSBI}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 active:scale-95"
      >
        <Gauge className="h-3.5 w-3.5" /> Spike SBI
      </button>
      <button
        type="button"
        data-testid="chaos-reset-btn"
        onClick={onReset}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset
      </button>
    </div>
  );
};
