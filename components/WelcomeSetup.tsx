"use client";

/**
 * WelcomeSetup — shown exactly once on the very first visit.
 * Sets localStorage["nebryon-initialized"] after completion.
 * Uses the same Dexie profile store as Orbit (nebryon-orbit DB).
 */

import { useState, useEffect, useRef } from "react";
import { Camera, ShieldCheck, ArrowRight, Check } from "lucide-react";
import { db } from "@/lib/orbit/db";
import { defaultProfile } from "@/lib/orbit/types";
import type { Profile } from "@/lib/orbit/types";

const LS_INIT = "nebryon-initialized";

export default function WelcomeSetup() {
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState<"profile" | "done">("profile");

  /* ── Form state ────────────────────────────────── */
  const [form, setForm] = useState<Profile>(defaultProfile());
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(LS_INIT)) setVisible(true);
    } catch { /* private mode */ }
  }, []);

  if (!visible) return null;

  const setF = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handlePhoto = (files: FileList | null) => {
    if (!files?.[0]) return;
    const reader = new FileReader();
    reader.onload = (e) => setF("photo", (e.target?.result as string) ?? "");
    reader.readAsDataURL(files[0]);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save profile only if user entered something meaningful
      const hasData = form.firstName || form.lastName || form.email || form.photo;
      if (hasData) {
        await db.profile.put({ ...form, id: "singleton", updatedAt: Date.now() });
      }
      localStorage.setItem(LS_INIT, "1");
    } catch { /* silent */ }
    setSaving(false);
    setStep("done");
    // Brief "done" screen, then close
    setTimeout(() => setVisible(false), 1200);
  };

  const handleSkip = () => {
    try { localStorage.setItem(LS_INIT, "1"); } catch { /* */ }
    setVisible(false);
  };

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition";
  const inputSty = {
    border: "1px solid var(--stroke)",
    background: "rgba(255,255,255,.04)",
    color: "var(--text)",
  } as React.CSSProperties;

  const displayName = [form.firstName, form.lastName].filter(Boolean).join(" ").trim();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)" }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: "var(--nav-bg)",
          border: "1px solid var(--stroke)",
          boxShadow: "0 0 60px rgba(108,99,255,.18)",
        }}
      >
        {step === "done" ? (
          /* ── Done screen ── */
          <div className="flex flex-col items-center justify-center gap-4 py-14 px-8">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(108,99,255,.15)", border: "1px solid var(--nebula)" }}
            >
              <Check size={24} style={{ color: "var(--nebula)" }} />
            </div>
            <p className="text-sm font-semibold text-center" style={{ color: "var(--text)" }}>
              {displayName ? `Bienvenue, ${displayName} !` : "Tout est prêt !"}
            </p>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="px-6 pt-7 pb-5 flex flex-col gap-1" style={{ borderBottom: "1px solid var(--stroke)" }}>
              {/* Nebula dot decoration */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: "var(--nebula)", boxShadow: "0 0 8px var(--nebula)" }}
                />
                <span className="text-[11px] tracking-widest font-semibold uppercase" style={{ color: "var(--nebula)" }}>
                  Nebryon
                </span>
              </div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "var(--text)" }}>
                Bienvenue 👋
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                Quelques secondes pour personnaliser ton expérience.
              </p>
            </div>

            {/* ── Privacy notice ── */}
            <div className="mx-5 mt-4 rounded-xl px-4 py-3 flex items-start gap-3"
              style={{ border: "1px solid rgba(45,212,191,.25)", background: "rgba(45,212,191,.05)" }}>
              <ShieldCheck size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#2DD4BF" }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                <span className="font-semibold" style={{ color: "#2DD4BF" }}>100 % local.</span>{" "}
                Toutes tes informations restent sur cet appareil — rien n'est transmis ni partagé.
                Ces champs sont entièrement facultatifs et servent uniquement à personnaliser ton expérience.
              </p>
            </div>

            {/* ── Form ── */}
            <div className="px-5 py-5 flex flex-col gap-4">

              {/* Avatar + name row */}
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
                    style={{ border: "2px solid var(--stroke)", background: "rgba(108,99,255,.12)" }}
                    onClick={() => fileRef.current?.click()}
                  >
                    {form.photo ? (
                      <img src={form.photo} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold" style={{ color: "var(--nebula)" }}>
                        {(form.firstName?.[0] ?? "?").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--nebula)", color: "#fff" }}
                  >
                    <Camera size={9} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => handlePhoto(e.target.files)} />
                </div>

                <div className="flex-1">
                  <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
                    Photo de profil <span style={{ opacity: .6 }}>(facultatif)</span>
                  </p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs rounded-lg px-3 py-1.5 transition hover:opacity-80"
                    style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}
                  >
                    Choisir une image…
                  </button>
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] mb-1" style={{ color: "var(--muted)" }}>
                    Prénom <span style={{ opacity: .6 }}>(facultatif)</span>
                  </label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setF("firstName", e.target.value)}
                    className={inputCls}
                    style={inputSty}
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-[11px] mb-1" style={{ color: "var(--muted)" }}>
                    Nom <span style={{ opacity: .6 }}>(facultatif)</span>
                  </label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setF("lastName", e.target.value)}
                    className={inputCls}
                    style={inputSty}
                    placeholder="Dupont"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] mb-1" style={{ color: "var(--muted)" }}>
                  Email <span style={{ opacity: .6 }}>(facultatif)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setF("email", e.target.value)}
                  className={inputCls}
                  style={inputSty}
                  placeholder="jean@exemple.com"
                />
              </div>

              {/* Birthdate */}
              <div>
                <label className="block text-[11px] mb-1" style={{ color: "var(--muted)" }}>
                  Date de naissance <span style={{ opacity: .6 }}>(facultatif — pour un message spécial le jour J)</span>
                </label>
                <input
                  type="date"
                  value={form.birthdate ?? ""}
                  onChange={(e) => setF("birthdate", e.target.value)}
                  className={inputCls}
                  style={inputSty}
                />
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-5 pb-6 flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="text-xs transition hover:opacity-70"
                style={{ color: "var(--muted)" }}
              >
                Passer
              </button>

              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--nebula), var(--indigo))", color: "#fff" }}
              >
                {saving ? "Enregistrement…" : "Commencer"}
                {!saving && <ArrowRight size={14} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
