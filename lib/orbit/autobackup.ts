import { exportBackup, getBackupDirHandle, setBackupDirHandle, db } from "./db";

/* ── Context detection ───────────────────────────────────── */
export const isElectron = () =>
  typeof window !== "undefined" && typeof window.electronAPI !== "undefined";

/* ── Interval config ─────────────────────────────────────── */
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

/* ── Stored directory ────────────────────────────────────── */

/** Returns the display name/path of the configured backup dir, or null */
export async function getStoredDirLabel(): Promise<string | null> {
  if (isElectron()) {
    const row = await db.settings.get("backupDirPath");
    return (row?.value as string) ?? null;
  }
  const handle = await getBackupDirHandle();
  return handle?.name ?? null;
}

/** Open native picker and persist the selection */
export async function pickAndStoreDir(): Promise<string | null> {
  if (isElectron()) {
    const dirPath = await window.electronAPI!.pickDir();
    if (!dirPath) return null;
    await db.settings.put({ id: "backupDirPath", value: dirPath });
    return dirPath;
  }
  // Web — File System Access API
  try {
    // @ts-ignore
    const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    await setBackupDirHandle(handle);
    return handle.name;
  } catch (e: any) {
    if (e?.name === "AbortError") return null;
    throw e;
  }
}

/** Remove stored dir config */
export async function clearStoredDir(): Promise<void> {
  if (isElectron()) {
    await db.settings.delete("backupDirPath");
  } else {
    await setBackupDirHandle(null);
  }
}

/* ── Write backup ────────────────────────────────────────── */

function backupFilename(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `orbit-backup-${ts}.json`;
}

/** Write a backup to the configured directory — returns filename */
export async function writeBackup(): Promise<string> {
  const json = await exportBackup();
  const name = backupFilename();

  if (isElectron()) {
    const row = await db.settings.get("backupDirPath");
    const dirPath = row?.value as string | undefined;
    if (!dirPath) throw new Error("Aucun dossier de backup configuré");
    await window.electronAPI!.writeFile(dirPath, name, json);
  } else {
    const handle = await getBackupDirHandle();
    if (!handle) throw new Error("Aucun dossier de backup configuré");
    // Re-verify permission (Chrome may revoke between sessions)
    try {
      // @ts-ignore
      const perm = await (handle as any).queryPermission({ mode: "readwrite" });
      if (perm !== "granted") throw new Error("Permission révoquée");
    } catch { /* queryPermission not available — attempt anyway */ }
    const file = await handle.getFileHandle(name, { create: true });
    const writable = await file.createWritable();
    await writable.write(json);
    await writable.close();
  }

  localStorage.setItem(LS_LAST, Date.now().toString());
  return name;
}

/** Run backup only if due and a dir is configured */
export async function runAutoBackupIfDue(): Promise<string | null> {
  if (!isDue()) return null;
  try {
    return await writeBackup();
  } catch {
    return null; // Silent fail — don't interrupt user
  }
}
