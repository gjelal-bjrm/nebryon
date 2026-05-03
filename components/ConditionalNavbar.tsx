"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

/** Renders the Navbar on all routes except full-screen apps */
const HIDDEN_ON = ["/orbit", "/pulsar", "/lumen"];

export default function ConditionalNavbar() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  return <Navbar />;
}
