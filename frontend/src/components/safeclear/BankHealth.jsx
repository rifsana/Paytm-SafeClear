const STATUS_META = {
  NORMAL:        { label: "Healthy",  dot: "bg-emerald-500", text: "text-emerald-700" },
  HEALTHY:       { label: "Healthy",  dot: "bg-emerald-500", text: "text-emerald-700" },
  LATENCY_SPIKE: { label: "Slow",     dot: "bg-amber-500",   text: "text-amber-700" },
  DEGRADED:      { label: "Degraded", dot: "bg-amber-500",   text: "text-amber-700" },
  CRASHED:       { label: "Down",     dot: "bg-rose-500",    text: "text-rose-700" },
};

export const BankHealth = ({ health = {}, children }) => {
  const entries = Object.entries(health || {});

  return (
    <section className="card @container" data-testid="bank-health-grid">
      <div className="card-header">
        <div>
          <div className="card-title">Bank health</div>
          <div className="card-subtitle">Payer issuer latency &amp; timeouts</div>
        </div>
        <span className="pill bg-slate-100 text-slate-600">Live</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 @lg:grid-cols-4 sm:px-5">
        {entries.map(([bank, h = {}]) => {
          const rawStatus = (h.status || "NORMAL").toUpperCase();
          const m = STATUS_META[rawStatus] || STATUS_META.NORMAL;
          const latency = Number(h.latency ?? h.p95_latency_ms ?? 180);
          const timeoutNum = Number(h.timeoutPct ?? h.timeout_rate ?? 0.5);

          return (
            <div key={bank} data-testid={`bank-health-${bank.toLowerCase()}`} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{bank}</span>
                <span className={`h-2 w-2 rounded-full ${m.dot}`} />
              </div>
              <div className="mt-2 text-lg font-semibold leading-none text-slate-900 tabular">
                {latency}
                <span className="ml-0.5 text-xs font-normal text-slate-500">ms</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className={`font-medium ${m.text}`}>{m.label}</span>
                <span className="text-slate-500 tabular">{isNaN(timeoutNum) ? "0.5" : timeoutNum.toFixed(1)}% t/o</span>
              </div>
            </div>
          );
        })}
      </div>
      {children && <div className="border-t border-slate-100 px-4 py-3 sm:px-5">{children}</div>}
    </section>
  );
};
