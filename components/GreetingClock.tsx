"use client";

import { useGreeting } from "@/hooks/useGreeting";

interface Props {
  compact?: boolean;
}

export default function GreetingClock({ compact = false }: Props) {
  const { firstName, salutation, timeStr } = useGreeting();

  // Don't render until client-side time is available (avoids hydration mismatch)
  if (!timeStr) return null;

  const sz = compact ? "text-[10px]" : "text-xs";

  return (
    <div
      className={`hidden sm:flex items-center gap-1.5 select-none ${sz}`}
      style={{ color: "var(--muted)" }}
    >
      {firstName && (
        <>
          <span>
            {salutation},{" "}
            <span className="font-semibold" style={{ color: "var(--text)" }}>
              {firstName}
            </span>
          </span>
          <span style={{ opacity: 0.3 }}>·</span>
        </>
      )}
      <span
        className={`font-mono ${sz}`}
        style={{ color: "var(--nebula)", opacity: 0.85, letterSpacing: "0.04em" }}
        suppressHydrationWarning
      >
        {timeStr}
      </span>
    </div>
  );
}
