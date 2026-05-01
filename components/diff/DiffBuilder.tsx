"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, ChevronUp, ChevronDown, Upload,
  ArrowLeftRight, Copy, Check, Trash2, WrapText,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
   LCS diff
════════════════════════════════════════════════════════════ */

type Op = "eq" | "add" | "del";
interface DI<T> { type: Op; val: T }

function lcs<T>(a: T[], b: T[]): DI<T>[] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);
  const out: DI<T>[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) { out.unshift({ type:"eq",  val:a[i-1] }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { out.unshift({ type:"add", val:b[j-1] }); j--; }
    else { out.unshift({ type:"del", val:a[i-1] }); i--; }
  }
  return out;
}

/* ════════════════════════════════════════════════════════════
   Row model & builder
════════════════════════════════════════════════════════════ */

type Kind = "eq" | "del" | "add" | "mod" | "blank";

interface Row {
  lNum: number | null; lText: string | null; lKind: Kind;
  rNum: number | null; rText: string | null; rKind: Kind;
  chunk: number; // -1 = equal
}

function buildRows(L: string[], R: string[], ignoreWS: boolean): Row[] {
  const norm = (s: string) => ignoreWS ? s.replace(/\s+/g, " ").trim() : s;
  const diff = lcs(L.map(norm), R.map(norm));
  let li = 0, ri = 0, ch = -1;
  const rows: Row[] = [];
  let k = 0;

  while (k < diff.length) {
    if (diff[k].type === "eq") {
      rows.push({ lNum:li+1, lText:L[li], lKind:"eq", rNum:ri+1, rText:R[ri], rKind:"eq", chunk:-1 });
      li++; ri++; k++;
    } else {
      // Collect all consecutive non-eq items into one chunk
      ch++;
      const dels: number[] = [];   // li indices
      const adds: number[] = [];   // ri indices
      while (k < diff.length && diff[k].type !== "eq") {
        if (diff[k].type === "del") { dels.push(li); li++; }
        else                        { adds.push(ri); ri++; }
        k++;
      }
      // Pair dels+adds as "mod", remainder as pure del/add
      const paired = Math.min(dels.length, adds.length);
      for (let p = 0; p < paired; p++) {
        rows.push({ lNum:dels[p]+1, lText:L[dels[p]], lKind:"mod",
                    rNum:adds[p]+1, rText:R[adds[p]], rKind:"mod", chunk:ch });
      }
      for (let p = paired; p < dels.length; p++) {
        rows.push({ lNum:dels[p]+1, lText:L[dels[p]], lKind:"del",
                    rNum:null, rText:null, rKind:"blank", chunk:ch });
      }
      for (let p = paired; p < adds.length; p++) {
        rows.push({ lNum:null, lText:null, lKind:"blank",
                    rNum:adds[p]+1, rText:R[adds[p]], rKind:"add", chunk:ch });
      }
    }
  }
  return rows;
}

/* ════════════════════════════════════════════════════════════
   Apply chunk helpers
════════════════════════════════════════════════════════════ */

/** Copy left chunk → right (make right match left for this chunk) */
function applyLtoR(rows: Row[], chunkIdx: number, rightLines: string[]): string[] {
  const cr    = rows.filter(r => r.chunk === chunkIdx);
  const src   = cr.filter(r => r.lText !== null).map(r => r.lText!);
  const dstNs = cr.filter(r => r.rNum  !== null).map(r => r.rNum! - 1);
  const out   = [...rightLines];
  if (dstNs.length > 0) {
    out.splice(dstNs[0], dstNs.length, ...src);
  } else {
    // Pure deletion in left → insert into right at the correct position
    const fi = rows.findIndex(r => r.chunk === chunkIdx);
    let at = 0;
    for (let i = fi - 1; i >= 0; i--) { if (rows[i].rNum !== null) { at = rows[i].rNum!; break; } }
    out.splice(at, 0, ...src);
  }
  return out;
}

