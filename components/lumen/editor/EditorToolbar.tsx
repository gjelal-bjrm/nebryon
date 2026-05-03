"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered,
  Table, Minus,
  Undo2, Redo2,
  Link, ImageIcon, Braces,
} from "lucide-react";

const ACCENT = "#0EA5E9";

interface Props {
  editor:    Editor | null;
  variables: string[];
}

function Btn({
  active, disabled = false, onClick, title, children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center w-7 h-7 rounded transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        background: active ? "rgba(14,165,233,.18)" : "transparent",
        color:      active ? ACCENT : "var(--text)",
        border:     active ? "1px solid rgba(14,165,233,.3)" : "1px solid transparent",
      }}
      onMouseEnter={(e) => { if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.06)"; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 mx-0.5 flex-shrink-0" style={{ background: "var(--stroke)" }} />;
}

export default function EditorToolbar({ editor, variables }: Props) {
  if (!editor) return null;

  const insertVariable = (v: string) => {
    editor.chain().focus().insertContent({
      type: "variable",
      attrs: { name: v },
    }).run();
  };

  const addImage = () => {
    const url = prompt("URL de l'image :");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addLink = () => {
    const url = prompt("URL du lien :");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--stroke)", background: "var(--nav-bg)" }}
    >
      {/* History */}
      <Btn onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()} title="Annuler (Ctrl+Z)">
        <Undo2 size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()} title="Refaire (Ctrl+Y)">
        <Redo2 size={13} />
      </Btn>

      <Sep />

      {/* Text style */}
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras (Ctrl+B)">
        <Bold size={13} />
      </Btn>
      <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique (Ctrl+I)">
        <Italic size={13} />
      </Btn>
      <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligné (Ctrl+U)">
        <Underline size={13} />
      </Btn>
      <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Barré">
        <Strikethrough size={13} />
      </Btn>

      <Sep />

      {/* Headings */}
      <Btn active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Titre 1">
        <Heading1 size={13} />
      </Btn>
      <Btn active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titre 2">
        <Heading2 size={13} />
      </Btn>
      <Btn active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Titre 3">
        <Heading3 size={13} />
      </Btn>

      <Sep />

      {/* Alignment */}
      <Btn active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Aligner à gauche">
        <AlignLeft size={13} />
      </Btn>
      <Btn active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centrer">
        <AlignCenter size={13} />
      </Btn>
      <Btn active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Aligner à droite">
        <AlignRight size={13} />
      </Btn>

      <Sep />

      {/* Lists */}
      <Btn active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">
        <List size={13} />
      </Btn>
      <Btn active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
        <ListOrdered size={13} />
      </Btn>

      <Sep />

      {/* Insert */}
      <Btn onClick={insertTable} title="Insérer un tableau">
        <Table size={13} />
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Ligne horizontale">
        <Minus size={13} />
      </Btn>
      <Btn onClick={addImage} title="Insérer une image">
        <ImageIcon size={13} />
      </Btn>
      <Btn onClick={addLink} title="Insérer un lien">
        <Link size={13} />
      </Btn>

      {/* Text color */}
      <Sep />
      <label className="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer text-[11px] transition hover:opacity-80"
        style={{ border: "1px solid var(--stroke)", color: "var(--muted)" }}
        title="Couleur du texte">
        <span className="text-[10px]">A</span>
        <input
          type="color"
          className="w-4 h-4 rounded cursor-pointer border-none bg-transparent"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          title="Choisir une couleur"
          style={{ padding: 0 }}
        />
      </label>

      {/* Variables */}
      {variables.length > 0 && (
        <>
          <Sep />
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer"
              style={{ border: "1px solid rgba(14,165,233,.3)", background: "rgba(14,165,233,.08)", color: ACCENT }}
              title="Insérer une variable"
            >
              <Braces size={12} /> Variables
            </button>
            {/* Dropdown */}
            <div
              className="absolute top-full left-0 mt-1 z-50 rounded-xl overflow-hidden hidden group-hover:block group-focus-within:block"
              style={{ background: "var(--card)", border: "1px solid var(--stroke)", minWidth: "180px", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}
            >
              {variables.map((v) => (
                <button key={v} type="button"
                  onClick={() => insertVariable(v)}
                  className="w-full text-left px-3 py-2 text-[11px] font-mono transition cursor-pointer hover:opacity-80"
                  style={{ color: ACCENT, background: "transparent", display: "block" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(14,165,233,.1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {`{{ ${v} }}`}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
