import { TrendingUp } from "lucide-react";

const STATUS_CLS = {
  SUCCESS:        "text-emerald-700 bg-emerald-50 border-emerald-200",
  SETTLED:        "text-emerald-700 bg-emerald-50 border-emerald-200",
  FAILED:         "text-rose-700 bg-rose-50 border-rose-200",
  HUMAN_IN_LOOP:  "text-amber-700 bg-amber-50 border-amber-200",
  AUTO_REFUNDED:  "text-violet-700 bg-violet-50 border-violet-200",
};

export const LedgerFeed = ({ entries }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4" data-testid="ledger-feed">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#002970]" />
          <div className="font-display font-bold text-[#002970] text-sm">Live Merchant Ledger</div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono-ui">{entries.length} txns</div>
      </div>

      <div className="max-h-56 overflow-y-auto thin-scroll space-y-1.5">
        {entries.length === 0 && (
          <div className="text-xs text-slate-500 italic py-6 text-center">
            No settlements yet. Run a scenario to see transactions appear.
          </div>
        )}
        {entries.map((e) => (
          <div
            key={e.id}
            data-testid={`ledger-entry-${e.id}`}
            className="log-item flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/40 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#002970] truncate">{e.ref}</div>
              <div className="text-[10px] text-slate-500 font-mono-ui">{e.time} · {e.bank}</div>
            </div>
            <div className="font-display font-bold text-[#002970] text-sm">
              ₹{e.amount.toLocaleString("en-IN")}
            </div>
            <span className={`font-mono-ui text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_CLS[e.status] || "text-slate-700 bg-slate-50 border-slate-200"}`}>
              {e.status.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
