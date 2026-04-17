type Props = {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
};

export function TopBar({ sidebarOpen, setSidebarOpen }: Props) {
  return (
    <div className="px-8 pt-8 pb-4 border-b border-neutral-200 bg-slate-300">
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium text-white uppercase tracking-wide">
          Thoughts
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition"
        >
          {sidebarOpen ? "Hide Library" : "Show Library"}
        </button>
      </div>
    </div>
  );
}
