import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";
import { formatINR } from "@/lib/status";

const STATUS_CLS = {
  SUCCESS:       "text-emerald-600",
  SETTLED:       "text-emerald-600",
  FAILED:        "text-rose-600",
  HUMAN_IN_LOOP: "text-amber-600",
  AUTO_REFUNDED: "text-violet-600",
};

export const LedgerFeed = ({ entries = [] }) => {
  return (
    <section className="card flex flex-col" data-testid="ledger-feed">
      <div className="card-header">
        <div>
          <div className="card-title">Today's payments</div>
          <div className="card-subtitle">Live merchant ledger</div>
        </div>
        <span className="pill bg-slate-100 text-slate-600">{entries.length}</span>
      </div>

      <div className="thin-scroll max-h-72 flex-1 overflow-y-auto">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div className="mt-3 text-sm font-medium text-slate-700">No payments yet</div>
            <div className="mt-0.5 text-xs text-slate-500">Run a scenario to see settlements here.</div>
          </div>
        )}
        <ul className="divide-y divide-slate-100">
          {entries.map((e) => {
            const refund = e.status === "AUTO_REFUNDED";
            const Icon = refund ? ArrowUpRight : ArrowDownLeft;
            return (
              <li key={e.id} data-testid={`ledger-entry-${e.id}`} className="flex animate-fade-in items-center gap-3 px-4 py-3 sm:px-5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${refund ? "bg-violet-50 text-violet-600" : "bg-emerald-50 text-emerald-600"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{e.ref}</div>
                  <div className="text-xs text-slate-500 tabular">{e.time} · {e.bank}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold tabular ${refund ? "text-slate-900" : "text-emerald-600"}`}>
                    {refund ? "−" : "+"}{formatINR(e.amount)}
                  </div>
                  <div className={`text-[11px] font-medium capitalize ${STATUS_CLS[e.status] || "text-slate-500"}`}>
                    {String(e.status).replace(/_/g, " ").toLowerCase()}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
