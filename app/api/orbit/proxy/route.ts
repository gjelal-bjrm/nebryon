import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy for Orbit HTTP requests.
 * Runs on Node.js (no CORS restrictions) so the browser can call any API
 * without hitting cross-origin errors.
 */
export const runtime = "nodejs";

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

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const start = Date.now();

  try {
    const init: RequestInit = {
      method,
      headers,
      redirect: "follow",
    };

    if (!["GET", "HEAD"].includes(method.toUpperCase())) {
      // @ts-ignore – Node 18+ accepts string body in fetch
      init.body = body ?? undefined;
    }

    const upstream = await fetch(url, init);
    const time = Date.now() - start;
    const resBody = await upstream.text();

    const resHeaders: Record<string, string> = {};
    upstream.headers.forEach((v, k) => { resHeaders[k] = v; });

    return NextResponse.json({
      status:     upstream.status,
      statusText: upstream.statusText,
      headers:    resHeaders,
      body:       resBody,
      time,
      size:       Buffer.byteLength(resBody, "utf8"),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Upstream fetch failed" },
      { status: 502 }
    );
  }
}
