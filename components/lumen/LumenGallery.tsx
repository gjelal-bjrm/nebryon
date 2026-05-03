"use client";

import { useState, useEffect } from "react";
import { Eye, ArrowRight, Plus, Trash2, X } from "lucide-react";
import { PRESETS, CATEGORIES } from "@/lib/lumen/presets";
import type { LumenPreset, TemplateCategory } from "@/lib/lumen/presets";

interface SavedTemplate {
  id:      string;
  name:    string;
  html:    string;
  savedAt: string;
}

interface Props {
  onUse:  (html: string) => void;   // load template in editor
  onBlank: () => void;
  onBack:  () => void;
}

const ACCENT = "#0EA5E9";

export default function LumenGallery({ onUse, onBlank, onBack }: Props) {
  const [cat,     setCat]     = useState<TemplateCategory | "all" | "saved">("all");
  const [preview, setPreview] = useState<LumenPreset | null>(null);
  const [saved,   setSaved]   = useState<SavedTemplate[]>([]);

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lumen-saved-templates");
      if (raw) setSaved(JSON.parse(raw) as SavedTemplate[]);
    } catch { /* ignore */ }
  }, []);

  const deleteSaved = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    localStorage.setItem("lumen-saved-templates", JSON.stringify(next));
  };

  const visiblePresets =
    cat === "all"   ? PRESETS :
    cat === "saved" ? [] :
    PRESETS.filter((p) => p.category === cat);

  const visibleSaved =
    cat === "all" || cat === "saved" ? saved : [];

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Choisir un modèle</h2>
          <p className="text-[12px]" style={{ color: "var(--muted)" }}>
            Utilisez un modèle prêt à l'emploi ou partez de zéro.
          </p>
        </div>
        <button onClick={onBack} className="text-xs transition hover:opacity-70 cursor-pointer"
          style={{ color: "var(--muted)" }}>
          ← Retour
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 flex-shrink-0">
        {[...CATEGORIES, { id: "saved" as const, label: `Mes modèles${saved.length > 0 ? ` (${saved.length})` : ""}` }]
          .map(({ id, label }) => (
            <button key={id}
              onClick={() => setCat(id as TemplateCategory | "all" | "saved")}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
              style={cat === id
                ? { background: ACCENT, color: "#fff" }
                : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
              {label}
            </button>
          ))}
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">

          {/* Blank template card */}
          {(cat === "all" || cat === "saved") && (
            <button onClick={onBlank}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center
                transition hover:opacity-80 cursor-pointer"
              style={{ border: `2px dashed rgba(14,165,233,.35)`, background: "rgba(14,165,233,.04)", minHeight: "180px" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(14,165,233,.12)" }}>
                <Plus size={20} style={{ color: ACCENT }} />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: ACCENT }}>Modèle vierge</p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>Créez votre propre document de zéro</p>
              </div>
            </button>
          )}

          {/* Saved templates */}
          {visibleSaved.map((s) => (
            <div key={s.id} className="flex flex-col rounded-2xl p-4 gap-3"
              style={{ border: "1px solid rgba(72,187,120,.25)", background: "rgba(72,187,120,.04)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💾</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{s.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                      Sauvegardé le {new Date(s.savedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteSaved(s.id)}
                  className="p-1 rounded-lg transition hover:opacity-70 cursor-pointer flex-shrink-0"
                  style={{ color: "var(--muted)" }}>
                  <Trash2 size={13} />
                </button>
              </div>
              <button onClick={() => onUse(s.html)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer hover:opacity-90"
                style={{ background: "#48BB78", color: "#fff" }}>
                Utiliser <ArrowRight size={12} />
              </button>
            </div>
          ))}

          {/* Pre-made presets */}
          {visiblePresets.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl p-4 gap-3"
              style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
              {/* Card header */}
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{p.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize"
                      style={{ background: "rgba(14,165,233,.1)", color: ACCENT, border: "1px solid rgba(14,165,233,.2)" }}>
                      {p.category === "comptabilite" ? "compta" : p.category}
                    </span>
                  </div>
                  <p className="text-[12px] leading-snug" style={{ color: "var(--muted)" }}>{p.description}</p>
                </div>
              </div>

              {/* Required fields */}
              <div className="flex flex-wrap gap-1">
                {p.fields.slice(0, 5).map((f) => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)", border: "1px solid var(--stroke)" }}>
                    {f}
                  </span>
                ))}
                {p.fields.length > 5 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: "var(--muted)" }}>
                    +{p.fields.length - 5} champs
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <button onClick={() => setPreview(p)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] transition cursor-pointer hover:opacity-80"
                  style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                  <Eye size={11} /> Aperçu
                </button>
                <button onClick={() => onUse(p.html)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer hover:opacity-90"
                  style={{ background: ACCENT, color: "#fff" }}>
                  Utiliser <ArrowRight size={11} />
                </button>
              </div>
            </div>
          ))}

          {/* Empty state for saved */}
          {cat === "saved" && saved.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center"
              style={{ color: "var(--muted)" }}>
              <p className="text-sm mb-2">Aucun modèle sauvegardé</p>
              <p className="text-xs">Dans l'éditeur, cliquez sur "Sauvegarder" pour retrouver vos modèles ici.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Preview modal ── */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.7)" }}
          onClick={() => setPreview(null)}>
          <div className="flex flex-col rounded-2xl overflow-hidden w-full max-w-3xl max-h-[90vh]"
            style={{ background: "var(--surface)", border: "1px solid var(--stroke)" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--stroke)" }}>
              <div className="flex items-center gap-2">
                <span>{preview.icon}</span>
                <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{preview.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { onUse(preview.html); setPreview(null); }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition hover:opacity-90"
                  style={{ background: ACCENT, color: "#fff" }}>
                  Utiliser ce modèle <ArrowRight size={11} />
                </button>
                <button onClick={() => setPreview(null)}
                  className="p-1.5 rounded-lg cursor-pointer transition hover:opacity-70"
                  style={{ color: "var(--muted)" }}>
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* Iframe preview */}
            <iframe
              srcDoc={preview.html}
              sandbox="allow-same-origin"
              className="flex-1 bg-white"
              style={{ border: "none", minHeight: "500px" }}
              title={`Aperçu — ${preview.name}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
