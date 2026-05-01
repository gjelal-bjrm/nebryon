"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { json } from "@codemirror/lang-json";

const orbitTheme = EditorView.theme({
  "&": { background: "transparent", height: "100%", fontSize: "12px" },
  ".cm-scroller": { fontFamily: "'JetBrains Mono', 'Fira Code', monospace", overflow: "auto" },
  ".cm-content": { caretColor: "#6C63FF", padding: "8px 0" },
  ".cm-line": { padding: "0 12px" },
  ".cm-cursor": { borderLeftColor: "#6C63FF" },
  ".cm-selectionBackground, ::selection": { background: "rgba(108,99,255,.25) !important" },
  ".cm-activeLine": { background: "rgba(108,99,255,.06)" },
  ".cm-gutters": { background: "#08091F", borderRight: "1px solid #1A1E3A", color: "#3D4270" },
  ".cm-lineNumbers .cm-gutterElement": { minWidth: "32px" },
  ".cm-matchingBracket": { background: "rgba(108,99,255,.2)", outline: "none" },
}, { dark: true });

interface Props {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  lang?: "json" | "text";
  minHeight?: string;
}

export default function CodeEditor({ value, onChange, readOnly = false, lang = "text", minHeight = "120px" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      basicSetup,
      orbitTheme,
      EditorView.lineWrapping,
      ...(lang === "json" ? [json()] : []),
      ...(readOnly ? [EditorState.readOnly.of(true)] : []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
    ];

    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, lang]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-auto"
      style={{ minHeight, background: "#08091F", borderRadius: "inherit" }}
    />
  );
}
