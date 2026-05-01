"use client";

import dynamic from "next/dynamic";

const BirthdayBanner = dynamic(() => import("@/components/BirthdayBanner"), { ssr: false });

export default function BirthdayBannerLoader() {
  return <BirthdayBanner />;
}
