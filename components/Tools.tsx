"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Image as ImageIcon,
  FilePlus,
  Scissors,
  RefreshCw,
  KeyRound,
  Receipt,
  CalendarDays,
  Ruler,
  Code2,
  ScanSearch,
  QrCode,
  ArrowLeft,
  Download,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Check,
  Key,
  Clock,
  Maximize2,
  Minimize2,
  MapPin,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */
type ToolId = "resize" | "merge" | "extract" | "convert" | "password" | "tva" | "date" | "units" | "base64" | "meta" | "qrcode" | "clock";

interface Tool {
  id: ToolId;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge: string;
}

const TOOLS: Tool[] = [
  { id: "resize",   icon: <ImageIcon size={18} />,     title: "Image Resizer",              desc: "Redimensionne tes images — tailles personnalisées ou formats App Store / Play Store.", badge: "Image" },
  { id: "merge",    icon: <FilePlus size={18} />,       title: "Fusionner en PDF",           desc: "Combine plusieurs PDF, PNG ou JPG en un seul document PDF.",                          badge: "PDF" },
  { id: "extract",  icon: <Scissors size={18} />,       title: "Extraire pages PDF",         desc: "Extrait une plage de pages d'un PDF.",                                                badge: "PDF" },
  { id: "convert",  icon: <RefreshCw size={18} />,      title: "Convertir des images",       desc: "PNG · JPG · WebP avec qualité ajustable.",                                            badge: "Image" },
  { id: "qrcode",   icon: <QrCode size={18} />,         title: "Générateur QR Code",         desc: "Crée un QR code stylisé avec titre et cadre coloré. Téléchargeable en PNG.",          badge: "Quotidien" },
  { id: "password", icon: <KeyRound size={18} />,       title: "Mots de passe",              desc: "Génère des mots de passe sécurisés avec options de complexité.",                      badge: "Sécurité" },
  { id: "date",     icon: <CalendarDays size={18} />,   title: "Calculateur de dates",       desc: "Différence entre dates, ajouter des jours, calculer l'âge.",                         badge: "Quotidien" },
  //{ id: "units",    icon: <Ruler size={18} />,          title: "Convertisseur d'unités",     desc: "Longueur, masse, température, surface — km/miles, kg/lbs, °C/°F…",                   badge: "Quotidien" },
  { id: "base64",   icon: <Code2 size={18} />,          title: "Base64",                     desc: "Encode images et textes en Base64. Gestion de clés nommées avec préfixe/suffixe.",  badge: "Dev" },
  { id: "meta",     icon: <ScanSearch size={18} />,     title: "Inspecteur de fichier",      desc: "Dimensions, taille, format, ratio d'une image ou d'un PDF.",                         badge: "Dev" },
  { id: "tva",      icon: <Receipt size={18} />,        title: "Calculateur TVA",            desc: "Calcule HT ↔ TTC selon le taux de ton pays (CH, FR, BE…).",                          badge: "Finance" },
  { id: "units",    icon: <Ruler size={18} />,          title: "Convertisseur d'unités",     desc: "Longueur, masse, température, surface — km/miles, kg/lbs, °C/°F…",                   badge: "Quotidien" },
  { id: "clock",    icon: <Clock size={18} />,          title: "Horloge",                    desc: "Affichage de l'heure en grand, personnalisable — idéal pour les examens ou réunions.", badge: "Quotidien" },
];

/* ── Helpers ────────────────────────────────────────────── */
function loadImg(file: File): Promise<HTMLImageElement> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.src = URL.createObjectURL(file);
  });
}

function parseRange(str: string, total: number): number[] {
  const pages = new Set<number>();
  str.split(",").forEach((part) => {
    part = part.trim();
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      for (let i = a; i <= Math.min(b, total); i++) pages.add(i - 1);
    } else {
      const n = parseInt(part);
      if (n >= 1 && n <= total) pages.add(n - 1);
    }
  });
  return [...pages].sort((a, b) => a - b);
}

/* ── Shared UI ──────────────────────────────────────────── */
function DropZone({ onFiles, accept, multiple = false, label }: {
  onFiles: (f: FileList) => void; accept: string; multiple?: boolean; label: string;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      className={["relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all duration-200",
        over ? "border-[var(--nebula)] bg-[rgba(108,99,255,.06)]" : "border-[var(--stroke)] hover:border-[var(--nebula)] hover:bg-[rgba(108,99,255,.03)]"].join(" ")}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}
    >
      <input type="file" accept={accept} multiple={multiple} className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={(e) => e.target.files && onFiles(e.target.files)} />
      <span className="text-2xl">{label.split(" ")[0]}</span>
      <span className="text-sm" style={{ color: "var(--muted)" }}>
        Glisse ici ou <span style={{ color: "var(--nebula)" }}>clique pour parcourir</span>
      </span>
    </label>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-[11px]"
      style={{ border: "1px solid var(--stroke)", background: "rgba(108,99,255,.08)", color: "var(--halo)" }}>
      {children}
    </span>
  );
}

function DlBtn({ href, name }: { href: string; name: string }) {
  return (
    <a href={href} download={name}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-white transition-all hover:opacity-80"
      style={{ border: "1px solid rgba(108,99,255,.4)", background: "rgba(108,99,255,.12)" }}>
      <Download size={12} /> Télécharger
    </a>
  );
}

function ActionBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm text-white transition-all hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
      style={{ background: "linear-gradient(135deg, var(--nebula), var(--indigo))", border: "1px solid rgba(108,99,255,.3)" }}>
      {children}
    </button>
  );
}

function Status({ msg }: { msg: string }) {
  return msg ? <p className="mt-2 text-xs" style={{ color: "var(--nebula)" }}>{msg}</p> : null;
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-lg px-3 py-1.5 text-xs transition-all"
      style={active
        ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.12)", color: "var(--halo)" }
        : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
      {children}
    </button>
  );
}

