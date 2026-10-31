import { useRef, useState } from "react";
import { Mic, MicOff, Send, Sparkles } from "lucide-react";

const CHIPS = [
  "Payment attka hai kya?",
  "Auto-refund status verify karo",
  "₹1200 Axis timeout ka kya karun?",
  "Soundbox voice replay karo",
];

export const AICopilot = ({ apiBase, context }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const sessionIdRef = useRef(`copilot-${Math.random().toString(36).slice(2, 10)}`);

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
        copy[copy.length - 1] = { role: "ai", text: `[error: ${e.message}]` };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  const toggleRecord = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input requires Chrome/Edge. Please type instead.");
      return;
    }
    if (recording && recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const t = ev.results[0][0].transcript;
      setInput(t);
      setRecording(false);
      send(t);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  return (
    <div
      data-testid="ai-copilot"
      className="rounded-2xl bg-gradient-to-b from-violet-50 to-white border border-violet-200 p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center shadow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-[#7C3AED] text-sm">Ollama AI Voice Copilot</div>
            <div className="text-[10px] text-slate-500 font-mono-ui">Claude Sonnet · Hinglish mode</div>
          </div>
        </div>
        <button
          data-testid="copilot-mic-btn"
          onClick={toggleRecord}
          className={`press-shrink w-11 h-11 rounded-full flex items-center justify-center shadow-md ${
            recording ? "bg-rose-500 text-white" : "bg-white text-[#7C3AED] border border-violet-200 hover:bg-violet-50"
          }`}
          title={recording ? "Stop recording" : "Start voice input"}
        >
          {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>

      {/* visualizer */}
      <div className="mt-3 flex items-end justify-center gap-1 h-10">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className={`copilot-bar ${recording || streaming ? "rec" : ""}`}
            style={{
              height: `${20 + ((i * 17) % 60)}%`,
              animationDelay: `${i * 55}ms`,
              background: recording || streaming ? "#7C3AED" : "rgba(124,58,237,0.35)",
            }}
          />
        ))}
      </div>

      {/* chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {CHIPS.map((c) => (
          <button
            key={c}
            data-testid={`copilot-chip-${c.slice(0, 12).replace(/\s+/g, "-").toLowerCase()}`}
            onClick={() => send(c)}
            disabled={streaming}
            className="press-shrink text-[11px] px-2.5 py-1 rounded-full bg-white border border-violet-200 text-[#7C3AED] font-medium hover:bg-violet-50 disabled:opacity-50"
          >
            {c}
          </button>
        ))}
      </div>

      {/* chat */}
      <div className="mt-3 bg-white rounded-xl border border-violet-100 h-44 overflow-y-auto thin-scroll p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-xs text-slate-500 italic">
            Say "Payment atka hai kya?" or tap a chip to ask the copilot.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            data-testid={`copilot-msg-${i}`}
            className={`text-sm ${m.role === "user" ? "text-[#002970]" : "text-slate-800"}`}
          >
            <span className="font-mono-ui text-[9px] uppercase mr-1 opacity-60">
              {m.role === "user" ? "you" : "ai"}
            </span>
            {m.text || <span className="opacity-50">thinking…</span>}
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          data-testid="copilot-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              send(input);
              setInput("");
            }
          }}
          placeholder="Hinglish me pucho…"
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-violet-200 focus:border-[#7C3AED] outline-none"
        />
        <button
          data-testid="copilot-send-btn"
          onClick={() => {
            send(input);
            setInput("");
          }}
          disabled={streaming || !input.trim()}
          className="press-shrink px-3 py-2 rounded-xl bg-[#7C3AED] text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </div>
    </div>
  );
};
