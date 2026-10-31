import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/App.css";
import { Toaster, toast } from "sonner";
import { Smartphone, Monitor, Columns, RefreshCw } from "lucide-react";

import { ClientView } from "@/components/views/ClientView";
import { MerchantView } from "@/components/views/MerchantView";
import { uid } from "@/lib/simulator";

const nowHMS = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

function App() {
  // Determine view mode: client, merchant, or split
  const [viewMode, setViewModeState] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("view");
      if (v === "client") return "client";
      if (v === "merchant") return "merchant";
      if (v === "split") return "split";
      // Only auto-detect if the device is genuinely a mobile phone user-agent
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      if (isMobileUA) return "client";
    }
    return "merchant";
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", mode);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const [session, setSession] = useState({
    scenario: "SCENARIO_A",
    status: "IDLE",
    amount: 350.0,
    token: "4821",
    customer: "Rahul S.",
    vpa: "rahul9821@okhdfcbank",
    bank: "HDFC",
    store: "Sharma Bakery",
    error_code: null,
    badge: null,
    sarvam_explainer: null,
    soundbox_alert: null,
    qr_payload: null,
    qr_scanned: false,
    duplicate_detected: false,
    refund_executed: false,
  });

  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [soundboxPlaying, setSoundboxPlaying] = useState(false);
  const [bankHealth, setBankHealth] = useState({
    HDFC: { status: "NORMAL", latency: 180, p95_latency_ms: 180, timeoutPct: 0.4, timeout_rate: 0.4 },
    SBI:  { status: "LATENCY_SPIKE", latency: 1250, p95_latency_ms: 1250, timeoutPct: 4.8, timeout_rate: 4.8 },
    ICICI:{ status: "NORMAL", latency: 150, p95_latency_ms: 150, timeoutPct: 0.3, timeout_rate: 0.3 },
    Axis: { status: "NORMAL", latency: 260, p95_latency_ms: 260, timeoutPct: 0.8, timeout_rate: 0.8 },
  });

  const wsRef = useRef(null);
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const port = typeof window !== "undefined" ? window.location.port : "8000";
  const proto = typeof window !== "undefined" && window.location.protocol === "https:" ? "https:" : "http:";
  const wsProto = proto === "https:" ? "wss:" : "ws:";

  // Dynamic API & WebSocket URLs (Works in dev on port 5173, unified port 8000, or deployed cloud HTTPS/WSS)
  const isViteDev = port === "5173";
  const API = isViteDev ? `http://${host}:8000/api` : `${proto}//${host}${port ? `:${port}` : ""}/api`;
  const WS_URL = isViteDev ? `ws://${host}:8000/ws` : `${wsProto}//${host}${port ? `:${port}` : ""}/ws`;

  const pushEvent = useCallback((type, msg) => {
    setEvents((prev) => [
      { id: uid(), time: nowHMS(), type, msg },
      ...prev,
    ].slice(0, 60));
  }, []);

  const triggerSoundbox = useCallback((audioFile, text) => {
    setSoundboxPlaying(true);
    setTimeout(() => setSoundboxPlaying(false), 2400);

    // If on merchant/laptop, play audio
    try {
      if (audioFile) {
        const a = new Audio(`/audio/${audioFile}`);
        a.play().catch(() => playSpeech(text));
      } else if (text) {
        playSpeech(text);
      }
    } catch {
      playSpeech(text);
    }
  }, []);

  const playSpeech = (text) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "hi-IN";
      u.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  };

  // Connect WebSocket to backend
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);
        ws.onopen = () => {
          setConnected(true);
          pushEvent("WS_OPEN", `Connected to ClearMoment Engine (${WS_URL})`);
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.session) {
              setSession(data.session);
            }
            if (data.ledger) {
              setLedger(data.ledger);
            }
            if (data.message) {
              pushEvent(data.type, data.message);
            }
            // Trigger soundbox audio when alert arrives
            if (data.session?.soundbox_alert?.audio_file) {
              triggerSoundbox(
                data.session.soundbox_alert.audio_file,
                data.session.soundbox_alert.text
              );
            }
          } catch {
            /* ignore */
          }
        };
        ws.onclose = () => {
          setConnected(false);
          reconnectTimeout = setTimeout(connect, 2000);
        };
        ws.onerror = () => {
          setConnected(false);
        };
        wsRef.current = ws;
      } catch {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [WS_URL, pushEvent, triggerSoundbox]);

  // Initial fetch of session state
  useEffect(() => {
    fetch(`${API}/session`)
      .then((res) => res.json())
      .then((data) => {
        if (data.session) setSession(data.session);
        if (data.ledger) setLedger(data.ledger);
        if (data.issuer_health) setBankHealth(data.issuer_health);
      })
      .catch(() => {});
  }, [API]);

  // Actions sent from Client (Mobile) or Merchant (Laptop)
  const sendAction = useCallback(async (endpoint, actionType) => {
    try {
      const res = await fetch(`${API}/session/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.session) setSession(data.session);
    } catch {
      // Fallback: send via WebSocket if available
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: actionType }));
      }
    }
  }, [API]);

  const handleSelectScenario = useCallback(async (scenarioKey) => {
    try {
      const res = await fetch(`${API}/session/scenario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenarioKey }),
      });
      const data = await res.json();
      if (data.session) setSession(data.session);
      toast.info(`Switched to ${scenarioKey.replace("_", " ")}`);
    } catch {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "SELECT_SCENARIO", scenario: scenarioKey }));
      }
    }
  }, [API]);

  const handleReset = useCallback(() => {
    sendAction("reset", "RESET");
    toast.success("Reset session state");
  }, [sendAction]);

  const handlePay = useCallback(() => {
    sendAction("pay", "START_PAYMENT");
  }, [sendAction]);

  const handleUpiLitePay = useCallback(() => {
    sendAction("upi-lite", "PAY_UPI_LITE");
    toast.success(`₹${session.amount} settled via UPI Lite!`);
  }, [sendAction, session.amount]);

  const handlePanicRescan = useCallback(() => {
    sendAction("panic-rescan", "PANIC_RESCAN");
  }, [sendAction]);

  const handleScanQR = useCallback(() => {
    sendAction("scan-qr", "SCAN_STATUS_QR");
    toast.success(`Verified Customer Token #${session.token}`);
  }, [sendAction, session.token]);

  const handleInstantRefund = useCallback(() => {
    sendAction("instant-refund", "ISSUE_1TAP_REFUND");
    toast.success(`₹${session.amount} Instant Refund Executed!`);
  }, [sendAction, session.amount]);

  const handleDecision = useCallback((d) => {
    pushEvent("MERCHANT_DECISION", `Counter action: ${d}`);
    if (d === "RELEASE_GOODS") toast.success("Goods released");
    if (d === "TAKE_CASH_AUTO_REFUND") toast.info("Cash collected. Auto-refund armed.");
  }, [pushEvent]);

  // Chaos controls
  const crashHDFC = () => {
    setBankHealth((h) => ({
      ...h,
      HDFC: { ...h?.HDFC, status: "CRASHED", latency: 9999, p95_latency_ms: 9999, timeoutPct: 100, timeout_rate: 100 }
    }));
    pushEvent("CHAOS_CRASH", "HDFC switch CRASHED");
  };
  const spikeSBI = () => {
    setBankHealth((h) => ({
      ...h,
      SBI: { ...h?.SBI, status: "LATENCY_SPIKE", latency: 1800, p95_latency_ms: 1800, timeoutPct: 32, timeout_rate: 32 }
    }));
    pushEvent("CHAOS_SPIKE", "SBI latency SPIKE");
  };
  const resetBanks = () => {
    setBankHealth({
      HDFC: { status: "NORMAL", latency: 180, p95_latency_ms: 180, timeoutPct: 0.4, timeout_rate: 0.4 },
      SBI:  { status: "LATENCY_SPIKE", latency: 1250, p95_latency_ms: 1250, timeoutPct: 4.8, timeout_rate: 4.8 },
      ICICI:{ status: "NORMAL", latency: 150, p95_latency_ms: 150, timeoutPct: 0.3, timeout_rate: 0.3 },
      Axis: { status: "NORMAL", latency: 260, p95_latency_ms: 260, timeoutPct: 0.8, timeout_rate: 0.8 },
    });
    pushEvent("CHAOS_RESET", "Banks reset to normal");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" richColors />

      {/* Floating Top Mode Switcher Bar */}
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#00BAF2] tracking-wider uppercase font-mono-ui">
            Paytm ClearMoment
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300 hidden sm:inline">Track 2 Multi-Device Sync</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewMode("merchant")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all press-shrink ${
              viewMode === "merchant"
                ? "bg-[#002970] text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Laptop (Merchant)</span>
          </button>

          <button
            onClick={() => setViewMode("client")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all press-shrink ${
              viewMode === "client"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (Customer)</span>
          </button>

          <button
            onClick={() => setViewMode("split")}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all press-shrink ${
              viewMode === "split"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Demo</span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW ACCORDING TO USER MODE */}
      {viewMode === "client" && (
        <ClientView
          session={session}
          onPay={handlePay}
          onUpiLitePay={handleUpiLitePay}
          onPanicRescan={handlePanicRescan}
          onReset={handleReset}
          onSelectScenario={handleSelectScenario}
          connected={connected}
        />
      )}

      {viewMode === "merchant" && (
        <MerchantView
          session={session}
          events={events}
          ledger={ledger}
          certificate={certificate}
          bankHealth={bankHealth}
          soundboxPlaying={soundboxPlaying}
          onPlaySoundbox={() =>
            triggerSoundbox(
              session?.soundbox_alert?.audio_file,
              session?.soundbox_alert?.text
            )
          }
          onScanQR={handleScanQR}
          onInstantRefund={handleInstantRefund}
          onDecision={handleDecision}
          onReset={handleReset}
          onSelectScenario={handleSelectScenario}
          onCrashHDFC={crashHDFC}
          onSpikeSBI={spikeSBI}
          onResetBanks={resetBanks}
          connected={connected}
          apiBase={API}
        />
      )}

      {viewMode === "split" && (
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-screen">
          <div className="md:col-span-5 bg-slate-200 p-4 flex items-center justify-center border-r border-slate-300">
            <div className="w-full max-w-sm rounded-[36px] overflow-hidden shadow-2xl border-4 border-slate-900 bg-white">
              <ClientView
                session={session}
                onPay={handlePay}
                onUpiLitePay={handleUpiLitePay}
                onPanicRescan={handlePanicRescan}
                onReset={handleReset}
                onSelectScenario={handleSelectScenario}
                connected={connected}
              />
            </div>
          </div>
          <div className="md:col-span-7">
            <MerchantView
              session={session}
              events={events}
              ledger={ledger}
              certificate={certificate}
              bankHealth={bankHealth}
              soundboxPlaying={soundboxPlaying}
              onPlaySoundbox={() =>
                triggerSoundbox(
                  session?.soundbox_alert?.audio_file,
                  session?.soundbox_alert?.text
                )
              }
              onScanQR={handleScanQR}
              onInstantRefund={handleInstantRefund}
              onDecision={handleDecision}
              onReset={handleReset}
              onSelectScenario={handleSelectScenario}
              onCrashHDFC={crashHDFC}
              onSpikeSBI={spikeSBI}
              onResetBanks={resetBanks}
              connected={connected}
              apiBase={API}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
