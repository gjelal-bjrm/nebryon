"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import LumenTopbar  from "@/components/lumen/LumenTopbar";
import { DEFAULT_TEMPLATE } from "@/components/lumen/TemplateTab";

const LumenLanding  = dynamic(() => import("@/components/lumen/LumenLanding"),  { ssr: false });
const LumenGallery  = dynamic(() => import("@/components/lumen/LumenGallery"),  { ssr: false });
const LumenTool     = dynamic(() => import("@/components/lumen/LumenTool"),     { ssr: false });
const ProfileEditor = dynamic(() => import("@/components/orbit/ProfileEditor"), { ssr: false });

type View = "landing" | "gallery" | "editor";

function viewToHash(v: View): string {
  if (v === "gallery") return "#gallery";
  if (v === "editor")  return "#editor";
  return "";
}

function hashToView(hash: string): View {
  if (hash === "#gallery") return "gallery";
  if (hash === "#editor")  return "editor";
  return "landing";
}

export default function LumenPage() {
  const [view,             setViewState]       = useState<View>("landing");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(DEFAULT_TEMPLATE);
  const [showProfile,      setShowProfile]      = useState(false);

  // ── Sync view with URL hash ──────────────────────────────────────────────
  useEffect(() => {
    setViewState(hashToView(window.location.hash));
  }, []);

  useEffect(() => {
    const handlePop = () => setViewState(hashToView(window.location.hash));
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const navigate = useCallback((newView: View) => {
    const hash = viewToHash(newView);
    window.history.pushState({ view: newView }, "", `/lumen${hash}`);
    setViewState(newView);
  }, []);

  const openEditor = useCallback((html: string) => {
    setSelectedTemplate(html);
    navigate("editor");
  }, [navigate]);

  // ── View rendering ────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <LumenTopbar onOpenProfile={() => setShowProfile(true)} />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-full flex flex-col">

          {view === "landing" && (
            <LumenLanding
              onStart={() => navigate("gallery")}
              onBlank={() => openEditor(DEFAULT_TEMPLATE)}
            />
          )}

          {view === "gallery" && (
            <div className="py-6 flex-1 flex flex-col">
              <LumenGallery
                onUse={(html) => openEditor(html)}
                onBlank={(_catId) => openEditor(DEFAULT_TEMPLATE)}
                onBack={() => navigate("landing")}
              />
            </div>
          )}

          {view === "editor" && (
            <div className="py-6 flex-1 flex flex-col min-h-0">
              <LumenTool
                initialTemplate={selectedTemplate}
                onBack={() => navigate("gallery")}
              />
            </div>
          )}

        </div>
      </div>

      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
    </div>
  );
}
