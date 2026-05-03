"use client";

import { useCallback, useState } from "react";
import { Upload, X, CheckCircle2, AlertCircle, ChevronDown, Check } from "lucide-react";
import { parseFile } from "@/lib/lumen/parseData";
import type { DataRow } from "@/lib/lumen/templateEngine";

interface Props {
  variables:          string[];
  data:               DataRow[];
  columns:            string[];
  mapping:            Record<string, string>;
  fixedValues:        Record<string, string>;
  initialFilename?:   string;
  onDataChange:       (rows: DataRow[], cols: string[]) => void;
  onMappingChange:    (m: Record<string, string>) => void;
  onFixedValuesChange:(fv: Record<string, string>) => void;
  onContinue:         () => void;
}

const ACCEPTED = ".csv,.xlsx,.xls,.json,.xml";

export default function DataTab({
  variables, data, columns, mapping, fixedValues, initialFilename,
  onDataChange, onMappingChange, onFixedValuesChange, onContinue,
}: Props) {
  const [dragging,  setDragging]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [filename,  setFilename]  = useState<string | null>(initialFilename ?? null);
  const [showMatched, setShowMatched] = useState(false);

  // Draft state: what the user is currently typing (not yet confirmed)
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  // Which fields were just validated (briefly highlighted)
  const [recentlyValidated, setRecentlyValidated] = useState<string | null>(null);

  const loadFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) throw new Error("Aucune ligne trouvée dans le fichier.");
      const cols = Object.keys(rows[0]);
      setFilename(file.name);
      onDataChange(rows, cols);
      const auto: Record<string, string> = {};
      for (const v of variables) {
        const match = cols.find((c) => c.toLowerCase() === v.toLowerCase());
        if (match) auto[v] = match;
      }
      onMappingChange(auto);
      onFixedValuesChange({});
      setDraftValues({});
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [variables, onDataChange, onMappingChange, onFixedValuesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }, [loadFile]);

  const clearData = () => {
    setFilename(null); setError(null);
    onDataChange([], []); onMappingChange({}); onFixedValuesChange({});
    setDraftValues({});
  };

  // Commit a draft fixed value for field v
  const validateFixed = (v: string) => {
    const val = draftValues[v]?.trim();
    if (!val) return;
    onFixedValuesChange({ ...fixedValues, [v]: val });
    setDraftValues((prev) => { const n = { ...prev }; delete n[v]; return n; });
    setShowMatched(true);  // expand configured section so user sees the result
    setRecentlyValidated(v);
    setTimeout(() => setRecentlyValidated(null), 2500);
  };

  // Move a confirmed fixed-value field back to "À configurer" for editing
  const editFixed = (v: string) => {
    setDraftValues((prev) => ({ ...prev, [v]: fixedValues[v] ?? "" }));
    const fv = { ...fixedValues };
    delete fv[v];
    onFixedValuesChange(fv);
  };

  // Resolved = confirmed column mapping OR confirmed fixed value
  const isResolved   = (v: string) => !!mapping[v] || !!fixedValues[v]?.trim();
  const matched      = variables.filter((v) =>  mapping[v]);
  const withFixed    = variables.filter((v) => !mapping[v] && !!fixedValues[v]?.trim());
  const unresolved   = variables.filter((v) => !isResolved(v));
  const totalResolved = matched.length + withFixed.length;
  const canContinue  = data.length > 0 && unresolved.length === 0;

  // ── No data yet ────────────────────────────────────────────────────────────
  if (!data.length) {
    return (
      <div className="flex flex-col gap-5 h-full justify-center items-center">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-5">
          <div className="text-center">
            <div className="text-4xl mb-3">📂</div>
            <h2 className="text-base font-bold mb-1" style={{ color: "var(--text)" }}>
              Commencez par importer vos données
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Votre fichier contient la liste des personnes ou des éléments pour lesquels vous voulez
              générer des documents. Il peut s&apos;agir d&apos;un fichier Excel, CSV, JSON ou XML.
            </p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("lumen-file-input")?.click()}
            className="flex flex-col items-center justify-center gap-4 rounded-2xl p-10 transition cursor-pointer"
            style={{
              border:     `2px dashed ${dragging ? "#0EA5E9" : "var(--stroke)"}`,
              background: dragging ? "rgba(14,165,233,.06)" : "rgba(255,255,255,.02)",
            }}
          >
            <input id="lumen-file-input" type="file" accept={ACCEPTED} className="sr-only" onChange={handleInput} />
            {loading ? (
              <p className="text-sm animate-pulse" style={{ color: "#0EA5E9" }}>Analyse en cours…</p>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(14,165,233,.1)", border: "1px solid rgba(14,165,233,.2)" }}>
                  <Upload size={24} style={{ color: "#0EA5E9" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Glissez votre fichier ici</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    ou <span style={{ color: "#0EA5E9" }}>cliquez pour choisir un fichier</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {["Excel", "CSV", "JSON", "XML"].map((f) => (
                    <span key={f} className="text-[11px] px-2.5 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,.04)", color: "var(--muted)", border: "1px solid var(--stroke)" }}>
                      {f}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(207,35,40,.1)", border: "1px solid rgba(207,35,40,.2)" }}>
              <AlertCircle size={16} style={{ color: "var(--red)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--red)" }}>Erreur de lecture</p>
                <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Data loaded ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 h-full">

      {/* File summary bar */}
      <div className="flex items-center gap-3 rounded-xl px-4 py-3 flex-shrink-0"
        style={{ background: "rgba(72,187,120,.06)", border: "1px solid rgba(72,187,120,.2)" }}>
        <CheckCircle2 size={16} style={{ color: "#48BB78", flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{filename}</p>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>
            {data.length} ligne{data.length !== 1 ? "s" : ""} · {columns.length} colonne{columns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => document.getElementById("lumen-file-input-loaded")?.click()}
          className="text-[11px] px-3 py-1 rounded-lg transition cursor-pointer hover:opacity-80 flex-shrink-0"
          style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
          Changer
        </button>
        <button onClick={clearData}
          className="p-1 rounded transition cursor-pointer hover:opacity-70 flex-shrink-0"
          style={{ color: "var(--muted)" }}>
          <X size={14} />
        </button>
        <input id="lumen-file-input-loaded" type="file" accept={ACCEPTED} className="sr-only" onChange={handleInput} />
      </div>

      {/* No variables in template */}
      {variables.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
          <div className="text-4xl">✅</div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Aucun champ à configurer</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Votre modèle n&apos;utilise pas de champs dynamiques.</p>
          <button onClick={onContinue}
            className="mt-2 px-6 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-90 transition"
            style={{ background: "#0EA5E9", color: "#fff" }}>
            Continuer →
          </button>
        </div>
      )}

      {/* Fields matching section */}
      {variables.length > 0 && (
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-auto pr-3">

          {/* Status header */}
          <div className="flex items-start gap-3 rounded-xl p-4 flex-shrink-0"
            style={unresolved.length > 0
              ? { background: "rgba(14,165,233,.06)", border: "1px solid rgba(14,165,233,.2)" }
              : { background: "rgba(72,187,120,.06)", border: "1px solid rgba(72,187,120,.2)" }}>
            <div className="text-2xl flex-shrink-0">{unresolved.length > 0 ? "🔧" : "✅"}</div>
            <div className="flex-1 min-w-0">
              {unresolved.length > 0 ? (
                <>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "#0EA5E9" }}>
                    {unresolved.length} champ{unresolved.length > 1 ? "s" : ""} à configurer
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                    Le modèle utilise <strong style={{ color: "var(--text)" }}>{variables.length} champs</strong> au total.
                    {totalResolved > 0 && <span> {totalResolved} ont été trouvés automatiquement.</span>}
                    {" "}Pour chaque champ manquant, indiquez quelle colonne de votre fichier correspond,
                    ou entrez une valeur commune à tous les documents.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "#48BB78" }}>
                    Tout est configuré ! ({variables.length}/{variables.length} champs)
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Tous les champs du modèle ont été associés à votre fichier. Vous pouvez continuer.
                  </p>
                </>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-xl font-bold" style={{ color: unresolved.length > 0 ? "#0EA5E9" : "#48BB78" }}>
                {totalResolved}/{variables.length}
              </p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>configurés</p>
            </div>
          </div>

          {/* ── Fields that NEED action ── */}
          {unresolved.length > 0 && (
            <div className="flex flex-col gap-3 flex-shrink-0">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0EA5E9" }}>
                À configurer ({unresolved.length})
              </p>
              {unresolved.map((v) => (
                <div key={v} className="rounded-2xl p-4 flex flex-col gap-3"
                  style={{ border: "1px solid rgba(14,165,233,.25)", background: "rgba(14,165,233,.04)" }}>

                  {/* Field name */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔷</span>
                    <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{v}</span>
                    <span className="text-[11px]" style={{ color: "var(--muted)" }}>— champ utilisé dans le modèle</span>
                  </div>

                  {/* Column picker */}
                  <div>
                    <label className="text-[11px] font-semibold block mb-1.5" style={{ color: "var(--muted)" }}>
                      Quelle colonne de votre fichier contient cette information ?
                    </label>
                    <div className="relative">
                      <select
                        value={mapping[v] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newMapping = { ...mapping };
                          if (val) newMapping[v] = val; else delete newMapping[v];
                          onMappingChange(newMapping);
                          if (val) {
                            const fv = { ...fixedValues }; delete fv[v]; onFixedValuesChange(fv);
                            setDraftValues((prev) => { const n = { ...prev }; delete n[v]; return n; });
                          }
                        }}
                        className="w-full rounded-xl px-3 py-2.5 text-sm cursor-pointer outline-none appearance-none pr-8"
                        style={{ background: "var(--card-bg)", border: "1px solid rgba(14,165,233,.35)", color: mapping[v] ? "var(--text)" : "var(--muted)" }}
                      >
                        <option value="">— Sélectionner une colonne —</option>
                        {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: "var(--stroke)" }} />
                    <span className="text-[11px]" style={{ color: "var(--muted)" }}>ou</span>
                    <div className="flex-1 h-px" style={{ background: "var(--stroke)" }} />
                  </div>

                  {/* Fixed value — draft + validate */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold block" style={{ color: "var(--muted)" }}>
                      Entrer une valeur identique pour tous les documents :
                    </label>
                    <input
                      type="text"
                      placeholder={`ex: valeur commune pour "${v}"`}
                      value={draftValues[v] ?? ""}
                      onChange={(e) => setDraftValues((prev) => ({ ...prev, [v]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") validateFixed(v); }}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ background: "var(--card-bg)", border: "1px solid var(--stroke)", color: "var(--text)" }}
                    />
                    <div className="flex items-center gap-2 justify-end">
                      {draftValues[v] && (
                        <button
                          onClick={() => setDraftValues((prev) => { const n = { ...prev }; delete n[v]; return n; })}
                          className="px-3 py-1.5 rounded-lg text-xs transition cursor-pointer hover:opacity-80"
                          style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                          Annuler
                        </button>
                      )}
                      <button
                        onClick={() => validateFixed(v)}
                        disabled={!draftValues[v]?.trim()}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                        style={{ background: "#0EA5E9", color: "#fff" }}>
                        <Check size={12} /> Valider cette valeur
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Recently validated toast ── */}
          {recentlyValidated && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 flex-shrink-0"
              style={{ background: "rgba(72,187,120,.1)", border: "1px solid rgba(72,187,120,.3)" }}>
              <CheckCircle2 size={14} style={{ color: "#48BB78" }} />
              <p className="text-xs font-semibold" style={{ color: "#48BB78" }}>
                Valeur enregistrée pour <code style={{ color: "#0EA5E9" }}>{recentlyValidated}</code>
              </p>
            </div>
          )}

          {/* ── Fields already configured ── */}
          {(matched.length > 0 || withFixed.length > 0) && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => setShowMatched((v) => !v)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer hover:opacity-80 transition"
                style={{ color: "#48BB78" }}>
                <CheckCircle2 size={13} />
                Champs configurés ({matched.length + withFixed.length})
                <ChevronDown size={12} style={{ transform: showMatched ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {showMatched && (
                <div className="flex flex-col gap-1.5">
                  {matched.map((v) => (
                    <div key={v} className="flex items-center gap-3 rounded-xl px-3 py-2"
                      style={{ background: "rgba(72,187,120,.05)", border: "1px solid rgba(72,187,120,.2)" }}>
                      <CheckCircle2 size={13} style={{ color: "#48BB78", flexShrink: 0 }} />
                      <code className="text-[11px] font-semibold flex-shrink-0" style={{ color: "#0EA5E9" }}>{v}</code>
                      <span className="text-[11px]" style={{ color: "var(--muted)" }}>←</span>
                      <span className="text-[11px]" style={{ color: "var(--text)" }}>
                        colonne <strong>&ldquo;{mapping[v]}&rdquo;</strong>
                      </span>
                      <div className="ml-auto relative flex-shrink-0">
                        <select
                          value={mapping[v]}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newMapping = { ...mapping };
                            if (val) newMapping[v] = val; else delete newMapping[v];
                            onMappingChange(newMapping);
                          }}
                          className="text-[10px] rounded-lg px-1.5 py-0.5 cursor-pointer outline-none appearance-none pr-4"
                          style={{ background: "transparent", border: "1px solid rgba(72,187,120,.3)", color: "var(--muted)" }}>
                          {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  {withFixed.map((v) => (
                    <div key={v}
                      className="flex items-center gap-3 rounded-xl px-3 py-2"
                      style={{
                        background: v === recentlyValidated ? "rgba(72,187,120,.12)" : "rgba(72,187,120,.05)",
                        border: `1px solid ${v === recentlyValidated ? "rgba(72,187,120,.4)" : "rgba(72,187,120,.2)"}`,
                        transition: "background 0.4s, border-color 0.4s",
                      }}>
                      <CheckCircle2 size={13} style={{ color: "#48BB78", flexShrink: 0 }} />
                      <code className="text-[11px] font-semibold flex-shrink-0" style={{ color: "#0EA5E9" }}>{v}</code>
                      <span className="text-[11px]" style={{ color: "var(--muted)" }}>= valeur fixe :</span>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--text)" }}>
                        &ldquo;{fixedValues[v]}&rdquo;
                      </span>
                      <button
                        onClick={() => editFixed(v)}
                        className="ml-auto text-[10px] px-2 py-0.5 rounded-lg transition cursor-pointer hover:opacity-80 flex-shrink-0"
                        style={{ border: "1px solid rgba(72,187,120,.3)", color: "var(--muted)" }}>
                        Modifier
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      {data.length > 0 && variables.length > 0 && (
        <div className="flex items-center justify-end flex-shrink-0 pt-2" style={{ borderTop: "1px solid var(--stroke)" }}>
          <button onClick={onContinue} disabled={!canContinue}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: "#0EA5E9", color: "#fff" }}>
            {canContinue
              ? "Voir et modifier le modèle →"
              : `Configurez les ${unresolved.length} champ${unresolved.length > 1 ? "s" : ""} manquant${unresolved.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
