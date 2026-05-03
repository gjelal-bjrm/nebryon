"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Sun, Moon, User } from "lucide-react";
import { db } from "@/lib/orbit/db";
import { NAV } from "@/lib/shared/nav";
import GreetingClock from "@/components/GreetingClock";
import LumenLogo from "./LumenLogo";

interface Props {
  onOpenProfile: () => void;
}

export default function LumenTopbar({ onOpenProfile }: Props) {
  const [theme, setTheme]     = useState<"dark" | "light">("dark");
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("nebryon-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
    setPathname(window.location.pathname);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("nebryon-theme", next);
    if (next === "light") document.documentElement.setAttribute("data-theme", "light");
    else                  document.documentElement.removeAttribute("data-theme");
  };

  const profile = useLiveQuery(() => db.profile.get("singleton"), []);
  const initial = profile?.firstName?.[0] ?? profile?.email?.[0] ?? null;

  return (
    <div
      className="flex items-center justify-between px-3 h-10 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--stroke)", background: "var(--nav-bg)" }}
    >
      {/* Left — logo + title */}
      <div className="flex items-center gap-2">
        <a href="/" className="flex items-center justify-center transition hover:opacity-80" title="Retour à l'accueil">
          <LumenLogo size={28} />
        </a>
        <span
          className="text-xs font-bold tracking-widest select-none"
          style={{
            background: "linear-gradient(90deg, #0EA5E9 0%, #BAE6FD 50%, #0EA5E9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
            backgroundClip:       "text",
          }}
        >
          LUMEN
        </span>
      </div>

      {/* Right — nav links + clock + theme + profile */}
      <div className="hidden sm:flex items-center gap-4">
        {NAV.map((item) => {
          const isApp     = !item.href.startsWith("#");
          const isCurrent = isApp && pathname === item.href;
          const href      = item.href.startsWith("#") ? `/${item.href}` : item.href;

          if (isApp) {
            return (
              <a key={item.href} href={href}
                className="flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition"
                style={isCurrent
                  ? { border: "1px solid #0EA5E9", background: "rgba(14,165,233,.1)", color: "#BAE6FD" }
                  : { border: "1px solid var(--stroke)", background: "rgba(14,165,233,.06)", color: "var(--muted)" }}
              >
                {item.label}
              </a>
            );
          }
          return (
            <a key={item.href} href={href}
              className="px-0.5 py-1 text-xs transition"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
            >
              {item.label}
            </a>
          );
        })}

        <GreetingClock compact />

        <button onClick={toggleTheme}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition hover:opacity-80 cursor-pointer"
          style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
        >
          {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
        </button>

        <button onClick={onOpenProfile}
          className="flex items-center justify-center w-7 h-7 rounded-full overflow-hidden transition hover:opacity-80 cursor-pointer"
          style={{ border: "1px solid var(--stroke)", background: profile?.photo ? "transparent" : "rgba(14,165,233,.12)" }}
          title="Profil & Sauvegarde"
        >
          {profile?.photo ? (
            <img src={profile.photo} alt="avatar" className="w-full h-full object-cover" />
          ) : initial ? (
            <span className="text-[10px] font-bold" style={{ color: "#0EA5E9" }}>{initial.toUpperCase()}</span>
          ) : (
            <User size={12} style={{ color: "var(--muted)" }} />
          )}
        </button>
      </div>
    </div>
  );
}
