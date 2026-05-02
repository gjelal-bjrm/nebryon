"use client";
/* ── Pulsar — statistics panel ───────────────────────────────────────────── */

import { useState, useRef, useCallback } from "react";
import {
  ChevronDown, Hash, AlignLeft, ToggleLeft, List, Calendar, Star, BarChart3,
  Download, ImageDown, FolderArchive, CheckSquare, Square,
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

const TYPE_COLOR: Record<ColType, { bg: string; accent: string }> = {
  date:        { bg: "rgba(99,179,237,.10)",  accent: "#63B3ED" },
  boolean:     { bg: "rgba(72,187,120,.10)",  accent: "#48BB78" },
  score:       { bg: "rgba(246,173,85,.10)",  accent: "#F6AD55" },
  numeric:     { bg: "rgba(246,173,85,.08)",  accent: "#ECC94B" },
  multichoice: { bg: "rgba(159,122,234,.10)", accent: "#9F7AEA" },
  categorical: { bg: "rgba(108,99,255,.10)",  accent: "var(--nebula)" },
  text:        { bg: "rgba(160,174,192,.06)", accent: "var(--muted)" },
};

/* ── helpers ─────────────────────────────────────────────────────────────── */
function safeName(header: string): string {
  return header.slice(0, 40).replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "col";
}

async function cardToPng(el: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--card").trim() || "#111428";
  return toPng(el, { backgroundColor: bg, pixelRatio: 2, cacheBust: true });
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

/* ── horizontal bar ──────────────────────────────────────────────────────── */
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

/* ── single column card ──────────────────────────────────────────────────── */
function ColCard({
  s, isSelected, onToggleSelect, onRegisterRef, onDownload,
}: {
  s:             ColStats;
  isSelected:    boolean;
  onToggleSelect: () => void;
  onRegisterRef: (el: HTMLDivElement | null) => void;
  onDownload:    () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { bg, accent } = TYPE_COLOR[s.type];
  const hasFreqs = (s.frequencies?.length ?? 0) > 0;
  const topFreqs = expanded ? (s.frequencies ?? []) : (s.frequencies ?? []).slice(0, 5);
  const maxCount = Math.max(...(s.frequencies ?? []).map(f => f.count), 1);

  const handleDownload = async () => {
    setDownloading(true);
    try { await onDownload(); } finally { setDownloading(false); }
  };

  return (
    <div ref={onRegisterRef} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--stroke)", background: bg }}>
      {/* header */}
      <div className="flex items-center gap-2 px-3 py-3">
        {/* checkbox */}
        <button onClick={onToggleSelect} className="shrink-0 transition hover:opacity-70" style={{ color: isSelected ? "var(--nebula)" : "var(--muted)" }}>
          {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
        </button>

        <span style={{ color: accent }}>{TYPE_ICON[s.type]}</span>
        <span className="flex-1 min-w-0 text-xs font-semibold truncate" style={{ color: "var(--text)" }} title={s.header}>
          {s.header}
        </span>
        <span className="text-[10px] shrink-0 rounded-full px-2 py-0.5" style={{ background: "rgba(255,255,255,.08)", color: "var(--muted)" }}>
          {TYPE_LABEL_FR[s.type]}
        </span>

        {/* download PNG button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          title="Télécharger en PNG"
          className="shrink-0 rounded-lg p-1 transition hover:opacity-80 disabled:opacity-40"
          style={{ color: accent, border: "1px solid rgba(255,255,255,.1)" }}>
          {downloading ? <span className="block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" /> : <ImageDown size={13} />}
        </button>
      </div>

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
            {(s.frequencies?.length ?? 0) > 5 && (
              <button onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 mt-1 text-[11px] transition hover:opacity-80" style={{ color: accent }}>
                <ChevronDown size={11} style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform .2s" }} />
                {expanded ? "Voir moins" : `Voir ${s.frequencies!.length - 5} de plus`}
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

/* ── main panel ──────────────────────────────────────────────────────────── */
export default function StatsPanel({ stats }: StatsPanelProps) {
  const [filter,   setFilter]   = useState<ColType | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState<"all" | "selection" | null>(null);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const types: ColType[] = ["score", "boolean", "categorical", "multichoice", "numeric", "date", "text"];
  const filtered = filter === "all" ? stats : stats.filter(s => s.type === filter);

  const toggleSelect = useCallback((header: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(header) ? next.delete(header) : next.add(header);
      return next;
    });
  }, []);

  const selectAll  = () => setSelected(new Set(filtered.map(s => s.header)));
  const deselectAll = () => setSelected(new Set());
  const allSelected = filtered.length > 0 && filtered.every(s => selected.has(s.header));

  /* download all visible cards */
  const handleDownloadAll = async () => {
    setBulkDownloading("all");
    try {
      const entries = filtered
        .map(s => ({ el: cardRefs.current.get(s.header)!, filename: `${safeName(s.header)}.png` }))
        .filter(e => !!e.el);
      await downloadZip(entries);
    } finally { setBulkDownloading(null); }
  };

  /* download only selected cards */
  const handleDownloadSelection = async () => {
    setBulkDownloading("selection");
    try {
      const entries = filtered
        .filter(s => selected.has(s.header))
        .map(s => ({ el: cardRefs.current.get(s.header)!, filename: `${safeName(s.header)}.png` }))
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
                className="rounded-full px-3 py-1 text-[11px] transition"
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
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition"
            style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)", color: "var(--muted)" }}>
            {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>

          {/* download all */}
          <button
            onClick={handleDownloadAll}
            disabled={bulkDownloading !== null}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition disabled:opacity-50"
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
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition disabled:opacity-40"
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
            onToggleSelect={() => toggleSelect(s.header)}
            onRegisterRef={el => {
              if (el) cardRefs.current.set(s.header, el);
              else    cardRefs.current.delete(s.header);
            }}
            onDownload={async () => {
              const el = cardRefs.current.get(s.header);
              if (el) await downloadSinglePng(el, `${safeName(s.header)}.png`);
            }}
          />
        ))}
      </div>
    </div>
  );
}
