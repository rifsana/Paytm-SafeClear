import { ShieldCheck, Activity, Zap } from "lucide-react";

export const TopBar = ({ speed, onSpeedChange, live }) => {
  return (
    <header
      data-testid="safeclear-topbar"
      className="w-full bg-white border-b border-slate-200 sticky top-0 z-30"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#002970] flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-[#00BAF2]" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#002970] leading-none">
              Paytm <span className="text-[#00BAF2]">SafeClear</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Autonomous UPI incident resolution · NPCI UDIR connected
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            data-testid="live-indicator"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200"
          >
            <span className="status-dot bg-emerald-500 text-emerald-500" />
            <span className="font-mono-ui text-xs font-semibold text-emerald-700">
              {live ? "LIVE · UDIR" : "OFFLINE"}
            </span>
          </div>

          <div
            data-testid="speed-toggle"
            className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200"
          >
            {["1x", "4x"].map((s) => (
              <button
                key={s}
                data-testid={`speed-${s}-btn`}
                onClick={() => onSpeedChange(s)}
                className={`px-3 py-1 text-xs font-semibold font-mono-ui rounded-full press-shrink ${
                  speed === s
                    ? "bg-[#002970] text-white shadow"
                    : "text-slate-600 hover:text-[#002970]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
            <Zap className="w-3.5 h-3.5 text-[#00BAF2]" />
            <span className="font-medium">Demo Mode</span>
          </div>
        </div>
      </div>
    </header>
  );
};
