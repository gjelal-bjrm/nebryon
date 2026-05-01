import type { SavedRequest, KVPair, Auth, RequestBody, Method } from "./types";

/* ── Postman v2.1.0 types (minimal) ─────────────────────── */
interface PostmanUrl {
  raw?: string;
  host?: string[];
  path?: string[];
  port?: string;
  query?: { key: string; value: string; disabled?: boolean }[];
}
interface PostmanHeader { key: string; value: string; disabled?: boolean; }
interface PostmanBody {
  mode?: "raw" | "formdata" | "urlencoded" | "none";
  raw?: string;
  options?: { raw?: { language?: string } };
}
interface PostmanAuth {
  type?: string;
  bearer?: { key: string; value: string }[];
  basic?:  { key: string; value: string }[];
  apikey?: { key: string; value: string }[];
}
interface PostmanRequest {
  method?: string;
  url?: string | PostmanUrl;
  header?: PostmanHeader[];
  body?: PostmanBody;
  auth?: PostmanAuth;
}
interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  item?: PostmanItem[];
}
interface PostmanCollection {
  info: { name: string };
  item: PostmanItem[];
}

/* ── Field parsers ───────────────────────────────────────── */
function parseUrl(url: string | PostmanUrl | undefined): { urlStr: string; params: KVPair[] } {
  if (!url) return { urlStr: "", params: [] };
  if (typeof url === "string") return { urlStr: url, params: [] };
  const params: KVPair[] = (url.query ?? []).map((q) => ({
    id: crypto.randomUUID(), key: q.key ?? "", value: q.value ?? "", enabled: !q.disabled,
  }));
  return { urlStr: url.raw ?? "", params };
}

function parseHeaders(headers: PostmanHeader[] | undefined): KVPair[] {
  return (headers ?? []).map((h) => ({
    id: crypto.randomUUID(), key: h.key, value: h.value, enabled: !h.disabled,
  }));
}

function parseBody(body: PostmanBody | undefined): RequestBody {
  if (!body || !body.mode || body.mode === "none") return { type: "none", content: "" };
  if (body.mode === "raw") {
    const lang = body.options?.raw?.language ?? "text";
    return { type: lang === "json" ? "json" : "raw", content: body.raw ?? "" };
  }
  return { type: "form-data", content: body.raw ?? "" };
}

function parseAuth(auth: PostmanAuth | undefined): Auth {
  const base: Auth = { type: "none", bearer: "", basicUser: "", basicPass: "", apiKeyName: "X-API-Key", apiKeyValue: "", apiKeyIn: "header" };
  if (!auth) return base;
  const get = (arr: { key: string; value: string }[] | undefined, k: string) =>
    arr?.find((x) => x.key === k)?.value ?? "";
  if (auth.type === "bearer")  return { ...base, type: "bearer",  bearer: get(auth.bearer, "token") };
  if (auth.type === "basic")   return { ...base, type: "basic",   basicUser: get(auth.basic, "username"), basicPass: get(auth.basic, "password") };
  if (auth.type === "apikey")  return { ...base, type: "apikey",  apiKeyName: get(auth.apikey, "key"), apiKeyValue: get(auth.apikey, "value"), apiKeyIn: get(auth.apikey, "in") === "query" ? "query" : "header" };
  return base;
}

const VALID: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
function parseMethod(m?: string): Method {
  const u = (m ?? "GET").toUpperCase() as Method;
  return VALID.includes(u) ? u : "GET";
}

type ReqData = Omit<SavedRequest, "id" | "collectionId" | "folderId">;

function convertRequest(item: PostmanItem): ReqData {
  const req = item.request ?? {};
  const { urlStr, params } = parseUrl(req.url);
  const now = Date.now();
  return {
    name: item.name,
    method: parseMethod(req.method),
    url: urlStr,
    params,
    headers: parseHeaders(req.header),
    body: parseBody(req.body),
    auth: parseAuth(req.auth),
    createdAt: now,
    updatedAt: now,
  };
}

/* ── Public result types ─────────────────────────────────── */
export interface FolderImport {
  /** Temporary UUID for building parent↔child relationships */
  tempId: string;
  name: string;
  parentTempId: string | null;
  /** Direct requests inside this folder (not in sub-folders) */
  requests: ReqData[];
}

export interface CollectionImport {
  collectionName: string;
  /** Requests at the root of the collection (no folder) */
  rootRequests: ReqData[];
  /** All folders (flat list, use parentTempId for hierarchy) */
  folders: FolderImport[];
}

/* ── Recursive walker ────────────────────────────────────── */
/**
 * Walk a list of Postman items.
 * Returns the direct requests found at this level.
 * Sub-folders are pushed into `allFolders` with the given `parentTempId`.
 */
function walkItems(
  items: PostmanItem[],
  parentTempId: string | null,
  allFolders: FolderImport[]
): ReqData[] {
  const directRequests: ReqData[] = [];

  for (const item of items) {
    if (item.request) {
      directRequests.push(convertRequest(item));
    } else if (item.item) {
      const tempId = crypto.randomUUID();
      const folderDirectRequests = walkItems(item.item, tempId, allFolders);
      allFolders.push({
        tempId,
        name: item.name,
        parentTempId,
        requests: folderDirectRequests,
      });
    }
  }

  return directRequests;
}

/* ── Public API ──────────────────────────────────────────── */
export function parsePostmanCollection(json: string): CollectionImport[] {
  const col = JSON.parse(json) as PostmanCollection;
  const rootName = col.info?.name ?? "Collection importée";

  const allFolders: FolderImport[] = [];
  const rootRequests = walkItems(col.item ?? [], null, allFolders);

  return [{ collectionName: rootName, rootRequests, folders: allFolders }];
}
