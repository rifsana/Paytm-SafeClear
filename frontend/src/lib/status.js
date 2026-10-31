// Shared presentation metadata for backend session statuses.
// Backend emits: IDLE, IN_FLIGHT, P1_IN_FLIGHT, DECLINED, TIMEOUT_PENDING, DUPLICATE_ALERT, REFUNDED, SETTLED

export const TONES = {
  slate:   { pill: "bg-slate-100 text-slate-600",     soft: "bg-slate-50 border-slate-200",     icon: "bg-slate-100 text-slate-500",     text: "text-slate-700" },
  sky:     { pill: "bg-paytm-skySoft text-[#0077A8]", soft: "bg-paytm-skySoft/60 border-sky-200", icon: "bg-paytm-skySoft text-paytm-sky", text: "text-[#0077A8]" },
  rose:    { pill: "bg-rose-50 text-rose-700",         soft: "bg-rose-50/70 border-rose-200",     icon: "bg-rose-100 text-rose-600",       text: "text-rose-700" },
  amber:   { pill: "bg-amber-50 text-amber-700",       soft: "bg-amber-50/70 border-amber-200",   icon: "bg-amber-100 text-amber-600",     text: "text-amber-700" },
  violet:  { pill: "bg-violet-50 text-violet-700",     soft: "bg-violet-50/70 border-violet-200", icon: "bg-violet-100 text-violet-600",   text: "text-violet-700" },
  emerald: { pill: "bg-emerald-50 text-emerald-700",   soft: "bg-emerald-50/70 border-emerald-200", icon: "bg-emerald-100 text-emerald-600", text: "text-emerald-700" },
};

export const STATUS_META = {
  IDLE:            { label: "Ready",       tone: "slate" },
  IN_FLIGHT:       { label: "Processing",  tone: "sky" },
  P1_IN_FLIGHT:    { label: "Processing",  tone: "sky" },
  DECLINED:        { label: "Declined",    tone: "rose" },
  TIMEOUT_PENDING: { label: "Verifying",   tone: "amber" },
  DUPLICATE_ALERT: { label: "Duplicate",   tone: "violet" },
  REFUNDED:        { label: "Refunded",    tone: "emerald" },
  SETTLED:         { label: "Received",    tone: "emerald" },
};

export const statusMeta = (status) => {
  const m = STATUS_META[status] || STATUS_META.IDLE;
  return { ...m, classes: TONES[m.tone] };
};

export const SCENARIO_OPTIONS = [
  { id: "SCENARIO_A", short: "A", label: "False alarm", amount: 350 },
  { id: "SCENARIO_B", short: "B", label: "Timeout", amount: 250 },
  { id: "SCENARIO_C", short: "C", label: "Duplicate", amount: 400 },
];

export const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
