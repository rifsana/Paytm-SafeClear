import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Mic, ShieldAlert, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";

const CHIPS = [
  "Payment atka hai kya?",
  "Rahul ka token 4821 status?",
  "Sneha ne 400 do baar diya, refund kaise hoga?",
  "Zero Paisa Kata verdict explain karo",
];

const CODE_SANDBOX = [
  {
    code: "ZM",
    name: "Incorrect PIN",
    debit: "❌ NEVER",
    legacy: "If deducted, refund in 3-5 days",
    sarvam: "PIN galat tha. Paisa bilkul nahi kata. Turant dobara koshish karein.",
  },
  {
    code: "Z9",
    name: "Low Balance",
    debit: "❌ NEVER",
    legacy: "If deducted, refund in 3-5 days",
    sarvam: "Account mein balance kam tha. Paisa nahi kata. UPI Lite ya doosra bank chunein.",
  },
  {
    code: "U16",
    name: "Daily Limit",
    debit: "❌ NEVER",
    legacy: "If deducted, refund in 3-5 days",
    sarvam: "Rozana limit puri ho gayi hai. Kisi aur account ya card se pay karein.",
  },
  {
    code: "U68",
    name: "Bank Timeout",
    debit: "⏳ AMBIGUOUS",
    legacy: "If deducted, refund in 3-5 days",
    sarvam: "Bank se confirmation baki hai. Dobara scan MAT karein. 30 second ruko.",
  },
];

export const AICopilot = ({ apiBase, context }) => {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Namaste! Main Paytm ClearMoment Sarvam AI Copilot hoon. Counter par pending payment, duplicate debits, ya bank latency ke baare mein kuch bhi poochiye.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const sessionIdRef = useRef(`cm-copilot-${Math.random().toString(36).slice(2, 8)}`);

  const send = async (text) => {
    if (!text.trim() || streaming) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "ai", text: "" }]);
    setStreaming(true);
    try {
      const r = await fetch(`${apiBase}/copilot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionIdRef.current,
          context,
        }),
      });
      if (!r.body) throw new Error("No stream body");
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "ai", text: acc };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "ai", text: `[Error: ${e.message}]` };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div
      data-testid="ai-copilot"
      className="rounded-2xl bg-gradient-to-b from-violet-50/70 to-white border border-violet-200 p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-fuchsia-600 flex items-center justify-center shadow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-[#7C3AED] text-sm leading-tight">
              Sarvam AI Intelligence Core
            </div>
            <div className="text-[10px] text-slate-500 font-mono-ui">
              sarvam-105b · sarvam-m intent guard
            </div>
          </div>
        </div>
        <span className="font-mono-ui text-[9px] uppercase tracking-wider text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full font-bold">
          Sovereign AI
        </span>
      </div>

      {/* Sarvam "Why It Failed" Code Sandbox (Interactive Blueprint Component) */}
      <div className="mb-3 p-3 rounded-xl bg-white border border-violet-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#002970]">
            <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Pillar 2: Error Code Transformer</span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono-ui">Tap code to test</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {CODE_SANDBOX.map((item) => (
            <button
              key={item.code}
              onClick={() => setSelectedCode(item)}
              className={`p-1.5 rounded-lg border text-center transition-all min-h-[44px] ${
                selectedCode?.code === item.code
                  ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow"
                  : "bg-slate-50 hover:bg-violet-50 border-slate-200 text-slate-700"
              }`}
            >
              <div className="font-mono-ui font-black text-xs">{item.code}</div>
              <div className="text-[8px] leading-tight opacity-90 truncate">{item.name}</div>
            </button>
          ))}
        </div>

        {selectedCode && (
          <div className="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-1">
              <span className="font-mono-ui font-bold text-[#002970]">{selectedCode.code}: {selectedCode.name}</span>
              <span className="font-mono-ui font-bold text-xs text-rose-600">Money Moved? {selectedCode.debit}</span>
            </div>
            <div className="text-[10px] text-rose-700">
              <span className="font-bold line-through text-slate-400 mr-1">"{selectedCode.legacy}"</span>
              <span className="font-semibold text-rose-600">(Blanket Lie)</span>
            </div>
            <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50 p-1.5 rounded border border-emerald-200">
              <span className="font-bold">Sarvam AI Direct Verdict:</span> "{selectedCode.sarvam}"
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="max-h-44 overflow-y-auto space-y-2 pr-1 text-xs mb-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2.5 rounded-xl ${
              m.role === "user"
                ? "bg-[#002970] text-white ml-6 text-right"
                : "bg-white border border-slate-200 text-slate-800 mr-4 shadow-sm"
            }`}
          >
            <div className="text-[9px] font-mono-ui opacity-70 mb-0.5 uppercase">
              {m.role === "user" ? "Merchant / Judge" : "Sarvam AI"}
            </div>
            <div className="leading-relaxed font-medium">{m.text}</div>
          </div>
        ))}
      </div>

      {/* Suggested Chips */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => send(c)}
            className="text-[10px] px-2 py-1 rounded-full bg-white border border-violet-200 text-[#7C3AED] hover:bg-violet-100 font-medium press-shrink transition-colors"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              send(input.trim());
              setInput("");
            }
          }}
          placeholder="Ask Sarvam Copilot in Hinglish or English..."
          className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-violet-100 outline-none bg-white min-h-[44px]"
        />
        <button
          onClick={() => {
            if (input.trim()) {
              send(input.trim());
              setInput("");
            }
          }}
          disabled={streaming}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#7C3AED] text-white hover:bg-violet-700 text-xs font-semibold press-shrink flex items-center gap-1 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
