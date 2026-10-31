import { BadgeCheck, Copy, Fingerprint } from "lucide-react";
import { toast } from "sonner";

const STATUS_META = {
  SUCCESS:        { pill: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  FAILED:         { pill: "bg-rose-100 text-rose-800 border-rose-300" },
  HUMAN_IN_LOOP:  { pill: "bg-amber-100 text-amber-800 border-amber-300" },
  AUTO_REFUNDED:  { pill: "bg-violet-100 text-violet-800 border-violet-300" },
};

export const CertificateCard = ({ cert }) => {
  if (!cert) {
    return (
      <div
        data-testid="certificate-card-empty"
        className="card p-6 text-sm text-slate-500 text-center"
      >
        No settlement certificate yet. Run a scenario to generate an NPCI UDIR audit record.
      </div>
    );
  }

  const meta = STATUS_META[cert.status] || STATUS_META.SUCCESS;
  const copy = (text, label) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div
      className="card p-6 relative overflow-hidden"
      data-testid="certificate-card"
    >
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
          <BadgeCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-700">NPCI VERIFIED</div>
          <div className="font-bold text-emerald-800 text-sm">UDIR Settlement</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Fingerprint className="w-4 h-4 text-[#002970]" />
        <div className="font-extrabold text-[#002970] text-lg sm:text-xl">
          NPCI UDIR Settlement Certificate
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Dispute Ref</div>
          <button
            data-testid="cert-dispute-ref"
            onClick={() => copy(cert.dispute_ref, "Dispute Ref")}
            className="font-mono font-semibold text-[#002970] text-xs hover:text-[#00BAF2] flex items-center gap-1 mt-0.5"
          >
            {cert.dispute_ref} <Copy className="w-3 h-3" />
          </button>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Txn Ref</div>
          <div className="font-mono font-semibold text-[#002970] text-xs mt-0.5">{cert.txn_ref}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Amount</div>
          <div className="font-bold text-[#002970] text-base mt-0.5">
            ₹{cert.amount.toLocaleString("en-IN")}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Status</div>
          <span
            data-testid="cert-status"
            className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border mt-0.5 inline-block ${meta.pill}`}
          >
            {cert.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Merchant</div>
          <div className="font-mono text-xs text-[#002970] mt-0.5">{cert.merchant_id}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Customer VPA</div>
          <div className="font-mono text-xs text-[#002970] mt-0.5">{cert.customer_vpa}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Issued (UTC)</div>
          <div className="font-mono text-xs text-[#002970] mt-0.5">{new Date(cert.issued_at).toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-dashed border-emerald-300">
        <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-mono mb-1">
          SHA-256 HMAC Cryptographic Seal
        </div>
        <button
          data-testid="cert-hmac"
          onClick={() => copy(cert.hmac_sha256, "HMAC")}
          className="w-full text-left font-mono text-[11px] md:text-xs bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-emerald-900 break-all hover:bg-emerald-100 flex items-start gap-2"
        >
          <span className="flex-1">{cert.hmac_sha256}</span>
          <Copy className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        </button>
      </div>
    </div>
  );
};
