"use client";

import { useState, useRef, useCallback, useLayoutEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Plus, Folder as FolderIcon, FileText, ChevronRight,
  Trash2, Settings2, Upload, Edit2, Check, X, FolderPlus, Move,
} from "lucide-react";
import { db, deleteFolder } from "@/lib/orbit/db";
import { parsePostmanCollection } from "@/lib/orbit/postman";
import type { SavedRequest, Folder, Environment, Collection } from "@/lib/orbit/types";

/* ── Sidebar open-state persistence ────────────────────────
   Stores a JSON array of IDs (collection + folder) that are
   currently expanded. Shared by all nodes via localStorage.
─────────────────────────────────────────────────────────── */
const LS_OPEN = "orbit-sidebar-open-v1";

function useNodeOpen(id: string): [boolean, (val?: boolean) => void] {
  const [open, setOpen] = useState(false);

  // Restore before first paint (no SSR flash — Sidebar is client-only)
  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(LS_OPEN);
      if (raw && (JSON.parse(raw) as string[]).includes(id)) setOpen(true);
    } catch { /* corrupt data */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback((val?: boolean) => {
    setOpen(prev => {
      const next = val !== undefined ? val : !prev;
      try {
        const raw  = localStorage.getItem(LS_OPEN);
        const set: string[] = raw ? JSON.parse(raw) : [];
        const has  = set.includes(id);
        if (next  && !has) set.push(id);
        if (!next &&  has) set.splice(set.indexOf(id), 1);
        localStorage.setItem(LS_OPEN, JSON.stringify(set));
      } catch { /* private mode / full */ }
      return next;
    });
  }, [id]);

  return [open, toggle];
}

/* ─────────────────────────────────────────────────────────── */

interface Props {
  onLoadRequest: (req: SavedRequest) => void;
  activeEnvId: string | null;
  onEnvChange: (id: string | null) => void;
  onOpenEnvEditor: () => void;
}

