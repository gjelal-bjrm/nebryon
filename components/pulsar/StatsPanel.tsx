"use client";
/* ── Pulsar — statistics panel ───────────────────────────────────────────── */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronDown, Hash, AlignLeft, ToggleLeft, List, Calendar, Star, BarChart3,
  Download, ImageDown, FolderArchive, CheckSquare, Square, Palette,
} from "lucide-react";
import type { ColStats } from "../../lib/pulsar/stats";
import type { ColType } from "../../lib/pulsar/typeDetector";

interface StatsPanelProps {
  stats: ColStats[];
}

/* ── French labels ────────────────────────────────────────────────────────── */
const TYPE_LABEL_FR: Record<ColType, string> = {
  date:        "Date",
  boolean:     "Booléen",
  score:       "Score",
  numeric:     "Numérique",
  multichoice: "Choix multiple",
  categorical: "Catégoriel",
  text:        "Texte",
};

const TYPE_ICON: Record<ColType, React.ReactNode> = {
  numeric:     <Hash size={13} />,
  score:       <Star size={13} />,
  boolean:     <ToggleLeft size={13} />,
  multichoice: <List size={13} />,
  categorical: <BarChart3 size={13} />,
  text:        <AlignLeft size={13} />,
  date:        <Calendar size={13} />,
};

const TYPE_COLOR: Record<ColType, { bg: string; accent: string; solidBg: string }> = {
  date:        { bg: "rgba(99,179,237,.10)",  solidBg: "#162130", accent: "#63B3ED" },
  boolean:     { bg: "rgba(72,187,120,.10)",  solidBg: "#0f1f18", accent: "#48BB78" },
  score:       { bg: "rgba(246,173,85,.10)",  solidBg: "#211a0e", accent: "#F6AD55" },
  numeric:     { bg: "rgba(246,173,85,.08)",  solidBg: "#1e190e", accent: "#ECC94B" },
  multichoice: { bg: "rgba(159,122,234,.10)", solidBg: "#1a1530", accent: "#9F7AEA" },
  categorical: { bg: "rgba(108,99,255,.10)",  solidBg: "#14122a", accent: "#6C63FF" },
  text:        { bg: "rgba(160,174,192,.06)", solidBg: "#151a22", accent: "#A0AEC0" },
};

/* ── border color swatches ───────────────────────────────────────────────── */
const CARD_SWATCHES: Array<{ label: string; value: string | null }> = [
  { label: "Défaut",   value: null },
  { label: "Violet",   value: "#6C63FF" },
  { label: "Teal",     value: "#00C88A" },
  { label: "Bleu",     value: "#63B3ED" },
  { label: "Vert",     value: "#48BB78" },
  { label: "Ambre",    value: "#F6AD55" },
  { label: "Rouge",    value: "#FC8181" },
  { label: "Rose",     value: "#F687B3" },
  { label: "Or",       value: "#D4A84B" },
  { label: "Blanc",    value: "#E2E8F0" },
];

/* ── strip leading question number: "19. title" → "title" ───────────────── */
function cleanTitle(header: string): string {
  return header.replace(/^\d+[.)]\s*/, "").trim();
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
function safeName(header: string): string {
  return header.slice(0, 40).replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "col";
}

/**
 * Capture an element as PNG.
 * No backgroundColor passed → canvas corners stay transparent
 * so the element's own border-radius produces rounded corners in the output.
 */
async function cardToPng(el: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  return toPng(el, { pixelRatio: 2, cacheBust: true });
}

async function downloadSinglePng(el: HTMLElement, filename: string) {
  const dataUrl = await cardToPng(el);
  const a = document.createElement("a");
  a.href = dataUrl; a.download = filename; a.click();
}

