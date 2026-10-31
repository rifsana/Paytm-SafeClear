import { useState } from "react";
import { Volume2, Play } from "lucide-react";

const PHRASES = {
  Hindi:   (amt) => `${amt} rupaye prapt hue, Paytm par`,
  English: (amt) => `Received ${amt} rupees via Paytm`,
  Tamil:   (amt) => `${amt} rubai Paytm il perappattathu`,
  Telugu:  (amt) => `${amt} rupayalu Paytm lo andindi`,
};

const LANG_LOCALE = {
  Hindi: "hi-IN",
  English: "en-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
};

export const Soundbox = ({ amount, playing, onPlay }) => {
  const [lang, setLang] = useState("Hindi");

  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(PHRASES[lang](amount));
      u.lang = LANG_LOCALE[lang];
      u.rate = 0.95;
      u.pitch = 1.15;
      const voices = window.speechSynthesis.getVoices?.() || [];
      const femaleVoice = voices.find((v) =>
        (v.lang.startsWith(LANG_LOCALE[lang].slice(0, 2)) || v.lang.includes("IN") || v.lang.includes("en")) &&
        /female|swara|priya|neerja|kavya|zira|google.*hindi|google.*english|samantha/i.test(v.name)
      ) || voices.find((v) => /female|swara|priya|zira|samantha/i.test(v.name));
      if (femaleVoice) {
        u.voice = femaleVoice;
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {
      /* ignore */
    }
    onPlay?.();
  };

  return (
    <div
      data-testid="paytm-soundbox"
      className="rounded-2xl p-4 bg-gradient-to-b from-[#002970] to-[#001c54] text-white border border-[#001540] relative overflow-hidden"
    >
      <div className="absolute top-3 right-3">
        <span className="status-dot bg-emerald-400 text-emerald-400" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-cyan-300 font-mono-ui">Paytm Soundbox 4G</div>
          <div className="font-display font-bold">Voice Payment Alert</div>
        </div>
        <Volume2 className="w-5 h-5 text-cyan-300" />
      </div>

      <div className="mt-3 flex items-end justify-center gap-1.5 h-14 bg-black/30 rounded-xl py-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`sound-bar ${playing ? "active" : ""}`}
            style={{
              height: `${30 + ((i * 13) % 50)}%`,
              animationDelay: `${i * 90}ms`,
              background: playing ? "#00BAF2" : "rgba(0,186,242,0.35)",
            }}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.keys(PHRASES).map((l) => (
          <button
            key={l}
            data-testid={`soundbox-lang-${l.toLowerCase()}-btn`}
            onClick={() => setLang(l)}
            className={`press-shrink text-[11px] px-2.5 py-1 rounded-full font-semibold ${
              lang === l ? "bg-[#00BAF2] text-[#002970]" : "bg-white/10 text-cyan-100 hover:bg-white/20"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <button
        data-testid="soundbox-replay-btn"
        onClick={speak}
        className="press-shrink mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white text-[#002970] font-display font-semibold text-sm hover:bg-cyan-50"
      >
        <Play className="w-3.5 h-3.5" />
        Replay Voice Alert ({lang})
      </button>

      <div className="mt-2 text-[10px] text-cyan-200/80 italic text-center">
        "{PHRASES[lang](amount)}"
      </div>
    </div>
  );
};