/* ══════════════════════════════════════════════════════════
   Main Sidebar
══════════════════════════════════════════════════════════ */
export default function Sidebar({ onLoadRequest, activeEnvId, onEnvChange, onOpenEnvEditor }: Props) {
  const [newColName, setNewColName]   = useState("");
  const [addingCol,  setAddingCol]    = useState(false);
  const [importing,  setImporting]    = useState(false);
  const [movingReq,  setMovingReq]    = useState<SavedRequest | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const collections  = useLiveQuery(() => db.collections.orderBy("createdAt").toArray(), []);
  const environments = useLiveQuery(() => db.environments.orderBy("createdAt").toArray(), []);

  /* ── Create collection ─────────────────────────────────── */
  const createCollection = async () => {
    const name = newColName.trim();
    if (!name) return;
    await db.collections.add({ id: crypto.randomUUID(), name, createdAt: Date.now() });
    setNewColName(""); setAddingCol(false);
  };

  /* ── Delete collection (cascade) ──────────────────────── */
  const deleteCollection = async (id: string) => {
    const folderIds = (await db.folders.where("collectionId").equals(id).primaryKeys()) as string[];
    await db.requests.where("collectionId").equals(id).delete();
    if (folderIds.length) await db.folders.bulkDelete(folderIds);
    await db.collections.delete(id);
  };

  /* ── Import ────────────────────────────────────────────── */
  const handleImport = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setImporting(true);
    try {
      const text = await files[0].text();
      const json = JSON.parse(text);
      const now  = Date.now();
      const newColIds: string[] = [];

      if ((json?.version === 2 || json?.version === 3) && Array.isArray(json.collections)) {
        /* ── Orbit backup format ────────────────────────── */
        for (let i = 0; i < json.collections.length; i++) {
          const col   = json.collections[i];
          const colId = crypto.randomUUID();
          await db.collections.add({ ...col, id: colId, createdAt: now + i });

          if (json.version === 3 && Array.isArray(json.folders)) {
            // Build old-id → new-id map for this collection's folders
            const colFolders = (json.folders as Folder[]).filter((f) => f.collectionId === col.id);
            const oldToNew: Record<string, string> = {};
            for (const f of colFolders) oldToNew[f.id] = crypto.randomUUID();

            if (colFolders.length) {
              await db.folders.bulkAdd(
                colFolders.map((f, fi) => ({
                  ...f,
                  id: oldToNew[f.id],
                  collectionId: colId,
                  parentFolderId: f.parentFolderId ? (oldToNew[f.parentFolderId] ?? null) : null,
                  createdAt: now + fi,
                }))
              );
            }

            const colReqs = (json.requests as SavedRequest[]).filter((r) => r.collectionId === col.id);
            if (colReqs.length) {
              await db.requests.bulkAdd(
                colReqs.map((r) => ({
                  ...r,
                  id: crypto.randomUUID(),
                  collectionId: colId,
                  folderId: r.folderId ? (oldToNew[r.folderId] ?? null) : null,
                }))
              );
            }
          } else {
            // Version 2 — no folders
            const colReqs = (json.requests as SavedRequest[]).filter((r) => r.collectionId === col.id);
            if (colReqs.length) {
              await db.requests.bulkAdd(
                colReqs.map((r) => ({ ...r, id: crypto.randomUUID(), collectionId: colId, folderId: null }))
              );
            }
          }
          newColIds.push(colId);
        }
      } else {
        /* ── Postman format ─────────────────────────────── */
        const imports = parsePostmanCollection(text);
        for (let i = 0; i < imports.length; i++) {
          const imp   = imports[i];
          const colId = crypto.randomUUID();
          await db.collections.add({ id: colId, name: imp.collectionName, createdAt: now + i });

          // Build tempId → real UUID map
          const tempToReal: Record<string, string> = {};
          for (const f of imp.folders) tempToReal[f.tempId] = crypto.randomUUID();

          if (imp.folders.length) {
            await db.folders.bulkAdd(
              imp.folders.map((f, fi) => ({
                id: tempToReal[f.tempId],
                collectionId: colId,
                parentFolderId: f.parentTempId ? (tempToReal[f.parentTempId] ?? null) : null,
                name: f.name,
                createdAt: now + fi,
              }))
            );
            for (const f of imp.folders) {
              if (f.requests.length) {
                await db.requests.bulkAdd(
                  f.requests.map((r) => ({
                    ...r,
                    id: crypto.randomUUID(),
                    collectionId: colId,
                    folderId: tempToReal[f.tempId],
                  }))
                );
              }
            }
          }

          if (imp.rootRequests.length) {
            await db.requests.bulkAdd(
              imp.rootRequests.map((r) => ({ ...r, id: crypto.randomUUID(), collectionId: colId, folderId: null }))
            );
          }
          newColIds.push(colId);
        }
      }
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
            <button
              onClick={() => setAddingCol(true)}
              className="transition hover:opacity-80"
              style={{ color: "var(--nebula)" }}
              title="Nouvelle collection"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <input
          ref={importRef} type="file" accept=".json" className="hidden"
          onChange={(e) => handleImport(e.target.files)}
        />

        {addingCol && (
          <form
            onSubmit={(e) => { e.preventDefault(); createCollection(); }}
            className="mb-2 flex gap-1"
          >
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
          <CollectionNode
            key={col.id}
            col={col}
            onLoadRequest={onLoadRequest}
            onDelete={() => deleteCollection(col.id)}
            onMoveRequest={setMovingReq}
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

      {/* Move Modal */}
      {movingReq && (
        <MoveModal
          item={movingReq}
          onClose={() => setMovingReq(null)}
        />
      )}
    </aside>
  );
}

/* ══════════════════════════════════════════════════════════
   Collection Node
══════════════════════════════════════════════════════════ */
function CollectionNode({
  col, onLoadRequest, onDelete, onMoveRequest,
}: {
  col: Collection;
  onLoadRequest: (r: SavedRequest) => void;
  onDelete: () => void;
  onMoveRequest: (r: SavedRequest) => void;
}) {
  const [open, toggleOpen] = useNodeOpen(col.id);
  const [editing,       setEditing]       = useState(false);
  const [editName,      setEditName]      = useState(col.name);
  const [creating,      setCreating]      = useState<"folder" | "request" | null>(null);
  const [newName,       setNewName]       = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load all folders + requests for this collection when open
  const data = useLiveQuery(async () => {
    if (!open) return null;
    const [folders, requests] = await Promise.all([
      db.folders.where("collectionId").equals(col.id).sortBy("createdAt"),
      db.requests.where("collectionId").equals(col.id).sortBy("createdAt"),
    ]);
    return { folders, requests };
  }, [col.id, open]);

  const saveRename = async () => {
    const name = editName.trim();
    if (name) await db.collections.update(col.id, { name });
    setEditing(false);
  };

  const createItem = async () => {
    const name = newName.trim();
    if (!name) { setCreating(null); return; }
    const now = Date.now();
    if (creating === "folder") {
      await db.folders.add({ id: crypto.randomUUID(), collectionId: col.id, parentFolderId: null, name, createdAt: now });
    } else {
      // Save as blank GET request at collection root
      await db.requests.add({
        id: crypto.randomUUID(), collectionId: col.id, folderId: null, name,
        method: "GET", url: "", params: [], headers: [],
        body: { type: "none", content: "" },
        auth: { type: "none", bearer: "", basicUser: "", basicPass: "", apiKeyName: "X-API-Key", apiKeyValue: "", apiKeyIn: "header" },
        createdAt: now, updatedAt: now,
      });
    }
    setNewName(""); setCreating(null);
  };

  const rootRequests = data?.requests.filter((r) => (r.folderId ?? null) === null) ?? [];
  const rootFolders  = data?.folders.filter((f) => f.parentFolderId === null) ?? [];

  return (
    <div className="mb-1">
      {/* Header row */}
      <div
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer group transition select-none"
        onMouseEnter={(e) => !confirmDelete && (e.currentTarget.style.background = "rgba(108,99,255,.08)")}
        onMouseLeave={(e) => !confirmDelete && (e.currentTarget.style.background = "transparent")}
        style={confirmDelete ? { background: "rgba(207,35,40,.08)" } : undefined}
      >
        <ChevronRight
          size={12} className="flex-shrink-0 transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "none", color: "var(--muted)" }}
          onClick={() => toggleOpen()}
        />
        <FolderIcon size={13} style={{ color: confirmDelete ? "#CF2328" : "var(--nebula)", flexShrink: 0 }} onClick={() => toggleOpen()} />

        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); saveRename(); }} className="flex-1 flex gap-1">
            <input
              autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded px-1.5 text-xs focus:outline-none"
              style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)", color: "var(--text)" }}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
            />
            <button type="submit"><Check size={11} style={{ color: "var(--nebula)" }} /></button>
            <button type="button" onClick={() => setEditing(false)}><X size={11} style={{ color: "var(--muted)" }} /></button>
          </form>
        ) : confirmDelete ? (
          <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] flex-1 truncate" style={{ color: "#CF2328" }}>
              Delete «{col.name}»?
            </span>
            <button
              onClick={onDelete}
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: "#CF2328", color: "#fff" }}
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}
            >
              No
            </button>
          </div>
        ) : (
          <span className="flex-1 text-xs truncate font-medium" style={{ color: "var(--text)" }} onClick={() => toggleOpen()}>
            {col.name}
          </span>
        )}

        {!editing && !confirmDelete && (
          <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
            <button onClick={() => { setCreating("folder"); toggleOpen(true); }} title="New folder" style={{ color: "var(--muted)" }}>
              <FolderPlus size={11} />
            </button>
            <button onClick={() => { setCreating("request"); toggleOpen(true); }} title="New request" style={{ color: "var(--muted)" }}>
              <Plus size={11} />
            </button>
            <button onClick={() => { setEditing(true); setEditName(col.name); }} title="Rename" style={{ color: "var(--muted)" }}>
              <Edit2 size={11} />
            </button>
            <button onClick={() => setConfirmDelete(true)} title="Delete" style={{ color: "var(--muted)" }}>
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {open && (
        <div className="ml-4">
          {/* Inline creator */}
          {creating && (
            <form onSubmit={(e) => { e.preventDefault(); createItem(); }} className="mb-1 flex gap-1 pr-1">
              <input
                autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder={creating === "folder" ? "Nom du dossier…" : "Nom de la requête…"}
                className="flex-1 rounded-lg px-2 py-1 text-xs focus:outline-none"
                style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)", color: "var(--text)" }}
                onKeyDown={(e) => e.key === "Escape" && (setCreating(null), setNewName(""))}
              />
              <button type="submit" className="text-xs px-2 rounded-lg" style={{ background: "var(--nebula)", color: "#fff" }}>OK</button>
            </form>
          )}

          {/* Root requests */}
          {rootRequests.map((req) => (
            <RequestRow key={req.id} req={req} depth={0} onLoad={onLoadRequest} onMove={onMoveRequest} />
          ))}

          {/* Root folders */}
          {rootFolders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              allFolders={data?.folders ?? []}
              allRequests={data?.requests ?? []}
              depth={0}
              onLoadRequest={onLoadRequest}
              onMoveRequest={onMoveRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Folder Node (recursive)
══════════════════════════════════════════════════════════ */
function FolderNode({
  folder, allFolders, allRequests, depth, onLoadRequest, onMoveRequest,
}: {
  folder: Folder;
  allFolders: Folder[];
  allRequests: SavedRequest[];
  depth: number;
  onLoadRequest: (r: SavedRequest) => void;
  onMoveRequest: (r: SavedRequest) => void;
}) {
  const [open, toggleOpen] = useNodeOpen(folder.id);
  const [editing,       setEditing]       = useState(false);
  const [editName,      setEditName]      = useState(folder.name);
  const [creating,      setCreating]      = useState<"folder" | "request" | null>(null);
  const [newName,       setNewName]       = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const childFolders  = allFolders.filter((f) => f.parentFolderId === folder.id);
  const childRequests = allRequests.filter((r) => (r.folderId ?? null) === folder.id);

  const saveRename = async () => {
    const name = editName.trim();
    if (name) await db.folders.update(folder.id, { name });
    setEditing(false);
  };

  const createItem = async () => {
    const name = newName.trim();
    if (!name) { setCreating(null); return; }
    const now = Date.now();
    if (creating === "folder") {
      await db.folders.add({
        id: crypto.randomUUID(), collectionId: folder.collectionId,
        parentFolderId: folder.id, name, createdAt: now,
      });
    } else {
      await db.requests.add({
        id: crypto.randomUUID(), collectionId: folder.collectionId, folderId: folder.id, name,
        method: "GET", url: "", params: [], headers: [],
        body: { type: "none", content: "" },
        auth: { type: "none", bearer: "", basicUser: "", basicPass: "", apiKeyName: "X-API-Key", apiKeyValue: "", apiKeyIn: "header" },
        createdAt: now, updatedAt: now,
      });
    }
    setNewName(""); setCreating(null);
  };

  return (
    <div className="mb-0.5">
      <div
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer group transition select-none"
        onMouseEnter={(e) => !confirmDelete && (e.currentTarget.style.background = "rgba(108,99,255,.07)")}
        onMouseLeave={(e) => !confirmDelete && (e.currentTarget.style.background = "transparent")}
        style={confirmDelete ? { background: "rgba(207,35,40,.08)" } : undefined}
      >
        <ChevronRight
          size={11} className="flex-shrink-0 transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "none", color: "var(--muted)" }}
          onClick={() => toggleOpen()}
        />
        <FolderIcon size={12} style={{ color: confirmDelete ? "#CF2328" : "var(--halo)", flexShrink: 0 }} onClick={() => toggleOpen()} />

        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); saveRename(); }} className="flex-1 flex gap-1">
            <input
              autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded px-1.5 text-xs focus:outline-none"
              style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)", color: "var(--text)" }}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
            />
            <button type="submit"><Check size={11} style={{ color: "var(--nebula)" }} /></button>
            <button type="button" onClick={() => setEditing(false)}><X size={11} style={{ color: "var(--muted)" }} /></button>
          </form>
        ) : confirmDelete ? (
          /* ── Delete confirmation ── */
          <div className="flex-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] flex-1 truncate" style={{ color: "#CF2328" }}>
              Delete «{folder.name}»?
            </span>
            <button
              onClick={() => deleteFolder(folder.id)}
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: "#CF2328", color: "#fff" }}
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}
            >
              No
            </button>
          </div>
        ) : (
          <span className="flex-1 text-xs truncate" style={{ color: "var(--text)" }} onClick={() => toggleOpen()}>
            {folder.name}
          </span>
        )}

        {!editing && !confirmDelete && (
          <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
            <button onClick={() => { setCreating("folder"); toggleOpen(true); }} title="Sub-folder" style={{ color: "var(--muted)" }}>
              <FolderPlus size={10} />
            </button>
            <button onClick={() => { setCreating("request"); toggleOpen(true); }} title="New request" style={{ color: "var(--muted)" }}>
              <Plus size={10} />
            </button>
            <button onClick={() => { setEditing(true); setEditName(folder.name); }} title="Rename" style={{ color: "var(--muted)" }}>
              <Edit2 size={10} />
            </button>
            <button onClick={() => setConfirmDelete(true)} title="Delete" style={{ color: "var(--muted)" }}>
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="ml-4">
          {creating && (
            <form onSubmit={(e) => { e.preventDefault(); createItem(); }} className="mb-1 flex gap-1 pr-1">
              <input
                autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder={creating === "folder" ? "Nom du dossier…" : "Nom de la requête…"}
                className="flex-1 rounded-lg px-2 py-1 text-xs focus:outline-none"
                style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)", color: "var(--text)" }}
                onKeyDown={(e) => e.key === "Escape" && (setCreating(null), setNewName(""))}
              />
              <button type="submit" className="text-xs px-2 rounded-lg" style={{ background: "var(--nebula)", color: "#fff" }}>OK</button>
            </form>
          )}

          {childRequests.map((req) => (
            <RequestRow key={req.id} req={req} depth={depth + 1} onLoad={onLoadRequest} onMove={onMoveRequest} />
          ))}

          {childFolders.map((sub) => (
            <FolderNode
              key={sub.id}
              folder={sub}
              allFolders={allFolders}
              allRequests={allRequests}
              depth={depth + 1}
              onLoadRequest={onLoadRequest}
              onMoveRequest={onMoveRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Request Row
══════════════════════════════════════════════════════════ */
function RequestRow({
  req, depth, onLoad, onMove,
}: {
  req: SavedRequest;
  depth: number;
  onLoad: (r: SavedRequest) => void;
  onMove: (r: SavedRequest) => void;
}) {
  const [editing,  setEditing]  = useState(false);
  const [editName, setEditName] = useState(req.name);

  const saveRename = async () => {
    const name = editName.trim();
    if (name) await db.requests.update(req.id, { name, updatedAt: Date.now() });
    setEditing(false);
  };

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 cursor-pointer group transition"
      onClick={() => !editing && onLoad(req)}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(108,99,255,.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <FileText size={10} className="flex-shrink-0" style={{ color: "var(--muted)" }} />
      <MethodBadge method={req.method} />

      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); saveRename(); }} className="flex-1 flex gap-1"
          onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
            className="flex-1 rounded px-1.5 text-[11px] focus:outline-none"
            style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)", color: "var(--text)" }}
            onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          />
          <button type="submit" onClick={(e) => e.stopPropagation()}>
            <Check size={10} style={{ color: "var(--nebula)" }} />
          </button>
        </form>
      ) : (
        <span className="flex-1 text-[11px] truncate" style={{ color: "var(--muted)" }}>{req.name}</span>
      )}

      {!editing && (
        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setEditing(true); setEditName(req.name); }} style={{ color: "var(--muted)" }}>
            <Edit2 size={9} />
          </button>
          <button onClick={() => onMove(req)} style={{ color: "var(--muted)" }} title="Déplacer">
            <Move size={9} />
          </button>
          <button onClick={() => db.requests.delete(req.id)} style={{ color: "var(--muted)" }}>
            <Trash2 size={9} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Move Modal
══════════════════════════════════════════════════════════ */
function MoveModal({ item, onClose }: { item: SavedRequest; onClose: () => void }) {
  const collections = useLiveQuery(() => db.collections.orderBy("createdAt").toArray(), []);
  const allFolders  = useLiveQuery(() => db.folders.orderBy("createdAt").toArray(), []);

  const doMove = async (colId: string, folderId: string | null) => {
    await db.requests.update(item.id, { collectionId: colId, folderId, updatedAt: Date.now() });
    onClose();
  };

  /** Build a flat sorted list of (collection, folder?) destinations */
  interface Dest { label: string; colId: string; folderId: string | null; depth: number; }
  function buildDestinations(): Dest[] {
    if (!collections || !allFolders) return [];
    const out: Dest[] = [];

    function walkFolders(folders: Folder[], parentId: string | null, colId: string, depth: number) {
      const children = folders.filter((f) => f.collectionId === colId && f.parentFolderId === parentId);
      for (const f of children) {
        out.push({ label: f.name, colId, folderId: f.id, depth });
        walkFolders(folders, f.id, colId, depth + 1);
      }
    }

    for (const col of collections) {
      out.push({ label: col.name, colId: col.id, folderId: null, depth: 0 });
      walkFolders(allFolders, null, col.id, 1);
    }
    return out;
  }

  const destinations = buildDestinations();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xs rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--nav-bg)", border: "1px solid var(--stroke)", maxHeight: "70vh" }}>

        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--stroke)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Déplacer « {item.name} »
          </span>
          <button onClick={onClose} style={{ color: "var(--muted)" }}><X size={15} /></button>
        </div>

        <div className="overflow-y-auto p-2">
          {destinations.map((d, i) => {
            const isCurrent = d.colId === item.collectionId && d.folderId === (item.folderId ?? null);
            return (
              <button
                key={i}
                disabled={isCurrent}
                onClick={() => doMove(d.colId, d.folderId)}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-left transition hover:opacity-80 disabled:opacity-40"
                style={{
                  paddingLeft: `${12 + d.depth * 16}px`,
                  background: isCurrent ? "rgba(108,99,255,.12)" : "transparent",
                  color: d.folderId === null ? "var(--text)" : "var(--muted)",
                }}
              >
                {d.folderId === null
                  ? <FolderIcon size={12} style={{ color: "var(--nebula)", flexShrink: 0 }} />
                  : <FolderIcon size={11} style={{ color: "var(--halo)", flexShrink: 0 }} />}
                <span className="truncate">{d.label}</span>
                {d.folderId === null && <span className="text-[10px] ml-auto opacity-50">racine</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Method Badge (exported for use elsewhere)
══════════════════════════════════════════════════════════ */
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
