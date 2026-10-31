import { useMemo, useState } from "react";
import { Signal, Wifi, Battery, Lock, Send } from "lucide-react";

export const PhoneMockup = ({ scenario, phase, lockSeconds, dispute, onTriage, triageResult }) => {
  const [text, setText] = useState("");

  const amount = scenario?.amount ?? 0;
  const bank = scenario?.bank ?? "—";
  const status = phase?.toUpperCase?.() ?? "IDLE";

  const statusColor = useMemo(() => {
    if (!phase) return "text-slate-500 bg-slate-100 border-slate-200";
    if (/SUCCESS|SETTLED|PAID/.test(phase)) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (/FAIL|DECLINE/.test(phase)) return "text-rose-700 bg-rose-50 border-rose-200";
    if (/TIMEOUT|HUMAN|LOCK|SLOW/.test(phase)) return "text-amber-700 bg-amber-50 border-amber-200";
    if (/DUPLIC|REFUND/.test(phase)) return "text-violet-700 bg-violet-50 border-violet-200";
    return "text-[#002970] bg-cyan-50 border-cyan-200";
  }, [phase]);

  // Simple QR made of CSS grid of dots. 25x25 pattern deterministic from scenario.
  const qrCells = useMemo(() => {
    const seed = (scenario?.id || "IDLE").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const cells = [];
    for (let i = 0; i < 625; i++) {
      const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
      cells.push(Math.floor((v - Math.floor(v)) * 2));
    }
    // corner finder patterns
    const setBlock = (r, c) => {
      for (let i = 0; i < 7; i++)
        for (let j = 0; j < 7; j++) {
          const idx = (r + i) * 25 + (c + j);
          const border = i === 0 || i === 6 || j === 0 || j === 6;
          const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          cells[idx] = border || inner ? 1 : 0;
        }
    };
    setBlock(0, 0);
    setBlock(0, 18);
    setBlock(18, 0);
    return cells;
  }, [scenario]);

  const locked = status === "LOCKED" || status === "SAFECLEAR_LOCK" || status === "DECLINED" || status === "BANK_DECLINE";

  return (
    <div className="card-surface p-5" data-testid="customer-column">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display font-bold text-[#002970]">Customer Payer App</div>
          <div className="text-[11px] text-slate-500">Paytm UPI · Live</div>
        </div>
        <span className={`font-mono-ui text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border ${statusColor}`}>
          {status || "idle"}
        </span>
      </div>

      <div className="phone-chassis mx-auto max-w-[300px]">
        <div className="phone-screen">
          <div className="phone-notch" />
          {/* status bar */}
          <div className="px-6 pt-4 pb-2 flex items-center justify-between text-[10px] text-slate-500 font-mono-ui relative z-10 mt-6">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="px-5 pt-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#002970] flex items-center justify-center text-white font-display font-bold text-sm">P</div>
              <div>
                <div className="text-[11px] text-slate-500 leading-tight">Pay via UPI</div>
                <div className="font-display font-bold text-[#002970] text-sm leading-tight">Paytm</div>
              </div>
            </div>

            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <div className="text-[10px] text-slate-500 font-medium">PAYING TO</div>
              <div className="font-display font-semibold text-[#0F172A] text-sm">Sharma General Store</div>
              <div className="text-[11px] text-slate-500">merchant@paytm · PAYTM_SHOP_001</div>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-[10px] text-slate-500">AMOUNT</div>
                <div className="font-display text-2xl font-extrabold text-[#002970]" data-testid="phone-amount">
                  ₹{amount.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500">VIA</div>
                <div className="font-mono-ui text-xs font-semibold text-[#002970]">{bank}</div>
              </div>
            </div>

            {/* QR */}
            <div className="mt-3 relative bg-white border border-slate-200 rounded-2xl p-3">
              <div className="grid grid-cols-[repeat(25,1fr)] gap-[1px] bg-white">
                {qrCells.map((v, i) => (
                  <div
                    key={i}
                    className="aspect-square"
                    style={{ background: v ? "#002970" : "transparent" }}
                  />
                ))}
              </div>
              {!locked && <div className="qr-laser" />}
              {locked && (
                <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center">
                  <Lock className="w-6 h-6 text-amber-600" />
                  <div className="font-mono-ui text-xs font-bold text-amber-700 mt-1" data-testid="qr-lock-label">
                    QR AUTO-LOCKED
                  </div>
                  {lockSeconds > 0 && (
                    <div className="text-[10px] text-slate-500">unlocks in {lockSeconds}s</div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2 text-[10px] text-slate-500 text-center">
              Pay to <span className="font-mono-ui">merchant@paytm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dispute triage */}
      <div className="mt-5">
        <div className="text-xs font-semibold text-[#002970] mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00BAF2]" />
          Dispute triage — natural language
        </div>
        <div className="flex gap-2">
          <input
            data-testid="dispute-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) {
                onTriage(text.trim());
                setText("");
              }
            }}
            placeholder="Paisa cut gaya par dukandar bola nahi aaya…"
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:border-[#00BAF2] focus:ring-2 focus:ring-cyan-100 outline-none bg-white"
          />
          <button
            data-testid="dispute-send-btn"
            onClick={() => text.trim() && (onTriage(text.trim()), setText(""))}
            className="press-shrink px-3 py-2 rounded-xl bg-[#002970] text-white hover:bg-[#001c54] flex items-center gap-1 text-sm font-semibold"
          >
            <Send className="w-3.5 h-3.5" /> Triage
          </button>
        </div>
        {triageResult && (
          <div
            data-testid="triage-result"
            className="mt-2 rounded-xl border border-violet-200 bg-violet-50 p-3"
          >
            <div className="font-mono-ui text-[10px] uppercase tracking-wider text-violet-700">
              {triageResult.category}
            </div>
            <div className="text-sm text-[#002970] font-medium mt-1">{triageResult.action}</div>
          </div>
        )}
        {dispute && !triageResult && (
          <div className="mt-2 text-[11px] text-slate-500 italic">Analyzing: "{dispute}"…</div>
        )}
      </div>
    </div>
  );
};