async function downloadZip(entries: { el: HTMLElement; filename: string }[]) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const { el, filename } of entries) {
    const dataUrl = await cardToPng(el);
    zip.file(filename, dataUrl.split(",")[1], { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "pulsar_stats.zip"; a.click();
  URL.revokeObjectURL(url);
}

/* ── horizontal bar (shared between visible + export) ───────────────────── */
function FreqBar({ item, max, accent }: { item: { value: string; count: number; pct: number }; max: number; accent: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[11px] truncate min-w-0 flex-1" style={{ color: "var(--text)" }} title={item.value}>
        {item.value || <em style={{ color: "var(--muted)" }}>(vide)</em>}
      </span>
      <div className="w-28 shrink-0 rounded-full overflow-hidden h-2" style={{ background: "rgba(255,255,255,.08)" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: accent }} />
      </div>
      <span className="text-[10px] shrink-0 w-8 text-right" style={{ color: "var(--muted)" }}>{item.pct}%</span>
      <span className="text-[10px] shrink-0 w-6 text-right" style={{ color: "var(--muted)" }}>{item.count}</span>
    </div>
  );
}

/* ── Export-only FreqBar — inline styles, no Tailwind ───────────────────── */
function ExportFreqBar({ item, max, accent, textColor, mutedColor }: {
  item: { value: string; count: number; pct: number }; max: number;
  accent: string; textColor: string; mutedColor: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "2px 0" }}>
      <span style={{ fontSize: "11px", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: textColor }}>
        {item.value || "(vide)"}
      </span>
      <div style={{ width: "112px", flexShrink: 0, borderRadius: "999px", overflow: "hidden", height: "8px", background: "rgba(255,255,255,.10)" }}>
        <div style={{ height: "8px", borderRadius: "999px", width: `${(item.count / max) * 100}%`, backgroundColor: accent }} />
      </div>
      <span style={{ fontSize: "10px", flexShrink: 0, width: "36px", textAlign: "right", color: mutedColor }}>{item.pct}%</span>
      <span style={{ fontSize: "10px", flexShrink: 0, width: "24px", textAlign: "right", color: mutedColor }}>{item.count}</span>
    </div>
  );
}