/** Copy right chunk → left (make left match right for this chunk) */
function applyRtoL(rows: Row[], chunkIdx: number, leftLines: string[]): string[] {
  const cr    = rows.filter(r => r.chunk === chunkIdx);
  const src   = cr.filter(r => r.rText !== null).map(r => r.rText!);
  const dstNs = cr.filter(r => r.lNum  !== null).map(r => r.lNum! - 1);
  const out   = [...leftLines];
  if (dstNs.length > 0) {
    out.splice(dstNs[0], dstNs.length, ...src);
  } else {
    // Pure addition in right → insert into left at the correct position
    const fi = rows.findIndex(r => r.chunk === chunkIdx);
    let at = 0;
    for (let i = fi - 1; i >= 0; i--) { if (rows[i].lNum !== null) { at = rows[i].lNum!; break; } }
    out.splice(at, 0, ...src);
  }
  return out;
}

/* ════════════════════════════════════════════════════════════
   Word diff
════════════════════════════════════════════════════════════ */

interface WOp { type: Op; val: string }

function wordDiff(a: string, b: string): { left: WOp[]; right: WOp[] } {
  const d = lcs(a.split(/(\s+)/), b.split(/(\s+)/));
  const L: WOp[] = [], R: WOp[] = [];
  for (const x of d) {
    if (x.type==="eq")  { L.push({type:"eq",val:x.val});  R.push({type:"eq",val:x.val}); }
    if (x.type==="del") { L.push({type:"del",val:x.val}); }
    if (x.type==="add") { R.push({type:"add",val:x.val}); }
  }
  return { left:L, right:R };
}

/* ════════════════════════════════════════════════════════════
   Colors — diff highlights stay fixed; chrome uses CSS vars
════════════════════════════════════════════════════════════ */

// Row background tints — work in both light and dark
const BG: Record<Kind, string> = {
  eq:    "transparent",
  del:   "rgba(210,30,30,.22)",
  add:   "rgba(30,180,70,.18)",
  mod:   "transparent",
  blank: "rgba(128,128,128,.06)",
};
const BG_MOD_L = "rgba(210,30,30,.16)";
const BG_MOD_R = "rgba(30,180,70,.14)";

// Number-column backgrounds — col for diff, theme var for neutral
const NUM_BG: Record<Kind, string> = {
  eq:    "var(--surface)",
  del:   "rgba(210,30,30,.30)",
  add:   "rgba(30,180,70,.28)",
  mod:   "rgba(210,30,30,.24)",
  blank: "var(--surface)",
};
const NUM_BG_MOD_R = "rgba(30,180,70,.24)";

// Number text colors
const NUM_COL: Record<Kind, string> = {
  eq:    "var(--muted)",
  del:   "rgba(220,60,60,.95)",
  add:   "rgba(30,160,70,.95)",
  mod:   "rgba(220,60,60,.95)",
  blank: "transparent",
};
const NUM_COL_MOD_R = "rgba(30,160,70,.95)";

// Word highlight (strong enough for both themes)
const WHL = { del:"rgba(210,30,30,.60)", add:"rgba(20,160,60,.55)" };

// Row height px
const RH = 21;
// Number column width px
const NW = 52;
// Centre gutter (arrows) width px
const GW = 34;
// Divider / border color — theme-aware
const DIV = "var(--stroke)";

/* ════════════════════════════════════════════════════════════
   DiffBuilder
════════════════════════════════════════════════════════════ */

