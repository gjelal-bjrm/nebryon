"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { BlobProvider, PDFDownloadLink } from "@react-pdf/renderer";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/orbit/db";
import {
  X, Download, ChevronDown, Plus, Trash2, Eye, RefreshCw, Camera, User, AlertCircle, ArrowLeft,
} from "lucide-react";
import CVDocument from "./CVDocument";
import {
  CVData, CVExperience, CVEducation, CVSkill, CVLanguage, CVColorKey,
  CV_COLORS, CV_TEMPLATES, LanguageLevel,
  defaultCVData, uid, SkillLevel,
} from "@/lib/cv/types";

/* ─── Persistence ─────────────────────────────────────────── */
const STORAGE_KEY = "nebryon-cv-data";

function loadCV(): CVData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultCVData(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultCVData();
}

function saveCV(data: CVData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

/* ─── Shared input style ──────────────────────────────────── */
const inputCls = "w-full rounded-lg px-3 py-2 text-xs focus:outline-none transition";
const inputSty: React.CSSProperties = {
  border: "1px solid var(--stroke)",
  background: "rgba(255,255,255,.04)",
  color: "var(--text)",
};

/* ─── Small reusable pieces ───────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] mb-1.5 font-medium" style={{ color: "var(--muted)" }}>{children}</label>;
}

function Input({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} className={inputCls} style={inputSty} />
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        rows={rows} placeholder={placeholder}
        className={`${inputCls} resize-none`} style={inputSty} />
    </div>
  );
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-85"
      style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)", color: "var(--halo)" }}>
      <Plus size={12} /> {label}
    </button>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex-shrink-0 rounded-lg p-1.5 transition hover:opacity-80"
      style={{ color: "#CF2328", border: "1px solid rgba(207,35,40,.3)" }}>
      <Trash2 size={11} />
    </button>
  );
}

/* ─── Expandable card ─────────────────────────────────────── */
function Card({ title, subtitle, onDelete, children }: {
  title: string; subtitle?: string; onDelete: () => void; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
      <div className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
        style={{ borderBottom: open ? "1px solid var(--stroke)" : "none" }}
        onClick={() => setOpen((v) => !v)}>
        <ChevronDown size={13} style={{ color: "var(--muted)", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .2s" }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{title || "(sans titre)"}</p>
          {subtitle && <p className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{subtitle}</p>}
        </div>
        <DeleteBtn onClick={onDelete} />
      </div>
      {open && <div className="px-4 py-4 space-y-3">{children}</div>}
    </div>
  );
}

/* ─── Photo uploader ──────────────────────────────────────── */
function PhotoUploader({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  if (disabled) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs"
        style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)", color: "var(--muted)", opacity: .5 }}>
        <Camera size={13} /> Photo désactivée (mode sans photo)
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={value} alt="photo" className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          style={{ border: "1.5px solid var(--stroke)" }} />
      ) : (
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ border: "1.5px solid var(--stroke)", background: "rgba(108,99,255,.08)" }}>
          <User size={18} style={{ color: "var(--muted)" }} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-85"
          style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
          <Camera size={12} /> {value ? "Changer" : "Ajouter une photo"}
        </button>
        {value && (
          <button onClick={() => onChange("")}
            className="text-[10px] transition hover:opacity-80 text-left" style={{ color: "#CF2328" }}>
            Supprimer
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

/* ─── Skill level picker ──────────────────────────────────── */
function LevelPicker({ value, onChange }: { value: SkillLevel; onChange: (v: SkillLevel) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n as SkillLevel)}
          className="w-6 h-6 rounded-full transition-all"
          style={{
            background: n <= value ? "var(--nebula)" : "rgba(108,99,255,.12)",
            border: `1px solid ${n <= value ? "var(--nebula)" : "var(--stroke)"}`,
          }}
          title={`Niveau ${n}`}
        />
      ))}
    </div>
  );
}

