import Dexie, { type Table } from "dexie";
import type { Collection, SavedRequest, Environment } from "./types";

class OrbitDB extends Dexie {
  collections!: Table<Collection>;
  requests!: Table<SavedRequest>;
  environments!: Table<Environment>;

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
  }
}

export const db = new OrbitDB();