export default function DiffBuilder({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [leftText,  setLeftText]  = useState("");
  const [rightText, setRightText] = useState("");
  const [ignoreWS,  setIgnoreWS]  = useState(false);
  const [wordLevel, setWordLevel] = useState(true);
  const [wrap,      setWrap]      = useState(false);
  const [editMode,  setEditMode]  = useState(false);
  const [chunk,     setChunk]     = useState(-1);
  const [copiedL,   setCopiedL]   = useState(false);
  const [copiedR,   setCopiedR]   = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ── Diff data ───────────────────────────────────────────── */
  const rows = useMemo(() => {
    if (!leftText && !rightText) return [];
    return buildRows(leftText.split("\n"), rightText.split("\n"), ignoreWS);
  }, [leftText, rightText, ignoreWS]);

  const stats = useMemo(() => {
    let del=0, add=0, mod=0, eq=0;
    for (const r of rows) {
      if      (r.lKind==="del")   del++;
      else if (r.rKind==="add")   add++;
      else if (r.lKind==="mod")   mod++;
      else                        eq++;
    }
    return { del, add, mod, eq };
  }, [rows]);

  const totalChunks = useMemo(() => {
    let mx = -1;
    for (const r of rows) if (r.chunk > mx) mx = r.chunk;
    return mx + 1;
  }, [rows]);

  const identical = rows.length > 0 && stats.del===0 && stats.add===0 && stats.mod===0;

  /* ── Navigation ─────────────────────────────────────────── */
  const goChunk = useCallback((idx: number) => {
    if (totalChunks===0) return;
    const t = ((idx % totalChunks) + totalChunks) % totalChunks;
    setChunk(t);
    const ri = rows.findIndex(r => r.chunk === t);
    if (ri < 0 || !scrollRef.current) return;
    scrollRef.current.scrollTop = Math.max(0, ri * RH - 100);
  }, [rows, totalChunks]);

  /* ── File load ───────────────────────────────────────────── */
  function loadFile(side: "l"|"r") {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".txt,.md,.json,.jsonc,.csv,.ts,.tsx,.js,.jsx,.html,.htm,.css,.scss,.xml,.yaml,.yml,.toml,.ini,.env,.log,.sh,.bat,.sql,.php,.py,.rb,.go,.rs,.java,.cs,.cpp,.c,.h,.config,.csproj,.sln";
    inp.onchange = async () => {
      const f = inp.files?.[0]; if (!f) return;
      side==="l" ? setLeftText(await f.text()) : setRightText(await f.text());
    };
    inp.click();
  }

  function copyL() { navigator.clipboard.writeText(leftText).then(()=>{ setCopiedL(true); setTimeout(()=>setCopiedL(false),1800); }); }
  function copyR() { navigator.clipboard.writeText(rightText).then(()=>{ setCopiedR(true); setTimeout(()=>setCopiedR(false),1800); }); }
  function swap()  { const t=leftText; setLeftText(rightText); setRightText(t); }

  /* ── Apply chunk ─────────────────────────────────────────── */
  function handleApply(chunkIdx: number, dir: "ltr" | "rtl") {
    const lLines = leftText.split("\n");
    const rLines = rightText.split("\n");
    if (dir === "ltr") setRightText(applyLtoR(rows, chunkIdx, rLines).join("\n"));
    else               setLeftText(applyRtoL(rows, chunkIdx, lLines).join("\n"));
  }

  if (!mounted) return null;

  /* ── Style utils ─────────────────────────────────────────── */
  const pill = (on?: boolean): React.CSSProperties => ({
    display:"inline-flex", alignItems:"center", gap:5, cursor:"pointer",
    padding:"3px 10px", borderRadius:6, fontSize:12, fontWeight:500,
    border:`1px solid ${on ? "rgba(139,92,246,.65)" : DIV}`,
    background: on ? "rgba(139,92,246,.16)" : "var(--bg)",
    color: on ? "var(--halo)" : "var(--text)",
    userSelect:"none" as const, transition:"all .12s",
  });
  const icon28: React.CSSProperties = {
    display:"inline-flex",alignItems:"center",justifyContent:"center",
    width:28, height:28, borderRadius:6, cursor:"pointer",
    border:`1px solid ${DIV}`,
    background:"var(--bg)",
    color:"var(--text)",
  };

  /* ════════════════════════════════════════════════════════ */
  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      display:"flex", flexDirection:"column",
      background:"var(--bg)",
      color:"var(--text)",
      fontFamily:"system-ui,-apple-system,sans-serif",
      overflow:"hidden",
    }}>

      {/* ═══ HEADER ═══════════════════════════════════════ */}
      <div style={{
        display:"flex", alignItems:"center", gap:6, flexShrink:0,
        padding:"7px 12px",
        borderBottom:`1px solid ${DIV}`,
        background:"var(--surface)",
      }}>
        <button onClick={onClose} style={icon28}><X size={14}/></button>
        <span style={{ fontSize:14, fontWeight:700, color:"var(--text)", margin:"0 6px 0 2px" }}>Comparateur de texte</span>

        <div style={{ width:1, height:18, background:DIV }}/>

        <button onClick={()=>setEditMode(false)} style={pill(!editMode)}>Vue diff</button>
        <button onClick={()=>setEditMode(true)}  style={pill(editMode)}>Édition</button>

        <div style={{ width:1, height:18, background:DIV }}/>

        <button onClick={()=>setIgnoreWS(v=>!v)} style={pill(ignoreWS)}>Ignorer espaces</button>
        <button onClick={()=>setWordLevel(v=>!v)} style={pill(wordLevel)}>Diff mots</button>
        <button onClick={()=>setWrap(v=>!v)} style={pill(wrap)}><WrapText size={12}/>Retour ligne</button>

        <div style={{ width:1, height:18, background:DIV }}/>

        <button onClick={swap} style={pill()}><ArrowLeftRight size={12}/>Échanger</button>

        {totalChunks > 0 && <>
          <div style={{ width:1, height:18, background:DIV }}/>
          <button onClick={()=>goChunk(chunk<=0 ? totalChunks-1 : chunk-1)} style={icon28}><ChevronUp size={14}/></button>
          <span style={{ fontSize:11, color:"var(--muted)", minWidth:58, textAlign:"center" }}>
            {chunk>=0 ? `${chunk+1} / ${totalChunks}` : `${totalChunks} diff${totalChunks>1?"s":""}`}
          </span>

          <button onClick={()=>goChunk(chunk+1)} style={icon28}><ChevronDown size={14}/></button>
        </>}

        <div style={{ flex:1 }}/>
      </div>

      {/* ═══ STATS ════════════════════════════════════════ */}
      {rows.length > 0 && (
        <div style={{
          display:"flex", alignItems:"center", gap:18, flexShrink:0,
          padding:"3px 16px",
          borderBottom:`1px solid ${DIV}`,
          background:"var(--surface)",
          fontSize:11,
        }}>
          {identical
            ? <span style={{ color:"#4ade80", fontWeight:700 }}>✓ Textes identiques</span>
            : <>
                {stats.del>0 && <span style={{ color:"#f87171" }}>−{stats.del} suppression{stats.del>1?"s":""}</span>}
                {stats.add>0 && <span style={{ color:"#4ade80" }}>+{stats.add} ajout{stats.add>1?"s":""}</span>}
                {stats.mod>0 && <span style={{ color:"#fb923c" }}>~{stats.mod} modification{stats.mod>1?"s":""}</span>}
                {stats.eq >0 && <span style={{ color:"var(--muted)", opacity:.6 }}>{stats.eq} identique{stats.eq>1?"s":""}</span>}
              </>
          }
          <span style={{ marginLeft:"auto", color:"var(--muted)", opacity:.4, fontSize:10 }}>{rows.length} lignes</span>
        </div>
      )}

      {/* ═══ BODY ═════════════════════════════════════════ */}
      {editMode
        ? <EditMode
            leftText={leftText}  setLeft={setLeftText}
            rightText={rightText} setRight={setRightText}
            onLoadL={()=>loadFile("l")} onLoadR={()=>loadFile("r")}
            onCopyL={copyL} onCopyR={copyR}
            copiedL={copiedL} copiedR={copiedR}
          />
        : rows.length === 0
          ? <EmptyState onEdit={()=>setEditMode(true)} onLoadL={()=>loadFile("l")} onLoadR={()=>loadFile("r")}/>
          : <DiffView
              rows={rows} wrap={wrap} wordLevel={wordLevel}
              scrollRef={scrollRef}
              onEditL={()=>setEditMode(true)} onEditR={()=>setEditMode(true)}
              onLoadL={()=>loadFile("l")} onLoadR={()=>loadFile("r")}
              onCopyL={copyL} onCopyR={copyR}
              copiedL={copiedL} copiedR={copiedR}
              onClearL={()=>setLeftText("")} onClearR={()=>setRightText("")}
              hasL={!!leftText} hasR={!!rightText}
              onApply={handleApply}
            />
      }
    </div>,
    document.body
  );
}

