import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrowseMode } from "./components/BrowseMode";
import { DropConflictModal } from "./components/DropConflictModal";
import { EntryNamePromptModal } from "./components/EntryNamePromptModal";
import { NoteEditor, NoteEditorPlaceholder } from "./components/NoteEditor";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { useFileSystem } from "./hooks/useFileSystem";
import { usePinnedEntries } from "./hooks/usePinnedEntries";
import { useTheme } from "./hooks/useTheme";
import type { BrowseView, Entry } from "./types";

type PendingDrop = { src: string; destDir: string };
type DropConflict = { src: string; destDir: string; remainingCount: number };

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [browseView, setBrowseView] = useState<BrowseView>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const openFromBrowseRef = useRef(false);
  const { theme, setTheme } = useTheme();

  const fs = useFileSystem();
  const pins = usePinnedEntries();

  const [dropConflict, setDropConflict] = useState<DropConflict | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const dropQueueRef = useRef<PendingDrop[]>([]);
  const processingDropRef = useRef(false);
  const refreshRef = useRef(fs.refreshFiles);
  refreshRef.current = fs.refreshFiles;
  const currentPathRef = useRef(fs.currentPath);
  currentPathRef.current = fs.currentPath;
  const rootPathRef = useRef(fs.rootPath);
  rootPathRef.current = fs.rootPath;

  // Ref to the drain function so it can call itself recursively without stale closures
  const processNextDropRef = useRef<() => Promise<void>>(async () => {});

  const processNextDrop = useCallback(async () => {
    if (processingDropRef.current) return;
    const item = dropQueueRef.current[0];
    if (!item) return;
    processingDropRef.current = true;
    try {
      await invoke("copy_to_workspace", {
        src: item.src,
        destDir: item.destDir,
        replace: false,
      });
      dropQueueRef.current.shift();
      processingDropRef.current = false;
      await refreshRef.current();
      processNextDropRef.current();
    } catch (err) {
      if (String(err) === "exists") {
        setDropConflict({
          src: item.src,
          destDir: item.destDir,
          remainingCount: dropQueueRef.current.length - 1,
        });
      } else {
        dropQueueRef.current.shift();
        processingDropRef.current = false;
        processNextDropRef.current();
      }
    }
  }, []);
  processNextDropRef.current = processNextDrop;

  const resolveConflict = useCallback(
    async (action: "replace" | "keepBoth" | "stop") => {
      const item = dropQueueRef.current[0];
      setDropConflict(null);
      if (action === "stop") {
        dropQueueRef.current = [];
        processingDropRef.current = false;
        return;
      }
      if (!item) {
        processingDropRef.current = false;
        return;
      }
      try {
        if (action === "replace") {
          await invoke("copy_to_workspace", {
            src: item.src,
            destDir: item.destDir,
            replace: true,
          });
        } else {
          await invoke("copy_to_workspace_unique", {
            src: item.src,
            destDir: item.destDir,
          });
        }
        await refreshRef.current();
      } catch (err) {
        console.error("Drop copy error:", err);
      }
      dropQueueRef.current.shift();
      processingDropRef.current = false;
      processNextDropRef.current();
    },
    [],
  );

  useEffect(() => {
    const appWindow = getCurrentWebviewWindow();
    const unlisten = appWindow.onDragDropEvent((event) => {
      const type = event.payload.type;
      if (type === "enter") {
        setIsDragActive(true);
      } else if (type === "leave") {
        setIsDragActive(false);
      } else if (type === "drop") {
        setIsDragActive(false);
        const targetDir = currentPathRef.current ?? rootPathRef.current;
        if (!targetDir) return;
        for (const path of event.payload.paths) {
          dropQueueRef.current.push({ src: path, destDir: targetDir });
        }
        processNextDropRef.current();
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleNoteEditorError = useCallback((msg: string) => {
    window.alert("Could not load or save note. " + msg);
  }, []);

  async function handleRename(newName: string) {
    if (!fs.selectedNote) return;
    try {
      await fs.renameNote(fs.selectedNote.name, newName);
    } catch (err) {
      window.alert("Could not rename note. " + String(err));
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fs.init();
    pins.loadPinned();
  }, []);

  // Reset (or set) previewMode when the selected note changes
  useEffect(() => {
    if (openFromBrowseRef.current) {
      openFromBrowseRef.current = false;
      setPreviewMode(true);
    } else {
      setPreviewMode(false);
    }
  }, [fs.selectedNote]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && browseView) setBrowseView(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [browseView]);

  function setView(v: BrowseView) {
    setBrowseView(prev => prev === v ? null : v);
  }

  function openFromBrowse(entry: Entry) {
    if (entry.is_dir) {
      fs.openFolder(entry.name);
    } else {
      openFromBrowseRef.current = true;
      fs.selectNote(entry);
      setBrowseView(null);
    }
  }

  const currentFolderName = fs.currentPath
    ? (fs.currentPath.split('/').filter(Boolean).pop() ?? fs.currentPath)
    : '';

  const handleAddNoteRef = useRef(fs.handleAddNote);
  useEffect(() => {
    handleAddNoteRef.current = fs.handleAddNote;
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey && e.key === "n") {
        e.preventDefault();
        handleAddNoteRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen bg-bg flex flex-col">
      <EntryNamePromptModal
        key={fs.promptMode ?? "closed"}
        mode={fs.promptMode}
        defaultName=""
        error={fs.promptError}
        onConfirm={fs.handlePromptConfirm}
        onCancel={fs.handlePromptCancel}
      />
      {dropConflict && (
        <DropConflictModal
          conflictName={dropConflict.src.split("/").pop() ?? dropConflict.src}
          remainingCount={dropConflict.remainingCount}
          onReplace={() => resolveConflict("replace")}
          onKeepBoth={() => resolveConflict("keepBoth")}
          onStop={() => resolveConflict("stop")}
        />
      )}
      <TopBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        theme={theme}
        setTheme={setTheme}
        browseView={browseView}
        setView={setView}
      />

      <div className="flex flex-1 overflow-hidden">
        {browseView ? (
          <BrowseMode
            view={browseView}
            items={fs.files}
            currentPath={fs.currentPath}
            currentFolderName={currentFolderName}
            canGoBack={fs.canGoBack}
            onBack={fs.goBack}
            onOpen={openFromBrowse}
            onExit={() => setBrowseView(null)}
            pinnedPaths={pins.pinnedPathSet}
            onPin={(entry) => pins.togglePin(entry, fs.currentPath)}
            showDropOverlay={isDragActive}
          />
        ) : (
          <>
            <Sidebar
              open={sidebarOpen}
              files={fs.files}
              onOpenFolder={fs.openFolder}
              onSelectNote={fs.selectNote}
              selectedNote={fs.selectedNote}
              onBack={fs.goBack}
              canGoBack={fs.canGoBack}
              currentPath={fs.currentPath}
              onAddFolder={fs.handleAddFolder}
              onAddNote={fs.handleAddNote}
              onDeleteEntry={fs.handleDeleteEntry}
              pinnedPaths={pins.pinnedPathSet}
              pinnedEntries={pins.pinnedEntries}
              onTogglePin={(entry) => pins.togglePin(entry, fs.currentPath)}
              onUnpinPath={pins.unpinPath}
              onNavigateToPinned={fs.navigateToPinned}
              showDropOverlay={isDragActive && sidebarOpen}
            />

            <div className="flex-1 bg-bg min-h-0 flex flex-col overflow-hidden">
              {fs.selectedNote ? (
                <NoteEditor
                  key={`${fs.selectedNote.base}/${fs.selectedNote.name}`}
                  note={fs.selectedNote}
                  onError={handleNoteEditorError}
                  onRename={handleRename}
                  previewMode={previewMode}
                  setPreviewMode={setPreviewMode}
                />
              ) : (
                <NoteEditorPlaceholder />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
