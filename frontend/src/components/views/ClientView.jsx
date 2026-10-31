import { useMemo, useState } from "react";
import {
  ShieldCheck,
  AlertCircle,
  Zap,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Landmark,
  Copy,
  Undo2,
  Signal,
  Wifi,
  BatteryFull,
  MessageCircleQuestion,
  Sparkles,
} from "lucide-react";
import { PaytmLogo, LiveDot } from "@/components/ui/Brand";
import { SCENARIO_OPTIONS, formatINR } from "@/lib/status";

const EXPLAINER = {
  hinglish: "Account mein balance kam tha. Paisa bilkul nahi kata. UPI Lite ya doosra bank chunein.",
  hindi: "Aapke account mein zaroori balance nahi tha. Bank ne payment roki hai aur aapke account se koi paisa nahi kata.",
  tamil: "Kanakil pothumaana panam illai. Panam edukkapadavillai. UPI Lite payanpaduthavum.",
};

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const Verdict = ({ tone, icon: Icon, title, subtitle }) => {
  const cls = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    violet: "bg-violet-50 text-violet-800 border-violet-200",
  }[tone];
  const iconCls = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    violet: "bg-violet-600",
  }[tone];
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-3.5 ${cls}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${iconCls}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold">{title}</div>
        {subtitle && <div className="mt-0.5 text-xs leading-snug opacity-80">{subtitle}</div>}
      </div>
    </div>
  );
};

const PhoneStatusBar = () => (
  <div className="flex h-10 items-center justify-between bg-white px-6 pt-1 text-[13px] font-semibold text-slate-900">
    <span className="tabular">9:41</span>
    <span className="flex items-center gap-1.5">
      <Signal className="h-3.5 w-3.5" />
      <Wifi className="h-3.5 w-3.5" />
      <BatteryFull className="h-4 w-4" />
    </span>
  </div>
);

