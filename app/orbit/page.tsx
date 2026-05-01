"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAutoBackup } from "@/hooks/useAutoBackup";
import { writeBackup, isElectron } from "@/lib/orbit/autobackup";
import { useLiveQuery } from "dexie-react-hooks";
import dynamic from "next/dynamic";
import RequestPanel from "@/components/orbit/RequestPanel";
import ResponsePanel from "@/components/orbit/ResponsePanel";
import Sidebar from "@/components/orbit/Sidebar";
import SaveDialog from "@/components/orbit/SaveDialog";
import OrbitTopbar from "@/components/orbit/OrbitTopbar";
import { db } from "@/lib/orbit/db";
import { runRequest } from "@/lib/orbit/runner";
import { defaultRequest } from "@/lib/orbit/types";
import type { OrbitRequest, OrbitResponse, SavedRequest, Environment } from "@/lib/orbit/types";

const EnvEditor     = dynamic(() => import("@/components/orbit/EnvEditor"),     { ssr: false });
const ProfileEditor = dynamic(() => import("@/components/orbit/ProfileEditor"), { ssr: false });

/* ── Resize hook ────────────────────────────────────────── */
function useResize(initial: number, min: number, max: number, axis: "x" | "y") {
  const [size, setSize] = useState(initial);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const originSize = size;
    const originPos  = axis === "x" ? e.clientX : e.clientY;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = (axis === "x" ? ev.clientX : ev.clientY) - originPos;
      setSize(Math.max(min, Math.min(max, originSize + delta)));
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [size, min, max, axis]);

  return { size, onMouseDown };
}

/* ── Active-request metadata ────────────────────────────── */
interface ActiveMeta {
  id: string;
  name: string;
  collectionId: string;
  folderId: string | null;
}

/* ── Main page ──────────────────────────────────────────── */
export default function OrbitPage() {
  const [req,        setReq]        = useState<OrbitRequest>(defaultRequest());
  const [response,   setResponse]   = useState<OrbitResponse | null>(null);
  const [sending,    setSending]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [activeMeta, setActiveMeta] = useState<ActiveMeta | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useAutoBackup();

  // Electron: backup on app quit then signal main to proceed
  useEffect(() => {
    if (!isElectron()) return;
    const handler = async () => {
      try { await writeBackup(); } catch { /* silent */ }
      window.electronAPI!.quitReady();
    };
    window.electronAPI!.onBeforeQuit(handler);
  }, []);

  const [activeEnvId,    setActiveEnvId]    = useState<string | null>(null);
  const [showEnvEditor,  setShowEnvEditor]  = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showProfile,    setShowProfile]    = useState(false);

  const activeEnvRaw = useLiveQuery<Environment | undefined>(
    async () => activeEnvId ? db.environments.get(activeEnvId) : undefined,
    [activeEnvId]
  );
  const activeEnv = activeEnvRaw ?? null;

  /* ── Send ───────────────────────────────────────────────── */
  const handleSend = useCallback(async () => {
    if (!req.url.trim() || sending) return;
    setSending(true);
    setError(null);
    setResponse(null);
    try {
      const res = await runRequest(req, activeEnv ?? null);
      setResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSending(false);
    }
  }, [req, sending, activeEnv]);

  /* ── Load request from sidebar ──────────────────────────── */
  const handleLoadRequest = useCallback((saved: SavedRequest) => {
    const { id, collectionId, folderId, name, createdAt, updatedAt, ...orbitReq } = saved;
    setReq(orbitReq);
    setActiveMeta({ id, collectionId, folderId: folderId ?? null, name });
    setResponse(null);
    setError(null);
  }, []);

  /* ── Save ───────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (activeMeta) {
      // Direct update — no dialog needed
      await db.requests.update(activeMeta.id, { ...req, updatedAt: Date.now() });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } else {
      // First save — open dialog
      setShowSaveDialog(true);
    }
  }, [activeMeta, req]);

  /* ── After first save via dialog: track the new request ── */
  const handleSavedInDialog = useCallback(async (id: string) => {
    const saved = await db.requests.get(id);
    if (saved) {
      setActiveMeta({
        id:           saved.id,
        collectionId: saved.collectionId,
        folderId:     saved.folderId ?? null,
        name:         saved.name,
      });
    }
    setShowSaveDialog(false);
  }, []);

  /* ── Ctrl+S keyboard shortcut ───────────────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  /* ── Resizable panels ───────────────────────────────────── */
  const sidebar = useResize(240, 160, 480, "x");
  const reqPane = useResize(50,   20,  80, "y");

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Topbar */}
      <OrbitTopbar onOpenProfile={() => setShowProfile(true)} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden" style={{ userSelect: "none" }}>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div className="flex-shrink-0 h-full overflow-hidden relative" style={{ width: sidebar.size }}>
          <Sidebar
            onLoadRequest={handleLoadRequest}
            activeEnvId={activeEnvId}
            onEnvChange={setActiveEnvId}
            onOpenEnvEditor={() => setShowEnvEditor(true)}
          />
          <div
            onMouseDown={sidebar.onMouseDown}
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize z-10"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--nebula)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          />
        </div>

        {/* ── Main area ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ userSelect: "none" }}>

          {/* Request panel */}
          <div
            className="overflow-hidden flex-shrink-0"
            style={{ height: `${reqPane.size}%`, borderBottom: "1px solid var(--stroke)" }}
          >
            <RequestPanel
              req={req}
              onChange={setReq}
              onSend={handleSend}
              onSave={handleSave}
              sending={sending}
              savedFlash={savedFlash}
              activeName={activeMeta?.name ?? null}
            />
          </div>

          {/* Vertical resize handle */}
          <div
            onMouseDown={reqPane.onMouseDown}
            className="flex-shrink-0 h-1.5 cursor-row-resize"
            style={{ background: "var(--stroke)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--nebula)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--stroke)")}
          />

          {/* Response panel */}
          <div className="flex-1 overflow-hidden">
            <ResponsePanel response={response} loading={sending} error={error} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEnvEditor  && <EnvEditor onClose={() => setShowEnvEditor(false)} />}
      {showSaveDialog && (
        <SaveDialog
          req={req}
          onClose={() => setShowSaveDialog(false)}
          onSaved={handleSavedInDialog}
        />
      )}
      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
    </div>
  );
}
