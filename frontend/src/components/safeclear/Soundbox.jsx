import { useState, useRef } from "react";
import { Volume2, Play, ShieldAlert, Sparkles } from "lucide-react";

const PHRASES = {
  Hindi: {
    pending: (amt, tok) => `ध्यान दें: राहुल से ${amt} रुपये का पेमेंट वेरीफाई हो रहा है। टोकन ${tok}। सामान न दें।`,
    decline: (amt, tok) => `टोकन ${tok} असफल रहा। पैसा नहीं कटा। सामान न दें।`,
    duplicate: () => `चेतावनी: डुप्लीकेट पेमेंट डिटेक्ट हुआ।`,
    success: (amt) => `पेटीएम पर ${amt} रुपये प्राप्त हुए।`,
  },
  English: {
    pending: (amt, tok) => `Attention: Payment of ${amt} rupees from Rahul is verifying. Token ${tok}. Do not release goods.`,
    decline: (amt, tok) => `Token ${tok} declined. No money deducted. Do not release goods.`,
    duplicate: () => `Warning: Duplicate payment detected.`,
    success: (amt) => `Received ${amt} rupees on Paytm.`,
  },
  Tamil: {
    pending: (amt, tok) => `Kavanikka: ${amt} rubai verify seiyyapadugiradhu. Token ${tok}. Porutkalai kodukka vendaam.`,
    decline: (amt, tok) => `Token ${tok} tholvi. Panam edukkapadavillai. Porutkalai tharavendaam.`,
    duplicate: () => `Echarikkai: Duplicate payment kandeedappattadhu.`,
    success: (amt) => `${amt} rubai Paytm il perappattathu.`,
  },
  Telugu: {
    pending: (amt, tok) => `Gamaninchandi: ${amt} rupayalu verify avthundi. Token ${tok}. Vastuvalu ivvakandi.`,
    decline: (amt, tok) => `Token ${tok} viphalamaindi. Dabbulu taggaledu. Vastuvalu ivvakandi.`,
    duplicate: () => `Hecharika: Duplicate payment gurthinchabadindi.`,
    success: (amt) => `${amt} rupayalu Paytm lo andindi.`,
  },
};

const LANG_LOCALE = {
  Hindi: "hi-IN",
  English: "en-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
};

export const Soundbox = ({ amount, playing, onPlay, phase, token = "4821" }) => {
  const [lang, setLang] = useState("Hindi");
  const audioRef = useRef(null);

  // Determine current announcement category
  const isPending = phase === "BANK_TIMEOUT_U68" || phase === "STATUS_QR_SURFACED" || phase === "MERCHANT_STICKY";
  const isDecline = phase === "PRE_DEBIT_DECLINE" || phase === "SARVAM_EXPLAINER" || phase === "UPI_LITE_PROMPT";
  const isDuplicate = phase === "PANIC_RESCAN" || phase === "INTENT_GUARD_ALERT" || phase === "MERCHANT_DUPLICATE";
  const isSettled = phase === "SETTLED" || phase === "SWITCH_SETTLED" || phase === "SOUNDBOX_SUCCESS";

  const getAudioType = () => {
    if (isDuplicate) return "duplicate";
    if (isPending) return "pending";
    if (isDecline) return "decline";
    if (isSettled) return "success";
    return "success";
  };

  const currentCategory = getAudioType();
  const currentText = PHRASES[lang][currentCategory](amount || 250, token);

  const speak = () => {
    try {
      // First try to play pre-recorded audio file if available
      let fileToPlay = null;
      if (currentCategory === "duplicate") fileToPlay = "/audio/sbx_dupe_warning.wav";
      else if (currentCategory === "pending") fileToPlay = "/audio/sbx_holding_token.wav";
      else if (currentCategory === "decline") fileToPlay = "/audio/sbx_decline_350.wav";
      else if (amount === 350) fileToPlay = "/audio/sbx_success_350.wav";
      else if (amount === 250) fileToPlay = "/audio/sbx_success_250.wav";
      else fileToPlay = "/audio/sbx_success_400.wav";

      if (fileToPlay && lang === "Hindi") {
        const a = new Audio(fileToPlay);
        a.play().catch(() => playSpeechSynthesis());
      } else {
        playSpeechSynthesis();
      }
    } catch {
      playSpeechSynthesis();
    }
    onPlay?.();
  };

  const playSpeechSynthesis = () => {
    try {
      const u = new SpeechSynthesisUtterance(currentText);
      u.lang = LANG_LOCALE[lang];
      u.rate = 0.95;
      u.pitch = 1.1;
      const voices = window.speechSynthesis.getVoices?.() || [];
      const vMatch = voices.find(
        (v) =>
          (v.lang.startsWith(LANG_LOCALE[lang].slice(0, 2)) || v.lang.includes("IN")) &&
          /female|lekha|priya|swara|neerja|google.*hindi|samantha/i.test(v.name)
      ) || voices.find((v) => v.lang.startsWith(LANG_LOCALE[lang].slice(0, 2)));

      if (vMatch) u.voice = vMatch;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      data-testid="paytm-soundbox"
      className="rounded-2xl p-4 bg-gradient-to-b from-[#002970] to-[#001c54] text-white border border-[#001540] relative overflow-hidden shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00BAF2]" />
            <span className="text-[9px] uppercase tracking-widest text-cyan-300 font-mono-ui font-bold">
              Paytm Soundbox 4G · Sarvam bulbul-v4-flash
            </span>
          </div>
          <div className="font-display font-bold text-sm mt-0.5">Fraud-Safe Voice Alerts</div>
        </div>
        <Volume2 className="w-5 h-5 text-cyan-300" />
      </div>

      {/* Visualizer bars */}
      <div className="mt-3 flex items-end justify-center gap-1.5 h-12 bg-black/40 rounded-xl py-2 px-3 border border-white/5">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className={`sound-bar ${playing ? "active" : ""}`}
            style={{
              height: `${25 + ((i * 17) % 65)}%`,
              animationDelay: `${i * 80}ms`,
              background: playing ? "#00BAF2" : "rgba(0,186,242,0.3)",
            }}
          />
        ))}
      </div>

      {/* Regional Language Buttons */}
      <div className="mt-3 flex flex-wrap gap-1">
        {Object.keys(PHRASES).map((l) => (
          <button
            key={l}
            data-testid={`soundbox-lang-${l.toLowerCase()}-btn`}
            onClick={() => setLang(l)}
            className={`min-h-[32px] text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all ${
              lang === l
                ? "bg-[#00BAF2] text-[#002970] shadow"
                : "bg-white/10 text-cyan-100 hover:bg-white/20"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Replay Voice Alert */}
      <button
        data-testid="soundbox-replay-btn"
        onClick={speak}
        className="min-h-[44px] press-shrink mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-[#002970] font-display font-bold text-xs hover:bg-cyan-50 shadow-md"
      >
        <Play className="w-3.5 h-3.5 fill-[#002970]" />
        Replay Sarvam Alert ({lang})
      </button>

      {/* Live spoken phrase echo */}
      <div className="mt-2 text-[10px] text-cyan-200/90 italic text-center font-medium leading-tight">
        "{currentText}"
      </div>

      {/* Fraud protection guarantee label */}
      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-center gap-1 text-[9px] text-cyan-300/80 font-mono-ui">
        <ShieldAlert className="w-3 h-3 text-amber-300" />
        <span>Fraud-Proof: Never announces success on pending state</span>
      </div>
    </div>
  );
};
