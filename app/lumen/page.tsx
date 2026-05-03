"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LumenTopbar from "@/components/lumen/LumenTopbar";

const LumenTool     = dynamic(() => import("@/components/lumen/LumenTool"),           { ssr: false });
const ProfileEditor = dynamic(() => import("@/components/orbit/ProfileEditor"),        { ssr: false });

export default function LumenPage() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <LumenTopbar onOpenProfile={() => setShowProfile(true)} />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 h-full flex flex-col">
          {/* Header */}
          <div className="mb-6 flex-shrink-0">
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
              Générateur de documents PDF
            </h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Concevez un modèle HTML avec des variables <code style={{ color: "#F6AD55" }}>{`{{ champ }}`}</code>,
              importez vos données et téléchargez vos PDFs en masse.
            </p>
          </div>

          <div className="flex-1 min-h-0">
            <LumenTool />
          </div>
        </div>
      </div>

      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
    </div>
  );
}
