export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
export type BodyType = "none" | "json" | "form-data" | "raw";
export type AuthType = "none" | "bearer" | "basic" | "apikey";
export type ReqTab = "params" | "headers" | "body" | "auth";
export type ResTab = "body" | "headers";

export interface KVPair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Auth {
  type: AuthType;
  bearer: string;
  basicUser: string;
  basicPass: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyIn: "header" | "query";
}

export interface RequestBody {
  type: BodyType;
  content: string;
}

export interface OrbitRequest {
  method: Method;
  url: string;
  params: KVPair[];
  headers: KVPair[];
  body: RequestBody;
  auth: Auth;
}

export interface OrbitResponse {
  status: number;
  statusText: string;
  time: number;
  size: number;
  headers: Record<string, string>;
  body: string;
  contentType: string;
}

/* ── DB models ─────────────────────────────────────────── */
export interface Collection {
  id: string;
  name: string;
  createdAt: number;
}

/** A folder lives inside a collection; parentFolderId=null → root of collection */
export interface Folder {
  id: string;
  collectionId: string;
  parentFolderId: string | null;
  name: string;
  createdAt: number;
}

export interface SavedRequest extends OrbitRequest {
  id: string;
  collectionId: string;
  /** null = at root of the collection (no folder) */
  folderId: string | null;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Environment {
  id: string;
  name: string;
  isActive: boolean;
  variables: KVPair[];
  createdAt: number;
}

/* ── Profile ───────────────────────────────────────────── */
export interface Profile {
  id: "singleton";
  firstName: string;
  lastName: string;
  email: string;
  photo: string;
  bio: string;
  birthdate: string; // YYYY-MM-DD, empty string if not set
  updatedAt: number;
}

export function defaultProfile(): Profile {
  return { id: "singleton", firstName: "", lastName: "", email: "", photo: "", bio: "", birthdate: "", updatedAt: Date.now() };
}

/* ── Backup ─────────────────────────────────────────────── */
export interface OrbitBackup {
  version: 2 | 3;
  exportedAt: string;
  collections: Collection[];
  /** v3+ only — folder tree */
  folders: Folder[];
  requests: SavedRequest[];
  environments: Environment[];
  profile: Profile | null;
}

/* ── Defaults ──────────────────────────────────────────── */
export function defaultRequest(): OrbitRequest {
  return {
    method: "GET",
    url: "",
    params: [],
    headers: [],
    body: { type: "none", content: "" },
    auth: { type: "none", bearer: "", basicUser: "", basicPass: "", apiKeyName: "X-API-Key", apiKeyValue: "", apiKeyIn: "header" },
  };
}

export function newKV(): KVPair {
  return { id: crypto.randomUUID(), key: "", value: "", enabled: true };
}
