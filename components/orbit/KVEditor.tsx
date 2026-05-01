"use client";

import { Plus, Trash2 } from "lucide-react";
import type { KVPair } from "@/lib/orbit/types";
import { newKV } from "@/lib/orbit/types";

interface Props {
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export default function KVEditor({ pairs, onChange, keyPlaceholder = "Clé", valuePlaceholder = "Valeur" }: Props) {
  const update = (id: string, field: keyof KVPair, value: string | boolean) =>
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const remove = (id: string) => onChange(pairs.filter((p) => p.id !== id));
  const add = () => onChange([...pairs, newKV()]);

  const inputCls = "flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs bg-transparent focus:outline-none transition";
  const inputStyle = { border: "1px solid var(--stroke)", color: "var(--text)" };

  return (
    <div className="flex flex-col gap-1.5">
      {pairs.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={p.enabled}
            onChange={(e) => update(p.id, "enabled", e.target.checked)}
            className="accent-[var(--nebula)] flex-shrink-0"
          />
          <input
            value={p.key}
            onChange={(e) => update(p.id, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className={inputCls}
            style={{ ...inputStyle, opacity: p.enabled ? 1 : 0.4 }}
          />
          <input
            value={p.value}
            onChange={(e) => update(p.id, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className={inputCls}
            style={{ ...inputStyle, opacity: p.enabled ? 1 : 0.4 }}
          />
          <button onClick={() => remove(p.id)} className="flex-shrink-0 transition hover:opacity-80" style={{ color: "var(--muted)" }}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs transition hover:opacity-80 w-fit mt-1"
        style={{ color: "var(--nebula)" }}
      >
        <Plus size={13} /> Ajouter
      </button>
    </div>
  );
}
