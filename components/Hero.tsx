"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import HeroDemos from "@/components/HeroDemos";

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="pt-32 pb-16 text-center max-w-3xl mx-auto">

      {/* Badge */}
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 8 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs mb-8"
        style={{
          border: "1px solid var(--indigo)",
          background: "rgba(108,99,255,.12)",
          color: "var(--nebula)",
          letterSpacing: ".15em",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        <Sparkles size={12} />
        NEBRYON HUB
      </motion.div>

      {/* Démos animées */}
      <HeroDemos />

      {/* Boutons */}
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 8 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="flex gap-3 justify-center flex-wrap"
      >
        <a
          href="#tools"
          className="rounded-xl px-6 py-3 text-sm font-bold transition hover:opacity-85"
          style={{
            fontFamily: "'Syne', sans-serif",
            background: "linear-gradient(135deg, var(--nebula), var(--indigo))",
            color: "white",
          }}
        >
          Explorer les outils
        </a>
        <a
          href="#projects"
          className="rounded-xl px-6 py-3 text-sm transition hover:opacity-80"
          style={{
            fontFamily: "'Syne', sans-serif",
            border: "1px solid var(--stroke)",
            color: "var(--muted)",
          }}
        >
          Voir les projets
        </a>
      </motion.div>
    </section>
  );
}
