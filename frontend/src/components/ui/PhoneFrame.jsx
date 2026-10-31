import { useEffect, useState } from "react";

// Real-device logical size (iPhone 14); the whole frame is scaled to fit the viewport height.
const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 12;
const FRAME_W = SCREEN_W + BEZEL * 2;
const FRAME_H = SCREEN_H + BEZEL * 2;

const fitScale = (reserved) => {
  if (typeof window === "undefined") return 0.8;
  return Math.min(1, Math.max(0.55, (window.innerHeight - reserved) / FRAME_H));
};

export const PhoneFrame = ({ children, reserved = 140, caption }) => {
  const [scale, setScale] = useState(() => fitScale(reserved));

  useEffect(() => {
    const onResize = () => setScale(fitScale(reserved));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [reserved]);

  return (
    <div>
      <div className="relative mx-auto" style={{ width: FRAME_W * scale, height: FRAME_H * scale }}>
        <div
          className="absolute left-0 top-0 origin-top-left rounded-[52px] bg-slate-900 shadow-lift"
          style={{ width: FRAME_W, height: FRAME_H, padding: BEZEL, transform: `scale(${scale})` }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[40px] bg-paytm-bg">{children}</div>
        </div>
      </div>
      {caption && <p className="mt-3 text-center text-xs text-slate-500">{caption}</p>}
    </div>
  );
};
