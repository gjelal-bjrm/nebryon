"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/orbit/db";

/** Returns the greeting salutation based on current hour (French). */
function getSalutation(h: number): string {
  if (h < 5)  return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

/**
 * Checks if today matches a stored birthdate (YYYY-MM-DD).
 * Only month+day is compared so it triggers every year.
 */
function checkBirthday(birthdate: string, now: Date): boolean {
  if (!birthdate) return false;
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${mm}-${dd}`;
  const bdMmDd = birthdate.length >= 5 ? birthdate.slice(-5) : "";
  return bdMmDd === today;
}

export interface GreetingData {
  firstName: string;
  salutation: string;
  /** null until after client mount — prevents SSR/client hydration mismatch */
  timeStr: string | null;
  isBirthday: boolean;
  now: Date | null;
}

export function useGreeting(): GreetingData {
  // Start null so server and client render the same empty value on first pass
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const profile = useLiveQuery(() => db.profile.get("singleton"), []);

  const firstName  = profile?.firstName?.trim() ?? "";
  const salutation = now ? getSalutation(now.getHours()) : "Bonjour";
  const isBirthday = now ? checkBirthday(profile?.birthdate ?? "", now) : false;

  const timeStr = now
    ? now.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return { firstName, salutation, timeStr, isBirthday, now };
}
