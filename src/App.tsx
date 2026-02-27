import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type View = "root" | "folder";

function Sidebar({ open }: { open: boolean }) {
  return (
    <motion.div
      animate={{ width: open ? 260 : 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden border-r border-neutral-200 bg-neutral-50"
    >
      <div className="p-6 space-y-2">
        <div className="text-neutral-600">📁 Inspiration</div>
        <div className="text-neutral-600">📁 Resume</div>
      </div>
    </motion.div>
  );
}

function TopBar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}) {
  return (
    <div className="px-8 pt-8 pb-4">
      <div className="flex items-center justify-between">
        <Breadcrumbs />

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-sm text-neutral-500 hover:text-neutral-900 transition"
        >
          {sidebarOpen ? "Hide Library" : "Show Library"}
        </button>
      </div>

      <Actions />
    </div>
  );
}

function Breadcrumbs() {
  return (
    <div className="text-sm flex gap-2 text-neutral-500">
      <span className="hover:text-neutral-900 cursor-pointer">Thoughts</span>
      <span>/</span>
      <span className="hover:text-neutral-900 cursor-pointer">New Folder</span>
      <span>/</span>
      <span className="text-neutral-900">Current Folder</span>
    </div>
  );
}

function Actions() {
  return (
    <div className="mt-4 flex gap-3">
      <button className="px-4 py-2 text-sm border border-neutral-300 rounded-md hover:bg-neutral-200 transition">
        + Folder
      </button>
      <button className="px-4 py-2 text-sm border border-neutral-300 rounded-md hover:bg-neutral-200 transition">
        + Note
      </button>
    </div>
  );
}

function RootView({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-4">
      <div
        onClick={onOpen}
        className="cursor-pointer text-neutral-700 hover:text-neutral-900 transition"
      >
        📁 Inspiration
      </div>
    </div>
  );
}

function FolderView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-neutral-500 hover:text-neutral-900 transition"
      >
        ← Back
      </button>

      <div className="text-neutral-700">📝 note.md</div>
      <div className="text-neutral-700">📝 ideas.md</div>
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<View>("root");
  const [direction, setDirection] = useState(1);

  const navigateForward = () => {
    setDirection(1);
    setView("folder");
  };

  const navigateBack = () => {
    setDirection(-1);
    setView("root");
  };

  return (
    <div className="h-screen bg-neutral-100 text-neutral-900 flex flex-col">
      <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} />

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ x: direction * 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -40, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0 p-8"
            >
              {view === "root" ? (
                <RootView onOpen={navigateForward} />
              ) : (
                <FolderView onBack={navigateBack} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
