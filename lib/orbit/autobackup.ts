import { exportBackup, getBackupDirHandle } from "./db";

export type BackupInterval = "15min" | "hourly" | "daily" | "weekly" | "off";

export const INTERVAL_LABELS: Record<BackupInterval, string> = {
  "15min":  "Toutes les 15 min",
  "hourly": "Toutes les heures",
  "daily":  "Tous les jours",
  "weekly": "Toutes les semaines",
  "off":    "Désactivé",
};

const INTERVAL_MS: Record<BackupInterval, number> = {
  "15min":  15 * 60 * 1000,
  "hourly": 60 * 60 * 1000,
  "daily":  24 * 60 * 60 * 1000,
  "weekly": 7 * 24 * 60 * 60 * 1000,
  "off":    Infinity,
};

const LS_INTERVAL = "orbit-backup-interval";
const LS_LAST     = "orbit-last-backup";

export function getInterval(): BackupInterval {
  return (localStorage.getItem(LS_INTERVAL) as BackupInterval) ?? "daily";
}
export function setInterval_(interval: BackupInterval): void {
  localStorage.setItem(LS_INTERVAL, interval);
}
export function getLastBackup(): number {
  return parseInt(localStorage.getItem(LS_LAST) ?? "0");
}
export function isDue(): boolean {
  const interval = getInterval();
  if (interval === "off") return false;
  return Date.now() - getLastBackup() > INTERVAL_MS[interval];
}

/** Write a timestamped backup JSON to the configured directory */
export async function writeBackupToDir(handle: FileSystemDirectoryHandle): Promise<string> {
  const json = await exportBackup();
  const ts   = new Date().toISOString().replace(/:/g, "-").slice(0, 19);
  const name = `orbit-backup-${ts}.json`;
  const file = await handle.getFileHandle(name, { create: true });
  const writable = await file.createWritable();
  await writable.write(json);
  await writable.close();
  localStorage.setItem(LS_LAST, Date.now().toString());
  return name;
}

/** Run backup if due — silently skips if no handle or not due */
export async function runAutoBackupIfDue(): Promise<string | null> {
  if (!isDue()) return null;
  const handle = await getBackupDirHandle();
  if (!handle) return null;
  // Verify we still have permission
  try {
    // @ts-ignore — queryPermission is available in Chrome (WICG FSA spec)
    const perm = await (handle as any).queryPermission({ mode: "readwrite" });
    if (perm !== "granted") return null;
  } catch { return null; }
  return writeBackupToDir(handle);
}
