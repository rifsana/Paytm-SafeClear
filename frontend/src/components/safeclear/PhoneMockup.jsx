import { useMemo, useState } from "react";
import { Signal, Wifi, Battery, QrCode, Zap, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

export const PhoneMockup = ({
  scenario,
  phase,
  token = "4821",
  onUpiLitePay,
  upiLiteSettled,
  dispute,
  onTriage,
  triageResult,
}) => {
  const [selectedLang, setSelectedLang] = useState("hinglish");
  const [showStatusQR, setShowStatusQR] = useState(false);
  const [disputeInput, setDisputeInput] = useState("");

  const amount = scenario?.amount ?? 350;
  const bank = scenario?.bank ?? "HDFC";
  const scenarioId = scenario?.id ?? "SCENARIO_A";

  // Determine state flags
  const isDecline = phase === "PRE_DEBIT_DECLINE" || phase === "SARVAM_EXPLAINER" || phase === "UPI_LITE_PROMPT";
  const isTimeout = phase === "BANK_TIMEOUT_U68" || phase === "STATUS_QR_SURFACED" || phase === "MERCHANT_STICKY";
  const isSettled = phase === "SETTLED" || phase === "SWITCH_SETTLED" || upiLiteSettled;
  const isDuplicate = phase === "PANIC_RESCAN" || phase === "INTENT_GUARD_ALERT" || phase === "MERCHANT_DUPLICATE";

  // Dynamic QR generator
  const qrCells = useMemo(() => {
    const seed = (scenario?.id || "TOKEN4821").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
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
  }, [scenario]);

  return (
    <div className="card-surface p-5" data-testid="customer-column">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="font-display font-bold text-[#002970]">Customer Payer App</div>
          </div>
          <div className="text-[11px] text-slate-500">Paytm UPI · Dynamic Client UX</div>
        </div>
        <span className="font-mono-ui text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border bg-cyan-50 text-[#002970] border-cyan-200">
          Token #{scenario?.token || token}
        </span>
      </div>

      <div className="phone-chassis mx-auto max-w-[310px] shadow-2xl border-4 border-slate-800 rounded-[38px] overflow-hidden bg-white">
        <div className="phone-screen bg-slate-50 min-h-[580px] flex flex-col justify-between">
          <div className="phone-notch mx-auto w-32 h-4 bg-slate-800 rounded-b-xl" />

          {/* Mobile status bar */}
          <div className="px-5 pt-2 pb-1 flex items-center justify-between text-[10px] text-slate-600 font-mono-ui">
            <span>13:42</span>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="px-4 py-2 flex-1 flex flex-col">
            {/* Header bar */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200/80 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#002970] flex items-center justify-center text-white font-bold text-xs">
                  P
                </div>
                <span className="font-display font-bold text-[#002970] text-xs">Paytm UPI</span>
              </div>
              <div className="text-[10px] font-mono-ui font-semibold text-slate-500">
                Token #{scenario?.token || token}
              </div>
            </div>

            {/* Merchant details */}
            <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">Paying Counter</div>
                <div className="font-display font-bold text-slate-800 text-xs">Sharma General Store</div>
                <div className="text-[10px] text-slate-500">PAYTM_SHOP_001</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-400 uppercase">Amount</div>
                <div className="font-display font-extrabold text-base text-[#002970]">
                  ₹{amount}
                </div>
              </div>
            </div>

            {/* Dynamic Card State */}
            <div className="mt-3 flex-1 flex flex-col">
              {/* STATE 1: SETTLED SUCCESS */}
              {isSettled && (
                <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm text-center flex-1 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-2 animate-bounce">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="font-display font-extrabold text-lg text-emerald-700">
                    Payment Successful!
                  </div>
                  <div className="font-display text-2xl font-black text-[#002970] my-1">
                    ₹{amount}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    {upiLiteSettled ? "Settled via on-device UPI Lite" : "Confirmed by Bank Switch"}
                  </div>
                  <div className="mt-3 text-[10px] font-mono-ui bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                    RRN: 98124810291 • Goods Released
                  </div>
                </div>
              )}

              {/* STATE 2: SCENARIO A - PRE-DEBIT DECLINE (Z9 Low Balance) */}
              {isDecline && !isSettled && (
                <div className="bg-white rounded-2xl p-3 border border-rose-200 shadow-sm flex-1 flex flex-col justify-between">
                  <div>
                    {/* Verdict Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white font-mono-ui font-black text-xs shadow-sm">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>ZERO PAISA KATA</span>
                    </div>

                    {/* Explainer */}
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left">
                      <div className="flex items-center justify-between mb-1">
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
                      <p className="text-[11px] text-slate-800 leading-snug font-medium">
                        {selectedLang === "hindi" &&
                          "Aapke account mein zaroori balance nahi tha. Bank ne payment roki hai aur aapke account se koi paisa nahi kata."}
                        {selectedLang === "hinglish" &&
                          "Account mein balance kam tha. Paisa bilkul nahi kata. UPI Lite ya doosra bank chunein."}
                        {selectedLang === "tamil" &&
                          "Kanakil pothumaana panam illai. Panam edukkapadavillai. UPI Lite payanpaduthavum."}
                      </p>
                    </div>

                    {/* Contrast with blanket lie */}
                    <div className="mt-2 p-2 rounded-lg bg-rose-50/70 border border-rose-200/60 text-[10px] text-rose-800 leading-tight">
                      <span className="line-through text-slate-400 mr-1">"If debited, refund in 3-5 days"</span>
                      <span className="font-bold">❌ Debunked</span>: Money never left your account!
                    </div>
                  </div>

                  {/* 1-Tap Recovery Alternative */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <button
                      data-testid="upi-lite-pay-btn"
                      onClick={onUpiLitePay}
                      className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-display font-bold text-xs shadow-md hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-1.5 press-shrink"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>1-Tap Pay ₹{amount} via UPI Lite</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-[9px] text-slate-400 text-center mt-1">
                      On-device wallet · Zero core-banking timeouts
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 3: SCENARIO B - TIMEOUT (U68) & DYNAMIC STATUS QR */}
              {isTimeout && !isSettled && (
                <div className="bg-white rounded-2xl p-3 border border-amber-200 shadow-sm flex-1 flex flex-col justify-between">
                  <div>
                    {/* Orange Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 text-white font-mono-ui font-black text-xs shadow-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>PAISA KATA HAI — CLEARANCE IN PROGRESS</span>
                    </div>

                    {/* Dynamic QR Box */}
                    <div className="mt-2 p-2 bg-slate-900 rounded-xl text-center text-white relative">
                      <div className="text-[10px] font-mono-ui text-cyan-300 font-bold mb-1">
                        OFFICIAL STATUS QR • TOKEN #{scenario?.token || token}
                      </div>

                      <div className="w-28 h-28 mx-auto bg-white p-1 rounded-lg">
                        <div className="grid grid-cols-[repeat(25,1fr)] gap-[0.5px] bg-white h-full">
                          {qrCells.map((v, i) => (
                            <div
                              key={i}
                              className="aspect-square"
                              style={{ background: v ? "#002970" : "transparent" }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-1 text-[9px] font-mono-ui text-amber-300">
                        HMAC-SHA256 Signed · Expires in 2:48
                      </div>
                    </div>

                    <p className="mt-2 text-[10px] text-slate-600 leading-tight text-center font-medium">
                      Show this QR to merchant. Do NOT scan again. SafeClear switch reconciling in background.
                    </p>
                  </div>

                  <div className="mt-2 text-[10px] font-mono-ui bg-amber-50 text-amber-800 p-2 rounded-xl border border-amber-200 text-center">
                    ⏳ Soundbox holding warning active
                  </div>
                </div>
              )}

              {/* STATE 4: SCENARIO C - DUPLICATE DETECTED */}
              {isDuplicate && !isSettled && (
                <div className="bg-white rounded-2xl p-3 border border-violet-200 shadow-sm flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#7C3AED] text-white font-mono-ui font-black text-xs shadow-sm">
                      <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                      <span>DUPLICATE PAYMENT GUARD</span>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-violet-50 border border-violet-200 text-left">
                      <div className="text-[10px] font-mono-ui font-bold text-violet-700 uppercase">
                        Sarvam-m Intent Guard
                      </div>
                      <p className="text-xs text-[#002970] font-semibold mt-1">
                        Duplicate ₹{amount} detected within 45s.
                      </p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        Pehle wala payment confirm ho gaya hai. Merchant POS par 1-Tap Refund active ho chuka hai.
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono-ui bg-violet-100 text-violet-800 p-2 rounded-xl text-center">
                    💰 Instant refund credit expected in &lt; 60s
                  </div>
                </div>
              )}

              {/* IDLE STATE */}
              {!isDecline && !isTimeout && !isSettled && !isDuplicate && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mb-2">
                    <QrCode className="w-6 h-6 text-[#00BAF2]" />
                  </div>
                  <div className="font-display font-bold text-slate-800 text-sm">
                    Ready to Pay ₹{amount}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Select a scenario above to test the ambiguous 60s journey
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="py-2 text-[9px] text-slate-400 text-center font-mono-ui border-t border-slate-200/60">
            Paytm Security Protocol · Track 2 AI Journey
          </div>
        </div>
      </div>

      {/* Voice Dispute Intake (Saaras-v4) */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <div className="text-xs font-semibold text-[#002970] mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00BAF2]" />
          Saaras-v4 Vernacular Dispute Intake
        </div>
        <div className="flex gap-2">
          <input
            data-testid="dispute-input"
            value={disputeInput}
            onChange={(e) => setDisputeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && disputeInput.trim()) {
                onTriage(disputeInput.trim());
                setDisputeInput("");
              }
            }}
            placeholder="Paisa cut gaya par dukandar bola nahi aaya…"
            className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#00BAF2] focus:ring-2 focus:ring-cyan-100 outline-none bg-white min-h-[44px]"
          />
          <button
            data-testid="dispute-send-btn"
            onClick={() => {
              if (disputeInput.trim()) {
                onTriage(disputeInput.trim());
                setDisputeInput("");
              }
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#002970] text-white hover:bg-[#001c54] text-xs font-semibold press-shrink"
          >
            Triage
          </button>
        </div>
        {triageResult && (
          <div data-testid="triage-result" className="mt-2 rounded-xl border border-violet-200 bg-violet-50 p-2.5">
            <div className="font-mono-ui text-[10px] uppercase tracking-wider text-[#7C3AED] font-bold">
              {triageResult.category}
            </div>
            <div className="text-xs text-[#002970] font-medium mt-0.5">{triageResult.action}</div>
          </div>
        )}
      </div>
    </div>
  );
};
