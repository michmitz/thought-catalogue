import { invoke } from "@tauri-apps/api/core";
import { useState, useMemo } from "react";
import { type Entry, type PinnedEntry, getInvokeErrorMessage } from "../types";

export function usePinnedEntries() {
  const [pinnedEntries, setPinnedEntries] = useState<PinnedEntry[]>([]);

  const pinnedPathSet = useMemo(
    () => new Set(pinnedEntries.map((p) => p.path)),
    [pinnedEntries],
  );

  async function loadPinned() {
    const pinned = await invoke<PinnedEntry[]>("get_pinned");
    setPinnedEntries(pinned);
  }

  async function togglePin(entry: Entry, currentPath: string | null) {
    if (!currentPath) return;
    const fullPath = `${currentPath}/${entry.name}`;
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

  async function unpinPath(fullPath: string) {
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

  return {
    pinnedEntries,
    pinnedPathSet,
    loadPinned,
    togglePin,
    unpinPath,
  };
}
