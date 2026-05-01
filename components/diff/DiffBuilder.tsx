"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Trash2,
  ArrowLeftRight,
  Upload,
  AlignLeft,
  CaseSensitive,
  WrapText,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Types & diff algorithm
────────────────────────────────────────────────────────────── */

type DiffType = "eq" | "add" | "del" | "mod";

interface DiffItem<T> {
  type: "eq" | "add" | "del";
  val: T;
}

function diffSeq<T>(a: T[], b: T[], eq?: (x: T, y: T) => boolean): DiffItem<T>[] {
  const cmp = eq ?? ((x, y) => x === y);
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = cmp(a[i - 1], b[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const res: DiffItem<T>[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cmp(a[i - 1], b[j - 1])) {
      res.unshift({ type: "eq", val: a[i - 1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      res.unshift({ type: "add", val: b[j - 1] }); j--;
    } else {
      res.unshift({ type: "del", val: a[i - 1] }); i--;
    }
  }
  return res;
}

/* ── Row model ─────────────────────────────────────────────── */

interface Row {
  leftNum:   number | null;
  leftText:  string | null;
  leftKind:  DiffType | "blank";

  rightNum:  number | null;
  rightText: string | null;
  rightKind: DiffType | "blank";

  chunkIdx:      number;  // which diff chunk this row belongs to (-1 = equal)
  isChunkStart:  boolean;
}

/* ── Build rows from diff ──────────────────────────────────── */

function buildRows(leftLines: string[], rightLines: string[], ignoreWS: boolean): Row[] {
  const normalise = (s: string) => ignoreWS ? s.replace(/\s+/g, " ").trim() : s;

  const diffs = diffSeq(
    leftLines.map(normalise),
    rightLines.map(normalise),
  );

  // Reconstruct original line indices
  let li = 0, ri = 0;
  const rows: Row[] = [];
  let chunkIdx = -1;

  // Group consecutive del/add pairs as "modified"
  let i = 0;
  while (i < diffs.length) {
    const cur  = diffs[i];
    const next = diffs[i + 1];

    if (cur.type === "eq") {
      rows.push({
        leftNum: li + 1, leftText: leftLines[li], leftKind: "eq",
        rightNum: ri + 1, rightText: rightLines[ri], rightKind: "eq",
        chunkIdx: -1, isChunkStart: false,
      });
      li++; ri++; i++;
    } else if (cur.type === "del" && next?.type === "add") {
      // modified pair
      chunkIdx++;
      rows.push({
        leftNum: li + 1, leftText: leftLines[li], leftKind: "mod",
        rightNum: ri + 1, rightText: rightLines[ri], rightKind: "mod",
        chunkIdx, isChunkStart: true,
      });
      li++; ri++; i += 2;
    } else if (cur.type === "del") {
      chunkIdx++;
      rows.push({
        leftNum: li + 1, leftText: leftLines[li], leftKind: "del",
        rightNum: null, rightText: null, rightKind: "blank",
        chunkIdx, isChunkStart: true,
      });
      li++; i++;
    } else { // add
      chunkIdx++;
      rows.push({
        leftNum: null, leftText: null, leftKind: "blank",
        rightNum: ri + 1, rightText: rightLines[ri], rightKind: "add",
        chunkIdx, isChunkStart: true,
      });
      ri++; i++;
    }
  }
  return rows;
}

/* ── Word-level diff ───────────────────────────────────────── */

interface WOp { type: "eq" | "add" | "del"; val: string }

function wordDiff(a: string, b: string): { left: WOp[]; right: WOp[] } {
  const tokA = a.split(/(\s+)/);
  const tokB = b.split(/(\s+)/);
  const d = diffSeq(tokA, tokB);
  const left: WOp[]  = [];
  const right: WOp[] = [];
  for (const item of d) {
    if (item.type === "eq")  { left.push({ type: "eq",  val: item.val }); right.push({ type: "eq",  val: item.val }); }
    if (item.type === "del") { left.push({ type: "del", val: item.val }); }
    if (item.type === "add") { right.push({ type: "add", val: item.val }); }
  }
  return { left, right };
}

/* ── Colours ───────────────────────────────────────────────── */

const C = {
  delBg:   "rgba(207,35,40,.16)",
  delWord: "rgba(207,35,40,.55)",
  delNum:  "rgba(207,35,40,.22)",
  addBg:   "rgba(34,197,94,.14)",
  addWord: "rgba(34,197,94,.45)",
  addNum:  "rgba(34,197,94,.20)",
  modLBg:  "rgba(207,35,40,.10)",
  modRBg:  "rgba(34,197,94,.10)",
  eqBg:    "transparent",
  blank:   "repeating-linear-gradient(135deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 8px)",
  numEq:   "rgba(160,160,160,.35)",
  border:  "1px solid rgba(255,255,255,.07)",
};

/* ── Row height (px) ───────────────────────────────────────── */
const ROW_H = 22;

/* ──────────────────────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────────────────────── */

function CellText({
  text, kind, otherText, wordLevel,
}: {
  text: string; kind: DiffType | "blank"; otherText?: string | null; wordLevel: boolean;
}) {
  if (kind === "blank") return null;

  if (wordLevel && kind === "mod" && otherText != null) {
    const { left, right } = wordDiff(
      kind === "mod" ? text : "",
      kind === "mod" ? (otherText ?? "") : text,
    );
    // For the left cell we show `left`, for the right cell we show `right`
    // But since we call this per-cell, we pick based on which side text appears
    // We'll pass side as prop — see below
  }

  // Simple render for non-mod or no word diff
  return <span className="whitespace-pre font-mono text-[12px]">{text}</span>;
}

/* ── Row component ─────────────────────────────────────────── */

function DiffRow({
  row, wordLevel, wrap,
}: {
  row: Row; wordLevel: boolean; wrap: boolean;
}) {
  const leftBg = row.leftKind === "del" ? C.delBg
    : row.leftKind === "mod" ? C.modLBg
    : row.leftKind === "blank" ? C.blank
    : C.eqBg;

  const rightBg = row.rightKind === "add" ? C.addBg
    : row.rightKind === "mod" ? C.modRBg
    : row.rightKind === "blank" ? C.blank
    : C.eqBg;

  const leftNumCol = row.leftKind === "del" ? C.delNum
    : row.leftKind === "mod" ? C.delNum
    : C.numEq;

  const rightNumCol = row.rightKind === "add" ? C.addNum
    : row.rightKind === "mod" ? C.addNum
    : C.numEq;

  const textStyle: React.CSSProperties = {
    flex: 1,
    overflow: wrap ? "visible" : "hidden",
    whiteSpace: wrap ? "pre-wrap" : "pre",
    wordBreak: wrap ? "break-all" : "normal",
    fontFamily: "ui-monospace, 'Cascadia Code', Consolas, monospace",
    fontSize: 12,
    lineHeight: `${ROW_H}px`,
    color: "var(--text)",
    padding: "0 8px",
  };

  function renderText(text: string | null, kind: DiffType | "blank", otherText: string | null, isLeft: boolean) {
    if (kind === "blank" || text === null) return null;

    if (!wordLevel || kind === "eq") {
      return <span style={{ opacity: kind === "eq" ? 0.55 : 1 }}>{text}</span>;
    }

    if (kind === "mod" && otherText !== null) {
      const diff = isLeft
        ? wordDiff(text, otherText).left
        : wordDiff(otherText!, text).right;

      return (
        <>
          {diff.map((w, k) => (
            <span key={k} style={{
              background: w.type === (isLeft ? "del" : "add") ? (isLeft ? C.delWord : C.addWord) : "transparent",
              borderRadius: 2,
            }}>
              {w.val}
            </span>
          ))}
        </>
      );
    }

    // pure del or add
    return <span>{text}</span>;
  }

  return (
    <div style={{ display: "flex", minHeight: ROW_H, borderBottom: C.border }}>
      {/* LEFT */}
      <div style={{
        display: "flex", flex: 1, minWidth: 0,
        background: typeof leftBg === "string" && leftBg.startsWith("repeating")
          ? undefined : leftBg,
        ...(typeof leftBg === "string" && leftBg.startsWith("repeating") ? { backgroundImage: leftBg } : {}),
      }}>
        <span style={{
          width: 42, minWidth: 42, textAlign: "right", paddingRight: 8,
          fontFamily: "ui-monospace, monospace", fontSize: 11,
          lineHeight: `${ROW_H}px`, userSelect: "none",
          color: leftNumCol, flexShrink: 0,
        }}>
          {row.leftNum ?? ""}
        </span>
        <span style={textStyle}>
          {renderText(row.leftText, row.leftKind, row.rightText, true)}
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: "rgba(255,255,255,.08)", flexShrink: 0 }} />

      {/* RIGHT */}
      <div style={{
        display: "flex", flex: 1, minWidth: 0,
        background: typeof rightBg === "string" && rightBg.startsWith("repeating")
          ? undefined : rightBg,
        ...(typeof rightBg === "string" && rightBg.startsWith("repeating") ? { backgroundImage: rightBg } : {}),
      }}>
        <span style={{
          width: 42, minWidth: 42, textAlign: "right", paddingRight: 8,
          fontFamily: "ui-monospace, monospace", fontSize: 11,
          lineHeight: `${ROW_H}px`, userSelect: "none",
          color: rightNumCol, flexShrink: 0,
        }}>
          {row.rightNum ?? ""}
        </span>
        <span style={textStyle}>
          {renderText(row.rightText, row.rightKind, row.leftText, false)}
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────── */

interface Props {
  onClose: () => void;
}

export default function DiffBuilder({ onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [leftText,  setLeftText]  = useState("");
  const [rightText, setRightText] = useState("");
  const [ignoreWS,  setIgnoreWS]  = useState(false);
  const [wordLevel, setWordLevel] = useState(true);
  const [wrap,      setWrap]      = useState(false);
  const [view,      setView]      = useState<"split" | "edit">("split");

  const [copiedL, setCopiedL] = useState(false);
  const [copiedR, setCopiedR] = useState(false);

  const scrollRef    = useRef<HTMLDivElement>(null);
  const syncingRef   = useRef(false);

  // Chunk navigation
  const [chunkIdx, setChunkIdx] = useState<number>(-1);

  /* ── Compute rows ─────────────────────────────────────────── */
  const rows = useMemo(() => {
    if (!leftText && !rightText) return [];
    return buildRows(leftText.split("\n"), rightText.split("\n"), ignoreWS);
  }, [leftText, rightText, ignoreWS]);

  /* ── Stats ─────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    let add = 0, del = 0, mod = 0, eq = 0;
    for (const r of rows) {
      if (r.leftKind === "del")  del++;
      else if (r.rightKind === "add") add++;
      else if (r.leftKind === "mod") mod++;
      else eq++;
    }
    return { add, del, mod, eq, total: rows.length };
  }, [rows]);

  const totalChunks = useMemo(() => {
    let max = -1;
    for (const r of rows) if (r.chunkIdx > max) max = r.chunkIdx;
    return max + 1;
  }, [rows]);

  const identical = stats.add === 0 && stats.del === 0 && stats.mod === 0 && rows.length > 0;

  /* ── Navigate to chunk ─────────────────────────────────────── */
  const goToChunk = useCallback((idx: number) => {
    if (idx < 0 || idx >= totalChunks) return;
    setChunkIdx(idx);
    const rowIdx = rows.findIndex(r => r.chunkIdx === idx && r.isChunkStart);
    if (rowIdx === -1) return;
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = rowIdx * ROW_H - 80;
  }, [rows, totalChunks]);

  const prevChunk = () => goToChunk(chunkIdx <= 0 ? totalChunks - 1 : chunkIdx - 1);
  const nextChunk = () => goToChunk(chunkIdx < totalChunks - 1 ? chunkIdx + 1 : 0);

  /* ── File upload ───────────────────────────────────────────── */
  function handleFileUpload(side: "left" | "right") {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.html,.css,.xml,.yaml,.yml,.log,.env";
    inp.onchange = async () => {
      const file = inp.files?.[0];
      if (!file) return;
      const text = await file.text();
      if (side === "left") setLeftText(text);
      else setRightText(text);
    };
    inp.click();
  }

  /* ── Copy helpers ──────────────────────────────────────────── */
  function copyLeft()  { navigator.clipboard.writeText(leftText).then(() => { setCopiedL(true); setTimeout(() => setCopiedL(false), 1800); }); }
  function copyRight() { navigator.clipboard.writeText(rightText).then(() => { setCopiedR(true); setTimeout(() => setCopiedR(false), 1800); }); }

  /* ── Swap ──────────────────────────────────────────────────── */
  function swap() {
    setLeftText(rightText);
    setRightText(leftText);
  }

  if (!mounted) return null;

  /* ── Toolbar button style ──────────────────────────────────── */
  const tbBtn = (active?: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
    border: "1px solid",
    borderColor: active ? "var(--nebula)" : "rgba(255,255,255,.12)",
    background: active ? "rgba(108,99,255,.12)" : "rgba(255,255,255,.04)",
    color: active ? "var(--halo)" : "var(--muted)",
    transition: "all .15s",
  });

  const iconBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: 6, cursor: "pointer",
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.04)",
    color: "var(--muted)",
    transition: "all .15s",
  };

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "var(--bg)",
        display: "flex", flexDirection: "column",
        fontFamily: "var(--font-sans, system-ui)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px",
        borderBottom: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.25)",
        flexShrink: 0,
      }}>
        {/* Close */}
        <button onClick={onClose} style={iconBtn} title="Fermer">
          <X size={15} />
        </button>

        {/* Title */}
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", flex: 1 }}>
          Comparateur de texte
        </span>

        {/* View toggle */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setView("split")}
            style={tbBtn(view === "split")}
            title="Vue côte à côte"
          >
            <AlignLeft size={13} />
            Côte à côte
          </button>
          <button
            onClick={() => setView("edit")}
            style={tbBtn(view === "edit")}
            title="Mode édition"
          >
            <WrapText size={13} />
            Édition
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,.1)" }} />

        {/* Options */}
        <button onClick={() => setIgnoreWS(v => !v)} style={tbBtn(ignoreWS)} title="Ignorer les espaces">
          <CaseSensitive size={13} />
          Ignorer espaces
        </button>
        <button onClick={() => setWordLevel(v => !v)} style={tbBtn(wordLevel)} title="Diff par mots">
          Diff mots
        </button>
        <button onClick={() => setWrap(v => !v)} style={tbBtn(wrap)} title="Retour à la ligne">
          <WrapText size={13} />
          Retour ligne
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,.1)" }} />

        {/* Swap */}
        <button onClick={swap} style={tbBtn()} title="Échanger les panneaux">
          <ArrowLeftRight size={13} />
          Échanger
        </button>

        {/* Navigation */}
        {totalChunks > 0 && (
          <>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,.1)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={prevChunk} style={iconBtn} title="Diff précédent">
                <ChevronUp size={14} />
              </button>
              <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 60, textAlign: "center" }}>
                {chunkIdx >= 0 ? `${chunkIdx + 1} / ${totalChunks}` : `${totalChunks} diff${totalChunks > 1 ? "s" : ""}`}
              </span>
              <button onClick={nextChunk} style={iconBtn} title="Diff suivant">
                <ChevronDown size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      {rows.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "5px 16px",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          background: "rgba(0,0,0,.15)",
          fontSize: 11, flexShrink: 0,
        }}>
          {identical ? (
            <span style={{ color: "#4ade80", fontWeight: 600 }}>✓ Les deux textes sont identiques</span>
          ) : (
            <>
              {stats.del > 0 && <span style={{ color: "#f87171" }}>−{stats.del} suppression{stats.del > 1 ? "s" : ""}</span>}
              {stats.add > 0 && <span style={{ color: "#4ade80" }}>+{stats.add} ajout{stats.add > 1 ? "s" : ""}</span>}
              {stats.mod > 0 && <span style={{ color: "#fb923c" }}>~{stats.mod} modification{stats.mod > 1 ? "s" : ""}</span>}
              {stats.eq > 0  && <span style={{ color: "var(--muted)", opacity: .6 }}>{stats.eq} ligne{stats.eq > 1 ? "s" : ""} identique{stats.eq > 1 ? "s" : ""}</span>}
            </>
          )}
          <span style={{ color: "var(--muted)", opacity: .4, marginLeft: "auto" }}>
            {stats.total} ligne{stats.total > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────── */}
      {view === "edit" ? (
        /* EDIT VIEW — two textareas side by side */
        <div style={{ flex: 1, display: "flex", minHeight: 0, gap: 1, background: "rgba(255,255,255,.04)" }}>
          {/* LEFT */}
          <EditPanel
            value={leftText}
            onChange={setLeftText}
            label="Texte A — original"
            onUpload={() => handleFileUpload("left")}
            onCopy={copyLeft}
            copied={copiedL}
            onClear={() => setLeftText("")}
          />
          {/* Divider */}
          <div style={{ width: 1, background: "rgba(255,255,255,.08)", flexShrink: 0 }} />
          {/* RIGHT */}
          <EditPanel
            value={rightText}
            onChange={setRightText}
            label="Texte B — modifié"
            onUpload={() => handleFileUpload("right")}
            onCopy={copyRight}
            copied={copiedR}
            onClear={() => setRightText("")}
          />
        </div>
      ) : (
        /* SPLIT VIEW — diff table */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Panel headers */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            background: "rgba(0,0,0,.2)",
            flexShrink: 0,
          }}>
            <PanelHeader
              label="Texte A — original"
              onUpload={() => handleFileUpload("left")}
              onCopy={copyLeft}
              copied={copiedL}
              onClear={() => setLeftText("")}
              onEdit={() => setView("edit")}
              hasContent={!!leftText}
            />
            <div style={{ width: 1, background: "rgba(255,255,255,.08)", flexShrink: 0 }} />
            <PanelHeader
              label="Texte B — modifié"
              onUpload={() => handleFileUpload("right")}
              onCopy={copyRight}
              copied={copiedR}
              onClear={() => setRightText("")}
              onEdit={() => setView("edit")}
              hasContent={!!rightText}
            />
          </div>

          {/* Diff content or empty state */}
          {!leftText && !rightText ? (
            <EmptyState
              onEditLeft={() => { setView("edit"); }}
              onUploadLeft={() => handleFileUpload("left")}
              onUploadRight={() => handleFileUpload("right")}
            />
          ) : (
            <div
              ref={scrollRef}
              style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
            >
              {rows.map((row, i) => (
                <DiffRow key={i} row={row} wordLevel={wordLevel} wrap={wrap} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}

/* ──────────────────────────────────────────────────────────────
   PanelHeader
────────────────────────────────────────────────────────────── */

function PanelHeader({
  label, onUpload, onCopy, copied, onClear, onEdit, hasContent,
}: {
  label: string;
  onUpload: () => void;
  onCopy: () => void;
  copied: boolean;
  onClear: () => void;
  onEdit: () => void;
  hasContent: boolean;
}) {
  const sm: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 26, height: 26, borderRadius: 5, cursor: "pointer",
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.04)",
    color: "var(--muted)",
  };
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", gap: 6,
      padding: "6px 10px",
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", flex: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <button onClick={onUpload} style={sm} title="Importer un fichier"><Upload size={12} /></button>
      {hasContent && (
        <>
          <button onClick={onEdit} style={sm} title="Éditer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={onCopy} style={sm} title="Copier">
            {copied ? <Check size={12} style={{ color: "#4ade80" }} /> : <Copy size={12} />}
          </button>
          <button onClick={onClear} style={sm} title="Effacer">
            <Trash2 size={12} />
          </button>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   EditPanel — textarea with header
────────────────────────────────────────────────────────────── */

function EditPanel({
  value, onChange, label, onUpload, onCopy, copied, onClear,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  onUpload: () => void;
  onCopy: () => void;
  copied: boolean;
  onClear: () => void;
}) {
  const sm: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 26, height: 26, borderRadius: 5, cursor: "pointer",
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(255,255,255,.04)",
    color: "var(--muted)",
  };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 10px",
        borderBottom: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.2)",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", flex: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <button onClick={onUpload} style={sm} title="Importer un fichier"><Upload size={12} /></button>
        {value && (
          <>
            <button onClick={onCopy} style={sm} title="Copier">
              {copied ? <Check size={12} style={{ color: "#4ade80" }} /> : <Copy size={12} />}
            </button>
            <button onClick={onClear} style={sm} title="Effacer"><Trash2 size={12} /></button>
          </>
        )}
      </div>
      {/* textarea */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Colle ton texte ici, ou importe un fichier…"
        spellCheck={false}
        style={{
          flex: 1, resize: "none", outline: "none",
          background: "rgba(255,255,255,.02)",
          color: "var(--text)",
          fontFamily: "ui-monospace, 'Cascadia Code', Consolas, monospace",
          fontSize: 12, lineHeight: "20px",
          padding: "12px 16px",
          border: "none",
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   EmptyState
────────────────────────────────────────────────────────────── */

function EmptyState({
  onEditLeft, onUploadLeft, onUploadRight,
}: {
  onEditLeft: () => void;
  onUploadLeft: () => void;
  onUploadRight: () => void;
}) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 16, color: "var(--muted)",
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: .25 }}>
        <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <line x1="12" y1="3" x2="12" y2="21"/>
      </svg>
      <p style={{ fontSize: 13, opacity: .5, textAlign: "center", maxWidth: 320 }}>
        Colle ou importe deux textes pour comparer les différences
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onEditLeft}
          style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
            border: "1px solid var(--nebula)",
            background: "rgba(108,99,255,.1)", color: "var(--halo)",
          }}
        >
          Saisir du texte
        </button>
        <button
          onClick={onUploadLeft}
          style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(255,255,255,.04)", color: "var(--muted)",
          }}
        >
          <Upload size={12} style={{ display: "inline", marginRight: 4 }} />
          Fichier A
        </button>
        <button
          onClick={onUploadRight}
          style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(255,255,255,.04)", color: "var(--muted)",
          }}
        >
          <Upload size={12} style={{ display: "inline", marginRight: 4 }} />
          Fichier B
        </button>
      </div>
    </div>
  );
}