/* ── QR CODE GENERATOR ──────────────────────────────────── */
function QRTool() {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [titlePos, setTitlePos] = useState<"top" | "bottom">("bottom");
  const [frameColor, setFrameColor] = useState("#3B82F6");
  const [bgColor, setBgColor] = useState("#07091A");
  const [qrColor, setQrColor] = useState("#E0DEFF");
  const [status, setStatus] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [qrLoaded, setQrLoaded] = useState(false);

  // Load qrcode library
  useEffect(() => {
    if (!(window as any).QRCode) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      s.onload = () => setQrLoaded(true);
      document.head.appendChild(s);
    } else {
      setQrLoaded(true);
    }
  }, []);

  const PADDING = 24;
  const QR_SIZE = 280;
  const TITLE_HEIGHT = title ? 64 : 0;
  const FRAME_RADIUS = 20;

  const drawQR = useCallback(async () => {
    if (!text.trim()) { setStatus("⚠ Entre un texte ou une URL"); return; }
    if (!qrLoaded) { setStatus("⚠ Chargement en cours…"); return; }

    setStatus("Génération…");

    // Generate QR via hidden div
    const tmp = document.createElement("div");
    tmp.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
    document.body.appendChild(tmp);

    try {
      await new Promise<void>((res, rej) => {
        new (window as any).QRCode(tmp, {
          text: text.trim(),
          width: QR_SIZE,
          height: QR_SIZE,
          colorDark: qrColor,
          colorLight: bgColor,
          correctLevel: (window as any).QRCode.CorrectLevel.H,
        });
        setTimeout(() => {
          const img = tmp.querySelector("img") as HTMLImageElement | null;
          const cvs = tmp.querySelector("canvas") as HTMLCanvasElement | null;
          if (img) { img.onload = () => res(); if (img.complete) res(); }
          else if (cvs) res();
          else setTimeout(res, 300);
        }, 100);
      });

      // Get QR image source
      const qrImg = tmp.querySelector("img") as HTMLImageElement | null;
      const qrCvs = tmp.querySelector("canvas") as HTMLCanvasElement | null;
      const qrSrc = qrImg?.src || qrCvs?.toDataURL() || "";
      document.body.removeChild(tmp);

      if (!qrSrc) { setStatus("⚠ Erreur génération QR"); return; }

      // Draw final canvas
      const canvas = canvasRef.current!;
      const totalH = QR_SIZE + PADDING * 2 + TITLE_HEIGHT + (title ? PADDING : 0);
      const totalW = QR_SIZE + PADDING * 2;
      canvas.width = totalW;
      canvas.height = totalH;
      const ctx = canvas.getContext("2d")!;

      // Background with rounded rect
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(0, 0, totalW, totalH, FRAME_RADIUS);
      ctx.fill();

      // Frame border
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(2, 2, totalW - 4, totalH - 4, FRAME_RADIUS - 2);
      ctx.stroke();

      // Title band
      if (title) {
        const bandY = titlePos === "top" ? 0 : totalH - TITLE_HEIGHT;
        ctx.fillStyle = frameColor;
        if (titlePos === "top") {
          ctx.beginPath();
          ctx.roundRect(0, 0, totalW, TITLE_HEIGHT, [FRAME_RADIUS, FRAME_RADIUS, 0, 0]);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.roundRect(0, bandY, totalW, TITLE_HEIGHT, [0, 0, FRAME_RADIUS, FRAME_RADIUS]);
          ctx.fill();
        }

        // Title text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 22px 'Syne', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(title, totalW / 2, bandY + TITLE_HEIGHT / 2, totalW - PADDING * 2);
      }

      // QR image
      const qrImage = new window.Image();
      qrImage.onload = () => {
        const qrY = titlePos === "top" && title ? TITLE_HEIGHT + PADDING : PADDING;
        ctx.drawImage(qrImage, PADDING, qrY, QR_SIZE, QR_SIZE);

        // Copy to preview
        const preview = previewRef.current;
        if (preview) {
          const pCtx = preview.getContext("2d")!;
          const scale = Math.min(320 / totalW, 320 / totalH);
          preview.width = totalW * scale;
          preview.height = totalH * scale;
          pCtx.scale(scale, scale);
          pCtx.drawImage(canvas, 0, 0);
        }
        setStatus("✓ QR Code généré !");
      };
      qrImage.src = qrSrc;

    } catch (e: any) {
      if (document.body.contains(tmp)) document.body.removeChild(tmp);
      setStatus("⚠ " + e.message);
    }
  }, [text, title, titlePos, frameColor, bgColor, qrColor, qrLoaded, TITLE_HEIGHT]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-${title || "code"}.png`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <canvas ref={canvasRef} className="hidden" />

      {/* Input */}
      <div>
        <label className="mb-1 block text-xs" style={{ color: "var(--muted)" }}>Texte ou URL à encoder *</label>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="https://exemple.com ou n'importe quel texte"
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
          style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)" }} />
      </div>

      {/* Title */}
      <div>
        <label className="mb-1 block text-xs" style={{ color: "var(--muted)" }}>Titre / En-tête (optionnel)</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Mon QR Code"
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
          style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)" }} />
      </div>

      {/* Title position */}
      {title && (
        <div className="flex gap-2">
          <ToggleBtn active={titlePos === "top"}    onClick={() => setTitlePos("top")}>Titre en haut</ToggleBtn>
          <ToggleBtn active={titlePos === "bottom"} onClick={() => setTitlePos("bottom")}>Titre en bas</ToggleBtn>
        </div>
      )}

      {/* Colors */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: "var(--muted)" }}>Couleur cadre</label>
          <div className="flex items-center gap-2">
            <input type="color" value={frameColor} onChange={(e) => setFrameColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded-lg p-1" style={{ border: "1px solid var(--stroke)", background: "transparent" }} />
            <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>{frameColor}</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: "var(--muted)" }}>Fond QR</label>
          <div className="flex items-center gap-2">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded-lg p-1" style={{ border: "1px solid var(--stroke)", background: "transparent" }} />
            <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>{bgColor}</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: "var(--muted)" }}>Couleur QR</label>
          <div className="flex items-center gap-2">
            <input type="color" value={qrColor} onChange={(e) => setQrColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded-lg p-1" style={{ border: "1px solid var(--stroke)", background: "transparent" }} />
            <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>{qrColor}</span>
          </div>
        </div>
      </div>

      {/* Quick color presets */}
      <div>
        <p className="mb-2 text-[11px]" style={{ color: "var(--muted)" }}>Présets cadre rapides</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Bleu",    color: "#3B82F6" },
            { label: "Vert",    color: "#22C55E" },
            { label: "Or",      color: "#D4A84B" },
            { label: "Rouge",   color: "#CF2328" },
            { label: "Blanc",   color: "#E0DEFF" },
            { label: "Noir",    color: "#111428" },
          ].map((p) => (
            <button key={p.color} onClick={() => setFrameColor(p.color)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] transition hover:opacity-80"
              style={{ border: `1px solid ${frameColor === p.color ? p.color : "var(--stroke)"}`, background: frameColor === p.color ? `${p.color}22` : "transparent", color: "var(--muted)" }}>
              <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <ActionBtn onClick={drawQR}>Générer le QR Code</ActionBtn>
      <Status msg={status} />

      {/* Preview */}
      {status.startsWith("✓") && (
        <div className="flex flex-col items-center gap-4">
          <canvas ref={previewRef} className="rounded-2xl" style={{ border: "1px solid var(--stroke)" }} />
          <button onClick={download}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm text-white transition hover:opacity-80"
            style={{ background: "linear-gradient(135deg, var(--nebula), var(--indigo))" }}>
            <Download size={15} /> Télécharger en PNG
          </button>
        </div>
      )}
    </div>
  );
}

/* ── IMAGE RESIZER ──────────────────────────────────────── */
type ResizeSubMode = "custom" | "ios" | "android";

const IOS_SIZES = [
  { label: '6,9" iPhone 16 Pro Max', w: 1320, h: 2868 },
  { label: '6,7" iPhone 16 Plus',    w: 1290, h: 2796 },
  { label: '6,5" iPhone 11 Pro Max', w: 1284, h: 2778 },
  { label: '5,5" iPhone 8 Plus',     w: 1242, h: 2208 },
  { label: 'iPad Pro 12,9"',         w: 2048, h: 2732 },
  { label: 'iPad Pro 11"',           w: 1668, h: 2388 },
];

const ANDROID_SIZES = [
  { label: 'Phone portrait',    w: 1080, h: 1920 },
  { label: 'Phone 16:9',        w: 1080, h: 1920 },
  { label: 'Tablet 7"',         w: 1200, h: 1920 },
  { label: 'Tablet 10"',        w: 1600, h: 2560 },
  { label: 'Feature Graphic',   w: 1024, h: 500  },
  { label: 'Play Store Icon',   w: 512,  h: 512  },
];

function ResizeTool() {
  const [subMode, setSubMode] = useState<ResizeSubMode>("custom");
  const [w, setW] = useState(1290);
  const [h, setH] = useState(2796);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [mode, setMode] = useState<"fit"|"fill"|"stretch">("fit");
  const [bg, setBg] = useState("#07091A");
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{ url: string; name: string; w: number; h: number }[]>([]);
  const [status, setStatus] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sizes = subMode === "ios" ? IOS_SIZES : subMode === "android" ? ANDROID_SIZES : null;

  const convert = useCallback(async () => {
    if (!files.length || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = w; canvas.height = h;
    setStatus("Conversion en cours…");
    const out: typeof results = [];
    for (const f of files) {
      const img = await loadImg(f);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      if (mode === "stretch") { ctx.drawImage(img, 0, 0, w, h); }
      else if (mode === "fill") { const s = Math.max(w/img.width, h/img.height); ctx.drawImage(img, (w-img.width*s)/2, (h-img.height*s)/2, img.width*s, img.height*s); }
      else { const s = Math.min(w/img.width, h/img.height); ctx.drawImage(img, (w-img.width*s)/2, (h-img.height*s)/2, img.width*s, img.height*s); }
      out.push({ url: canvas.toDataURL("image/png"), name: f.name.replace(/\.[^.]+$/, "")+`_${w}x${h}.png`, w, h });
    }
    setResults(out); setStatus(`✓ ${out.length} image(s) converties !`);
  }, [files, w, h, mode, bg]);

  return (
    <div className="space-y-5">
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-2 flex-wrap">
        {([["custom","Personnalisé"],["ios","App Store iOS"],["android","Play Store Android"]] as const).map(([m,l]) => (
          <ToggleBtn key={m} active={subMode===m} onClick={() => { setSubMode(m); setSelectedPreset(""); }}>{l}</ToggleBtn>
        ))}
      </div>
      {sizes && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {sizes.map((s) => (
            <button key={s.label} onClick={() => { setW(s.w); setH(s.h); setSelectedPreset(s.label); }}
              className="rounded-xl p-3 text-left text-xs transition-all"
              style={selectedPreset===s.label
                ? { border:"1px solid var(--nebula)", background:"rgba(108,99,255,.10)", color:"var(--text)" }
                : { border:"1px solid var(--stroke)", background:"rgba(255,255,255,.02)", color:"var(--muted)" }}>
              <span className="block font-semibold mb-0.5" style={{ color: selectedPreset===s.label ? "var(--halo)" : "var(--nebula)" }}>{s.label}</span>
              <span className="text-[10px]">{s.w} × {s.h}</span>
            </button>
          ))}
        </div>
      )}
      {subMode === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          {[["Largeur (px)", w, setW],["Hauteur (px)", h, setH]].map(([label, val, setter]) => (
            <div key={label as string}>
              <label className="mb-1 block text-[11px]" style={{ color:"var(--muted)" }}>{label as string}</label>
              <input type="number" value={val as number} onChange={(e) => (setter as any)(+e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.04)" }} />
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs" style={{ color:"var(--muted)" }}>Mode :</span>
        {(["fit","fill","stretch"] as const).map((m) => <ToggleBtn key={m} active={mode===m} onClick={() => setMode(m)}>{m}</ToggleBtn>)}
        <label className="ml-auto flex items-center gap-2 text-xs" style={{ color:"var(--muted)" }}>
          Fond : <input type="color" value={bg} onChange={(e) => setBg(e.target.value)}
            className="h-7 w-10 cursor-pointer rounded p-0.5" style={{ border:"1px solid var(--stroke)" }} />
        </label>
      </div>
      <DropZone accept="image/*" multiple onFiles={(f) => { setFiles(Array.from(f)); setResults([]); setStatus(`${f.length} image(s) chargée(s)`); }} label="📁 Glisse tes images ici" />
      {results.map((r) => (
        <div key={r.name} className="flex items-center gap-3 rounded-xl p-3" style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.02)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={r.url} alt="" className="h-10 w-10 rounded-lg object-cover" style={{ border:"1px solid var(--stroke)" }} />
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs" style={{ color:"var(--text)" }}>{r.name}</p>
            <p className="text-[10px]" style={{ color:"var(--muted)" }}>{r.w} × {r.h} px</p>
          </div>
          <DlBtn href={r.url} name={r.name} />
        </div>
      ))}
      {results.length > 1 && (
        <button onClick={() => results.forEach((r,i) => setTimeout(() => { const a=document.createElement("a"); a.href=r.url; a.download=r.name; a.click(); },i*300))}
          className="w-full rounded-xl py-2 text-xs transition hover:opacity-80"
          style={{ border:"1px solid var(--stroke)", color:"var(--muted)" }}>
          Tout télécharger
        </button>
      )}
      <ActionBtn onClick={convert} disabled={!files.length}>Convertir les images</ActionBtn>
      <Status msg={status} />
    </div>
  );
}

/* ── MERGE PDF + IMAGES ─────────────────────────────────── */
function MergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");

  const merge = async () => {
    setStatus("Chargement pdf-lib…");
    try {
      if (!window.PDFLib) {
        await new Promise<void>((res,rej) => { const s=document.createElement("script"); s.src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"; s.onload=()=>res(); s.onerror=()=>rej(new Error("CDN")); document.head.appendChild(s); });
      }
      setStatus("Fusion en cours…");
      const { PDFDocument } = (window as any).PDFLib;
      const merged = await PDFDocument.create();
      for (const f of files) {
        if (f.type === "application/pdf") {
          const pdf = await PDFDocument.load(await f.arrayBuffer());
          const pages = await merged.copyPages(pdf, pdf.getPageIndices());
          pages.forEach((p: any) => merged.addPage(p));
        } else {
          const bytes = await f.arrayBuffer();
          const img = f.type === "image/png" ? await merged.embedPng(bytes) : await merged.embedJpg(bytes);
          const page = merged.addPage([img.width, img.height]);
          page.drawImage(img, { x:0, y:0, width:img.width, height:img.height });
        }
      }
      const blob = new Blob([await merged.save()], { type:"application/pdf" });
      const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="merged.pdf"; a.click();
      setStatus("✓ PDF téléchargé !");
    } catch(e:any) { setStatus("⚠ "+e.message); }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color:"var(--muted)" }}>Accepte PDF, PNG et JPG — mélange possible.</p>
      <DropZone accept="application/pdf,image/png,image/jpeg" multiple onFiles={(f) => setFiles(p=>[...p,...Array.from(f)])} label="📄 Glisse tes fichiers ici" />
      {files.map((f,i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl p-3" style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.02)" }}>
          <span className="flex-shrink-0" style={{ color:"var(--nebula)" }}>
            {f.type==="application/pdf" ? <Scissors size={16}/> : <ImageIcon size={16}/>}
          </span>
          <span className="flex-1 truncate text-xs" style={{ color:"var(--text)" }}>{f.name}</span>
          <span className="text-[10px]" style={{ color:"var(--muted)" }}>{(f.size/1024).toFixed(0)} KB</span>
          <button onClick={() => setFiles(p=>p.filter((_,j)=>j!==i))} style={{ color:"var(--red)" }}><X size={14}/></button>
        </div>
      ))}
      <ActionBtn onClick={merge} disabled={files.length<2}>Fusionner en PDF</ActionBtn>
      <Status msg={status} />
    </div>
  );
}

/* ── EXTRACT PDF ────────────────────────────────────────── */
function ExtractTool() {
  const [file, setFile] = useState<File|null>(null);
  const [range, setRange] = useState("");
  const [status, setStatus] = useState("");

  const extract = async () => {
    if (!file) return;
    setStatus("Chargement pdf-lib…");
    try {
      if (!window.PDFLib) {
        await new Promise<void>((res,rej) => { const s=document.createElement("script"); s.src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"; s.onload=()=>res(); s.onerror=()=>rej(new Error("CDN")); document.head.appendChild(s); });
      }
      const { PDFDocument } = (window as any).PDFLib;
      const src = await PDFDocument.load(await file.arrayBuffer());
      const indices = parseRange(range, src.getPageCount());
      if (!indices.length) { setStatus("⚠ Aucune page valide"); return; }
      const out = await PDFDocument.create();
      (await out.copyPages(src, indices)).forEach((p:any) => out.addPage(p));
      const blob = new Blob([await out.save()], { type:"application/pdf" });
      const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="extracted.pdf"; a.click();
      setStatus(`✓ ${indices.length} page(s) extraite(s) !`);
    } catch(e:any) { setStatus("⚠ "+e.message); }
  };

  return (
    <div className="space-y-4">
      <DropZone accept="application/pdf" onFiles={(f) => { setFile(f[0]); setStatus("Fichier chargé"); }} label="📄 Glisse un PDF ici" />
      {file && <div className="rounded-xl p-3 text-xs" style={{ border:"1px solid var(--stroke)", color:"var(--muted)" }}>📄 {file.name} — {(file.size/1024).toFixed(0)} KB</div>}
      <div>
        <label className="mb-1.5 block text-xs" style={{ color:"var(--muted)" }}>Pages à extraire</label>
        <input type="text" value={range} onChange={(e) => setRange(e.target.value)} placeholder="ex: 1, 3, 5-8, 10"
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.04)" }} />
        <p className="mt-1 text-[11px]" style={{ color:"var(--muted)" }}>Virgules pour pages séparées, tirets pour plages.</p>
      </div>
      <ActionBtn onClick={extract} disabled={!file||!range.trim()}>Extraire les pages</ActionBtn>
      <Status msg={status} />
    </div>
  );
}

/* ── CONVERT IMAGES ─────────────────────────────────────── */

/** Génère un fichier .ico contenant plusieurs tailles (16, 32, 48, 256) */
async function generateIco(imgElement: HTMLImageElement): Promise<Blob> {
  const sizes = [16, 32, 48, 256];
  const pngBuffers: ArrayBuffer[] = [];

  for (const size of sizes) {
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(imgElement, 0, 0, size, size);
    const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));
    pngBuffers.push(await blob.arrayBuffer());
  }

  // ICO header
  const numImages = sizes.length;
  const headerSize = 6 + numImages * 16;
  let offset = headerSize;
  const totalSize = headerSize + pngBuffers.reduce((acc, buf) => acc + buf.byteLength, 0);
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // ICONDIR
  view.setUint16(0, 0, true);  // reserved
  view.setUint16(2, 1, true);  // type: ICO
  view.setUint16(4, numImages, true);

  // ICONDIRENTRY for each image
  pngBuffers.forEach((buf, i) => {
    const size = sizes[i];
    const base = 6 + i * 16;
    view.setUint8(base, size === 256 ? 0 : size);  // width (0 = 256)
    view.setUint8(base + 1, size === 256 ? 0 : size); // height
    view.setUint8(base + 2, 0);   // color count
    view.setUint8(base + 3, 0);   // reserved
    view.setUint16(base + 4, 1, true);  // color planes
    view.setUint16(base + 6, 32, true); // bits per pixel
    view.setUint32(base + 8, buf.byteLength, true); // size of image data
    view.setUint32(base + 12, offset, true); // offset
    offset += buf.byteLength;
  });

  // Image data
  let dataOffset = headerSize;
  pngBuffers.forEach((buf) => {
    new Uint8Array(buffer, dataOffset, buf.byteLength).set(new Uint8Array(buf));
    dataOffset += buf.byteLength;
  });

  return new Blob([buffer], { type: "image/x-icon" });
}

function ConvertTool() {
  const [mode, setMode] = useState<"image/png"|"image/jpeg"|"image/webp"|"ico">("image/png");
  const [quality, setQuality] = useState(90);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{url:string;name:string}[]>([]);
  const [status, setStatus] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isIco = mode === "ico";
  const ext = isIco ? "ico" : mode.split("/")[1];

  const convert = async () => {
    if (!files.length || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const out: typeof results = [];
    setStatus("Conversion…");

    for (const f of files) {
      const img = await loadImg(f);

      if (isIco) {
        // Génération ICO multi-tailles
        const icoBlob = await generateIco(img);
        const url = URL.createObjectURL(icoBlob);
        out.push({ url, name: f.name.replace(/\.[^.]+$/, "") + ".ico" });
      } else {
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        out.push({ url: canvas.toDataURL(mode, quality / 100), name: f.name.replace(/\.[^.]+$/, "") + "." + ext });
      }
    }
    setResults(out);
    setStatus(`✓ ${out.length} image(s) converties !`);
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-2 flex-wrap">
        {([
          ["image/png",  "PNG"],
          ["image/jpeg", "JPG"],
          ["image/webp", "WebP"],
          ["ico",        "ICO (Windows)"],
        ] as const).map(([f, l]) => (
          <ToggleBtn key={f} active={mode === f} onClick={() => setMode(f)}>{l}</ToggleBtn>
        ))}
      </div>

      {mode === "image/jpeg" || mode === "image/webp" ? (
        <div>
          <p className="mb-1 text-xs" style={{ color:"var(--muted)" }}>Qualité : {quality}%</p>
          <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-[var(--nebula)]" />
        </div>
      ) : null}

      {isIco && (
        <div className="rounded-xl p-3 text-xs" style={{ border:"1px solid var(--stroke)", background:"rgba(108,99,255,.06)", color:"var(--muted)" }}>
          Génère un fichier <span style={{ color:"var(--halo)" }}>.ico</span> contenant 4 tailles (16×16, 32×32, 48×48, 256×256) — parfait pour icône d'application Windows ou favicon.
        </div>
      )}

      <DropZone accept="image/*" multiple onFiles={(f) => { setFiles(Array.from(f)); setResults([]); setStatus(`${f.length} image(s) chargée(s)`); }} label="🖼 Glisse tes images ici" />

      {results.map((r) => (
        <div key={r.name} className="flex items-center gap-3 rounded-xl p-3" style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.02)" }}>
          <span className="flex-1 truncate text-xs" style={{ color:"var(--text)" }}>{r.name}</span>
          <DlBtn href={r.url} name={r.name} />
        </div>
      ))}
      <ActionBtn onClick={convert} disabled={!files.length}>Convertir</ActionBtn>
      <Status msg={status} />
    </div>
  );
}

/* ── PASSWORD ───────────────────────────────────────────── */
function PasswordTool() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copied, setCopied] = useState("");

  const generate = () => {
    let chars="";
    if(useUpper) chars+="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(useLower) chars+="abcdefghijklmnopqrstuvwxyz";
    if(useNumbers) chars+="0123456789";
    if(useSymbols) chars+="!@#$%^&*()_+-=[]{}|;:,.<>?";
    if(!chars) return;
    setPasswords(Array.from({length:5},()=>Array.from({length},()=>chars[Math.floor(Math.random()*chars.length)]).join("")));
  };

  const copy = (p:string) => { navigator.clipboard.writeText(p).then(()=>{ setCopied(p); setTimeout(()=>setCopied(""),2000); }); };
  const strength = (useUpper?1:0)+(useLower?1:0)+(useNumbers?1:0)+(useSymbols?1:0);
  const [strengthLabel,strengthColor] = [["","Faible","Moyen","Fort","Très fort"][strength],["","var(--red)","var(--gold)","var(--nebula)","var(--halo)"][strength]];

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs" style={{ color:"var(--muted)" }}>Longueur : {length} caractères</p>
        <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(+e.target.value)} className="w-full accent-[var(--nebula)]" />
      </div>
      <div className="flex flex-wrap gap-2">
        <ToggleBtn active={useUpper}   onClick={()=>setUseUpper(v=>!v)}>A-Z Majuscules</ToggleBtn>
        <ToggleBtn active={useLower}   onClick={()=>setUseLower(v=>!v)}>a-z Minuscules</ToggleBtn>
        <ToggleBtn active={useNumbers} onClick={()=>setUseNumbers(v=>!v)}>0-9 Chiffres</ToggleBtn>
        <ToggleBtn active={useSymbols} onClick={()=>setUseSymbols(v=>!v)}>!@# Symboles</ToggleBtn>
      </div>
      {strength>0 && <p className="text-xs" style={{ color:strengthColor }}>Force : {strengthLabel}</p>}
      <ActionBtn onClick={generate} disabled={strength===0}>Générer 5 mots de passe</ActionBtn>
      {passwords.map((p) => (
        <div key={p} onClick={()=>copy(p)} className="flex items-center gap-3 rounded-xl p-3 cursor-pointer transition hover:opacity-80"
          style={{ border:`1px solid ${copied===p?"var(--nebula)":"var(--stroke)"}`, background:"rgba(255,255,255,.02)" }}>
          <span className="flex-1 font-mono text-xs break-all" style={{ color:"var(--text)" }}>{p}</span>
          <span className="text-xs flex-shrink-0" style={{ color:copied===p?"var(--halo)":"var(--muted)" }}>{copied===p?"✓ Copié !":"Copier"}</span>
        </div>
      ))}
    </div>
  );
}

/* ── TVA ────────────────────────────────────────────────── */
function TVATool() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("8.1");
  const [dir, setDir] = useState<"ht"|"ttc">("ht");
  const val=parseFloat(amount); const r=parseFloat(rate)/100;
  const ht=dir==="ht"?val:val/(1+r);
  const ttc=dir==="ht"?val*(1+r):val;
  const tva=ttc-ht;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <ToggleBtn active={dir==="ht"} onClick={()=>setDir("ht")}>HT → TTC</ToggleBtn>
        <ToggleBtn active={dir==="ttc"} onClick={()=>setDir("ttc")}>TTC → HT</ToggleBtn>
      </div>
      <div>
        <label className="mb-1 block text-xs" style={{ color:"var(--muted)" }}>Montant {dir==="ht"?"HT":"TTC"}</label>
        <input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="100.00"
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
          style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.04)" }} />
      </div>
      <div>
        <label className="mb-1 block text-xs" style={{ color:"var(--muted)" }}>Taux TVA (%)</label>
        <div className="flex gap-2 flex-wrap mb-2">
          {["2.6","3.8","8.1","20","21"].map((r)=><ToggleBtn key={r} active={rate===r} onClick={()=>setRate(r)}>{r}%</ToggleBtn>)}
        </div>
        <input type="number" value={rate} onChange={(e)=>setRate(e.target.value)}
          className="w-full rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
          style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.04)" }} />
      </div>
      {val>0 && (
        <div className="rounded-xl p-4 space-y-3" style={{ border:"1px solid var(--nebula)", background:"rgba(108,99,255,.06)" }}>
          {[["Montant HT",ht],["TVA",tva],["Montant TTC",ttc]].map(([l,v])=>(
            <div key={l as string} className="flex justify-between">
              <span className="text-sm" style={{ color:"var(--muted)" }}>{l as string}</span>
              <span className="text-sm font-semibold" style={{ color:l==="Montant TTC"?"var(--halo)":"var(--text)" }}>{(v as number).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── DATE CALCULATOR ────────────────────────────────────── */
function DateTool() {
  const [mode, setMode] = useState<"diff"|"add"|"age">("diff");
  const [d1, setD1] = useState(""); const [d2, setD2] = useState(""); const [days, setDays] = useState("");
  const date1=d1?new Date(d1):null; const date2=d2?new Date(d2):null;
  const diff=date1&&date2?Math.round((date2.getTime()-date1.getTime())/86400000):null;
  const addResult=date1&&days?new Date(date1.getTime()+parseInt(days)*86400000):null;
  const age=date1?Math.floor((Date.now()-date1.getTime())/(365.25*86400000)):null;
  const inputStyle={ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.04)", colorScheme:"dark" as const };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <ToggleBtn active={mode==="diff"} onClick={()=>setMode("diff")}>Différence</ToggleBtn>
        <ToggleBtn active={mode==="add"}  onClick={()=>setMode("add")}>Ajouter des jours</ToggleBtn>
        <ToggleBtn active={mode==="age"}  onClick={()=>setMode("age")}>Calculer l'âge</ToggleBtn>
      </div>
      {mode==="diff" && <>
        <div className="grid grid-cols-2 gap-3">
          {[["Début",d1,setD1],["Fin",d2,setD2]].map(([l,v,s])=>(
            <div key={l as string}>
              <label className="mb-1 block text-xs" style={{ color:"var(--muted)" }}>{l as string}</label>
              <input type="date" value={v as string} onChange={(e)=>(s as any)(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none" style={inputStyle} />
            </div>
          ))}
        </div>
        {diff!==null && (
          <div className="rounded-xl p-4 text-center" style={{ border:"1px solid var(--nebula)", background:"rgba(108,99,255,.06)" }}>
            <p className="text-4xl font-bold" style={{ color:"var(--halo)" }}>{Math.abs(diff)}</p>
            <p className="text-sm mt-1" style={{ color:"var(--muted)" }}>jours</p>
            <p className="text-xs mt-1" style={{ color:"var(--muted)" }}>≈ {(Math.abs(diff)/7).toFixed(1)} semaines · {(Math.abs(diff)/30.4).toFixed(1)} mois</p>
          </div>
        )}
      </>}
      {mode==="add" && <>
        <div>
          <label className="mb-1 block text-xs" style={{ color:"var(--muted)" }}>Date de départ</label>
          <input type="date" value={d1} onChange={(e)=>setD1(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color:"var(--muted)" }}>Jours à ajouter</label>
          <input type="number" value={days} onChange={(e)=>setDays(e.target.value)} placeholder="30" className="w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none" style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.04)" }} />
        </div>
        {addResult && (
          <div className="rounded-xl p-4 text-center" style={{ border:"1px solid var(--nebula)", background:"rgba(108,99,255,.06)" }}>
            <p className="text-xl font-bold" style={{ color:"var(--halo)" }}>{addResult.toLocaleDateString("fr-CH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
        )}
      </>}
      {mode==="age" && <>
        <div>
          <label className="mb-1 block text-xs" style={{ color:"var(--muted)" }}>Date de naissance</label>
          <input type="date" value={d1} onChange={(e)=>setD1(e.target.value)} className="w-full rounded-xl px-3 py-2 text-sm text-white focus:outline-none" style={inputStyle} />
        </div>
        {age!==null&&age>=0 && (
          <div className="rounded-xl p-4 text-center" style={{ border:"1px solid var(--nebula)", background:"rgba(108,99,255,.06)" }}>
            <p className="text-5xl font-bold" style={{ color:"var(--halo)" }}>{age}</p>
            <p className="text-sm mt-1" style={{ color:"var(--muted)" }}>ans</p>
          </div>
        )}
      </>}
    </div>
  );
}

/* ── UNITS ──────────────────────────────────────────────── */
type UnitCat = "length"|"weight"|"temp"|"area";
const UNIT_CATS: {id:UnitCat;label:string}[] = [{id:"length",label:"Longueur"},{id:"weight",label:"Masse"},{id:"temp",label:"Température"},{id:"area",label:"Surface"}];
const CONVERSIONS: Record<UnitCat,{from:string;to:string;fn:(v:number)=>number}[]> = {
  length:[{from:"km",to:"miles",fn:v=>v*0.621371},{from:"m",to:"ft",fn:v=>v*3.28084},{from:"cm",to:"inches",fn:v=>v*0.393701}],
  weight:[{from:"kg",to:"lbs",fn:v=>v*2.20462},{from:"g",to:"oz",fn:v=>v*0.035274},{from:"tonne",to:"kg",fn:v=>v*1000}],
  temp:[{from:"°C",to:"°F",fn:v=>v*9/5+32},{from:"°C",to:"K",fn:v=>v+273.15},{from:"°F",to:"K",fn:v=>(v-32)*5/9+273.15}],
  area:[{from:"m²",to:"ft²",fn:v=>v*10.7639},{from:"km²",to:"miles²",fn:v=>v*0.386102},{from:"ha",to:"acres",fn:v=>v*2.47105}],
};

function UnitsTool() {
  const [cat,setCat]=useState<UnitCat>("length");
  const [values,setValues]=useState<Record<string,string>>({});
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {UNIT_CATS.map((c)=><ToggleBtn key={c.id} active={cat===c.id} onClick={()=>{setCat(c.id);setValues({});}}>{c.label}</ToggleBtn>)}
      </div>
      {CONVERSIONS[cat].map((c,i)=>{
        const val=parseFloat(values[i]||"");
        const result=isNaN(val)?"":c.fn(val).toFixed(4).replace(/\.?0+$/,"");
        return (
          <div key={i} className="rounded-xl p-4" style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.02)" }}>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-[11px]" style={{ color:"var(--muted)" }}>{c.from}</label>
                <input type="number" value={values[i]||""} onChange={(e)=>setValues(v=>({...v,[i]:e.target.value}))} placeholder="0"
                  className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  style={{ border:"1px solid var(--stroke)", background:"rgba(255,255,255,.04)" }} />
              </div>
              <ChevronRight size={16} className="mt-4 flex-shrink-0" style={{ color:"var(--nebula)" }} />
              <div className="flex-1">
                <label className="mb-1 block text-[11px]" style={{ color:"var(--muted)" }}>{c.to}</label>
                <div className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ border:"1px solid var(--nebula)", background:"rgba(108,99,255,.08)", color:result?"var(--halo)":"var(--muted)", minHeight:"36px" }}>
                  {result||"—"}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── BASE64 ─────────────────────────────────────────────── */

const B64_KEYS_LS = "nebryon-b64-keys";

interface B64Key { id: string; name: string; value: string; }

/** UTF-8-safe btoa */
const toB64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
/** UTF-8-safe atob */
const fromB64 = (s: string) => {
  try { return decodeURIComponent(escape(atob(s.trim()))); }
  catch { return null; }
};

function useSavedKeys(): [B64Key[], (keys: B64Key[]) => void] {
  const [keys, setKeys] = useState<B64Key[]>(() => {
    try {
      const raw = localStorage.getItem(B64_KEYS_LS);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const save = useCallback((next: B64Key[]) => {
    setKeys(next);
    try { localStorage.setItem(B64_KEYS_LS, JSON.stringify(next)); } catch { /* */ }
  }, []);
  return [keys, save];
}

function CopyBtn({ text, label = "Copier" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };
  return (
    <button onClick={handle}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition hover:opacity-80"
      style={copied
        ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.12)", color: "var(--halo)" }
        : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copié !" : label}
    </button>
  );
}

function Base64Tool() {
  const [tab, setTab] = useState<"image" | "text" | "keys">("image");

  /* ── Image tab ── */
  const [imgData, setImgData] = useState("");
  const [imgCopied, setImgCopied] = useState("");
  const copyImg = (mode: "raw" | "img" | "css") => {
    const text = mode === "img"
      ? `<img src="${imgData}" alt="">`
      : mode === "css"
      ? `background-image: url("${imgData}");`
      : imgData;
    navigator.clipboard.writeText(text).then(() => { setImgCopied(mode); setTimeout(() => setImgCopied(""), 2000); });
  };

  /* ── Text tab ── */
  const [textMode, setTextMode]   = useState<"encode" | "decode">("encode");
  const [textInput, setTextInput] = useState("");
  const [selectedKey, setSelectedKey] = useState<string>("");   // key id or ""
  const [keyPos, setKeyPos]       = useState<"prefix" | "suffix">("prefix");
  const [keys, saveKeys]          = useSavedKeys();

  const encodeOutput = (() => {
    if (!textInput.trim()) return "";
    const base = toB64(textInput);
    const kObj = keys.find((k) => k.id === selectedKey);
    if (!kObj) return base;
    const kEnc = toB64(kObj.value);
    return keyPos === "prefix" ? `${kEnc}.${base}` : `${base}.${kEnc}`;
  })();

  const decodeOutput = (() => {
    if (!textInput.trim()) return "";
    const kObj = keys.find((k) => k.id === selectedKey);
    let raw = textInput.trim();
    if (kObj) {
      const kEnc = toB64(kObj.value);
      const sep = ".";
      if (keyPos === "prefix" && raw.startsWith(kEnc + sep)) raw = raw.slice(kEnc.length + 1);
      if (keyPos === "suffix" && raw.endsWith(sep + kEnc))   raw = raw.slice(0, raw.length - kEnc.length - 1);
    }
    return fromB64(raw) ?? "⚠ Base64 invalide";
  })();

  /* ── Keys tab ── */
  const [newKeyName,  setNewKeyName]  = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");

  const addKey = () => {
    const n = newKeyName.trim(); const v = newKeyValue.trim();
    if (!n || !v) return;
    saveKeys([...keys, { id: crypto.randomUUID(), name: n, value: v }]);
    setNewKeyName(""); setNewKeyValue("");
  };
  const removeKey = (id: string) => {
    saveKeys(keys.filter((k) => k.id !== id));
    if (selectedKey === id) setSelectedKey("");
  };

  const tabBtnSty = (active: boolean) => ({
    border: active ? "1px solid var(--nebula)" : "1px solid var(--stroke)",
    background: active ? "rgba(108,99,255,.1)" : "transparent",
    color: active ? "var(--halo)" : "var(--muted)",
  } as React.CSSProperties);

  const inputSty = {
    border: "1px solid var(--stroke)",
    background: "rgba(255,255,255,.03)",
    color: "var(--text)",
  } as React.CSSProperties;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {([["image", "🖼 Image"], ["text", "📝 Texte"], ["keys", "🔑 Clés"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
            style={tabBtnSty(tab === t)}>
            {label}{t === "keys" && keys.length > 0 ? ` (${keys.length})` : ""}
          </button>
        ))}
      </div>

      {/* ── Image tab ── */}
      {tab === "image" && (
        <div className="space-y-4">
          <DropZone accept="image/*"
            onFiles={(f) => { const r = new FileReader(); r.onload = (e) => setImgData(e.target!.result as string); r.readAsDataURL(f[0]); }}
            label="🖼 Glisse une image ici" />
          {imgData && (
            <>
              <div className="flex items-center gap-3">
                <img src={imgData} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" style={{ border: "1px solid var(--stroke)" }} />
                <textarea readOnly value={imgData}
                  className="flex-1 h-16 resize-none rounded-xl px-3 py-2 font-mono text-[10px] focus:outline-none"
                  style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)", color: "var(--muted)" }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {([["raw", "Copier Base64"], ["img", "Copier <img>"], ["css", "Copier CSS url()"]] as const).map(([m, l]) => (
                  <ToggleBtn key={m} active={imgCopied === m} onClick={() => copyImg(m)}>
                    {imgCopied === m ? "✓ Copié !" : l}
                  </ToggleBtn>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Text tab ── */}
      {tab === "text" && (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {(["encode", "decode"] as const).map((m) => (
              <button key={m} onClick={() => { setTextMode(m); setTextInput(""); }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                style={tabBtnSty(textMode === m)}>
                {m === "encode" ? "Encoder" : "Décoder"}
              </button>
            ))}
          </div>

          {/* Key selector (shown for both encode + decode) */}
          {keys.length > 0 && (
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                <Key size={10} className="inline mr-1" />Clé{" "}
                <span style={{ opacity: .7 }}>(facultatif)</span>
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                  style={inputSty}>
                  <option value="">Aucune clé</option>
                  {keys.map((k) => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>

                {selectedKey && (
                  <>
                    <span className="text-[11px]" style={{ color: "var(--muted)" }}>Position :</span>
                    {(["prefix", "suffix"] as const).map((p) => (
                      <button key={p} onClick={() => setKeyPos(p)}
                        className="rounded-lg px-2.5 py-1 text-xs transition"
                        style={tabBtnSty(keyPos === p)}>
                        {p === "prefix" ? "Début" : "Fin"}
                      </button>
                    ))}
                  </>
                )}
              </div>

              {selectedKey && (
                <p className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>
                  {textMode === "encode"
                    ? keyPos === "prefix"
                      ? "résultat = base64(clé) · base64(texte)"
                      : "résultat = base64(texte) · base64(clé)"
                    : keyPos === "prefix"
                      ? "décode en retirant le préfixe base64(clé)"
                      : "décode en retirant le suffixe base64(clé)"
                  }
                </p>
              )}
            </div>
          )}

          {/* Input */}
          <div>
            <label className="block text-[11px] mb-1.5" style={{ color: "var(--muted)" }}>
              {textMode === "encode" ? "Texte à encoder" : "Base64 à décoder"}
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={4}
              placeholder={textMode === "encode" ? "Entre ton texte ici…" : "Colle le Base64 ici…"}
              className="w-full resize-y rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.03)", color: "var(--text)" }}
            />
          </div>

          {/* Output */}
          {textInput.trim() && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px]" style={{ color: "var(--muted)" }}>
                  {textMode === "encode" ? "Résultat encodé" : "Texte décodé"}
                </label>
                <CopyBtn text={textMode === "encode" ? encodeOutput : decodeOutput} />
              </div>
              <div className="rounded-xl px-4 py-3 font-mono text-[11px] break-all min-h-[56px]"
                style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.06)", color: "var(--halo)" }}>
                {textMode === "encode" ? encodeOutput : decodeOutput}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Keys tab ── */}
      {tab === "keys" && (
        <div className="space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            Les clés sont stockées localement. Sélectionne-en une dans l'onglet <strong style={{ color: "var(--text)" }}>Texte</strong> pour l'inclure en préfixe ou suffixe du résultat encodé.
          </p>

          {/* Add key form */}
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>Ajouter une clé</p>
            <div className="grid grid-cols-2 gap-2">
              <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Nom de la clé"
                className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={inputSty}
                onKeyDown={(e) => e.key === "Enter" && addKey()} />
              <input value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)}
                placeholder="Valeur"
                className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={inputSty}
                onKeyDown={(e) => e.key === "Enter" && addKey()} />
            </div>
            <button onClick={addKey}
              disabled={!newKeyName.trim() || !newKeyValue.trim()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-85 disabled:opacity-40 w-fit"
              style={{ background: "linear-gradient(135deg,var(--nebula),var(--indigo))", color: "#fff" }}>
              <Plus size={12} /> Ajouter
            </button>
          </div>

          {/* Key list */}
          {keys.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: "var(--muted)" }}>Aucune clé enregistrée.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {keys.map((k) => (
                <div key={k.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
                  <Key size={13} style={{ color: "var(--nebula)", flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{k.name}</p>
                    <p className="text-[10px] font-mono truncate" style={{ color: "var(--muted)" }}>{k.value}</p>
                  </div>
                  <CopyBtn text={k.value} label="Copier valeur" />
                  <button onClick={() => removeKey(k.id)}
                    className="flex-shrink-0 rounded-lg p-1.5 transition hover:opacity-80"
                    style={{ color: "#CF2328", border: "1px solid rgba(207,35,40,.3)" }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── META ───────────────────────────────────────────────── */
function MetaTool() {
  const [info,setInfo]=useState<Record<string,string>|null>(null); const [thumb,setThumb]=useState("");
  const inspect=(files:FileList)=>{
    const f=files[0];
    if(f.type==="application/pdf"){setThumb("");setInfo({Nom:f.name,Type:"PDF",Taille:`${(f.size/1024).toFixed(1)} KB`,Modifié:new Date(f.lastModified).toLocaleDateString("fr")});return;}
    const img=new Image();
    img.onload=()=>{setThumb(img.src);setInfo({Nom:f.name,Largeur:`${img.width} px`,Hauteur:`${img.height} px`,Ratio:(img.width/img.height).toFixed(2),Taille:`${(f.size/1024).toFixed(1)} KB`,Format:f.type.split("/")[1].toUpperCase(),Modifié:new Date(f.lastModified).toLocaleDateString("fr")});};
    img.src=URL.createObjectURL(f);
  };
  return (
    <div className="space-y-4">
      <DropZone accept="image/*,application/pdf" onFiles={inspect} label="📂 Glisse une image ou un PDF ici" />
      {info && (
        <div className="flex gap-4 flex-wrap">
          {thumb && <img src={thumb} alt="" className="h-20 w-20 rounded-xl object-cover" style={{ border:"1px solid var(--stroke)" }} />}
          <div className="flex-1 min-w-[160px] grid grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(info).map(([k,v])=>(
              <div key={k}>
                <p className="text-[10px]" style={{ color:"var(--muted)" }}>{k}</p>
                <p className="text-xs" style={{ color:"var(--text)" }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── CLOCK ──────────────────────────────────────────────── */

const CLOCK_COLORS = {
  nebula: { name: "Nébula",  hex: "#6C63FF", glow: "rgba(108,99,255,.55)" },
  orbit:  { name: "Orbit",   hex: "#3B9EFF", glow: "rgba(59,158,255,.55)"  },
  teal:   { name: "Teal",    hex: "#2DD4BF", glow: "rgba(45,212,191,.55)"  },
  coral:  { name: "Corail",  hex: "#F97316", glow: "rgba(249,115,22,.55)"  },
  gold:   { name: "Or",      hex: "#FBBF24", glow: "rgba(251,191,36,.55)"  },
  snow:   { name: "Blanc",   hex: "#F1F5F9", glow: "rgba(241,245,249,.35)" },
} as const;

type ClockColorKey = keyof typeof CLOCK_COLORS;

function ClockTool() {
  const [now, setNow]             = useState(new Date());
  const [showSec, setShowSec]     = useState(true);
  const [colorKey, setColorKey]   = useState<ClockColorKey>("nebula");
  const [city, setCity]           = useState("");
  const [editingCity, setEditingCity] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const c = CLOCK_COLORS[colorKey];

  const timeStr = now.toLocaleTimeString("fr", {
    hour: "2-digit",
    minute: "2-digit",
    ...(showSec ? { second: "2-digit" } : {}),
  });

  const dateStr = (() => {
    const d = now.toLocaleDateString("fr", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return d.charAt(0).toUpperCase() + d.slice(1);
  })();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      clockRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const tabSty = (active: boolean) => ({
    border: active ? `1px solid ${c.hex}` : "1px solid var(--stroke)",
    background: active ? `${c.hex}1A` : "transparent",
    color: active ? c.hex : "var(--muted)",
  } as React.CSSProperties);

  return (
    <div className="space-y-4">
      {/* Controls — hidden while fullscreen */}
      {!isFullscreen && (
        <div className="flex flex-wrap items-center gap-3">

          {/* Color swatches */}
          <div className="flex items-center gap-1.5">
            {(Object.entries(CLOCK_COLORS) as [ClockColorKey, typeof CLOCK_COLORS[ClockColorKey]][]).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setColorKey(k)}
                title={v.name}
                className="w-5 h-5 rounded-full transition-all"
                style={{
                  background: v.hex,
                  boxShadow: colorKey === k
                    ? `0 0 0 2px var(--bg), 0 0 0 3.5px ${v.hex}`
                    : "none",
                  transform: colorKey === k ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>

          {/* Seconds toggle */}
          <button onClick={() => setShowSec((s) => !s)}
            className="rounded-lg px-2.5 py-1 text-xs transition"
            style={tabSty(showSec)}>
            Secondes
          </button>

          {/* City / location */}
          {editingCity ? (
            <input
              autoFocus
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => setEditingCity(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingCity(false)}
              placeholder="Ville ou lieu…"
              className="rounded-lg px-2.5 py-1 text-xs focus:outline-none"
              style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.04)", color: "var(--text)", width: 130 }}
            />
          ) : (
            <button onClick={() => setEditingCity(true)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition hover:opacity-80"
              style={{ border: "1px solid var(--stroke)", color: city ? "var(--text)" : "var(--muted)" }}>
              <MapPin size={11} />
              {city || "Ajouter un lieu…"}
            </button>
          )}
        </div>
      )}

      {/* Clock display */}
      <div
        ref={clockRef}
        className="relative rounded-2xl flex flex-col items-center justify-center overflow-hidden select-none"
        style={{
          minHeight: isFullscreen ? "100dvh" : 200,
          background: isFullscreen
            ? `radial-gradient(ellipse at 50% 40%, ${c.glow.replace(".55", ".18")} 0%, #050510 65%)`
            : `radial-gradient(ellipse at 50% 40%, ${c.glow.replace(".55", ".12")} 0%, rgba(5,5,16,.95) 70%)`,
          border: isFullscreen ? "none" : `1px solid ${c.hex}28`,
          cursor: isFullscreen ? "none" : undefined,
        }}
      >
        {/* Subtle inner glow ring */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ boxShadow: `inset 0 0 80px ${c.glow.replace(".55", ".07")}` }} />

        {/* Location label */}
        {city && (
          <p className="tracking-[.25em] uppercase font-medium"
            style={{
              color: c.hex,
              opacity: .6,
              fontSize: isFullscreen ? "clamp(.7rem, 1.5vw, 1.2rem)" : "0.65rem",
              marginBottom: isFullscreen ? "2vh" : "0.5rem",
            }}>
            <MapPin size={isFullscreen ? 14 : 10} className="inline mr-1 -mt-0.5" />
            {city}
          </p>
        )}

        {/* Time */}
        <div
          className="font-mono font-bold leading-none tabular-nums"
          style={{
            fontSize: isFullscreen ? "clamp(5rem, 20vw, 18rem)" : "clamp(3.2rem, 7vw, 4.8rem)",
            color: c.hex,
            textShadow: `0 0 30px ${c.glow}, 0 0 70px ${c.glow.replace(".55", ".3")}, 0 0 120px ${c.glow.replace(".55", ".12")}`,
            letterSpacing: "0.04em",
          }}
        >
          {timeStr}
        </div>

        {/* Date */}
        <p
          className="font-light tracking-widest"
          style={{
            color: c.hex,
            opacity: .55,
            fontSize: isFullscreen ? "clamp(.9rem, 2.5vw, 2rem)" : "0.75rem",
            marginTop: isFullscreen ? "2vh" : "0.75rem",
            letterSpacing: "0.12em",
          }}
        >
          {dateStr}
        </p>

        {/* Fullscreen toggle button */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-3 right-3 rounded-lg p-2 transition hover:opacity-80"
          style={{
            color: c.hex,
            border: `1px solid ${c.hex}35`,
            background: "rgba(0,0,0,.35)",
            opacity: isFullscreen ? 0 : 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = isFullscreen ? "0" : "1")}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>

        {/* Fullscreen: click anywhere to exit */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute inset-0 w-full h-full opacity-0"
            aria-label="Quitter le plein écran"
          />
        )}
      </div>
    </div>
  );
}

