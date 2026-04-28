"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="pt-32 pb-20 text-center max-w-3xl mx-auto">

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

      {/* Titre */}
      <motion.h1
        initial={reduce ? undefined : { opacity: 0, y: 12 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        Des outils pensés<br />
        pour{" "}
        <span style={{
          background: "linear-gradient(120deg, var(--nebula), var(--halo))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          tout le monde
        </span>
      </motion.h1>

      {/* Sous-titre */}
      <motion.p
        initial={reduce ? undefined : { opacity: 0, y: 8 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-sm sm:text-base leading-relaxed mb-10 mx-auto max-w-lg"
        style={{ color: "var(--muted)", fontFamily: "'Syne', sans-serif" }}
      >
        Un espace centralisé pour simplifier ton quotidien — manipulation de fichiers, calculs, générateurs et bien plus. Tout fonctionne en local, rien n'est envoyé sur un serveur.
      </motion.p>

      {/* Boutons */}
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 8 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
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
