const typeColor = (t) => {
  if (/SUCCESS|SETTLED|DEBIT/.test(t)) return "bg-emerald-500";
  if (/DECLINE|CRASH|FAIL/.test(t)) return "bg-rose-500";
  if (/TIMEOUT|LOCK|SLOW|SPIKE|HUMAN/.test(t)) return "bg-amber-500";
  if (/DUPLIC|REFUND/.test(t)) return "bg-violet-500";
  return "bg-paytm-sky";
};

export const EventLog = ({ events = [] }) => {
  return (
    <section className="card" data-testid="event-log">
      <div className="card-header">
        <div>
          <div className="card-title">Event stream</div>
          <div className="card-subtitle">SafeClear engine activity</div>
        </div>
        <span className="pill bg-slate-100 text-slate-600">{events.length}</span>
      </div>
      <div className="thin-scroll max-h-80 overflow-y-auto px-4 py-2 sm:px-5">
        {events.length === 0 && <div className="py-8 text-center text-sm text-slate-500">Awaiting events…</div>}
        <ol>
          {events.map((e, i) => (
            <li key={e.id || i} data-testid={`event-log-item-${i}`} className="flex animate-fade-in gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${typeColor(e.type)}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">{String(e.type).replace(/_/g, " ")}</span>
                  <span className="font-mono text-[11px] text-slate-400">{e.time}</span>
                </div>
                <p className="mt-0.5 break-words text-[13px] leading-snug text-slate-600">{e.msg}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
