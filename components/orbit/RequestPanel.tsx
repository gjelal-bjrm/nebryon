"use client";

import { useState } from "react";
import { Send, Save, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import KVEditor from "./KVEditor";
import type { OrbitRequest, ReqTab, Method } from "@/lib/orbit/types";

const CodeEditor = dynamic(() => import("./CodeEditor"), { ssr: false });

const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const METHOD_COLORS: Record<Method, string> = {
  GET: "#22c55e", POST: "#6C63FF", PUT: "#D4A84B",
  PATCH: "#E8820C", DELETE: "#CF2328", HEAD: "#4A5070", OPTIONS: "#4A5070",
};

const TABS: { id: ReqTab; label: string }[] = [
  { id: "params",  label: "Params"    },
  { id: "headers", label: "En-têtes"  },
  { id: "body",    label: "Corps"     },
  { id: "auth",    label: "Auth"      },
];

interface Props {
  req: OrbitRequest;
  onChange: (req: OrbitRequest) => void;
  onSend: () => void;
  onSave: () => void;
  sending: boolean;
}

export default function RequestPanel({ req, onChange, onSend, onSave, sending }: Props) {
  const [tab, setTab] = useState<ReqTab>("params");
  const [methodOpen, setMethodOpen] = useState(false);

  const set = <K extends keyof OrbitRequest>(k: K, v: OrbitRequest[K]) => onChange({ ...req, [k]: v });

  const tabBadge = (t: ReqTab) => {
    if (t === "params")  return req.params.filter(p => p.enabled && p.key).length || null;
    if (t === "headers") return req.headers.filter(h => h.enabled && h.key).length || null;
    if (t === "body")    return req.body.type !== "none" ? "•" : null;
    if (t === "auth")    return req.auth.type !== "none" ? "•" : null;
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* URL bar */}
      <div className="flex gap-2 p-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--stroke)" }}>
        {/* Method */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMethodOpen(o => !o)}
            className="flex items-center gap-1.5 rounded-lg px-3 h-9 text-xs font-bold transition hover:opacity-85"
            style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.03)", color: METHOD_COLORS[req.method] }}
          >
            {req.method} <ChevronDown size={12} />
          </button>
          {methodOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden shadow-lg"
              style={{ border: "1px solid var(--stroke)", background: "var(--nav-bg)", minWidth: "120px" }}>
              {METHODS.map(m => (
                <button key={m} onClick={() => { set("method", m); setMethodOpen(false); }}
                  className="flex items-center w-full px-3 py-2 text-xs font-bold transition hover:opacity-80"
                  style={{ color: METHOD_COLORS[m], background: m === req.method ? "rgba(108,99,255,.1)" : "transparent" }}>
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* URL input */}
        <input
          value={req.url}
          onChange={(e) => set("url", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 rounded-lg px-3 h-9 text-sm focus:outline-none transition"
          style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,.03)", color: "var(--text)" }}
        />

        {/* Buttons */}
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 rounded-lg px-3 h-9 text-xs transition hover:opacity-80"
          style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}
          title="Sauvegarder dans une collection"
        >
          <Save size={14} />
        </button>
        <button
          onClick={onSend}
          disabled={sending || !req.url.trim()}
          className="flex items-center gap-1.5 rounded-lg px-4 h-9 text-xs font-semibold transition hover:opacity-85 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,var(--nebula),var(--indigo))", color: "#fff" }}
        >
          <Send size={13} /> {sending ? "Envoi…" : "Envoyer"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 flex-shrink-0 px-3 pt-2" style={{ borderBottom: "1px solid var(--stroke)" }}>
        {TABS.map(t => {
          const badge = tabBadge(t.id);
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1 px-3 pb-2 text-xs transition-all"
              style={{
                color: active ? "var(--nebula)" : "var(--muted)",
                borderBottom: active ? "2px solid var(--nebula)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {t.label}
              {badge !== null && (
                <span className="rounded-full px-1 text-[9px]"
                  style={{ background: "rgba(108,99,255,.2)", color: "var(--nebula)" }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "params" && (
          <KVEditor pairs={req.params} onChange={(p) => set("params", p)} keyPlaceholder="Paramètre" />
        )}

        {tab === "headers" && (
          <KVEditor pairs={req.headers} onChange={(h) => set("headers", h)} keyPlaceholder="En-tête" />
        )}

        {tab === "body" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              {(["none", "json", "form-data", "raw"] as const).map(t => (
                <button key={t} onClick={() => set("body", { ...req.body, type: t })}
                  className="rounded-full px-3 py-1 text-xs transition"
                  style={req.body.type === t
                    ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.12)", color: "var(--halo)" }
                    : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                  {t === "none" ? "Aucun" : t === "form-data" ? "Form Data" : t === "raw" ? "Texte brut" : "JSON"}
                </button>
              ))}
            </div>
            {req.body.type !== "none" && (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--stroke)" }}>
                <CodeEditor
                  value={req.body.content}
                  onChange={(v) => set("body", { ...req.body, content: v })}
                  lang={req.body.type === "json" ? "json" : "text"}
                  minHeight="160px"
                />
              </div>
            )}
          </div>
        )}

        {tab === "auth" && <AuthTab auth={req.auth} onChange={(a) => set("auth", a)} />}
      </div>
    </div>
  );
}

/* ── Auth tab ────────────────────────────────────────────── */
function AuthTab({ auth, onChange }: { auth: OrbitRequest["auth"]; onChange: (a: OrbitRequest["auth"]) => void }) {
  const set = <K extends keyof typeof auth>(k: K, v: (typeof auth)[K]) => onChange({ ...auth, [k]: v });

  const inputCls = "w-full rounded-lg px-3 py-2 text-xs focus:outline-none";
  const inputStyle = { border: "1px solid var(--stroke)", background: "rgba(255,255,255,.03)", color: "var(--text)" };
  const label = "text-[11px] mb-1 block";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["none", "bearer", "basic", "apikey"] as const).map(t => (
          <button key={t} onClick={() => set("type", t)}
            className="rounded-full px-3 py-1 text-xs transition capitalize"
            style={auth.type === t
              ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.12)", color: "var(--halo)" }
              : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
            {t === "none" ? "Aucune" : t === "bearer" ? "Bearer Token" : t === "basic" ? "Basic Auth" : "API Key"}
          </button>
        ))}
      </div>

      {auth.type === "bearer" && (
        <div>
          <label className={label} style={{ color: "var(--muted)" }}>Token</label>
          <input value={auth.bearer} onChange={(e) => set("bearer", e.target.value)}
            placeholder="eyJhbGci..." className={inputCls} style={inputStyle} />
        </div>
      )}

      {auth.type === "basic" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} style={{ color: "var(--muted)" }}>Utilisateur</label>
            <input value={auth.basicUser} onChange={(e) => set("basicUser", e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={label} style={{ color: "var(--muted)" }}>Mot de passe</label>
            <input type="password" value={auth.basicPass} onChange={(e) => set("basicPass", e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
        </div>
      )}

      {auth.type === "apikey" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} style={{ color: "var(--muted)" }}>Nom de la clé</label>
              <input value={auth.apiKeyName} onChange={(e) => set("apiKeyName", e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={label} style={{ color: "var(--muted)" }}>Valeur</label>
              <input value={auth.apiKeyValue} onChange={(e) => set("apiKeyValue", e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-2">
            {(["header", "query"] as const).map(loc => (
              <button key={loc} onClick={() => set("apiKeyIn", loc)}
                className="rounded-full px-3 py-1 text-xs transition capitalize"
                style={auth.apiKeyIn === loc
                  ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.12)", color: "var(--halo)" }
                  : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                {loc === "header" ? "En-tête" : "Query Param"}
              </button>
            ))}
          </div>
        </div>
      )}

      {auth.type === "none" && (
        <p className="text-xs" style={{ color: "var(--muted)" }}>Aucune authentification pour cette requête.</p>
      )}
    </div>
  );
}
