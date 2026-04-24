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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
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



  return (
    <div className="flex flex-col h-full min-h-0">
   
      <div className="h-11 flex items-center px-5 gap-2.5 flex-shrink-0 border-b border-warm-200">
        <span className="flex-1 text-[14px] font-medium text-warm-500 truncate opacity-60">
          {note.name.replace(/\.md$/, "")}
        </span>
        <span
          className={`text-[12px] text-warm-400 transition-opacity duration-300 ${
            saveStatus === "idle" ? "opacity-0" : "opacity-35"
          }`}
        >
          {saveStatus === "saving" ? "Saving…" : "Saved"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck
          className="block w-full min-h-full resize-none border-none outline-none bg-transparent px-16 py-9 text-warm-900 text-[17px] leading-[1.8] font-prose placeholder:text-warm-400 caret-accent-500 max-w-[680px] disabled:opacity-40"
          placeholder="Start writing…"
          disabled={!loaded || !readOk}
        />
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
