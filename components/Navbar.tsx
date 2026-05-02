"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sun, Moon, User } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import dynamic from "next/dynamic";
import { db } from "@/lib/orbit/db";
import { NAV } from "@/lib/shared/nav";
import type { NavItem } from "@/lib/shared/nav";
import GreetingClock from "@/components/GreetingClock";

const ProfileEditor = dynamic(() => import("@/components/orbit/ProfileEditor"), { ssr: false });

function NebryonLogo({ size = 32 }: { size?: number }) {
  const inner = Math.round(size * 0.19);
  const dot   = Math.round(size * 0.38);
  return (
    <motion.div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="absolute inset-0 rounded-full"
        style={{ border: "1.5px solid var(--nebula)", opacity: 0.7 }} />
      <span className="absolute rounded-full"
        style={{ inset: inner, border: "1px solid var(--halo)", opacity: 0.4 }} />
      <span className="absolute rounded-full"
        style={{ inset: dot, background: "var(--nebula)" }} />
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ border: "1.5px solid var(--nebula)" }}
        animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
      />
    </motion.div>
  );
}

export default function Navbar() {
  const reduce = useReducedMotion();
  const [open, setOpen]         = useState(false);
  const [active, setActive]     = useState<string>("#tools");
  const [theme, setTheme]       = useState<"dark" | "light">("dark");
  const [showProfile, setShowProfile] = useState(false);

  const profile = useLiveQuery(() => db.profile.get("singleton"), []);
  const initial = profile?.firstName?.[0] ?? profile?.email?.[0] ?? null;

  // Init theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nebryon-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("nebryon-theme", next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const cb = () => setOpen(false);
    mq.addEventListener?.("change", cb);
    return () => mq.removeEventListener?.("change", cb);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isHash   = item.href.startsWith("#");
    const isApp    = !isHash;
    const isActive = isHash && active === item.href;
    // Always use absolute anchors so hash links work from any page (e.g. /projects/lisan)
    const resolvedHref = isHash ? `/${item.href}` : item.href;

    if (isApp) {
      return (
        <a
          href={resolvedHref}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition"
          style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.1)", color: "var(--halo)" }}
        >
          {item.label}
        </a>
      );
    }

    return (
      <a
        href={resolvedHref}
        onClick={() => { setActive(item.href); setOpen(false); }}
        className="relative px-1 py-2 text-sm transition"
        style={{ color: isActive ? "var(--halo)" : "var(--muted)" }}
        onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
        onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
      >
        <span className="relative z-10">{item.label}</span>
        {isActive && (
          <motion.span
            layoutId="nav-underline"
            className="absolute left-0 right-0 -bottom-0.5 h-px"
            style={{ background: "var(--nebula)", boxShadow: "0 0 18px rgba(108,99,255,.5)" }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
          />
        )}
      </a>
    );
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="backdrop-blur" style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--stroke)", transition: "background 0.3s ease, border-color 0.3s ease" }}>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">

          {/* Brand */}
          <a href="/" className="flex items-center gap-3 no-underline">
            <NebryonLogo size={32} />
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--text)", letterSpacing: ".5px", transition: "color 0.3s ease" }}>
              <span style={{ color: "var(--nebula)" }}>Nebr</span>yon
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="relative hidden items-center gap-5 sm:flex">
            {NAV.map((item) => <NavLink key={item.href} item={item} />)}

            <GreetingClock />

            {/* Theme toggle */}
            <motion.button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-xl transition-all"
              style={{
                width: 36, height: 36,
                border: "1px solid var(--stroke)",
                background: "var(--card-bg)",
                color: "var(--muted)",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              <AnimatePresence mode="wait">
                {theme === "dark" ? (
                  <motion.span key="sun"
                    initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}>
                    <Sun size={15} />
                  </motion.span>
                ) : (
                  <motion.span key="moon"
                    initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}>
                    <Moon size={15} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Profile button */}
            <motion.button
              onClick={() => setShowProfile(true)}
              className="flex items-center justify-center rounded-full overflow-hidden transition-all"
              style={{
                width: 36, height: 36,
                border: "1px solid var(--stroke)",
                background: profile?.photo ? "transparent" : "rgba(108,99,255,.12)",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Profil & Sauvegarde"
            >
              {profile?.photo ? (
                <img src={profile.photo} alt="avatar" className="w-full h-full object-cover" />
              ) : initial ? (
                <span className="text-[11px] font-bold" style={{ color: "var(--nebula)" }}>{initial.toUpperCase()}</span>
              ) : (
                <User size={15} style={{ color: "var(--muted)" }} />
              )}
            </motion.button>
          </nav>

          {/* Mobile right side */}
          <div className="sm:hidden flex items-center gap-2">
            <motion.button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-xl transition-all"
              style={{ width: 36, height: 36, border: "1px solid var(--stroke)", background: "var(--card-bg)", color: "var(--muted)" }}
              whileTap={{ scale: 0.95 }}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </motion.button>

            <motion.button
              onClick={() => setShowProfile(true)}
              className="flex items-center justify-center rounded-full overflow-hidden transition-all"
              style={{ width: 36, height: 36, border: "1px solid var(--stroke)", background: profile?.photo ? "transparent" : "rgba(108,99,255,.12)" }}
              whileTap={{ scale: 0.95 }}
              title="Profil">
              {profile?.photo ? (
                <img src={profile.photo} alt="avatar" className="w-full h-full object-cover" />
              ) : initial ? (
                <span className="text-[11px] font-bold" style={{ color: "var(--nebula)" }}>{initial.toUpperCase()}</span>
              ) : (
                <User size={15} style={{ color: "var(--muted)" }} />
              )}
            </motion.button>

            <button
              type="button"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition"
              style={{ border: "1px solid var(--stroke)", background: "var(--card-bg)", color: "var(--text)" }}
            >
              <span className="relative h-4 w-5">
                <motion.span className="absolute left-0 top-0 h-px w-full bg-current"
                  animate={open ? { y: 7, rotate: 45 } : { y: 0, rotate: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.18 }} />
                <motion.span className="absolute left-0 top-1/2 h-px w-full bg-current"
                  animate={open ? { opacity: 0 } : { opacity: 1 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.12 }} />
                <motion.span className="absolute left-0 bottom-0 h-px w-full bg-current"
                  animate={open ? { y: -7, rotate: -45 } : { y: 0, rotate: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.18 }} />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={reduce ? undefined : { height: 0, opacity: 0 }}
              animate={reduce ? undefined : { height: "auto", opacity: 1 }}
              exit={reduce ? undefined : { height: 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
              className="sm:hidden overflow-hidden"
            >
              <div className="mx-auto w-full max-w-6xl px-5 pb-4 sm:px-8">
                <div className="mt-2 rounded-2xl p-2 backdrop-blur"
                  style={{ border: "1px solid var(--stroke)", background: "var(--card-bg)" }}>
                  <div className="flex flex-col">
                    {NAV.map((item) => (
                      <a key={item.href}
                        href={item.href.startsWith("#") ? `/${item.href}` : item.href}
                        onClick={() => { setActive(item.href); setOpen(false); }}
                        className="rounded-xl px-3 py-3 text-sm transition"
                        style={{ color: "var(--text)" }}>
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
    </header>
  );
}