/* ─── Toggle switch ────────────────────────────────────────── */
function Toggle({ value, onChange, label, desc }: {
  value: boolean; onChange: (v: boolean) => void; label: string; desc?: string;
}) {
  return (
    <div className="flex items-start gap-3 cursor-pointer select-none" onClick={() => onChange(!value)}>
      <div className="relative flex-shrink-0 mt-0.5" style={{ width: 34, height: 20 }}>
        <div className="absolute inset-0 rounded-full transition-colors"
          style={{ background: value ? "var(--nebula)" : "rgba(255,255,255,.12)", border: "1px solid var(--stroke)" }} />
        <div className="absolute top-[3px] rounded-full transition-all"
          style={{ width: 14, height: 14, background: "#fff", left: value ? 17 : 3, boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--text)" }}>{label}</p>
        {desc && <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{desc}</p>}
      </div>
    </div>
  );
}

/* ─── Tab bar ─────────────────────────────────────────────── */
const TABS = [
  { id: "personal",     label: "Présentation" },
  { id: "experiences",  label: "Expériences" },
  { id: "education",    label: "Formation" },
  { id: "skills",       label: "Compétences" },
  { id: "languages",    label: "Langues" },
  { id: "design",       label: "Design" },
] as const;

type TabId = typeof TABS[number]["id"];

/* ─── Live preview pane (side panel) ─────────────────────── */
function PreviewPane({ data, triggerKey }: { data: CVData; triggerKey: number }) {
  return (
    <BlobProvider document={<CVDocument data={data} />} key={triggerKey}>
      {({ url, loading, error }) => {
        if (loading) return (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--nebula)", borderTopColor: "transparent" }} />
            <p className="text-xs" style={{ color: "var(--muted)" }}>Génération du PDF…</p>
          </div>
        );
        if (error) return (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
            <AlertCircle size={20} style={{ color: "#CF2328" }} />
            <p className="text-xs font-semibold" style={{ color: "#CF2328" }}>Erreur de rendu</p>
            <p className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{error.message}</p>
          </div>
        );
        return url ? (
          <iframe src={url} className="w-full h-full"
            style={{ border: "none", background: "#fff" }} title="Aperçu CV" />
        ) : null;
      }}
    </BlobProvider>
  );
}

