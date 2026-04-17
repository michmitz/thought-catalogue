import { invoke } from "@tauri-apps/api/core";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SelectedNote } from "../types";

type Props = {
  note: SelectedNote;
  onError: (message: string) => void;
};

export function NoteEditor({ note, onError }: Props) {
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [readOk, setReadOk] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
        const text = await invoke<string>("read_note", { base: note.base, name: note.name });
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
    return () => { cancelled = true; };
  }, [note.base, note.name]);

  useEffect(() => {
    if (!loaded || !readOk) return;
    if (content === lastSavedRef.current) return;
    const t = window.setTimeout(async () => {
      const c = contentRef.current;
      if (c === lastSavedRef.current) return;
      setSaveStatus("saving");
      try {
        await invoke("write_note", { base: note.base, name: note.name, content: c });
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

  function insertParagraphBreak() {
    if (!readOk) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setContent((prev) => prev.slice(0, start) + "\n\n" + prev.slice(end));
    const cursor = start + 2;
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-4 mb-3 flex-shrink-0">
        <h2 className="text-sm font-medium text-neutral-800 truncate">{note.name}</h2>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-neutral-400 tabular-nums">
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" && "Saved"}
          </span>
          <div className="flex items-center gap-1 border border-neutral-200 rounded-md bg-neutral-50 p-0.5">
            <button
              type="button"
              onClick={insertParagraphBreak}
              disabled={!readOk}
              className="px-2.5 py-1 text-xs text-neutral-700 rounded hover:bg-white hover:shadow-sm transition disabled:opacity-40 disabled:pointer-events-none"
              title="Insert a paragraph break (blank line)"
            >
              Paragraph
            </button>
          </div>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck
        className="flex-1 w-full min-h-[200px] resize-none rounded-lg border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-neutral-800 text-[15px] leading-relaxed placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:bg-white font-sans"
        placeholder="Write here. Use Paragraph in the toolbar or press Enter twice for a new paragraph."
        disabled={!loaded || !readOk}
      />
    </div>
  );
}

export function NoteEditorPlaceholder() {
  return (
    <div className="text-neutral-500">
      Select a note from the library to read or edit it.
    </div>
  );
}
