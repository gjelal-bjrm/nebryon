"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, ChevronUp, ChevronDown, Upload, ArrowLeftRight,
  Copy, Check, Trash2, AlignLeft, WrapText,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
   Diff algorithm
════════════════════════════════════════════════════════════ */

type Op = "eq" | "add" | "del";
interface DiffItem<T> { type: Op; val: T }

function lcs<T>(a: T[], b: T[]): DiffItem<T>[] {
  const m = a.length, n = b.length;
  // dp[i][j] = LCS length for a[0..i-1], b[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);

  const out: DiffItem<T>[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) { out.unshift({ type: "eq",  val: a[i-1] }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { out.unshift({ type: "add", val: b[j-1] }); j--; }
    else                                                        { out.unshift({ type: "del", val: a[i-1] }); i--; }
  }
  return out;
}

/* ════════════════════════════════════════════════════════════
   Row model
════════════════════════════════════════════════════════════ */

type RowKind = "eq" | "del" | "add" | "mod" | "blank";

interface Row {
  lNum:  number | null;   // left line number (null = blank placeholder)
  lText: string | null;   // left text (null = blank)
  lKind: RowKind;

  rNum:  number | null;
  rText: string | null;
  rKind: RowKind;

  chunk: number;           // -1 = equal, ≥0 = diff chunk index
}

function buildRows(leftLines: string[], rightLines: string[], ignoreWS: boolean): Row[] {
  const norm = (s: string) => ignoreWS ? s.replace(/\s+/g, " ").trim() : s;

  const diff = lcs(leftLines.map(norm), rightLines.map(norm));

  let li = 0, ri = 0, chunk = -1;
  const rows: Row[] = [];
  let k = 0;

  while (k < diff.length) {
    const cur  = diff[k];
    const next = diff[k + 1];

    if (cur.type === "eq") {
      rows.push({ lNum: li+1, lText: leftLines[li], lKind: "eq", rNum: ri+1, rText: rightLines[ri], rKind: "eq", chunk: -1 });
      li++; ri++; k++;
    } else if (cur.type === "del" && next?.type === "add") {
      // Paired modification
      chunk++;
      rows.push({ lNum: li+1, lText: leftLines[li], lKind: "mod", rNum: ri+1, rText: rightLines[ri], rKind: "mod", chunk });
      li++; ri++; k += 2;
    } else if (cur.type === "del") {
      chunk++;
      rows.push({ lNum: li+1, lText: leftLines[li], lKind: "del", rNum: null, rText: null, rKind: "blank", chunk });
      li++; k++;
    } else { // add
      chunk++;
      rows.push({ lNum: null, lText: null, lKind: "blank", rNum: ri+1, rText: rightLines[ri], rKind: "add", chunk });
      ri++; k++;
    }
  }
  return rows;
}

/* ════════════════════════════════════════════════════════════
   Word-level diff
════════════════════════════════════════════════════════════ */

interface WOp { type: Op; val: string }

function wordDiff(a: string, b: string): { left: WOp[]; right: WOp[] } {
  const tokA = a.split(/(\s+)/);
  const tokB = b.split(/(\s+)/);
  const d = lcs(tokA, tokB);
  const left: WOp[] = [], right: WOp[] = [];
  for (const x of d) {
    if (x.type === "eq")  { left.push({ type:"eq",  val:x.val }); right.push({ type:"eq",  val:x.val }); }
    if (x.type === "del") { left.push({ type:"del", val:x.val }); }
    if (x.type === "add") { right.push({ type:"add", val:x.val }); }
  }
  return { left, right };
}

/* ════════════════════════════════════════════════════════════
   Colors / constants
════════════════════════════════════════════════════════════ */

// Backgrounds for the full-width line strip
const LINE_BG: Record<RowKind, string> = {
  eq:    "transparent",
  del:   "rgba(220,38,38,.22)",
  add:   "rgba(22,163,74,.20)",
  mod:   "transparent",          // set per-side below
  blank: "rgba(128,128,128,.06)",
};
// Per-side bg for "mod" rows
const MOD_L_BG = "rgba(220,38,38,.16)";
const MOD_R_BG = "rgba(22,163,74,.14)";

// Number-column tint
const NUM_BG: Record<RowKind, string> = {
  eq:    "rgba(255,255,255,.03)",
  del:   "rgba(220,38,38,.30)",
  add:   "rgba(22,163,74,.28)",
  mod:   "rgba(220,38,38,.22)",  // left — right overridden inline
  blank: "rgba(128,128,128,.04)",
};
const NUM_BG_MOD_R = "rgba(22,163,74,.22)";

// Word-level highlight
const WORD_DEL = "rgba(220,38,38,.65)";
const WORD_ADD = "rgba(22,163,74,.60)";

// Number column width
const NUM_W = 52;
// Row height
const ROW_H = 21;
// Divider between the two panels
const DIVIDER = "rgba(255,255,255,.10)";
// Equal row text opacity
const EQ_OP = 0.55;

/* ════════════════════════════════════════════════════════════
   Cell renderer
════════════════════════════════════════════════════════════ */

function CellContent({
  text, kind, otherText, wordLevel, isLeft,
}: {
  text: string; kind: RowKind; otherText: string | null;
  wordLevel: boolean; isLeft: boolean;
}) {
  if (kind === "eq") {
    return <span style={{ opacity: EQ_OP }}>{text}</span>;
  }
  if (kind === "mod" && wordLevel && otherText !== null) {
    const { left, right } = wordDiff(isLeft ? text : otherText!, isLeft ? otherText! : text);
    const ops = isLeft ? left : right;
    const highlight = isLeft ? WORD_DEL : WORD_ADD;
    return (
      <>
        {ops.map((w, i) => (
          <span key={i} style={w.type !== "eq"
            ? { background: highlight, borderRadius: 2, padding: "0 1px" }
            : {}}>
            {w.val}
          </span>
        ))}
      </>
    );
  }
  return <span>{text}</span>;
}

/* ════════════════════════════════════════════════════════════
   DiffBuilder — main component
════════════════════════════════════════════════════════════ */

interface Props { onClose: () => void }

export default function DiffBuilder({ onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [leftText,  setLeftText]  = useState("");
  const [rightText, setRightText] = useState("");

  const [ignoreWS,  setIgnoreWS]  = useState(false);
  const [wordLevel, setWordLevel] = useState(true);
  const [wrap,      setWrap]      = useState(false);

  const [editMode,  setEditMode]  = useState(false);   // true = textarea mode
  const [chunk,     setChunk]     = useState(-1);       // active chunk for navigation

  const [copiedL, setCopiedL] = useState(false);
  const [copiedR, setCopiedR] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  /* Lock body scroll while open */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ── Compute rows ──────────────────────────────────────── */
  const rows = useMemo(() => {
    if (!leftText && !rightText) return [];
    return buildRows(leftText.split("\n"), rightText.split("\n"), ignoreWS);
  }, [leftText, rightText, ignoreWS]);

  /* ── Stats ─────────────────────────────────────────────── */
  const stats = useMemo(() => {
    let add = 0, del = 0, mod = 0, eq = 0;
    for (const r of rows) {
      if      (r.lKind === "del") del++;
      else if (r.rKind === "add") add++;
      else if (r.lKind === "mod") mod++;
      else                        eq++;
    }
    return { add, del, mod, eq };
  }, [rows]);

  const totalChunks = useMemo(() => {
    let max = -1;
    for (const r of rows) if (r.chunk > max) max = r.chunk;
    return max + 1;
  }, [rows]);

  const identical = stats.add === 0 && stats.del === 0 && stats.mod === 0 && rows.length > 0;

  /* ── Navigation ─────────────────────────────────────────── */
  const goChunk = useCallback((idx: number) => {
    if (totalChunks === 0) return;
    const target = (idx + totalChunks) % totalChunks;
    setChunk(target);
    const rowIdx = rows.findIndex(r => r.chunk === target);
    if (rowIdx < 0 || !scrollRef.current) return;
    scrollRef.current.scrollTop = Math.max(0, rowIdx * ROW_H - 120);
  }, [rows, totalChunks]);

  /* ── File upload ─────────────────────────────────────────── */
  function pickFile(side: "l" | "r") {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".txt,.md,.json,.jsonc,.csv,.ts,.tsx,.js,.jsx,.mjs,.cjs,.html,.htm,.css,.scss,.xml,.yaml,.yml,.toml,.ini,.env,.log,.sh,.bat,.ps1,.sql,.php,.py,.rb,.go,.rs,.java,.cs,.cpp,.c,.h";
    inp.onchange = async () => {
      const f = inp.files?.[0]; if (!f) return;
      const t = await f.text();
      side === "l" ? setLeftText(t) : setRightText(t);
    };
    inp.click();
  }

  function copyL() { navigator.clipboard.writeText(leftText).then(() => { setCopiedL(true); setTimeout(() => setCopiedL(false), 1800); }); }
  function copyR() { navigator.clipboard.writeText(rightText).then(() => { setCopiedR(true); setTimeout(() => setCopiedR(false), 1800); }); }
  function swap()  { const t = leftText; setLeftText(rightText); setRightText(t); }

  if (!mounted) return null;

  /* ── Style helpers ───────────────────────────────────────── */
  const pill = (active?: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
    padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
    border: `1px solid ${active ? "rgba(139,92,246,.6)" : "rgba(255,255,255,.10)"}`,
    background: active ? "rgba(139,92,246,.15)" : "rgba(255,255,255,.04)",
    color: active ? "#c4b5fd" : "rgba(200,200,200,.75)",
    transition: "all .12s",
    userSelect: "none" as const,
  });
  const icon28: React.CSSProperties = {
    display:"inline-flex",alignItems:"center",justifyContent:"center",
    width:28,height:28,borderRadius:6,cursor:"pointer",
    border:"1px solid rgba(255,255,255,.10)",
    background:"rgba(255,255,255,.04)",
    color:"rgba(200,200,200,.75)",
  };

  /* ── Render ──────────────────────────────────────────────── */
  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      display:"flex", flexDirection:"column",
      background:"#0e0e14",
      fontFamily:"system-ui, -apple-system, sans-serif",
      overflow:"hidden",
    }}>

      {/* ══ HEADER ═════════════════════════════════════════ */}
      <div style={{
        display:"flex", alignItems:"center", gap:8, flexShrink:0,
        padding:"8px 14px",
        borderBottom:"1px solid rgba(255,255,255,.08)",
        background:"rgba(0,0,0,.30)",
      }}>
        <button onClick={onClose} style={icon28} title="Fermer"><X size={14}/></button>

        <span style={{ fontSize:14, fontWeight:700, color:"#e8e8f0", marginRight:4 }}>
          Comparateur de texte
        </span>

        {/* divider */}
        <div style={{ width:1, height:18, background:"rgba(255,255,255,.10)", margin:"0 4px" }} />

        {/* View toggle */}
        <button onClick={() => setEditMode(false)} style={pill(!editMode)}>
          <AlignLeft size={12}/> Vue diff
        </button>
        <button onClick={() => setEditMode(true)} style={pill(editMode)}>
          <WrapText size={12}/> Édition
        </button>

        <div style={{ width:1, height:18, background:"rgba(255,255,255,.10)", margin:"0 4px" }} />

        <button onClick={() => setIgnoreWS(v=>!v)} style={pill(ignoreWS)}>Ignorer espaces</button>
        <button onClick={() => setWordLevel(v=>!v)} style={pill(wordLevel)}>Diff mots</button>
        <button onClick={() => setWrap(v=>!v)} style={pill(wrap)}>
          <WrapText size={12}/> Retour ligne
        </button>

        <div style={{ width:1, height:18, background:"rgba(255,255,255,.10)", margin:"0 4px" }} />

        <button onClick={swap} style={pill()}>
          <ArrowLeftRight size={12}/> Échanger
        </button>

        {/* Chunk navigation */}
        {totalChunks > 0 && (
          <>
            <div style={{ width:1, height:18, background:"rgba(255,255,255,.10)", margin:"0 4px" }} />
            <button onClick={() => goChunk(chunk <= 0 ? totalChunks-1 : chunk-1)} style={icon28} title="Différence précédente">
              <ChevronUp size={14}/>
            </button>
            <span style={{ fontSize:11, color:"rgba(190,190,210,.7)", minWidth:56, textAlign:"center" }}>
              {chunk >= 0 ? `${chunk+1} / ${totalChunks}` : `${totalChunks} diff${totalChunks>1?"s":""}`}
            </span>
            <button onClick={() => goChunk(chunk+1)} style={icon28} title="Différence suivante">
              <ChevronDown size={14}/>
            </button>
          </>
        )}

        <div style={{ flex:1 }}/>
      </div>

      {/* ══ STATS BAR ══════════════════════════════════════ */}
      {rows.length > 0 && (
        <div style={{
          display:"flex", alignItems:"center", gap:20, flexShrink:0,
          padding:"4px 16px",
          borderBottom:"1px solid rgba(255,255,255,.05)",
          background:"rgba(0,0,0,.18)",
          fontSize:11,
        }}>
          {identical ? (
            <span style={{ color:"#4ade80", fontWeight:700 }}>✓ Les deux textes sont identiques</span>
          ) : (
            <>
              {stats.del > 0 && <span style={{ color:"#f87171" }}>−{stats.del} suppression{stats.del>1?"s":""}</span>}
              {stats.add > 0 && <span style={{ color:"#4ade80" }}>+{stats.add} ajout{stats.add>1?"s":""}</span>}
              {stats.mod > 0 && <span style={{ color:"#fb923c" }}>~{stats.mod} modification{stats.mod>1?"s":""}</span>}
              {stats.eq  > 0 && <span style={{ color:"rgba(160,160,180,.5)" }}>{stats.eq} ligne{stats.eq>1?"s":""} identique{stats.eq>1?"s":""}</span>}
            </>
          )}
          <span style={{ color:"rgba(140,140,160,.4)", marginLeft:"auto" }}>{rows.length} lignes</span>
        </div>
      )}

      {/* ══ BODY ═══════════════════════════════════════════ */}
      {editMode ? (
        /* ── EDIT MODE — two textareas ── */
        <div style={{ flex:1, display:"flex", minHeight:0 }}>
          <EditPane label="Texte A — original" value={leftText} onChange={setLeftText}
            onUpload={()=>pickFile("l")} onCopy={copyL} copied={copiedL} onClear={()=>setLeftText("")}/>
          <div style={{ width:1, background:"rgba(255,255,255,.08)", flexShrink:0 }}/>
          <EditPane label="Texte B — modifié" value={rightText} onChange={setRightText}
            onUpload={()=>pickFile("r")} onCopy={copyR} copied={copiedR} onClear={()=>setRightText("")}/>
        </div>
      ) : rows.length === 0 ? (
        /* ── EMPTY STATE ── */
        <EmptyState onEdit={()=>setEditMode(true)} onUploadL={()=>pickFile("l")} onUploadR={()=>pickFile("r")}/>
      ) : (
        /* ── SPLIT DIFF VIEW ── */
        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>

          {/* Sticky panel labels */}
          <div style={{
            display:"grid",
            gridTemplateColumns:`${NUM_W}px 1fr 1px ${NUM_W}px 1fr`,
            flexShrink:0, height:28,
            borderBottom:"1px solid rgba(255,255,255,.10)",
            background:"rgba(0,0,0,.25)",
            position:"sticky", top:0, zIndex:10,
          }}>
            <div style={{ gridColumn:"1/3", display:"flex", alignItems:"center", gap:8, padding:"0 8px 0 10px" }}>
              <PanelActions onUpload={()=>pickFile("l")} onCopy={copyL} copied={copiedL} onClear={()=>setLeftText("")} onEdit={()=>setEditMode(true)} hasContent={!!leftText}/>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", color:"rgba(180,180,200,.6)", textTransform:"uppercase" }}>Texte A — original</span>
            </div>
            <div style={{ width:1, background:DIVIDER }}/>
            <div style={{ gridColumn:"4/6", display:"flex", alignItems:"center", gap:8, padding:"0 8px 0 10px" }}>
              <PanelActions onUpload={()=>pickFile("r")} onCopy={copyR} copied={copiedR} onClear={()=>setRightText("")} onEdit={()=>setEditMode(true)} hasContent={!!rightText}/>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", color:"rgba(180,180,200,.6)", textTransform:"uppercase" }}>Texte B — modifié</span>
            </div>
          </div>

          {/* ── Single scroll container ── */}
          <div
            ref={scrollRef}
            style={{ flex:1, overflow:"auto" }}
          >
            {/* Inner table — expands to content width */}
            <div style={{ minWidth:"100%", display:"table" }}>
              {rows.map((row, i) => {
                /* backgrounds */
                const lBg = row.lKind==="mod" ? MOD_L_BG : LINE_BG[row.lKind];
                const rBg = row.rKind==="mod" ? MOD_R_BG : LINE_BG[row.rKind];
                const lNumBg = NUM_BG[row.lKind];
                const rNumBg = row.rKind==="mod" ? NUM_BG_MOD_R : NUM_BG[row.rKind];
                const isChunkStart = row.chunk >= 0 && (i===0 || rows[i-1].chunk !== row.chunk);

                return (
                  <div key={i}
                    data-chunk={row.chunk}
                    style={{
                      display:"grid",
                      gridTemplateColumns:`${NUM_W}px 1fr 1px ${NUM_W}px 1fr`,
                      minHeight: ROW_H,
                      borderTop: isChunkStart && row.chunk >= 0 ? "1px solid rgba(255,255,255,.08)" : undefined,
                      borderBottom:"1px solid rgba(255,255,255,.04)",
                    }}
                  >
                    {/* ── Left num ── */}
                    <div style={{
                      background: lNumBg,
                      display:"flex", alignItems:"center", justifyContent:"flex-end",
                      paddingRight:8, paddingLeft:4,
                      fontFamily:"ui-monospace,Consolas,monospace", fontSize:11,
                      color: row.lKind==="del"||row.lKind==="mod" ? "rgba(248,113,113,.9)"
                           : row.lKind==="blank" ? "transparent" : "rgba(150,150,170,.55)",
                      userSelect:"none", flexShrink:0,
                      borderRight:"1px solid rgba(255,255,255,.06)",
                    }}>
                      {row.lNum ?? ""}
                    </div>

                    {/* ── Left text ── */}
                    <div style={{
                      background: lBg,
                      padding:`0 10px`,
                      fontFamily:"ui-monospace,'Cascadia Code',Consolas,monospace",
                      fontSize:12,
                      lineHeight:`${ROW_H}px`,
                      color: row.lKind==="blank" ? "transparent"
                           : row.lKind==="eq" ? "rgba(210,210,230,.55)" : "#e8e8f0",
                      whiteSpace: wrap ? "pre-wrap" : "pre",
                      overflow: wrap ? "visible" : "hidden",
                      wordBreak: wrap ? "break-all" : "normal",
                      backgroundImage: row.lKind==="blank"
                        ? "repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0,rgba(255,255,255,.03) 1px,transparent 1px,transparent 9px)"
                        : undefined,
                    }}>
                      {row.lText !== null && (
                        <CellContent text={row.lText} kind={row.lKind} otherText={row.rText} wordLevel={wordLevel} isLeft={true}/>
                      )}
                    </div>

                    {/* ── Center divider ── */}
                    <div style={{ background: DIVIDER }}/>

                    {/* ── Right num ── */}
                    <div style={{
                      background: rNumBg,
                      display:"flex", alignItems:"center", justifyContent:"flex-end",
                      paddingRight:8, paddingLeft:4,
                      fontFamily:"ui-monospace,Consolas,monospace", fontSize:11,
                      color: row.rKind==="add"||row.rKind==="mod" ? "rgba(74,222,128,.9)"
                           : row.rKind==="blank" ? "transparent" : "rgba(150,150,170,.55)",
                      userSelect:"none", flexShrink:0,
                      borderRight:"1px solid rgba(255,255,255,.06)",
                    }}>
                      {row.rNum ?? ""}
                    </div>

                    {/* ── Right text ── */}
                    <div style={{
                      background: rBg,
                      padding:`0 10px`,
                      fontFamily:"ui-monospace,'Cascadia Code',Consolas,monospace",
                      fontSize:12,
                      lineHeight:`${ROW_H}px`,
                      color: row.rKind==="blank" ? "transparent"
                           : row.rKind==="eq" ? "rgba(210,210,230,.55)" : "#e8e8f0",
                      whiteSpace: wrap ? "pre-wrap" : "pre",
                      overflow: wrap ? "visible" : "hidden",
                      wordBreak: wrap ? "break-all" : "normal",
                      backgroundImage: row.rKind==="blank"
                        ? "repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0,rgba(255,255,255,.03) 1px,transparent 1px,transparent 9px)"
                        : undefined,
                    }}>
                      {row.rText !== null && (
                        <CellContent text={row.rText} kind={row.rKind} otherText={row.lText} wordLevel={wordLevel} isLeft={false}/>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

/* ════════════════════════════════════════════════════════════
   PanelActions — tiny icon buttons in the panel header
════════════════════════════════════════════════════════════ */

function PanelActions({ onUpload, onCopy, copied, onClear, onEdit, hasContent }: {
  onUpload:()=>void; onCopy:()=>void; copied:boolean;
  onClear:()=>void; onEdit:()=>void; hasContent:boolean;
}) {
  const s: React.CSSProperties = {
    display:"inline-flex",alignItems:"center",justifyContent:"center",
    width:20,height:20,borderRadius:4,cursor:"pointer",
    border:"1px solid rgba(255,255,255,.09)",
    background:"rgba(255,255,255,.04)",
    color:"rgba(190,190,210,.7)",
  };
  return (
    <div style={{ display:"flex", gap:3 }}>
      <button onClick={onUpload} style={s} title="Importer un fichier"><Upload size={10}/></button>
      {hasContent && (
        <>
          <button onClick={onEdit} style={s} title="Modifier">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={onCopy} style={s} title="Copier">
            {copied ? <Check size={10} style={{ color:"#4ade80" }}/> : <Copy size={10}/>}
          </button>
          <button onClick={onClear} style={s} title="Effacer"><Trash2 size={10}/></button>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   EditPane — textarea panel
════════════════════════════════════════════════════════════ */

function EditPane({ label, value, onChange, onUpload, onCopy, copied, onClear }: {
  label:string; value:string; onChange:(v:string)=>void;
  onUpload:()=>void; onCopy:()=>void; copied:boolean; onClear:()=>void;
}) {
  const s: React.CSSProperties = {
    display:"inline-flex",alignItems:"center",justifyContent:"center",
    width:24,height:24,borderRadius:5,cursor:"pointer",
    border:"1px solid rgba(255,255,255,.10)",
    background:"rgba(255,255,255,.04)",
    color:"rgba(190,190,210,.75)",
  };
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
      <div style={{
        display:"flex", alignItems:"center", gap:6, padding:"5px 10px", flexShrink:0,
        borderBottom:"1px solid rgba(255,255,255,.07)",
        background:"rgba(0,0,0,.20)",
      }}>
        <span style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"rgba(180,180,200,.6)",flex:1 }}>{label}</span>
        <button onClick={onUpload} style={s} title="Importer"><Upload size={11}/></button>
        {value && <>
          <button onClick={onCopy} style={s} title="Copier">
            {copied ? <Check size={11} style={{ color:"#4ade80" }}/> : <Copy size={11}/>}
          </button>
          <button onClick={onClear} style={s} title="Effacer"><Trash2 size={11}/></button>
        </>}
      </div>
      <textarea
        value={value} onChange={e=>onChange(e.target.value)}
        placeholder="Colle ton texte ici, ou importe un fichier…"
        spellCheck={false}
        style={{
          flex:1, resize:"none", outline:"none", border:"none",
          background:"rgba(255,255,255,.015)",
          color:"#d4d4e8",
          fontFamily:"ui-monospace,'Cascadia Code',Consolas,monospace",
          fontSize:12, lineHeight:"20px",
          padding:"10px 14px",
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   EmptyState
════════════════════════════════════════════════════════════ */

function EmptyState({ onEdit, onUploadL, onUploadR }: {
  onEdit:()=>void; onUploadL:()=>void; onUploadR:()=>void;
}) {
  return (
    <div style={{
      flex:1,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      gap:20,
    }}>
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(180,180,220,.2)" strokeWidth="1.2">
        <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <line x1="12" y1="3" x2="12" y2="21"/>
      </svg>
      <p style={{ fontSize:13,color:"rgba(180,180,200,.45)",textAlign:"center",maxWidth:300,lineHeight:1.6 }}>
        Colle ou importe deux textes pour visualiser les différences
      </p>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onEdit} style={{
          padding:"8px 18px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",
          border:"1px solid rgba(139,92,246,.55)",background:"rgba(139,92,246,.15)",color:"#c4b5fd",
        }}>Saisir du texte</button>
        <button onClick={onUploadL} style={{
          padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",
          border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.05)",color:"rgba(190,190,210,.8)",
          display:"flex",alignItems:"center",gap:6,
        }}><Upload size={12}/>Fichier A</button>
        <button onClick={onUploadR} style={{
          padding:"8px 14px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",
          border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.05)",color:"rgba(190,190,210,.8)",
          display:"flex",alignItems:"center",gap:6,
        }}><Upload size={12}/>Fichier B</button>
      </div>
    </div>
  );
}
