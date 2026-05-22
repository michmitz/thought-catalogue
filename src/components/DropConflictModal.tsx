type Props = {
  conflictName: string;
  remainingCount: number;
  onReplace: () => void;
  onKeepBoth: () => void;
  onStop: () => void;
};

export function DropConflictModal({
  conflictName,
  remainingCount,
  onReplace,
  onKeepBoth,
  onStop,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-bg rounded-xl shadow-2xl p-6 w-[420px] border border-border">
        <p className="text-[14px] font-semibold text-text mb-2 leading-snug">
          An item named &ldquo;{conflictName}&rdquo; already exists in this location.
        </p>
        <p className="text-[13px] text-text-muted mb-1">
          Do you want to replace it with the one you&rsquo;re moving?
        </p>
        {remainingCount > 0 && (
          <p className="text-[12px] text-text-faint mt-0.5">
            {remainingCount} more item{remainingCount !== 1 ? "s" : ""} waiting.
          </p>
        )}
        <div className="flex items-center gap-2 justify-end mt-5">
          <button
            type="button"
            onClick={onStop}
            className="px-3 py-1.5 text-[13px] text-text-muted hover:bg-hover rounded-[var(--radius)] transition"
          >
            Stop
          </button>
          <button
            type="button"
            onClick={onKeepBoth}
            className="px-3 py-1.5 text-[13px] text-text-muted border border-border hover:bg-hover rounded-[var(--radius)] transition"
          >
            Keep Both
          </button>
          <button
            type="button"
            onClick={onReplace}
            className="px-3 py-1.5 text-[13px] rounded-[var(--radius)] transition font-medium"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-bg)" }}
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  );
}
