"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function StarField({ isLight }: { isLight: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    for (let i = 0; i < (isLight ? 40 : 80); i++) {
      const s = document.createElement("span");
      const size = Math.random() * 2 + 1;
      Object.assign(s.style, {
        position: "absolute",
        borderRadius: "50%",
        background: isLight ? "#4F46E5" : "white",
        width: `${size}px`, height: `${size}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        opacity: isLight ? "0.12" : "0.1",
        animation: `nb-twinkle ${2 + Math.random() * 4}s infinite ${Math.random() * 3}s`,
      });
      el.appendChild(s);
    }
  }, [isLight]);
  return <div ref={ref} className="absolute inset-0" />;
}

export default function BackgroundBlobs() {
  const reduce  = useReducedMotion();
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const check = () => setIsLight(document.documentElement.getAttribute("data-theme") === "light");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes nb-twinkle { 0%,100%{opacity:.05} 50%{opacity:.4} }
        @keyframes nb-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes nb-spin-rev  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        style={{ background: "var(--bg)", transition: "background 0.3s ease" }}>

        <StarField isLight={isLight} />

        {/* ── DARK MODE ── */}
        {!isLight && <>
          <div className="absolute inset-0" style={{ mixBlendMode: "screen", opacity: 0.9 }}>
            <div className="absolute rounded-full blur-[80px]"
              style={{ width: 520, height: 520, top: -80, left: "-8%", background: "radial-gradient(circle at 30% 30%, rgba(45,31,191,.75), transparent 62%)" }} />
            <div className="absolute rounded-full blur-[80px]"
              style={{ width: 520, height: 520, top: -100, left: "55%", background: "radial-gradient(circle at 30% 30%, rgba(108,99,255,.70), transparent 62%)" }} />
            <div className="absolute rounded-full blur-[80px]"
              style={{ width: 480, height: 480, top: "22%", left: "62%", background: "radial-gradient(circle at 30% 30%, rgba(167,139,250,.45), transparent 62%)" }} />
            <div className="absolute rounded-full blur-[70px]"
              style={{ width: 480, height: 480, top: "28%", left: "-6%", background: "radial-gradient(circle at 30% 30%, rgba(45,31,191,.40), transparent 62%)" }} />
            <div className="absolute rounded-full blur-[90px]"
              style={{ width: 680, height: 680, top: "2%", left: "18%", opacity: 0.55, background: "radial-gradient(circle at 35% 35%, rgba(108,99,255,.40), transparent 65%)" }} />
          </div>
          {!reduce && (
            <div className="absolute inset-0" style={{ mixBlendMode: "screen", opacity: 0.6 }}>
              <motion.div className="absolute rounded-full blur-[80px]"
                style={{ width: 520, height: 520, top: -80, left: "-8%", background: "radial-gradient(circle at 30% 30%, rgba(108,99,255,.40), transparent 65%)" }}
                animate={{ x: [0,50,-30,70,0], y: [0,70,110,-15,0], scale: [1,1.07,1.03,1.1,1] }}
                transition={{ duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: -1.2 }} />
              <motion.div className="absolute rounded-full blur-[90px]"
                style={{ width: 560, height: 560, top: "10%", left: "55%", background: "radial-gradient(circle at 30% 30%, rgba(167,139,250,.25), transparent 68%)" }}
                animate={{ x: [0,-40,60,-20,0], y: [0,90,30,-40,0], scale: [1,1.05,1.08,1.02,1] }}
                transition={{ duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: -3.4 }} />
            </div>
          )}
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(900px 420px at 50% 40%, transparent 35%, rgba(7,9,26,.5) 100%)" }} />
        </>}

        {/* ── LIGHT MODE — Ardoise Céleste enrichi ── */}
        {isLight && <>

          {/* Grille subtile */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(79,70,229,.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(79,70,229,.06) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }} />

          {/* Points aux intersections */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, rgba(79,70,229,.18) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />

          {/* Halos colorés forts */}
          <div className="absolute rounded-full blur-[120px]"
            style={{ width: 700, height: 700, top: -200, left: "-15%", background: "radial-gradient(circle, rgba(79,70,229,.22), transparent 65%)" }} />
          <div className="absolute rounded-full blur-[120px]"
            style={{ width: 700, height: 700, top: -200, left: "55%", background: "radial-gradient(circle, rgba(129,140,248,.28), transparent 65%)" }} />
          <div className="absolute rounded-full blur-[100px]"
            style={{ width: 500, height: 500, top: "30%", left: "70%", background: "radial-gradient(circle, rgba(79,70,229,.14), transparent 65%)" }} />
          <div className="absolute rounded-full blur-[100px]"
            style={{ width: 400, height: 400, top: "40%", left: "-5%", background: "radial-gradient(circle, rgba(129,140,248,.14), transparent 65%)" }} />

          {/* Anneau décoratif grand — haut droite */}
          <div className="absolute" style={{
            width: 420, height: 420,
            top: -120, right: -80,
            borderRadius: "50%",
            border: "1px solid rgba(79,70,229,.12)",
          }} />
          <div className="absolute" style={{
            width: 320, height: 320,
            top: -70, right: -30,
            borderRadius: "50%",
            border: "1px solid rgba(129,140,248,.15)",
          }} />
          <div className="absolute" style={{
            width: 200, height: 200,
            top: -10, right: 60,
            borderRadius: "50%",
            border: "1px solid rgba(79,70,229,.20)",
          }} />

          {/* Anneau décoratif — bas gauche */}
          <div className="absolute" style={{
            width: 300, height: 300,
            bottom: "10%", left: -60,
            borderRadius: "50%",
            border: "1px solid rgba(79,70,229,.10)",
          }} />
          <div className="absolute" style={{
            width: 180, height: 180,
            bottom: "12%", left: 0,
            borderRadius: "50%",
            border: "1px solid rgba(129,140,248,.14)",
          }} />

          {/* Blob animé léger */}
          {!reduce && (
            <motion.div className="absolute rounded-full blur-[100px]"
              style={{ width: 500, height: 500, top: -80, left: "-5%", background: "radial-gradient(circle, rgba(79,70,229,.15), transparent 65%)" }}
              animate={{ x: [0,40,-20,60,0], y: [0,60,90,-10,0] }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }} />
          )}

          {/* Vignette légère pour éviter que les bords soient trop crus */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, transparent 50%, rgba(228,232,245,.35) 100%)",
          }} />
        </>}

      </div>
    </>
  );
}
