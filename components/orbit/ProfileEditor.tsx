"use client";

import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { X, Camera, Download, Upload, AlertTriangle, FolderOpen, Check, RefreshCw } from "lucide-react";
import { db, exportBackup, importBackup, getBackupDirHandle, setBackupDirHandle } from "@/lib/orbit/db";
import { defaultProfile } from "@/lib/orbit/types";
import {
  getInterval, setInterval_, getLastBackup, writeBackup,
  pickAndStoreDir, clearStoredDir, getStoredDirLabel,
  INTERVAL_LABELS, isElectron,
} from "@/lib/orbit/autobackup";
import type { Profile } from "@/lib/orbit/types";
import type { BackupInterval } from "@/lib/orbit/autobackup";

interface Props { onClose: () => void; }

export default function ProfileEditor({ onClose }: Props) {
  const [tab, setTab] = useState<"profile" | "backup">("profile");

  /* ── Profile state ───────────────────────────────────────── */
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const profileRaw = useLiveQuery(() => db.profile.get("singleton"), []);
  const profile: Profile = profileRaw ?? defaultProfile();
  const [form, setForm] = useState<Profile | null>(null);
  const current = form ?? profile;
  const setF = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setForm((f) => ({ ...(f ?? profile), [k]: v }));

  const handlePhoto = (files: FileList | null) => {
    if (!files?.[0]) return;
    const reader = new FileReader();
    reader.onload = (e) => setF("photo", (e.target?.result as string) ?? "");
    reader.readAsDataURL(files[0]);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    await db.profile.put({ ...form, updatedAt: Date.now() });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm(null);
  };

  /* ── Backup state ────────────────────────────────────────── */
  const [dirLabel,     setDirLabel]     = useState<string>("");
  const [interval,     setIntervalState] = useState<BackupInterval>("daily");
  const [lastBackup,   setLastBackup]   = useState<number>(0);
  const [backupStatus, setBackupStatus] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const backupRef = useRef<HTMLInputElement>(null);

  // Load saved state on mount
  useEffect(() => {
    getStoredDirLabel().then((label) => { if (label) setDirLabel(label); });
    setIntervalState(getInterval());
    setLastBackup(getLastBackup());
  }, []);

  const handlePickDir = async () => {
    try {
      const label = await pickAndStoreDir();
      if (label) { setDirLabel(label); setBackupStatus("✓ Dossier configuré : " + label); }
    } catch {
      setBackupStatus("⚠ Impossible d'accéder au dossier");
    }
  };

  const handleClearDir = async () => {
    await clearStoredDir();
    setDirLabel("");
    setBackupStatus("Dossier de backup supprimé.");
  };

  const handleIntervalChange = (v: BackupInterval) => {
    setIntervalState(v);
    setInterval_(v);
  };

  const handleManualBackupToDir = async () => {
    setBackupStatus("Backup en cours…");
    try {
      const name = await writeBackup();
      setLastBackup(Date.now());
      setBackupStatus(`✓ Sauvegardé : ${name}`);
    } catch (e: any) {
      setBackupStatus("⚠ " + (e?.message ?? "Erreur lors du backup"));
    }
  };

  const handleDownload = async () => {
    setBackupStatus("Export en cours…");
    try {
      const json = await exportBackup();
      const blob = new Blob([json], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `orbit-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setBackupStatus("✓ Backup téléchargé !");
    } catch { setBackupStatus("⚠ Erreur lors de l'export"); }
  };

  const handleImport = async (files: FileList | null) => {
    if (!files?.[0]) return;
    setBackupStatus("Restauration en cours…");
    try {
      await importBackup(await files[0].text());
      setBackupStatus("✓ Données restaurées !");
      setConfirmReset(false);
    } catch { setBackupStatus("⚠ Fichier invalide ou corrompu"); }
  };

  const fmtDate = (ts: number) => ts
    ? new Date(ts).toLocaleString("fr", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Jamais";

  const dirPickerSupported =
    typeof window !== "undefined" &&
    (isElectron() || "showDirectoryPicker" in window);

  /* ── Styles ──────────────────────────────────────────────── */
  const inputCls = "w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition";
  const inputSty = { border: "1px solid var(--stroke)", background: "rgba(255,255,255,.03)", color: "var(--text)" };
  const lbl      = "block text-[11px] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "var(--nav-bg)", border: "1px solid var(--stroke)", maxHeight: "88vh" }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--stroke)" }}>
          <div className="flex gap-3">
            {(["profile", "backup"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="text-sm font-semibold pb-0.5 transition"
                style={{ color: tab === t ? "var(--nebula)" : "var(--muted)", borderBottom: tab === t ? "2px solid var(--nebula)" : "2px solid transparent" }}>
                {t === "profile" ? "Profil" : "Sauvegarde"}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ color: "var(--muted)" }}><X size={16} /></button>
        </div>

        {/* ── Profile tab ── */}
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
                      </span>}
                </div>
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "var(--nebula)", color: "#fff" }}>
                  <Camera size={11} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => handlePhoto(e.target.files)} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {current.firstName || current.lastName ? `${current.firstName} ${current.lastName}`.trim() : "Ton profil"}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{current.email || "Aucun email"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl} style={{ color: "var(--muted)" }}>Prénom</label>
                <input value={current.firstName} onChange={(e) => setF("firstName", e.target.value)} className={inputCls} style={inputSty} placeholder="Jean" /></div>
              <div><label className={lbl} style={{ color: "var(--muted)" }}>Nom</label>
                <input value={current.lastName} onChange={(e) => setF("lastName", e.target.value)} className={inputCls} style={inputSty} placeholder="Dupont" /></div>
            </div>
            <div><label className={lbl} style={{ color: "var(--muted)" }}>Email</label>
              <input type="email" value={current.email} onChange={(e) => setF("email", e.target.value)} className={inputCls} style={inputSty} placeholder="jean@exemple.com" /></div>
            <div>
              <label className={lbl} style={{ color: "var(--muted)" }}>
                Date de naissance <span style={{ opacity: .6 }}>(facultatif — pour un message personnalisé le jour J)</span>
              </label>
              <input type="date" value={current.birthdate ?? ""} onChange={(e) => setF("birthdate", e.target.value)}
                className={inputCls} style={inputSty} />
            </div>
            <div><label className={lbl} style={{ color: "var(--muted)" }}>Bio / Notes</label>
              <textarea value={current.bio} onChange={(e) => setF("bio", e.target.value)} rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none transition"
                style={inputSty} placeholder="Développeur back-end…" /></div>

            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving || !form}
                className="rounded-lg px-5 py-2 text-sm font-semibold transition hover:opacity-85 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,var(--nebula),var(--indigo))", color: "#fff" }}>
                {saved ? "✓ Sauvegardé !" : saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        )}

        {/* ── Backup tab ── */}
        {tab === "backup" && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

            {/* Info strip */}
            <div className="rounded-xl p-3 text-xs" style={{ border: "1px solid var(--stroke)", background: "rgba(108,99,255,.06)" }}>
              <span className="font-semibold" style={{ color: "var(--halo)" }}>IndexedDB</span>
              <span style={{ color: "var(--muted)" }}> — données liées à ce navigateur/appareil. Dernier backup : </span>
              <span style={{ color: "var(--text)" }}>{fmtDate(lastBackup)}</span>
            </div>

            {/* Auto backup — dossier */}
            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ border: "1px solid var(--stroke)" }}>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text)" }}>Backup automatique sur disque</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {dirPickerSupported
                    ? isElectron()
                      ? "Sélectionne un dossier via le dialogue natif. Orbit y écrira automatiquement les backups, et à chaque fermeture de l'app."
                      : "Choisis un dossier local. Orbit y écrira un fichier JSON horodaté selon l'intervalle choisi."
                    : "⚠ Ton navigateur ne supporte pas la File System Access API (Chrome/Edge requis)."}
                </p>
              </div>

              {dirPickerSupported && (
                <>
                  {/* Dossier sélectionné */}
                  <div className="flex items-center gap-2">
                    <button onClick={handlePickDir}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition hover:opacity-85"
                      style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                      <FolderOpen size={13} />
                      {dirLabel ? `📁 ${dirLabel}` : "Choisir un dossier…"}
                    </button>
                    {dirLabel && (
                      <button onClick={handleClearDir} className="text-xs transition hover:opacity-70" style={{ color: "var(--muted)" }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Intervalle */}
                  <div>
                    <p className="text-[11px] mb-1.5" style={{ color: "var(--muted)" }}>Fréquence</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(INTERVAL_LABELS) as [BackupInterval, string][]).map(([k, label]) => (
                        <button key={k} onClick={() => handleIntervalChange(k)}
                          className="rounded-full px-2.5 py-1 text-xs transition"
                          style={interval === k
                            ? { border: "1px solid var(--nebula)", background: "rgba(108,99,255,.12)", color: "var(--halo)" }
                            : { border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Backup maintenant */}
                  {dirLabel && interval !== "off" && (
                    <button onClick={handleManualBackupToDir}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition hover:opacity-85 w-fit"
                      style={{ background: "linear-gradient(135deg,var(--nebula),var(--indigo))", color: "#fff" }}>
                      <RefreshCw size={12} /> Sauvegarder maintenant
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Export manuel */}
            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ border: "1px solid var(--stroke)" }}>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text)" }}>Export manuel (téléchargement)</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Télécharge un snapshot complet de toutes tes données.</p>
              </div>
              <button onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition hover:opacity-85 w-fit"
                style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                <Download size={13} /> Télécharger le backup
              </button>
            </div>

            {/* Restaurer */}
            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ border: "1px solid var(--stroke)" }}>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text)" }}>Restaurer depuis un fichier</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Importe un backup JSON — remplace toutes les données actuelles.</p>
              </div>
              {!confirmReset ? (
                <button onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition hover:opacity-80 w-fit"
                  style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                  <Upload size={13} /> Importer un backup
                </button>
              ) : (
                <div className="rounded-xl p-3 flex flex-col gap-3" style={{ border: "1px solid #CF2328", background: "rgba(207,35,40,.06)" }}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#CF2328" }} />
                    <p className="text-xs" style={{ color: "var(--text)" }}>
                      <strong>Attention</strong> — toutes tes données actuelles seront remplacées.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => backupRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={{ background: "#CF2328", color: "#fff" }}>
                      <Upload size={12} /> Confirmer et importer
                    </button>
                    <button onClick={() => setConfirmReset(false)}
                      className="text-xs px-3 py-1.5 rounded-lg hover:opacity-80 transition"
                      style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}>
                      Annuler
                    </button>
                  </div>
                  <input ref={backupRef} type="file" accept=".json" className="hidden"
                    onChange={(e) => handleImport(e.target.files)} />
                </div>
              )}
            </div>

            {backupStatus && (
              <p className="text-xs" style={{ color: backupStatus.startsWith("✓") ? "var(--nebula)" : backupStatus.startsWith("⚠") ? "#CF2328" : "var(--muted)" }}>
                {backupStatus}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