declare global { interface Window { PDFLib?: any; } }

/* ── MAIN ───────────────────────────────────────────────── */
export default function Tools() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<ToolId | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const categories = [...new Set(TOOLS.map((t) => t.badge))];
  const filteredTools = TOOLS.length > 9 && category ? TOOLS.filter((t) => t.badge === category) : TOOLS;
  const visibleTools = !category && TOOLS.length > 9 && !expanded ? filteredTools.slice(0, 9) : filteredTools;
  const showExpandBtn = !category && TOOLS.length > 9;

  const workspaces: Record<ToolId, React.ReactNode> = {
    resize: <ResizeTool />, merge: <MergeTool />, extract: <ExtractTool />,
    convert: <ConvertTool />, password: <PasswordTool />, tva: <TVATool />,
    date: <DateTool />, units: <UnitsTool />, base64: <Base64Tool />,
    meta: <MetaTool />, qrcode: <QRTool />, clock: <ClockTool />,
  };

  return (
    <section id="tools" className="py-12 sm:py-16">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold sm:text-2xl" style={{ fontFamily:"'Syne',sans-serif" }}>Outils</h2>
        <p className="text-sm" style={{ color:"var(--muted)" }}>100 % local — aucune donnée transmise</p>
      </div>

      {TOOLS.length > 9 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setCategory(null); setActive(null); setExpanded(false); }}
            className="rounded-full px-3 py-1.5 text-xs transition-all"
            style={!category
              ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.12)", color: "var(--halo)" }
              : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setActive(null); }}
              className="rounded-full px-3 py-1.5 text-xs transition-all"
              style={category === cat
                ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.12)", color: "var(--halo)" }
                : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTools.map((t, i) => (
          <motion.button
            key={t.id}
            onClick={() => setActive(active === t.id ? null : t.id)}
            className="group rounded-2xl p-5 text-left backdrop-blur transition-all duration-200 cursor-pointer"
            style={active === t.id
              ? { border:"1px solid var(--nebula)", background:"rgba(108,99,255,.08)", boxShadow:"0 0 24px rgba(108,99,255,.15)", transform:"translateY(-2px)" }
              : { border:"1px solid var(--stroke)", background:"rgba(255,255,255,.02)" }}
            onMouseEnter={(e) => { if(active!==t.id){ const el=e.currentTarget as HTMLElement; el.style.border="1px solid var(--nebula)"; el.style.background="rgba(108,99,255,.06)"; el.style.boxShadow="0 0 20px rgba(108,99,255,.12)"; el.style.transform="translateY(-2px)"; }}}
            onMouseLeave={(e) => { if(active!==t.id){ const el=e.currentTarget as HTMLElement; el.style.border="1px solid var(--stroke)"; el.style.background="rgba(255,255,255,.02)"; el.style.boxShadow="none"; el.style.transform="translateY(0)"; }}}
            initial={reduce ? undefined : { opacity: 0, y: 10 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span style={{ color: active === t.id ? "var(--halo)" : "var(--nebula)" }}>{t.icon}</span>
                <h3 className="font-semibold tracking-tight" style={{ fontFamily:"'Syne',sans-serif" }}>{t.title}</h3>
              </div>
              <ChevronRight size={16} className="flex-shrink-0 transition-transform duration-200"
                style={{ color: active === t.id ? "var(--halo)" : "var(--muted)", transform: active === t.id ? "rotate(90deg)" : "rotate(0deg)" }} />
            </div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color:"var(--muted)" }}>{t.desc}</p>
            <div className="mt-4"><Tag>{t.badge}</Tag></div>
          </motion.button>
        ))}
      </div>

      {showExpandBtn && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => { setExpanded((v) => !v); setActive(null); }}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs transition-all hover:opacity-80"
            style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
            {expanded ? "Voir moins" : `Voir plus (${TOOLS.length - 9})`}
            <ChevronDown size={13} className="transition-transform duration-300" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            key={active}
            initial={reduce ? undefined : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="mt-4 rounded-2xl p-6 backdrop-blur"
            style={{ border:"1px solid var(--nebula)", background:"rgba(108,99,255,.04)" }}
          >
            <div className="mb-5 flex items-center gap-3">
              <button onClick={() => setActive(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition hover:opacity-80"
                style={{ border:"1px solid var(--stroke)", color:"var(--muted)" }}>
                <ArrowLeft size={14} />
              </button>
              <span style={{ color:"var(--nebula)" }}>{TOOLS.find((t)=>t.id===active)?.icon}</span>
              <h3 className="font-semibold" style={{ fontFamily:"'Syne',sans-serif" }}>{TOOLS.find((t)=>t.id===active)?.title}</h3>
            </div>
            {workspaces[active]}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
