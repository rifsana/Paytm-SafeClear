import { useState } from "react";
import { Smartphone, RotateCcw, X } from "lucide-react";

import { POSTerminal } from "@/components/safeclear/POSTerminal";
import { Soundbox } from "@/components/safeclear/Soundbox";
import { LedgerFeed } from "@/components/safeclear/LedgerFeed";
import { AICopilot } from "@/components/safeclear/AICopilot";
import { BankHealth } from "@/components/safeclear/BankHealth";
import { ChaosInjector } from "@/components/safeclear/ChaosInjector";
import { EventLog } from "@/components/safeclear/EventLog";
import { CertificateCard } from "@/components/safeclear/CertificateCard";
import { SCENARIO_OPTIONS, formatINR } from "@/lib/status";

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
  embedded = false,
}) => {
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  const amount = session?.amount || 350;
  const status = session?.status || "IDLE";
  const token = session?.token || "4821";
  const customer = session?.customer || "Rahul S.";
  const scenario = session?.scenario || "SCENARIO_A";
  const store = session?.store || "Sharma Bakery";

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const clientMobileUrl = `${origin}/?view=client`;

  // QR Code URL for mobile pairing
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=${encodeURIComponent(
    clientMobileUrl
  )}`;

  return (
    <div className={embedded ? "@container" : "@container mx-auto max-w-[1440px] px-4 pb-10 pt-5 sm:px-6"}>
      {/* Page header */}
      <div className="flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div className="min-w-0">
          <div className="eyebrow">Paytm for Business · Counter #3</div>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-paytm-navy">{store}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="segmented no-scrollbar min-w-0 flex-1 overflow-x-auto @3xl:flex-none" role="group" aria-label="Demo scenario">
            {SCENARIO_OPTIONS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                aria-pressed={scenario === sc.id}
                onClick={() => onSelectScenario(sc.id)}
                className="flex-1 whitespace-nowrap !px-2 @md:!px-3"
              >
                <span className="hidden text-slate-400 @3xl:inline">{sc.short} · </span>
                {sc.label}
                <span className="ml-1 hidden text-slate-400 @lg:inline">{formatINR(sc.amount)}</span>
              </button>
            ))}
          </div>
          {!embedded && (
            <button type="button" onClick={() => setMobileModalOpen(true)} className="btn-outline shrink-0 px-3">
              <Smartphone className="h-4 w-4" />
              <span className="hidden @xl:inline">Connect phone</span>
            </button>
          )}
          <button type="button" onClick={onReset} title="Reset session" aria-label="Reset session" className="btn-icon h-11 w-11 shrink-0 border border-slate-200 bg-white">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 @4xl:grid-cols-12 @4xl:gap-5">
        {/* Both columns stretch to the taller one so the grid has no ragged gaps. */}
        <div className="flex flex-col gap-4 @4xl:col-span-7">
          <POSTerminal
            amount={amount}
            status={status}
            token={token}
            customer={customer}
            bank={session?.bank}
            rrn={session?.rrn}
            refundRef={session?.refund_ref}
            connected={connected}
            onDecision={onDecision}
            onScanQR={onScanQR}
            onInstantRefund={onInstantRefund}
            qrScanned={session?.qr_scanned}
          />

          <div className="grid flex-1 grid-cols-1 gap-4 @2xl:grid-cols-2">
            <Soundbox
              amount={amount}
              playing={soundboxPlaying}
              onPlay={onPlaySoundbox}
              status={status}
              token={token}
              customer={customer}
            />
            <LedgerFeed entries={ledger} />
          </div>
        </div>

        <div className="flex flex-col gap-4 @4xl:col-span-5">
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
          <BankHealth health={bankHealth}>
            <ChaosInjector onCrashHDFC={onCrashHDFC} onSpikeSBI={onSpikeSBI} onReset={onResetBanks} />
          </BankHealth>
        </div>
      </div>

      <div className="mt-4 @4xl:mt-5">
        <EventLog events={events} />
      </div>

      {certificate && (
        <div className="mt-5">
          <CertificateCard cert={certificate} />
        </div>
      )}

      {/* Connect phone modal */}
      {mobileModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setMobileModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-phone-title"
            className="w-full max-w-sm animate-scale-up rounded-t-3xl bg-white p-6 text-center shadow-lift sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="text-left">
                <div id="connect-phone-title" className="text-lg font-bold text-paytm-navy">
                  Open customer app
                </div>
                <p className="mt-0.5 text-sm text-slate-500">Scan with your phone camera to play the customer.</p>
              </div>
              <button type="button" onClick={() => setMobileModalOpen(false)} className="btn-icon -mr-2 -mt-1" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto mt-5 w-fit rounded-2xl border border-slate-200 p-3">
              <img src={qrImageSrc} alt="QR code linking to the customer app" width="176" height="176" className="block h-44 w-44" />
            </div>

            <div className="mt-4 select-all break-all rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600">
              {clientMobileUrl}
            </div>
            {/localhost|127\.0\.0\.1/.test(origin) && (
              <p className="mt-2 text-[11px] text-amber-700">
                Tip: open this page via your machine's LAN IP so your phone can reach it.
              </p>
            )}

            <button type="button" onClick={() => setMobileModalOpen(false)} className="btn-primary mt-5 w-full">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
