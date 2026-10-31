import { Landmark } from "lucide-react";

const STATUS_META = {
  NORMAL:        { label: "NORMAL",   dot: "bg-emerald-500 text-emerald-500", ring: "ring-emerald-200", pill: "text-emerald-700" },
  HEALTHY:       { label: "HEALTHY",  dot: "bg-emerald-500 text-emerald-500", ring: "ring-emerald-200", pill: "text-emerald-700" },
  LATENCY_SPIKE: { label: "SPIKE",    dot: "bg-amber-500 text-amber-500",    ring: "ring-amber-300",   pill: "text-amber-700" },
  DEGRADED:      { label: "DEGRADED", dot: "bg-amber-500 text-amber-500",    ring: "ring-amber-300",   pill: "text-amber-700" },
  CRASHED:       { label: "CRASHED",  dot: "bg-rose-500 text-rose-500",      ring: "ring-rose-300",    pill: "text-rose-700" },
};

export const BankHealth = ({ health = {} }) => {
  const entries = Object.entries(health || {});

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4" data-testid="bank-health-grid">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-[#002970]" />
          <div className="font-display font-bold text-[#002970] text-sm">Payer Issuer Bank Health</div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono-ui">live · 1s</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([bank, h = {}]) => {
          const rawStatus = (h.status || "NORMAL").toUpperCase();
          const m = STATUS_META[rawStatus] || STATUS_META.NORMAL;
          const latency = Number(h.latency ?? h.p95_latency_ms ?? 180);
          const timeoutNum = Number(h.timeoutPct ?? h.timeout_rate ?? 0.5);

          return (
            <div
              key={bank}
              data-testid={`bank-health-${bank.toLowerCase()}`}
              className={`rounded-xl border bg-slate-50/60 p-3 ring-1 ${m.ring}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-[#002970] text-sm">{bank}</span>
                <span className={`status-dot ${m.dot}`} />
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-slate-500">latency</span>
                <span className="font-mono-ui text-[#002970] font-semibold">{latency}ms</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">timeout</span>
                <span className="font-mono-ui text-[#002970] font-semibold">
                  {isNaN(timeoutNum) ? "0.5" : timeoutNum.toFixed(1)}%
                </span>
              </div>
              <div className={`mt-2 text-[10px] font-mono-ui uppercase tracking-wider font-bold ${m.pill}`}>
                {m.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
