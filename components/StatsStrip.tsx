"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";

/* ── Animated counter ────────────────────────────────────── */
function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const ctrl = animate(0, to, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.round(v) + suffix;
      },
    });
    return () => ctrl.stop();
  }, [inView, to, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ── Stats ───────────────────────────────────────────────── */
const STATS = [
  { to: 2,   suffix: "",    label: "modules disponibles" },
  { to: 1,   suffix: "",    label: "projet externe"      },
  { to: 15,  suffix: "",    label: "outils disponibles"  },
  { to: 100, suffix: " %",  label: "traitement local"    },
];

/* ── Scrolling pills ─────────────────────────────────────── */
const PILLS = [
  "Image Resizer", "Fusionner PDF", "QR Code", "Mots de passe",
  "Extraire pages", "Convertir images", "Calculateur dates",
  "Base64", "Inspecteur fichier", "Horloge", "Comparateur texte", "Lorem Ipsum", "Générateur CV",
  "Orbit", "Pulsar",
];

export default function StatsStrip() {
  const doubled = [...PILLS, ...PILLS];

  return (
    <div className="py-8 sm:py-10">
      {/* Divider */}
      <div className="h-px mb-8" style={{ background: "linear-gradient(90deg,transparent,var(--stroke),transparent)" }} />

      {/* Counters */}
      <motion.div
        className="flex justify-center gap-10 sm:gap-16 mb-7"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
      >
        {STATS.map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold tabular-nums"
              style={{ fontFamily: "'Syne',sans-serif", color: "var(--nebula)" }}>
              <Counter to={s.to} suffix={s.suffix} />
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Scrolling pills */}
      <div
        className="overflow-hidden"
        style={{ maskImage: "linear-gradient(90deg,transparent,black 10%,black 90%,transparent)" }}
      >
        <motion.div
          className="flex gap-2 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        >
          {doubled.map((p, i) => (
            <span key={i}
              className="rounded-full px-3 py-1 text-[11px] whitespace-nowrap flex-shrink-0"
              style={{ border: "1px solid var(--stroke)", background: "rgba(108,99,255,.06)", color: "var(--muted)" }}>
              {p}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Divider */}
      <div className="h-px mt-8" style={{ background: "linear-gradient(90deg,transparent,var(--stroke),transparent)" }} />
    </div>
  );
}
