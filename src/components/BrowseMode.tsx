import React, { useRef, useState } from "react";
import type { BrowseView, Entry } from "../types";
import { ChevronLeftIcon, FileIcon, FolderIcon, NoteIcon, StarIcon } from "./icons";
import { DropOverlay } from "./DropOverlay";

function entryIcon(name: string, isDir: boolean, size?: number) {
  if (isDir) return <FolderIcon size={size} />;
  if (name.endsWith(".md")) return <NoteIcon size={size} />;
  return <FileIcon size={size} />;
}

type Props = {
  view: NonNullable<BrowseView>;
  items: Entry[];
  currentPath: string | null;
  currentFolderName: string;
  canGoBack: boolean;
  onBack: () => void;
  onOpen: (entry: Entry) => void;
  onExit: () => void;
  pinnedPaths: Set<string>;
  onPin: (entry: Entry) => void;
  showDropOverlay?: boolean;
};

function formatDate(created: string | null): string {
  if (!created) return "—";
  return new Date(created).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupByMonth(items: Entry[]): Record<string, Entry[]> {
  const groups: Record<string, Entry[]> = {};
  [...items]
    .filter((e) => e.created)
    .sort(
      (a, b) =>
        new Date(b.created!).getTime() - new Date(a.created!).getTime(),
    )
    .forEach((item) => {
      const key = new Date(item.created!).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      (groups[key] = groups[key] || []).push(item);
    });
  return groups;
}

export function BrowseMode({
  view,
  items,
  currentPath,
  currentFolderName,
  canGoBack,
  onBack,
  onOpen,
  onExit,
  pinnedPaths,
  onPin,
  showDropOverlay = false,
}: Props) {
  function isPinned(item: Entry): boolean {
    if (!currentPath) return false;
    return pinnedPaths.has(`${currentPath}/${item.name}`);
  }

  const dragCounterRef = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);

  function onDragEnter(e: React.DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
  }
  function onDragLeave() {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-0 bg-bg overflow-hidden relative"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {(isDragOver || showDropOverlay) && <DropOverlay />}
      <div className="h-11 flex items-center px-6 gap-3 border-b border-border flex-shrink-0">
        {canGoBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius)] text-text-muted text-[13px] hover:bg-hover transition cursor-default"
          >
            <ChevronLeftIcon /> Back
          </button>
        )}
        <span className="text-[14px] font-medium text-text">
          {currentFolderName}
        </span>
        <span className="text-[12px] text-text-faint">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={onExit}
          className="ml-auto px-2.5 py-1 rounded-[var(--radius)] text-text-muted text-[12px] hover:bg-hover transition cursor-default"
        >
          Done
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "icons" && (
          <IconsView items={items} onOpen={onOpen} isPinned={isPinned} />
        )}
        {view === "list" && (
          <ListView
            items={items}
            onOpen={onOpen}
            isPinned={isPinned}
            onPin={onPin}
          />
        )}
        {view === "date" && (
          <DateView items={items} onOpen={onOpen} isPinned={isPinned} />
        )}
      </div>
    </div>
  );
}

function IconsView({
  items,
  onOpen,
  isPinned,
}: {
  items: Entry[];
  onOpen: (e: Entry) => void;
  isPinned: (e: Entry) => boolean;
}) {
  return (
    <div
      className="grid gap-2 p-8"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}
    >
      {items.map((item) => (
        <button
          key={item.name}
          type="button"
          onClick={() => onOpen(item)}
          className="flex flex-col items-center gap-2.5 py-3.5 px-2 rounded-[var(--radius)] hover:bg-hover transition relative cursor-default"
        >
          <div className="w-16 h-16 flex items-center justify-center text-text-muted relative">
            {item.is_dir ? (
              <FolderIcon size={52} />
            ) : item.name.endsWith(".md") ? (
              <NoteIcon size={44} strokeWidth={1.1} />
            ) : (
              <FileIcon size={44} strokeWidth={1.1} />
            )}
            {isPinned(item) && (
              <div className="absolute top-0 right-1 text-accent">
                <StarIcon size={11} filled />
              </div>
            )}
          </div>
          <span className="text-[12px] text-text text-center leading-tight max-w-[110px] break-words">
            {item.name.replace(/\.md$/, "")}
          </span>
        </button>
      ))}
    </div>
  );
}

function ListView({
  items,
  onOpen,
  isPinned,
  onPin,
}: {
  items: Entry[];
  onOpen: (e: Entry) => void;
  isPinned: (e: Entry) => boolean;
  onPin: (e: Entry) => void;
}) {
  return (
    <div>
      <div
        className="grid px-6 py-2 border-b border-border text-[10.5px] font-bold tracking-[0.08em] uppercase text-text-faint"
        style={{ gridTemplateColumns: "1fr 140px 32px" }}
      >
        <span>Name</span>
        <span>Date Created</span>
        <span />
      </div>
      {items.map((item) => (
        <div
          key={item.name}
          onClick={() => onOpen(item)}
          className="grid px-6 py-2.5 items-center cursor-default border-b border-border hover:bg-hover text-[13.5px]"
          style={{ gridTemplateColumns: "1fr 140px 32px" }}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="text-text-muted">{entryIcon(item.name, item.is_dir, 14)}</span>
            <span className="truncate">{item.name.replace(/\.md$/, "")}</span>
          </span>
          <span className="text-text-muted text-[12px]">
            {formatDate(item.created)}
          </span>
          <div className="flex justify-center">
            {!item.is_dir && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(item);
                }}
                className={`p-1 rounded transition cursor-default ${
                  isPinned(item)
                    ? "text-accent opacity-100"
                    : "text-text-faint opacity-50 hover:opacity-80"
                }`}
              >
                <StarIcon size={12} filled={isPinned(item)} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DateView({
  items,
  onOpen,
  isPinned,
}: {
  items: Entry[];
  onOpen: (e: Entry) => void;
  isPinned: (e: Entry) => boolean;
}) {
  const groups = groupByMonth(items);
  const groupEntries = Object.entries(groups);

  if (groupEntries.length === 0) {
    return (
      <div className="px-6 py-8 text-text-faint text-[13px]">
        No dated items.
      </div>
    );
  }

  return (
    <div>
      {groupEntries.map(([month, group]) => (
        <div key={month} className="mb-2">
          <div className="px-6 pt-3.5 pb-1.5 text-[10.5px] font-bold tracking-[0.1em] uppercase text-text-faint">
            {month}
          </div>
          {group.map((item) => (
            <div
              key={item.name}
              onClick={() => onOpen(item)}
              className="px-6 py-2.5 flex items-center gap-3 cursor-default hover:bg-hover text-[13.5px] border-b border-border"
            >
              <span className="text-text-muted">{entryIcon(item.name, item.is_dir, 14)}</span>
              <span className="flex-1 truncate">
                {item.name.replace(/\.md$/, "")}
              </span>
              {isPinned(item) && (
                <StarIcon size={11} filled className="text-accent" />
              )}
              <span className="text-text-faint text-[12px]">
                {formatDate(item.created)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
