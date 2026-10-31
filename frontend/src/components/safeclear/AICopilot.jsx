import { useState, useRef, useEffect } from "react";
import { Sparkles, Send } from "lucide-react";

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
    debit: "NEVER",
    legacy: "If deducted, refund in 3-5 days",
    sarvam: "PIN galat tha. Paisa bilkul nahi kata. Turant dobara koshish karein.",
  },
  {
    code: "Z9",
    name: "Low Balance",
    debit: "NEVER",
    legacy: "If deducted, refund in 3-5 days",
    sarvam: "Account mein balance kam tha. Paisa nahi kata. UPI Lite ya doosra bank chunein.",
  },
  {
    code: "U16",
    name: "Daily Limit",
    debit: "NEVER",
    legacy: "If deducted, refund in 3-5 days",
    sarvam: "Rozana limit puri ho gayi hai. Kisi aur account ya card se pay karein.",
  },
  {
    code: "U68",
    name: "Bank Timeout",
    debit: "AMBIGUOUS",
    legacy: "If deducted, refund in 3-5 days",
    sarvam: "Bank se confirmation baki hai. Dobara scan MAT karein. 30 second ruko.",
  },
];

export const AICopilot = ({ apiBase, context }) => {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Namaste! Main Paytm SafeClear Sarvam AI Copilot hoon. Counter par pending payment, duplicate debits, ya bank latency ke baare mein kuch bhi poochiye.",
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
      if (!r.ok || !r.body) throw new Error(`Copilot unavailable (HTTP ${r.status})`);
      const source = r.headers.get("X-Copilot-Source") === "sarvam" ? r.headers.get("X-Copilot-Model") || "sarvam" : "offline";
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "ai", text: acc, source };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "ai", text: e.message, source: "error" };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = () => {
    if (!input.trim()) return;
    send(input.trim());
    setInput("");
  };

  return (
    <section data-testid="ai-copilot" className="card flex min-h-0 flex-1 flex-col">
      <div className="card-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paytm-skySoft text-paytm-sky">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="card-title">SafeClear Copilot</div>
            <div className="card-subtitle truncate">Powered by Sarvam AI</div>
          </div>
        </div>
      </div>

      {/* Error code transformer */}
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="mb-2 text-xs font-medium text-slate-500">Decode a UPI error</div>
        <div className="grid grid-cols-4 gap-1.5">
          {CODE_SANDBOX.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setSelectedCode(selectedCode?.code === item.code ? null : item)}
              aria-pressed={selectedCode?.code === item.code}
              className={`min-h-[48px] min-w-0 rounded-xl border px-1 py-1.5 text-center transition ${
                selectedCode?.code === item.code
                  ? "border-paytm-navy bg-paytm-navy text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="font-mono text-xs font-bold">{item.code}</div>
              <div className="truncate text-[10px] opacity-80">{item.name}</div>
            </button>
          ))}
        </div>

        {selectedCode && (
          <div className="mt-2.5 animate-fade-in rounded-xl bg-slate-50 p-3 text-[13px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">{selectedCode.name}</span>
              <span className={`pill ${selectedCode.debit.includes("NEVER") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {selectedCode.debit.includes("NEVER") ? "No debit" : "Ambiguous"}
              </span>
            </div>
            <div className="mt-1.5 text-xs text-slate-400 line-through">"{selectedCode.legacy}"</div>
            <div className="mt-1 leading-snug text-slate-700">{selectedCode.sarvam}</div>
          </div>
        )}
      </div>

      {/* Chat */}
      <div ref={scrollRef} className="thin-scroll max-h-64 min-h-[8rem] flex-1 space-y-2 overflow-y-auto px-4 py-3 @4xl:max-h-[28rem] sm:px-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                m.role === "user" ? "rounded-br-md bg-paytm-navy text-white" : "rounded-bl-md bg-slate-100 text-slate-800"
              }`}
            >
              {m.text || <span className="inline-flex gap-1 py-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" /></span>}
              {m.role === "ai" && m.source && m.text && (
                <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {m.source === "offline" ? "Offline reply" : m.source === "error" ? "Error" : `Sarvam · ${m.source}`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-2 sm:px-5">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => send(c)}
            disabled={streaming}
            className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-paytm-navy transition hover:border-paytm-sky hover:bg-paytm-skySoft/50 disabled:opacity-50"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex gap-2 px-4 pb-4 pt-1 sm:px-5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ask in Hinglish or English…"
          className="input min-w-0 flex-1"
        />
        <button type="button" onClick={submit} disabled={streaming} className="btn-primary shrink-0 px-3.5" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};
