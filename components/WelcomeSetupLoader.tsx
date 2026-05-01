"use client";

import dynamic from "next/dynamic";

const WelcomeSetup = dynamic(() => import("@/components/WelcomeSetup"), { ssr: false });

export default function WelcomeSetupLoader() {
  return <WelcomeSetup />;
}
