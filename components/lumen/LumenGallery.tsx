"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, ArrowRight, Plus, Trash2, X, ChevronRight, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { LUMEN_CATEGORIES } from "@/lib/lumen/presets";
import type { LumenCategory, LumenPreset } from "@/lib/lumen/presets";
import { parseFile } from "@/lib/lumen/parseData";
import type { DataRow } from "@/lib/lumen/templateEngine";
import FieldMappingModal from "./FieldMappingModal";

interface SavedTemplate {
  id:         string;
  name:       string;
  html:       string;
  categoryId: string;
  savedAt:    string;
}

interface Props {
  importedData:    DataRow[];
  importedColumns: string[];
  dataFilename:    string;
  onDataImport:    (rows: DataRow[], cols: string[], filename: string) => void;
  onUse:   (editorContent: string, mapping: Record<string, string>, fixedValues: Record<string, string>) => void;
  onBlank: (categoryId?: string) => void;
  onBack:  () => void;
}

const ACCENT = "#0EA5E9";
const ACCEPTED = ".csv,.xlsx,.xls,.json,.xml";

export default function LumenGallery({
  importedData, importedColumns, dataFilename,
  onDataImport, onUse, onBlank, onBack,
}: Props) {
  const [activeCat,    setActiveCat]    = useState<LumenCategory | null>(null);
  const [preview,      setPreview]      = useState<LumenPreset | null>(null);
  const [pendingPreset, setPendingPreset] = useState<LumenPreset | null>(null);
  const [saved,        setSaved]        = useState<SavedTemplate[]>([]);
  const [filter,       setFilter]       = useState<"all" | "mine">("all");
  const [dataLoading,  setDataLoading]  = useState(false);
  const [dataError,    setDataError]    = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ── Data import ─────────────────────────────────────────────────────────
  const loadFile = useCallback(async (file: File) => {
    setDataLoading(true);
    setDataError(null);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) throw new Error("Aucune ligne trouvée.");
      const cols = Object.keys(rows[0]);
      onDataImport(rows, cols, file.name);
    } catch (e) {
      setDataError(String(e));
    } finally {
      setDataLoading(false);
    }
  }, [onDataImport]);

  // ── Compatibility helpers ────────────────────────────────────────────────
  const getMissingFields = (preset: LumenPreset): string[] => {
    if (importedColumns.length === 0) return [];
    return preset.fields.filter(
      (f) => !importedColumns.some((c) => c.toLowerCase() === f.toLowerCase()),
    );
  };

  // ── "Utiliser" handler ───────────────────────────────────────────────────
  const handleUsePreset = (p: LumenPreset) => {
    if (importedColumns.length === 0) {
      // No data imported yet — open editor without mapping
      onUse(p.editorContent, {}, {});
      return;
    }
    const missing = getMissingFields(p);
    if (missing.length === 0) {
      // All fields matched — build auto mapping and go
      const autoMapping: Record<string, string> = {};
      for (const f of p.fields) {
        const match = importedColumns.find((c) => c.toLowerCase() === f.toLowerCase());
        if (match) autoMapping[f] = match;
      }
      onUse(p.editorContent, autoMapping, {});
    } else {
      // Some fields missing — open mapping modal
      setPendingPreset(p);
    }
  };

  // ── Compact data bar ─────────────────────────────────────────────────────
  const DataBar = () => (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl flex-shrink-0 mb-1"
      style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--stroke)" }}>
      <input ref={fileInputRef} type="file" accept={ACCEPTED} className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }} />

      {dataLoading ? (
        <span className="text-[11px] animate-pulse" style={{ color: ACCENT }}>Chargement…</span>
      ) : importedData.length > 0 ? (
        <>
          <CheckCircle2 size={13} style={{ color: "#48BB78", flexShrink: 0 }} />
          <span className="text-[11px] font-medium truncate" style={{ color: "var(--text)", maxWidth: "180px" }}>
            {dataFilename}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(72,187,120,.12)", color: "#48BB78", border: "1px solid rgba(72,187,120,.25)" }}>
            {importedData.length} ligne{importedData.length !== 1 ? "s" : ""} · {importedColumns.length} col.
          </span>
          <button onClick={() => fileInputRef.current?.click()}
            className="ml-auto text-[11px] px-2 py-0.5 rounded-lg transition cursor-pointer hover:opacity-80"
            style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
            Changer
          </button>
        </>
      ) : (
        <>
          <Upload size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <span className="text-[11px]" style={{ color: "var(--muted)" }}>
            Importez vos données pour voir la compatibilité avec les modèles
          </span>
          <button onClick={() => fileInputRef.current?.click()}
            className="ml-auto flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-lg font-semibold transition cursor-pointer hover:opacity-90 flex-shrink-0"
            style={{ background: ACCENT, color: "#fff" }}>
            <Upload size={11} /> Importer
          </button>
        </>
      )}
    </div>
  );

  // ── Compatibility badge for a preset card ────────────────────────────────
  const CompatBadge = ({ preset }: { preset: LumenPreset }) => {
    if (importedColumns.length === 0) return null;
    const missing = getMissingFields(preset);
    if (missing.length === 0) {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(72,187,120,.12)", color: "#48BB78", border: "1px solid rgba(72,187,120,.25)" }}>
          ✓ Compatible
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
        style={{ background: "rgba(14,165,233,.12)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,.25)" }}>
        ⚠ {missing.length} champ{missing.length > 1 ? "s" : ""} manquant{missing.length > 1 ? "s" : ""}
      </span>
    );
  };

  // ── Category grid ──────────────────────────────────────────────────────────
  if (!activeCat) {
    return (
      <div className="flex flex-col gap-3 h-full">
        <DataBar />

        {dataError && (
          <p className="text-xs rounded-lg px-3 py-2 flex-shrink-0"
            style={{ background: "rgba(207,35,40,.1)", color: "var(--red)", border: "1px solid rgba(207,35,40,.2)" }}>
            {dataError}
          </p>
        )}

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

              // Compatibility summary for this category
              const compatible = importedColumns.length > 0
                ? cat.presets.filter((p) => getMissingFields(p).length === 0).length
                : -1;

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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {compatible >= 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full"
                          style={compatible === cat.presets.length
                            ? { background: "rgba(72,187,120,.1)", color: "#48BB78", border: "1px solid rgba(72,187,120,.2)" }
                            : { background: "rgba(14,165,233,.1)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,.2)" }}>
                          {compatible === cat.presets.length ? "✓ Tous compatibles" : `${compatible}/${cat.presets.length} compatibles`}
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
  const mySaved = savedInCat(activeCat.id);

  return (
    <div className="flex flex-col gap-3 h-full">
      <DataBar />

      {dataError && (
        <p className="text-xs rounded-lg px-3 py-2 flex-shrink-0"
          style={{ background: "rgba(207,35,40,.1)", color: "var(--red)", border: "1px solid rgba(207,35,40,.2)" }}>
          {dataError}
        </p>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button onClick={() => setActiveCat(null)}
          className="flex items-center gap-1.5 text-xs transition cursor-pointer hover:opacity-70"
          style={{ color: "var(--muted)" }}>
          ← Catégories
        </button>
        <span style={{ color: "var(--stroke)" }}>/</span>
        <div className="flex items-center gap-2">
          <span className="text-base">{activeCat.icon}</span>
          <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>{activeCat.name}</h2>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">

          {/* Blank in this category */}
          <button onClick={() => onBlank(activeCat.id)}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center transition cursor-pointer"
            style={{ border: `2px dashed ${activeCat.color}55`, background: `${activeCat.color}06`, minHeight: "160px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${activeCat.color}0e`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${activeCat.color}06`; }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${activeCat.color}20` }}>
              <Plus size={20} style={{ color: activeCat.color }} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: activeCat.color }}>Modèle vierge</p>
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
              <button onClick={() => onUse(s.html, {}, {})}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer hover:opacity-90"
                style={{ background: "#48BB78", color: "#fff" }}>
                Modifier <ArrowRight size={12} />
              </button>
            </div>
          ))}

          {/* Pre-made presets in category */}
          {activeCat.presets.map((p) => {
            const missing = getMissingFields(p);
            return (
              <div key={p.id} className="flex flex-col rounded-2xl p-4 gap-3"
                style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--text)" }}>{p.name}</p>
                    <p className="text-[12px] leading-snug" style={{ color: "var(--muted)" }}>{p.description}</p>
                  </div>
                </div>

                {/* Fields preview + compat badge */}
                <div className="flex flex-wrap gap-1">
                  {p.fields.slice(0, 4).map((f) => {
                    const isMissing = importedColumns.length > 0 &&
                      !importedColumns.some((c) => c.toLowerCase() === f.toLowerCase());
                    return (
                      <span key={f} className="text-[10px] px-1.5 py-0.5 rounded"
                        style={isMissing
                          ? { background: "rgba(14,165,233,.1)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,.25)" }
                          : { background: "rgba(255,255,255,.05)", color: "var(--muted)", border: "1px solid var(--stroke)" }}>
                        {f}
                      </span>
                    );
                  })}
                  {p.fields.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: "var(--muted)" }}>
                      +{p.fields.length - 4} champs
                    </span>
                  )}
                </div>

                {/* Compat badge */}
                <CompatBadge preset={p} />

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setPreview(p)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] transition cursor-pointer hover:opacity-80"
                    style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                    <Eye size={11} /> Aperçu
                  </button>
                  <button onClick={() => handleUsePreset(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer hover:opacity-90"
                    style={{ background: ACCENT, color: "#fff" }}>
                    {missing.length > 0 ? (
                      <><AlertTriangle size={11} /> Résoudre &amp; Utiliser</>
                    ) : (
                      <>Utiliser <ArrowRight size={11} /></>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
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
                <CompatBadge preset={preview} />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { handleUsePreset(preview); setPreview(null); }}
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

      {/* ── Field mapping modal ── */}
      {pendingPreset && (
        <FieldMappingModal
          preset={pendingPreset}
          importedColumns={importedColumns}
          onConfirm={(mapping, fixedValues) => {
            const content = pendingPreset.editorContent;
            setPendingPreset(null);
            onUse(content, mapping, fixedValues);
          }}
          onCancel={() => setPendingPreset(null)}
        />
      )}
    </div>
  );
}
