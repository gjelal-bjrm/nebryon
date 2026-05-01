import BackgroundBlobs from "@/components/BackgroundBlobs";
import SpotlightCursor from "@/components/SpotlightCursor";
import Hero from "@/components/Hero";
import StatsStrip from "@/components/StatsStrip";
import Projects from "@/components/Projects";
import Tools from "@/components/Tools";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <BackgroundBlobs />
      <SpotlightCursor />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Hero />
        <StatsStrip />
        <Tools />
        <Projects />
        <footer className="py-10 text-sm" style={{ color: "var(--muted)" }}>
          ©Copyright {new Date().getFullYear()} — Gjelal Bajrami
        </footer>
      </div>
    </main>
  );
}