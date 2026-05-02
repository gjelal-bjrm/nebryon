"use client";

import { projects } from "@/lib/projects";
import { motion, useReducedMotion } from "framer-motion";
import { Smartphone } from "lucide-react";

export default function Projects() {
  const reduce = useReducedMotion();

  return (
    <section id="projects" className="py-12 sm:py-16">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold sm:text-2xl">Projets</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>En cours de développement</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => {
          const isMobile = p.platform === "mobile";

          return (
            <motion.a
              key={p.title}
              href={p.href}
              {...(p.type !== "showcase" ? { target: "_blank", rel: "noreferrer" } : {})}
              className="group relative rounded-2xl p-5 backdrop-blur transition"
              style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.border    = "1px solid var(--nebula)";
                el.style.background = "rgba(108,99,255,.06)";
                el.style.boxShadow  = "0 0 20px rgba(108,99,255,.12)";
                el.style.transform  = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.border     = "1px solid var(--stroke)";
                el.style.background = "rgba(255,255,255,.02)";
                el.style.boxShadow  = "none";
                el.style.transform  = "translateY(0)";
              }}
              initial={reduce ? undefined : { opacity: 0, y: 10 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold tracking-tight">{p.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  {isMobile && (
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: "color-mix(in srgb, var(--gold) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--gold) 35%, transparent)", color: "var(--gold)" }}
                      title="Application mobile — non accessible directement depuis le Hub"
                    >
                      <Smartphone size={10} />
                      App mobile
                    </span>
                  )}
                  <span className="transition" style={{ color: "var(--muted)" }}>
                    {p.type === "showcase" ? "→" : "↗"}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {p.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-1 text-[11px]"
                    style={{ border: "1px solid var(--stroke)", background: "rgba(108,99,255,.08)", color: "var(--halo)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
