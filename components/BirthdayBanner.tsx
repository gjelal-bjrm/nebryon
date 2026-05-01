"use client";

/**
 * BirthdayBanner — shown exactly once per day on the user's birthday.
 * Deliberately avoids the phrase "Bon anniversaire".
 * Dismissed with a click on X; dismissal is stored in sessionStorage
 * so it reappears after a full page reload the next day but not within the session.
 */

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { useGreeting } from "@/hooks/useGreeting";

const SESSION_KEY = "nebryon-bday-dismissed";

const MESSAGES = [
  "C'est un jour qui t'appartient. Nous espérons que tout va pour le mieux et que ce nouveau cycle t'apporte tout ce que tu mérites.",
  "Une nouvelle étape commence aujourd'hui. Que la vie continue de t'offrir le meilleur — Nebryon est là pour t'accompagner.",
  "Ce jour porte quelque chose de spécial. Nous te souhaitons une journée lumineuse et tout le bonheur que tu mérites.",
  "Aujourd'hui est un jour pas comme les autres. Que cette année soit riche, belle et pleine de moments qui comptent.",
];

export default function BirthdayBanner() {
  const { firstName, isBirthday } = useGreeting();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    try {
      const alreadyDismissed = sessionStorage.getItem(SESSION_KEY) === "1";
      setDismissed(alreadyDismissed);
    } catch { /* private mode */ }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* */ }
  };

  if (!isBirthday || dismissed) return null;

  // Pick a message deterministically based on birth year (stable across the day)
  const msgIndex = Math.abs((firstName.charCodeAt(0) || 0)) % MESSAGES.length;
  const message = MESSAGES[msgIndex];

  return (
    <div
      className="relative w-full flex items-center gap-3 px-5 py-2.5 text-sm"
      style={{
        background: "linear-gradient(90deg, rgba(108,99,255,.15) 0%, rgba(45,212,191,.12) 50%, rgba(59,158,255,.15) 100%)",
        borderBottom: "1px solid rgba(108,99,255,.3)",
      }}
    >
      <Sparkles size={14} className="flex-shrink-0" style={{ color: "#FBBF24" }} />
      <p className="flex-1 text-xs leading-relaxed" style={{ color: "var(--text)" }}>
        {firstName ? (
          <><span className="font-semibold">{firstName},</span> {message}</>
        ) : (
          message
        )}
      </p>
      <button
        onClick={dismiss}
        className="flex-shrink-0 rounded-md p-1 transition hover:opacity-70"
        style={{ color: "var(--muted)" }}
        aria-label="Fermer"
      >
        <X size={13} />
      </button>
    </div>
  );
}
