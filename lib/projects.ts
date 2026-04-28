export type Project = {
  title: string;
  description: string;
  href: string;
  tags: string[];
};

export const projects: Project[] = [
  {
    title: "Projet A",
    description: "Mini description claire du projet.",
    href: "https://exemple.com",
    tags: ["React", "Tailwind", "API"],
  },
  {
    title: "Projet B",
    description: "Autre projet accessible depuis ce hub.",
    href: "https://exemple.com",
    tags: ["Next.js", "Framer Motion"],
  },
];
