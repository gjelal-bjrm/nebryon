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
import TabBar from "@/components/orbit/TabBar";
import type { TabInfo } from "@/components/orbit/TabBar";
import { db } from "@/lib/orbit/db";
import { runRequest } from "@/lib/orbit/runner";
import { defaultRequest } from "@/lib/orbit/types";
import type { OrbitRequest, OrbitResponse, SavedRequest, Environment } from "@/lib/orbit/types";

const EnvEditor     = dynamic(() => import("@/components/orbit/EnvEditor"),     { ssr: false });
const ProfileEditor = dynamic(() => import("@/components/orbit/ProfileEditor"), { ssr: false });

/* ── Resize hook ────────────────────────────────────────── */
/**
 * Both axes work in absolute pixels now.
 * (The old vertical split used %, causing pixel-delta to be added to a % value — that's the bug.)
 */
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
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, [size, min, max, axis]);

  return { size, onMouseDown };
}

/* ── Tab types ──────────────────────────────────────────── */
interface ActiveMeta {
  id: string;
  name: string;
  collectionId: string;
  folderId: string | null;
}

interface Tab {
  key: string;
  req: OrbitRequest;
  meta: ActiveMeta | null;
  savedFlash: boolean;
  response: OrbitResponse | null;
  error: string | null;
  sending: boolean;
}

function createTab(req?: OrbitRequest, meta?: ActiveMeta, key?: string): Tab {
  return {
    key:        key ?? crypto.randomUUID(),
    req:        req ?? defaultRequest(),
    meta:       meta ?? null,
    savedFlash: false,
    response:   null,
    error:      null,
    sending:    false,
  };
}

