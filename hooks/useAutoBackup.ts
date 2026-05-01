"use client";

import { useEffect } from "react";
import { runAutoBackupIfDue } from "@/lib/orbit/autobackup";

const CHECK_MS = 5 * 60 * 1000; // check every 5 min, backup only if due

export function useAutoBackup() {
  useEffect(() => {
    runAutoBackupIfDue().catch(() => {});
    const timer = setInterval(() => { runAutoBackupIfDue().catch(() => {}); }, CHECK_MS);
    return () => clearInterval(timer);
  }, []);
}
