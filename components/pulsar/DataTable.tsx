"use client";
/* ── Pulsar — sortable / filterable data table ───────────────────────────── */

import { useState, useMemo, useCallback } from "react";
import {
  ChevronUp, ChevronDown, ChevronsUpDown, Download,
  Search, Columns3, X, Plus, SlidersHorizontal,
} from "lucide-react";
import type { ColType } from "../../lib/pulsar/typeDetector";

interface DataTableProps {
  headers: string[];
  rows:    Record<string, string>[];
  types:   Record<string, ColType>;
}

type SortDir   = "asc" | "desc" | null;
type SearchMode = "simple" | "advanced";
type Operator   = "contains" | "equals" | "starts" | "ends" | "empty" | "notempty";
type LogicOp    = "AND" | "OR";

interface Condition {
  id:       string;
  column:   string;
  operator: Operator;
  value:    string;
}

const PAGE_SIZE = 30;

const OP_LABELS: Record<Operator, string> = {
  contains:  "contient",
  equals:    "est égal à",
  starts:    "commence par",
  ends:      "se termine par",
  empty:     "est vide",
  notempty:  "n'est pas vide",
};

/* ── type badge ───────────────────────────────────────────────────────────── */
const TYPE_COLOR: Record<ColType, string> = {
  date:        "rgba(99,179,237,.25)",
  boolean:     "rgba(72,187,120,.25)",
  score:       "rgba(246,173,85,.25)",
  numeric:     "rgba(246,173,85,.18)",
  multichoice: "rgba(159,122,234,.25)",
  categorical: "rgba(108,99,255,.25)",
  text:        "rgba(160,174,192,.15)",
};
const TYPE_LABEL: Record<ColType, string> = {
  date:        "date",
  boolean:     "bool",
  score:       "score",
  numeric:     "num",
  multichoice: "multi",
  categorical: "catég.",
  text:        "texte",
};

