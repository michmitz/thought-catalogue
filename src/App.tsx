import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { motion } from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { MdNotes } from "react-icons/md";
import { FaRegFolder, FaThumbtack, FaTrash } from "react-icons/fa";

type Entry = {
  name: string;
  is_dir: boolean;
};

type PinnedEntry = {
  path: string;
  is_dir: boolean;
};

type EntryPromptMode = "folder" | "note" | null;

function getInvokeErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return String(err);
}

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
  onSelectNote,
  selectedNote,
  onBack,
  canGoBack,
  currentPath,
  onAddFolder,
  onAddNote,
  onDeleteEntry,
  pinnedPaths,
  pinnedEntries,
  onTogglePin,
  onUnpinPath,
  onNavigateToPinned,
}: {
  open: boolean;
  files: Entry[];
  onOpenFolder: (name: string) => void;
  onSelectNote: (entry: Entry) => void;
  selectedNote: { base: string; name: string } | null;
  onBack: () => void;
  canGoBack: boolean;
  currentPath: string | null;
  onAddFolder: () => void;
  onAddNote: () => void;
  onDeleteEntry: (entry: Entry) => void;
  pinnedPaths: Set<string>;
  pinnedEntries: PinnedEntry[];
  onTogglePin: (entry: Entry) => void;
  onUnpinPath: (fullPath: string) => void;
  onNavigateToPinned: (entry: PinnedEntry) => void;
}) {
  const pinnedList = [...pinnedEntries].sort((a, b) =>
    a.path.localeCompare(b.path),
  );

  return (
    <motion.div
      animate={{ width: open ? 260 : 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden border-r border-neutral-200 bg-neutral-50"
    >
      <div className="p-6 space-y-2">

        {pinnedList.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
              Pinned
            </div>
            <div className="space-y-0.5">
              {pinnedList.map((pin) => {
                const name =
                  pin.path.split("/").filter(Boolean).pop() ?? pin.path;
                const isSelectedNote =
                  !pin.is_dir &&
                  selectedNote &&
                  `${selectedNote.base}/${selectedNote.name}` === pin.path;
                return (
                  <div
                    key={pin.path}
                    className={`group flex items-center gap-2 rounded hover:bg-amber-50/80 py-0.5 ${
                      isSelectedNote
                        ? "text-amber-950 font-medium"
                        : "text-blue-900/90 hover:text-amber-900"
                    }`}
                  >
                    <div
                      onClick={() => onNavigateToPinned(pin)}
                      className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
                    >
                      {pin.is_dir ? (
                        <FaRegFolder className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <MdNotes className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="truncate text-sm">{name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnpinPath(pin.path);
                      }}
                      className="cursor-pointer p-1 rounded transition flex-shrink-0 opacity-0 group-hover:opacity-100 text-amber-600 hover:bg-amber-50"
                      title="Unpin"
                      aria-label="Unpin"
                    >
                      <FaThumbtack className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
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

        {/* {currentPath && (
          <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
            This folder
          </div>
        )} */}

        {files.map((file) => {
          const fullPath = currentPath ? `${currentPath}/${file.name}` : "";
          const isPinned = fullPath ? pinnedPaths.has(fullPath) : false;
          if (isPinned) return null;
          return (
            <motion.div
              key={file.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="group flex items-center gap-2 rounded hover:bg-neutral-100/80"
            >
              <div
                onClick={() =>
                  file.is_dir
                    ? onOpenFolder(file.name)
                    : onSelectNote(file)
                }
                className={`flex-1 flex items-center gap-2 min-w-0 py-0.5 ${
                  file.is_dir ? "cursor-pointer" : "cursor-pointer"
                } ${
                  !file.is_dir &&
                  selectedNote &&
                  currentPath === selectedNote.base &&
                  selectedNote.name === file.name
                    ? "text-neutral-900 font-medium"
                    : "text-neutral-600"
                } hover:text-neutral-900 transition`}
              >
                {file.is_dir ? <FaRegFolder /> : <MdNotes />}{" "}
                <span className="truncate">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(file);
                }}
                className={`cursor-pointer p-1 rounded transition flex-shrink-0 ${
                  isPinned
                    ? "opacity-100 text-amber-600 hover:bg-amber-50"
                    : "opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-amber-600 hover:bg-amber-50/50"
                }`}
                title={isPinned ? "Unpin" : "Pin to top"}
                aria-label={isPinned ? "Unpin" : "Pin to top"}
              >
                <FaThumbtack className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEntry(file);
                }}
                className="cursor-pointer opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-red-50 transition flex-shrink-0"
                title={
                  file.is_dir ? "Move folder to trash" : "Move note to trash"
                }
                aria-label="Move to trash"
              >
                <FaTrash className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

type SelectedNote = { base: string; name: string };

function NoteEditor({
  note,
  onError,
}: {
  note: SelectedNote;
  onError: (message: string) => void;
}) {
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
          onErrorRef.current(getInvokeErrorMessage(err));
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
      if (c === lastSavedRef.current) {
        return;
      }
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
        onErrorRef.current(getInvokeErrorMessage(err));
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
        invoke("write_note", { base, name, content: c }).catch((err) => {
          console.error(err);
        });
      }
    };
  }, [note.base, note.name]);

  function insertParagraphBreak() {
    if (!readOk) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setContent((prev) => {
      const before = prev.slice(0, start);
      const after = prev.slice(end);
      return before + "\n\n" + after;
    });
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
        <h2 className="text-sm font-medium text-neutral-800 truncate">
          {note.name}
        </h2>
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

function TopBar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}) {
  return (
    <div className="px-8 pt-8 pb-4 border-b border-neutral-200 bg-slate-300">
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium text-white uppercase tracking-wide">
          Thoughts
        </div>

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
  const [pinnedEntries, setPinnedEntries] = useState<PinnedEntry[]>([]);
  const pinnedPathSet = useMemo(
    () => new Set(pinnedEntries.map((p) => p.path)),
    [pinnedEntries],
  );
  const [promptMode, setPromptMode] = useState<EntryPromptMode>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<SelectedNote | null>(null);

  const handleNoteEditorError = useCallback((msg: string) => {
    window.alert("Could not load or save note. " + msg);
  }, []);

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

      const pinned = await invoke<PinnedEntry[]>("get_pinned");
      setPinnedEntries(pinned);
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

    setSelectedNote(null);
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

    setSelectedNote(null);
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
      setPromptError("Could not create. " + getInvokeErrorMessage(err));
    }
  }

  function handlePromptCancel() {
    setPromptMode(null);
    setPromptError(null);
  }

  async function handleDeleteEntry(entry: Entry) {
    const path = pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;
    if (!path) return;
    try {
      await invoke("move_to_trash", { base: path, name: entry.name });
      if (
        selectedNote &&
        !entry.is_dir &&
        selectedNote.base === path &&
        selectedNote.name === entry.name
      ) {
        setSelectedNote(null);
      }
      await refreshFiles();
    } catch (err) {
      window.alert("Could not move to trash. " + getInvokeErrorMessage(err));
    }
  }

  async function handleTogglePin(entry: Entry) {
    const path = pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;
    if (!path) return;
    const fullPath = `${path}/${entry.name}`;
    const prev = pinnedEntries;
    const idx = prev.findIndex((p) => p.path === fullPath);
    const next =
      idx >= 0
        ? prev.filter((_, i) => i !== idx)
        : [...prev, { path: fullPath, is_dir: entry.is_dir }];
    setPinnedEntries(next);
    try {
      await invoke("set_pinned", { pinned: next });
    } catch (err) {
      setPinnedEntries(prev);
      window.alert("Could not save pin. " + getInvokeErrorMessage(err));
    }
  }

  async function handleUnpinPath(fullPath: string) {
    const prev = pinnedEntries;
    const next = prev.filter((p) => p.path !== fullPath);
    setPinnedEntries(next);
    try {
      await invoke("set_pinned", { pinned: next });
    } catch (err) {
      setPinnedEntries(prev);
      window.alert("Could not save. " + getInvokeErrorMessage(err));
    }
  }

  async function handleNavigateToPinned(pin: PinnedEntry) {
    const root = pathStack[0];
    if (!root) return;
    const fullPath = pin.path;
    const targetDir = pin.is_dir
      ? fullPath
      : fullPath.includes("/")
        ? fullPath.slice(0, fullPath.lastIndexOf("/"))
        : root;
    if (!targetDir.startsWith(root)) return;
    const relative = targetDir.slice(root.length).replace(/^\/+/, "");
    const segments = relative ? relative.split("/").filter(Boolean) : [];
    const newStack = [root];
    for (let i = 0; i < segments.length; i++) {
      newStack.push(`${newStack[newStack.length - 1]}/${segments[i]}`);
    }
    const contents = await invoke<Entry[]>("read_folder", {
      base: targetDir,
      child: null,
    });
    setPathStack(newStack);
    setFiles(contents);
    if (!pin.is_dir) {
      const fileName = fullPath.split("/").filter(Boolean).pop();
      if (fileName) {
        setSelectedNote({ base: targetDir, name: fileName });
      } else {
        setSelectedNote(null);
      }
    } else {
      setSelectedNote(null);
    }
  }

  function handleSelectNote(entry: Entry) {
    if (entry.is_dir) return;
    const path = pathStack[pathStack.length - 1];
    if (!path) return;
    setSelectedNote({ base: path, name: entry.name });
  }

  const currentPath =
    pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;

  return (
    <div className="h-screen w-screen bg-neutral-800 flex flex-col">
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
          onSelectNote={handleSelectNote}
          selectedNote={selectedNote}
          onBack={goBack}
          canGoBack={pathStack.length > 1}
          currentPath={currentPath}
          onAddFolder={handleAddFolder}
          onAddNote={handleAddNote}
          onDeleteEntry={handleDeleteEntry}
          pinnedPaths={pinnedPathSet}
          pinnedEntries={pinnedEntries}
          onTogglePin={handleTogglePin}
          onUnpinPath={handleUnpinPath}
          onNavigateToPinned={handleNavigateToPinned}
        />

        <div className="flex-1 p-8 bg-white min-h-0 flex flex-col overflow-hidden">
          {selectedNote ? (
            <NoteEditor
              key={`${selectedNote.base}/${selectedNote.name}`}
              note={selectedNote}
              onError={handleNoteEditorError}
            />
          ) : (
            <div className="text-neutral-500">
              Select a note from the library to read or edit it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
