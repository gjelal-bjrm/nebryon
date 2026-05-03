"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { LumenPreset } from "@/lib/lumen/presets";

interface Props {
  preset:          LumenPreset;
  importedColumns: string[];
  onConfirm: (mapping: Record<string, string>, fixedValues: Record<string, string>) => void;
  onCancel:  () => void;
}

export default function FieldMappingModal({ preset, importedColumns, onConfirm, onCancel }: Props) {
  const [mapping,     setMapping]     = useState<Record<string, string>>({});
  const [fixedValues, setFixedValues] = useState<Record<string, string>>({});
  const [showMatched, setShowMatched] = useState(false);

  // Auto-match on mount (case-insensitive)
  useEffect(() => {
    const auto: Record<string, string> = {};
    for (const field of preset.fields) {
      const match = importedColumns.find((c) => c.toLowerCase() === field.toLowerCase());
      if (match) auto[field] = match;
    }
    setMapping(auto);
  }, [preset, importedColumns]);

  const autoMatched = Object.entries(mapping);
  const unmapped    = preset.fields.filter((f) => !mapping[f]);
  const canConfirm  = unmapped.every((f) => fixedValues[f]?.trim());

  const setColMapping = (field: string, col: string) => {
    if (col) {
      setMapping((prev) => ({ ...prev, [field]: col }));
      setFixedValues((prev) => { const n = { ...prev }; delete n[field]; return n; });
    } else {
      setMapping((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.75)" }}
      onClick={onCancel}
    >
      <div
        className="flex flex-col rounded-2xl w-full max-w-xl max-h-[88vh]"
        style={{ background: "var(--surface)", border: "1px solid var(--stroke)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start gap-3 p-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--stroke)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(251,191,36,.15)" }}>
            <AlertTriangle size={15} style={{ color: "#fbbf24" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              Vérification des champs — <span style={{ color: "#0EA5E9" }}>{preset.name}</span>
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--muted)" }}>
              {unmapped.length > 0
                ? `${unmapped.length} champ${unmapped.length > 1 ? "s" : ""} manquant${unmapped.length > 1 ? "s" : ""}. Faites correspondre vos colonnes ou entrez une valeur fixe pour tous les documents.`
                : "Toutes les correspondances ont été trouvées automatiquement. Vérifiez puis continuez."}
            </p>
          </div>
          <button onClick={onCancel}
            className="p-1 rounded transition hover:opacity-70 cursor-pointer flex-shrink-0"
            style={{ color: "var(--muted)" }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-auto p-4 space-y-3">

          {/* Auto-matched summary (collapsible) */}
          {autoMatched.length > 0 && (
            <div className="rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(72,187,120,.25)" }}>
              <button
                onClick={() => setShowMatched((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-left cursor-pointer transition hover:opacity-80"
                style={{ background: "rgba(72,187,120,.06)" }}>
                <span className="text-[11px] font-semibold" style={{ color: "#48BB78" }}>
                  ✓ {autoMatched.length} correspondance{autoMatched.length > 1 ? "s" : ""} automatique{autoMatched.length > 1 ? "s" : ""}
                </span>
                {showMatched ? <ChevronUp size={13} style={{ color: "#48BB78" }} /> : <ChevronDown size={13} style={{ color: "#48BB78" }} />}
              </button>
              {showMatched && (
                <div className="px-3 pb-3 pt-2 flex flex-wrap gap-1.5">
                  {autoMatched.map(([field, col]) => (
                    <span key={field} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(72,187,120,.12)", color: "#48BB78", border: "1px solid rgba(72,187,120,.25)" }}>
                      <code>{field}</code> ← {col}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unmapped fields */}
          {unmapped.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold" style={{ color: "var(--text)" }}>
                Champs à résoudre ({unmapped.length})
              </p>
              {unmapped.map((field) => (
                <div key={field} className="rounded-xl p-3 space-y-2"
                  style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--stroke)" }}>

                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(14,165,233,.12)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,.25)" }}>
                      {`{{ ${field} }}`}
                    </code>
                    {fixedValues[field] && (
                      <span className="text-[10px]" style={{ color: "#48BB78" }}>✓ valeur fixe</span>
                    )}
                  </div>

                  {/* Map to column */}
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: "var(--muted)" }}>
                      Correspondre à une de vos colonnes :
                    </label>
                    <select
                      value={mapping[field] ?? ""}
                      onChange={(e) => setColMapping(field, e.target.value)}
                      className="w-full rounded-lg px-2 py-1.5 text-[11px] cursor-pointer outline-none"
                      style={{ background: "var(--card-bg)", border: "1px solid var(--stroke)", color: "var(--text)" }}
                    >
                      <option value="">— aucune colonne correspondante —</option>
                      {importedColumns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fixed value fallback */}
                  {!mapping[field] && (
                    <div>
                      <label className="text-[10px] block mb-1" style={{ color: "var(--muted)" }}>
                        Ou valeur identique pour tous les documents :
                      </label>
                      <input
                        type="text"
                        placeholder={`ex: valeur de ${field}`}
                        value={fixedValues[field] ?? ""}
                        onChange={(e) => setFixedValues((prev) => ({ ...prev, [field]: e.target.value }))}
                        className="w-full rounded-lg px-2 py-1.5 text-[11px] outline-none"
                        style={{ background: "var(--card-bg)", border: "1px solid var(--stroke)", color: "var(--text)" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {unmapped.length > 0 && !canConfirm && (
            <p className="text-[11px] rounded-lg px-3 py-2"
              style={{ background: "rgba(251,191,36,.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,.2)" }}>
              Tous les champs doivent avoir une correspondance ou une valeur fixe pour continuer.
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 p-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--stroke)" }}>
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm transition cursor-pointer hover:opacity-80"
            style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(mapping, fixedValues)}
            disabled={!canConfirm}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: "#0EA5E9", color: "#fff" }}>
            <Check size={14} /> Continuer avec ce modèle
          </button>
        </div>
      </div>
    </div>
  );
}
