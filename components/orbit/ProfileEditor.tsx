"use client";

import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { X, Camera, Download, Upload, AlertTriangle } from "lucide-react";
import { db, exportBackup, importBackup } from "@/lib/orbit/db";
import { defaultProfile } from "@/lib/orbit/types";
import type { Profile } from "@/lib/orbit/types";

interface Props {
  onClose: () => void;
}

export default function ProfileEditor({ onClose }: Props) {
  const [tab, setTab] = useState<"profile" | "backup">("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backupStatus, setBackupStatus] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  const profileRaw = useLiveQuery(() => db.profile.get("singleton"), []);
  const profile: Profile = profileRaw ?? defaultProfile();

  const [form, setForm] = useState<Profile | null>(null);
  const current = form ?? profile;

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setForm((f) => ({ ...(f ?? profile), [k]: v }));

  const handlePhoto = (files: FileList | null) => {
    if (!files?.[0]) return;
    const reader = new FileReader();
    reader.onload = (e) => set("photo", e.target?.result as string ?? "");
    reader.readAsDataURL(files[0]);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    await db.profile.put({ ...form, updatedAt: Date.now() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm(null);
  };

  const handleExport = async () => {
    setBackupStatus("Export en cours…");
    try {
      const json = await exportBackup();
      const blob = new Blob([json], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `orbit-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setBackupStatus("✓ Backup téléchargé !");
    } catch (e) {
      setBackupStatus("⚠ Erreur lors de l'export");
    }
  };

  const handleImport = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setBackupStatus("Import en cours…");
    try {
      const text = await files[0].text();
      await importBackup(text);
      setBackupStatus("✓ Données restaurées !");
      setConfirmReset(false);
    } catch (e) {
      setBackupStatus("⚠ Fichier invalide ou corrompu");
    }
  };

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition";
  const inputStyle = { border: "1px solid var(--stroke)", background: "rgba(255,255,255,.03)", color: "var(--text)" };
  const label = "block text-[11px] mb-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--nav-bg)", border: "1px solid var(--stroke)", maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--stroke)" }}>
          <div className="flex gap-3">
            {(["profile", "backup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="text-sm font-semibold transition"
                style={{ color: tab === t ? "var(--nebula)" : "var(--muted)", borderBottom: tab === t ? "2px solid var(--nebula)" : "2px solid transparent", paddingBottom: "2px" }}
              >
                {t === "profile" ? "Profil" : "Sauvegarde"}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ color: "var(--muted)" }}><X size={16} /></button>
        </div>

        {/* Profile tab */}
        {tab === "profile" && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ border: "2px solid var(--stroke)", background: "rgba(108,99,255,.12)" }}>
                  {current.photo
                    ? <img src={current.photo} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold" style={{ color: "var(--nebula)" }}>
                        {(current.firstName?.[0] ?? current.email?.[0] ?? "?").toUpperCase()}
                      </span>
                  }
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "var(--nebula)", color: "#fff" }}
                >
                  <Camera size={11} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files)} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {current.firstName || current.lastName
                    ? `${current.firstName} ${current.lastName}`.trim()
                    : "Ton profil"}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{current.email || "Aucun email"}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} style={{ color: "var(--muted)" }}>Prénom</label>
                <input value={current.firstName} onChange={(e) => set("firstName", e.target.value)} className={inputCls} style={inputStyle} placeholder="Jean" />
              </div>
              <div>
                <label className={label} style={{ color: "var(--muted)" }}>Nom</label>
                <input value={current.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputCls} style={inputStyle} placeholder="Dupont" />
              </div>
            </div>
            <div>
              <label className={label} style={{ color: "var(--muted)" }}>Email</label>
              <input type="email" value={current.email} onChange={(e) => set("email", e.target.value)} className={inputCls} style={inputStyle} placeholder="jean@exemple.com" />
            </div>
            <div>
              <label className={label} style={{ color: "var(--muted)" }}>Bio / Notes</label>
              <textarea value={current.bio} onChange={(e) => set("bio", e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none transition"
                style={inputStyle} placeholder="Développeur back-end, passionné d'APIs…" />
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !form}
                className="rounded-lg px-5 py-2 text-sm font-semibold transition hover:opacity-85 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,var(--nebula),var(--indigo))", color: "#fff" }}
              >
                {saved ? "✓ Sauvegardé !" : saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        )}

        {/* Backup tab */}
        {tab === "backup" && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            {/* Info */}
            <div className="rounded-xl p-4 text-xs" style={{ border: "1px solid var(--stroke)", background: "rgba(108,99,255,.06)" }}>
              <p className="font-semibold mb-1" style={{ color: "var(--halo)" }}>📦 Données stockées localement</p>
              <p style={{ color: "var(--muted)" }}>
                Toutes tes données Orbit (collections, requêtes, environnements, profil) sont stockées dans <strong style={{ color: "var(--text)" }}>IndexedDB</strong> de ton navigateur.
                Elles sont liées à ce navigateur et cet appareil. Pour ne pas les perdre, exporte régulièrement un backup.
              </p>
            </div>

            {/* Export */}
            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ border: "1px solid var(--stroke)" }}>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text)" }}>Exporter un backup</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Télécharge toutes tes données en un fichier JSON.</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition hover:opacity-85 w-fit"
                style={{ background: "linear-gradient(135deg,var(--nebula),var(--indigo))", color: "#fff" }}
              >
                <Download size={14} /> Télécharger le backup
              </button>
            </div>

            {/* Import */}
            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ border: "1px solid var(--stroke)" }}>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text)" }}>Restaurer un backup</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Importe un fichier backup pour restaurer tes données.</p>
              </div>

              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition hover:opacity-80 w-fit"
                  style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}
                >
                  <Upload size={14} /> Importer un backup
                </button>
              ) : (
                <div className="rounded-xl p-3 flex flex-col gap-3" style={{ border: "1px solid #CF2328", background: "rgba(207,35,40,.06)" }}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#CF2328" }} />
                    <p className="text-xs" style={{ color: "var(--text)" }}>
                      <strong>Attention</strong> — Cette action remplacera <em>toutes</em> tes données actuelles. Assure-toi d'avoir un backup récent.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => backupRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-85"
                      style={{ background: "#CF2328", color: "#fff" }}
                    >
                      <Upload size={12} /> Confirmer et importer
                    </button>
                    <button onClick={() => setConfirmReset(false)} className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80" style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                      Annuler
                    </button>
                  </div>
                  <input ref={backupRef} type="file" accept=".json" className="hidden" onChange={(e) => handleImport(e.target.files)} />
                </div>
              )}
            </div>

            {backupStatus && (
              <p className="text-xs" style={{ color: backupStatus.startsWith("✓") ? "var(--nebula)" : "#CF2328" }}>
                {backupStatus}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
