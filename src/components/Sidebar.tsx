import { motion } from "framer-motion";
import { FaRegFolder, FaThumbtack, FaTrash } from "react-icons/fa";
import { MdNotes } from "react-icons/md";
import type { Entry, PinnedEntry, SelectedNote } from "../types";

type Props = {
  open: boolean;
  files: Entry[];
  onOpenFolder: (name: string) => void;
  onSelectNote: (entry: Entry) => void;
  selectedNote: SelectedNote | null;
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
};

export function Sidebar({
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
}: Props) {
  const pinnedList = [...pinnedEntries].sort((a, b) => a.path.localeCompare(b.path));

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
                const name = pin.path.split("/").filter(Boolean).pop() ?? pin.path;
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

        {files.map((file) => {
          const fullPath = currentPath ? `${currentPath}/${file.name}` : "";
          const isPinned = fullPath ? pinnedPaths.has(fullPath) : false;
          if (isPinned) return null;
          const isSelected =
            !file.is_dir &&
            selectedNote &&
            currentPath === selectedNote.base &&
            selectedNote.name === file.name;
          return (
            <motion.div
              key={file.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="group flex items-center gap-2 rounded hover:bg-neutral-100/80"
            >
              <div
                onClick={() => file.is_dir ? onOpenFolder(file.name) : onSelectNote(file)}
                className={`flex-1 flex items-center gap-2 min-w-0 py-0.5 cursor-pointer ${
                  isSelected ? "text-neutral-900 font-medium" : "text-neutral-600"
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
                title={file.is_dir ? "Move folder to trash" : "Move note to trash"}
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
