import BackgroundBlobs from "@/components/BackgroundBlobs";
import SpotlightCursor from "@/components/SpotlightCursor";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      
      {/* Background animé */}
      <BackgroundBlobs />

      {/* Halo curseur (désactivé sur mobile + respects reduce motion) */}
      <SpotlightCursor />

      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Hero />
        <Projects />
        <footer className="py-10 text-sm text-white/50">
          © {new Date().getFullYear()} — Gjelal Bajrami
        </footer>
      </div>
    </main>
  );
}
