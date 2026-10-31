// Client-side simulation state machine for Paytm ClearMoment (Track 2)
// Humanizing the Ambiguous 60 Seconds of UPI Point-of-Sale Payments
// Powered by Sarvam AI (sarvam-105b, bulbul-v4-flash, saaras-v4, sarvam-m)

export const BANKS = ["HDFC", "SBI", "ICICI", "AXIS"];

export const SCENARIOS = {
  SCENARIO_A: {
    id: "SCENARIO_A",
    key: "A",
    label: "Scenario A: The False Alarm",
    subLabel: "Z9 Low Balance → 1-Tap UPI Lite",
    amount: 350,
    bank: "HDFC",
    token: "4821",
    customer: "Rahul S.",
    vpa: "rahul9821@okhdfcbank",
    chip: "₹350 False Alarm",
    color: "emerald",
    errorCode: "Z9",
  },
  SCENARIO_B: {
    id: "SCENARIO_B",
    key: "B",
    label: "Scenario B: Bank Timeout & QR Scan",
    subLabel: "U68 Timeout → Dynamic Status QR",
    amount: 250,
    bank: "SBI",
    token: "4821",
    customer: "Rahul S.",
    vpa: "rahul9821@okhdfcbank",
    chip: "₹250 Status QR",
    color: "amber",
    errorCode: "U68",
  },
  SCENARIO_C: {
    id: "SCENARIO_C",
    key: "C",
    label: "Scenario C: Duplicate Guard & Refund",
    subLabel: "Panic Re-scan → 1-Tap Instant Refund",
    amount: 400,
    bank: "ICICI",
    token: "1043",
    customer: "Sneha R.",
    vpa: "sneha2290@ybl",
    chip: "₹400 1-Tap Refund",
    color: "violet",
    errorCode: "DUPLICATE",
  },
};

export const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export function makeInitialBankHealth() {
  return {
    HDFC: { status: "NORMAL", latency: 180, p95_latency_ms: 180, timeoutPct: 0.4, timeout_rate: 0.4 },
    SBI:  { status: "LATENCY_SPIKE", latency: 1250, p95_latency_ms: 1250, timeoutPct: 4.8, timeout_rate: 4.8 },
    ICICI:{ status: "NORMAL", latency: 150, p95_latency_ms: 150, timeoutPct: 0.3, timeout_rate: 0.3 },
    AXIS: { status: "NORMAL", latency: 260, p95_latency_ms: 260, timeoutPct: 0.8, timeout_rate: 0.8 },
  };
}

// Build the ordered event timeline for ClearMoment demo scenarios (in virtual ms)
export function buildTimeline(scenarioId, amount) {
  if (scenarioId === "SCENARIO_A") {
    return [
      { t: 0,    type: "CUSTOMER_SCAN",      msg: "Customer scanning ₹350 QR at bakery counter" },
      { t: 400,  type: "UPI_INIT",           msg: "UPI collect initiated via HDFC Bank" },
      { t: 1200, type: "PRE_DEBIT_DECLINE",  msg: "Bank returned Z9 (Insufficient Balance) — PRE-DEBIT DECLINE" },
      { t: 1500, type: "SARVAM_EXPLAINER",   msg: "🧠 Sarvam AI: 'Zero Paisa Kata' badge surfaced. No blanket lie." },
      { t: 1800, type: "SOUNDBOX_PLAY",      msg: "🔊 Soundbox (Sarvam bulbul-v4-flash): 'Token 4821 asafal raha. Paisa nahi kata. Saman na dein.'" },
      { t: 2200, type: "UPI_LITE_PROMPT",    msg: "⚡ 1-Tap UPI Lite Checkout surfaced on Customer App (< ₹500)" },
    ];
  }
  if (scenarioId === "SCENARIO_B") {
    return [
      { t: 0,    type: "CUSTOMER_SCAN",      msg: "Customer scanning ₹250 Dynamic QR for sweets" },
      { t: 400,  type: "UPI_INIT",           msg: "UPI payment initiated via SBI switch" },
      { t: 1200, type: "BANK_TIMEOUT_U68",   msg: "⚠️ SBI Switch Latency Spike: U68 In-Flight Timeout" },
      { t: 1500, type: "STATUS_QR_SURFACED", msg: "📲 Customer App auto-flips to Dynamic Status QR [Token #4821]" },
      { t: 1800, type: "SOUNDBOX_PLAY",      msg: "🔊 Soundbox: 'Dhyan dein: Rahul se ₹250 verify ho raha hai. Token 4821. Saman na dein.'" },
      { t: 2400, type: "MERCHANT_STICKY",    msg: "📱 Merchant POS shows Amber Sticky Card with Token #4821" },
      { t: 4000, type: "SWITCH_SETTLED",     msg: "✅ Partner Bank Webhook received — SUCCESS (RRN: 98124810291)" },
      { t: 4500, type: "SOUNDBOX_SUCCESS",   msg: "🔊 Soundbox: 'Paytm par do sau pachaas rupaye prapt hue'" },
      { t: 5000, type: "SETTLED",            msg: "✅ POS Unlocked: SETTLED • Goods released to Rahul S." },
    ];
  }
  if (scenarioId === "SCENARIO_C") {
    return [
      { t: 0,    type: "CUSTOMER_SCAN",      msg: "Payment #1: Customer scanned ₹400 QR at grocery" },
      { t: 500,  type: "UPI_INIT",           msg: "UPI payment #1 in-flight (switch delayed)" },
      { t: 1200, type: "PANIC_RESCAN",       msg: "⚠️ Payment #2: Panicked customer scanned second QR within 45s!" },
      { t: 1800, type: "INTENT_GUARD_ALERT", msg: "🛡️ Sarvam-m Intent Guard: 98% Confidence Duplicate Intent" },
      { t: 2200, type: "SOUNDBOX_PLAY",      msg: "🔊 Soundbox: 'Chetawani: Duplicate payment detect hua!'" },
      { t: 2600, type: "MERCHANT_DUPLICATE", msg: "💜 Merchant POS: Purple Banner 'Sneha R. paid twice within 45s — Issue 1-Tap Refund'" },
    ];
  }
  return [];
}

export function finalStatusFor(scenarioId) {
  switch (scenarioId) {
    case "SCENARIO_A": return "UPI_LITE_READY";
    case "SCENARIO_B": return "SUCCESS";
    case "SCENARIO_C": return "DUPLICATE_GUARD_ACTIVE";
    default: return "UNKNOWN";
  }
}
