import { useState } from "react";
import { Volume2, Play, ShieldCheck } from "lucide-react";

const PHRASES = {
  Hindi: {
    pending: (amt, tok, who) => `ध्यान दें: ${who} से ${amt} रुपये का पेमेंट वेरीफाई हो रहा है। टोकन ${tok}। सामान न दें।`,
    decline: (amt, tok) => `टोकन ${tok} असफल रहा। पैसा नहीं कटा। सामान न दें।`,
    duplicate: () => `चेतावनी: डुप्लीकेट पेमेंट डिटेक्ट हुआ।`,
    refund: (amt) => `डुप्लीकेट पेमेंट के ${amt} रुपये वापस भेज दिए गए।`,
    success: (amt) => `पेटीएम पर ${amt} रुपये प्राप्त हुए।`,
  },
  English: {
    pending: (amt, tok, who) => `Attention: Payment of ${amt} rupees from ${who} is verifying. Token ${tok}. Do not release goods.`,
    decline: (amt, tok) => `Token ${tok} declined. No money deducted. Do not release goods.`,
    duplicate: () => `Warning: Duplicate payment detected.`,
    refund: (amt) => `Duplicate payment of ${amt} rupees refunded.`,
    success: (amt) => `Received ${amt} rupees on Paytm.`,
  },
  Tamil: {
    pending: (amt, tok) => `Kavanikka: ${amt} rubai verify seiyyapadugiradhu. Token ${tok}. Porutkalai kodukka vendaam.`,
    decline: (amt, tok) => `Token ${tok} tholvi. Panam edukkapadavillai. Porutkalai tharavendaam.`,
    duplicate: () => `Echarikkai: Duplicate payment kandeedappattadhu.`,
    refund: (amt) => `${amt} rubai thirumbi anuppappattadhu.`,
    success: (amt) => `${amt} rubai Paytm il perappattathu.`,
  },
  Telugu: {
    pending: (amt, tok) => `Gamaninchandi: ${amt} rupayalu verify avthundi. Token ${tok}. Vastuvalu ivvakandi.`,
    decline: (amt, tok) => `Token ${tok} viphalamaindi. Dabbulu taggaledu. Vastuvalu ivvakandi.`,
    duplicate: () => `Hecharika: Duplicate payment gurthinchabadindi.`,
    refund: (amt) => `${amt} rupayalu tirigi pampabaddayi.`,
    success: (amt) => `${amt} rupayalu Paytm lo andindi.`,
  },
};

const LANG_LOCALE = {
  Hindi: "hi-IN",
  English: "en-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
};

// Fraud-proof: nothing is announced while a payment is idle or still in flight.
const CATEGORY_BY_STATUS = {
  TIMEOUT_PENDING: "pending",
  DECLINED: "decline",
  DUPLICATE_ALERT: "duplicate",
  REFUNDED: "refund",
  SETTLED: "success",
};

const BARS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const Soundbox = ({ amount, playing, onPlay, status, token = "4821", customer = "Rahul" }) => {
  const [lang, setLang] = useState("Hindi");

  const currentCategory = CATEGORY_BY_STATUS[status] || null;
  const who = customer.split(" ")[0];
  const currentText = currentCategory ? PHRASES[lang][currentCategory](amount || 250, token, who) : null;

  const speak = () => {
    if (!currentCategory) return;
    // Pre-recorded clips are Hindi; other languages use speech synthesis.
    let file = null;
    if (lang === "Hindi") {
      if (currentCategory === "duplicate") file = "/audio/sbx_dupe_warning.wav";
      else if (currentCategory === "refund") file = "/audio/sbx_dupe_refunded_400.wav";
      else if (currentCategory === "pending") file = "/audio/sbx_holding_token.wav";
      else if (currentCategory === "decline") file = "/audio/sbx_decline_350.wav";
      else if (amount === 350) file = "/audio/sbx_success_350.wav";
      else if (amount === 250) file = "/audio/sbx_success_250.wav";
      else file = "/audio/sbx_success_400.wav";
    }
    onPlay?.({ file, text: currentText, lang: LANG_LOCALE[lang] });
  };

  return (
    <section data-testid="paytm-soundbox" className="flex flex-col rounded-2xl bg-paytm-navy p-4 text-white shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold">Soundbox</div>
          <div className="text-xs text-white/60">Voice alerts · 4 languages</div>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Volume2 className={`h-4 w-4 ${playing ? "text-paytm-sky" : "text-white/70"}`} />
        </span>
      </div>

      {/* Visualizer */}
      <div className="mt-4 flex h-12 items-center justify-center gap-1 rounded-xl bg-black/20 px-3" aria-hidden="true">
        {BARS.map((i) => (
          <span
            key={i}
            className={`w-1 rounded-full ${playing ? "animate-sound-wave bg-paytm-sky" : "bg-white/20"}`}
            style={{ height: `${30 + ((i * 23) % 60)}%`, animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>

      <p className="mt-3 min-h-[2.5rem] text-[13px] leading-snug text-white/80">
        {currentText ? `“${currentText}”` : "Listening… nothing is announced until a payment is confirmed."}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.keys(PHRASES).map((l) => (
          <button
            key={l}
            type="button"
            data-testid={`soundbox-lang-${l.toLowerCase()}-btn`}
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              lang === l ? "bg-white text-paytm-navy" : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <button
        type="button"
        data-testid="soundbox-replay-btn"
        onClick={speak}
        disabled={!currentCategory}
        className="btn mt-4 w-full bg-paytm-sky text-white hover:bg-[#00A6D9] disabled:bg-white/10 disabled:opacity-100 disabled:text-white/40"
      >
        <Play className="h-4 w-4 fill-current" />
        Replay alert
      </button>

      <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] text-white/50">
        <ShieldCheck className="h-3.5 w-3.5" />
        Never announces success on a pending payment
      </div>
    </section>
  );
};
