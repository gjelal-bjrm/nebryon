/* ── CV Generator — data types ─────────────────────────── */

export type CVTemplate = "classique" | "moderne" | "minimaliste";

export type CVColorKey = "violet" | "blue" | "emerald" | "amber" | "rose" | "slate";

export const CV_COLORS: Record<CVColorKey, { label: string; primary: string; light: string; dark: string }> = {
  violet:  { label: "Violet",   primary: "#4F46E5", light: "#EEF2FF", dark: "#1E1B4B" },
  blue:    { label: "Bleu",     primary: "#2563EB", light: "#EFF6FF", dark: "#1E3A5F" },
  emerald: { label: "Émeraude", primary: "#059669", light: "#ECFDF5", dark: "#064E3B" },
  amber:   { label: "Ambre",    primary: "#D97706", light: "#FFFBEB", dark: "#78350F" },
  rose:    { label: "Rose",     primary: "#E11D48", light: "#FFF1F2", dark: "#881337" },
  slate:   { label: "Ardoise",  primary: "#475569", light: "#F8FAFC", dark: "#1E293B" },
};

export const CV_TEMPLATES: { id: CVTemplate; label: string; desc: string }[] = [
  { id: "classique",    label: "Classique",    desc: "Sidebar colorée + contenu structuré" },
  { id: "moderne",      label: "Moderne",      desc: "En-tête impactant + deux colonnes" },
  { id: "minimaliste",  label: "Minimaliste",  desc: "Colonne unique, typographie épurée" },
];

/* ── Section models ──────────────────────────────────────── */

export interface CVPersonal {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  photo: string;           // base64 data URL or ""
  birthdate: string;       // DD/MM/YYYY or "" — optional, omitted if empty
}

export interface CVExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;       // MM/YYYY
  endDate: string;         // MM/YYYY or ""
  current: boolean;
  description: string;     // newline-separated bullet points
}

export interface CVEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export interface CVSkill {
  id: string;
  name: string;
  level: SkillLevel;
  category: string;
}

export type LanguageLevel = "Débutant" | "Intermédiaire" | "Courant" | "Bilingue" | "Natif";

export interface CVLanguage {
  id: string;
  name: string;
  level: LanguageLevel;
}

export interface CVDesign {
  template: CVTemplate;
  color: CVColorKey;
  showPhoto: boolean;
  atsMode: boolean;
}

export interface CVData {
  personal: CVPersonal;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: CVSkill[];
  languages: CVLanguage[];
  design: CVDesign;
}

/* ── Defaults ────────────────────────────────────────────── */

export function defaultCVData(): CVData {
  return {
    personal: {
      firstName: "", lastName: "", jobTitle: "", email: "",
      phone: "", address: "", linkedin: "", github: "", website: "",
      summary: "", photo: "", birthdate: "",
    },
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    design: {
      template: "classique",
      color: "violet",
      showPhoto: true,
      atsMode: false,
    },
  };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
