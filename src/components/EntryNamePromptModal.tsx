import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { EntryPromptMode } from "../types";

type Props = {
  mode: EntryPromptMode;
  defaultName: string;
  error: string | null;
  onConfirm: (name: string) => void;
  onCancel: () => void;
};

export function EntryNamePromptModal({ mode, defaultName, error, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [mode]);

  if (!mode) return null;

  const title = mode === "folder" ? "New folder" : "New note";
  const label = mode === "folder" ? "Folder name" : "Note name";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg rounded-[var(--radius)] shadow-2xl border border-border p-6 w-[360px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-text mb-3">{title}</h3>
        <label className="block text-xs text-text-muted mb-1">{label}</label>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm(value.trim());
            if (e.key === "Escape") onCancel();
          }}
          className="w-full px-3 py-2 border border-border rounded-[var(--radius)] bg-sidebar text-text placeholder:text-text-faint focus:outline-none focus:border-text-muted"
          placeholder={mode === "note" ? "e.g. my-note" : "e.g. My Folder"}
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-text-muted hover:bg-hover rounded-[var(--radius)] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(value.trim())}
            className="px-3 py-1.5 text-sm bg-accent text-bg rounded-[var(--radius)] hover:brightness-90 transition"
          >
            Create
          </button>
        </div>
      </motion.div>
    </div>
  );
}
