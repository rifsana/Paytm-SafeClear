import { Radio } from "lucide-react";

const typeColor = (t) => {
  if (/SUCCESS|SETTLED|DEBIT/.test(t)) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (/DECLINE|CRASH|FAIL/.test(t)) return "text-rose-700 bg-rose-50 border-rose-200";
  if (/TIMEOUT|LOCK|SLOW|SPIKE|HUMAN/.test(t)) return "text-amber-700 bg-amber-50 border-amber-200";
  if (/DUPLIC|REFUND/.test(t)) return "text-violet-700 bg-violet-50 border-violet-200";
  return "text-[#002970] bg-cyan-50 border-cyan-200";
};

export const EventLog = ({ events }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4" data-testid="event-log">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#002970]" />
          <div className="font-display font-bold text-[#002970] text-sm">SafeClear Event Stream</div>
        </div>
        <span className="status-dot bg-emerald-500 text-emerald-500" />
      </div>
      <div className="max-h-72 overflow-y-auto thin-scroll space-y-1.5">
        {events.length === 0 && (
          <div className="text-xs text-slate-500 italic py-4 text-center">
            Awaiting events…
          </div>
        )}
        {events.map((e, i) => (
          <div
            key={e.id || i}
            data-testid={`event-log-item-${i}`}
            className="log-item flex gap-2 items-start text-[11px] font-mono-ui border-b border-slate-100 last:border-b-0 pb-1.5"
          >
            <span className="text-slate-400 shrink-0">{e.time}</span>
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border ${typeColor(e.type)}`}>
              {e.type}
            </span>
            <span className="text-slate-700 leading-snug">{e.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
