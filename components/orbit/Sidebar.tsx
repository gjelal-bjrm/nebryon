"use client";

import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Folder, FileText, ChevronRight, Trash2, Settings2, Upload } from "lucide-react";
import { db } from "@/lib/orbit/db";
import { parsePostmanCollection } from "@/lib/orbit/postman";
import type { SavedRequest, Environment } from "@/lib/orbit/types";

interface Props {
  onLoadRequest: (req: SavedRequest) => void;
  activeEnvId: string | null;
  onEnvChange: (id: string | null) => void;
  onOpenEnvEditor: () => void;
}

export default function Sidebar({ onLoadRequest, activeEnvId, onEnvChange, onOpenEnvEditor }: Props) {
  const [openCols, setOpenCols] = useState<Set<string>>(new Set());
  const [newColName, setNewColName] = useState("");
  const [addingCol, setAddingCol] = useState(false);
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const collections = useLiveQuery(() => db.collections.orderBy("createdAt").toArray(), []);
  const environments = useLiveQuery(() => db.environments.orderBy("createdAt").toArray(), []);

  const toggleCol = (id: string) =>
    setOpenCols((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const createCollection = async () => {
    const name = newColName.trim();
    if (!name) return;
    await db.collections.add({ id: crypto.randomUUID(), name, createdAt: Date.now() });
    setNewColName(""); setAddingCol(false);
  };

  const deleteCollection = async (id: string) => {
    await db.requests.where("collectionId").equals(id).delete();
    await db.collections.delete(id);
  };

  const deleteRequest = (id: string) => db.requests.delete(id);

  const handleImport = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setImporting(true);
    try {
      const text = await files[0].text();
      const json = JSON.parse(text);
      const now = Date.now();
      const newIds: string[] = [];

      if (json?.version === 2 && Array.isArray(json.collections)) {
        // ── Orbit backup format ──────────────────────────────
        for (let i = 0; i < json.collections.length; i++) {
          const col = json.collections[i];
          const colId = crypto.randomUUID();
          await db.collections.add({ ...col, id: colId, createdAt: now + i });
          const reqs = (json.requests as SavedRequest[]).filter((r) => r.collectionId === col.id);
          await db.requests.bulkAdd(reqs.map((r) => ({ ...r, id: crypto.randomUUID(), collectionId: colId })));
          newIds.push(colId);
        }
      } else {
        // ── Postman format ───────────────────────────────────
        const groups = parsePostmanCollection(text);
        for (let i = 0; i < groups.length; i++) {
          const { collectionName, requests } = groups[i];
          const colId = crypto.randomUUID();
          await db.collections.add({ id: colId, name: collectionName, createdAt: now + i });
          await db.requests.bulkAdd(requests.map((r) => ({ ...r, id: crypto.randomUUID(), collectionId: colId })));
          newIds.push(colId);
        }
      }

      setOpenCols((s) => { const n = new Set(s); newIds.forEach((id) => n.add(id)); return n; });
    } catch (e) {
      console.error("Import failed", e);
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = "";
    }
  };

  const sectionTitle = "text-[10px] font-semibold tracking-widest uppercase mb-2 px-1";

  return (
    <aside className="flex flex-col h-full overflow-hidden" style={{ borderRight: "1px solid var(--stroke)" }}>
      {/* Collections */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={sectionTitle} style={{ color: "var(--muted)" }}>Collections</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => importRef.current?.click()}
              className="transition hover:opacity-80"
              style={{ color: "var(--muted)" }}
              title={importing ? "Import en cours…" : "Importer une collection"}
            >
              <Upload size={13} />
            </button>
            <button onClick={() => setAddingCol(true)} className="transition hover:opacity-80" style={{ color: "var(--nebula)" }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={(e) => handleImport(e.target.files)} />

        {addingCol && (
          <form onSubmit={(e) => { e.preventDefault(); createCollection(); }} className="mb-2 flex gap-1">
            <input
              autoFocus value={newColName} onChange={(e) => setNewColName(e.target.value)}
              placeholder="Nom…"
              className="flex-1 rounded-lg px-2 py-1 text-xs focus:outline-none"
              style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)", color: "var(--text)" }}
              onKeyDown={(e) => e.key === "Escape" && setAddingCol(false)}
            />
            <button type="submit" className="text-xs px-2 rounded-lg" style={{ background: "var(--nebula)", color: "#fff" }}>OK</button>
          </form>
        )}

        {collections?.map((col) => (
          <CollectionRow
            key={col.id} col={col}
            open={openCols.has(col.id)}
            onToggle={() => toggleCol(col.id)}
            onDelete={() => deleteCollection(col.id)}
            onLoadRequest={onLoadRequest}
            onDeleteRequest={deleteRequest}
          />
        ))}

        {collections?.length === 0 && !addingCol && (
          <p className="text-[11px] px-1 mt-2" style={{ color: "var(--muted)" }}>
            Crée une collection pour sauvegarder tes requêtes.
          </p>
        )}
      </div>

      {/* Environments */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid var(--stroke)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className={sectionTitle} style={{ color: "var(--muted)" }}>Environnement</span>
          <button onClick={onOpenEnvEditor} className="transition hover:opacity-80" style={{ color: "var(--muted)" }}>
            <Settings2 size={13} />
          </button>
        </div>
        <select
          value={activeEnvId ?? ""}
          onChange={(e) => onEnvChange(e.target.value || null)}
          className="w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          style={{ border: "1px solid var(--stroke)", background: "var(--card-bg)", color: "var(--text)" }}
        >
          <option value="">Aucun</option>
          {environments?.map((env) => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>
      </div>
    </aside>
  );
}

/* ── Collection row ────────────────────────────────────── */
function CollectionRow({ col, open, onToggle, onDelete, onLoadRequest, onDeleteRequest }: {
  col: { id: string; name: string };
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onLoadRequest: (r: SavedRequest) => void;
  onDeleteRequest: (id: string) => void;
}) {
  const requests = useLiveQuery<SavedRequest[]>(
    () => open ? db.requests.where("collectionId").equals(col.id).sortBy("createdAt") : Promise.resolve([] as SavedRequest[]),
    [col.id, open]
  );

  return (
    <div className="mb-1">
      <div
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer group transition"
        style={{ color: "var(--text)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(108,99,255,.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <ChevronRight size={12} className="flex-shrink-0 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none", color: "var(--muted)" }} onClick={onToggle} />
        <Folder size={13} style={{ color: "var(--nebula)", flexShrink: 0 }} onClick={onToggle} />
        <span className="flex-1 text-xs truncate" onClick={onToggle}>{col.name}</span>
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition" style={{ color: "var(--muted)" }}>
          <Trash2 size={11} />
        </button>
      </div>

      {open && requests?.map((req) => (
        <div
          key={req.id}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 ml-4 cursor-pointer group transition"
          onClick={() => onLoadRequest(req)}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(108,99,255,.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <FileText size={11} className="flex-shrink-0" style={{ color: "var(--muted)" }} />
          <MethodBadge method={req.method} />
          <span className="flex-1 text-[11px] truncate" style={{ color: "var(--muted)" }}>{req.name}</span>
          <button onClick={(e) => { e.stopPropagation(); onDeleteRequest(req.id); }}
            className="opacity-0 group-hover:opacity-100 transition" style={{ color: "var(--muted)" }}>
            <Trash2 size={10} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "#22c55e", POST: "#6C63FF", PUT: "#D4A84B",
    PATCH: "#E8820C", DELETE: "#CF2328", HEAD: "#4A5070", OPTIONS: "#4A5070",
  };
  return (
    <span className="text-[9px] font-bold flex-shrink-0" style={{ color: colors[method] ?? "var(--muted)", minWidth: "34px" }}>
      {method}
    </span>
  );
}
