import { useCallback, useEffect, useRef, useState } from "react";
import { EntryNamePromptModal } from "./components/EntryNamePromptModal";
import { NoteEditor, NoteEditorPlaceholder } from "./components/NoteEditor";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { useFileSystem } from "./hooks/useFileSystem";
import { usePinnedEntries } from "./hooks/usePinnedEntries";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      />

      <div className="flex flex-1 overflow-hidden">
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
            />
          ) : (
            <NoteEditorPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}
