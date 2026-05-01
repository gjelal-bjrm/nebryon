"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Sun, Moon, User } from "lucide-react";
import { db } from "@/lib/orbit/db";
import { NAV } from "@/lib/shared/nav";
import OrbitLogo from "./OrbitLogo";
import GreetingClock from "@/components/GreetingClock";

interface Props {
  onOpenProfile: () => void;
}

export default function OrbitTopbar({ onOpenProfile }: Props) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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

  const profile = useLiveQuery(() => db.profile.get("singleton"), []);
  const initial = profile?.firstName?.[0] ?? profile?.email?.[0] ?? null;

  const [pathname, setPathname] = useState("");
  useEffect(() => { setPathname(window.location.pathname); }, []);

  return (
    <div
      className="flex items-center justify-between px-3 h-10 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--stroke)", background: "var(--nav-bg)" }}
    >
      {/* Left — logo + title */}
      <div className="flex items-center gap-2">
        <a
          href="/"
          className="flex items-center justify-center transition hover:opacity-80"
          title="Retour à l'accueil"
        >
          <OrbitLogo size={26} />
        </a>
        <span
          className="text-xs font-bold tracking-widest select-none"
          style={{
            background: "linear-gradient(90deg, #3B9EFF 0%, #6C63FF 48%, #2DD4BF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ORBIT
        </span>
      </div>

      {/* Center — nav links */}
      <nav className="hidden sm:flex items-center gap-1">
        {NAV.map((item) => {
          const isApp   = !item.href.startsWith("#");
          const isCurrent = isApp && pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className="px-2.5 py-1 rounded-lg text-xs transition"
              style={isCurrent
                ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.1)", color: "var(--halo)" }
                : { color: "var(--muted)" }}
              onMouseEnter={(e) => { if (!isCurrent) (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
              onMouseLeave={(e) => { if (!isCurrent) (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Right — greeting + theme + profile */}
      <div className="flex items-center gap-2.5">
        <GreetingClock compact />
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition hover:opacity-80"
          style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
        >
          {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
        </button>

        <button
          onClick={onOpenProfile}
          className="flex items-center justify-center w-7 h-7 rounded-full overflow-hidden transition hover:opacity-80"
          style={{ border: "1px solid var(--stroke)", background: profile?.photo ? "transparent" : "rgba(108,99,255,.12)" }}
          title="Profil & Sauvegarde"
        >
          {profile?.photo ? (
            <img src={profile.photo} alt="avatar" className="w-full h-full object-cover" />
          ) : initial ? (
            <span className="text-[10px] font-bold" style={{ color: "var(--nebula)" }}>{initial.toUpperCase()}</span>
          ) : (
            <User size={12} style={{ color: "var(--muted)" }} />
          )}
        </button>
      </div>
    </div>
  );
}