/* ════════════════════════════════════════════════════════════
   DiffView — the main side-by-side diff renderer
   ONE single scroll container. Each row is a flex row with
   5 cells: [lNum | lText | divider | rNum | rText]
════════════════════════════════════════════════════════════ */

interface DiffViewProps {
  rows: Row[]; wrap: boolean; wordLevel: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onEditL:()=>void; onEditR:()=>void;
  onLoadL:()=>void; onLoadR:()=>void;
  onCopyL:()=>void; onCopyR:()=>void;
  copiedL:boolean; copiedR:boolean;
  onClearL:()=>void; onClearR:()=>void;
  hasL:boolean; hasR:boolean;
  onApply:(chunkIdx:number, dir:"ltr"|"rtl")=>void;
}

function DiffView({ rows, wrap, wordLevel, scrollRef,
  onEditL, onEditR, onLoadL, onLoadR,
  onCopyL, onCopyR, copiedL, copiedR,
  onClearL, onClearR, hasL, hasR, onApply,
}: DiffViewProps) {

  const monoFont = "ui-monospace,'Cascadia Code',Consolas,'Courier New',monospace";

  // Render text content for a cell
  function renderText(text: string, kind: Kind, other: string|null, isLeft: boolean): React.ReactNode {
    if (kind==="eq") return <span>{text}</span>;
    if (kind==="mod" && wordLevel && other!==null) {
      const { left, right } = wordDiff(isLeft ? text : other, isLeft ? other : text);
      const ops = isLeft ? left : right;
      const hlCol = isLeft ? WHL.del : WHL.add;
      return <>{ops.map((w,i) =>
        w.type==="eq"
          ? <span key={i}>{w.val}</span>
          : <span key={i} style={{ background:hlCol, borderRadius:2, padding:"0 1px" }}>{w.val}</span>
      )}</>;
    }
    return <span>{text}</span>;
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>

      {/* ── Sticky panel labels ─────────────────────────── */}
      <div style={{
        display:"flex", flexShrink:0, height:28,
        borderBottom:`1px solid ${DIV}`,
        background:"var(--surface)",
        position:"sticky", top:0, zIndex:10,
      }}>
        {/* Left header */}
        <div style={{ width:NW, flexShrink:0 }} />
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:6, padding:"0 10px" }}>
          <PanelBtns onLoad={onLoadL} onEdit={onEditL} onCopy={onCopyL} copied={copiedL} onClear={onClearL} hasContent={hasL}/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--muted)" }}>
            Texte A — original
          </span>
        </div>
        {/* Gutter header */}
        <div style={{ width:GW, minWidth:GW, flexShrink:0, background:"var(--card)", borderLeft:`1px solid ${DIV}`, borderRight:`1px solid ${DIV}` }}/>
        {/* Right header */}
        <div style={{ width:NW, flexShrink:0 }} />
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:6, padding:"0 10px" }}>
          <PanelBtns onLoad={onLoadR} onEdit={onEditR} onCopy={onCopyR} copied={copiedR} onClear={onClearR} hasContent={hasR}/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--muted)" }}>
            Texte B — modifié
          </span>
        </div>
      </div>

      {/* ── THE SINGLE SCROLL CONTAINER ─────────────────── */}
      <div
        ref={scrollRef}
        style={{ flex:1, overflowY:"auto", overflowX:"auto" }}
      >
        {rows.map((row, i) => {
          // Compute backgrounds per side
          const lBg  = row.lKind==="mod" ? BG_MOD_L : BG[row.lKind];
          const rBg  = row.rKind==="mod" ? BG_MOD_R : BG[row.rKind];
          const lNBg = NUM_BG[row.lKind];
          const rNBg = row.rKind==="mod" ? NUM_BG_MOD_R : NUM_BG[row.rKind];
          const lNC  = NUM_COL[row.lKind];
          const rNC  = row.rKind==="mod" ? NUM_COL_MOD_R : NUM_COL[row.rKind];

          // Blank-cell stripe — only used for backgroundImage longhand (never in `background` shorthand)
          const STRIPE = "repeating-linear-gradient(135deg,rgba(128,128,128,.06) 0,rgba(128,128,128,.06) 1px,transparent 1px,transparent 9px)";

          // Chunk boundary — add a slightly visible separator
          const isChunkStart = row.chunk >= 0 && (i===0 || rows[i-1].chunk !== row.chunk);

          return (
            <div key={i} style={{
              display:"flex",
              minHeight: RH,
              borderTop: isChunkStart ? `1px solid ${DIV}` : "none",
              borderBottom: `1px solid ${DIV}`,
            }}>
              {/* ── Left line number ── */}
              <div style={{
                width: NW, minWidth: NW,
                display:"flex", alignItems:"center", justifyContent:"flex-end",
                paddingRight:8,
                background: lNBg,
                borderRight:`1px solid ${DIV}`,
                fontFamily: monoFont, fontSize:11, lineHeight:"1",
                color: lNC,
                userSelect:"none",
              }}>
                {row.lNum ?? ""}
              </div>

              {/* ── Left text ── */}
              <div style={{
                flex:1, minWidth:0,
                padding:"0 10px",
                backgroundColor: row.lKind==="blank" ? "transparent" : lBg,
                backgroundImage: row.lKind==="blank" ? STRIPE : "none",
                fontFamily: monoFont, fontSize:12,
                lineHeight: `${RH}px`,
                color: row.lKind==="blank" ? "transparent"
                     : row.lKind==="eq" ? "var(--muted)" : "var(--text)",
                whiteSpace: wrap ? "pre-wrap" : "pre",
                overflow: wrap ? "visible" : "hidden",
                wordBreak: wrap ? "break-all" : "normal",
              }}>
                {row.lText !== null
                  ? renderText(row.lText, row.lKind, row.rText, true)
                  : null
                }
              </div>

              {/* ── Centre gutter with apply arrows ── */}
              <div style={{
                width:GW, minWidth:GW,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:1,
                background:"var(--card)",
                borderLeft:`1px solid ${DIV}`, borderRight:`1px solid ${DIV}`,
                flexShrink:0,
              }}>
                {isChunkStart && row.chunk >= 0 && (
                  <>
                    {/* ← apply right → left */}
                    <button
                      onClick={e => { e.stopPropagation(); onApply(row.chunk, "rtl"); }}
                      title="Appliquer B → A"
                      style={{
                        width:22, height:13, borderRadius:3, border:"none", cursor:"pointer",
                        background:"rgba(30,180,70,.35)", color:"rgba(150,255,160,.95)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:10, lineHeight:1, padding:0,
                      }}
                    >←</button>
                    {/* → apply left → right */}
                    <button
                      onClick={e => { e.stopPropagation(); onApply(row.chunk, "ltr"); }}
                      title="Appliquer A → B"
                      style={{
                        width:22, height:13, borderRadius:3, border:"none", cursor:"pointer",
                        background:"rgba(210,30,30,.30)", color:"rgba(255,150,150,.95)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:10, lineHeight:1, padding:0,
                      }}
                    >→</button>
                  </>
                )}
              </div>

              {/* ── Right line number ── */}
              <div style={{
                width: NW, minWidth: NW,
                display:"flex", alignItems:"center", justifyContent:"flex-end",
                paddingRight:8,
                background: rNBg,
                borderRight:`1px solid ${DIV}`,
                fontFamily: monoFont, fontSize:11, lineHeight:"1",
                color: rNC,
                userSelect:"none",
              }}>
                {row.rNum ?? ""}
              </div>

              {/* ── Right text ── */}
              <div style={{
                flex:1, minWidth:0,
                padding:"0 10px",
                backgroundColor: row.rKind==="blank" ? "transparent" : rBg,
                backgroundImage: row.rKind==="blank" ? STRIPE : "none",
                fontFamily: monoFont, fontSize:12,
                lineHeight: `${RH}px`,
                color: row.rKind==="blank" ? "transparent"
                     : row.rKind==="eq" ? "var(--muted)" : "var(--text)",
                whiteSpace: wrap ? "pre-wrap" : "pre",
                overflow: wrap ? "visible" : "hidden",
                wordBreak: wrap ? "break-all" : "normal",
              }}>
                {row.rText !== null
                  ? renderText(row.rText, row.rKind, row.lText, false)
                  : null
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   EditMode — two panels each with line numbers + textarea
   Vertical scroll synchronized between left and right.
════════════════════════════════════════════════════════════ */

interface EditModeProps {
  leftText:string; setLeft:(v:string)=>void;
  rightText:string; setRight:(v:string)=>void;
  onLoadL:()=>void; onLoadR:()=>void;
  onCopyL:()=>void; onCopyR:()=>void;
  copiedL:boolean; copiedR:boolean;
}

function EditMode({ leftText, setLeft, rightText, setRight,
  onLoadL, onLoadR, onCopyL, onCopyR, copiedL, copiedR,
}: EditModeProps) {
  return (
    <div style={{ flex:1, display:"flex", minHeight:0 }}>
      <NumberedPane
        label="Texte A — original"
        value={leftText} onChange={setLeft}
        onLoad={onLoadL} onCopy={onCopyL} copied={copiedL} onClear={()=>setLeft("")}
      />
      <div style={{ width:1, background:DIV, flexShrink:0 }}/>
      <NumberedPane
        label="Texte B — modifié"
        value={rightText} onChange={setRight}
        onLoad={onLoadR} onCopy={onCopyR} copied={copiedR} onClear={()=>setRight("")}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   NumberedPane — textarea with line numbers (Notepad++ style)
   Line numbers scroll in sync with the textarea.
════════════════════════════════════════════════════════════ */

function NumberedPane({ label, value, onChange, onLoad, onCopy, copied, onClear }: {
  label:string; value:string; onChange:(v:string)=>void;
  onLoad:()=>void; onCopy:()=>void; copied:boolean; onClear:()=>void;
}) {
  const taRef   = useRef<HTMLTextAreaElement>(null);
  const numRef  = useRef<HTMLDivElement>(null);
  const monoFont = "ui-monospace,'Cascadia Code',Consolas,'Courier New',monospace";
  const lineH    = 20; // px — must match textarea line-height

  const lines = value.split("\n");

  // Sync line-numbers scrollTop with textarea scrollTop
  function onScroll() {
    if (taRef.current && numRef.current) {
      numRef.current.scrollTop = taRef.current.scrollTop;
    }
  }

  const sm: React.CSSProperties = {
    display:"inline-flex",alignItems:"center",justifyContent:"center",
    width:24, height:24, borderRadius:5, cursor:"pointer",
    border:`1px solid ${DIV}`,
    background:"var(--bg)",
    color:"var(--text)",
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:6,
        padding:"5px 10px", flexShrink:0,
        borderBottom:`1px solid ${DIV}`,
        background:"var(--surface)",
      }}>
        <span style={{ flex:1, fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--muted)" }}>
          {label}
        </span>
        <button onClick={onLoad} style={sm} title="Importer un fichier"><Upload size={11}/></button>
        {value && <>
          <button onClick={onCopy} style={sm} title="Copier">
            {copied ? <Check size={11} style={{ color:"#4ade80" }}/> : <Copy size={11}/>}
          </button>
          <button onClick={onClear} style={sm} title="Effacer"><Trash2 size={11}/></button>
        </>}
      </div>

      {/* Editor area: [line numbers] [textarea] */}
      <div style={{ flex:1, display:"flex", minHeight:0, overflow:"hidden" }}>

        {/* Line numbers column — non-interactive, scrolls in sync */}
        <div
          ref={numRef}
          style={{
            width: 52, minWidth:52,
            overflowY:"hidden",   // hidden — synced via JS
            overflowX:"hidden",
            background:"var(--card)",
            borderRight:`1px solid ${DIV}`,
            fontFamily: monoFont,
            fontSize:12,
            lineHeight:`${lineH}px`,
            color:"var(--muted)",
            textAlign:"right",
            userSelect:"none",
            paddingTop: 10,
            paddingRight: 8,
            paddingBottom: 10,
            boxSizing:"border-box",
          }}
        >
          {lines.map((_, i) => (
            <div key={i} style={{ height: lineH }}>{i+1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={taRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={onScroll}
          placeholder="Colle ton texte ici, ou importe un fichier…"
          spellCheck={false}
          style={{
            flex:1,
            resize:"none",
            outline:"none",
            border:"none",
            background:"var(--bg)",
            color:"var(--text)",
            fontFamily: monoFont,
            fontSize:12,
            lineHeight:`${lineH}px`,
            padding:"10px 14px",
            overflowY:"auto",
            overflowX:"auto",
            whiteSpace:"pre",
            wordBreak:"normal",
          }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PanelBtns — tiny action buttons in diff panel header
════════════════════════════════════════════════════════════ */

function PanelBtns({ onLoad, onEdit, onCopy, copied, onClear, hasContent }: {
  onLoad:()=>void; onEdit:()=>void; onCopy:()=>void;
  copied:boolean; onClear:()=>void; hasContent:boolean;
}) {
  const s: React.CSSProperties = {
    display:"inline-flex",alignItems:"center",justifyContent:"center",
    width:20, height:20, borderRadius:4, cursor:"pointer",
    border:`1px solid ${DIV}`,
    background:"var(--bg)",
    color:"var(--text)",
  };
  return (
    <div style={{ display:"flex", gap:3 }}>
      <button style={s} onClick={onLoad} title="Importer"><Upload size={10}/></button>
      {hasContent && <>
        <button style={s} onClick={onEdit} title="Modifier">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button style={s} onClick={onCopy} title="Copier">
          {copied ? <Check size={10} style={{ color:"#4ade80" }}/> : <Copy size={10}/>}
        </button>
        <button style={s} onClick={onClear} title="Effacer"><Trash2 size={10}/></button>
      </>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   EmptyState
════════════════════════════════════════════════════════════ */

function EmptyState({ onEdit, onLoadL, onLoadR }: {
  onEdit:()=>void; onLoadL:()=>void; onLoadR:()=>void;
}) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.2">
        <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <line x1="12" y1="3" x2="12" y2="21"/>
      </svg>
      <p style={{ fontSize:13, color:"var(--muted)", opacity:.65, textAlign:"center", maxWidth:300, lineHeight:1.6 }}>
        Importe ou colle deux textes pour visualiser les différences
      </p>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onEdit} style={{
          padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
          border:"1px solid rgba(139,92,246,.55)", background:"rgba(139,92,246,.15)", color:"#c4b5fd",
        }}>Saisir du texte</button>
        <button onClick={onLoadL} style={{
          padding:"8px 14px", borderRadius:8, fontSize:12, fontWeight:500, cursor:"pointer",
          border:`1px solid ${DIV}`, background:"var(--card)", color:"var(--muted)",
          display:"flex", alignItems:"center", gap:6,
        }}><Upload size={12}/>Fichier A</button>
        <button onClick={onLoadR} style={{
          padding:"8px 14px", borderRadius:8, fontSize:12, fontWeight:500, cursor:"pointer",
          border:`1px solid ${DIV}`, background:"var(--card)", color:"var(--muted)",
          display:"flex", alignItems:"center", gap:6,
        }}><Upload size={12}/>Fichier B</button>
      </div>
    </div>
  );
}
