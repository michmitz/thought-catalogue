import { invoke } from "@tauri-apps/api/core";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { SelectedNote } from "../types";

function EyeIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

type Props = {
  note: SelectedNote;
  onError: (message: string) => void;
  onRename: (newName: string) => void;
};

const FORMAT_BUTTONS = [
  { label: "B", title: "Bold", prefix: "**", suffix: "**", cls: "font-bold" },
  { label: "I", title: "Italic", prefix: "*", suffix: "*", cls: "italic" },
  {
    label: "H1",
    title: "Heading 1",
    prefix: "# ",
    suffix: "",
    cls: "text-[11px]",
  },
  {
    label: "H2",
    title: "Heading 2",
    prefix: "## ",
    suffix: "",
    cls: "text-[11px]",
  },
  { label: "—", title: "Divider", prefix: "\n---\n", suffix: "", cls: "" },
  {
    label: "[X]",
    title: "Task",
    prefix: "- [ ] ",
    suffix: "",
    cls: "font-mono text-[11px]",
  },
] as const;

export function NoteEditor({ note, onError, onRename }: Props) {
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [readOk, setReadOk] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef("");
  const lastSavedRef = useRef("");
  const onErrorRef = useRef(onError);
  const readOkRef = useRef(false);

  useLayoutEffect(() => {
    contentRef.current = content;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoaded(false);
      readOkRef.current = false;
      setReadOk(false);
      setSaveStatus("idle");
      try {
        const text = await invoke<string>("read_note", {
          base: note.base,
          name: note.name,
        });
        if (!cancelled) {
          setContent(text);
          lastSavedRef.current = text;
          readOkRef.current = true;
          setReadOk(true);
          setLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current(String(err));
          setContent("");
          readOkRef.current = false;
          setReadOk(false);
          setLoaded(true);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [note.base, note.name]);

  useEffect(() => {
    if (!loaded || !readOk) return;
    if (content === lastSavedRef.current) return;
    const t = window.setTimeout(async () => {
      const c = contentRef.current;
      if (c === lastSavedRef.current) return;
      setSaveStatus("saving");
      try {
        await invoke("write_note", {
          base: note.base,
          name: note.name,
          content: c,
        });
        lastSavedRef.current = c;
        setSaveStatus("saved");
        window.setTimeout(() => setSaveStatus("idle"), 1200);
      } catch (err) {
        setSaveStatus("idle");
        onErrorRef.current(String(err));
      }
    }, 450);
    return () => window.clearTimeout(t);
  }, [content, loaded, readOk, note.base, note.name]);

  useEffect(() => {
    const base = note.base;
    const name = note.name;
    return () => {
      if (!readOkRef.current) return;
      const c = contentRef.current;
      if (c !== lastSavedRef.current) {
        invoke("write_note", { base, name, content: c }).catch(console.error);
      }
    };
  }, [note.base, note.name]);

  function startRename() {
    setRenameValue(note.name.replace(/\.md$/, ""));
    setIsRenaming(true);
    requestAnimationFrame(() => renameInputRef.current?.select());
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setIsRenaming(false);
      return;
    }
    const finalName = trimmed.endsWith(".md") ? trimmed : `${trimmed}.md`;
    setIsRenaming(false);
    if (finalName !== note.name) onRename(finalName);
  }

  function insertFormat(prefix: string, suffix = "") {
    const ta = textareaRef.current;
    if (!ta || !readOk) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const next =
      content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="h-11 flex items-center px-5 gap-2.5 flex-shrink-0 border-b border-warm-200">
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setIsRenaming(false);
              }
            }}
            className="flex-1 text-[14px] font-medium text-warm-900 bg-transparent border-none outline-none border-b border-warm-400 min-w-0 focus:border-b focus:border-accent-500"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={startRename}
            title="Click to rename"
            className="flex-1 text-left text-[14px] font-medium text-warm-500 truncate opacity-60 hover:opacity-85 cursor-default bg-transparent border-none"
          >
            {note.name.replace(/\.md$/, "")}
          </button>
        )}
        <span
          className={`text-[12px] text-warm-400 transition-opacity duration-300 ${
            saveStatus === "idle" ? "opacity-0" : "opacity-35"
          }`}
        >
          {saveStatus === "saving" ? "Saving…" : "Saved"}
        </span>
        <button
          type="button"
          onClick={() => setPreviewMode((v) => !v)}
          title={previewMode ? "Edit" : "Preview"}
          aria-label={
            previewMode ? "Switch to edit mode" : "Switch to preview mode"
          }
          aria-pressed={previewMode}
          className={`flex items-center justify-center p-[5px_7px] rounded-[5px] transition cursor-default ${
            previewMode
              ? "opacity-90 text-accent-500"
              : "opacity-35 text-warm-900 hover:opacity-70 hover:bg-black/[0.06]"
          }`}
        >
          {previewMode ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {!previewMode && (
        <div className="flex items-center gap-0.5 px-5 h-[38px] border-b border-warm-200 flex-shrink-0">
          {FORMAT_BUTTONS.map(({ label, title, prefix, suffix, cls }) => (
            <button
              key={label}
              type="button"
              onClick={() => insertFormat(prefix, suffix)}
              title={title}
              aria-label={title}
              disabled={!readOk}
              className={`px-2 py-1 rounded text-[13px] font-medium text-warm-900 opacity-35 hover:opacity-75 hover:bg-black/5 transition disabled:pointer-events-none ${cls}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {previewMode ? (
          <div className="prose-warm px-16 py-9 max-w-[680px]">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck
            className="block w-full min-h-full resize-none border-none outline-none bg-transparent px-16 py-9 text-warm-900 text-[17px] leading-[1.8] font-prose placeholder:text-warm-400 caret-accent-500 max-w-[680px] disabled:opacity-40"
            placeholder="Start writing…"
            disabled={!loaded || !readOk}
          />
        )}
      </div>
    </div>
  );
}

export function NoteEditorPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-warm-500 opacity-30">
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
      <span className="text-[14px]">Select a note to open it</span>
      <span className="text-[12px] opacity-60">or create a new one</span>
    </div>
  );
}
