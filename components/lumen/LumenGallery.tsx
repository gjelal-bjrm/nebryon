"use client";

import { useState, useEffect } from "react";
import { Eye, ArrowRight, Plus, Trash2, X, ChevronRight } from "lucide-react";
import { LUMEN_CATEGORIES } from "@/lib/lumen/presets";
import type { LumenCategory, LumenPreset } from "@/lib/lumen/presets";

interface SavedTemplate {
  id:         string;
  name:       string;
  html:       string;
  categoryId: string;
  savedAt:    string;
}

interface Props {
  onUse:   (editorContent: string) => void;
  onBlank: (categoryId?: string)   => void;
  onBack:  () => void;
}

const ACCENT = "#0EA5E9";

export default function LumenGallery({ onUse, onBlank, onBack }: Props) {
  const [activeCat, setActiveCat] = useState<LumenCategory | "saved" | null>(null);
  const [preview,   setPreview]   = useState<LumenPreset | null>(null);
  const [saved,     setSaved]     = useState<SavedTemplate[]>([]);
  const [filter,    setFilter]    = useState<"all" | "mine">("all");

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

  const savedInCat = (catId: string) =>
    saved.filter((s) => s.categoryId === catId);

  // ── Category grid ──────────────────────────────────────────────────────────
  if (!activeCat) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Choisir une catégorie</h2>
            <p className="text-[12px]" style={{ color: "var(--muted)" }}>Sélectionnez le type de document à créer</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter(filter === "all" ? "mine" : "all")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
              style={filter === "mine"
                ? { background: ACCENT, color: "#fff" }
                : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
              {filter === "mine" ? "✓ Mes modèles" : "Mes modèles"}
            </button>
            <button onClick={onBack} className="text-xs transition hover:opacity-70 cursor-pointer"
              style={{ color: "var(--muted)" }}>
              ← Retour
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LUMEN_CATEGORIES.map((cat) => {
              const myCount = savedInCat(cat.id).length;
              const show    = filter === "all" || myCount > 0;
              if (!show) return null;
              return (
                <button key={cat.id}
                  onClick={() => setActiveCat(cat)}
                  className="flex items-start gap-4 p-5 rounded-2xl text-left transition cursor-pointer group"
                  style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = cat.color; (e.currentTarget as HTMLElement).style.background = `${cat.color}0d`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--stroke)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.02)"; }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${cat.color}18` }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{cat.name}</span>
                      <ChevronRight size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
                    </div>
                    <p className="text-[12px] leading-snug mb-2" style={{ color: "var(--muted)" }}>{cat.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}30` }}>
                        {cat.presets.length} modèle{cat.presets.length > 1 ? "s" : ""}
                      </span>
                      {myCount > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(72,187,120,.12)", color: "#48BB78", border: "1px solid rgba(72,187,120,.25)" }}>
                          {myCount} sauvegardé{myCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Templates within a category ────────────────────────────────────────────
  const cat      = activeCat as LumenCategory;
  const mySaved  = savedInCat(cat.id);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button onClick={() => setActiveCat(null)}
          className="flex items-center gap-1.5 text-xs transition cursor-pointer hover:opacity-70"
          style={{ color: "var(--muted)" }}>
          ← Catégories
        </button>
        <span style={{ color: "var(--stroke)" }}>/</span>
        <div className="flex items-center gap-2">
          <span className="text-base">{cat.icon}</span>
          <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>{cat.name}</h2>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">

          {/* Blank in this category */}
          <button onClick={() => onBlank(cat.id)}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center transition cursor-pointer"
            style={{ border: `2px dashed ${cat.color}55`, background: `${cat.color}06`, minHeight: "160px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${cat.color}0e`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${cat.color}06`; }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${cat.color}20` }}>
              <Plus size={20} style={{ color: cat.color }} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: cat.color }}>Modèle vierge</p>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>Document vide dans cette catégorie</p>
            </div>
          </button>

          {/* My saved templates in this category */}
          {mySaved.map((s) => (
            <div key={s.id} className="flex flex-col rounded-2xl p-4 gap-3"
              style={{ border: "1px solid rgba(72,187,120,.25)", background: "rgba(72,187,120,.04)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">💾</span>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{s.name}</p>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                    {new Date(s.savedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <button onClick={() => deleteSaved(s.id)}
                  className="p-1 rounded transition cursor-pointer hover:opacity-70 flex-shrink-0"
                  style={{ color: "var(--muted)" }}>
                  <Trash2 size={13} />
                </button>
              </div>
              <button onClick={() => onUse(s.html)}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer hover:opacity-90"
                style={{ background: "#48BB78", color: "#fff" }}>
                Modifier <ArrowRight size={12} />
              </button>
            </div>
          ))}

          {/* Pre-made presets in category */}
          {cat.presets.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl p-4 gap-3"
              style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--text)" }}>{p.name}</p>
                  <p className="text-[12px] leading-snug" style={{ color: "var(--muted)" }}>{p.description}</p>
                </div>
              </div>

              {/* Fields preview */}
              <div className="flex flex-wrap gap-1">
                {p.fields.slice(0, 4).map((f) => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)", border: "1px solid var(--stroke)" }}>
                    {f}
                  </span>
                ))}
                {p.fields.length > 4 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: "var(--muted)" }}>
                    +{p.fields.length - 4} champs
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
                <button onClick={() => onUse(p.editorContent)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer hover:opacity-90"
                  style={{ background: ACCENT, color: "#fff" }}>
                  Utiliser <ArrowRight size={11} />
                </button>
              </div>
            </div>
          ))}
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
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--stroke)" }}>
              <div className="flex items-center gap-2">
                <span>{preview.icon}</span>
                <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{preview.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { onUse(preview.editorContent); setPreview(null); }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition hover:opacity-90"
                  style={{ background: ACCENT, color: "#fff" }}>
                  Utiliser <ArrowRight size={11} />
                </button>
                <button onClick={() => setPreview(null)}
                  className="p-1.5 rounded-lg cursor-pointer transition hover:opacity-70"
                  style={{ color: "var(--muted)" }}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <iframe srcDoc={preview.previewHtml} sandbox="allow-same-origin"
              className="flex-1 bg-white" style={{ border: "none", minHeight: "500px" }}
              title={`Aperçu — ${preview.name}`} />
          </div>
        </div>
      )}
    </div>
  );
}
