"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2, X } from "lucide-react";
import { db } from "@/lib/orbit/db";
import KVEditor from "./KVEditor";
import type { Environment, KVPair } from "@/lib/orbit/types";

function newKV(): KVPair {
  return { id: crypto.randomUUID(), key: "", value: "", enabled: true };
}

interface Props {
  onClose: () => void;
}

export default function EnvEditor({ onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const environments = useLiveQuery(() => db.environments.orderBy("createdAt").toArray(), []);
  const env = environments?.find((e) => e.id === selected) ?? null;

  const createEnv = async () => {
    const name = newName.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    await db.environments.add({
      id, name, isActive: false, variables: [newKV()], createdAt: Date.now(),
    });
    setNewName(""); setAdding(false); setSelected(id);
  };

  const deleteEnv = async (id: string) => {
    await db.environments.delete(id);
    if (selected === id) setSelected(null);
  };

  const updateVars = async (vars: KVPair[]) => {
    if (!env) return;
    await db.environments.update(env.id, { variables: vars });
  };

  const inputCls = "flex-1 rounded-lg px-2 py-1 text-xs focus:outline-none";
  const inputStyle = { border: "1px solid var(--stroke)", background: "rgba(255,255,255,.03)", color: "var(--text)" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--nav-bg)", border: "1px solid var(--stroke)", maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--stroke)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Environnements</h2>
          <button onClick={onClose} className="transition hover:opacity-70" style={{ color: "var(--muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* List */}
          <div className="w-48 flex-shrink-0 flex flex-col overflow-hidden"
            style={{ borderRight: "1px solid var(--stroke)" }}>
            <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--stroke)" }}>
              <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
                Liste
              </span>
              <button onClick={() => setAdding(true)} className="transition hover:opacity-80" style={{ color: "var(--nebula)" }}>
                <Plus size={13} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {adding && (
                <form onSubmit={(e) => { e.preventDefault(); createEnv(); }} className="mb-1 flex gap-1">
                  <input
                    autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nom…"
                    className="flex-1 rounded px-2 py-1 text-xs focus:outline-none"
                    style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)", color: "var(--text)" }}
                    onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
                  />
                  <button type="submit" className="text-xs px-2 rounded" style={{ background: "var(--nebula)", color: "#fff" }}>OK</button>
                </form>
              )}

              {environments?.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer group transition"
                  style={{
                    background: selected === e.id ? "rgba(108,99,255,.12)" : "transparent",
                    color: selected === e.id ? "var(--halo)" : "var(--text)",
                  }}
                  onClick={() => setSelected(e.id)}
                >
                  <span className="flex-1 text-xs truncate">{e.name}</span>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); deleteEnv(e.id); }}
                    className="opacity-0 group-hover:opacity-100 transition"
                    style={{ color: "var(--muted)" }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}

              {environments?.length === 0 && !adding && (
                <p className="text-[11px] px-1 mt-1" style={{ color: "var(--muted)" }}>Aucun environnement.</p>
              )}
            </div>
          </div>

          {/* Variables editor */}
          <div className="flex-1 overflow-y-auto p-4">
            {env ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
                  Variables — <span style={{ color: "var(--nebula)" }}>{env.name}</span>
                </p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  Utilise <code className="text-[10px] rounded px-1" style={{ background: "rgba(108,99,255,.15)", color: "var(--nebula)" }}>{"{{NOM}}"}</code> dans tes URLs, headers, body ou auth.
                </p>
                <KVEditor
                  pairs={env.variables}
                  onChange={updateVars}
                  keyPlaceholder="Variable"
                  valuePlaceholder="Valeur"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Sélectionne un environnement pour modifier ses variables.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
