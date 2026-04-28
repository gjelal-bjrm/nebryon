"use client";

import { projects } from "@/lib/projects";
import { motion, useReducedMotion } from "framer-motion";

export default function Projects() {
  const reduce = useReducedMotion();

  return (
    <section id="projects" className="py-12 sm:py-16">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold sm:text-2xl">Projets</h2>
        <p className="text-sm text-white/60">Une sélection — cliquable</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <motion.a
            key={p.title}
            href={p.href}
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition hover:bg-white/[0.06]"
            initial={reduce ? undefined : { opacity: 0, y: 10 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium tracking-tight">{p.title}</h3>
              <span className="text-white/40 group-hover:text-[var(--neon)] transition">
                ↗
              </span>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-white/65">
              {p.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70"
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
