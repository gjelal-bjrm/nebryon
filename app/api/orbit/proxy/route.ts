import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import http from "node:http";
import { SSL_OP_LEGACY_SERVER_CONNECT } from "node:constants";

/**
 * Server-side HTTP/HTTPS proxy for Orbit.
 *
 * Key TLS flags that fix connectivity to old/corporate servers:
 *   rejectUnauthorized: false        — ignore cert errors (expired, self-signed)
 *   SSL_OP_LEGACY_SERVER_CONNECT     — allow servers that don't support RFC 5746
 *                                      safe-renegotiation (most old ASP.NET/.aspx)
 *   ALPNProtocols: ["http/1.1"]      — force HTTP/1.1, skip HTTP/2 negotiation
 *
 * All three are safe for a local dev-tool proxy (same as Postman/Insomnia).
 */
export const runtime = "nodejs";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  secureOptions: SSL_OP_LEGACY_SERVER_CONNECT,
  ALPNProtocols: ["http/1.1"],
  keepAlive: false,
});

const httpAgent = new http.Agent({ keepAlive: false });

/* ── Core helper ─────────────────────────────────────────── */
interface ProxyResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

function proxyRequest(
  parsed: URL,
  method: string,
  reqHeaders: Record<string, string>,
  bodyBuf?: Buffer
): Promise<ProxyResult> {
  return new Promise((resolve, reject) => {
    const isHttps = parsed.protocol === "https:";
    const port    = parsed.port ? parseInt(parsed.port, 10) : (isHttps ? 443 : 80);

    const headers: Record<string, string> = {
      "user-agent":      reqHeaders["user-agent"]      ?? "Orbit/1.0",
      "accept":          reqHeaders["accept"]          ?? "*/*",
      "accept-encoding": reqHeaders["accept-encoding"] ?? "identity",
      ...reqHeaders,
    };

    // ASP.NET / legacy HTTP/1.1 servers require explicit Content-Length.
    // Without it Node uses chunked encoding which many old servers reject.
    if (bodyBuf) {
      headers["content-length"] = String(bodyBuf.byteLength);
    }

    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port,
      path:     parsed.pathname + parsed.search,
      method:   method.toUpperCase(),
      headers,
      agent:    isHttps ? httpsAgent : (httpAgent as any),
    };

    const start  = Date.now();
    const client = isHttps ? https : http;

    const req = (client as typeof https).request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data",  (c: Buffer) => chunks.push(c));
      res.on("error", reject);
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        const resHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          if (v !== undefined) resHeaders[k] = Array.isArray(v) ? v.join(", ") : v;
        }
        resolve({
          status:     res.statusCode    ?? 0,
          statusText: res.statusMessage ?? "",
          headers:    resHeaders,
          body:       buf.toString("utf8"),
          time:       Date.now() - start,
          size:       buf.byteLength,
        });
      });
    });

    req.on("error", reject);
    req.setTimeout(30_000, () => {
      req.destroy(new Error("ETIMEDOUT"));
    });

    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

/* ── Route handler ───────────────────────────────────────── */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, method = "GET", headers = {}, body } = payload;
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 });
  }

  // Strip hop-by-hop headers — Node sets these itself
  const cleanHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (!["host", "content-length", "transfer-encoding", "connection"].includes(k.toLowerCase())) {
      cleanHeaders[k] = v;
    }
  }

  const bodyBuf =
    body && !["GET", "HEAD"].includes(method.toUpperCase())
      ? Buffer.from(body, "utf8")
      : undefined;

  console.log(`[Orbit Proxy] → ${method.toUpperCase()} ${url}`);

  try {
    const result = await proxyRequest(parsed, method, cleanHeaders, bodyBuf);
    console.log(`[Orbit Proxy] ← ${result.status} (${result.time} ms)`);
    return NextResponse.json(result);
  } catch (e: any) {
    const code = (e as NodeJS.ErrnoException).code ?? "";
    const raw  = e?.message ?? "Unknown error";

    const friendly =
      code === "ECONNREFUSED"  ? `Connection refused — server unreachable at ${parsed.host}` :
      code === "ENOTFOUND"     ? `DNS lookup failed: host "${parsed.hostname}" not found` :
      code === "ECONNRESET"    ? `Connection reset — server rejected the TLS handshake. Try switching to HTTP if the server doesn't support HTTPS.` :
      code === "EPROTO"        ? `TLS protocol error: ${raw}` :
      raw.includes("ETIMEDOUT") ? "Request timed out after 30 s" :
      raw;

    console.error(`[Orbit Proxy] ✗ ${code || "ERR"}: ${raw}`);
    return NextResponse.json({ error: friendly }, { status: 502 });
  }
}
