import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import http from "node:http";

/**
 * Server-side HTTP proxy for Orbit.
 * – No CORS restrictions (Node.js)
 * – rejectUnauthorized: false  → accepts self-signed / expired certs
 * – minVersion: 'TLSv1'        → supports legacy TLS 1.0/1.1 servers
 * – secureOptions               → enables old cipher suites
 * – Explicit Content-Length    → compatible with servers that reject
 *                                 chunked transfer encoding (e.g. ASP.NET)
 */
export const runtime = "nodejs";

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  // Allow old TLS versions that some corporate/legacy servers still use
  minVersion: "TLSv1" as any,
  // Keep legacy cipher suites available
  ciphers: [
    "TLS_AES_128_GCM_SHA256",
    "TLS_AES_256_GCM_SHA384",
    "ECDHE-RSA-AES128-GCM-SHA256",
    "ECDHE-RSA-AES256-GCM-SHA384",
    "ECDHE-RSA-AES128-SHA256",
    "ECDHE-RSA-AES256-SHA384",
    "ECDHE-RSA-AES128-SHA",
    "ECDHE-RSA-AES256-SHA",
    "AES128-GCM-SHA256",
    "AES256-GCM-SHA384",
    "AES128-SHA256",
    "AES256-SHA256",
    "AES128-SHA",
    "AES256-SHA",
    "DES-CBC3-SHA",
  ].join(":"),
});

const httpAgent = new http.Agent();

export async function POST(req: NextRequest) {
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

  const start = Date.now();

  return new Promise<NextResponse>((resolve) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      resolve(NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 }));
      return;
    }

    const isHttps = parsed.protocol === "https:";
    const agent   = isHttps ? httpsAgent : httpAgent;
    const port    = parsed.port ? parseInt(parsed.port) : (isHttps ? 443 : 80);
    const path    = parsed.pathname + parsed.search;

    // Build clean headers — Node sets Host + Content-Length itself
    const cleanHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (!["host", "content-length", "transfer-encoding"].includes(k.toLowerCase())) {
        cleanHeaders[k] = v;
      }
    }

    // Always send a User-Agent so servers don't reject the request
    if (!cleanHeaders["user-agent"] && !cleanHeaders["User-Agent"]) {
      cleanHeaders["user-agent"] = "Orbit/1.0 (HTTP client)";
    }

    // Set explicit Content-Length for POST/PUT/PATCH — many old servers
    // (including ASP.NET .aspx endpoints) reject chunked transfer encoding
    const bodyBuf = (body && !["GET", "HEAD"].includes(method.toUpperCase()))
      ? Buffer.from(body, "utf8")
      : null;

    if (bodyBuf) {
      cleanHeaders["content-length"] = String(bodyBuf.byteLength);
    }

    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port,
      path,
      method: method.toUpperCase(),
      headers: cleanHeaders,
      agent,
    };

    const client = isHttps ? https : http;

    const proxyReq = (client as typeof https).request(options, (upstream) => {
      const chunks: Buffer[] = [];

      upstream.on("data",  (chunk: Buffer) => chunks.push(chunk));
      upstream.on("error", (e) => {
        resolve(NextResponse.json({ error: `Stream error: ${e.message}` }, { status: 502 }));
      });
      upstream.on("end", () => {
        const rawBody  = Buffer.concat(chunks);
        const bodyText = rawBody.toString("utf8");
        const time     = Date.now() - start;

        const resHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(upstream.headers)) {
          if (v !== undefined) resHeaders[k] = Array.isArray(v) ? v.join(", ") : v;
        }

        resolve(
          NextResponse.json({
            status:     upstream.statusCode   ?? 0,
            statusText: upstream.statusMessage ?? "",
            headers:    resHeaders,
            body:       bodyText,
            time,
            size:       rawBody.byteLength,
          })
        );
      });
    });

    proxyReq.on("error", (e: NodeJS.ErrnoException) => {
      const code = e.code ?? "UNKNOWN";
      const msg =
        code === "ECONNREFUSED"  ? `Connection refused — server not reachable at ${parsed.host}` :
        code === "ENOTFOUND"     ? `DNS lookup failed: host "${parsed.hostname}" not found` :
        code === "ECONNRESET"    ? `Connection reset by remote server` :
        code === "ETIMEDOUT"     ? `Connection timed out` :
        code === "EPROTO"        ? `TLS/SSL protocol error (${e.message})` :
        code === "DEPTH_ZERO_SELF_SIGNED_CERT" ? `Self-signed certificate rejected` :
        `${code}: ${e.message}`;

      resolve(NextResponse.json({ error: msg }, { status: 502 }));
    });

    proxyReq.setTimeout(30_000, () => {
      proxyReq.destroy();
      resolve(NextResponse.json({ error: "Request timed out after 30 s" }, { status: 504 }));
    });

    if (bodyBuf) {
      proxyReq.write(bodyBuf);
    }

    proxyReq.end();
  });
}
