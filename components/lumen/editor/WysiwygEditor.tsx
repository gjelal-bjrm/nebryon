"use client";

import { useEditor, EditorContent, Node, mergeAttributes } from "@tiptap/react";
import StarterKit      from "@tiptap/starter-kit";
import Underline       from "@tiptap/extension-underline";
import TextAlign       from "@tiptap/extension-text-align";
import { TextStyle }   from "@tiptap/extension-text-style";
import Color           from "@tiptap/extension-color";
import { Table }       from "@tiptap/extension-table";
import TableRow        from "@tiptap/extension-table-row";
import TableHeader     from "@tiptap/extension-table-header";
import TableCell       from "@tiptap/extension-table-cell";
import Image           from "@tiptap/extension-image";
import Link            from "@tiptap/extension-link";
import Placeholder     from "@tiptap/extension-placeholder";
import { useEffect }   from "react";
import EditorToolbar   from "./EditorToolbar";

// ── Custom Variable Node ──────────────────────────────────────────────────────
const VariableNode = Node.create({
  name:    "variable",
  group:   "inline",
  inline:  true,
  atom:    true,

  addAttributes() {
    return { name: { default: "" } };
  },

  parseHTML() {
    return [{ tag: "span[data-variable]", getAttrs: (el) => ({ name: (el as HTMLElement).dataset.variable }) }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-variable": node.attrs.name,
        title: `Champ automatique : ${node.attrs.name}`,
        style: "display:inline-block;background:rgba(14,165,233,.18);color:#0EA5E9;padding:1px 7px 1px 5px;border-radius:4px;font-family:monospace;font-size:0.82em;font-weight:600;user-select:all;cursor:default;border:1px solid rgba(14,165,233,.35);gap:4px",
      }),
      `◆ ${node.attrs.name}`,
    ];
  },
});

// ── HTML serialisation helper (replaces VariableNode back to {{ }}) ────────────
export function serializeToHtml(editor: ReturnType<typeof useEditor>): string {
  if (!editor) return "";
  // getHTML() already calls renderHTML which emits <span data-variable="x">{{ x }}</span>
  // We flatten to plain {{ x }} for the template engine
  const html = editor.getHTML();
  return html.replace(/<span[^>]*data-variable="([^"]+)"[^>]*>[^<]*<\/span>/g, "{{ $1 }}");
}

// ── CSS injected into the editor ──────────────────────────────────────────────
const EDITOR_CSS = `
  .lumen-editor {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.85;
    color: #111827;
    outline: none;
    min-height: 400px;
  }
  .lumen-editor h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
  .lumen-editor h2 { font-size: 17px; font-weight: 700; margin: 16px 0 6px; }
  .lumen-editor h3 { font-size: 14px; font-weight: 700; margin: 12px 0 4px; }
  .lumen-editor p  { margin: 0 0 8px; }
  .lumen-editor ul { list-style: disc;    padding-left: 1.5em; margin: 6px 0; }
  .lumen-editor ol { list-style: decimal; padding-left: 1.5em; margin: 6px 0; }
  .lumen-editor hr { border: none; border-top: 1px solid #d1d5db; margin: 14px 0; }
  .lumen-editor a  { color: #2563eb; text-decoration: underline; }
  .lumen-editor img { max-width: 100%; border-radius: 4px; }
  .lumen-editor blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; color: #6b7280; margin: 8px 0; }
  .lumen-editor table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .lumen-editor th  { background: #1d4ed8; color: #fff; padding: 8px 10px; text-align: left; font-size: 12px; }
  .lumen-editor td  { padding: 7px 10px; border: 1px solid #e5e7eb; font-size: 13px; }
  .lumen-editor tr:nth-child(even) td { background: #f9fafb; }
  /* table selected cell */
  .lumen-editor .selectedCell { background: rgba(14,165,233,.08) !important; }
  /* placeholder */
  .lumen-editor p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    color: #9ca3af;
    pointer-events: none;
    position: absolute;
  }
`;

// ── Export CSS (wraps TipTap output for Puppeteer) ────────────────────────────
export const EXPORT_DOC_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.85;
    color: #111827; padding: 36px 44px; }
  h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
  h2 { font-size: 17px; font-weight: 700; margin: 16px 0 6px; }
  h3 { font-size: 14px; font-weight: 700; margin: 12px 0 4px; }
  p  { margin-bottom: 8px; }
  ul { list-style: disc;    padding-left: 1.5em; margin: 6px 0; }
  ol { list-style: decimal; padding-left: 1.5em; margin: 6px 0; }
  hr { border: none; border-top: 1px solid #d1d5db; margin: 14px 0; }
  a  { color: #2563eb; text-decoration: underline; }
  img { max-width: 100%; border-radius: 4px; }
  blockquote { border-left: 3px solid #d1d5db; padding-left: 12px; color: #6b7280; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #1d4ed8; color: #fff; padding: 8px 10px; text-align: left; font-size: 12px; }
  td { padding: 7px 10px; border: 1px solid #e5e7eb; font-size: 13px; }
  tr:nth-child(even) td { background: #f9fafb; }
  [data-variable] { display:inline-block; background:#dbeafe; color:#1d4ed8;
    padding:0 4px; border-radius:3px; font-family:monospace; font-size:0.82em; font-weight:600; }
`;

/** Wraps TipTap HTML in a full HTML document ready for Puppeteer. */
export function buildExportHtml(bodyHtml: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>${EXPORT_DOC_CSS}</style></head><body>${bodyHtml}</body></html>`;
}

// ── WysiwygEditor component ───────────────────────────────────────────────────
interface Props {
  content:   string;          // Initial HTML content
  variables: string[];        // Variable names found in template
  onChange:  (html: string) => void;
}

export default function WysiwygEditor({ content, variables, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Commencez à écrire votre document…" }),
      VariableNode,
    ],
    content,
    editorProps: {
      attributes: { class: "lumen-editor" },
    },
    onUpdate({ editor }) {
      onChange(serializeToHtml(editor));
    },
  });

  // Sync content when preset changes
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <>
      {/* Inject editor CSS once */}
      <style>{EDITOR_CSS}</style>

      <div className="flex flex-col flex-1 min-h-0 rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--stroke)" }}>
        {/* Toolbar */}
        <EditorToolbar editor={editor} variables={variables} />

        {/* Paper canvas */}
        <div className="flex-1 overflow-auto p-4" style={{ background: "var(--card-bg)" }}>
          <div
            className="mx-auto rounded-xl p-8 shadow-sm"
            style={{
              background: "#ffffff",
              minHeight:  "600px",
              maxWidth:   "740px",
              boxShadow:  "0 2px 16px rgba(0,0,0,.12)",
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </>
  );
}
