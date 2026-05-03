"use client";

import { useCallback, useState } from "react";
import { Download, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { renderTemplate } from "@/lib/lumen/templateEngine";
import type { DataRow } from "@/lib/lumen/templateEngine";

interface PdfOptions {
  format:       "A4" | "Letter" | "Legal";
  landscape:    boolean;
  marginTop:    string;
  marginRight:  string;
  marginBottom: string;
  marginLeft:   string;
}

interface Props {
  template:  string;
  data:      DataRow[];
  mapping:   Record<string, string>;   // variable → column
  onBack:    () => void;
}

const MARGIN_PRESETS = [
  { label: "Étroit",  value: "10mm" },
  { label: "Normal",  value: "15mm" },
  { label: "Large",   value: "25mm" },
  { label: "Aucun",   value: "0mm"  },
];

/** Builds a DataRow using the variable→column mapping. */
function buildRow(raw: DataRow, mapping: Record<string, string>): DataRow {
  const out: DataRow = {};
  for (const [variable, column] of Object.entries(mapping)) {
    out[variable] = raw[column] ?? "";
  }
  return out;
}

/** Calls /api/lumen/generate with an HTML string, returns a PDF ArrayBuffer. */
async function generatePdf(html: string, opts: PdfOptions): Promise<ArrayBuffer> {
  const res = await fetch("/api/lumen/generate", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ html, ...opts }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.arrayBuffer();
}

export default function GenerateTab({ template, data, mapping, onBack }: Props) {
  const [opts, setOpts] = useState<PdfOptions>({
    format:       "A4",
    landscape:    false,
    marginTop:    "15mm",
    marginRight:  "15mm",
    marginBottom: "15mm",
    marginLeft:   "15mm",
  });
  const [marginPreset, setMarginPreset] = useState("Normal");
  const [status,  setStatus]  = useState<"idle" | "running" | "done" | "error">("idle");
  const [current, setCurrent] = useState(0);
  const [label,   setLabel]   = useState("");
  const [errMsg,  setErrMsg]  = useState("");
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const setMargin = (preset: string, value: string) => {
    setMarginPreset(preset);
    setOpts((o) => ({ ...o, marginTop: value, marginRight: value, marginBottom: value, marginLeft: value }));
  };

  const handleGenerate = useCallback(async () => {
    setStatus("running");
    setCurrent(0);
    setZipBlob(null);
    setErrMsg("");

    const JSZip = (await import("jszip")).default;
    const zip   = new JSZip();

    for (let i = 0; i < data.length; i++) {
      const row      = buildRow(data[i], mapping);
      const html     = renderTemplate(template, row);
      // Label: try common "name" columns for display
      const rowLabel = data[i]["nom_client"] ?? data[i]["nom"] ?? data[i]["name"] ?? `document_${i + 1}`;
      setLabel(rowLabel);

      try {
        const pdf = await generatePdf(html, opts);
        const safeName = rowLabel.replace(/[^a-z0-9_\-]/gi, "_");
        zip.file(`${String(i + 1).padStart(4, "0")}_${safeName}.pdf`, pdf);
      } catch (e) {
        setErrMsg(`Erreur sur la ligne ${i + 1} : ${String(e)}`);
        setStatus("error");
        return;
      }

      setCurrent(i + 1);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    setZipBlob(blob);
    setStatus("done");
  }, [template, data, mapping, opts]);

  const downloadZip = () => {
    if (!zipBlob) return;
    const url = URL.createObjectURL(zipBlob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = `lumen_${data.length}_documents.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progress = data.length > 0 ? (current / data.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* PDF options */}
      <div className="rounded-xl p-4 flex-shrink-0"
        style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--stroke)" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text)" }}>Options PDF</p>
        <div className="flex flex-wrap gap-4">

          {/* Format */}
          <div>
            <label className="text-[11px] mb-1 block" style={{ color: "var(--muted)" }}>Format</label>
            <div className="flex gap-1.5">
              {(["A4", "Letter", "Legal"] as const).map((f) => (
                <button key={f} onClick={() => setOpts((o) => ({ ...o, format: f }))}
                  className="px-3 py-1 rounded-lg text-[11px] transition cursor-pointer"
                  style={opts.format === f
                    ? { background: "#0EA5E9", color: "#fff", fontWeight: 600 }
                    : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="text-[11px] mb-1 block" style={{ color: "var(--muted)" }}>Orientation</label>
            <div className="flex gap-1.5">
              {[{ label: "Portrait", v: false }, { label: "Paysage", v: true }].map(({ label: l, v }) => (
                <button key={l} onClick={() => setOpts((o) => ({ ...o, landscape: v }))}
                  className="px-3 py-1 rounded-lg text-[11px] transition cursor-pointer"
                  style={opts.landscape === v
                    ? { background: "#0EA5E9", color: "#fff", fontWeight: 600 }
                    : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Margins */}
          <div>
            <label className="text-[11px] mb-1 block" style={{ color: "var(--muted)" }}>Marges</label>
            <div className="flex gap-1.5">
              {MARGIN_PRESETS.map(({ label: l, value: v }) => (
                <button key={l} onClick={() => setMargin(l, v)}
                  className="px-3 py-1 rounded-lg text-[11px] transition cursor-pointer"
                  style={marginPreset === l
                    ? { background: "#0EA5E9", color: "#fff", fontWeight: 600 }
                    : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 flex-shrink-0 rounded-xl px-4 py-3"
        style={{ background: "rgba(14,165,233,.06)", border: "1px solid rgba(14,165,233,.18)" }}>
        <FileText size={16} style={{ color: "#0EA5E9", flexShrink: 0 }} />
        <p className="text-sm" style={{ color: "var(--text)" }}>
          <span className="font-bold" style={{ color: "#0EA5E9" }}>{data.length}</span>{" "}
          document{data.length !== 1 ? "s" : ""} à générer · format{" "}
          <span className="font-semibold">{opts.format}</span>{" "}
          {opts.landscape ? "paysage" : "portrait"}
        </p>
      </div>

      {/* Progress */}
      {status !== "idle" && (
        <div className="flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--muted)" }}>
            <span>
              {status === "running" && <span className="flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> {label}</span>}
              {status === "done"    && <span className="flex items-center gap-1.5" style={{ color: "#48BB78" }}><CheckCircle2 size={11} /> Terminé</span>}
              {status === "error"   && <span className="flex items-center gap-1.5" style={{ color: "var(--red)" }}><AlertCircle size={11} /> Erreur</span>}
            </span>
            <span>{current} / {data.length}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width:      `${progress}%`,
                background: status === "error" ? "var(--red)" : "linear-gradient(90deg, #0EA5E9, #BAE6FD)",
              }}
            />
          </div>
          {errMsg && (
            <p className="text-[11px] rounded-lg px-3 py-2"
              style={{ background: "rgba(207,35,40,.1)", color: "var(--red)", border: "1px solid rgba(207,35,40,.2)" }}>
              {errMsg}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between flex-shrink-0 mt-auto">
        <button onClick={onBack} disabled={status === "running"}
          className="px-4 py-2 rounded-xl text-sm transition cursor-pointer hover:opacity-80 disabled:opacity-40"
          style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
          ← Données
        </button>

        <div className="flex items-center gap-3">
          {status === "done" && zipBlob && (
            <button onClick={downloadZip}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
              style={{ background: "#48BB78", color: "#fff" }}>
              <Download size={14} /> Télécharger le ZIP
            </button>
          )}
          <button
            onClick={status === "running" ? undefined : handleGenerate}
            disabled={status === "running" || data.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#0EA5E9", color: "#fff" }}>
            {status === "running"
              ? <><Loader2 size={14} className="animate-spin" /> Génération…</>
              : <><FileText size={14} /> {status === "done" ? "Relancer" : "Générer les PDFs"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
