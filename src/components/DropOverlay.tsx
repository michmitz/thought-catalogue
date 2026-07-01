import { DropIcon } from "./icons";

export function DropOverlay() {
  return (
    <div
      className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
      style={{ background: "color-mix(in srgb, var(--color-accent) 14%, var(--color-bg))" }}
    >
      <div
        className="absolute"
        style={{
          inset: 6,
          border: "2px dashed var(--color-accent)",
          borderRadius: "var(--radius)",
        }}
      />
      <div
        className="w-[72px] h-[72px] bg-accent-bg flex items-center justify-center text-accent"
        style={{ borderRadius: "calc(var(--radius) + 6px)" }}
      >
        <DropIcon size={32} />
      </div>
    </div>
  );
}
