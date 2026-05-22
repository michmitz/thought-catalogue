import { invoke } from "@tauri-apps/api/core";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EyeIcon, EyeOffIcon, FileIcon, NoteIcon } from "./icons";

const KIND_MAP: Record<string, string> = {
  jpg: "JPEG Image", jpeg: "JPEG Image", png: "PNG Image", gif: "GIF Image",
  webp: "WebP Image", svg: "SVG Image", bmp: "Bitmap Image", tiff: "TIFF Image",
  tif: "TIFF Image", ico: "Icon File",
  pdf: "PDF Document",
  mp3: "MP3 Audio", m4a: "M4A Audio", wav: "WAV Audio", aac: "AAC Audio",
  flac: "FLAC Audio", ogg: "OGG Audio",
  mp4: "MP4 Video", mov: "QuickTime Movie", avi: "AVI Video", mkv: "MKV Video",
  webm: "WebM Video",
  zip: "ZIP Archive", tar: "TAR Archive", gz: "GZip Archive", rar: "RAR Archive",
  "7z": "7-Zip Archive",
  docx: "Word Document", xlsx: "Excel Spreadsheet", pptx: "PowerPoint Presentation",
  doc: "Word Document", xls: "Excel Spreadsheet", ppt: "PowerPoint Presentation",
  sketch: "Sketch File", fig: "Figma File", xd: "Adobe XD File",
};

function fileKind(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return KIND_MAP[ext] ?? (ext ? `${ext.toUpperCase()} File` : "Unknown File");
}

const REMARK_PLUGINS = [remarkGfm];
import type { SelectedNote } from "../types";

type Props = {
  note: SelectedNote;
  onError: (message: string) => void;
  onRename: (newName: string) => void;
  previewMode: boolean;
  setPreviewMode: (v: boolean) => void;
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
    prefix: "- [ ]",
    suffix: "",
    cls: "font-mono text-[11px]",
  },
] as const;

export function NoteEditor({ note, onError, onRename, previewMode, setPreviewMode }: Props) {
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [readOk, setReadOk] = useState(false);
  const [fileViewMode, setFileViewMode] = useState<"text" | "metadata">("text");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef("");
  const lastSavedRef = useRef("");
  const onErrorRef = useRef(onError);
  const readOkRef = useRef(false);
  const isMd = note.name.endsWith(".md");

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
      setFileViewMode("text");
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
          const msg = String(err);
          if (msg.includes("UTF-8") || msg.includes("utf-8")) {
            setFileViewMode("metadata");
            setLoaded(true);
          } else {
            onErrorRef.current(msg);
            setLoaded(true);
          }
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
    setRenameValue(isMd ? note.name.replace(/\.md$/, "") : note.name);
    setIsRenaming(true);
    requestAnimationFrame(() => renameInputRef.current?.select());
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setIsRenaming(false);
      return;
    }
    const finalName = isMd
      ? trimmed.endsWith(".md") ? trimmed : `${trimmed}.md`
      : trimmed;
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

  const fullPath = `${note.base}/${note.name}`;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="h-11 flex items-center px-5 gap-2.5 flex-shrink-0 border-b border-border">
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
            className="flex-1 text-[14px] font-medium text-text bg-transparent border-none outline-none border-b border-text-faint min-w-0 focus:border-b focus:border-accent"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={startRename}
            title="Click to rename"
            className="flex-1 text-left text-[14px] font-medium text-text-muted truncate opacity-60 hover:opacity-85 cursor-default bg-transparent border-none"
          >
            {isMd ? note.name.replace(/\.md$/, "") : note.name}
          </button>
        )}
        {fileViewMode === "text" && (
          <>
            <span
              className={`text-[12px] text-text-faint transition-opacity duration-300 ${
                saveStatus === "idle" ? "opacity-0" : "opacity-35"
              }`}
            >
              {saveStatus === "saving" ? "Saving…" : "Saved"}
            </span>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              title={previewMode ? "Edit" : "Preview"}
              aria-label={
                previewMode ? "Switch to edit mode" : "Switch to preview mode"
              }
              aria-pressed={previewMode}
              className={`flex items-center justify-center p-[5px_7px] rounded-[5px] transition cursor-default ${
                previewMode
                  ? "opacity-90 text-accent"
                  : "opacity-35 text-text hover:opacity-70 hover:bg-hover"
              }`}
            >
              {previewMode ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </>
        )}
      </div>

      {fileViewMode === "text" && !previewMode && (
        <div className="flex items-center gap-0.5 px-5 h-[38px] border-b border-border flex-shrink-0">
          {FORMAT_BUTTONS.map(({ label, title, prefix, suffix, cls }) => (
            <button
              key={label}
              type="button"
              onClick={() => insertFormat(prefix, suffix)}
              title={title}
              aria-label={title}
              disabled={!readOk}
              className={`px-2 py-1 rounded-[var(--radius)] text-[13px] font-medium text-text opacity-35 hover:opacity-75 hover:bg-hover transition disabled:pointer-events-none ${cls}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {fileViewMode === "metadata" ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-5 text-center px-8">
              <FileIcon
                size={96}
                strokeWidth={1.0}
                className="text-text-faint opacity-40"
              />
              <div className="space-y-1">
                <p className="text-[15px] font-medium text-text">{note.name}</p>
                <p className="text-[13px] text-text-muted">{fileKind(note.name)}</p>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => invoke("open_file", { path: fullPath })}
                  className="px-3.5 py-2 text-[13px] rounded-[var(--radius)] font-medium transition"
                  style={{ backgroundColor: "var(--color-accent)", color: "var(--color-bg)" }}
                >
                  Open with default app
                </button>
                <button
                  type="button"
                  onClick={() => invoke("reveal_in_finder", { path: fullPath })}
                  className="px-3.5 py-2 text-[13px] rounded-[var(--radius)] text-text-muted border border-border hover:bg-hover transition"
                >
                  Show in Finder
                </button>
              </div>
            </div>
          </div>
        ) : previewMode ? (
          <div className="prose-warm px-16 py-9 max-w-[680px]">
            <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck
            className="block w-full min-h-full resize-none border-none outline-none bg-transparent px-16 py-9 text-text text-[17px] leading-[1.8] font-body placeholder:text-text-faint caret-accent max-w-[680px] disabled:opacity-40"
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
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted opacity-30">
      <NoteIcon size={36} strokeWidth={1.2} />
      <span className="text-[14px]">Select a note to open it</span>
      <span className="text-[12px] opacity-60">or create a new one</span>
    </div>
  );
}