/* ── Main page ──────────────────────────────────────────── */
export default function OrbitPage() {
  // Compute initial tab once — same object used for both useState calls so keys match
  const initRef = useRef<Tab | null>(null);
  if (!initRef.current) initRef.current = createTab();

  const [tabs,         setTabs]         = useState<Tab[]>([initRef.current]);
  const [activeTabKey, setActiveTabKey] = useState<string>(initRef.current.key);

  useAutoBackup();

  // Electron: backup before quit
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

  /* ── Tab helpers ────────────────────────────────────────── */
  const activeTab = tabs.find(t => t.key === activeTabKey) ?? tabs[0]!;

  const updateTab = useCallback((key: string, patch: Partial<Tab>) => {
    setTabs(ts => ts.map(t => t.key === key ? { ...t, ...patch } : t));
  }, []);

  /* ── Send ───────────────────────────────────────────────── */
  const handleSend = useCallback(async () => {
    const tab = tabs.find(t => t.key === activeTabKey);
    if (!tab || !tab.req.url.trim() || tab.sending) return;

    updateTab(tab.key, { sending: true, error: null, response: null });
    try {
      const res = await runRequest(tab.req, activeEnv ?? null);
      updateTab(tab.key, { response: res, sending: false });
    } catch (e) {
      updateTab(tab.key, { error: e instanceof Error ? e.message : "Unknown error", sending: false });
    }
  }, [tabs, activeTabKey, activeEnv, updateTab]);

  /* ── Load request from sidebar ──────────────────────────── */
  const handleLoadRequest = useCallback((saved: SavedRequest) => {
    const { id, collectionId, folderId, name, createdAt: _c, updatedAt: _u, ...rest } = saved;
    const meta: ActiveMeta = { id, collectionId, folderId: folderId ?? null, name };

    // Switch to existing tab if already open
    const existing = tabs.find(t => t.meta?.id === id);
    if (existing) { setActiveTabKey(existing.key); return; }

    // Open new tab (use saved request id as stable tab key)
    const tab = createTab(rest as OrbitRequest, meta, id);
    setTabs(ts => [...ts, tab]);
    setActiveTabKey(id);
  }, [tabs]);

  /* ── New tab ────────────────────────────────────────────── */
  const handleNewTab = useCallback(() => {
    const t = createTab();
    setTabs(ts => [...ts, t]);
    setActiveTabKey(t.key);
  }, []);

  /* ── Close tab ──────────────────────────────────────────── */
  const handleCloseTab = useCallback((key: string) => {
    setTabs(prev => {
      const idx   = prev.findIndex(t => t.key === key);
      const next  = prev.filter(t => t.key !== key);
      const final = next.length ? next : [createTab()];

      // Update active key if the closed tab was active
      setActiveTabKey(prevKey => {
        if (prevKey !== key) return prevKey;
        return final[Math.max(0, idx - 1)]?.key ?? final[0]!.key;
      });

      return final;
    });
  }, []);

  /* ── Save ───────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    const tab = tabs.find(t => t.key === activeTabKey);
    if (!tab) return;
    if (tab.meta) {
      await db.requests.update(tab.meta.id, { ...tab.req, updatedAt: Date.now() });
      updateTab(tab.key, { savedFlash: true });
      setTimeout(() => updateTab(tab.key, { savedFlash: false }), 1500);
    } else {
      setShowSaveDialog(true);
    }
  }, [tabs, activeTabKey, updateTab]);

  /* ── After first dialog save: track the new request ────── */
  const handleSavedInDialog = useCallback(async (id: string) => {
    const saved = await db.requests.get(id);
    if (saved) {
      const meta: ActiveMeta = {
        id:           saved.id,
        collectionId: saved.collectionId,
        folderId:     saved.folderId ?? null,
        name:         saved.name,
      };
      setTabs(ts => ts.map(t => t.key === activeTabKey ? { ...t, meta } : t));
    }
    setShowSaveDialog(false);
  }, [activeTabKey]);

  /* ── Ctrl+S ─────────────────────────────────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  /* ── Ctrl+T: new tab ────────────────────────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "t") { e.preventDefault(); handleNewTab(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleNewTab]);

  /* ── Ctrl+W: close active tab ───────────────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        setActiveTabKey(k => { handleCloseTab(k); return k; });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleCloseTab]);

  /* ── Resizable panels ───────────────────────────────────── */
  const sidebar = useResize(240, 160, 480, "x");
  const reqPane = useResize(320, 80, 700, "y"); // absolute pixels — fixes the % bug

  /* ── Tab info for TabBar ────────────────────────────────── */
  const tabInfos: TabInfo[] = tabs.map(t => ({
    key:      t.key,
    req:      t.req,
    metaName: t.meta?.name ?? null,
  }));

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Topbar */}
      <OrbitTopbar onOpenProfile={() => setShowProfile(true)} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div
          className="flex-shrink-0 h-full overflow-hidden relative"
          style={{ width: sidebar.size, userSelect: "none" }}
        >
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
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tab bar */}
          <TabBar
            tabs={tabInfos}
            activeKey={activeTabKey}
            onSwitch={setActiveTabKey}
            onClose={handleCloseTab}
            onNew={handleNewTab}
          />

          {/* Request panel — fixed pixel height */}
          <div
            className="overflow-hidden flex-shrink-0"
            style={{ height: reqPane.size, borderBottom: "1px solid var(--stroke)", userSelect: "none" }}
          >
            <RequestPanel
              req={activeTab.req}
              onChange={(req) => updateTab(activeTab.key, { req })}
              onSend={handleSend}
              onSave={handleSave}
              sending={activeTab.sending}
              savedFlash={activeTab.savedFlash}
              activeName={activeTab.meta?.name ?? null}
            />
          </div>

          {/* Vertical resize handle */}
          <div
            onMouseDown={reqPane.onMouseDown}
            className="flex-shrink-0 h-1.5 cursor-row-resize"
            style={{ background: "var(--stroke)", userSelect: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--nebula)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--stroke)")}
          />

          {/* Response panel — text is selectable here */}
          <div className="flex-1 overflow-hidden">
            <ResponsePanel
              response={activeTab.response}
              loading={activeTab.sending}
              error={activeTab.error}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEnvEditor  && <EnvEditor onClose={() => setShowEnvEditor(false)} />}
      {showSaveDialog && (
        <SaveDialog
          req={activeTab.req}
          onClose={() => setShowSaveDialog(false)}
          onSaved={handleSavedInDialog}
        />
      )}
      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
    </div>
  );
}
