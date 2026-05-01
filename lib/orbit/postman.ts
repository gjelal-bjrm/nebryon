import type { SavedRequest, KVPair, Auth, RequestBody, Method } from "./types";

/* ── Postman v2.1.0 types (minimal) ─────────────────────── */
interface PostmanUrl {
  raw?: string;
  host?: string[];
  path?: string[];
  port?: string;
  query?: { key: string; value: string; disabled?: boolean }[];
}

interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanBody {
  mode?: "raw" | "formdata" | "urlencoded" | "none";
  raw?: string;
  options?: { raw?: { language?: string } };
}

interface PostmanAuth {
  type?: string;
  bearer?: { key: string; value: string }[];
  basic?: { key: string; value: string }[];
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

/* ── Helpers ─────────────────────────────────────────────── */
function kv(id: string, key: string, value: string, enabled = true): KVPair {
  return { id, key, value, enabled };
}

function parseUrl(url: string | PostmanUrl | undefined): { urlStr: string; params: KVPair[] } {
  if (!url) return { urlStr: "", params: [] };
  if (typeof url === "string") return { urlStr: url, params: [] };

  const urlStr = url.raw ?? "";
  const params: KVPair[] = (url.query ?? []).map((q, i) => kv(
    crypto.randomUUID(),
    q.key ?? "",
    q.value ?? "",
    !q.disabled,
  ));
  return { urlStr, params };
}

function parseHeaders(headers: PostmanHeader[] | undefined): KVPair[] {
  return (headers ?? []).map((h) => kv(crypto.randomUUID(), h.key, h.value, !h.disabled));
}

function parseBody(body: PostmanBody | undefined): RequestBody {
  if (!body || body.mode === "none" || !body.mode) return { type: "none", content: "" };
  if (body.mode === "raw") {
    const lang = body.options?.raw?.language ?? "text";
    return { type: lang === "json" ? "json" : "raw", content: body.raw ?? "" };
  }
  if (body.mode === "formdata" || body.mode === "urlencoded") {
    return { type: "form-data", content: body.raw ?? "" };
  }
  return { type: "none", content: "" };
}

function parseAuth(auth: PostmanAuth | undefined): Auth {
  const base: Auth = { type: "none", bearer: "", basicUser: "", basicPass: "", apiKeyName: "X-API-Key", apiKeyValue: "", apiKeyIn: "header" };
  if (!auth) return base;
  const get = (arr: { key: string; value: string }[] | undefined, key: string) =>
    arr?.find((x) => x.key === key)?.value ?? "";

  if (auth.type === "bearer") return { ...base, type: "bearer", bearer: get(auth.bearer, "token") };
  if (auth.type === "basic") return { ...base, type: "basic", basicUser: get(auth.basic, "username"), basicPass: get(auth.basic, "password") };
  if (auth.type === "apikey") return { ...base, type: "apikey", apiKeyName: get(auth.apikey, "key"), apiKeyValue: get(auth.apikey, "value"), apiKeyIn: get(auth.apikey, "in") === "query" ? "query" : "header" };
  return base;
}

const VALID_METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
function parseMethod(m: string | undefined): Method {
  const upper = (m ?? "GET").toUpperCase() as Method;
  return VALID_METHODS.includes(upper) ? upper : "GET";
}

/** Recursively flatten all items (including inside folders) */
function flattenItems(items: PostmanItem[]): PostmanItem[] {
  const result: PostmanItem[] = [];
  for (const item of items) {
    if (item.request) {
      result.push(item);
    } else if (item.item) {
      result.push(...flattenItems(item.item));
    }
  }
  return result;
}

/* ── Main export ─────────────────────────────────────────── */
export interface ImportResult {
  collectionName: string;
  requests: Omit<SavedRequest, "id" | "collectionId">[];
}

export function parsePostmanCollection(json: string): ImportResult {
  const col = JSON.parse(json) as PostmanCollection;
  const collectionName = col.info?.name ?? "Collection importée";
  const flat = flattenItems(col.item ?? []);

  const requests: Omit<SavedRequest, "id" | "collectionId">[] = flat.map((item) => {
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
  });

  return { collectionName, requests };
}
