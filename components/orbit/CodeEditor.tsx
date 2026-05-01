"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { json } from "@codemirror/lang-json";

/**
 * Always-dark code editor regardless of app light/dark mode.
 * Explicit text colours avoid inheriting from the surrounding theme.
 */
const orbitTheme = EditorView.theme(
  {
    "&": {
      background: "#0d1117",
      height: "100%",
      fontSize: "12.5px",
      color: "#c9d1d9",
    },
    ".cm-scroller": {
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      overflow: "auto",
    },
    ".cm-content": {
      caretColor: "#6C63FF",
      padding: "8px 0",
      color: "#c9d1d9",
    },
    ".cm-line": {
      padding: "0 12px",
      color: "#c9d1d9",
    },
    ".cm-cursor": { borderLeftColor: "#6C63FF" },
    ".cm-selectionBackground, ::selection": {
      background: "rgba(108,99,255,.35) !important",
    },
    ".cm-activeLine": { background: "rgba(108,99,255,.08)" },
    ".cm-gutters": {
      background: "#0d1117",
      borderRight: "1px solid #1e2937",
      color: "#484f58",
    },
    ".cm-lineNumbers .cm-gutterElement": { minWidth: "36px" },
    ".cm-matchingBracket": {
      background: "rgba(108,99,255,.25)",
      outline: "none",
    },
    /* JSON syntax tokens */
    ".cm-s-default .cm-keyword":  { color: "#ff7b72" },
    ".ͼ4":  { color: "#79c0ff" },  /* property name */
    ".ͼ5":  { color: "#a5d6ff" },  /* string value */
    ".ͼ6":  { color: "#f2cc60" },  /* number */
    ".ͼ7":  { color: "#56d364" },  /* bool/null */
    ".ͼ8":  { color: "#8b949e" },  /* comment */
    /* Generic tokens from builtin highlighting */
    ".cm-string":       { color: "#a5d6ff" },
    ".cm-number":       { color: "#f2cc60" },
    ".cm-bool":         { color: "#56d364" },
    ".cm-null":         { color: "#56d364" },
    ".cm-propertyName": { color: "#79c0ff" },
    ".cm-punctuation":  { color: "#8b949e" },
    /* Placeholder text */
    ".cm-placeholder":  { color: "#484f58" },
  },
  { dark: true }
);

interface Props {
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  lang?: "json" | "text";
  minHeight?: string;
}

export default function CodeEditor({
  value,
  onChange,
  readOnly = false,
  lang = "text",
  minHeight = "120px",
}: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const viewRef       = useRef<EditorView | null>(null);
  const onChangeRef   = useRef(onChange);
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

  // Sync external value changes
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
      className="w-full h-full"
      style={{ minHeight, background: "#0d1117" }}
    />
  );
}
