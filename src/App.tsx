import { useCallback, useEffect, useRef, useState } from "react";
import { BrowseMode } from "./components/BrowseMode";
import { EntryNamePromptModal } from "./components/EntryNamePromptModal";
import { NoteEditor, NoteEditorPlaceholder } from "./components/NoteEditor";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { useFileSystem } from "./hooks/useFileSystem";
import { usePinnedEntries } from "./hooks/usePinnedEntries";
import { useTheme } from "./hooks/useTheme";
import type { BrowseView, Entry } from "./types";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [browseView, setBrowseView] = useState<BrowseView>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const openFromBrowseRef = useRef(false);
  const { theme, setTheme } = useTheme();

  const fs = useFileSystem();
  const pins = usePinnedEntries();

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
