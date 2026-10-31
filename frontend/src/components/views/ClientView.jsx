import { useMemo, useState } from "react";
import {
  ShieldCheck,
  AlertCircle,
  Zap,
  CheckCircle2,
  RefreshCw,
  QrCode,
  ArrowRight,
  RotateCcw,
  Volume2,
  Lock,
} from "lucide-react";

export const ClientView = ({
  session,
  onPay,
  onUpiLitePay,
  onPanicRescan,
  onReset,
  onSelectScenario,
  connected,
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
        category: "PAID_NOT_RECEIVED",
        action: "Sarvam AI: Bank switch live verify kar raha hai. 30s ruko, dobara pay mat karein.",
      });
    } else {
      setTriageResult({
        category: "ZERO_PAISA_KATA",
        action: "Sarvam AI: Account se koi paisa nahi kata. 1-tap UPI Lite se turant pay karein.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl relative font-sans">
      {/* Top Mobile Bar */}
      <header className="bg-[#002970] text-white px-4 pt-3 pb-3 sticky top-0 z-20 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm text-[#00BAF2]">
              P
            </div>
            <div>
              <div className="font-display font-extrabold text-sm tracking-tight leading-tight">
                Paytm <span className="text-[#00BAF2]">UPI</span>
              </div>
              <div className="text-[9px] text-cyan-200/80 font-mono-ui">
                Customer Mobile App
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-mono-ui px-2 py-0.5 rounded-full border ${
                connected
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400"
                  : "bg-rose-500/20 text-rose-300 border-rose-400"
              }`}
            >
              {connected ? "LIVE SYNCED" : "CONNECTING..."}
            </span>
            <button
              onClick={onReset}
              title="Reset payment"
              className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 press-shrink"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Scenario Picker (For testing easily on phone) */}
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-1">
          <span className="text-[9px] uppercase font-mono-ui text-cyan-200 font-bold shrink-0">
            Scenario:
          </span>
          <div className="flex gap-1 flex-1 justify-end">
            {[
              { id: "SCENARIO_A", label: "A: False Alarm" },
              { id: "SCENARIO_B", label: "B: Timeout QR" },
              { id: "SCENARIO_C", label: "C: Duplicate" },
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc.id)}
                className={`text-[9px] px-2 py-1 rounded-md font-semibold font-mono-ui transition-all ${
                  scenario === sc.id
                    ? "bg-[#00BAF2] text-[#002970] shadow"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 space-y-4 flex-1">
        {/* Counter Bill Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Paying Counter
              </div>
              <div className="font-display font-bold text-base text-slate-900 mt-0.5">
                {store}
              </div>
              <div className="text-[11px] text-slate-500">PAYTM_POS_001</div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono-ui font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                Token #{token}
              </span>
              <div className="font-display font-black text-2xl text-[#002970] mt-1">
                ₹{amount}
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE SCENARIO FLOWS */}

        {/* 1. STATE: IDLE (Customer initiates payment) */}
        {status === "IDLE" && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center mx-auto text-[#00BAF2]">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display font-bold text-base text-slate-900">
                Ready to Pay ₹{amount}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Primary Account: {bank} Bank (****9821)
              </div>
            </div>

            <button
              data-testid="mobile-pay-btn"
              onClick={onPay}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#002970] hover:bg-[#001c54] text-white font-display font-bold text-sm shadow-md press-shrink flex items-center justify-center gap-2"
            >
              <span>Pay ₹{amount} via {bank}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-[10px] text-slate-400">
              Tap to initiate live counter payment
            </div>
          </div>
        )}

        {/* 2. STATE: IN_FLIGHT (Awaiting bank switch) */}
        {status === "IN_FLIGHT" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#00BAF2] animate-spin mx-auto" />
            <div className="font-display font-bold text-slate-900 text-sm">
              Connecting with {bank} Switch...
            </div>
            <div className="text-xs text-slate-500">
              Hold tight, processing payment of ₹{amount}
            </div>
          </div>
        )}

        {/* 3. SCENARIO A: PRE-DEBIT DECLINE (Z9 Insufficient Balance) */}
        {status === "DECLINED" && (
          <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-md space-y-3">
            {/* Green Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-white font-mono-ui font-black text-xs shadow-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>ZERO PAISA KATA — BANK DECLINE</span>
            </div>

            {/* Sarvam AI Explainer Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 font-mono-ui">
                  Sarvam AI Explainer
                </span>
                <div className="flex gap-1">
                  {["hinglish", "hindi", "tamil"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setSelectedLang(l)}
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                        selectedLang === l ? "bg-[#002970] text-white" : "text-slate-500 bg-white"
                      }`}
                    >
                      {l.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-800 leading-snug font-medium">
                {selectedLang === "hindi" &&
                  "Aapke account mein zaroori balance nahi tha. Bank ne payment roki hai aur aapke account se koi paisa nahi kata."}
                {selectedLang === "hinglish" &&
                  "Account mein balance kam tha. Paisa bilkul nahi kata. UPI Lite ya doosra bank chunein."}
                {selectedLang === "tamil" &&
                  "Kanakil pothumaana panam illai. Panam edukkapadavillai. UPI Lite payanpaduthavum."}
              </p>
            </div>

            {/* Contrast with blanket lie */}
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-800 leading-tight">
              <span className="line-through text-slate-400 mr-1">"If debited, refund in 3-5 days"</span>
              <span className="font-bold">❌ Debunked</span>: Money never moved!
            </div>

            {/* Proactive 1-Tap Recovery Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                data-testid="mobile-upi-lite-btn"
                onClick={onUpiLitePay}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-display font-bold text-sm shadow-md hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-2 press-shrink"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>1-Tap Pay ₹{amount} via UPI Lite</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="text-[10px] text-slate-400 text-center mt-1">
                Pre-loaded on-device wallet · Zero core banking timeouts
              </div>
            </div>
          </div>
        )}

        {/* 4. SCENARIO B: TIMEOUT (U68) & DYNAMIC STATUS QR */}
        {status === "TIMEOUT_PENDING" && (
          <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-md space-y-3">
            {/* Orange Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-white font-mono-ui font-black text-xs shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>PAISA KATA HAI — CLEARANCE IN PROGRESS</span>
            </div>

            {/* Dynamic Status QR Box (Constrained Dimensions) */}
            <div
              className="p-3 bg-slate-900 rounded-2xl text-center text-white mx-auto shadow-md"
              style={{ maxWidth: "240px", width: "100%" }}
            >
              <div className="text-xs font-mono-ui text-cyan-300 font-bold mb-2">
                OFFICIAL STATUS QR • TOKEN #{token}
              </div>

              <div
                className="bg-white p-2 rounded-xl mx-auto shadow-inner flex items-center justify-center"
                style={{ width: "160px", height: "160px" }}
              >
                <svg
                  width="144"
                  height="144"
                  viewBox="0 0 25 25"
                  style={{ width: "144px", height: "144px", display: "block" }}
                >
                  {qrCells.map((v, i) => {
                    const x = i % 25;
                    const y = Math.floor(i / 25);
                    return v ? (
                      <rect key={i} x={x} y={y} width="1" height="1" fill="#002970" />
                    ) : null;
                  })}
                </svg>
              </div>

              <div className="mt-2 text-[10px] font-mono-ui text-amber-300">
                HMAC-SHA256 Signed · Token #{token}
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-snug text-center font-medium">
              👉 <span className="font-bold text-[#002970]">Show this QR to the merchant</span>.
              Do NOT scan again. SafeClear switch reconciling in background.
            </p>
          </div>
        )}

        {/* 5. SCENARIO C: P1 IN FLIGHT & PANIC RE-SCAN BUTTON */}
        {status === "P1_IN_FLIGHT" && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-600 font-display font-bold text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Payment #1 Processing (₹{amount})...
            </div>
            <p className="text-xs text-slate-500">
              The merchant soundbox is silent. Customer enters the ambiguous moment.
            </p>

            <button
              data-testid="mobile-panic-rescan-btn"
              onClick={onPanicRescan}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-bold text-sm shadow-md press-shrink flex items-center justify-center gap-2"
            >
              <span>⚠️ Scan & Pay Again (Panic Re-scan)</span>
            </button>
            <div className="text-[10px] text-slate-400">
              Simulate an anxious customer scanning a second time
            </div>
          </div>
        )}

        {/* 6. SCENARIO C: DUPLICATE ALERT & REFUND NOTIFICATION */}
        {status === "DUPLICATE_ALERT" && (
          <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-md space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#7C3AED] text-white font-mono-ui font-black text-xs shadow-sm">
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
              <span>DUPLICATE PAYMENT DETECTED</span>
            </div>

            <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-left">
              <div className="text-xs font-bold text-[#7C3AED]">Sarvam-m Intent Guard Active</div>
              <p className="text-xs text-[#002970] font-medium mt-1">
                You paid ₹{amount} twice within 25 seconds.
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Pehle wala payment confirm ho gaya hai. Merchant POS par 1-Tap Refund active hai.
              </p>
            </div>

            <div className="text-[11px] font-mono-ui bg-violet-100 text-violet-800 p-2.5 rounded-xl text-center font-bold">
              ⏳ Awaiting 1-Tap refund confirmation from merchant...
            </div>
          </div>
        )}

        {/* 7. SCENARIO C: REFUNDED NOTIFICATION */}
        {status === "REFUNDED" && (
          <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-lg text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="font-display font-black text-lg text-emerald-700">
              ₹{amount} Instant Refund Credited!
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Merchant tapped 1-Tap Refund. Money returned via IMPS/UPI. Zero chargeback dispute.
            </p>
            <div className="text-[10px] font-mono-ui bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-200 inline-block">
              Ref: {session?.refund_ref || "REF-IMPS-8291"}
            </div>
          </div>
        )}

        {/* 8. STATE: SETTLED SUCCESS */}
        {status === "SETTLED" && (
          <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-lg text-center space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="font-display font-black text-xl text-emerald-700">
              Payment Successful!
            </div>
            <div className="font-display font-black text-3xl text-[#002970]">
              ₹{amount}
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Payment 100% Confirmed. Merchant Soundbox announced settlement.
            </p>
            <div className="text-[10px] font-mono-ui bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 inline-block">
              RRN: {session?.rrn || "98124810291"} • Goods Released
            </div>
          </div>
        )}

        {/* Saaras-v4 Vernacular Dispute Intake */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-[#002970] mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00BAF2]" />
            Saaras-v4 Vernacular Dispute Intake
          </div>
          <div className="flex gap-1.5">
            <input
              value={triageText}
              onChange={(e) => setTriageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTriage()}
              placeholder="Paisa cut gaya par dukandar bola nahi aaya..."
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#00BAF2] outline-none min-h-[44px]"
            />
            <button
              onClick={handleTriage}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#002970] text-white text-xs font-semibold press-shrink"
            >
              Ask
            </button>
          </div>
          {triageResult && (
            <div className="mt-2 p-2 rounded-lg bg-violet-50 border border-violet-200 text-[11px] text-[#002970]">
              <span className="font-bold text-[#7C3AED] uppercase block text-[9px] font-mono-ui">
                {triageResult.category}
              </span>
              {triageResult.action}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-3 text-center text-[10px] text-slate-400 font-mono-ui border-t border-slate-200 bg-white">
        Paytm ClearMoment · Track 2 AI Journey
      </footer>
    </div>
  );
};
