import Dexie, { type Table } from "dexie";
import type { Collection, SavedRequest, Environment, Profile, OrbitBackup } from "./types";

class OrbitDB extends Dexie {
  collections!: Table<Collection>;
  requests!: Table<SavedRequest>;
  environments!: Table<Environment>;
  profile!: Table<Profile>;

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
  }
}

export const db = new OrbitDB();

/* ── Backup helpers ──────────────────────────────────────── */
export async function exportBackup(): Promise<string> {
  const [collections, requests, environments, profileArr] = await Promise.all([
    db.collections.toArray(),
    db.requests.toArray(),
    db.environments.toArray(),
    db.profile.toArray(),
  ]);
  const backup: OrbitBackup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    collections,
    requests,
    environments,
    profile: profileArr[0] ?? null,
  };
  return JSON.stringify(backup, null, 2);
}

export async function importBackup(json: string): Promise<void> {
  const backup = JSON.parse(json) as OrbitBackup;
  await db.transaction("rw", db.collections, db.requests, db.environments, db.profile, async () => {
    await Promise.all([
      db.collections.clear(),
      db.requests.clear(),
      db.environments.clear(),
      db.profile.clear(),
    ]);
    await Promise.all([
      backup.collections?.length  ? db.collections.bulkAdd(backup.collections)   : Promise.resolve(),
      backup.requests?.length     ? db.requests.bulkAdd(backup.requests)         : Promise.resolve(),
      backup.environments?.length ? db.environments.bulkAdd(backup.environments) : Promise.resolve(),
      backup.profile              ? db.profile.put(backup.profile)               : Promise.resolve(),
    ]);
  });
}
