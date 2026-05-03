export interface Project {
  title: string;
  description: string;
  href: string;
  tags: string[];
  type: "showcase" | "app";
  /** "mobile" = application mobile, non accessible directement depuis le Hub */
  platform?: "web" | "mobile";
}

export const projects: Project[] = [
  {
    title: "Nebryon Lisan",
    description:
      "Application mobile d'apprentissage des langues : fiches recto/verso, QCM, traduction écrite, remise en ordre et autres formes d'apprentissage.",
    href: "/projects/lisan",
    tags: ["React Native", "Expo", "TypeScript", "SQLite"],
    type: "showcase",
    platform: "mobile",
  },
  {
    title: "Nebryon Orbit",
    description:
      "Client HTTP intégré — teste tes APIs REST directement depuis le navigateur. Collections, environnements avec variables, auth Bearer/Basic/API Key, body JSON et bien plus.",
    href: "/orbit",
    tags: ["Next.js", "TypeScript", "Dexie", "CodeMirror"],
    type: "showcase",
  },
  {
    title: "Nebryon Lumen",
    description:
      "Générateur de documents PDF en masse — concevez un modèle HTML avec des variables dynamiques {{ champ }}, importez vos données (Excel, CSV, JSON, XML) et téléchargez tous vos PDFs dans un ZIP.",
    href: "/lumen",
    tags: ["Next.js", "TypeScript", "Puppeteer", "XLSX", "PapaParse"],
    type: "showcase",
  },
  {
    title: "Nebryon Pulsar",
    description:
      "Lecteur et analyseur de données — charge un CSV, Excel, JSON ou XML, explore les données en tableau trié/filtrable, consulte les statistiques par colonne et exporte le résultat.",
    href: "/pulsar",
    tags: ["Next.js", "TypeScript", "PapaParse", "XLSX"],
    type: "showcase",
  },
];