/* ── score bar chart ─────────────────────────────────────────────────────── */
function ScoreChart({ freqs, accent }: { freqs: { value: string; count: number; pct: number }[]; accent: string }) {
  const max = Math.max(...freqs.map(f => f.count), 1);
  return (
    <div className="flex items-end gap-1 h-16 mt-1">
      {freqs.map(f => (
        <div key={f.value} className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-[9px]" style={{ color: "var(--muted)" }}>{f.count}</span>
          <div className="w-full rounded-t transition-all" style={{ height: `${Math.max((f.count / max) * 48, 2)}px`, backgroundColor: accent }} />
          <span className="text-[10px] font-bold" style={{ color: "var(--text)" }}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

function ExportScoreChart({ freqs, accent, textColor, mutedColor }: {
  freqs: { value: string; count: number; pct: number }[];
  accent: string; textColor: string; mutedColor: string;
}) {
  const max = Math.max(...freqs.map(f => f.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "64px", marginTop: "4px" }}>
      {freqs.map(f => (
        <div key={f.value} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <span style={{ fontSize: "9px", color: mutedColor }}>{f.count}</span>
          <div style={{ width: "100%", borderRadius: "4px 4px 0 0", height: `${Math.max((f.count / max) * 48, 2)}px`, backgroundColor: accent }} />
          <span style={{ fontSize: "10px", fontWeight: 700, color: textColor }}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── single column card ──────────────────────────────────────────────────── */
function ColCard({
  s, isSelected, borderColor, exportBg,
  onToggleSelect, onRegisterExportRef, onDownload, onColorChange,
}: {
  s:                   ColStats;
  isSelected:          boolean;
  borderColor:         string | null;
  exportBg:            string;
  onToggleSelect:      () => void;
  onRegisterExportRef: (el: HTMLDivElement | null) => void;
  onDownload:          () => void;
  onColorChange:       (color: string | null) => void;
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pickerOpen,  setPickerOpen]  = useState(false);

  const { bg, accent, solidBg } = TYPE_COLOR[s.type];
  const hasFreqs  = (s.frequencies?.length ?? 0) > 0;
  const topFreqs  = expanded ? (s.frequencies ?? []) : (s.frequencies ?? []).slice(0, 5);
  const allFreqs  = s.frequencies ?? [];
  const maxCount  = Math.max(...allFreqs.map(f => f.count), 1);

  const activeBorder = borderColor ?? (isSelected ? "var(--nebula)" : "var(--stroke)");
  const cardBg       = borderColor ? `${borderColor}18` : bg;
  const glowHex      = borderColor ?? "#6C63FF";

  // Export colours — resolved, no CSS vars
  const exportAccent  = accent.startsWith("var") ? "#6C63FF" : accent;
  const exportBorder  = borderColor ?? "#6C63FF";
  const exportBgFinal = borderColor ? `${borderColor}28` : solidBg;

  const handleDownload = async () => {
    setDownloading(true);
    try { await onDownload(); } finally { setDownloading(false); }
  };

  return (
    <>
      {/* ── Visible card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border:     `1.5px solid ${activeBorder}`,
          background: cardBg,
          transition: "border-color .25s, box-shadow .25s, background .25s",
          boxShadow:  isSelected
            ? `0 0 0 2.5px ${glowHex}55, 0 0 18px ${glowHex}35`
            : "none",
        }}
      >
        {/* header — two rows when title is long */}
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1.5 px-3 py-3">

          {/* first row: checkbox + icon + title */}
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <button
              onClick={onToggleSelect}
              title={isSelected ? "Désélectionner" : "Sélectionner"}
              className="shrink-0 mt-0.5 transition hover:opacity-70 cursor-pointer"
              style={{ color: isSelected ? "var(--nebula)" : "var(--muted)" }}>
              {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            </button>
            <span className="shrink-0 mt-0.5" style={{ color: accent }}>{TYPE_ICON[s.type]}</span>
            <span className="flex-1 min-w-0 text-xs font-semibold leading-snug" style={{ color: "var(--text)" }}>
              {s.header}
            </span>
          </div>

          {/* second row: type badge + palette + download */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <span className="text-[10px] rounded-full px-2 py-0.5" style={{ background: "rgba(255,255,255,.08)", color: "var(--muted)" }}>
              {TYPE_LABEL_FR[s.type]}
            </span>

            {/* border color picker */}
            <div className="relative shrink-0">
              <button
                onClick={() => setPickerOpen(v => !v)}
                title="Changer la couleur du cadre"
                className="shrink-0 rounded-lg p-1 transition hover:opacity-80 cursor-pointer"
                style={{
                  color:      borderColor ?? "var(--muted)",
                  border:     "1px solid rgba(255,255,255,.1)",
                  background: borderColor ? `${borderColor}22` : "transparent",
                }}>
                <Palette size={13} />
              </button>

              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                  <div
                    className="absolute right-0 top-full z-50 mt-1.5 rounded-xl p-2.5 shadow-xl"
                    style={{ border: "1px solid var(--stroke)", background: "var(--card)", minWidth: 160 }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                      Couleur du cadre
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {CARD_SWATCHES.map(sw => (
                        <button
                          key={sw.label}
                          onClick={() => { onColorChange(sw.value); setPickerOpen(false); }}
                          title={sw.label}
                          className="rounded-lg transition hover:scale-110 cursor-pointer"
                          style={{
                            width: 24, height: 24,
                            background: sw.value ?? "var(--surface)",
                            border: sw.value === null
                              ? "1.5px dashed var(--stroke)"
                              : (borderColor === sw.value ? "2px solid white" : `1.5px solid ${sw.value}`),
                            outline:       (sw.value === null && borderColor === null) ? "2px solid var(--nebula)" : "none",
                            outlineOffset: 1,
                          }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--stroke)" }}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="color"
                          defaultValue={borderColor ?? "#6C63FF"}
                          onChange={e => onColorChange(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                          style={{ background: "none" }}
                        />
                        <span className="text-[10px]" style={{ color: "var(--muted)" }}>Couleur personnalisée</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* download PNG button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              title="Télécharger en PNG"
              className="shrink-0 rounded-lg p-1 transition hover:opacity-80 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              style={{ color: accent, border: "1px solid rgba(255,255,255,.1)" }}>
              {downloading
                ? <span className="block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                : <ImageDown size={13} />}
            </button>
          </div>{/* end second row */}
        </div>{/* end header */}

        {/* body */}
        <div className="px-4 pb-4 space-y-3">
          <div className="flex gap-4 flex-wrap">
            <Stat label="Rempli"          value={`${s.filled}`}      sub={`${(100 - s.emptyPct).toFixed(0)}%`} accent={accent} />
            <Stat label="Vide"            value={`${s.empty}`}       sub={`${s.emptyPct.toFixed(0)}%`}         accent="var(--muted)" />
            {s.uniqueCount != null && <Stat label="Valeurs uniques" value={`${s.uniqueCount}`} accent={accent} />}
          </div>

          {(s.type === "numeric" || s.type === "score") && s.min != null && (
            <div className="grid grid-cols-5 gap-2">
              {([["Min", s.min], ["Max", s.max], ["Moy.", s.avg], ["Méd.", s.median], ["σ", s.stddev]] as [string, number][]).map(([l, v]) => (
                <div key={l} className="rounded-lg p-2 text-center" style={{ background: "rgba(255,255,255,.06)" }}>
                  <p className="text-[9px] mb-0.5" style={{ color: "var(--muted)" }}>{l}</p>
                  <p className="text-xs font-bold" style={{ color: accent }}>{v}</p>
                </div>
              ))}
            </div>
          )}

          {s.type === "score" && (s.frequencies?.length ?? 0) > 0 && (
            <ScoreChart freqs={s.frequencies!} accent={accent} />
          )}

          {hasFreqs && s.type !== "score" && (
            <div className="space-y-0.5">
              {topFreqs.map(f => <FreqBar key={f.value} item={f} max={maxCount} accent={accent} />)}
              {allFreqs.length > 5 && (
                <button onClick={() => setExpanded(v => !v)}
                  className="flex items-center gap-1 mt-1 text-[11px] transition hover:opacity-80 cursor-pointer" style={{ color: accent }}>
                  <ChevronDown size={11} style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform .2s" }} />
                  {expanded ? "Voir moins" : `Voir ${allFreqs.length - 5} de plus`}
                </button>
              )}
            </div>
          )}

          {s.type === "text" && (
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              {s.uniqueCount} réponse{(s.uniqueCount ?? 0) > 1 ? "s" : ""} unique{(s.uniqueCount ?? 0) > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* ── Off-screen export div (captured for PNG) ──────────────────────── */}
      {/* Uses inline styles only + resolved colors — no Tailwind, no CSS vars */}
      <div
        ref={onRegisterExportRef}
        aria-hidden="true"
        style={{
          position:     "fixed",
          left:         "-9999px",
          top:          0,
          width:        "560px",
          background:   exportBgFinal,
          border:       `2px solid ${exportBorder}`,
          borderRadius: "16px",
          overflow:     "hidden",
          fontFamily:   "inherit",
          pointerEvents:"none",
          zIndex:       -1,
        }}
      >
        {/* export header: icon + clean title (no number prefix) */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "20px 20px 0" }}>
          <span style={{ color: exportAccent, flexShrink: 0, marginTop: "2px" }}>{TYPE_ICON[s.type]}</span>
          <span style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.5, color: exportBg === "#fff" ? "#1a1a2e" : "#f0f0f8" }}>
            {cleanTitle(s.header)}
          </span>
        </div>

        {/* export body */}
        <div style={{ padding: "14px 20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* stats row */}
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <ExportStat label="REMPLI"          value={`${s.filled}`}      sub={`${(100 - s.emptyPct).toFixed(0)}%`} accent={exportAccent} />
            <ExportStat label="VIDE"            value={`${s.empty}`}       sub={`${s.emptyPct.toFixed(0)}%`}         accent="#718096" />
            {s.uniqueCount != null && <ExportStat label="VALEURS UNIQUES" value={`${s.uniqueCount}`} accent={exportAccent} />}
          </div>

          {/* numeric / score grid */}
          {(s.type === "numeric" || s.type === "score") && s.min != null && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "8px" }}>
              {([["Min", s.min], ["Max", s.max], ["Moy.", s.avg], ["Méd.", s.median], ["σ", s.stddev]] as [string, number][]).map(([l, v]) => (
                <div key={l} style={{ borderRadius: "8px", padding: "8px", textAlign: "center", background: "rgba(255,255,255,.07)" }}>
                  <p style={{ fontSize: "9px", marginBottom: "2px", color: "#718096" }}>{l}</p>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: exportAccent }}>{v}</p>
                </div>
              ))}
            </div>
          )}

          {/* score chart */}
          {s.type === "score" && allFreqs.length > 0 && (
            <ExportScoreChart freqs={allFreqs} accent={exportAccent} textColor="#f0f0f8" mutedColor="#718096" />
          )}

          {/* frequency bars — ALL items shown */}
          {hasFreqs && s.type !== "score" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {allFreqs.map(f => (
                <ExportFreqBar key={f.value} item={f} max={maxCount} accent={exportAccent} textColor="#f0f0f8" mutedColor="#718096" />
              ))}
            </div>
          )}

          {/* text type */}
          {s.type === "text" && (
            <p style={{ fontSize: "11px", color: "#718096" }}>
              {s.uniqueCount} réponse{(s.uniqueCount ?? 0) > 1 ? "s" : ""} unique{(s.uniqueCount ?? 0) > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="text-sm font-bold leading-none" style={{ color: accent }}>{value}
        {sub && <span className="text-[10px] font-normal ml-1" style={{ color: "var(--muted)" }}>{sub}</span>}
      </p>
    </div>
  );
}

function ExportStat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div>
      <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px", color: "#718096" }}>{label}</p>
      <p style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1, color: accent }}>
        {value}
        {sub && <span style={{ fontSize: "10px", fontWeight: 400, marginLeft: "4px", color: "#718096" }}>{sub}</span>}
      </p>
    </div>
  );
}

/* ── main panel ──────────────────────────────────────────────────────────── */
export default function StatsPanel({ stats }: StatsPanelProps) {
  const [filter,   setFilter]   = useState<ColType | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDownloading,     setBulkDownloading]     = useState<"all" | "selection" | null>(null);
  const [bulkColorPickerOpen, setBulkColorPickerOpen] = useState(false);
  const [cardColors,          setCardColors]           = useState<Map<string, string>>(new Map());
  const [exportBg,            setExportBg]             = useState("#0d1117");

  /* resolve page background once on mount */
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    if (v) setExportBg(v);
  }, []);

  const exportCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const types: ColType[] = ["score", "boolean", "categorical", "multichoice", "numeric", "date", "text"];
  const filtered = filter === "all" ? stats : stats.filter(s => s.type === filter);

  const toggleSelect = useCallback((header: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(header) ? next.delete(header) : next.add(header);
      return next;
    });
  }, []);

  const setCardColor = useCallback((header: string, color: string | null) => {
    setCardColors(prev => {
      const next = new Map(prev);
      if (color) next.set(header, color);
      else next.delete(header);
      return next;
    });
  }, []);

  const applyColorToSelection = useCallback((color: string | null) => {
    setCardColors(prev => {
      const next = new Map(prev);
      selected.forEach(header => {
        if (color) next.set(header, color);
        else next.delete(header);
      });
      return next;
    });
    setBulkColorPickerOpen(false);
  }, [selected]);

  const selectAll   = () => setSelected(new Set(filtered.map(s => s.header)));
  const deselectAll = () => setSelected(new Set());
  const allSelected = filtered.length > 0 && filtered.every(s => selected.has(s.header));

  const handleDownloadAll = async () => {
    setBulkDownloading("all");
    try {
      const entries = filtered
        .map(s => ({ el: exportCardRefs.current.get(s.header)!, filename: `${safeName(s.header)}.png` }))
        .filter(e => !!e.el);
      await downloadZip(entries);
    } finally { setBulkDownloading(null); }
  };

  const handleDownloadSelection = async () => {
    setBulkDownloading("selection");
    try {
      const entries = filtered
        .filter(s => selected.has(s.header))
        .map(s => ({ el: exportCardRefs.current.get(s.header)!, filename: `${safeName(s.header)}.png` }))
        .filter(e => !!e.el);
      if (entries.length === 0) return;
      if (entries.length === 1) {
        await downloadSinglePng(entries[0].el, entries[0].filename);
      } else {
        await downloadZip(entries);
      }
    } finally { setBulkDownloading(null); }
  };

  return (
    <div className="space-y-4">

      {/* ── top bar: filter tabs + bulk actions ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* type filter tabs */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {(["all", ...types] as const).map(t => {
            const cnt = t === "all" ? stats.length : stats.filter(s => s.type === t).length;
            if (cnt === 0 && t !== "all") return null;
            const label = t === "all" ? `Tout (${cnt})` : `${TYPE_LABEL_FR[t]} (${cnt})`;
            return (
              <button key={t} onClick={() => setFilter(t)}
                className="rounded-full px-3 py-1 text-[11px] transition cursor-pointer"
                style={filter === t
                  ? { background: "var(--nebula)", color: "#fff", border: "1px solid var(--nebula)" }
                  : { border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)", color: "var(--muted)" }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* bulk actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* select all toggle */}
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition cursor-pointer hover:opacity-80"
            style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)", color: "var(--muted)" }}>
            {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>

          {/* bulk colour picker */}
          <div className="relative">
            <button
              onClick={() => setBulkColorPickerOpen(v => !v)}
              disabled={selected.size === 0}
              title={`Colorier les ${selected.size} carte${selected.size > 1 ? "s" : ""} sélectionnée${selected.size > 1 ? "s" : ""}`}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
              style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)", color: "var(--muted)" }}>
              <Palette size={13} />
              Colorier ({selected.size})
            </button>

            {bulkColorPickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBulkColorPickerOpen(false)} />
                <div
                  className="absolute left-0 top-full z-50 mt-1.5 rounded-xl p-2.5 shadow-xl"
                  style={{ border: "1px solid var(--stroke)", background: "var(--card)", minWidth: 172 }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>
                    Couleur des {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {CARD_SWATCHES.map(sw => (
                      <button
                        key={sw.label}
                        onClick={() => applyColorToSelection(sw.value)}
                        title={sw.label}
                        className="rounded-lg transition hover:scale-110 cursor-pointer"
                        style={{
                          width: 24, height: 24,
                          background: sw.value ?? "var(--surface)",
                          border: sw.value === null ? "1.5px dashed var(--stroke)" : `1.5px solid ${sw.value}`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--stroke)" }}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="color"
                        defaultValue="#6C63FF"
                        onChange={e => applyColorToSelection(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                        style={{ background: "none" }}
                      />
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>Couleur personnalisée</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* download all */}
          <button
            onClick={handleDownloadAll}
            disabled={bulkDownloading !== null}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:opacity-80"
            style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)", color: "var(--text)" }}
            title="Télécharger toutes les catégories (ZIP)">
            {bulkDownloading === "all"
              ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              : <FolderArchive size={13} />}
            Tout télécharger
          </button>

          {/* download selection */}
          <button
            onClick={handleDownloadSelection}
            disabled={selected.size === 0 || bulkDownloading !== null}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:opacity-80"
            style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.12)", color: "var(--halo)" }}
            title={`Télécharger ${selected.size} carte${selected.size > 1 ? "s" : ""} sélectionnée${selected.size > 1 ? "s" : ""}`}>
            {bulkDownloading === "selection"
              ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              : <Download size={13} />}
            Sélection ({selected.size})
          </button>
        </div>
      </div>

      {/* ── cards grid ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map(s => (
          <ColCard
            key={s.header}
            s={s}
            isSelected={selected.has(s.header)}
            borderColor={cardColors.get(s.header) ?? null}
            exportBg={exportBg}
            onToggleSelect={() => toggleSelect(s.header)}
            onRegisterExportRef={el => {
              if (el) exportCardRefs.current.set(s.header, el);
              else    exportCardRefs.current.delete(s.header);
            }}
            onDownload={async () => {
              const el = exportCardRefs.current.get(s.header);
              if (el) await downloadSinglePng(el, `${safeName(s.header)}.png`);
            }}
            onColorChange={color => setCardColor(s.header, color)}
          />
        ))}
      </div>
    </div>
  );
}
