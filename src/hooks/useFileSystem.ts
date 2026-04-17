import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { type Entry, type EntryPromptMode, getInvokeErrorMessage, type PinnedEntry, type SelectedNote } from "../types";

export function useFileSystem() {
  const [files, setFiles] = useState<Entry[]>([]);
  const [pathStack, setPathStack] = useState<string[]>([]);
  const [promptMode, setPromptMode] = useState<EntryPromptMode>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<SelectedNote | null>(null);

  const currentPath = pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;
  const canGoBack = pathStack.length > 1;

  async function init() {
    let saved = await invoke<string | null>("get_saved_folder");

    if (!saved) {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === "string") {
        await invoke("choose_folder", { path: selected });
        saved = selected;
      }
    }

    if (saved) {
      setPathStack([saved]);
      const contents = await invoke<Entry[]>("read_folder", { base: saved, child: null });
      setFiles(contents);
    }
  }

  async function refreshFiles(stack: string[] = pathStack) {
    const path = stack.length > 0 ? stack[stack.length - 1] : null;
    if (!path) return;
    const contents = await invoke<Entry[]>("read_folder", { base: path, child: null });
    setFiles(contents);
  }

  async function openFolder(name: string) {
    if (!currentPath) return;
    const contents = await invoke<Entry[]>("read_folder", { base: currentPath, child: name });
    const newPath = `${currentPath}/${name}`;
    setSelectedNote(null);
    setPathStack([...pathStack, newPath]);
    setFiles(contents);
  }

  async function goBack() {
    if (pathStack.length <= 1) return;
    const newStack = pathStack.slice(0, -1);
    const parentPath = newStack[newStack.length - 1];
    const contents = await invoke<Entry[]>("read_folder", { base: parentPath, child: null });
    setSelectedNote(null);
    setPathStack(newStack);
    setFiles(contents);
  }

  async function navigateToPinned(pin: PinnedEntry) {
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
    const contents = await invoke<Entry[]>("read_folder", { base: targetDir, child: null });
    setPathStack(newStack);
    setFiles(contents);
    if (!pin.is_dir) {
      const fileName = fullPath.split("/").filter(Boolean).pop();
      setSelectedNote(fileName ? { base: targetDir, name: fileName } : null);
    } else {
      setSelectedNote(null);
    }
  }

  function selectNote(entry: Entry) {
    if (entry.is_dir || !currentPath) return;
    setSelectedNote({ base: currentPath, name: entry.name });
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
    if (!currentPath || !promptMode) return;
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
        await invoke("create_folder", { base: currentPath, name });
      } else {
        await invoke("create_note", { base: currentPath, name });
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
    if (!currentPath) return;
    try {
      await invoke("move_to_trash", { base: currentPath, name: entry.name });
      if (
        selectedNote &&
        !entry.is_dir &&
        selectedNote.base === currentPath &&
        selectedNote.name === entry.name
      ) {
        setSelectedNote(null);
      }
      await refreshFiles();
    } catch (err) {
      window.alert("Could not move to trash. " + getInvokeErrorMessage(err));
    }
  }

  return {
    files,
    pathStack,
    currentPath,
    canGoBack,
    promptMode,
    promptError,
    selectedNote,
    init,
    openFolder,
    goBack,
    navigateToPinned,
    selectNote,
    handleAddFolder,
    handleAddNote,
    handlePromptConfirm,
    handlePromptCancel,
    handleDeleteEntry,
  };
}
