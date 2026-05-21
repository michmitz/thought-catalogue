export type Entry = {
  name: string;
  is_dir: boolean;
  created: string | null;
};

export type BrowseView = 'icons' | 'list' | 'date' | null;

export type PinnedEntry = {
  path: string;
  is_dir: boolean;
};

export type EntryPromptMode = "folder" | "note" | null;

export type SelectedNote = { base: string; name: string };

export function getInvokeErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return String(err);
}
