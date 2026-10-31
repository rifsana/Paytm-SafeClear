/** @type {import('tailwindcss').Config} */
import containerQueries from "@tailwindcss/container-queries";
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paytm: {
          navy: "#002970",
          navyDark: "#001B4D",
          sky: "#00BAF2",
          skySoft: "#E6F8FE",
          bg: "#F5F7FA",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.04)",
        lift: "0 8px 24px -8px rgba(0, 41, 112, 0.18)",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0, transform: "translateY(4px)" }, to: { opacity: 1, transform: "none" } },
        "scale-up": { from: { opacity: 0, transform: "scale(0.96)" }, to: { opacity: 1, transform: "none" } },
        "scan-laser": { "0%,100%": { top: "4%" }, "50%": { top: "92%" } },
        "sound-wave": { "0%,100%": { transform: "scaleY(0.3)" }, "50%": { transform: "scaleY(1)" } },
        pop: { "0%": { transform: "scale(0.6)", opacity: 0 }, "60%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)", opacity: 1 } },
      },
      animation: {
        "fade-in": "fade-in 220ms ease-out both",
        "scale-up": "scale-up 180ms ease-out both",
        "scan-laser": "scan-laser 1.4s ease-in-out infinite",
        "sound-wave": "sound-wave 0.7s ease-in-out infinite",
        pop: "pop 420ms cubic-bezier(.2,.9,.3,1.2) both",
      },
    },
  },
  plugins: [containerQueries],
};
