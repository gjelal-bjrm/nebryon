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

function convertRequest(item: PostmanItem): Omit<SavedRequest, "id" | "collectionId"> {
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

/* ── Tree walker — one group per folder that holds requests ─ */
export interface CollectionGroup {
  collectionName: string;
  requests: Omit<SavedRequest, "id" | "collectionId">[];
}

function walkFolder(items: PostmanItem[], pathParts: string[], out: CollectionGroup[]): void {
  const directRequests = items.filter((i) => i.request);
  const subFolders     = items.filter((i) => i.item && !i.request);

  if (directRequests.length > 0) {
    out.push({
      collectionName: pathParts.join(" › "),
      requests: directRequests.map(convertRequest),
    });
  }

  for (const folder of subFolders) {
    walkFolder(folder.item!, [...pathParts, folder.name], out);
  }
}

/* ── Public API ──────────────────────────────────────────── */
export function parsePostmanCollection(json: string): CollectionGroup[] {
  const col = JSON.parse(json) as PostmanCollection;
  const rootName = col.info?.name ?? "Collection importée";
  const groups: CollectionGroup[] = [];

  // Root-level requests (not inside any folder)
  const rootRequests = (col.item ?? []).filter((i) => i.request);
  if (rootRequests.length > 0) {
    groups.push({ collectionName: rootName, requests: rootRequests.map(convertRequest) });
  }

  // Walk each top-level folder
  for (const item of (col.item ?? []).filter((i) => i.item && !i.request)) {
    walkFolder(item.item!, [item.name], groups);
  }

  return groups;
}
