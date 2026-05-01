"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { X, Plus } from "lucide-react";
import { db } from "@/lib/orbit/db";
import type { OrbitRequest, Folder } from "@/lib/orbit/types";

interface Props {
  req: OrbitRequest;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

export default function SaveDialog({ req, onClose, onSaved }: Props) {
  const [name, setName] = useState(() => {
    try { return new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "Nouvelle requête"; }
    catch { return "Nouvelle requête"; }
  });
  const [collectionId, setCollectionId] = useState<string>("");
  const [folderId,     setFolderId]     = useState<string | null>(null);
  const [newColName,   setNewColName]   = useState("");
  const [addingCol,    setAddingCol]    = useState(false);

  const collections = useLiveQuery(() => db.collections.orderBy("createdAt").toArray(), []);
  const folders     = useLiveQuery(
    () => collectionId
      ? db.folders.where("collectionId").equals(collectionId).sortBy("createdAt")
      : Promise.resolve([] as Folder[]),
    [collectionId]
  );

  // Reset folder when collection changes
  useEffect(() => setFolderId(null), [collectionId]);

  const createCollection = async () => {
    const n = newColName.trim();
    if (!n) return;
    const id = crypto.randomUUID();
    await db.collections.add({ id, name: n, createdAt: Date.now() });
    setCollectionId(id);
    setNewColName(""); setAddingCol(false);
  };

  const save = async () => {
    if (!name.trim() || !collectionId) return;
    const id = crypto.randomUUID();
    await db.requests.add({
      ...req,
      id,
      collectionId,
      folderId: folderId,
      name: name.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    onSaved?.(id);
    onClose();
  };

  /** Build indented folder options */
  function renderFolderOptions(
    folders: Folder[],
    parentId: string | null,
    depth: number
  ): React.ReactNode[] {
    const children = folders.filter((f) => f.parentFolderId === parentId);
    return children.flatMap((f) => [
      <option key={f.id} value={f.id}>
        {"  ".repeat(depth) + "📁 " + f.name}
      </option>,
      ...renderFolderOptions(folders, f.id, depth + 1),
    ]);
  }

  const inputCls   = "w-full rounded-lg px-3 py-2 text-xs focus:outline-none";
  const inputStyle = { border: "1px solid var(--stroke)", background: "rgba(255,255,255,.03)", color: "var(--text)" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--nav-bg)", border: "1px solid var(--stroke)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--stroke)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Sauvegarder la requête</h2>
          <button onClick={onClose} className="transition hover:opacity-70" style={{ color: "var(--muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Name */}
          <div>
            <label className="block text-[11px] mb-1" style={{ color: "var(--muted)" }}>Nom de la requête</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={inputStyle} />
          </div>

          {/* Collection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px]" style={{ color: "var(--muted)" }}>Collection</label>
              <button
                onClick={() => setAddingCol(true)}
                className="flex items-center gap-1 text-[11px] transition hover:opacity-80"
                style={{ color: "var(--nebula)" }}
              >
                <Plus size={11} /> Nouvelle
              </button>
            </div>

            {addingCol && (
              <form onSubmit={(e) => { e.preventDefault(); createCollection(); }} className="mb-2 flex gap-1">
                <input
                  autoFocus value={newColName} onChange={(e) => setNewColName(e.target.value)}
                  placeholder="Nom de la collection…"
                  className="flex-1 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  style={{ border: "1px solid var(--nebula)", background: "rgba(108,99,255,.08)", color: "var(--text)" }}
                  onKeyDown={(e) => e.key === "Escape" && setAddingCol(false)}
                />
                <button type="submit" className="text-xs px-2 rounded-lg" style={{ background: "var(--nebula)", color: "#fff" }}>OK</button>
              </form>
            )}

            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className={inputCls}
              style={inputStyle}
            >
              <option value="">— Choisir une collection —</option>
              {collections?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Folder — only shown when a collection is selected */}
          {collectionId && (
            <div>
              <label className="block text-[11px] mb-1" style={{ color: "var(--muted)" }}>Dossier (optionnel)</label>
              <select
                value={folderId ?? ""}
                onChange={(e) => setFolderId(e.target.value || null)}
                className={inputCls}
                style={inputStyle}
              >
                <option value="">Racine de la collection</option>
                {folders && renderFolderOptions(folders, null, 0)}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs transition hover:opacity-80"
            style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}
          >
            Annuler
          </button>
          <button
            onClick={save}
            disabled={!name.trim() || !collectionId}
            className="rounded-lg px-4 py-2 text-xs font-semibold transition hover:opacity-85 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,var(--nebula),var(--indigo))", color: "#fff" }}
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
