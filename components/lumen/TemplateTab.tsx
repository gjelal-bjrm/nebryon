"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Eye, EyeOff, Code2, PenLine } from "lucide-react";
import { detectVariables } from "@/lib/lumen/templateEngine";
import { buildExportHtml } from "./editor/WysiwygEditor";

const WysiwygEditor = dynamic(() => import("./editor/WysiwygEditor"), { ssr: false });

// ── Default blank template (WYSIWYG body HTML) ────────────────────────────────
export const DEFAULT_TEMPLATE = `<h1>Titre du document</h1>
<p>Commencez à écrire ici. Utilisez la barre d'outils pour mettre en forme votre texte, insérer des tableaux, des images…</p>
<p>Insérez vos variables via le bouton <strong>Variables</strong> dans la barre d'outils (ex. : <em>nom du client</em>, <em>date</em>, etc.)</p>`;

interface Props {
  template:   string;
  onChange:   (v: string) => void;
  onContinue: () => void;
}

export default function TemplateTab({ template, onChange, onContinue }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [htmlMode,    setHtmlMode]    = useState(false);

  const variables   = useMemo(() => detectVariables(template), [template]);
  const previewHtml = useMemo(() => buildExportHtml(template), [template]);

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
            Éditeur de modèle
          </span>
          {variables.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(14,165,233,.12)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,.25)" }}>
              {variables.length} variable{variables.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setHtmlMode((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition hover:opacity-80 cursor-pointer"
            style={{ border: "1px solid var(--stroke)", color: htmlMode ? "#0EA5E9" : "var(--muted)" }}
            title={htmlMode ? "Passer en mode éditeur visuel" : "Passer en mode HTML"}
          >
            {htmlMode ? <PenLine size={11} /> : <Code2 size={11} />}
            {htmlMode ? "Éditeur visuel" : "HTML"}
          </button>
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition hover:opacity-80 cursor-pointer"
            style={{ border: "1px solid var(--stroke)", color: showPreview ? "#0EA5E9" : "var(--muted)" }}
          >
            {showPreview ? <EyeOff size={11} /> : <Eye size={11} />}
            {showPreview ? "Masquer" : "Aperçu PDF"}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className={`flex gap-4 flex-1 min-h-0 ${showPreview ? "flex-row" : ""}`}>

        {/* Editor column */}
        <div className={`flex flex-col min-h-0 ${showPreview ? "w-1/2" : "flex-1"}`}>
          {htmlMode ? (
            /* Raw HTML textarea */
            <textarea
              value={template}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              className="flex-1 resize-none rounded-xl p-4 text-[12px] leading-relaxed outline-none font-mono"
              style={{
                background: "rgba(255,255,255,.03)",
                border:     "1px solid var(--stroke)",
                color:      "var(--text)",
                minHeight:  "400px",
              }}
              placeholder="HTML brut du modèle…"
            />
          ) : (
            /* WYSIWYG editor */
            <WysiwygEditor
              content={template}
              variables={variables}
              onChange={onChange}
            />
          )}
        </div>

        {/* PDF preview */}
        {showPreview && (
          <div className="w-1/2 flex flex-col min-h-0">
            <p className="text-[11px] mb-1.5 flex-shrink-0" style={{ color: "var(--muted)" }}>
              Aperçu rendu — les <code style={{ color: "#0EA5E9" }}>{`{{ variables }}`}</code> sont visibles jusqu'à l'import des données
            </p>
            <iframe
              srcDoc={previewHtml}
              sandbox="allow-same-origin"
              className="flex-1 rounded-xl bg-white"
              style={{ border: "1px solid var(--stroke)", minHeight: "400px" }}
              title="Aperçu PDF"
            />
          </div>
        )}
      </div>

      {/* Variables detected */}
      {variables.length > 0 && !showPreview && (
        <div className="flex-shrink-0 rounded-xl p-3"
          style={{ background: "rgba(14,165,233,.06)", border: "1px solid rgba(14,165,233,.18)" }}>
          <p className="text-[11px] mb-1.5 font-semibold" style={{ color: "#0EA5E9" }}>Variables détectées</p>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <code key={v}
                className="rounded-full px-2.5 py-0.5 text-[11px]"
                style={{ background: "rgba(14,165,233,.14)", color: "#BAE6FD", border: "1px solid rgba(14,165,233,.25)" }}>
                {`{{ ${v} }}`}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* Continue */}
      <div className="flex justify-end flex-shrink-0">
        <button
          onClick={onContinue}
          disabled={template.trim().length === 0}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#0EA5E9", color: "#fff" }}
        >
          Importer les données →
        </button>
      </div>
    </div>
  );
}
