import type { OrbitRequest, OrbitResponse, Environment, KVPair } from "./types";

/** Replace {{VAR}} placeholders with environment values */
function applyEnv(str: string, vars: KVPair[]): string {
  return str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const pair = vars.find((v) => v.enabled && v.key === key.trim());
    return pair ? pair.value : `{{${key}}}`;
  });
}

const isElectronCtx = () =>
  typeof window !== "undefined" && typeof (window as any).electronAPI !== "undefined";

export async function runRequest(
  req: OrbitRequest,
  env: Environment | null
): Promise<OrbitResponse> {
  const vars = env?.variables ?? [];

  /* ── Build URL + query params ───────────────────────────── */
  let url = applyEnv(req.url.trim(), vars);

  const enabledParams = req.params.filter((p) => p.enabled && p.key);
  if (enabledParams.length) {
    const qs = new URLSearchParams(
      enabledParams.map((p) => [applyEnv(p.key, vars), applyEnv(p.value, vars)])
    );
    url += (url.includes("?") ? "&" : "?") + qs.toString();
  }

  /* ── Build headers ──────────────────────────────────────── */
  const headers: Record<string, string> = {};

  for (const h of req.headers.filter((h) => h.enabled && h.key)) {
    headers[applyEnv(h.key, vars)] = applyEnv(h.value, vars);
  }

  /* ── Auth ───────────────────────────────────────────────── */
  const { auth } = req;
  if (auth.type === "bearer" && auth.bearer) {
    headers["Authorization"] = `Bearer ${applyEnv(auth.bearer, vars)}`;
  } else if (auth.type === "basic" && (auth.basicUser || auth.basicPass)) {
    headers["Authorization"] =
      "Basic " + btoa(`${applyEnv(auth.basicUser, vars)}:${applyEnv(auth.basicPass, vars)}`);
  } else if (auth.type === "apikey" && auth.apiKeyName) {
    if (auth.apiKeyIn === "header") {
      headers[applyEnv(auth.apiKeyName, vars)] = applyEnv(auth.apiKeyValue, vars);
    } else {
      url +=
        (url.includes("?") ? "&" : "?") +
        `${encodeURIComponent(applyEnv(auth.apiKeyName, vars))}=${encodeURIComponent(applyEnv(auth.apiKeyValue, vars))}`;
    }
  }

  /* ── Body ───────────────────────────────────────────────── */
  let body: string | undefined;
  const { type: bodyType, content } = req.body;

  if (bodyType === "json" && content) {
    headers["Content-Type"] = "application/json";
    body = applyEnv(content, vars);
  } else if (bodyType === "form-data" && content) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = applyEnv(content, vars);
  } else if (bodyType === "raw" && content) {
    headers["Content-Type"] = headers["Content-Type"] ?? "text/plain";
    body = applyEnv(content, vars);
  }

  const isNoBody = ["GET", "HEAD"].includes(req.method);

  /* ── Electron: direct fetch (no CORS) ──────────────────── */
  if (isElectronCtx()) {
    const start = performance.now();
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: isNoBody ? undefined : body,
    });
    const time = Math.round(performance.now() - start);
    const resBodyRaw = await res.text();
    const contentType = res.headers.get("content-type") ?? "";
    const resHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { resHeaders[k] = v; });

    return {
      status: res.status,
      statusText: res.statusText,
      time,
      size: new TextEncoder().encode(resBodyRaw).byteLength,
      headers: resHeaders,
      body: resBodyRaw,
      contentType,
    };
  }

  /* ── Browser: route through server proxy (no CORS) ──────── */
  const start = performance.now();
  const proxyRes = await fetch("/api/orbit/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      method: req.method,
      headers,
      body: isNoBody ? undefined : body,
    }),
  });
  const clientTime = Math.round(performance.now() - start);

  if (!proxyRes.ok) {
    const err = await proxyRes.json().catch(() => ({ error: `Proxy error ${proxyRes.status}` }));
    const msg = err.error ?? `Proxy error ${proxyRes.status}`;
    // Log so the user can read the real error in the browser console
    console.error("[Orbit] Proxy returned", proxyRes.status, "—", msg);
    throw new Error(msg);
  }

  const data = await proxyRes.json();
  return {
    status:     data.status      ?? 0,
    statusText: data.statusText  ?? "",
    time:       data.time        ?? clientTime,
    size:       data.size        ?? 0,
    headers:    data.headers     ?? {},
    body:       data.body        ?? "",
    contentType: (data.headers?.["content-type"] as string) ?? "",
  };
}
