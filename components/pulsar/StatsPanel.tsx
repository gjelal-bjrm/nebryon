"use client";
/* ── Pulsar — statistics panel ───────────────────────────────────────────── */

import { useState } from "react";
import { ChevronDown, Hash, AlignLeft, ToggleLeft, List, Calendar, Star, BarChart3 } from "lucide-react";
import type { ColStats } from "../../lib/pulsar/stats";
import type { ColType } from "../../lib/pulsar/typeDetector";

interface StatsPanelProps {
  stats: ColStats[];
}

/* ── type icon + color ───────────────────────────────────────────────────── */
const TYPE_ICON: Record<ColType, React.ReactNode> = {
  numeric:     <Hash size={13}/>,
  score:       <Star size={13}/>,
  boolean:     <ToggleLeft size={13}/>,
  multichoice: <List size={13}/>,
  categorical: <BarChart3 size={13}/>,
  text:        <AlignLeft size={13}/>,
  date:        <Calendar size={13}/>,
};
const TYPE_COLOR: Record<ColType, { bg: string; accent: string }> = {
  date:        { bg:"rgba(99,179,237,.10)",  accent:"#63B3ED" },
  boolean:     { bg:"rgba(72,187,120,.10)",  accent:"#48BB78" },
  score:       { bg:"rgba(246,173,85,.10)",  accent:"#F6AD55" },
  numeric:     { bg:"rgba(246,173,85,.08)",  accent:"#ECC94B" },
  multichoice: { bg:"rgba(159,122,234,.10)", accent:"#9F7AEA" },
  categorical: { bg:"rgba(108,99,255,.10)",  accent:"var(--nebula)" },
  text:        { bg:"rgba(160,174,192,.06)", accent:"var(--muted)" },
};

/* ── horizontal bar chart ────────────────────────────────────────────────── */
function FreqBar({ item, max, accent }: { item: { value:string; count:number; pct:number }; max:number; accent:string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[11px] truncate min-w-0 flex-1" style={{ color:"var(--text)" }} title={item.value}>
        {item.value || <em style={{ color:"var(--muted)" }}>(vide)</em>}
      </span>
      <div className="w-28 shrink-0 rounded-full overflow-hidden h-2" style={{ background:"rgba(255,255,255,.08)" }}>
        <div className="h-2 rounded-full transition-all"
          style={{ width:`${(item.count / max) * 100}%`, backgroundColor: accent }} />
      </div>
      <span className="text-[10px] shrink-0 w-8 text-right" style={{ color:"var(--muted)" }}>{item.pct}%</span>
      <span className="text-[10px] shrink-0 w-6 text-right" style={{ color:"var(--muted)" }}>{item.count}</span>
    </div>
  );
}

