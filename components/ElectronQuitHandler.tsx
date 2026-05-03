"use client";

/**
 * Registers the Electron before-quit backup handler once, at the root layout
 * level, so it fires regardless of which page is currently active.
 *
 * Flow:
 *   main.js  →  before-quit event  →  event.preventDefault()
 *            →  send 'orbit:before-quit' to renderer
 *            →  this handler runs writeBackup()
 *            →  calls quitReady() → main sets isQuitting=true → app.quit()
 *   (safety timeout of 5s in main.js quits anyway if renderer doesn't respond)
 */

import { useEffect } from "react";
import { writeBackup, isElectron } from "@/lib/orbit/autobackup";

export default function ElectronQuitHandler() {
  useEffect(() => {
    if (!isElectron()) return;

    const handler = async () => {
      try {
        await writeBackup();
      } catch {
        // No backup dir configured, or write failed — don't block quit
      }
      window.electronAPI!.quitReady();
    };

    window.electronAPI!.onBeforeQuit(handler);

    // preload.js uses removeAllListeners before re-registering, so
    // re-mounting (HMR, StrictMode) won't stack duplicate listeners.
  }, []);

  return null;
}
