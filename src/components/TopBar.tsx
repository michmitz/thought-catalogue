import { getCurrentWindow } from "@tauri-apps/api/window";
import { SidebarIcon } from "./icons";

type Props = {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
};

const win = getCurrentWindow();

export function TopBar({ sidebarOpen, setSidebarOpen }: Props) {
  return (
    <div className="h-11 flex items-center px-[18px] border-b border-warm-200 bg-warm-100 flex-shrink-0 relative select-none">
      <div className="absolute inset-0" data-tauri-drag-region />

      <div
        className="flex items-center gap-2 relative z-10"
        role="group"
        aria-label="Window controls"
      >
        <button
          type="button"
          onClick={() => win.close()}
          aria-label="Close window"
          title="Close"
          className="group w-3 h-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] hover:brightness-90 transition-[filter] cursor-default flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-500/60"
        >
          <span className="opacity-0 group-hover:opacity-100 text-[7px] font-bold leading-none text-black/50 transition-opacity">
            ×
          </span>
        </button>
        <button
          type="button"
          onClick={() => win.minimize()}
          aria-label="Minimize window"
          title="Minimize"
          className="group w-3 h-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] hover:brightness-90 transition-[filter] cursor-default flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-500/60"
        >
          <span className="opacity-0 group-hover:opacity-100 text-[7px] font-bold leading-none text-black/50 transition-opacity">
            –
          </span>
        </button>
        <button
          type="button"
          onClick={() => win.toggleMaximize()}
          aria-label="Maximize window"
          title="Maximize"
          className="group w-3 h-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] hover:brightness-90 transition-[filter] cursor-default flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-500/60"
        >
          <span className="opacity-0 group-hover:opacity-100 text-[7px] font-bold leading-none text-black/50 transition-opacity">
            +
          </span>
        </button>
      </div>

      {/* Centered title */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 -translate-x-1/2 text-[13px] text-warm-500 tracking-[0.05em] opacity-45 pointer-events-none"
      >
        Thought Catalogue
      </span>

      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        aria-pressed={sidebarOpen}
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        className="ml-auto relative z-10 p-1.5 rounded-md text-warm-900 opacity-40 hover:opacity-70 hover:bg-black/5 transition cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-500/60"
      >
        <SidebarIcon />
      </button>
    </div>
  );
}
