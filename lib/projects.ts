export interface Project {
  title: string;
  description: string;
  href: string;
  tags: string[];
}

export const projects: Project[] = [
  {
  title: "Nebryon Lisan",
  description:
    "Application d'apprentissage des langues : fiches recto/verso, QCM, traduction écrite, remise en ordre et autres formes d'apprentissage.",
  href: "#",
  tags: ["React Native", "Expo", "TypeScript", "SQLite"],
},
  {
    title: "Nebryon Hub",
    description:
      "Un hub de projets et une boîte à outils pour tous — images, PDF, QR codes, mots de passe et bien plus. Des outils rapides, simples et 100 % locaux.",
    href: "#",
    tags: ["Next.js", "TypeScript", "Tailwind"],
  },
];
