import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/App.css";
import { Toaster } from "sonner";

import { TopBar } from "@/components/safeclear/TopBar";
import { ScenarioBar } from "@/components/safeclear/ScenarioBar";
import { PhoneMockup } from "@/components/safeclear/PhoneMockup";
import { POSTerminal } from "@/components/safeclear/POSTerminal";
import { Soundbox } from "@/components/safeclear/Soundbox";
import { LedgerFeed } from "@/components/safeclear/LedgerFeed";
import { AICopilot } from "@/components/safeclear/AICopilot";
import { BankHealth } from "@/components/safeclear/BankHealth";
import { ChaosInjector } from "@/components/safeclear/ChaosInjector";
import { EventLog } from "@/components/safeclear/EventLog";
import { CertificateCard } from "@/components/safeclear/CertificateCard";

import {
  SCENARIOS,
  buildTimeline,
  makeInitialBankHealth,
  finalStatusFor,
  uid,
} from "@/lib/simulator";

const API = 'http://localhost:8000/api';

const nowHMS = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

function App() {
  const [speed, setSpeed] = useState("1x");
  const [activeScenario, setActiveScenario] = useState(null);
  const [phase, setPhase] = useState("IDLE");
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [bankHealth, setBankHealth] = useState(makeInitialBankHealth());
  const [soundboxPlaying, setSoundboxPlaying] = useState(false);
  const [posDecision, setPosDecision] = useState(null);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [dispute, setDispute] = useState("");
  const [triageResult, setTriageResult] = useState(null);
  const [posCountdown, setPosCountdown] = useState(0);

  const timeoutsRef = useRef([]);
  const bankTickRef = useRef(null);
  const lockTickRef = useRef(null);
  const posTickRef = useRef(null);

  const scenarioObj = activeScenario ? SCENARIOS[activeScenario] : null;

  const speedFactor = speed === "4x" ? 4 : 1;

  const pushEvent = useCallback((type, msg) => {
    setEvents((prev) => [
      { id: uid(), time: nowHMS(), type, msg },
      ...prev,
    ].slice(0, 60));
  }, []);

  const resetSim = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (lockTickRef.current) clearInterval(lockTickRef.current);
    if (posTickRef.current) clearInterval(posTickRef.current);
    setPhase("IDLE");
    setPosDecision(null);
    setLockSeconds(0);
    setSoundboxPlaying(false);
    setPosCountdown(0);
    setCertificate(null);
  }, []);

  // live bank health ticker (small jitter)
  useEffect(() => {
    bankTickRef.current = setInterval(() => {
      setBankHealth((h) => {
        const copy = { ...h };
        Object.keys(copy).forEach((k) => {
          const b = copy[k];
          const jitter = (Math.random() - 0.5) * 20;
          let base = 180;
          if (b.status === "LATENCY_SPIKE") base = 1200;
          if (b.status === "CRASHED") base = 9999;
          copy[k] = {
            ...b,
            latency: Math.max(80, Math.round(base + jitter * (b.status === "NORMAL" ? 1 : 5))),
          };
        });
        return copy;
      });
    }, 1000);
    return () => clearInterval(bankTickRef.current);
  }, []);

  const triggerSoundbox = () => {
    setSoundboxPlaying(true);
    setTimeout(() => setSoundboxPlaying(false), 1800);
  };

  const generateCertificate = useCallback(async (sc, finalStatus) => {
    try {
      const r = await fetch(`${API}/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: sc.amount,
          scenario: sc.id,
          status: finalStatus,
        }),
      });
      const data = await r.json();
      setCertificate(data);
      setLedger((l) => [
        {
          id: uid(),
          ref: data.dispute_ref,
          time: nowHMS(),
          bank: sc.bank,
          amount: sc.amount,
          status: finalStatus,
        },
        ...l,
      ].slice(0, 20));
    } catch (e) {
      pushEvent("ERROR", `Certificate error: ${e.message}`);
    }
  }, [pushEvent]);

  const startLockCountdown = (seconds) => {
    setLockSeconds(seconds);
    if (lockTickRef.current) clearInterval(lockTickRef.current);
    lockTickRef.current = setInterval(() => {
      setLockSeconds((s) => {
        if (s <= 1) {
          clearInterval(lockTickRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const runScenario = useCallback((id) => {
    const sc = SCENARIOS[id];
    if (!sc) return;
    resetSim();
    setActiveScenario(id);
    setRunning(true);
    pushEvent("SCENARIO_START", `${sc.label} • ₹${sc.amount} via ${sc.bank}`);
    const timeline = buildTimeline(id, sc.amount);
    timeline.forEach((step) => {
      const t = setTimeout(() => {
        setPhase(step.type);
        pushEvent(step.type, step.msg);
        if (step.type === "SOUNDBOX_PLAY") triggerSoundbox();
        if (step.type === "SAFECLEAR_LOCK") startLockCountdown(30);
        if (step.type === "HUMAN_IN_LOOP") {
          setPosCountdown(60);
          if (posTickRef.current) clearInterval(posTickRef.current);
          posTickRef.current = setInterval(() => {
            setPosCountdown((s) => {
              if (s <= 1) {
                clearInterval(posTickRef.current);
                return 0;
              }
              return s - 1;
            });
          }, 1000);
        }
      }, step.t / speedFactor);
      timeoutsRef.current.push(t);
    });

    const totalMs = timeline[timeline.length - 1].t / speedFactor + 400;
    const finalT = setTimeout(() => {
      const finalStatus = finalStatusFor(id);
      pushEvent("CERTIFICATE", `NPCI UDIR audit certificate issued`);
      generateCertificate(sc, finalStatus);
      setRunning(false);
    }, totalMs);
    timeoutsRef.current.push(finalT);
  }, [generateCertificate, pushEvent, resetSim, speedFactor]);

  const handleDecision = (d) => {
    setPosDecision(d);
    pushEvent("MERCHANT_DECISION", `Counter chose ${d.replace("_", " ")}`);
    if (d === "CASH_REFUND" && scenarioObj) {
      pushEvent("AUTO_REFUND", `Auto-refund ₹${scenarioObj.amount} queued`);
    }
  };

  const handleTriage = async (text) => {
    setDispute(text);
    setTriageResult(null);
    pushEvent("DISPUTE_TRIAGE", `Customer: "${text}"`);
    try {
      const r = await fetch(`${API}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, amount: scenarioObj?.amount }),
      });
      const data = await r.json();
      setTriageResult(data);
      pushEvent("TRIAGE_RESULT", `${data.category} → ${data.action}`);
    } catch (e) {
      pushEvent("ERROR", `Triage failed: ${e.message}`);
    }
  };

  const crashHDFC = () => {
    setBankHealth((h) => ({ ...h, HDFC: { ...h.HDFC, status: "CRASHED", latency: 9999, timeoutPct: 100 } }));
    pushEvent("CHAOS_CRASH", "HDFC bank CRASHED (chaos injected)");
  };
  const spikeSBI = () => {
    setBankHealth((h) => ({ ...h, SBI: { ...h.SBI, status: "LATENCY_SPIKE", latency: 1800, timeoutPct: 32 } }));
    pushEvent("CHAOS_SPIKE", "SBI latency SPIKE (chaos injected)");
  };
  const resetBanks = () => {
    setBankHealth(makeInitialBankHealth());
    pushEvent("CHAOS_RESET", "All banks reset to NORMAL");
  };

  const copilotCtx = useMemo(() => ({
    scenario: activeScenario || "none",
    amount: scenarioObj?.amount || 0,
    phase,
    bank: scenarioObj?.bank || "none",
    pos_decision: posDecision || "none",
  }), [activeScenario, scenarioObj, phase, posDecision]);

  return (
    <div className="safeclear-canvas" data-testid="safeclear-root">
      <Toaster position="top-right" richColors />
      <TopBar speed={speed} onSpeedChange={setSpeed} live={true} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 space-y-5">
        <ScenarioBar active={activeScenario} running={running} onRun={runScenario} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Column 1 - Customer */}
          <div className="lg:col-span-3">
            <PhoneMockup
              scenario={scenarioObj}
              phase={phase}
              lockSeconds={lockSeconds}
              dispute={dispute}
              onTriage={handleTriage}
              triageResult={triageResult}
            />
          </div>

          {/* Column 2 - Merchant Counter */}
          <div className="lg:col-span-5 space-y-5">
            <div className="card-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-display font-bold text-[#002970]">Merchant Counter</div>
                  <div className="text-[11px] text-slate-500">POS · Soundbox · Live Ledger</div>
                </div>
                <span className="font-mono-ui text-[10px] uppercase tracking-wider text-slate-500">
                  Counter #3
                </span>
              </div>
              <POSTerminal
                amount={scenarioObj?.amount || 0}
                status={phase}
                countdown={posCountdown}
                onDecision={handleDecision}
                decision={posDecision}
              />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Soundbox amount={scenarioObj?.amount || 0} playing={soundboxPlaying} onPlay={triggerSoundbox} />
                <LedgerFeed entries={ledger} />
              </div>
            </div>
          </div>

          {/* Column 3 - AI Engine */}
          <div className="lg:col-span-4 space-y-5">
            <div className="card-surface p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-[#002970]">Merchant AI Copilot & Engine</div>
                  <div className="text-[11px] text-slate-500">Ollama Copilot · Bank Health · Chaos</div>
                </div>
                <span className="font-mono-ui text-[10px] uppercase tracking-wider text-[#7C3AED] bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                  AI ACTIVE
                </span>
              </div>
              <AICopilot apiBase={API} context={copilotCtx} />
              <BankHealth health={bankHealth} />
              <ChaosInjector onCrashHDFC={crashHDFC} onSpikeSBI={spikeSBI} onReset={resetBanks} />
            </div>
            <EventLog events={events} />
          </div>
        </div>

        <CertificateCard cert={certificate} />

        <footer className="text-center text-[11px] text-slate-500 pb-6">
          Paytm SafeClear · NPCI UDIR Autonomous Resolution Engine · Demo build
        </footer>
      </main>
    </div>
  );
}

export default App;
