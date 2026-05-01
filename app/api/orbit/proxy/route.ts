import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import http from "node:http";

/**
 * Server-side HTTP/HTTPS proxy for Orbit.
 * – No CORS (Node.js)
 * – rejectUnauthorized: false   → ignores self-signed / expired certs
 * – minVersion TLSv1            → accepts TLS 1.0/1.1 legacy servers
 * – Explicit Content-Length     → compatible with ASP.NET/.aspx endpoints
 */
export const runtime = "nodejs";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  minVersion: "TLSv1" as any,
});

const httpAgent = new http.Agent({ keepAlive: false });

/* ── Core request helper ─────────────────────────────────── */
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
      // Default User-Agent — some servers (esp. .aspx) reject headless requests
      "user-agent": "Orbit/1.0 (HTTP client)",
      ...reqHeaders,
    };

    // Always set explicit Content-Length — many ASP.NET / legacy servers
    // reject chunked transfer-encoding (which Node uses by default with write())
    if (bodyBuf) {
      headers["content-length"] = String(bodyBuf.byteLength);
    }

    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port,
      path:     parsed.pathname + parsed.search,
      method:   method.toUpperCase(),
      headers,
      agent: isHttps ? httpsAgent : (httpAgent as any),
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
          status:     res.statusCode   ?? 0,
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
      req.destroy(new Error("ETIMEDOUT: Request timed out after 30 s"));
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

  // Strip hop-by-hop headers that Node manages itself
  const cleanHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const lk = k.toLowerCase();
    if (!["host", "content-length", "transfer-encoding", "connection"].includes(lk)) {
      cleanHeaders[k] = v;
    }
  }

  const bodyBuf =
    body && !["GET", "HEAD"].includes(method.toUpperCase())
      ? Buffer.from(body, "utf8")
      : undefined;

  // Log on the server side so the terminal shows the real error
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
      code === "ECONNRESET"    ? "Connection reset by remote server" :
      code === "EPROTO"        ? `TLS/SSL handshake failed: ${raw}` :
      code === "CERT_HAS_EXPIRED" ? "Server certificate has expired" :
      raw.includes("ETIMEDOUT")   ? "Request timed out after 30 s" :
      raw;

    console.error(`[Orbit Proxy] ✗ ${code || "ERR"} — ${raw}`);
    return NextResponse.json({ error: friendly }, { status: 502 });
  }
}
