import { SCENARIOS } from "../../lib/simulator";
import { CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";

const META = {
  SCENARIO_A: {
    icon: CheckCircle2,
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    bg: "hover:bg-emerald-50/50",
  },
  SCENARIO_B: {
    icon: AlertTriangle,
    ring: "ring-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    bg: "hover:bg-amber-50/50",
  },
  SCENARIO_C: {
    icon: RefreshCcw,
    ring: "ring-violet-200",
    dot: "bg-violet-500",
    text: "text-violet-700",
    badge: "bg-violet-50 text-violet-800 border-violet-200",
    bg: "hover:bg-violet-50/50",
  },
};

export const ScenarioBar = ({ active, running, onRun }) => {
  return (
    <section
      data-testid="scenario-bar"
      className="card-surface px-4 py-4 sm:px-5 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center"
    >
      <div className="shrink-0 pr-4 lg:border-r lg:border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00BAF2] animate-ping" />
          <div className="font-display font-bold text-[#002970] text-sm">
            Master Demo Scenarios
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          Blueprint Section 5: The Ambiguous 60s Moments
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
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
              className={`press-shrink text-left rounded-2xl border bg-white p-3.5 ring-1 ${m.ring} ${m.bg} ${
                isActive ? "border-[#002970] shadow-md ring-2 ring-[#002970]/30" : "border-slate-200"
              } ${running ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${m.text}`} strokeWidth={2.4} />
                  <span className="text-[11px] font-mono-ui font-bold text-[#002970]">
                    Scenario {sc.key}
                  </span>
                </div>
                <span className={`text-[10px] font-mono-ui font-semibold px-2 py-0.5 rounded-full border ${m.badge}`}>
                  {sc.chip}
                </span>
              </div>
              <div className="font-display font-bold text-[#0F172A] text-sm mt-2 leading-tight">
                {sc.label}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{sc.subLabel}</span>
                <span className="font-mono-ui font-semibold text-[#002970]">{sc.bank}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
