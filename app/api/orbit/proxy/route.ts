import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import http from "node:http";

/**
 * Server-side proxy for Orbit.
 * Uses Node.js http/https modules so we can:
 *   – bypass CORS (runs server-side)
 *   – bypass SSL certificate errors (rejectUnauthorized: false)
 *     which is acceptable for a local dev-tool proxy
 */
export const runtime = "nodejs";

// One global agent per protocol — rejectUnauthorized:false lets us reach
// self-signed or expired-cert servers just like Postman / Insomnia do.
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const httpAgent  = new http.Agent();

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

    const isHttps  = parsed.protocol === "https:";
    const agent    = isHttps ? httpsAgent : httpAgent;
    const port     = parsed.port ? parseInt(parsed.port) : (isHttps ? 443 : 80);
    const path     = parsed.pathname + parsed.search;

    // Remove host/content-length — Node will set them correctly
    const cleanHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (!["host", "content-length"].includes(k.toLowerCase())) {
        cleanHeaders[k] = v;
      }
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

    const proxyReq = client.request(options, (upstream) => {
      const chunks: Buffer[] = [];

      upstream.on("data", (chunk: Buffer) => chunks.push(chunk));
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
            status:     upstream.statusCode  ?? 0,
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
      const msg =
        e.code === "ECONNREFUSED"  ? `Connection refused — is the server running? (${url})` :
        e.code === "ENOTFOUND"     ? `Host not found: ${parsed.hostname}` :
        e.code === "ECONNRESET"    ? `Connection reset by remote server` :
        e.code === "ETIMEDOUT"     ? `Request timed out` :
        e.message;

      resolve(NextResponse.json({ error: msg }, { status: 502 }));
    });

    proxyReq.setTimeout(30_000, () => {
      proxyReq.destroy();
      resolve(NextResponse.json({ error: "Request timed out after 30s" }, { status: 504 }));
    });

    if (body && !["GET", "HEAD"].includes(method.toUpperCase())) {
      proxyReq.write(body);
    }

    proxyReq.end();
  });
}
