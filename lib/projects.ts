export interface Project {
  title: string;
  description: string;
  href: string;
  tags: string[];
  type: "showcase" | "app";
}

export const projects: Project[] = [
  {
    title: "Nebryon Lisan",
    description:
      "Application mobile d'apprentissage des langues : fiches recto/verso, QCM, traduction écrite, remise en ordre et autres formes d'apprentissage.",
    href: "/projects/lisan",
    tags: ["React Native", "Expo", "TypeScript", "SQLite"],
    type: "showcase",
  },
  {
    title: "Orbit",
    description:
      "Client HTTP intégré — teste tes APIs REST directement depuis le navigateur. Collections, environnements avec variables, auth Bearer/Basic/API Key, body JSON et bien plus.",
    href: "/orbit",
    tags: ["Next.js", "TypeScript", "Dexie", "CodeMirror"],
    type: "showcase",
  },
];
