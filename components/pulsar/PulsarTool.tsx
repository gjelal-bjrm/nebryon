"use client";
/* ── Pulsar — data reader & analyzer ────────────────────────────────────── */

import { useState, useCallback } from "react";
import { Upload, FileText, Table2, BarChart3, X, FileSpreadsheet, FileCode, Braces } from "lucide-react";
import type { ParsedData } from "../../lib/pulsar/parser";
import type { ColType } from "../../lib/pulsar/typeDetector";
import type { ColStats } from "../../lib/pulsar/stats";

// Lazy-loaded heavy sub-components
import dynamic from "next/dynamic";
const DataTable  = dynamic(() => import("./DataTable"),  { ssr: false });
const StatsPanel = dynamic(() => import("./StatsPanel"), { ssr: false });

type Tab = "preview" | "stats";

/* ── format icon ─────────────────────────────────────────────────────────── */
function FmtIcon({ fmt }: { fmt: ParsedData["format"] }) {
  const props = { size: 20, style: { color: "var(--halo)" } };
  if (fmt === "csv")   return <FileText {...props} />;
  if (fmt === "excel") return <FileSpreadsheet {...props} />;
  if (fmt === "xml")   return <FileCode {...props} />;
  return <Braces {...props} />;
}

/* ── drop zone ───────────────────────────────────────────────────────────── */
function PulsarDropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);

  const handle = useCallback((f: File | null) => {
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0] ?? null); }}
      className="relative flex flex-col items-center justify-center gap-4 rounded-2xl p-12 text-center cursor-pointer transition-all"
      style={{
        border: `2px dashed ${dragging ? "var(--nebula)" : "var(--stroke)"}`,
        background: dragging ? "rgba(108,99,255,.06)" : "rgba(255,255,255,.02)",
      }}
      onClick={() => {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = ".csv,.json,.xml,.xlsx,.xls,.ods";
        inp.onchange = () => handle(inp.files?.[0] ?? null);
        inp.click();
      }}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background:"rgba(108,99,255,.12)", border:"1px solid rgba(108,99,255,.3)" }}>
        <Upload size={28} style={{ color:"var(--nebula)" }} />
      </div>
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color:"var(--text)" }}>
          Glisse un fichier ou clique pour ouvrir
        </p>
        <p className="text-xs" style={{ color:"var(--muted)" }}>
          CSV · Excel (.xlsx / .xls) · JSON · XML
        </p>
      </div>
    </div>
  );
}

/* ── file info bar ───────────────────────────────────────────────────────── */
function FileInfoBar({ data, onClose }: { data: ParsedData; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.03)" }}>
      <FmtIcon fmt={data.format} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{data.fileName}</p>
        <p className="text-[11px]" style={{ color:"var(--muted)" }}>
          {data.rowCount} ligne{data.rowCount > 1 ? "s" : ""} · {data.headers.length} colonne{data.headers.length > 1 ? "s" : ""}
          {" · "}<span className="uppercase">{data.format}</span>
        </p>
      </div>
      <button onClick={onClose} className="rounded-lg p-1.5 transition hover:opacity-70"
        style={{ color:"var(--muted)", border:"1px solid var(--stroke)" }}>
        <X size={14} />
      </button>
    </div>
  );
}

/* ── tabs ─────────────────────────────────────────────────────────────────── */
function Tabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "preview", label: "Aperçu",       icon: <Table2 size={14}/> },
    { id: "stats",   label: "Statistiques", icon: <BarChart3 size={14}/> },
  ];
  return (
    <div className="flex gap-1 rounded-xl p-1" style={{ background:"rgba(255,255,255,.03)", border:"1px solid var(--stroke)" }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition"
          style={active === t.id
            ? { background:"var(--nebula)", color:"#fff" }
            : { color:"var(--muted)" }}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

/* ── main ────────────────────────────────────────────────────────────────── */
export default function PulsarTool() {
  const [data,   setData]   = useState<ParsedData | null>(null);
  const [types,  setTypes]  = useState<Record<string, ColType>>({});
  const [stats,  setStats]  = useState<ColStats[]>([]);
  const [tab,    setTab]    = useState<Tab>("preview");
  const [loading, setLoading] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const { parseFile }    = await import("../../lib/pulsar/parser");
      const { detectTypes }  = await import("../../lib/pulsar/typeDetector");
      const { computeStats } = await import("../../lib/pulsar/stats");

      const parsed = await parseFile(file);
      const detectedTypes = detectTypes(parsed.headers, parsed.rows);
      const colStats = computeStats(parsed.headers, parsed.rows, detectedTypes);

      setData(parsed);
      setTypes(detectedTypes);
      setStats(colStats);
      setTab("preview");
    } catch (e) {
      setError(`Erreur lors du chargement : ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null); setTypes({}); setStats([]); setError(null);
  }, []);

  /* ── render ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="h-10 w-10 animate-spin rounded-full"
          style={{ border:"3px solid var(--stroke)", borderTopColor:"var(--nebula)" }} />
        <p className="text-sm" style={{ color:"var(--muted)" }}>Analyse en cours…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-center rounded-xl px-6 py-4"
          style={{ color:"#FC8181", background:"rgba(207,35,40,.1)", border:"1px solid rgba(207,35,40,.3)" }}>
          {error}
        </p>
        <button onClick={reset} className="rounded-xl px-4 py-2 text-sm transition hover:opacity-80"
          style={{ border:"1px solid var(--stroke)", color:"var(--text)" }}>
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) {
    return <PulsarDropZone onFile={handleFile} />;
  }

  return (
    <div className="space-y-4">
      <FileInfoBar data={data} onClose={reset} />
      <Tabs active={tab} onChange={setTab} />

      {tab === "preview" && (
        <DataTable headers={data.headers} rows={data.rows} types={types} />
      )}
      {tab === "stats" && (
        <StatsPanel stats={stats} />
      )}
    </div>
  );
}
