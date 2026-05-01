import Dexie, { type Table } from "dexie";
import type { Collection, Folder, SavedRequest, Environment, Profile, OrbitBackup } from "./types";

class OrbitDB extends Dexie {
  collections!:  Table<Collection>;
  folders!:      Table<Folder>;
  requests!:     Table<SavedRequest>;
  environments!: Table<Environment>;
  profile!:      Table<Profile>;
  settings!:     Table<{ id: string; value: unknown }>;

  constructor() {
    super("nebryon-orbit");
    this.version(1).stores({
      collections:  "id, name, createdAt",
      requests:     "id, collectionId, name, createdAt",
      environments: "id, name, isActive",
    });
    this.version(2).stores({
      collections:  "id, name, createdAt",
      requests:     "id, collectionId, name, createdAt",
      environments: "id, name, isActive, createdAt",
    });
    this.version(3).stores({
      collections:  "id, name, createdAt",
      requests:     "id, collectionId, name, createdAt",
      environments: "id, name, isActive, createdAt",
      profile:      "id",
    });
    this.version(4).stores({
      collections:  "id, name, createdAt",
      requests:     "id, collectionId, name, createdAt",
      environments: "id, name, isActive, createdAt",
      profile:      "id",
      settings:     "id",
    });
    // v5: adds folders table + folderId index on requests
    this.version(5).stores({
      collections:  "id, name, createdAt",
      folders:      "id, collectionId, parentFolderId, name, createdAt",
      requests:     "id, collectionId, folderId, name, createdAt",
      environments: "id, name, isActive, createdAt",
      profile:      "id",
      settings:     "id",
    });
  }
}

export const db = new OrbitDB();

/* ── Backup dir handle (File System Access API) ──────────── */
export async function getBackupDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const row = await db.settings.get("backupDirHandle");
    return (row?.value as FileSystemDirectoryHandle) ?? null;
  } catch { return null; }
}

export async function setBackupDirHandle(handle: FileSystemDirectoryHandle | null): Promise<void> {
  if (handle) {
    await db.settings.put({ id: "backupDirHandle", value: handle });
  } else {
    await db.settings.delete("backupDirHandle");
  }
}

/* ── JSON backup helpers ─────────────────────────────────── */
export async function exportBackup(): Promise<string> {
  const [collections, folders, requests, environments, profileArr] = await Promise.all([
    db.collections.toArray(),
    db.folders.toArray(),
    db.requests.toArray(),
    db.environments.toArray(),
    db.profile.toArray(),
  ]);
  const backup: OrbitBackup = {
    version: 3,
    exportedAt: new Date().toISOString(),
    collections,
    folders,
    requests,
    environments,
    profile: profileArr[0] ?? null,
  };
  return JSON.stringify(backup, null, 2);
}

export async function importBackup(json: string): Promise<void> {
  const backup = JSON.parse(json) as OrbitBackup;
  await db.transaction("rw", [db.collections, db.folders, db.requests, db.environments, db.profile], async () => {
    await Promise.all([
      db.collections.clear(), db.folders.clear(), db.requests.clear(),
      db.environments.clear(), db.profile.clear(),
    ]);
    await Promise.all([
      backup.collections?.length  ? db.collections.bulkAdd(backup.collections)   : Promise.resolve(),
      backup.folders?.length      ? db.folders.bulkAdd(backup.folders)           : Promise.resolve(),
      backup.requests?.length     ? db.requests.bulkAdd(backup.requests)         : Promise.resolve(),
      backup.environments?.length ? db.environments.bulkAdd(backup.environments) : Promise.resolve(),
      backup.profile              ? db.profile.put(backup.profile)               : Promise.resolve(),
    ]);
  });
}

/* ── Cascade-delete a folder and all its descendants ────── */
export async function deleteFolder(folderId: string): Promise<void> {
  const allFolders = await db.folders.toArray();

  function descendants(id: string): string[] {
    const children = allFolders.filter((f) => f.parentFolderId === id).map((f) => f.id);
    return [...children, ...children.flatMap(descendants)];
  }

  const toDelete = [folderId, ...descendants(folderId)];
  await db.requests.where("folderId").anyOf(toDelete).delete();
  await db.folders.bulkDelete(toDelete);
}
