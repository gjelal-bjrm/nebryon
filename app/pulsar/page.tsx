"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import PulsarTopbar from "@/components/pulsar/PulsarTopbar";
import type { Metadata } from "next";

const PulsarTool    = dynamic(() => import("@/components/pulsar/PulsarTool"),               { ssr: false });
const ProfileEditor = dynamic(() => import("@/components/orbit/ProfileEditor"),             { ssr: false });

export default function PulsarPage() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <PulsarTopbar onOpenProfile={() => setShowProfile(true)} />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <PulsarTool />
        </div>
      </div>

      {showProfile && <ProfileEditor onClose={() => setShowProfile(false)} />}
    </div>
  );
}
