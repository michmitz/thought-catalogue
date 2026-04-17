import { useCallback, useEffect, useState } from "react";
import { EntryNamePromptModal } from "./components/EntryNamePromptModal";
import { NoteEditor, NoteEditorPlaceholder } from "./components/NoteEditor";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { useFileSystem } from "./hooks/useFileSystem";
import { usePinnedEntries } from "./hooks/usePinnedEntries";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fs = useFileSystem();
  const pins = usePinnedEntries();

  const handleNoteEditorError = useCallback((msg: string) => {
    window.alert("Could not load or save note. " + msg);
  }, []);

  useEffect(() => {
    fs.init();
    pins.loadPinned();
  }, []);

  return (
    <div className="h-screen w-screen bg-neutral-800 flex flex-col">
      <EntryNamePromptModal
        key={fs.promptMode ?? "closed"}
        mode={fs.promptMode}
        defaultName={fs.promptMode === "note" ? "new-note.md" : ""}
        error={fs.promptError}
        onConfirm={fs.handlePromptConfirm}
        onCancel={fs.handlePromptCancel}
      />
      <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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

        <div className="flex-1 p-8 bg-white min-h-0 flex flex-col overflow-hidden">
          {fs.selectedNote ? (
            <NoteEditor
              key={`${fs.selectedNote.base}/${fs.selectedNote.name}`}
              note={fs.selectedNote}
              onError={handleNoteEditorError}
            />
          ) : (
            <NoteEditorPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}
