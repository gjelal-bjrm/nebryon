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
    title: "Nebryon Hub",
    description:
      "Un hub de projets et une boîte à outils pour tous — images, PDF, QR codes, mots de passe et bien plus. Des outils rapides, simples et 100 % locaux.",
    href: "#",
    tags: ["Next.js", "TypeScript", "Tailwind"],
    type: "app",
  },
];
