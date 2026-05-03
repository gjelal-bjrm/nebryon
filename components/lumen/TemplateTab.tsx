"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { detectVariables } from "@/lib/lumen/templateEngine";

export const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #ffffff;
      color: #1a1a2e;
      padding: 40px;
    }
    .doc { max-width: 680px; margin: 0 auto; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 3px solid #6C63FF;
      margin-bottom: 32px;
    }
    .header h1 { font-size: 24px; font-weight: 800; color: #6C63FF; margin-bottom: 4px; }
    .header .ref { font-size: 12px; color: #888; }
    .header-right { text-align: right; font-size: 13px; color: #666; line-height: 1.6; }

    .recipient { margin-bottom: 28px; }
    .recipient .label {
      font-size: 11px; text-transform: uppercase;
      letter-spacing: 1px; color: #888; margin-bottom: 6px;
    }
    .recipient p { font-size: 14px; line-height: 1.7; color: #333; }

    .body { font-size: 14px; line-height: 1.9; color: #333; margin-bottom: 32px; }
    .body p { margin-bottom: 16px; }

    .highlight-box {
      background: #f4f3ff;
      border-left: 4px solid #6C63FF;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
      font-size: 15px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="doc">

    <div class="header">
      <div>
        <h1>{{ titre }}</h1>
        <div class="ref">Réf : {{ reference }} &nbsp;|&nbsp; {{ date }}</div>
      </div>
      <div class="header-right">
        <strong>{{ entreprise }}</strong><br>
        {{ contact }}
      </div>
    </div>

    <div class="recipient">
      <div class="label">Destinataire</div>
      <p>
        <strong>{{ nom_client }}</strong><br>
        {{ adresse }}<br>
        {{ code_postal }} {{ ville }}
      </p>
    </div>

    <div class="body">
      <p>Madame, Monsieur <strong>{{ nom_client }}</strong>,</p>
      <p>{{ contenu }}</p>
      <div class="highlight-box">
        <strong>Montant total :</strong> {{ montant }} €
      </div>
      <p>
        Pour toute question, contactez-nous à <strong>{{ contact }}</strong>.
      </p>
      <p>Cordialement,<br><strong>{{ signataire }}</strong></p>
    </div>

    <div class="footer">
      <span>{{ entreprise }}</span>
      <span>{{ contact }}</span>
    </div>

  </div>
</body>
</html>`;

interface Props {
  template:    string;
  onChange:    (v: string) => void;
  onContinue:  () => void;
}

export default function TemplateTab({ template, onChange, onContinue }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const variables = detectVariables(template);

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
            Modèle HTML
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: "rgba(14,165,233,.12)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,.25)" }}>
            {variables.length} variable{variables.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (confirm("Restaurer le modèle par défaut ?")) onChange(DEFAULT_TEMPLATE); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition hover:opacity-80 cursor-pointer"
            style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}
          >
            <RotateCcw size={11} /> Défaut
          </button>
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition hover:opacity-80 cursor-pointer"
            style={{ border: "1px solid var(--stroke)", color: showPreview ? "#0EA5E9" : "var(--muted)" }}
          >
            {showPreview ? <EyeOff size={11} /> : <Eye size={11} />}
            {showPreview ? "Masquer" : "Prévisualiser"}
          </button>
        </div>
      </div>

      {/* Split: editor + preview */}
      <div className={`flex gap-4 flex-1 min-h-0 ${showPreview ? "flex-col sm:flex-row" : ""}`}>

        {/* Editor */}
        <div className={`flex flex-col min-h-0 ${showPreview ? "sm:w-1/2 flex-1" : "flex-1"}`}>
          <textarea
            value={template}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className="flex-1 resize-none rounded-xl p-4 text-[12px] leading-relaxed outline-none font-mono"
            style={{
              background:  "rgba(255,255,255,.03)",
              border:      "1px solid var(--stroke)",
              color:       "var(--text)",
              minHeight:   "320px",
            }}
            placeholder="Collez votre HTML ici…"
          />
        </div>

        {/* Preview iframe */}
        {showPreview && (
          <div className="sm:w-1/2 flex flex-col min-h-0 flex-1">
            <p className="text-[11px] mb-1.5 flex-shrink-0" style={{ color: "var(--muted)" }}>
              Aperçu — les <code style={{ color: "#0EA5E9" }}>{`{{ variables }}`}</code> restent visibles jusqu'à l'import des données
            </p>
            <iframe
              srcDoc={template}
              sandbox="allow-same-origin"
              className="flex-1 rounded-xl"
              style={{ border: "1px solid var(--stroke)", background: "#fff", minHeight: "320px" }}
              title="Prévisualisation du modèle"
            />
          </div>
        )}
      </div>

      {/* Variables detected */}
      {variables.length > 0 && (
        <div className="flex-shrink-0 rounded-xl p-3"
          style={{ background: "rgba(14,165,233,.06)", border: "1px solid rgba(14,165,233,.18)" }}>
          <p className="text-[11px] mb-2 font-semibold" style={{ color: "#0EA5E9" }}>
            Variables détectées
          </p>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <code key={v}
                className="rounded-full px-2.5 py-0.5 text-[11px]"
                style={{ background: "rgba(14,165,233,.14)", color: "#BAE6FD", border: "1px solid rgba(14,165,233,.25)" }}
              >
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
