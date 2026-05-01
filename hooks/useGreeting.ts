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
  // birthdate may be "YYYY-MM-DD" → take last 5 chars
  const bdMmDd = birthdate.length >= 5 ? birthdate.slice(-5) : "";
  return bdMmDd === today;
}

export interface GreetingData {
  firstName: string;
  salutation: string;
  timeStr: string;
  isBirthday: boolean;
  now: Date;
}

export function useGreeting(): GreetingData {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const profile = useLiveQuery(() => db.profile.get("singleton"), []);

  const firstName  = profile?.firstName?.trim() ?? "";
  const salutation = getSalutation(now.getHours());
  const isBirthday = checkBirthday(profile?.birthdate ?? "", now);

  const timeStr = now.toLocaleTimeString("fr", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return { firstName, salutation, timeStr, isBirthday, now };
}