/* ── CSV / JSON export ────────────────────────────────────────────────────── */
function exportData(rows: Record<string, string>[], headers: string[], fmt: "csv" | "json") {
  let content: string, mime: string, ext: string;
  if (fmt === "csv") {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    content = [headers.map(esc).join(","), ...rows.map(r => headers.map(h => esc(r[h] ?? "")).join(","))].join("\r\n");
    mime = "text/csv;charset=utf-8;"; ext = "csv";
  } else {
    content = JSON.stringify(rows.map(r => { const o: Record<string, string> = {}; headers.forEach(h => { o[h] = r[h] ?? ""; }); return o; }), null, 2);
    mime = "application/json"; ext = "json";
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `pulsar_export.${ext}`; a.click();
  URL.revokeObjectURL(url);
}

function newCondition(column: string): Condition {
  return { id: Math.random().toString(36).slice(2), column, operator: "contains", value: "" };
}

/* ── main component ───────────────────────────────────────────────────────── */
export default function DataTable({ headers, rows, types }: DataTableProps) {
  const [sortCol,  setSortCol]  = useState<string | null>(null);
  const [sortDir,  setSortDir]  = useState<SortDir>(null);
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [visibleCols, setVisible] = useState<Set<string>>(new Set(headers));
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [exportOpen,    setExportOpen]    = useState(false);

  /* advanced search */
  const [searchMode, setSearchMode] = useState<SearchMode>("simple");
  const [conditions, setConditions] = useState<Condition[]>([newCondition(headers[0] ?? "")]);
  const [condLogic,  setCondLogic]  = useState<LogicOp>("AND");

  const handleSort = useCallback((col: string) => {
    if (sortCol !== col) { setSortCol(col); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortCol(null); setSortDir(null); }
    setPage(1);
  }, [sortCol, sortDir]);

  const visHeaders = useMemo(() => headers.filter(h => visibleCols.has(h)), [headers, visibleCols]);

  /* condition helpers */
  const addCondition    = () => setConditions(c => [...c, newCondition(headers[0] ?? "")]);
  const removeCondition = (id: string) => setConditions(c => c.filter(x => x.id !== id));
  const updateCondition = (id: string, patch: Partial<Condition>) =>
    setConditions(c => c.map(x => x.id === id ? { ...x, ...patch } : x));

  /* apply condition to a row */
  function matchCondition(row: Record<string, string>, cond: Condition): boolean {
    const val = (row[cond.column] ?? "").toLowerCase();
    const q   = cond.value.toLowerCase();
    switch (cond.operator) {
      case "contains":  return val.includes(q);
      case "equals":    return val === q;
      case "starts":    return val.startsWith(q);
      case "ends":      return val.endsWith(q);
      case "empty":     return val === "";
      case "notempty":  return val !== "";
    }
  }

  /* filtered + sorted rows */
  const processed = useMemo(() => {
    let out = rows;

    if (searchMode === "simple") {
      if (search.trim()) {
        const q = search.toLowerCase();
        out = out.filter(r => headers.some(h => (r[h] ?? "").toLowerCase().includes(q)));
      }
    } else {
      const active = conditions.filter(c => c.column && (c.operator === "empty" || c.operator === "notempty" || c.value.trim() !== ""));
      if (active.length) {
        out = out.filter(row => {
          const results = active.map(c => matchCondition(row, c));
          return condLogic === "AND" ? results.every(Boolean) : results.some(Boolean);
        });
      }
    }

    if (sortCol && sortDir) {
      out = [...out].sort((a, b) => {
        const av = a[sortCol] ?? "", bv = b[sortCol] ?? "";
        const t = types[sortCol];
        const cmp = (t === "numeric" || t === "score")
          ? parseFloat(av || "0") - parseFloat(bv || "0")
          : av.localeCompare(bv, "fr", { sensitivity: "base" });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, searchMode, conditions, condLogic, sortCol, sortDir, headers, types]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const pageRows   = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">

      {/* ── toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* simple search */}
        {searchMode === "simple" && (
          <div className="relative flex-1 min-w-40">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher dans toutes les colonnes…"
              className="w-full rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none"
              style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)", color: "var(--text)" }}
            />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}><X size={12} /></button>}
          </div>
        )}

        {/* advanced toggle */}
        <button
          onClick={() => { setSearchMode(m => m === "simple" ? "advanced" : "simple"); setPage(1); }}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition"
          style={searchMode === "advanced"
            ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.15)", color: "var(--halo)" }
            : { border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)", color: "var(--muted)" }}>
          <SlidersHorizontal size={13} />
          {searchMode === "advanced" ? "Recherche simple" : "Avancée"}
        </button>

        {/* column picker */}
        <div className="relative">
          <button onClick={() => setColPickerOpen(v => !v)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition"
            style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)", color: "var(--text)" }}>
            <Columns3 size={13} /> Colonnes ({visibleCols.size}/{headers.length})
          </button>
          {colPickerOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 rounded-xl p-3 shadow-xl w-64 max-h-80 overflow-y-auto"
              style={{ border: "1px solid var(--stroke)", background: "var(--card)" }}>
              <div className="flex justify-between mb-2">
                <button className="text-[10px] underline" style={{ color: "var(--nebula)" }} onClick={() => setVisible(new Set(headers))}>Tout sélectionner</button>
                <button className="text-[10px] underline" style={{ color: "var(--muted)" }} onClick={() => setVisible(new Set())}>Tout désélectionner</button>
              </div>
              {headers.map(h => (
                <label key={h} className="flex items-center gap-2 py-0.5 cursor-pointer text-xs" style={{ color: "var(--text)" }}>
                  <input type="checkbox" checked={visibleCols.has(h)} onChange={e => { const s = new Set(visibleCols); e.target.checked ? s.add(h) : s.delete(h); setVisible(s); }} className="accent-[var(--nebula)]" />
                  <span className="truncate" title={h}>{h}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* export */}
        <div className="relative">
          <button onClick={() => setExportOpen(v => !v)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition"
            style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.12)", color: "var(--halo)" }}>
            <Download size={13} /> Exporter
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 rounded-xl overflow-hidden shadow-xl w-44"
              style={{ border: "1px solid var(--stroke)", background: "var(--card)" }}>
              {(["csv", "json"] as const).map(fmt => (
                <button key={fmt} onClick={() => { exportData(processed, visHeaders, fmt); setExportOpen(false); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-xs hover:opacity-80 transition" style={{ color: "var(--text)" }}>
                  <Download size={12} /> Exporter en {fmt.toUpperCase()}
                </button>
              ))}
              <div className="px-4 py-2 text-[10px]" style={{ color: "var(--muted)", borderTop: "1px solid var(--stroke)" }}>
                {processed.length} ligne{processed.length > 1 ? "s" : ""} · {visHeaders.length} col.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── advanced search builder ── */}
      {searchMode === "advanced" && (
        <div className="rounded-xl p-3 space-y-2" style={{ border: "1px solid var(--stroke)", background: "rgba(108,99,255,.04)" }}>
          {conditions.map((cond, idx) => (
            <div key={cond.id} className="flex items-center gap-2 flex-wrap">
              {idx > 0 && (
                <span className="text-[10px] font-bold w-8 text-center rounded px-1 py-0.5 shrink-0"
                  style={{ background: "rgba(108,99,255,.15)", color: "var(--halo)" }}>
                  {condLogic}
                </span>
              )}
              {/* Column selector */}
              <select
                value={cond.column}
                onChange={e => updateCondition(cond.id, { column: e.target.value })}
                className="rounded-lg px-2 py-1.5 text-xs focus:outline-none max-w-[180px]"
                style={{ border: "1px solid var(--stroke)", background: "var(--surface)", color: "var(--text)" }}>
                {headers.map(h => <option key={h} value={h}>{h.length > 28 ? h.slice(0, 28) + "…" : h}</option>)}
              </select>
              {/* Operator selector */}
              <select
                value={cond.operator}
                onChange={e => updateCondition(cond.id, { operator: e.target.value as Operator })}
                className="rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                style={{ border: "1px solid var(--stroke)", background: "var(--surface)", color: "var(--text)" }}>
                {(Object.entries(OP_LABELS) as [Operator, string][]).map(([op, label]) => (
                  <option key={op} value={op}>{label}</option>
                ))}
              </select>
              {/* Value input (hidden for empty/notempty) */}
              {cond.operator !== "empty" && cond.operator !== "notempty" && (
                <input
                  value={cond.value}
                  onChange={e => { updateCondition(cond.id, { value: e.target.value }); setPage(1); }}
                  placeholder="valeur…"
                  className="flex-1 min-w-24 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                  style={{ border: "1px solid var(--stroke)", background: "var(--surface)", color: "var(--text)" }}
                />
              )}
              {/* Remove */}
              {conditions.length > 1 && (
                <button onClick={() => { removeCondition(cond.id); setPage(1); }}
                  className="rounded-lg p-1.5 transition hover:opacity-70" style={{ color: "var(--muted)" }}>
                  <X size={12} />
                </button>
              )}
            </div>
          ))}

          {/* Footer: add condition + logic toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={addCondition}
              className="flex items-center gap-1 text-[11px] transition hover:opacity-80"
              style={{ color: "var(--nebula)" }}>
              <Plus size={11} /> Ajouter une condition
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>Logique :</span>
              {(["AND", "OR"] as LogicOp[]).map(op => (
                <button key={op} onClick={() => { setCondLogic(op); setPage(1); }}
                  className="rounded-lg px-2 py-0.5 text-[11px] font-bold transition"
                  style={condLogic === op
                    ? { background: "var(--nebula)", color: "#fff", border: "1px solid var(--nebula)" }
                    : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                  {op}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* count */}
      <p className="text-[11px]" style={{ color: "var(--muted)" }}>
        {processed.length} résultat{processed.length > 1 ? "s" : ""}
        {searchMode === "simple" && search && ` pour "${search}"`}
        {" · "}page {page}/{totalPages}
      </p>

      {/* table */}
      <div className="overflow-auto rounded-xl" style={{ border: "1px solid var(--stroke)", maxHeight: "60vh" }}>
        <table className="w-full text-xs border-collapse" style={{ minWidth: `${Math.max(visHeaders.length * 140, 600)}px` }}>
          <thead>
            <tr style={{ background: "var(--surface)", position: "sticky", top: 0, zIndex: 10 }}>
              <th className="px-3 py-2 text-left font-semibold w-10 select-none"
                style={{ color: "var(--muted)", borderBottom: "1px solid var(--stroke)" }}>#</th>
              {visHeaders.map(h => (
                <th key={h} onClick={() => handleSort(h)}
                  className="px-3 py-2 text-left font-semibold cursor-pointer select-none whitespace-nowrap group"
                  style={{ color: "var(--text)", borderBottom: "1px solid var(--stroke)", minWidth: 140, maxWidth: 280 }}>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate max-w-[180px]" title={h}>{h}</span>
                    <span className="rounded px-1 py-0.5 text-[9px] font-normal shrink-0"
                      style={{ background: TYPE_COLOR[types[h] ?? "text"], color: "var(--text)" }}>
                      {TYPE_LABEL[types[h] ?? "text"]}
                    </span>
                    <span className="ml-auto shrink-0 opacity-40 group-hover:opacity-100">
                      {sortCol === h && sortDir === "asc" ? <ChevronUp size={11} />
                        : sortCol === h && sortDir === "desc" ? <ChevronDown size={11} />
                        : <ChevronsUpDown size={11} />}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => {
              const absIdx = (page - 1) * PAGE_SIZE + ri + 1;
              return (
                <tr key={ri}
                  style={{ background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,.015)" }}
                  className="hover:bg-[rgba(108,99,255,.06)] transition-colors">
                  <td className="px-3 py-1.5 select-none" style={{ color: "var(--muted)", borderBottom: "1px solid var(--stroke)" }}>{absIdx}</td>
                  {visHeaders.map(h => (
                    <td key={h} className="px-3 py-1.5 max-w-[280px]"
                      style={{ color: "var(--text)", borderBottom: "1px solid var(--stroke)" }}>
                      <span className="block truncate" title={row[h]}>
                        {row[h] || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>–</span>}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr><td colSpan={visHeaders.length + 1} className="py-10 text-center" style={{ color: "var(--muted)" }}>Aucun résultat</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <PagBtn disabled={page === 1} onClick={() => setPage(1)}>«</PagBtn>
          <PagBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</PagBtn>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 7) p = i + 1;
            else if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;
            return <PagBtn key={p} active={p === page} onClick={() => setPage(p)}>{p}</PagBtn>;
          })}
          <PagBtn disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</PagBtn>
          <PagBtn disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</PagBtn>
        </div>
      )}
    </div>
  );
}

function PagBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="rounded-lg px-2.5 py-1 text-xs transition disabled:opacity-30"
      style={active
        ? { background: "var(--nebula)", color: "#fff", border: "1px solid var(--nebula)" }
        : { border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)", color: "var(--text)" }}>
      {children}
    </button>
  );
}