export const ClientView = ({
  session,
  onPay,
  onUpiLitePay,
  onPanicRescan,
  onReset,
  onSelectScenario,
  connected,
  embedded = false,
}) => {
  const [selectedLang, setSelectedLang] = useState("hinglish");
  const [triageText, setTriageText] = useState("");
  const [triageResult, setTriageResult] = useState(null);

  const amount = session?.amount || 350;
  const status = session?.status || "IDLE";
  const token = session?.token || "4821";
  const bank = session?.bank || "HDFC";
  const store = session?.store || "Sharma Bakery";
  const scenario = session?.scenario || "SCENARIO_A";

  // Dynamic QR generator for Scenario B Status QR
  const qrCells = useMemo(() => {
    const seed = (token || "4821").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const cells = [];
    for (let i = 0; i < 625; i++) {
      const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
      cells.push(Math.floor((v - Math.floor(v)) * 2));
    }
    const setBlock = (r, c) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          const idx = (r + i) * 25 + (c + j);
          const border = i === 0 || i === 6 || j === 0 || j === 6;
          const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          cells[idx] = border || inner ? 1 : 0;
        }
      }
    };
    setBlock(0, 0);
    setBlock(0, 18);
    setBlock(18, 0);
    return cells;
  }, [token]);

  const handleTriage = () => {
    if (!triageText.trim()) return;
    const t_low = triageText.toLowerCase();
    if (t_low.includes("cut") || t_low.includes("kat") || t_low.includes("debit") || t_low.includes("paisa")) {
      setTriageResult({
        category: "Paid, not received",
        action: "Bank switch live verify kar raha hai. 30s ruko, dobara pay mat karein.",
      });
    } else {
      setTriageResult({
        category: "Zero paisa kata",
        action: "Account se koi paisa nahi kata. 1-tap UPI Lite se turant pay karein.",
      });
    }
  };

  const isProcessing = status === "IN_FLIGHT" || status === "P1_IN_FLIGHT";

  return (
    <div
      className={
        embedded
          ? "thin-scroll flex h-full flex-col overflow-y-auto bg-paytm-bg"
          : "mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-md flex-col bg-paytm-bg sm:py-6"
      }
    >
      {embedded && (
        <div className="sticky top-0 z-10">
          <PhoneStatusBar />
          <div className="flex h-12 items-center gap-3 border-b border-slate-100 bg-white px-4">
            <ArrowLeft className="h-5 w-5 text-slate-700" />
            <PaytmLogo className="text-lg" />
            <span className="ml-auto">
              <LiveDot connected={connected} showLabel={false} />
            </span>
          </div>
        </div>
      )}

      {/* Demo controls */}
      <div className="flex items-center gap-2 px-4 pb-1 pt-3">
        <div className="segmented no-scrollbar min-w-0 flex-1 overflow-x-auto" role="group" aria-label="Demo scenario">
          {SCENARIO_OPTIONS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              aria-pressed={scenario === sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className="flex-1 whitespace-nowrap !px-2"
            >
              {sc.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onReset} title="Reset payment" aria-label="Reset payment" className="btn-icon shrink-0 border border-slate-200 bg-white">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <main className={`flex-1 ${embedded ? "space-y-2.5 px-4 pb-4 pt-2" : "space-y-3 p-4"}`}>
        {/* Payee + amount */}
        {embedded ? (
          <section className="card flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paytm-skySoft text-base font-bold text-paytm-navy">
              {initials(store)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">Paying {store}</div>
              <div className="text-xs text-slate-500">Token #{token}</div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-paytm-navy tabular">{formatINR(amount)}</div>
          </section>
        ) : (
          <section className="card px-5 pb-5 pt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-paytm-skySoft text-lg font-bold text-paytm-navy">
              {initials(store)}
            </div>
            <div className="mt-3 text-base font-semibold text-slate-900">Paying {store}</div>
            <div className="mt-0.5 text-xs text-slate-500">PAYTM_POS_001 · Token #{token}</div>
            <div className="mt-4 text-[40px] font-bold leading-none tracking-tight text-paytm-navy tabular">
              {formatINR(amount)}
            </div>
          </section>
        )}

        {status === "IDLE" && (
          <section className="card animate-fade-in p-4">
            <div className="eyebrow mb-2">Pay using</div>
            <div className="flex items-center gap-3 rounded-xl border border-paytm-sky/40 bg-paytm-skySoft/40 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-paytm-navy shadow-card">
                <Landmark className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{bank} Bank</div>
                <div className="text-xs text-slate-500">Savings ••9821</div>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-[5px] border-paytm-sky bg-white" />
            </div>
            <button data-testid="mobile-pay-btn" type="button" onClick={onPay} className="btn-primary mt-4 h-12 w-full text-base">
              Pay {formatINR(amount)}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Secured by SafeClear
            </p>
          </section>
        )}

        {isProcessing && (
          <section className="card animate-fade-in p-6 text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-paytm-sky" />
            <div className="mt-3 text-sm font-semibold text-slate-900">
              {status === "P1_IN_FLIGHT" ? "Payment #1 processing…" : `Connecting to ${bank} Bank…`}
            </div>
            <p className="mt-1 text-xs text-slate-500">Please don't close the app or pay again.</p>

            {status === "P1_IN_FLIGHT" && (
              <div className="mt-5 border-t border-dashed border-slate-200 pt-4">
                <button
                  data-testid="mobile-panic-rescan-btn"
                  type="button"
                  onClick={onPanicRescan}
                  className="btn w-full border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Scan &amp; pay again
                </button>
                <p className="mt-1.5 text-[11px] text-slate-400">Demo: simulate an anxious re-scan</p>
              </div>
            )}
          </section>
        )}

        {status === "DECLINED" && (
          <section className="card animate-fade-in space-y-3 p-4">
            <Verdict tone="emerald" icon={ShieldCheck} title="Zero paisa kata" subtitle="Bank declined before debit. No money left your account." />

            <div className="rounded-xl bg-slate-50 p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-paytm-navy">
                  <Sparkles className="h-3.5 w-3.5 text-paytm-sky" /> Why it failed
                </span>
                <div className="segmented !p-0.5">
                  {Object.keys(EXPLAINER).map((l) => (
                    <button key={l} type="button" aria-pressed={selectedLang === l} onClick={() => setSelectedLang(l)} className="!px-2 !py-1 !text-[11px] capitalize">
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{EXPLAINER[selectedLang]}</p>
              <p className="mt-2 text-[11px] text-slate-400">
                <span className="line-through">"If debited, refund in 3–5 days"</span> — not needed, money never moved.
              </p>
            </div>

            <button data-testid="mobile-upi-lite-btn" type="button" onClick={onUpiLitePay} className="btn-primary h-12 w-full text-base">
              <Zap className="h-4 w-4 fill-current" />
              Pay {formatINR(amount)} with UPI Lite
            </button>
            <p className="text-center text-[11px] text-slate-400">On-device wallet · no bank timeouts</p>
          </section>
        )}

        {status === "TIMEOUT_PENDING" && (
          <section className={`card animate-fade-in p-4 ${embedded ? "space-y-3" : "space-y-4"}`}>
            <Verdict tone="amber" icon={AlertCircle} title="Paisa kata hai — confirming" subtitle="Your bank is slow to confirm. Don't pay again." />

            <div className="rounded-2xl border border-slate-200 p-4 text-center">
              <div className="eyebrow">Show this to the merchant</div>
              <div className="mx-auto mt-3 w-fit rounded-xl border border-slate-100 bg-white p-2.5 shadow-card">
                <svg viewBox="0 0 25 25" className={`block ${embedded ? "h-36 w-36" : "h-40 w-40"}`} shapeRendering="crispEdges">
                  {qrCells.map((v, i) =>
                    v ? <rect key={i} x={i % 25} y={Math.floor(i / 25)} width="1" height="1" fill="#002970" /> : null
                  )}
                </svg>
              </div>
              <div className="mt-3 text-sm font-semibold text-paytm-navy">Status QR · Token #{token}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">HMAC-SHA256 signed</div>
            </div>

            {!embedded && (
              <p className="text-center text-xs leading-relaxed text-slate-600">
                The merchant scans this to verify instantly. SafeClear is reconciling with the bank in the background.
              </p>
            )}
          </section>
        )}

        {status === "DUPLICATE_ALERT" && (
          <section className="card animate-fade-in space-y-3 p-4">
            <Verdict tone="violet" icon={Copy} title="Duplicate payment detected" subtitle={`You paid ${formatINR(amount)} twice within 25 seconds.`} />
            <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-700">
              Pehle wala payment confirm ho gaya hai. Merchant POS par 1-tap refund active hai.
            </p>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-violet-200 py-3 text-xs font-medium text-violet-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Waiting for merchant refund…
            </div>
          </section>
        )}

        {status === "REFUNDED" && (
          <section className="card animate-fade-in p-6 text-center">
            <span className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-emerald-500 text-white">
              <Undo2 className="h-8 w-8" />
            </span>
            <div className="mt-4 text-lg font-bold text-slate-900">{formatINR(amount)} refunded</div>
            <p className="mt-1 text-sm text-slate-500">Duplicate payment returned to your account instantly.</p>
            <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] text-slate-600">
              Ref {session?.refund_ref || "REF-IMPS-8291"}
            </div>
          </section>
        )}

        {status === "SETTLED" && (
          <section className="card animate-fade-in p-6 text-center">
            <span className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 className="h-9 w-9" />
            </span>
            <div className="mt-4 text-lg font-bold text-slate-900">Paid successfully</div>
            <p className="mt-1 text-sm text-slate-500">to {store} · merchant soundbox confirmed</p>
            <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] text-slate-600">
              UPI Ref {session?.rrn || "98124810291"}
            </div>
          </section>
        )}

        {/* Saaras-v4 vernacular dispute intake */}
        <section className="card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MessageCircleQuestion className="h-4 w-4 text-paytm-sky" />
            Need help with this payment?
          </div>
          <p className="mt-0.5 text-xs text-slate-500">Describe it in any language</p>
          <div className="mt-3 flex gap-2">
            <input
              value={triageText}
              onChange={(e) => setTriageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTriage()}
              placeholder="Paisa cut gaya par dukandar bola nahi aaya…"
              className="input min-w-0 flex-1"
            />
            <button type="button" onClick={handleTriage} className="btn-primary shrink-0 px-3.5" aria-label="Ask">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {triageResult && (
            <div className="mt-3 animate-fade-in rounded-xl bg-paytm-skySoft/60 p-3 text-sm text-slate-700">
              <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-paytm-navy">
                {triageResult.category}
              </div>
              {triageResult.action}
            </div>
          )}
        </section>
      </main>

      {!embedded && (
        <footer className="px-4 pb-6 pt-1 text-center text-[11px] text-slate-400">
          SafeClear by Paytm · UPI counter payments
        </footer>
      )}
    </div>
  );
};
