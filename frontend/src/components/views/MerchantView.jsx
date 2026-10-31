import { useState } from "react";
import {
  ShieldCheck,
  QrCode,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { POSTerminal } from "@/components/safeclear/POSTerminal";
import { Soundbox } from "@/components/safeclear/Soundbox";
import { LedgerFeed } from "@/components/safeclear/LedgerFeed";
import { AICopilot } from "@/components/safeclear/AICopilot";
import { BankHealth } from "@/components/safeclear/BankHealth";
import { ChaosInjector } from "@/components/safeclear/ChaosInjector";
import { EventLog } from "@/components/safeclear/EventLog";
import { CertificateCard } from "@/components/safeclear/CertificateCard";

export const MerchantView = ({
  session,
  events,
  ledger,
  certificate,
  bankHealth,
  soundboxPlaying,
  onPlaySoundbox,
  onScanQR,
  onInstantRefund,
  onDecision,
  onReset,
  onSelectScenario,
  onCrashHDFC,
  onSpikeSBI,
  onResetBanks,
  connected,
  apiBase,
}) => {
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  const amount = session?.amount || 350;
  const status = session?.status || "IDLE";
  const token = session?.token || "4821";
  const customer = session?.customer || "Rahul S.";
  const scenario = session?.scenario || "SCENARIO_A";

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const port = typeof window !== "undefined" ? window.location.port : "5173";
  const clientMobileUrl = `http://${host}:${port}/?view=client`;

  // QR Code URL for mobile pairing
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    clientMobileUrl
  )}`;

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-10 font-sans">
      {/* Top Merchant Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#002970] to-[#00BAF2] flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-extrabold tracking-tight text-[#002970]">
                  Paytm <span className="text-[#00BAF2]">ClearMoment</span>
                </span>
                <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-[#7C3AED] border border-violet-200">
                  Merchant POS Mode
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Counter #3 · Live Ambiguous 60s Terminal
              </div>
            </div>
          </div>

          {/* Quick Scenario Buttons & Connect Mobile Phone */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              {[
                { id: "SCENARIO_A", label: "A: False Alarm (₹350)" },
                { id: "SCENARIO_B", label: "B: Timeout QR (₹250)" },
                { id: "SCENARIO_C", label: "C: Duplicate (₹400)" },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => onSelectScenario(sc.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all press-shrink ${
                    scenario === sc.id
                      ? "bg-[#002970] text-white shadow-sm"
                      : "text-slate-600 hover:text-[#002970]"
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setMobileModalOpen(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-display font-bold text-xs shadow-md hover:from-emerald-700 hover:to-teal-700 flex items-center gap-1.5 press-shrink"
            >
              <Smartphone className="w-4 h-4" />
              <span>Connect Mobile</span>
            </button>

            <button
              onClick={onReset}
              title="Reset state"
              className="min-h-[44px] p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 press-shrink border border-slate-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid: POS, Soundbox & Sarvam Engine */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Column 1: POS Terminal & Soundbox (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="card-surface p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="font-display font-bold text-[#002970] text-base">
                    Counter #3 POS Terminal
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Live customer attribution & one-tap actions
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`status-dot ${
                      connected ? "bg-emerald-500 text-emerald-500" : "bg-rose-500 text-rose-500"
                    }`}
                  />
                  <span className="font-mono-ui text-xs font-bold text-slate-600">
                    Token #{token}
                  </span>
                </div>
              </div>

              {/* POSTerminal Component */}
              <POSTerminal
                amount={amount}
                status={
                  status === "TIMEOUT_PENDING"
                    ? "BANK_TIMEOUT_U68"
                    : status === "DECLINED"
                    ? "PRE_DEBIT_DECLINE"
                    : status === "DUPLICATE_ALERT"
                    ? "INTENT_GUARD_ALERT"
                    : status === "SETTLED"
                    ? "SETTLED"
                    : "IDLE"
                }
                token={token}
                customer={customer}
                onDecision={onDecision}
                onScanQR={onScanQR}
                onInstantRefund={onInstantRefund}
                refundDone={session?.refund_executed}
                qrScanned={session?.qr_scanned}
              />

              {/* Soundbox Voice Alerts */}
              <div className="mt-4">
                <Soundbox
                  amount={amount}
                  playing={soundboxPlaying}
                  onPlay={onPlaySoundbox}
                  phase={
                    status === "TIMEOUT_PENDING"
                      ? "BANK_TIMEOUT_U68"
                      : status === "DECLINED"
                      ? "PRE_DEBIT_DECLINE"
                      : status === "DUPLICATE_ALERT"
                      ? "INTENT_GUARD_ALERT"
                      : status === "SETTLED"
                      ? "SETTLED"
                      : "IDLE"
                  }
                  token={token}
                />
              </div>

              {/* Live Merchant Ledger Feed */}
              <div className="mt-4">
                <LedgerFeed entries={ledger} />
              </div>
            </div>
          </div>

          {/* Column 2: Sarvam AI Intelligence Core & Bank Telemetry (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="card-surface p-5 space-y-4">
              <AICopilot
                apiBase={apiBase}
                context={{
                  scenario,
                  amount,
                  status,
                  token,
                  customer,
                  bank: session?.bank,
                }}
              />
              <BankHealth health={bankHealth} />
              <ChaosInjector
                onCrashHDFC={onCrashHDFC}
                onSpikeSBI={onSpikeSBI}
                onReset={onResetBanks}
              />
            </div>

            {/* Event log */}
            <EventLog events={events} />
          </div>
        </div>

        {/* NPCI UDIR Settlement Certificate */}
        <div className="mt-5">
          <CertificateCard cert={certificate} />
        </div>
      </main>

      {/* Connect Mobile Modal */}
      {mobileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
              <Smartphone className="w-6 h-6" />
            </div>

            <div>
              <div className="font-display font-extrabold text-lg text-slate-900">
                Open Customer App on Mobile
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Scan this QR with your smartphone camera to perform the demo as the customer!
              </p>
            </div>

            <div
              className="p-3 bg-slate-50 border border-slate-200 rounded-2xl mx-auto flex items-center justify-center"
              style={{ width: "180px", height: "180px" }}
            >
              <img
                src={qrImageSrc}
                alt="Client Mobile URL QR"
                style={{ width: "160px", height: "160px", display: "block" }}
                width="160"
                height="160"
                className="rounded-lg"
              />
            </div>

            <div className="bg-slate-100 p-2.5 rounded-xl text-[11px] font-mono-ui text-slate-700 break-all select-all">
              {clientMobileUrl}
            </div>

            <button
              onClick={() => setMobileModalOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#002970] text-white font-display font-bold text-sm press-shrink"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
