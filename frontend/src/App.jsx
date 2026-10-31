import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Smartphone, Store, Columns2 } from "lucide-react";

import { ClientView } from "@/components/views/ClientView";
import { MerchantView } from "@/components/views/MerchantView";
import { PaytmLogo, LiveDot } from "@/components/ui/Brand";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { uid } from "@/lib/uid";

const nowHMS = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

const useMediaQuery = (query) => {
  const get = () => typeof window !== "undefined" && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
};

const MODES = [
  { id: "merchant", label: "Merchant", icon: Store },
  { id: "client", label: "Customer", icon: Smartphone },
  { id: "split", label: "Split", icon: Columns2, wideOnly: true },
];

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

  // Single shared soundbox player: a new clip always stops the previous one.
  const audioRef = useRef(null);
  const lastAlertKeyRef = useRef(null);
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  }, []);

  const playSound = useCallback(({ file, text, lang = "hi-IN" }) => {
    stopSound();
    setSoundboxPlaying(true);
    const done = () => setSoundboxPlaying(false);

    const speak = () => {
      if (!text || !window.speechSynthesis) return done();
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = 0.95;
        const voices = window.speechSynthesis.getVoices?.() || [];
        const voice = voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
        if (voice) u.voice = voice;
        u.onend = done;
        u.onerror = done;
        window.speechSynthesis.speak(u);
      } catch {
        done();
      }
    };

    if (!file) return speak();
    const a = new Audio(file.startsWith("/") ? file : `/audio/${file}`);
    audioRef.current = a;
    a.onended = done;
    a.play().catch(() => {
      if (audioRef.current === a) {
        audioRef.current = null;
        speak();
      }
    });
  }, [stopSound]);

  // Announce a backend alert once; repeated broadcasts of the same session must not replay it.
  const handleAlert = useCallback((session, { baseline = false } = {}) => {
    const alert = session?.soundbox_alert;
    const key = alert ? `${session.status}|${alert.audio_file}|${alert.text}` : null;
    if (key === lastAlertKeyRef.current) return;
    lastAlertKeyRef.current = key;
    if (!alert) return stopSound();
    // The soundbox lives at the merchant counter; the customer phone stays quiet.
    if (baseline || viewModeRef.current === "client") return;
    playSound({ file: alert.audio_file, text: alert.text });
  }, [playSound, stopSound]);

  useEffect(() => stopSound, [stopSound]);

  // Connect WebSocket to backend
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      try {
        ws = new WebSocket(WS_URL);
        ws.onopen = () => {
          setConnected(true);
          pushEvent("WS_OPEN", `Connected to SafeClear Engine (${WS_URL})`);
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.session) {
              setSession(data.session);
              // SYNC_STATE replays whatever alert is current; don't announce it on (re)connect.
              handleAlert(data.session, { baseline: data.type === "SYNC_STATE" });
            }
            if (data.ledger) {
              setLedger(data.ledger);
            }
            if (data.message) {
              pushEvent(data.type, data.message);
            }
          } catch {
            /* ignore */
          }
        };
        ws.onclose = () => {
          setConnected(false);
          if (!disposed) reconnectTimeout = setTimeout(connect, 2000);
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
      disposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.onmessage = null;
        ws.close();
      }
    };
  }, [WS_URL, pushEvent, handleAlert]);

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

  const isWide = useMediaQuery("(min-width: 1024px)");
  // Split needs room for the phone frame; narrower screens fall back to the merchant view.
  const effectiveMode = viewMode === "split" && !isWide ? "merchant" : viewMode;

  const clientProps = {
    session,
    onPay: handlePay,
    onUpiLitePay: handleUpiLitePay,
    onPanicRescan: handlePanicRescan,
    onReset: handleReset,
    onSelectScenario: handleSelectScenario,
    connected,
  };

  const merchantProps = {
    session,
    events,
    ledger,
    certificate,
    bankHealth,
    soundboxPlaying,
    onPlaySoundbox: playSound,
    onScanQR: handleScanQR,
    onInstantRefund: handleInstantRefund,
    onDecision: handleDecision,
    onReset: handleReset,
    onSelectScenario: handleSelectScenario,
    onCrashHDFC: crashHDFC,
    onSpikeSBI: spikeSBI,
    onResetBanks: resetBanks,
    connected,
    apiBase: API,
  };

  return (
    <div className="min-h-dvh bg-paytm-bg text-slate-900">
      <Toaster position="top-center" richColors closeButton />

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <PaytmLogo className="text-[22px]" />
            <span className="h-5 w-px bg-slate-200" />
            <span className="truncate text-sm font-semibold text-paytm-navy">SafeClear</span>
            <span className="hidden sm:inline-flex">
              <LiveDot connected={connected} />
            </span>
          </div>

          <nav className="segmented shrink-0" aria-label="View mode">
            {MODES.filter((m) => !m.wideOnly || isWide).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={effectiveMode === id}
                onClick={() => setViewMode(id)}
                className="flex items-center gap-1.5"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden min-[400px]:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {effectiveMode === "client" && <ClientView {...clientProps} />}

      {effectiveMode === "merchant" && <MerchantView {...merchantProps} />}

      {effectiveMode === "split" && (
        <div className="mx-auto grid max-w-[1440px] grid-cols-[auto_minmax(0,1fr)] gap-6 px-6 py-6">
          <aside className="sticky top-20 self-start">
            {/* reserved = app bar + page padding + caption */}
            <PhoneFrame reserved={136} caption="Customer phone · live synced">
              <ClientView {...clientProps} embedded />
            </PhoneFrame>
          </aside>
          <div className="min-w-0">
            <MerchantView {...merchantProps} embedded />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
