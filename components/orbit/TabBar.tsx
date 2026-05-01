"use client";

import { X, Plus } from "lucide-react";
import type { OrbitRequest } from "@/lib/orbit/types";

export interface TabInfo {
  key: string;
  req: OrbitRequest;
  metaName: string | null;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "#22c55e", POST: "#6C63FF", PUT: "#D4A84B",
  PATCH: "#E8820C", DELETE: "#CF2328", HEAD: "#4A5070", OPTIONS: "#4A5070",
};

function tabLabel(tab: TabInfo): string {
  if (tab.metaName) return tab.metaName;
  if (!tab.req.url) return "New Request";
  try {
    const u = new URL(tab.req.url);
    const segs = u.pathname.split("/").filter(Boolean);
    return segs[segs.length - 1] || u.hostname || "New Request";
  } catch {
    const segs = tab.req.url.split("/").filter(Boolean);
    return segs[segs.length - 1] || tab.req.url || "New Request";
  }
}

interface Props {
  tabs: TabInfo[];
  activeKey: string;
  onSwitch: (key: string) => void;
  onClose: (key: string) => void;
  onNew: () => void;
}

export default function TabBar({ tabs, activeKey, onSwitch, onClose, onNew }: Props) {
  return (
    <div
      className="flex items-stretch flex-shrink-0 overflow-x-auto"
      style={{
        background: "var(--nav-bg)",
        borderBottom: "1px solid var(--stroke)",
        minHeight: "36px",
        userSelect: "none",
        // hide scrollbar but keep scrollable
        scrollbarWidth: "none",
      }}
    >
      {tabs.map(tab => {
        const active = tab.key === activeKey;
        return (
          <div
            key={tab.key}
            onClick={() => onSwitch(tab.key)}
            className="group flex items-center gap-1.5 px-3 cursor-pointer transition-colors flex-shrink-0 relative"
            style={{
              borderRight: "1px solid var(--stroke)",
              background: active ? "var(--bg)" : "transparent",
              minWidth: "120px",
              maxWidth: "200px",
              height: "36px",
            }}
          >
            {/* Active underline */}
            {active && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "var(--nebula)",
                }}
              />
            )}

            {/* Method badge */}
            <span
              className="text-[10px] font-bold flex-shrink-0"
              style={{ color: METHOD_COLORS[tab.req.method] ?? "#888" }}
            >
              {tab.req.method}
            </span>

            {/* Tab name */}
            <span
              className="text-xs truncate flex-1"
              style={{ color: active ? "var(--text)" : "var(--muted)" }}
            >
              {tabLabel(tab)}
            </span>

            {/* Close button — visible on hover */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(tab.key); }}
              className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded
                         opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--muted)" }}
              title="Close tab"
            >
              <X size={10} />
            </button>
          </div>
        );
      })}

      {/* New tab */}
      <button
        onClick={onNew}
        className="flex items-center justify-center px-2.5 flex-shrink-0 transition-opacity hover:opacity-70"
        style={{ color: "var(--muted)" }}
        title="New request (Ctrl+T)"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
