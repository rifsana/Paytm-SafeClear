// Client-side simulation state machine for Paytm SafeClear scenarios
// All timing is virtual (ms) and scaled by `speed` (1x or 4x).

export const BANKS = ["HDFC", "SBI", "ICICI", "AXIS"];

export const SCENARIOS = {
  LATE_WEBHOOK: {
    id: "LATE_WEBHOOK",
    label: "Late Webhook Success",
    amount: 250,
    bank: "HDFC",
    chip: "₹250 QR",
    color: "emerald",
  },
  BANK_DECLINE: {
    id: "BANK_DECLINE",
    label: "Bank Decline",
    amount: 500,
    bank: "SBI",
    chip: "₹500 Failed",
    color: "coral",
  },
  BANK_TIMEOUT: {
    id: "BANK_TIMEOUT",
    label: "Bank Timeout 60s",
    amount: 1200,
    bank: "AXIS",
    chip: "₹1,200 Human-in-Loop",
    color: "amber",
  },
  DUPLICATE: {
    id: "DUPLICATE",
    label: "Duplicate Payment",
    amount: 400,
    bank: "ICICI",
    chip: "₹400 Auto-Refund",
    color: "violet",
  },
};

export const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export function makeInitialBankHealth() {
  return {
    HDFC: { status: "NORMAL", latency: 180, timeoutPct: 0.4 },
    SBI:  { status: "NORMAL", latency: 220, timeoutPct: 0.6 },
    ICICI:{ status: "NORMAL", latency: 150, timeoutPct: 0.3 },
    AXIS: { status: "NORMAL", latency: 260, timeoutPct: 0.8 },
  };
}

// Build the ordered event timeline for a scenario (in virtual ms)
export function buildTimeline(scenarioId, amount) {
  const T = {};
  if (scenarioId === "LATE_WEBHOOK") {
    return [
      { t: 0,     type: "CUSTOMER_SCAN",   msg: `Customer scanned QR for ₹${amount}` },
      { t: 400,   type: "UPI_INIT",        msg: "UPI collect request initiated via HDFC" },
      { t: 1200,  type: "PAYER_DEBIT",     msg: "Payer bank debited ₹" + amount },
      { t: 2000,  type: "POS_PENDING",     msg: "POS still shows PENDING (webhook delayed)" },
      { t: 2200,  type: "SAFECLEAR_CHECK", msg: "SafeClear pinging NPCI UDIR for live status…" },
      { t: 3600,  type: "UDIR_SUCCESS",    msg: "NPCI UDIR confirms SUCCESS — releasing goods instruction to merchant" },
      { t: 4200,  type: "SOUNDBOX_PLAY",   msg: `Paytm Soundbox: "₹${amount} prapt hue"` },
      { t: 4600,  type: "WEBHOOK_LATE",    msg: "Late webhook arrived (reconciled)" },
      { t: 5000,  type: "SETTLED",         msg: "Transaction SETTLED • Dispute averted" },
    ];
  }
  if (scenarioId === "BANK_DECLINE") {
    return [
      { t: 0,    type: "CUSTOMER_SCAN", msg: `Customer scanned QR for ₹${amount}` },
      { t: 400,  type: "UPI_INIT",      msg: "UPI collect request initiated via SBI" },
      { t: 1600, type: "BANK_DECLINE",  msg: "Payer bank DECLINED — insufficient funds" },
      { t: 1800, type: "SAFECLEAR_LOCK",msg: "SafeClear auto-locked QR to prevent retry loop" },
      { t: 2200, type: "SOUNDBOX_PLAY", msg: `Paytm Soundbox: "Payment fail — dubara karein"` },
      { t: 2600, type: "COUNTER_PROMPT",msg: "Merchant counter instruction: HOLD GOODS" },
      { t: 3200, type: "BANK_DECLINE",  msg: "Status: FAILED • Customer informed" },
    ];
  }
  if (scenarioId === "BANK_TIMEOUT") {
    return [
      { t: 0,    type: "CUSTOMER_SCAN",   msg: `Customer scanned QR for ₹${amount}` },
      { t: 400,  type: "UPI_INIT",        msg: "UPI collect request initiated via AXIS" },
      { t: 2500, type: "BANK_SLOW",       msg: "AXIS bank response > 20s — latency spike" },
      { t: 5000, type: "TIMEOUT_60S",     msg: "AXIS bank TIMEOUT after 60s (virtual)" },
      { t: 5200, type: "HUMAN_IN_LOOP",   msg: "SafeClear escalated to HUMAN-IN-LOOP merchant decision" },
      { t: 5600, type: "COUNTER_PROMPT",  msg: "Options: Release Goods / Take Cash + Auto-Refund / Hold Queue" },
    ];
  }
  if (scenarioId === "DUPLICATE") {
    return [
      { t: 0,    type: "CUSTOMER_SCAN",  msg: `Customer scanned QR for ₹${amount}` },
      { t: 500,  type: "UPI_INIT",       msg: "UPI payment #1 initiated via ICICI" },
      { t: 1400, type: "PAYER_DEBIT",    msg: "Payer bank debited ₹" + amount + " (#1)" },
      { t: 1600, type: "UPI_DUPLICATE",  msg: "Duplicate UPI payment #2 detected (same intent id)" },
      { t: 1800, type: "SAFECLEAR_DEDUP",msg: "SafeClear flagged DUPLICATE — triggering auto-refund" },
      { t: 2400, type: "AUTO_REFUND",    msg: `Auto-refund ₹${amount} queued via NPCI UDIR` },
      { t: 3400, type: "SOUNDBOX_PLAY",  msg: `Paytm Soundbox: "₹${amount} ek baar prapt • duplicate wapas"` },
      { t: 4000, type: "SETTLED",        msg: "SETTLED • 1 success + 1 auto-refund" },
    ];
  }
  return [];
}

export function finalStatusFor(scenarioId) {
  switch (scenarioId) {
    case "LATE_WEBHOOK": return "SUCCESS";
    case "BANK_DECLINE": return "FAILED";
    case "BANK_TIMEOUT": return "HUMAN_IN_LOOP";
    case "DUPLICATE":    return "AUTO_REFUNDED";
    default: return "UNKNOWN";
  }
}
