import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

type Entry = {
  name: string;
  is_dir: boolean;
};

type EntryPromptMode = "folder" | "note" | null;

function EntryNamePromptModal({
  mode,
  defaultName,
  error,
  onConfirm,
  onCancel,
}: {
  mode: EntryPromptMode;
  defaultName: string;
  error: string | null;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl p-6 w-[320px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-neutral-900 mb-3">{title}</h3>
        <label className="block text-xs text-neutral-500 mb-1">{label}</label>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirm(value.trim());
            if (e.key === "Escape") onCancel();
          }}
          className="w-full px-3 py-2 border border-neutral-200 rounded text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
          placeholder={mode === "note" ? "e.g. my-note.md" : "e.g. My Folder"}
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(value.trim())}
            className="px-3 py-1.5 text-sm bg-neutral-900 text-white rounded hover:bg-neutral-800"
          >
            Create
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Sidebar({
  open,
  files,
  onOpenFolder,
  onBack,
  canGoBack,
  currentPath,
  onAddFolder,
  onAddNote,
}: {
  open: boolean;
  files: Entry[];
  onOpenFolder: (name: string) => void;
  onBack: () => void;
  canGoBack: boolean;
  currentPath: string | null;
  onAddFolder: () => void;
  onAddNote: () => void;
}) {
  return (
    <motion.div
      animate={{ width: open ? 260 : 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden border-r border-neutral-200 bg-neutral-50"
    >
      <div className="p-6 space-y-2">
        {currentPath && (
          <div className="text-xs text-neutral-400 mb-4 break-all">
            {currentPath}
          </div>
        )}

        {canGoBack && (
          <div
            onClick={onBack}
            className="text-neutral-400 cursor-pointer mb-4 hover:text-neutral-800 transition"
          >
            ← Back
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={onAddFolder}
            disabled={!currentPath}
            className="text-xs px-2 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Folder
          </button>
          <button
            type="button"
            onClick={onAddNote}
            disabled={!currentPath}
            className="text-xs px-2 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Note
          </button>
        </div>

        {files.map((file) => (
          <motion.div
            key={file.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onClick={() => file.is_dir && onOpenFolder(file.name)}
            className="text-neutral-600 cursor-pointer hover:text-neutral-900 transition"
          >
            {file.is_dir ? "📁" : "📝"} {file.name}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function TopBar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}) {
  return (
    <div className="px-8 pt-8 pb-4 border-b border-neutral-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium">Thoughts</div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition"
        >
          {sidebarOpen ? "Hide Library" : "Show Library"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [files, setFiles] = useState<Entry[]>([]);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [promptMode, setPromptMode] = useState<EntryPromptMode>(null);
  const [promptError, setPromptError] = useState<string | null>(null);

  // Initial folder load
  useEffect(() => {
    async function init() {
      let saved = await invoke<string | null>("get_saved_folder");

      if (!saved) {
        const selected = await open({
          directory: true,
          multiple: false,
        });

        if (typeof selected === "string") {
          await invoke("choose_folder", { path: selected });
          saved = selected;
        }
      }

      if (saved) {
        setPathStack([saved]);

        const contents = await invoke<Entry[]>("read_folder", {
          base: saved,
          child: null,
        });

        setFiles(contents);
      }
    }

    init();
  }, []);

  async function openFolder(name: string) {
    const currentPath = pathStack[pathStack.length - 1];
    if (!currentPath) return;

    const contents = await invoke<Entry[]>("read_folder", {
      base: currentPath,
      child: name,
    });

    const newPath = `${currentPath}/${name}`;

    setPathStack([...pathStack, newPath]);
    setFiles(contents);
  }

  async function goBack() {
    if (pathStack.length <= 1) return;

    const newStack = pathStack.slice(0, -1);
    const parentPath = newStack[newStack.length - 1];

    const contents = await invoke<Entry[]>("read_folder", {
      base: parentPath,
      child: null,
    });

    setPathStack(newStack);
    setFiles(contents);
  }

  async function refreshFiles() {
    const path = pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;
    if (!path) return;
    const contents = await invoke<Entry[]>("read_folder", {
      base: path,
      child: null,
    });
    setFiles(contents);
  }

  function hasEntry(name: string) {
    return files.some((e) => e.name === name);
  }

  function handleAddFolder() {
    if (!currentPath) return;
    setPromptError(null);
    setPromptMode("folder");
  }

  function handleAddNote() {
    if (!currentPath) return;
    setPromptError(null);
    setPromptMode("note");
  }

  async function handlePromptConfirm(name: string) {
    const path = pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;
    if (!path || !promptMode) return;

    if (!name) {
      setPromptError("Name cannot be empty.");
      return;
    }
    if (hasEntry(name)) {
      setPromptError("A folder or note with that name already exists.");
      return;
    }

    setPromptError(null);
    try {
      if (promptMode === "folder") {
        await invoke("create_folder", { base: path, name });
      } else {
        await invoke("create_note", { base: path, name });
      }
      await refreshFiles();
      setPromptMode(null);
    } catch (err) {
      setPromptError("Could not create. " + (err as Error).message);
    }
  }

  function handlePromptCancel() {
    setPromptMode(null);
    setPromptError(null);
  }

  const currentPath =
    pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;

  return (
    <div className="h-screen bg-neutral-100 text-neutral-900 flex flex-col">
      <EntryNamePromptModal
        key={promptMode ?? "closed"}
        mode={promptMode}
        defaultName={promptMode === "note" ? "new-note.md" : ""}
        error={promptError}
        onConfirm={handlePromptConfirm}
        onCancel={handlePromptCancel}
      />
      <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          files={files}
          onOpenFolder={openFolder}
          onBack={goBack}
          canGoBack={pathStack.length > 1}
          currentPath={currentPath}
          onAddFolder={handleAddFolder}
          onAddNote={handleAddNote}
        />

        <div className="flex-1 p-8 bg-white">
          <div className="text-neutral-500">
            Select a folder or note from the sidebar.
          </div>
        </div>
      </div>
    </div>
  );
}
