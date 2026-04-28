"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

export default function SpotlightCursor() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduce) return;

    // Désactive sur appareils tactiles (mobile/tablette)
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse) return;

    let tx = 0.5, ty = 0.5;
    let cx = 0.5, cy = 0.5;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
      tx = Math.min(1, Math.max(0, tx));
      ty = Math.min(1, Math.max(0, ty));
    };

    const tick = () => {
      const el = ref.current;
      if (!el) return;
      const ease = 0.14; // plus bas = plus “lourd”
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      el.style.setProperty("--mx", `${(cx * 100).toFixed(2)}%`);
      el.style.setProperty("--my", `${(cy * 100).toFixed(2)}%`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        // fallback au centre
        // @ts-expect-error CSS vars
        "--mx": "50%",
        "--my": "50%",
      }}
    >
      <div
        className={[
          "absolute inset-0 opacity-90 [mix-blend-mode:screen]",
          // deux halos comme sur ton exemple
          "bg-[radial-gradient(520px_520px_at_var(--mx)_var(--my),rgba(73,255,138,.22),rgba(0,180,255,.10)_35%,rgba(0,0,0,0)_70%),radial-gradient(900px_900px_at_var(--mx)_var(--my),rgba(21,221,83,.07),rgba(0,0,0,0)_65%)]",
        ].join(" ")}
      />
    </div>
  );
}