/* ── score bar chart (compact visual) ───────────────────────────────────── */
function ScoreChart({ freqs, accent }: { freqs: { value:string; count:number; pct:number }[]; accent:string }) {
  const max = Math.max(...freqs.map((f) => f.count), 1);
  return (
    <div className="flex items-end gap-1 h-16 mt-1">
      {freqs.map((f) => (
        <div key={f.value} className="flex-1 flex flex-col items-center gap-0.5">
          <span className="text-[9px]" style={{ color:"var(--muted)" }}>{f.count}</span>
          <div className="w-full rounded-t transition-all" style={{
            height: `${Math.max((f.count / max) * 48, 2)}px`,
            backgroundColor: accent,
          }} />
          <span className="text-[10px] font-bold" style={{ color:"var(--text)" }}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── single column card ───────────────────────────────────────────────────── */
function ColCard({ s }: { s: ColStats }) {
  const [expanded, setExpanded] = useState(false);
  const { bg, accent } = TYPE_COLOR[s.type];
  const hasFreqs = (s.frequencies?.length ?? 0) > 0;
  const topFreqs = expanded ? (s.frequencies ?? []) : (s.frequencies ?? []).slice(0, 5);
  const maxCount = Math.max(...(s.frequencies ?? []).map((f) => f.count), 1);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--stroke)", background: bg }}>
      {/* header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span style={{ color: accent }}>{TYPE_ICON[s.type]}</span>
        <span className="flex-1 min-w-0 text-xs font-semibold truncate" style={{ color:"var(--text)" }} title={s.header}>
          {s.header}
        </span>
        <span className="text-[10px] shrink-0 rounded-full px-2 py-0.5"
          style={{ background:"rgba(255,255,255,.08)", color:"var(--muted)" }}>
          {s.type}
        </span>
      </div>

      {/* body */}
      <div className="px-4 pb-4 space-y-3">
        {/* meta row */}
        <div className="flex gap-4 flex-wrap">
          <Stat label="Rempli" value={`${s.filled}`} sub={`${(100 - s.emptyPct).toFixed(0)}%`} accent={accent} />
          <Stat label="Vide" value={`${s.empty}`} sub={`${s.emptyPct.toFixed(0)}%`} accent="var(--muted)" />
          {s.uniqueCount != null && (
            <Stat label="Valeurs uniques" value={`${s.uniqueCount}`} accent={accent} />
          )}
        </div>

        {/* numeric stats */}
        {(s.type === "numeric" || s.type === "score") && s.min != null && (
          <div className="grid grid-cols-5 gap-2">
            {[["Min",s.min],["Max",s.max],["Moy.",s.avg],["Méd.",s.median],["σ",s.stddev]].map(([l,v]) => (
              <div key={l as string} className="rounded-lg p-2 text-center"
                style={{ background:"rgba(255,255,255,.06)" }}>
                <p className="text-[9px] mb-0.5" style={{ color:"var(--muted)" }}>{l as string}</p>
                <p className="text-xs font-bold" style={{ color: accent }}>{v as number}</p>
              </div>
            ))}
          </div>
        )}

        {/* score visual */}
        {s.type === "score" && s.frequencies && s.frequencies.length > 0 && (
          <ScoreChart freqs={s.frequencies} accent={accent} />
        )}

        {/* frequency bars */}
        {hasFreqs && s.type !== "score" && (
          <div className="space-y-0.5">
            {topFreqs.map((f) => (
              <FreqBar key={f.value} item={f} max={maxCount} accent={accent} />
            ))}
            {(s.frequencies?.length ?? 0) > 5 && (
              <button onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 mt-1 text-[11px] transition hover:opacity-80"
                style={{ color: accent }}>
                <ChevronDown size={11} style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform .2s" }} />
                {expanded ? "Voir moins" : `Voir ${(s.frequencies!.length - 5)} de plus`}
              </button>
            )}
          </div>
        )}

        {/* text column */}
        {s.type === "text" && (
          <p className="text-[11px]" style={{ color:"var(--muted)" }}>
            {s.uniqueCount} réponse{(s.uniqueCount ?? 0) > 1 ? "s" : ""} unique{(s.uniqueCount ?? 0) > 1 ? "s" : ""} · analyse textuelle non disponible
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label:string; value:string; sub?:string; accent:string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color:"var(--muted)" }}>{label}</p>
      <p className="text-sm font-bold leading-none" style={{ color: accent }}>{value}
        {sub && <span className="text-[10px] font-normal ml-1" style={{ color:"var(--muted)" }}>{sub}</span>}
      </p>
    </div>
  );
}

/* ── main panel ──────────────────────────────────────────────────────────── */
export default function StatsPanel({ stats }: StatsPanelProps) {
  const [filter, setFilter] = useState<ColType | "all">("all");

  const types: ColType[] = ["score","boolean","categorical","multichoice","numeric","date","text"];
  const filtered = filter === "all" ? stats : stats.filter((s) => s.type === filter);

  return (
    <div className="space-y-4">
      {/* filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", ...types] as const).map((t) => {
          const cnt = t === "all" ? stats.length : stats.filter((s) => s.type === t).length;
          if (cnt === 0 && t !== "all") return null;
          return (
            <button key={t} onClick={() => setFilter(t)}
              className="rounded-full px-3 py-1 text-[11px] transition"
              style={filter === t
                ? { background:"var(--nebula)", color:"#fff", border:"1px solid var(--nebula)" }
                : { border:"1px solid var(--stroke)", background:"rgba(255,255,255,.04)", color:"var(--muted)" }}>
              {t === "all" ? `Tout (${cnt})` : `${t} (${cnt})`}
            </button>
          );
        })}
      </div>

      {/* grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((s) => <ColCard key={s.header} s={s} />)}
      </div>
    </div>
  );
}
