import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Nebryon Lisan — Aperçu",
  description: "Application mobile d'apprentissage des langues : fiches, QCM, traduction écrite et remise en ordre.",
};

const TAGS = ["React Native", "Expo", "TypeScript", "SQLite"];

export default function LisanPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">

      <Link
        href="/#projects"
        className="inline-flex items-center gap-2 mb-10 text-sm transition hover:opacity-80"
        style={{ color: "var(--muted)" }}
      >
        <ArrowLeft size={14} /> Projets
      </Link>

      {/* Header */}
      <div className="mb-12">
        <h1
          className="text-3xl font-bold sm:text-4xl mb-3"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Nebryon Lisan
        </h1>
        <p className="text-base max-w-xl mb-5" style={{ color: "var(--muted)" }}>
          Application mobile d'apprentissage des langues — fiches recto/verso, QCM,
          traduction écrite, remise en ordre et mode adaptatif IA.
        </p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-1 text-[11px]"
              style={{ border: "1px solid var(--stroke)", background: "rgba(108,99,255,.08)", color: "var(--halo)" }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Mockup principal */}
      <section className="mb-12">
        <div className="flex items-end justify-between gap-4 mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Interface de l'application
          </h2>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            4 écrans principaux
          </span>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--stroke)" }}
        >
          <div className="overflow-x-auto">
            <iframe
              src="/mockups/lisan-main.html"
              className="block"
              style={{ width: "100%", minWidth: "960px", height: "570px", border: "none" }}
              title="Nebryon Lisan — écrans principaux"
            />
          </div>
        </div>
      </section>

      {/* Mockup thèmes */}
      <section>
        <div className="flex items-end justify-between gap-4 mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Thèmes — Mode sombre & clair
          </h2>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Bouton flottant persistant
          </span>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--stroke)" }}
        >
          <div className="overflow-x-auto">
            <iframe
              src="/mockups/lisan-theme.html"
              className="block"
              style={{ width: "100%", minWidth: "700px", height: "540px", border: "none" }}
              title="Nebryon Lisan — thèmes"
            />
          </div>
        </div>
      </section>

    </main>
  );
}
