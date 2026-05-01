"use client";

/**
 * GreetingClock — compact inline bar for navbars.
 * Shows "Bonjour, Jean · 14:32:05" when a profile firstName is set,
 * or just the live time when no name is available.
 */

import { useGreeting } from "@/hooks/useGreeting";

interface Props {
  /** Smaller text sizing for the compact Orbit topbar */
  compact?: boolean;
}

export default function GreetingClock({ compact = false }: Props) {
  const { firstName, salutation, timeStr } = useGreeting();

  const textSize  = compact ? "text-[10px]" : "text-xs";
  const clockSize = compact ? "text-[10px]" : "text-xs";

  return (
    <div
      className={`hidden sm:flex items-center gap-2 select-none ${textSize}`}
      style={{ color: "var(--muted)" }}
    >
      {firstName && (
        <>
          <span>
            {salutation},{" "}
            <span className="font-medium" style={{ color: "var(--text)" }}>
              {firstName}
            </span>
          </span>
          <span style={{ opacity: 0.35 }}>·</span>
        </>
      )}
      <span
        className={`font-mono ${clockSize}`}
        style={{ color: "var(--nebula)", opacity: 0.9, letterSpacing: "0.04em" }}
      >
        {timeStr}
      </span>
    </div>
  );
}
