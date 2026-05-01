"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, QrCode, FilePlus } from "lucide-react";
import { useReducedMotion } from "framer-motion";

/* ── Shared card ─────────────────────────────────────────── */
function DemoCard({ icon, title, children }: {
  icon: React.ReactNode; title: string; children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2.5 flex-shrink-0 w-[200px] sm:flex-1 sm:w-auto"
      style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.025)" }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--nebula)" }}>{icon}</span>
        <span className="text-[11px] font-semibold tracking-tight"
          style={{ fontFamily: "'Syne',sans-serif", color: "var(--text)" }}>
          {title}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center min-h-[110px]">
        {children}
      </div>
    </div>
  );
}

/* ── Demo 1 : Mot de passe ───────────────────────────────── */
const PWD = "K4#mP9@Zx!2v";

function PasswordDemo() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 155);
    return () => clearInterval(id);
  }, []);

  const CYCLE = 46;
  const step = tick % CYCLE;
  const chars = PWD.slice(0, Math.min(step, PWD.length));
  const revealing = step < PWD.length;
  const strength = !revealing ? Math.min(100, (step - PWD.length) * 13) : 0;
  const done = strength >= 100;

  return (
    <DemoCard icon={<KeyRound size={13} />} title="Mot de passe">
      <div className="font-mono text-xs h-5 mb-2" style={{ color: "var(--halo)", letterSpacing: ".04em" }}>
        {chars}
        {revealing && <span className="animate-pulse" style={{ color: "var(--nebula)" }}>|</span>}
      </div>
      <div className="h-1 rounded-full overflow-hidden mb-1.5"
        style={{ background: "rgba(255,255,255,.06)" }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${strength}%` }}
          transition={{ duration: 0.2 }}
          style={{ background: "linear-gradient(90deg,var(--nebula),var(--halo))" }}
        />
      </div>
      <div className="text-[10px] mb-2.5"
        style={{ color: done ? "var(--halo)" : strength > 0 ? "var(--nebula)" : "var(--muted)" }}>
        {done ? "✓ Très fort" : strength > 0 ? "Fort…" : "Force du mot de passe"}
      </div>
      <div className="flex gap-1">
        {["A-Z", "0-9", "!@#"].map(l => (
          <span key={l} className="text-[9px] px-1.5 py-0.5 rounded"
            style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
            {l}
          </span>
        ))}
      </div>
    </DemoCard>
  );
}

/* ── Demo 2 : QR Code ────────────────────────────────────── */
const QR: (0 | 1)[] = [
  1,1,1,0,1,1,1,
  1,0,1,0,1,0,1,
  1,1,1,0,1,1,1,
  0,0,0,0,0,0,0,
  1,0,1,1,0,1,0,
  0,1,0,1,1,0,1,
  1,1,0,0,1,0,1,
];

function QRDemo() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 75);
    return () => clearInterval(id);
  }, []);

  const CYCLE = 75;
  const step = tick % CYCLE;
  const frameVisible = step >= QR.length;

  return (
    <DemoCard icon={<QrCode size={13} />} title="QR Code">
      <div className="flex flex-col items-center gap-2">
        <div
          className="p-1.5 rounded-lg transition-all duration-300"
          style={{
            border: frameVisible ? "2px solid var(--nebula)" : "2px solid var(--stroke)",
            background: "#0C0F24",
            boxShadow: frameVisible ? "0 0 12px rgba(108,99,255,.3)" : "none",
          }}
        >
          <div className="grid gap-[1.5px]" style={{ gridTemplateColumns: "repeat(7,8px)" }}>
            {QR.map((filled, i) => (
              <div key={i} className="w-2 h-2 rounded-[1px] transition-colors duration-100"
                style={{ background: filled && i < step ? "var(--nebula)" : "rgba(255,255,255,.04)" }} />
            ))}
          </div>
        </div>
        <div className="text-[10px]"
          style={{ color: frameVisible ? "var(--halo)" : "var(--muted)" }}>
          {frameVisible ? "✓ Prêt à télécharger" : "Génération…"}
        </div>
      </div>
    </DemoCard>
  );
}

/* ── Demo 3 : Fusion PDF ─────────────────────────────────── */
const FILES = [
  { name: "rapport.pdf", ext: "PDF" },
  { name: "annexe.pdf",  ext: "PDF" },
  { name: "photo.jpg",   ext: "IMG" },
];

function MergeDemo() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 220);
    return () => clearInterval(id);
  }, []);

  const CYCLE = 20;
  const step = tick % CYCLE;
  const merged = step >= 10;

  return (
    <DemoCard icon={<FilePlus size={13} />} title="Fusionner PDF">
      <AnimatePresence mode="wait">
        {!merged ? (
          <motion.div key="files" className="flex flex-col gap-1.5"
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            {FILES.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: step > i ? 1 : 0, x: step > i ? 0 : -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}
              >
                <span className="text-[9px] font-bold rounded px-1"
                  style={{ background: "rgba(108,99,255,.15)", color: "var(--nebula)" }}>
                  {f.ext}
                </span>
                <span className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{f.name}</span>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="result" className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}>
            <div className="w-full flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)" }}>
              <span className="text-[9px] font-bold rounded px-1"
                style={{ background: "rgba(108,99,255,.2)", color: "var(--halo)" }}>PDF</span>
              <span className="text-[10px] flex-1" style={{ color: "var(--text)" }}>merged.pdf</span>
              <span style={{ color: "var(--halo)" }}>✓</span>
            </div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>3 fichiers → 1 document</div>
          </motion.div>
        )}
      </AnimatePresence>
    </DemoCard>
  );
}

/* ── Export ──────────────────────────────────────────────── */
export default function HeroDemos() {
  const reduce = useReducedMotion();

  return (
    <div className="mb-10">
      <motion.div
        className="flex gap-3 overflow-x-auto pb-1 -mx-2 px-2 sm:overflow-visible sm:mx-0 sm:px-0"
        initial={reduce ? undefined : { opacity: 0, y: 12 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        style={{ scrollbarWidth: "none" }}
      >
        <PasswordDemo />
        <QRDemo />
        <MergeDemo />
      </motion.div>

      <motion.p
        className="mt-4 text-sm"
        initial={reduce ? undefined : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        style={{ color: "var(--muted)" }}
      >
        Et bien plus encore !
      </motion.p>
    </div>
  );
}
