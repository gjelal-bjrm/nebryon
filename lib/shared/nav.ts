export type NavItem = { label: string; href: string };

/**
 * Shared navigation links used by both the Hub Navbar and the Orbit Topbar.
 * Items with href starting with "#" are in-page anchors (Hub only).
 * Items with href starting with "/" are app routes.
 */
export const NAV: NavItem[] = [
  { label: "Outils",  href: "#tools" },
  { label: "Projets", href: "#projects" },
  { label: "Orbit",   href: "/orbit" },
  { label: "Pulsar",  href: "/pulsar" },
  { label: "Lumen",   href: "/lumen" },
];
