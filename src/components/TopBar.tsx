import { getCurrentWindow } from "@tauri-apps/api/window";

type Props = {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
};

function SidebarIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M3 9h18M9 21V9m-6 0V5a2 2 0 012-2h14a2 2 0 012 2v4" />
    </svg>
  );
}

const win = getCurrentWindow();

export function TopBar({ sidebarOpen, setSidebarOpen }: Props) {
  return (
    <div className="h-11 flex items-center px-[18px] border-b border-warm-200 bg-warm-100 flex-shrink-0 relative select-none">
      <div className="absolute inset-0" data-tauri-drag-region />

      <div className="flex items-center gap-2 relative z-10">
        <button
          onClick={() => win.close()}
          className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] hover:brightness-90 transition-[filter] cursor-default"
        />
        <button
          onClick={() => win.minimize()}
          className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] hover:brightness-90 transition-[filter] cursor-default"
        />
        <button
          onClick={() => win.toggleMaximize()}
          className="w-3 h-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] hover:brightness-90 transition-[filter] cursor-default"
        />
      </div>

      <span className="absolute left-1/2 -translate-x-1/2 text-[13px] text-warm-500 tracking-[0.05em] opacity-45 pointer-events-none">
        Thought Catalogue
      </span>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="ml-auto relative z-10 p-1.5 rounded-md text-warm-900 opacity-40 hover:opacity-70 hover:bg-black/5 transition cursor-default"
      >
        <SidebarIcon />
      </button>
    </div>
  );
}
