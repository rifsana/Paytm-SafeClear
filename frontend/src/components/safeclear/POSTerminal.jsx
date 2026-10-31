import { useEffect, useState } from "react";
import {
  PackageCheck,
  Banknote,
  PauseCircle,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  XCircle,
  Copy,
  Undo2,
  ScanLine,
} from "lucide-react";
import { statusMeta, formatINR } from "@/lib/status";

const Panel = ({ tone, icon: Icon, spin, title, subtitle, children }) => {
  const t = {
    slate: "bg-slate-50 border-slate-200",
    sky: "bg-paytm-skySoft/50 border-sky-200",
    rose: "bg-rose-50/70 border-rose-200",
    amber: "bg-amber-50/70 border-amber-200",
    violet: "bg-violet-50/70 border-violet-200",
    emerald: "bg-emerald-50/70 border-emerald-200",
  }[tone];
  const ic = {
    slate: "bg-white text-slate-400",
    sky: "bg-white text-paytm-sky",
    rose: "bg-rose-500 text-white",
    amber: "bg-amber-500 text-white",
    violet: "bg-violet-600 text-white",
    emerald: "bg-emerald-500 text-white",
  }[tone];
  return (
    <div className={`animate-fade-in rounded-2xl border p-4 ${t}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-card ${ic}`}>
          <Icon className={`h-5 w-5 ${spin ? "animate-spin" : ""}`} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-slate-900">{title}</div>
          {subtitle && <div className="mt-0.5 text-[13px] leading-snug text-slate-600">{subtitle}</div>}
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export const POSTerminal = ({
  amount,
  status,
  token = "4821",
  customer = "Rahul S.",
  bank = "HDFC",
  rrn,
  refundRef,
  connected,
  onDecision,
  onScanQR,
  onInstantRefund,
  qrScanned,
}) => {
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [decision, setDecision] = useState(null);
  const meta = statusMeta(status);

  useEffect(() => {
    if (status === "IDLE") setDecision(null);
  }, [status]);

  const decide = (d) => {
    setDecision(d);
    onDecision?.(d);
  };

  const handleScanClick = () => {
    setScanModalOpen(true);
    setTimeout(() => {
      onScanQR?.();
      setScanModalOpen(false);
    }, 1200);
  };

  const isSettled = status === "SETTLED";

  const quickActions = [
    { id: "RELEASE_GOODS", label: "Release", icon: PackageCheck, active: decision === "RELEASE_GOODS" || isSettled, cls: "border-emerald-300 bg-emerald-50 text-emerald-700" },
    { id: "TAKE_CASH_AUTO_REFUND", label: "Cash + refund", icon: Banknote, active: decision === "TAKE_CASH_AUTO_REFUND", cls: "border-violet-300 bg-violet-50 text-violet-700" },
    { id: "HOLD_QUEUE", label: "Hold", icon: PauseCircle, active: decision === "HOLD_QUEUE", cls: "border-amber-300 bg-amber-50 text-amber-700" },
  ];

  return (
    <section className="card @container relative overflow-hidden" data-testid="pos-terminal">
      <div className="card-header">
        <div className="min-w-0">
          <div className="card-title">Counter POS</div>
          <div className="card-subtitle">Live customer attribution &amp; one-tap actions</div>
        </div>
        <span className={`pill shrink-0 ${connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`} />
          {connected ? "Online" : "Offline"}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        {/* Amount */}
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="eyebrow">Amount due · Token #{token}</div>
            <div className="mt-1 text-4xl font-bold tracking-tight text-paytm-navy tabular sm:text-5xl" data-testid="pos-amount">
              {formatINR(amount)}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {customer} · {bank} Bank
            </div>
          </div>
          <span className={`pill shrink-0 px-3 py-1 text-xs ${meta.classes.pill}`}>{meta.label}</span>
        </div>

        {/* State panel */}
        <div className="mt-5">
          {status === "IDLE" && (
            <Panel tone="slate" icon={QrCode} title="Waiting for payment" subtitle="Ask the customer to scan and pay. SafeClear will announce only confirmed credits." />
          )}

          {(status === "IN_FLIGHT" || status === "P1_IN_FLIGHT") && (
            <Panel
              tone="sky"
              icon={Loader2}
              spin
              title={status === "P1_IN_FLIGHT" ? "Payment #1 in flight" : `Processing with ${bank} Bank`}
              subtitle="Don't release goods yet — waiting for the bank to confirm."
            />
          )}

          {status === "DECLINED" && (
            <Panel
              tone="rose"
              icon={XCircle}
              title="Declined — no money debited"
              subtitle={`Token #${token} failed pre-debit (low balance). Customer is being offered 1-tap UPI Lite.`}
            />
          )}

          {status === "TIMEOUT_PENDING" && (
            <Panel
              tone="amber"
              icon={AlertTriangle}
              title={`Pending ${formatINR(amount)} from ${customer}`}
              subtitle={qrScanned ? "Status QR verified. Waiting for bank confirmation…" : "Bank switch is slow. Scan the customer's status QR to verify."}
            >
              <div className="flex flex-col gap-2 @md:flex-row">
                <button type="button" onClick={handleScanClick} disabled={qrScanned} className="btn-primary flex-1">
                  {qrScanned ? <ShieldCheck className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />}
                  {qrScanned ? "Verified · hold goods" : "Scan customer QR"}
                </button>
                <button type="button" onClick={() => decide("TAKE_CASH_AUTO_REFUND")} className="btn-outline">
                  <Banknote className="h-4 w-4" />
                  Ask for cash
                </button>
              </div>
            </Panel>
          )}

          {status === "DUPLICATE_ALERT" && (
            <Panel tone="violet" icon={Copy} title="Suspected duplicate payment" subtitle={`${customer} paid ${formatINR(amount)} twice within 25s.`}>
              <button type="button" onClick={onInstantRefund} className="btn w-full bg-violet-600 text-white hover:bg-violet-700">
                <Undo2 className="h-4 w-4" />
                Issue 1-tap refund · {formatINR(amount)}
              </button>
            </Panel>
          )}

          {status === "REFUNDED" && (
            <Panel
              tone="emerald"
              icon={CheckCircle2}
              title="Refund sent"
              subtitle={`${formatINR(amount)} returned to ${customer}${refundRef ? ` · ${refundRef}` : ""}. No chargeback risk.`}
            />
          )}

          {isSettled && (
            <Panel
              tone="emerald"
              icon={CheckCircle2}
              title="Payment received · release goods"
              subtitle={`Settlement guaranteed by SafeClear${rrn ? ` · RRN ${rrn}` : ""}`}
            />
          )}
        </div>

        {/* Counter quick actions */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {quickActions.map(({ id, label, icon: Icon, active, cls }) => (
            <button
              key={id}
              type="button"
              onClick={() => decide(id)}
              aria-pressed={active}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border px-1 text-xs font-semibold transition active:scale-[0.97] ${
                active ? cls : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Simulated scanner */}
      {scanModalOpen && (
        <div className="absolute inset-0 z-20 flex animate-fade-in flex-col items-center justify-center bg-paytm-navy/95 p-4 text-white">
          <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border-2 border-paytm-sky">
            <div className="absolute inset-x-2 h-0.5 animate-scan-laser rounded bg-paytm-sky shadow-[0_0_12px_#00BAF2]" />
            <QrCode className="h-16 w-16 text-white/20" />
          </div>
          <div className="mt-4 text-sm font-semibold">Scanning status QR…</div>
          <div className="mt-0.5 text-xs text-white/60">Verifying HMAC-SHA256 signature</div>
        </div>
      )}
    </section>
  );
};
