import { motion } from "framer-motion";
import {
  FaChevronLeft,
  FaRegFolder,
  FaThumbtack,
  FaTrash,
} from "react-icons/fa";
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
  const pinnedList = [...pinnedEntries].sort((a, b) =>
    a.path.localeCompare(b.path),
  );

  return (
    <motion.div
      animate={{ width: open ? 260 : 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden border-r border-warm-200 bg-warm-100"
    >
      <div className="p-6 space-y-2">
        {pinnedList.length > 0 && (
          <div className="mb-4">
            <div className="text-[10.5px] font-bold text-warm-400 uppercase tracking-[0.1em] mb-2">
              Pinned
            </div>
            <div className="space-y-0.5">
              {pinnedList.map((pin) => {
                const rawName =
                  pin.path.split("/").filter(Boolean).pop() ?? pin.path;
                const name = rawName.replace(/\.md$/, "");
                const isSelectedNote =
                  !pin.is_dir &&
                  selectedNote &&
                  `${selectedNote.base}/${selectedNote.name}` === pin.path;
                return (
                  <div
                    key={pin.path}
                    className={`group flex items-center gap-2 rounded-md hover:bg-black/[0.04] py-1 ${
                      isSelectedNote
                        ? "text-accent-500 bg-accent-500/10"
                        : "text-warm-600 hover:text-warm-900"
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
                      className="cursor-pointer p-1 rounded transition flex-shrink-0 opacity-0 group-hover:opacity-100 text-accent-500 hover:bg-accent-50"
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
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[13px] text-warm-500 hover:bg-black/[0.04] transition text-left"
          >
            + Folder
          </button>
          <button
            type="button"
            onClick={onAddNote}
            disabled={!currentPath}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[13px] text-warm-500 hover:bg-black/[0.04] transition text-left"
          >
            + Note
          </button>
        </div>

        {/* {currentPath && (
          <div className="text-xs text-neutral-400 mb-4 break-all">
            {currentPath}
          </div>
        )} */}

        {canGoBack ? (
          <div
            onClick={onBack}
            className="flex items-center gap-1.5 text-[12px] text-warm-500 opacity-55 hover:opacity-85 cursor-pointer mb-2 transition px-1"
          >
            <FaChevronLeft className="w-3 h-3" />
            <span>{currentPath?.split("/").pop()}</span>
          </div>
        ) : currentPath ? (
          <div className="text-[10.5px] font-bold text-warm-400 uppercase tracking-[0.1em] mb-1 mt-2">
            Files
          </div>
        ) : null}

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
              className="group flex items-center gap-2 rounded hover:bg-black/[0.04] rounded-md"
            >
              <div
                onClick={() =>
                  file.is_dir ? onOpenFolder(file.name) : onSelectNote(file)
                }
                className={`flex-1 flex items-center gap-2 min-w-0 py-0.5 cursor-pointer ${
                  isSelected
                    ? "text-accent-500 font-medium bg-accent-500/10 rounded-md"
                    : "text-warm-600"
                } hover:text-warm-900 transition`}
              >
                {file.is_dir ? <FaRegFolder /> : <MdNotes />}{" "}
                <span className="truncate">
                  {file.name.replace(/\.md$/, "")}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(file);
                }}
                className={`cursor-pointer p-1 rounded transition flex-shrink-0 ${
                  isPinned
                    ? "opacity-100 text-accent-500 hover:bg-accent-50"
                    : "opacity-0 group-hover:opacity-100 text-warm-400 hover:text-accent-500 hover:bg-accent-50"
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
