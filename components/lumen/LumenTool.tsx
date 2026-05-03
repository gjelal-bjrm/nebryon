"use client";

import { useState, useCallback } from "react";
import { FileCode2, Database, Zap } from "lucide-react";
import { detectVariables } from "@/lib/lumen/templateEngine";
import type { DataRow } from "@/lib/lumen/templateEngine";
import TemplateTab, { DEFAULT_TEMPLATE } from "./TemplateTab";
import DataTab     from "./DataTab";
import GenerateTab from "./GenerateTab";

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1 as Step, label: "Modèle",  icon: FileCode2 },
  { id: 2 as Step, label: "Données", icon: Database  },
  { id: 3 as Step, label: "Générer", icon: Zap       },
];

export default function LumenTool() {
  const [step,     setStep]     = useState<Step>(1);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [data,     setData]     = useState<DataRow[]>([]);
  const [columns,  setColumns]  = useState<string[]>([]);
  const [mapping,  setMapping]  = useState<Record<string, string>>({});

  const variables = detectVariables(template);

  const handleDataChange = useCallback((rows: DataRow[], cols: string[]) => {
    setData(rows);
    setColumns(cols);
  }, []);

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Step indicator */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {STEPS.map((s, idx) => {
          const Icon    = s.icon;
          const isDone  = s.id < step;
          const isActive = s.id === step;
          return (
            <div key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => s.id <= step && setStep(s.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                style={{
                  cursor:     s.id <= step ? "pointer" : "default",
                  background: isActive ? "rgba(246,173,85,.12)" : "transparent",
                  color:      isActive ? "#F6AD55" : isDone ? "var(--text)" : "var(--muted)",
                  border:     `1px solid ${isActive ? "rgba(246,173,85,.35)" : "transparent"}`,
                }}
              >
                <Icon size={13} />
                {s.label}
              </button>
              {idx < STEPS.length - 1 && (
                <span className="text-[10px] px-1" style={{ color: "var(--stroke)" }}>›</span>
              )}
            </div>
          );
        })}

        {/* Summary pills on the right */}
        <div className="ml-auto flex items-center gap-2">
          {variables.length > 0 && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full"
              style={{ background: "rgba(246,173,85,.1)", color: "#F6AD55", border: "1px solid rgba(246,173,85,.2)" }}>
              {variables.length} var.
            </span>
          )}
          {data.length > 0 && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full"
              style={{ background: "rgba(72,187,120,.1)", color: "#48BB78", border: "1px solid rgba(72,187,120,.2)" }}>
              {data.length} ligne{data.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="flex-shrink-0 h-px" style={{ background: "var(--stroke)" }} />

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {step === 1 && (
          <TemplateTab
            template={template}
            onChange={setTemplate}
            onContinue={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <DataTab
            variables={variables}
            data={data}
            columns={columns}
            mapping={mapping}
            onDataChange={handleDataChange}
            onMappingChange={setMapping}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <GenerateTab
            template={template}
            data={data}
            mapping={mapping}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
