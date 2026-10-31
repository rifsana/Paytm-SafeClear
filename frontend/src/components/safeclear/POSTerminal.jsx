import { PackageCheck, Banknote, PauseOctagon } from "lucide-react";

const STATUS_META = {
  IDLE:            { label: "IDLE",            cls: "bg-slate-100 text-slate-700 border-slate-200" },
  PENDING:         { label: "PENDING",         cls: "bg-cyan-50 text-[#00BAF2] border-cyan-200" },
  POS_PENDING:     { label: "WEBHOOK DELAY",   cls: "bg-cyan-50 text-[#00BAF2] border-cyan-200" },
  SETTLED:         { label: "SETTLED",         cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  UDIR_SUCCESS:    { label: "UDIR SUCCESS",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  BANK_DECLINE:    { label: "DECLINED",        cls: "bg-rose-50 text-rose-700 border-rose-200" },
  SAFECLEAR_LOCK:  { label: "QR LOCKED",       cls: "bg-amber-50 text-amber-700 border-amber-200" },
  BANK_SLOW:       { label: "BANK SLOW",       cls: "bg-amber-50 text-amber-700 border-amber-200" },
  TIMEOUT_60S:     { label: "TIMEOUT 60s",     cls: "bg-amber-50 text-amber-700 border-amber-200" },
  HUMAN_IN_LOOP:   { label: "HUMAN-IN-LOOP",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  AUTO_REFUND:     { label: "AUTO-REFUND",     cls: "bg-violet-50 text-violet-700 border-violet-200" },
  UPI_DUPLICATE:   { label: "DUPLICATE",       cls: "bg-violet-50 text-violet-700 border-violet-200" },
};

export const POSTerminal = ({ amount, status, countdown, onDecision, decision }) => {
  const meta = STATUS_META[status] || STATUS_META.IDLE;

  return (
    <div className="rounded-2xl border border-slate-200 bg-[#0F172A] p-5 text-white" data-testid="pos-terminal">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-mono-ui">POS Terminal · Counter #3</div>
          <div className="font-display font-bold text-lg mt-1">Sharma General Store</div>
        </div>
        <span className={`font-mono-ui text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border bg-white/5 ${meta.cls}`} data-testid="pos-status">
          {meta.label}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Transaction</div>
          <div className="font-display text-4xl font-extrabold text-white" data-testid="pos-amount">
            ₹{amount.toLocaleString("en-IN")}
          </div>
        </div>
        {countdown > 0 && (
          <div className="text-right">
            <div className="text-[10px] text-amber-300 uppercase tracking-wider">Settlement in</div>
            <div className="font-mono-ui text-2xl font-bold text-amber-300">{countdown}s</div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          data-testid="pos-release-goods-btn"
          onClick={() => onDecision("RELEASE_GOODS")}
          className={`press-shrink flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold border transition-colors ${
            decision === "RELEASE_GOODS"
              ? "bg-emerald-500 border-emerald-400 text-white"
              : "bg-white/5 border-white/10 text-slate-200 hover:bg-emerald-500/20 hover:border-emerald-400/50"
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          Release Goods
        </button>
        <button
          data-testid="pos-cash-refund-btn"
          onClick={() => onDecision("CASH_REFUND")}
          className={`press-shrink flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold border transition-colors ${
            decision === "CASH_REFUND"
              ? "bg-violet-500 border-violet-400 text-white"
              : "bg-white/5 border-white/10 text-slate-200 hover:bg-violet-500/20 hover:border-violet-400/50"
          }`}
        >
          <Banknote className="w-4 h-4" />
          Cash + Auto-Refund
        </button>
        <button
          data-testid="pos-hold-queue-btn"
          onClick={() => onDecision("HOLD_QUEUE")}
          className={`press-shrink flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold border transition-colors ${
            decision === "HOLD_QUEUE"
              ? "bg-amber-500 border-amber-400 text-white"
              : "bg-white/5 border-white/10 text-slate-200 hover:bg-amber-500/20 hover:border-amber-400/50"
          }`}
        >
          <PauseOctagon className="w-4 h-4" />
          Hold Queue
        </button>
      </div>

      {decision && (
        <div className="mt-3 text-[11px] text-cyan-300 font-mono-ui" data-testid="pos-decision-echo">
          › Merchant chose: {decision.replace("_", " ")}
        </div>
      )}
    </div>
  );
};
