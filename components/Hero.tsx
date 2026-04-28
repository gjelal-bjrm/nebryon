"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="pt-16 sm:pt-20">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10 backdrop-blur">
        {/* glow derrière */}
        <div className="pointer-events-none absolute -top-24 right-[-80px] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle_at_center,rgba(73,255,138,.22),rgba(0,0,0,0)_65%)] blur-2xl" />
        <div className="pointer-events-none absolute -top-10 right-10 h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,190,255,.16),rgba(0,0,0,0)_70%)] blur-2xl" />

        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_.8fr]">
          {/* Texte */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-[var(--neon)] shadow-[0_0_18px_rgba(21,221,83,.55)]" />
              Nebryon — projets & expériences
            </p>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              Frontend Engineer.
              <span className="text-white/70"> Je construis des interfaces</span>{" "}
              <span className="text-[var(--neon)] drop-shadow-[0_0_18px_rgba(21,221,83,.25)]">
                rapides
              </span>{" "}
              et propres.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              Nebryon est mon hub de projets : apps, sites, prototypes. Focus UX,
              performance, et design dark + néon.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#projects"
                className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white hover:bg-white/[0.09] transition"
              >
                Voir les projets
              </a>
              <a
                href="#contact"
                className="rounded-xl border border-[rgba(21,221,83,.35)] bg-[rgba(21,221,83,.10)] px-4 py-2 text-sm text-white hover:bg-[rgba(21,221,83,.16)] transition"
              >
                Me contacter
              </a>
            </div>
          </div>

          {/* Logo */}
          <div className="relative mx-auto w-full max-w-[280px] lg:max-w-[320px]">
            {/* halo doux */}
            <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_30%_20%,rgba(73,255,138,.22),rgba(0,0,0,0)_60%)] blur-2xl" />

            <motion.div
              className="relative aspect-square overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02] shadow-[0_0_60px_rgba(73,255,138,.10)]"
              initial={reduce ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
              animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              whileHover={reduce ? undefined : { scale: 1.03 }}
            >
              {/* glow animé subtil */}
              {!reduce && (
                <motion.div
                  className="pointer-events-none absolute -inset-8 opacity-80"
                  animate={{ opacity: [0.55, 0.9, 0.55], scale: [1, 1.06, 1] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background:
                      "radial-gradient(circle at 35% 30%, rgba(73,255,138,.22), rgba(0,0,0,0) 60%)",
                    filter: "blur(18px)",
                  }}
                />
              )}

              {/* icône */}
              <motion.div
                className="relative h-full w-full"
                animate={reduce ? undefined : { rotate: [0, 1.2, 0, -1.2, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/nebryon-mark-transparent-v2.png"
                  alt="Nebryon"
                  fill
                  priority
                  className="object-contain p-6 drop-shadow-[0_0_18px_rgba(0,190,255,.22)]"
                />
              </motion.div>
            </motion.div>

            <p className="mt-3 text-center text-xs text-white/50">
              Nebryon
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}