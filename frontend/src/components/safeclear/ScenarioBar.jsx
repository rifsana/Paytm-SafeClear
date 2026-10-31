import { SCENARIOS } from "../../lib/simulator";
import { Zap, XCircle, Clock, Copy } from "lucide-react";

const META = {
  LATE_WEBHOOK: { icon: Zap,    ring: "ring-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", bg: "hover:bg-emerald-50" },
  BANK_DECLINE: { icon: XCircle, ring: "ring-rose-200",   dot: "bg-rose-500",    text: "text-rose-700",    bg: "hover:bg-rose-50" },
  BANK_TIMEOUT: { icon: Clock,   ring: "ring-amber-200",  dot: "bg-amber-500",   text: "text-amber-700",   bg: "hover:bg-amber-50" },
  DUPLICATE:    { icon: Copy,    ring: "ring-violet-200", dot: "bg-violet-500",  text: "text-violet-700",  bg: "hover:bg-violet-50" },
};

export const ScenarioBar = ({ active, running, onRun }) => {
  return (
    <section
      data-testid="scenario-bar"
      className="card-surface px-4 py-4 sm:px-5 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center"
    >
      <div className="shrink-0 pr-4 lg:border-r lg:border-slate-200">
        <div className="font-display font-bold text-[#002970] text-sm">
          Live Simulations
        </div>
        <div className="text-[11px] text-slate-500">
          Trigger a scenario to run end-to-end
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
        {Object.values(SCENARIOS).map((sc) => {
          const m = META[sc.id];
          const Icon = m.icon;
          const isActive = active === sc.id;
          return (
            <button
              key={sc.id}
              data-testid={`scenario-${sc.id.toLowerCase().replace(/_/g, "-")}-btn`}
              disabled={running}
              onClick={() => onRun(sc.id)}
              className={`press-shrink text-left rounded-2xl border bg-white px-3 py-3 ring-1 ${m.ring} ${m.bg} ${
                isActive ? "border-[#002970] shadow-md" : "border-slate-200"
              } ${running ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${m.text}`} strokeWidth={2.4} />
                <span className={`text-[10px] font-mono-ui font-semibold ${m.text}`}>
                  {sc.chip}
                </span>
              </div>
              <div className="font-display font-semibold text-[#002970] text-sm mt-2 leading-tight">
                {sc.label}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">via {sc.bank}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
