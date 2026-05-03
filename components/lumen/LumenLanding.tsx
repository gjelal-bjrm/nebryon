"use client";

import { FileText, Layers, BookMarked, ChevronRight } from "lucide-react";

interface Props {
  onStart:   () => void;   // → gallery
  onBlank:   () => void;   // → editor with blank template
}

const FEATURES = [
  {
    icon:  FileText,
    color: "#0EA5E9",
    bg:    "rgba(14,165,233,.10)",
    title: "Vos propres documents",
    desc:  "Concevez n'importe quel document — facture, lettre, certificat, rapport — selon vos besoins exacts, sans contrainte de format.",
  },
  {
    icon:  Layers,
    color: "#6C63FF",
    bg:    "rgba(108,99,255,.10)",
    title: "Impression en masse",
    desc:  "Chargez votre liste de destinataires ou de données et générez des dizaines ou des centaines de PDFs en quelques secondes.",
  },
  {
    icon:  BookMarked,
    color: "#48BB78",
    bg:    "rgba(72,187,120,.10)",
    title: "Modèles réutilisables",
    desc:  "Choisissez parmi nos modèles prêts à l'emploi ou sauvegardez les vôtres pour les réutiliser à chaque campagne.",
  },
];

export default function LumenLanding({ onStart, onBlank }: Props) {
  return (
    <div className="flex flex-col items-center w-full py-10 sm:py-16 px-4">

      {/* ── Hero ── */}
      <div className="text-center max-w-2xl mb-14">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold"
          style={{ background: "rgba(14,165,233,.10)", border: "1px solid rgba(14,165,233,.25)", color: "#0EA5E9" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Générateur de documents PDF
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5"
          style={{ color: "var(--text)" }}>
          Vos documents,{" "}
          <span style={{
            background: "linear-gradient(90deg, #0EA5E9, #6C63FF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
            backgroundClip:       "text",
          }}>
            en un clic.
          </span>
        </h1>

        <p className="text-base sm:text-lg leading-relaxed mb-8"
          style={{ color: "var(--muted)" }}>
          Choisissez un modèle, renseignez vos données et Lumen génère autant de PDFs
          que vous avez de lignes — sans limite, sans abonnement.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90 cursor-pointer"
            style={{ background: "#0EA5E9", color: "#fff", boxShadow: "0 0 24px rgba(14,165,233,.35)" }}
          >
            Choisir un modèle <ChevronRight size={15} />
          </button>
          <button
            onClick={onBlank}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition hover:opacity-80 cursor-pointer"
            style={{ border: "1px solid var(--stroke)", color: "var(--text)" }}
          >
            Partir de zéro
          </button>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl mb-14">
        {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className="rounded-2xl p-5"
            style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: bg }}>
              <Icon size={18} style={{ color }} />
            </div>
            <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--text)" }}>{title}</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <div className="w-full max-w-3xl">
        <p className="text-center text-xs font-semibold tracking-widest uppercase mb-6"
          style={{ color: "var(--muted)" }}>
          Comment ça marche
        </p>
        <div className="flex flex-col sm:flex-row items-start gap-0">
          {[
            { n: "1", title: "Choisissez",  desc: "Sélectionnez un modèle ou créez le vôtre en HTML." },
            { n: "2", title: "Importez",    desc: "Chargez votre fichier Excel, CSV, JSON ou XML." },
            { n: "3", title: "Téléchargez", desc: "Vos PDFs sont prêts dans un ZIP en quelques secondes." },
          ].map(({ n, title, desc }, i) => (
            <div key={n} className="flex-1 flex items-start gap-3 sm:flex-col sm:items-center sm:text-center relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: "rgba(14,165,233,.15)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,.3)" }}>
                {n}
              </div>
              <div className="sm:mt-3">
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{title}</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden sm:block absolute right-0 top-3.5 w-1/2 h-px"
                  style={{ background: "var(--stroke)", transform: "translateX(50%)" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
