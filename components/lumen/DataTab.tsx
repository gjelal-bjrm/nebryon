"use client";

import { useCallback, useState } from "react";
import { Upload, X, ArrowRight } from "lucide-react";
import { parseFile } from "@/lib/lumen/parseData";
import type { DataRow } from "@/lib/lumen/templateEngine";

interface Props {
  variables:    string[];
  data:         DataRow[];
  columns:      string[];
  mapping:      Record<string, string>;   // variable → column
  onDataChange: (rows: DataRow[], cols: string[]) => void;
  onMappingChange: (m: Record<string, string>) => void;
  onBack:       () => void;
  onContinue:   () => void;
}

const ACCEPTED = ".csv,.xlsx,.xls,.json,.xml";

export default function DataTab({
  variables, data, columns, mapping,
  onDataChange, onMappingChange, onBack, onContinue,
}: Props) {
  const [dragging, setDragging]  = useState(false);
  const [loading,  setLoading]   = useState(false);
  const [error,    setError]     = useState<string | null>(null);
  const [filename, setFilename]  = useState<string | null>(null);

  const loadFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) throw new Error("Aucune ligne trouvée dans le fichier.");
      const cols = Object.keys(rows[0]);
      setFilename(file.name);
      onDataChange(rows, cols);

      // Auto-map: variable name === column name (case-insensitive)
      const auto: Record<string, string> = {};
      for (const v of variables) {
        const match = cols.find((c) => c.toLowerCase() === v.toLowerCase());
        if (match) auto[v] = match;
      }
      onMappingChange(auto);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [variables, onDataChange, onMappingChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }, [loadFile]);

  const clearData = () => {
    setFilename(null);
    setError(null);
    onDataChange([], []);
    onMappingChange({});
  };

  const canContinue = data.length > 0 && variables.every((v) => mapping[v]);

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="relative flex flex-col items-center justify-center gap-3 rounded-2xl p-8 transition flex-shrink-0 cursor-pointer"
        style={{
          border:     `2px dashed ${dragging ? "#0EA5E9" : "var(--stroke)"}`,
          background: dragging ? "rgba(14,165,233,.06)" : "rgba(255,255,255,.02)",
          minHeight:  "120px",
        }}
        onClick={() => document.getElementById("lumen-file-input")?.click()}
      >
        <input id="lumen-file-input" type="file" accept={ACCEPTED}
          className="sr-only" onChange={handleInput} />

        {loading ? (
          <p className="text-sm animate-pulse" style={{ color: "#0EA5E9" }}>Chargement…</p>
        ) : filename ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{filename}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(14,165,233,.12)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,.25)" }}>
              {data.length} ligne{data.length !== 1 ? "s" : ""}
            </span>
            <button onClick={(e) => { e.stopPropagation(); clearData(); }}
              className="rounded-full p-0.5 transition hover:opacity-70 cursor-pointer"
              style={{ color: "var(--muted)" }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={22} style={{ color: "var(--muted)" }} />
            <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
              Glissez votre fichier ici ou <span style={{ color: "#0EA5E9" }}>cliquez pour parcourir</span>
            </p>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              Excel · CSV · JSON · XML
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs rounded-lg px-3 py-2"
          style={{ background: "rgba(207,35,40,.1)", color: "var(--red)", border: "1px solid rgba(207,35,40,.2)" }}>
          {error}
        </p>
      )}

      {/* Mapping */}
      {data.length > 0 && variables.length > 0 && (
        <div className="rounded-xl p-4 flex-shrink-0"
          style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--stroke)" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text)" }}>
            Correspondances colonne → variable
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {variables.map((v) => (
              <div key={v} className="flex items-center gap-2">
                <code className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(14,165,233,.14)", color: "#BAE6FD", border: "1px solid rgba(14,165,233,.25)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {`{{ ${v} }}`}
                </code>
                <ArrowRight size={12} style={{ color: "var(--muted)", flexShrink: 0 }} />
                <select
                  value={mapping[v] ?? ""}
                  onChange={(e) => onMappingChange({ ...mapping, [v]: e.target.value })}
                  className="flex-1 rounded-lg px-2 py-1 text-[11px] cursor-pointer outline-none"
                  style={{ background: "var(--card-bg)", border: "1px solid var(--stroke)", color: mapping[v] ? "var(--text)" : "var(--muted)" }}
                >
                  <option value="">— choisir une colonne —</option>
                  {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
          {!canContinue && data.length > 0 && (
            <p className="text-[11px] mt-2" style={{ color: "var(--muted)" }}>
              Mappez toutes les variables pour continuer.
            </p>
          )}
        </div>
      )}

      {/* Data preview */}
      {data.length > 0 && (
        <div className="flex-1 min-h-0 overflow-auto rounded-xl"
          style={{ border: "1px solid var(--stroke)" }}>
          <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,.04)", borderBottom: "1px solid var(--stroke)" }}>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: "var(--muted)" }}>#</th>
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2 text-left font-semibold" style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 8).map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--stroke)" }}>
                  <td className="px-3 py-1.5" style={{ color: "var(--muted)" }}>{i + 1}</td>
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-1.5" style={{ color: "var(--text)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 8 && (
            <p className="px-3 py-2 text-[11px]" style={{ color: "var(--muted)" }}>
              … et {data.length - 8} ligne{data.length - 8 > 1 ? "s" : ""} supplémentaire{data.length - 8 > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between flex-shrink-0">
        <button onClick={onBack}
          className="px-4 py-2 rounded-xl text-sm transition cursor-pointer hover:opacity-80"
          style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
          ← Modèle
        </button>
        <button onClick={onContinue} disabled={!canContinue}
          className="px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#0EA5E9", color: "#fff" }}>
          Générer les PDFs →
        </button>
      </div>
    </div>
  );
}
