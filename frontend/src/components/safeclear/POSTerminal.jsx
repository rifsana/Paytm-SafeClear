import { useState } from "react";
import { PackageCheck, Banknote, PauseOctagon, QrCode, RefreshCcw, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

export const POSTerminal = ({
  amount,
  status,
  token = "4821",
  customer = "Rahul S.",
  onDecision,
  decision,
  onScanQR,
  onInstantRefund,
  refundDone,
  qrScanned,
}) => {
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const isPending = status === "BANK_TIMEOUT_U68" || status === "STATUS_QR_SURFACED" || status === "MERCHANT_STICKY";
  const isDecline = status === "PRE_DEBIT_DECLINE" || status === "SARVAM_EXPLAINER" || status === "UPI_LITE_PROMPT";
  const isDuplicate = status === "PANIC_RESCAN" || status === "INTENT_GUARD_ALERT" || status === "MERCHANT_DUPLICATE";
  const isSettled = status === "SETTLED" || status === "SWITCH_SETTLED";

  const handleScanClick = () => {
    setScanModalOpen(true);
    setTimeout(() => {
      onScanQR?.();
      setScanModalOpen(false);
    }, 1200);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-[#0F172A] p-5 text-white shadow-xl relative overflow-hidden" data-testid="pos-terminal">
      {/* Top Bar with Counter #3 & Token */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-cyan-300 font-mono-ui font-semibold">
              POS Terminal · Counter #3
            </span>
          </div>
          <div className="font-display font-bold text-lg mt-0.5">Sharma General Store</div>
        </div>

        <div className="text-right">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-mono-ui">Counter Token</div>
          <div className="font-mono-ui font-black text-amber-300 text-base">
            Token #{token}
          </div>
        </div>
      </div>

      {/* Main Amount & Live Status Banner */}
      <div className="mt-4 flex items-end justify-between border-y border-white/10 py-3">
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Amount Due</div>
          <div className="font-display text-4xl font-black text-white" data-testid="pos-amount">
            ₹{amount.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Status</div>
          <span
            className={`inline-block font-mono-ui text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              isSettled
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400"
                : isDuplicate
                ? "bg-violet-500/20 text-violet-300 border-violet-400"
                : isPending
                ? "bg-amber-500/20 text-amber-300 border-amber-400"
                : isDecline
                ? "bg-rose-500/20 text-rose-300 border-rose-400"
                : "bg-white/10 text-slate-300 border-white/20"
            }`}
          >
            {isSettled
              ? "SETTLED ✅"
              : isDuplicate
              ? "DUPLICATE ALERT ⚠️"
              : isPending
              ? "IN-FLIGHT PENDING ⏳"
              : isDecline
              ? "PRE-DEBIT DECLINED ❌"
              : "READY"}
          </span>
        </div>
      </div>

      {/* DYNAMIC SCENARIO ACTION CARDS */}

      {/* 1. SCENARIO B: AMBER STICKY CARD FOR IN-FLIGHT PENDING */}
      {isPending && !isSettled && (
        <div className="mt-3 p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/60 text-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-display font-bold text-sm text-white">
                  Pending: ₹{amount} from {customer}
                </div>
                <div className="text-[11px] text-amber-300/80 font-mono-ui">
                  Token #{token} · Bank switch reconciling...
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleScanClick}
              className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-display font-bold text-xs flex items-center justify-center gap-1.5 press-shrink shadow-md"
            >
              <QrCode className="w-4 h-4" />
              {qrScanned ? "Verified ✓ (Hold Goods)" : "Scan Customer QR (1s Proof)"}
            </button>
            <button
              onClick={() => onDecision("TAKE_CASH_AUTO_REFUND")}
              className="min-h-[44px] py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center gap-1 press-shrink"
            >
              Ask Cash
            </button>
          </div>
        </div>
      )}

      {/* 2. SCENARIO C: PURPLE DUPLICATE WARNING & 1-TAP REFUND */}
      {isDuplicate && !refundDone && (
        <div className="mt-3 p-3.5 rounded-xl bg-violet-950/70 border border-violet-500/60 text-violet-200">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCcw className="w-5 h-5 text-violet-400 animate-spin" />
            <div>
              <div className="font-display font-bold text-sm text-white">
                ⚠️ Suspected Duplicate Payment
              </div>
              <div className="text-[11px] text-violet-300 font-mono-ui">
                {customer} paid ₹{amount} twice within 45s
              </div>
            </div>
          </div>

          <button
            onClick={onInstantRefund}
            className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-display font-bold text-xs flex items-center justify-center gap-2 press-shrink shadow-lg"
          >
            <ShieldCheck className="w-4 h-4" />
            Issue 1-Tap Instant Refund (₹{amount})
          </button>
        </div>
      )}

      {/* Duplicate Refund Completed */}
      {refundDone && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div className="text-xs">
            <span className="font-bold">Instant Refund Executed!</span> ₹{amount} sent back to {customer}. Docket sealed.
          </div>
        </div>
      )}

      {/* 3. SCENARIO A: PRE-DEBIT DECLINE ALERT */}
      {isDecline && !isSettled && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200">
          <div className="font-display font-bold text-sm text-white">
            Token #{token} Declined (Low Balance / Wrong PIN)
          </div>
          <div className="text-[11px] text-rose-300/80 mt-0.5">
            Zero money debited. Soundbox vocalized: "Saman na dein". Customer using UPI Lite.
          </div>
        </div>
      )}

      {/* 4. SETTLED STATE */}
      {isSettled && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/70 text-emerald-200 flex items-center gap-2.5">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <div className="font-display font-bold text-sm text-white">
              Payment 100% Settled · Release Goods
            </div>
            <div className="text-[11px] text-emerald-300 font-mono-ui">
              SafeClear Settlement Guarantee active • Zero dispute risk
            </div>
          </div>
        </div>
      )}

      {/* Merchant Counter Quick Actions */}
      <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2">
        <button
          onClick={() => onDecision("RELEASE_GOODS")}
          className={`min-h-[44px] press-shrink flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-semibold border transition-all ${
            decision === "RELEASE_GOODS" || isSettled
              ? "bg-emerald-500 border-emerald-400 text-white shadow-md"
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-emerald-500/20"
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          Release Goods
        </button>
        <button
          onClick={() => onDecision("TAKE_CASH_AUTO_REFUND")}
          className={`min-h-[44px] press-shrink flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-semibold border transition-all ${
            decision === "TAKE_CASH_AUTO_REFUND"
              ? "bg-violet-500 border-violet-400 text-white shadow-md"
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-violet-500/20"
          }`}
        >
          <Banknote className="w-4 h-4" />
          Cash + Auto-Refund
        </button>
        <button
          onClick={() => onDecision("HOLD_QUEUE")}
          className={`min-h-[44px] press-shrink flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-semibold border transition-all ${
            decision === "HOLD_QUEUE"
              ? "bg-amber-500 border-amber-400 text-white shadow-md"
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-amber-500/20"
          }`}
        >
          <PauseOctagon className="w-4 h-4" />
          Hold Queue
        </button>
      </div>

      {/* Simulated Scanner Modal */}
      {scanModalOpen && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-20">
          <div
            className="border-2 border-cyan-400 rounded-xl relative flex items-center justify-center overflow-hidden"
            style={{ width: "160px", height: "160px" }}
          >
            <div className="w-full h-1 bg-cyan-400 absolute top-0 animate-[scanLaser_1s_infinite]" />
            <QrCode className="w-16 h-16 text-cyan-300/40" />
          </div>
          <div className="mt-3 font-mono-ui text-xs font-bold text-cyan-300">
            Scanning Customer Dynamic Status QR...
          </div>
          <div className="text-[10px] text-slate-400">Verifying HMAC-SHA256 signature</div>
        </div>
      )}
    </div>
  );
};