/* ─── Full-screen preview popup ──────────────────────────── */
function PreviewPopup({ data, onClose, fileName }: {
  data: CVData; onClose: () => void; fileName: string;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 70, background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-12 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--stroke)", background: "var(--nav-bg)" }}>
        <button onClick={onClose}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition hover:opacity-80"
          style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
          <ArrowLeft size={13} /> Retour au formulaire
        </button>
        <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Aperçu — Esc pour fermer</span>
        <PDFDownloadLink document={<CVDocument data={data} />} fileName={fileName}>
          {({ loading }) => (
            <button
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-85"
              style={{ background: "linear-gradient(135deg, var(--nebula), var(--indigo))", border: "1px solid rgba(108,99,255,.3)" }}>
              <Download size={12} /> {loading ? "Génération…" : "Télécharger PDF"}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      {/* Full PDF */}
      <div className="flex-1 overflow-hidden">
        <BlobProvider document={<CVDocument data={data} />}>
          {({ url, loading, error }) => {
            if (loading) return (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "var(--nebula)", borderTopColor: "transparent" }} />
                <p className="text-xs" style={{ color: "var(--muted)" }}>Génération du PDF…</p>
              </div>
            );
            if (error) return (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                <AlertCircle size={20} style={{ color: "#CF2328" }} />
                <p className="text-xs font-semibold" style={{ color: "#CF2328" }}>Erreur de rendu</p>
                <p className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>{error.message}</p>
              </div>
            );
            return url ? (
              <iframe src={url} className="w-full h-full"
                style={{ border: "none", background: "#fff" }} title="Aperçu CV plein écran" />
            ) : null;
          }}
        </BlobProvider>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */

interface Props {
  onClose: () => void;
}

export default function CVBuilder({ onClose }: Props) {
  const [data, setData]               = useState<CVData>(loadCV);
  const [tab,  setTab]                = useState<TabId>("personal");
  const [previewKey, setPreviewKey]   = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [mounted, setMounted]         = useState(false);

  // Mount guard for createPortal
  useEffect(() => { setMounted(true); }, []);

  // Pre-fill from Dexie profile on first mount
  const profile = useLiveQuery(() => db.profile.get("singleton"), []);
  useEffect(() => {
    if (!profile) return;
    setData((prev) => {
      if (prev.personal.firstName || prev.personal.email) return prev;
      return {
        ...prev,
        personal: {
          ...prev.personal,
          firstName: profile.firstName ?? "",
          lastName:  profile.lastName  ?? "",
          email:     profile.email     ?? "",
          photo:     profile.photo     ?? "",
        },
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!profile]);

  // Auto-save on change
  useEffect(() => { saveCV(data); }, [data]);

  const upd = useCallback(<K extends keyof CVData>(key: K, val: CVData[K]) => {
    setData((prev) => ({ ...prev, [key]: val }));
  }, []);

  const updPersonal = useCallback((field: string, val: string) => {
    setData((prev) => ({ ...prev, personal: { ...prev.personal, [field]: val } }));
  }, []);

  const updDesign = useCallback((field: string, val: unknown) => {
    setData((prev) => ({ ...prev, design: { ...prev.design, [field]: val } }));
  }, []);

  /* ── Tab content ── */
  function renderTab() {
    switch (tab) {
      case "personal": return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" value={data.personal.firstName} onChange={(v) => updPersonal("firstName", v)} placeholder="Sophie" />
            <Input label="Nom" value={data.personal.lastName} onChange={(v) => updPersonal("lastName", v)} placeholder="Dubois" />
          </div>
          <Input label="Titre du poste" value={data.personal.jobTitle} onChange={(v) => updPersonal("jobTitle", v)} placeholder="Développeuse Full Stack" />

          <div>
            <Label>Photo de profil</Label>
            <PhotoUploader value={data.personal.photo} onChange={(v) => updPersonal("photo", v)} disabled={!data.design.showPhoto} />
            {!data.design.showPhoto && (
              <p className="text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>
                Active l'option photo dans l'onglet <strong style={{ color: "var(--text)" }}>Design</strong> pour en ajouter une.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" value={data.personal.email} onChange={(v) => updPersonal("email", v)} placeholder="sophie@exemple.ch" type="email" />
            <Input label="Téléphone" value={data.personal.phone} onChange={(v) => updPersonal("phone", v)} placeholder="+41 79 000 00 00" />
          </div>
          <Input label="Adresse" value={data.personal.address} onChange={(v) => updPersonal("address", v)} placeholder="Genève, Suisse" />
          <div>
            <Label>Date de naissance <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optionnel)</span></Label>
            <input type="date" value={data.personal.birthdate} onChange={(e) => updPersonal("birthdate", e.target.value)}
              className={inputCls} style={{ ...inputSty, colorScheme: "dark" }} />
            <p className="text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>
              Non recommandé en Suisse/UE — peut exposer à de la discrimination. N'apparaît dans le CV que si ce champ est rempli.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="LinkedIn" value={data.personal.linkedin} onChange={(v) => updPersonal("linkedin", v)} placeholder="linkedin.com/in/sophie" />
            <Input label="GitHub" value={data.personal.github} onChange={(v) => updPersonal("github", v)} placeholder="github.com/sophie" />
          </div>
          <Input label="Site web" value={data.personal.website} onChange={(v) => updPersonal("website", v)} placeholder="sophie.dev" />
          <Textarea label="Résumé / Accroche" value={data.personal.summary} onChange={(v) => updPersonal("summary", v)} rows={4}
            placeholder="Développeuse Full Stack avec 5 ans d'expérience en Suisse romande, passionnée par les interfaces performantes et accessibles…" />
        </div>
      );

      case "experiences": return (
        <div className="space-y-3">
          {data.experiences.map((exp, i) => (
            <Card key={exp.id} title={exp.position || `Expérience ${i + 1}`} subtitle={exp.company}
              onDelete={() => upd("experiences", data.experiences.filter((e) => e.id !== exp.id))}>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Poste" value={exp.position} onChange={(v) => upd("experiences", data.experiences.map((e) => e.id === exp.id ? { ...e, position: v } : e))} placeholder="Développeur Frontend" />
                <Input label="Entreprise" value={exp.company} onChange={(v) => upd("experiences", data.experiences.map((e) => e.id === exp.id ? { ...e, company: v } : e))} placeholder="Acme SA" />
              </div>
              <Input label="Lieu" value={exp.location} onChange={(v) => upd("experiences", data.experiences.map((e) => e.id === exp.id ? { ...e, location: v } : e))} placeholder="Genève / Remote" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Début (MM/AAAA)" value={exp.startDate} onChange={(v) => upd("experiences", data.experiences.map((e) => e.id === exp.id ? { ...e, startDate: v } : e))} placeholder="01/2022" />
                <Input label="Fin (MM/AAAA)" value={exp.endDate} onChange={(v) => upd("experiences", data.experiences.map((e) => e.id === exp.id ? { ...e, endDate: v } : e))} placeholder="12/2023" />
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: "var(--muted)" }}>
                <input type="checkbox" checked={exp.current} onChange={(e) => upd("experiences", data.experiences.map((ex) => ex.id === exp.id ? { ...ex, current: e.target.checked } : ex))} />
                Poste actuel
              </label>
              <Textarea label="Description (une ligne = une puce)" value={exp.description}
                onChange={(v) => upd("experiences", data.experiences.map((e) => e.id === exp.id ? { ...e, description: v } : e))}
                rows={4} placeholder={"Développement de l'interface React\nMise en place d'une CI/CD GitHub Actions\nOptimisation des performances Core Web Vitals"} />
            </Card>
          ))}
          <AddBtn onClick={() => upd("experiences", [...data.experiences, {
            id: uid(), company: "", position: "", location: "", startDate: "", endDate: "", current: false, description: "",
          } satisfies CVExperience])} label="Ajouter une expérience" />
        </div>
      );

      case "education": return (
        <div className="space-y-3">
          {data.education.map((edu, i) => (
            <Card key={edu.id} title={edu.degree || `Formation ${i + 1}`} subtitle={edu.institution}
              onDelete={() => upd("education", data.education.filter((e) => e.id !== edu.id))}>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Diplôme" value={edu.degree} onChange={(v) => upd("education", data.education.map((e) => e.id === edu.id ? { ...e, degree: v } : e))} placeholder="Master Informatique" />
                <Input label="Spécialité" value={edu.field} onChange={(v) => upd("education", data.education.map((e) => e.id === edu.id ? { ...e, field: v } : e))} placeholder="IA & Data Science" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="École / Université" value={edu.institution} onChange={(v) => upd("education", data.education.map((e) => e.id === edu.id ? { ...e, institution: v } : e))} placeholder="Université de Genève" />
                <Input label="Lieu" value={edu.location} onChange={(v) => upd("education", data.education.map((e) => e.id === edu.id ? { ...e, location: v } : e))} placeholder="Genève" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Début (MM/AAAA)" value={edu.startDate} onChange={(v) => upd("education", data.education.map((e) => e.id === edu.id ? { ...e, startDate: v } : e))} placeholder="09/2020" />
                <Input label="Fin (MM/AAAA)" value={edu.endDate} onChange={(v) => upd("education", data.education.map((e) => e.id === edu.id ? { ...e, endDate: v } : e))} placeholder="06/2022" />
              </div>
              <Textarea label="Description (optionnel)" value={edu.description}
                onChange={(v) => upd("education", data.education.map((e) => e.id === edu.id ? { ...e, description: v } : e))}
                rows={2} placeholder="Mention très bien, mémoire sur la robustesse des modèles…" />
            </Card>
          ))}
          <AddBtn onClick={() => upd("education", [...data.education, {
            id: uid(), institution: "", degree: "", field: "", location: "", startDate: "", endDate: "", description: "",
          } satisfies CVEducation])} label="Ajouter une formation" />
        </div>
      );

      case "skills": return (
        <div className="space-y-3">
          {data.skills.map((sk) => (
            <div key={sk.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input value={sk.name} onChange={(e) => upd("skills", data.skills.map((s) => s.id === sk.id ? { ...s, name: e.target.value } : s))}
                  placeholder="React" className={inputCls} style={{ ...inputSty, marginBottom: 0 }} />
                <input value={sk.category} onChange={(e) => upd("skills", data.skills.map((s) => s.id === sk.id ? { ...s, category: e.target.value } : s))}
                  placeholder="Catégorie (ex: Frontend)" className={inputCls} style={{ ...inputSty, marginBottom: 0 }} />
              </div>
              <LevelPicker value={sk.level} onChange={(v) => upd("skills", data.skills.map((s) => s.id === sk.id ? { ...s, level: v } : s))} />
              <DeleteBtn onClick={() => upd("skills", data.skills.filter((s) => s.id !== sk.id))} />
            </div>
          ))}
          <p className="text-[10px]" style={{ color: "var(--muted)" }}>Les ronds indiquent le niveau (1 = débutant · 5 = expert)</p>
          <AddBtn onClick={() => upd("skills", [...data.skills, { id: uid(), name: "", level: 3, category: "" } satisfies CVSkill])} label="Ajouter une compétence" />
        </div>
      );

      case "languages": return (
        <div className="space-y-3">
          {data.languages.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
              <input value={l.name} onChange={(e) => upd("languages", data.languages.map((lg) => lg.id === l.id ? { ...lg, name: e.target.value } : lg))}
                placeholder="Français" className={`${inputCls} flex-1`} style={{ ...inputSty, marginBottom: 0 }} />
              <select value={l.level}
                onChange={(e) => upd("languages", data.languages.map((lg) => lg.id === l.id ? { ...lg, level: e.target.value as LanguageLevel } : lg))}
                className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={{ ...inputSty, color: "var(--text)" }}>
                {(["Débutant", "Intermédiaire", "Courant", "Bilingue", "Natif"] as LanguageLevel[]).map((lv) => (
                  <option key={lv} value={lv}>{lv}</option>
                ))}
              </select>
              <DeleteBtn onClick={() => upd("languages", data.languages.filter((lg) => lg.id !== l.id))} />
            </div>
          ))}
          <AddBtn onClick={() => upd("languages", [...data.languages, { id: uid(), name: "", level: "Courant" } satisfies CVLanguage])} label="Ajouter une langue" />
        </div>
      );

      case "design": return (
        <div className="space-y-6">
          <div>
            <Label>Options de photo</Label>
            <div className="rounded-xl p-4" style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
              <Toggle value={data.design.showPhoto} onChange={(v) => updDesign("showPhoto", v)}
                label="Inclure une photo"
                desc="La photo apparaît dans le design du CV. Désactive pour un CV sans photo (souvent requis pour certaines candidatures en Suisse)." />
            </div>
          </div>

          <div>
            <Label>Mode ATS</Label>
            <div className="space-y-3 rounded-xl p-4" style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
              <Toggle value={data.design.atsMode} onChange={(v) => updDesign("atsMode", v)}
                label="Optimisé ATS (Applicant Tracking System)"
                desc="Structure texte pur, compatible avec les logiciels de tri automatique utilisés par les RH. Désactive le design visuel et la photo." />
              {data.design.atsMode && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-2.5"
                  style={{ background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.3)" }}>
                  <AlertCircle size={13} style={{ color: "#FBBF24", flexShrink: 0, marginTop: 1 }} />
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>Le mode ATS génère un CV en texte pur (Helvetica, noir & blanc). Les options template, couleur et photo sont ignorées.</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ opacity: data.design.atsMode ? .4 : 1, pointerEvents: data.design.atsMode ? "none" : "auto" }}>
            <Label>Template</Label>
            <div className="grid grid-cols-3 gap-2">
              {CV_TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => updDesign("template", t.id)}
                  className="rounded-xl p-3 text-left transition-all"
                  style={data.design.template === t.id
                    ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.1)" }
                    : { border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)" }}>
                  <p className="text-xs font-semibold" style={{ color: data.design.template === t.id ? "var(--halo)" : "var(--text)" }}>{t.label}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div style={{ opacity: data.design.atsMode ? .4 : 1, pointerEvents: data.design.atsMode ? "none" : "auto" }}>
            <Label>Couleur principale</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CV_COLORS) as [CVColorKey, typeof CV_COLORS[CVColorKey]][]).map(([key, c]) => (
                <button key={key} onClick={() => updDesign("color", key)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all"
                  style={data.design.color === key
                    ? { border: `2px solid ${c.primary}`, background: `${c.primary}18`, color: "var(--text)" }
                    : { border: "1px solid var(--stroke)", background: "rgba(255,255,255,.02)", color: "var(--muted)" }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: c.primary }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }

  const fileName = `CV_${data.personal.firstName || "Prénom"}_${data.personal.lastName || "Nom"}.pdf`.replace(/\s+/g, "_");

  if (!mounted) return null;

  return createPortal(
    <>
      {/* ── Main builder — split layout ── */}
      <div className="fixed inset-0 flex flex-col" style={{ zIndex: 60, background: "var(--bg)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--stroke)", background: "var(--nav-bg)" }}>
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition hover:opacity-80"
              style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
              <X size={14} />
            </button>
            <span className="text-sm font-semibold" style={{ fontFamily: "'Syne',sans-serif", color: "var(--text)" }}>
              Générateur de CV
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setPreviewKey((k) => k + 1)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition hover:opacity-80"
              style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
              <RefreshCw size={12} /> Actualiser
            </button>
            <button onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-85"
              style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)", color: "var(--halo)" }}>
              <Eye size={12} /> Prévisualiser
            </button>
            <PDFDownloadLink document={<CVDocument data={data} />} fileName={fileName}>
              {({ loading }) => (
                <button
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-85"
                  style={{ background: "linear-gradient(135deg, var(--nebula), var(--indigo))", border: "1px solid rgba(108,99,255,.3)" }}>
                  <Download size={12} /> {loading ? "Génération…" : "Télécharger"}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        {/* Body — form left, preview right */}
        <div className="flex flex-1 min-h-0">
          {/* Form panel */}
          <div className="flex flex-col w-full max-w-lg flex-shrink-0" style={{ borderRight: "1px solid var(--stroke)" }}>
            {/* Tabs */}
            <div className="flex overflow-x-auto flex-shrink-0 px-2"
              style={{ borderBottom: "1px solid var(--stroke)", background: "var(--nav-bg)" }}>
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="px-3 py-2.5 text-[11px] font-medium whitespace-nowrap transition-all"
                  style={{
                    color: tab === t.id ? "var(--nebula)" : "var(--muted)",
                    borderBottom: tab === t.id ? "2px solid var(--nebula)" : "2px solid transparent",
                    marginBottom: "-1px",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* Form content */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderTab()}
            </div>
          </div>

          {/* Preview panel */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <PreviewPane data={data} triggerKey={previewKey} />
          </div>
        </div>
      </div>

      {/* ── Full-screen preview popup ── */}
      {showPreview && (
        <PreviewPopup data={data} onClose={() => setShowPreview(false)} fileName={fileName} />
      )}
    </>,
    document.body
  );
}
