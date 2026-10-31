export const PaytmLogo = ({ className = "text-xl" }) => (
  <span className={`font-extrabold tracking-tight leading-none ${className}`}>
    <span className="text-paytm-navy">pay</span>
    <span className="text-paytm-sky">tm</span>
  </span>
);

export const LiveDot = ({ connected, showLabel = true }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
    <span className="relative flex h-2 w-2">
      {connected && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`} />
    </span>
    {showLabel && <span>{connected ? "Live" : "Connecting…"}</span>}
  </span>
);
