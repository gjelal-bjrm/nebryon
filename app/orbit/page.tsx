"use client";

import { useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import dynamic from "next/dynamic";
import RequestPanel from "@/components/orbit/RequestPanel";
import ResponsePanel from "@/components/orbit/ResponsePanel";
import Sidebar from "@/components/orbit/Sidebar";
import SaveDialog from "@/components/orbit/SaveDialog";
import { db } from "@/lib/orbit/db";
import { runRequest } from "@/lib/orbit/runner";
import { defaultRequest } from "@/lib/orbit/types";
import type { OrbitRequest, OrbitResponse, SavedRequest, Environment } from "@/lib/orbit/types";

const EnvEditor = dynamic(() => import("@/components/orbit/EnvEditor"), { ssr: false });

export default function OrbitPage() {
  const [req, setReq] = useState<OrbitRequest>(defaultRequest());
  const [response, setResponse] = useState<OrbitResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
  const [showEnvEditor, setShowEnvEditor] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const activeEnvRaw = useLiveQuery<Environment | undefined>(
    async () => activeEnvId ? db.environments.get(activeEnvId) : undefined,
    [activeEnvId]
  );
  const activeEnv = activeEnvRaw ?? null;

  const handleSend = useCallback(async () => {
    if (!req.url.trim() || sending) return;
    setSending(true);
    setError(null);
    setResponse(null);
    try {
      const res = await runRequest(req, activeEnv ?? null);
      setResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSending(false);
    }
  }, [req, sending, activeEnv]);

  const handleLoadRequest = useCallback((saved: SavedRequest) => {
    const { id, collectionId, name, createdAt, updatedAt, ...orbitReq } = saved;
    setReq(orbitReq);
    setResponse(null);
    setError(null);
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 h-full overflow-hidden">
        <Sidebar
          onLoadRequest={handleLoadRequest}
          activeEnvId={activeEnvId}
          onEnvChange={setActiveEnvId}
          onOpenEnvEditor={() => setShowEnvEditor(true)}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Request */}
        <div className="flex-1 overflow-hidden" style={{ borderBottom: "1px solid var(--stroke)" }}>
          <RequestPanel
            req={req}
            onChange={setReq}
            onSend={handleSend}
            onSave={() => setShowSaveDialog(true)}
            sending={sending}
          />
        </div>

        {/* Response */}
        <div className="flex-1 overflow-hidden">
          <ResponsePanel
            response={response}
            loading={sending}
            error={error}
          />
        </div>
      </div>

      {/* Modals */}
      {showEnvEditor && <EnvEditor onClose={() => setShowEnvEditor(false)} />}
      {showSaveDialog && (
        <SaveDialog
          req={req}
          onClose={() => setShowSaveDialog(false)}
        />
      )}
    </div>
  );
}
