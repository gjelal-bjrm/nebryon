"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import dynamic from "next/dynamic";
import type { OrbitResponse, ResTab } from "@/lib/orbit/types";

const CodeEditor = dynamic(() => import("./CodeEditor"), { ssr: false });

const STATUS_COLOR = (s: number) =>
  s >= 500 ? "#CF2328" : s >= 400 ? "#E8820C" : s >= 300 ? "#D4A84B" : s >= 200 ? "#22c55e" : "var(--muted)";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function prettyBody(body: string, contentType: string): string {
  if (contentType.includes("json")) {
    try { return JSON.stringify(JSON.parse(body), null, 2); } catch { /* keep raw */ }
  }
  return body;
}

interface Props {
  response: OrbitResponse | null;
  loading: boolean;
  error: string | null;
}

export default function ResponsePanel({ response, loading, error }: Props) {
  const [tab,    setTab]    = useState<ResTab>("body");
  const [copied, setCopied] = useState(false);

  const copyBody = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--nebula)", borderTopColor: "transparent" }}
        />
        <p className="text-xs" style={{ color: "var(--muted)" }}>Sending…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
        <p className="text-xs font-semibold" style={{ color: "#CF2328" }}>Request failed</p>
        <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>Ready to send</p>
        <p className="text-xs" style={{ color: "var(--muted)", opacity: 0.6 }}>
          Configure your request and click Send
        </p>
      </div>
    );
  }

  const bodyContent = prettyBody(response.body, response.contentType);
  const isJson      = response.contentType.includes("json");

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div
        className="flex items-center gap-4 px-3 py-2 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--stroke)" }}
      >
        <span className="text-xs font-bold" style={{ color: STATUS_COLOR(response.status) }}>
          {response.status} {response.statusText}
        </span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>{response.time} ms</span>
        <span className="text-xs" style={{ color: "var(--muted)" }}>{formatSize(response.size)}</span>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-3"
        style={{ borderBottom: "1px solid var(--stroke)" }}
      >
        <div className="flex gap-0">
          {(["body", "headers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 pb-2 pt-2 text-xs transition-all capitalize"
              style={{
                color: tab === t ? "var(--nebula)" : "var(--muted)",
                borderBottom: tab === t ? "2px solid var(--nebula)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {t === "body" ? "Body" : "Headers"}
              {t === "headers" && (
                <span
                  className="ml-1 rounded-full px-1 text-[9px]"
                  style={{ background: "rgba(108,99,255,.2)", color: "var(--nebula)" }}
                >
                  {Object.keys(response.headers).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Copy response body button */}
        {tab === "body" && bodyContent && (
          <button
            onClick={() => copyBody(bodyContent)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] transition hover:opacity-80 mb-1"
            style={{ border: "1px solid var(--stroke)", color: copied ? "var(--nebula)" : "var(--muted)" }}
            title="Copy response body"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "body" && (
          <div className="h-full overflow-hidden">
            <CodeEditor
              value={bodyContent}
              readOnly
              lang={isJson ? "json" : "text"}
              minHeight="100%"
            />
          </div>
        )}

        {tab === "headers" && (
          <div className="overflow-y-auto h-full p-3">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: "var(--muted)" }}>
                  <th className="text-left pb-2 font-medium w-1/2">Key</th>
                  <th className="text-left pb-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers).map(([k, v]) => (
                  <tr key={k} style={{ borderTop: "1px solid var(--stroke)" }}>
                    <td className="py-1.5 pr-3 font-mono" style={{ color: "var(--nebula)" }}>{k}</td>
                    <td className="py-1.5 font-mono break-all" style={{ color: "var(--text)" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
