/**
 * Lumen — PDF Generation API Route
 * Receives rendered HTML, returns a PDF buffer via Puppeteer.
 * A single Browser instance is reused across requests for performance.
 */

import { NextRequest, NextResponse } from "next/server";
import type { Browser } from "puppeteer";

export const runtime    = "nodejs";
export const maxDuration = 60;

// ── Singleton browser ────────────────────────────────────────────────────────
let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser?.connected) return _browser;
  const puppeteer = (await import("puppeteer")).default;
  _browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  _browser.on("disconnected", () => { _browser = null; });
  return _browser;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const {
      html,
      format      = "A4",
      landscape   = false,
      marginTop    = "15mm",
      marginRight  = "15mm",
      marginBottom = "15mm",
      marginLeft   = "15mm",
    } = await req.json() as {
      html:          string;
      format?:       string;
      landscape?:    boolean;
      marginTop?:    string;
      marginRight?:  string;
      marginBottom?: string;
      marginLeft?:   string;
    };

    const browser = await getBrowser();
    const page    = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format:          format as "A4" | "Letter" | "Legal",
      landscape,
      printBackground: true,
      margin: {
        top:    marginTop,
        right:  marginRight,
        bottom: marginBottom,
        left:   marginLeft,
      },
    });

    await page.close();

    return new NextResponse(pdf as unknown as BodyInit, {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (err) {
    console.error("[lumen/generate]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
