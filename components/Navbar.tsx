"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Projets", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("#projects");

  // ferme le menu si on repasse en desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = () => setOpen(false);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // option : empêche le scroll de la page quand le menu est ouvert (mobile)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const Link = ({ item }: { item: NavItem }) => {
    const isActive = active === item.href;

    return (
      <a
        href={item.href}
        onClick={() => {
          setActive(item.href);
          setOpen(false);
        }}
        className="relative px-1 py-2 text-sm text-white/70 hover:text-white transition"
      >
        <span className="relative z-10">{item.label}</span>

        {/* underline animé */}
        {isActive && (
          <motion.span
            layoutId="nav-underline"
            className="absolute left-0 right-0 -bottom-0.5 h-px bg-[var(--neon)]"
            style={{
              boxShadow: "0 0 18px rgba(21,221,83,.35)",
            }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 500, damping: 40 }
            }
          />
        )}
      </a>
    );
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-white/10 bg-[rgba(6,18,37,.65)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          {/* Brand */}
          <a href="/" className="group flex items-center gap-3">
            <motion.div
              className="relative h-10 w-10 overflow-hidden rounded-xl ring-1 ring-white/10 bg-white/[0.03]"
              whileHover={reduce ? undefined : { rotate: -3, scale: 1.04 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
            >
              {!reduce && (
                <motion.div
                  className="pointer-events-none absolute -inset-6"
                  initial={{ opacity: 0.32, scale: 1 }}
                  animate={{ opacity: [0.22, 0.52, 0.22], scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    background:
                      "radial-gradient(circle at 35% 30%, rgba(73,255,138,.22), rgba(0,0,0,0) 60%)",
                    filter: "blur(14px)",
                  }}
                />
              )}
              <Image
                src="/nebryon-mark-transparent-v2.png"
                alt="Nebryon"
                fill
                priority
                className="object-contain p-2 drop-shadow-[0_0_12px_rgba(0,220,255,.55)] saturate-150"
              />
            </motion.div>

            <span className="text-sm font-semibold tracking-wide text-white/90">
              <span className="text-[var(--neon)] drop-shadow-[0_0_12px_rgba(21,221,83,.25)]">
                Neb
              </span>
              ryon
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="relative hidden items-center gap-5 sm:flex">
            {NAV.map((item) => (
              <Link key={item.href} item={item} />
            ))}

            <a
              href="#projects"
              className="ml-2 inline-flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.07] transition"
              onClick={() => setActive("#projects")}
            >
              Explorer
            </a>
          </nav>

          {/* Mobile button */}
          <button
            type="button"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06] transition"
          >
            {/* hamburger minimal -> X */}
            <span className="relative h-4 w-5">
              <motion.span
                className="absolute left-0 top-0 h-px w-full bg-current"
                animate={open ? { y: 7, rotate: 45 } : { y: 0, rotate: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.18 }}
              />
              <motion.span
                className="absolute left-0 top-1/2 h-px w-full bg-current"
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                transition={reduce ? { duration: 0 } : { duration: 0.12 }}
              />
              <motion.span
                className="absolute left-0 bottom-0 h-px w-full bg-current"
                animate={open ? { y: -7, rotate: -45 } : { y: 0, rotate: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.18 }}
              />
            </span>
          </button>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={reduce ? false : { height: "auto", opacity: 1 }}
              exit={reduce ? false : { height: 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
              className="sm:hidden overflow-hidden"
            >
              <div className="mx-auto w-full max-w-6xl px-5 pb-4 sm:px-8">
                <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur">
                  <div className="flex flex-col">
                    {NAV.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setActive(item.href);
                          setOpen(false);
                        }}
                        className="rounded-xl px-3 py-3 text-sm text-white/80 hover:bg-white/[0.06] transition"
                      >
                        {item.label}
                      </a>
                    ))}
                    <a
                      href="#projects"
                      onClick={() => {
                        setActive("#projects");
                        setOpen(false);
                      }}
                      className="mt-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white/90 hover:bg-white/[0.07] transition"
                    >
                      Explorer
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
