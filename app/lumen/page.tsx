"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LumenTopbar  from "@/components/lumen/LumenTopbar";
import { DEFAULT_TEMPLATE } from "@/components/lumen/TemplateTab";

const LumenLanding  = dynamic(() => import("@/components/lumen/LumenLanding"),  { ssr: false });
const LumenGallery  = dynamic(() => import("@/components/lumen/LumenGallery"),  { ssr: false });
const LumenTool     = dynamic(() => import("@/components/lumen/LumenTool"),     { ssr: false });
const ProfileEditor = dynamic(() => import("@/components/orbit/ProfileEditor"), { ssr: false });

type View = "landing" | "gallery" | "editor";

export default function LumenPage() {
  const [view,            setView]            = useState<View>("landing");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(DEFAULT_TEMPLATE);
  const [showProfile,     setShowProfile]     = useState(false);

  const openEditor = (html: string) => {
    setSelectedTemplate(html);
    setView("editor");
  };

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
              onStart={() => setView("gallery")}
              onBlank={() => openEditor(DEFAULT_TEMPLATE)}
            />
          )}

          {view === "gallery" && (
            <div className="py-6 flex-1 flex flex-col">
              <LumenGallery
                onUse={(html) => openEditor(html)}
                onBlank={() => openEditor(DEFAULT_TEMPLATE)}
                onBack={() => setView("landing")}
              />
            </div>
          )}

          {view === "editor" && (
            <div className="py-6 flex-1 flex flex-col min-h-0">
              <LumenTool
                initialTemplate={selectedTemplate}
                onBack={() => setView("gallery")}
              />
            </div>
          )}

        </div>
      </div>

      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
    </div>
  );
}
