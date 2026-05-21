import { motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderPlusIcon,
  NoteIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from "./icons";
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
      className="overflow-hidden border-r border-border bg-sidebar flex-shrink-0"
    >
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ width: 260 }}
      >
        {pinnedList.length > 0 && (
          <>
            <div className="text-[10.5px] font-bold text-text-faint uppercase tracking-[0.1em] pt-[18px] px-4 pb-1.5">
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
                    className={`group flex items-center gap-2 mx-2 my-px rounded-[var(--radius)] px-2.5 py-1.5 hover:bg-hover ${
                      isSelectedNote
                        ? "text-accent bg-accent-bg"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    <div
                      onClick={() => onNavigateToPinned(pin)}
                      className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
                    >
                      {pin.is_dir ? <FolderIcon /> : <NoteIcon />}
                      <span className="truncate text-[13.5px]">{name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnpinPath(pin.path);
                      }}
                      className="cursor-pointer p-1 rounded-[var(--radius)] transition flex-shrink-0 opacity-0 group-hover:opacity-100 text-accent hover:bg-accent-bg"
                      title="Unpin"
                      aria-label="Unpin"
                    >
                      <StarIcon filled={true} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="h-px bg-border mx-4 my-1.5" />
          </>
        )}

        {canGoBack ? (
          <div
            onClick={onBack}
            className="flex items-center gap-1.5 text-[12px] text-text-muted opacity-55 hover:opacity-85 cursor-pointer transition px-4 pt-3 pb-1"
          >
            <ChevronLeftIcon />
            <span>{currentPath?.split("/").pop()}</span>
          </div>
        ) : currentPath ? (
          <div className="text-[10.5px] font-bold text-text-faint uppercase tracking-[0.1em] pt-[18px] px-4 pb-1.5">
            Files
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto">
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
              <div
                key={file.name}
                className={`group flex items-center gap-2 mx-2 my-px rounded-[var(--radius)] px-2.5 py-1.5 hover:bg-hover transition ${
                  isSelected
                    ? "text-accent bg-accent-bg"
                    : "text-text-muted hover:text-text"
                }`}
              >
                <div
                  onClick={() =>
                    file.is_dir ? onOpenFolder(file.name) : onSelectNote(file)
                  }
                  className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
                >
                  {file.is_dir ? <FolderIcon /> : <NoteIcon />}
                  <span className="truncate text-[13.5px]">
                    {file.name.replace(/\.md$/, "")}
                  </span>
                  {file.is_dir && <ChevronRightIcon />}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(file);
                  }}
                  className={`cursor-pointer p-1 rounded-[var(--radius)] transition flex-shrink-0 ${
                    isPinned
                      ? "opacity-100 text-accent hover:bg-accent-bg"
                      : "opacity-0 group-hover:opacity-100 text-text-faint hover:text-accent hover:bg-accent-bg"
                  }`}
                  title={isPinned ? "Unpin" : "Pin to top"}
                  aria-label={isPinned ? "Unpin" : "Pin to top"}
                >
                  <StarIcon filled={isPinned} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEntry(file);
                  }}
                  className="cursor-pointer opacity-0 group-hover:opacity-100 p-1 rounded-[var(--radius)] text-text-faint hover:text-red-400 hover:bg-red-50 transition flex-shrink-0"
                  title={
                    file.is_dir ? "Move folder to trash" : "Move note to trash"
                  }
                  aria-label="Move to trash"
                >
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-0.5 p-2">
          <button
            type="button"
            onClick={onAddNote}
            disabled={!currentPath}
            className="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-[var(--radius)] text-[13px] text-text-muted hover:bg-hover transition text-left disabled:opacity-30 disabled:pointer-events-none"
          >
            <PlusIcon />
            <span>New note</span>
          </button>
          <button
            type="button"
            onClick={onAddFolder}
            disabled={!currentPath}
            className="flex items-center gap-2 w-full px-2.5 py-[7px] rounded-[var(--radius)] text-[13px] text-text-muted hover:bg-hover transition text-left disabled:opacity-30 disabled:pointer-events-none"
          >
            <FolderPlusIcon />
            <span>New folder</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
