import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Entry = {
  name: string;
  is_dir: boolean;
};

function Sidebar({
  open,
  files,
  onOpenFolder,
  onBack,
  canGoBack,
  currentPath,
}: {
  open: boolean;
  files: Entry[];
  onOpenFolder: (name: string) => void;
  onBack: () => void;
  canGoBack: boolean;
  currentPath: string | null;
}) {
  return (
    <motion.div
      animate={{ width: open ? 260 : 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden border-r border-neutral-200 bg-neutral-50"
    >
      <div className="p-6 space-y-2">
        {currentPath && (
          <div className="text-xs text-neutral-400 mb-4 break-all">
            {currentPath}
          </div>
        )}

        {canGoBack && (
          <div
            onClick={onBack}
            className="text-neutral-400 cursor-pointer mb-4 hover:text-neutral-800 transition"
          >
            ← Back
          </div>
        )}

        {files.map((file) => (
          <div
            key={file.name}
            onClick={() => file.is_dir && onOpenFolder(file.name)}
            className="text-neutral-600 cursor-pointer hover:text-neutral-900 transition"
          >
            {file.is_dir ? "📁" : "📝"} {file.name}
          </div>
        ))}
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
    <div className="px-8 pt-8 pb-4 border-b border-neutral-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium">Thoughts</div>

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

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [files, setFiles] = useState<Entry[]>([]);
  const [pathStack, setPathStack] = useState<string[]>([]);

  // Initial folder load
  useEffect(() => {
    async function init() {
      let saved = await invoke<string | null>("get_saved_folder");

      if (!saved) {
        const selected = await open({
          directory: true,
          multiple: false,
        });

        if (typeof selected === "string") {
          await invoke("choose_folder", { path: selected });
          saved = selected;
        }
      }

      if (saved) {
        setPathStack([saved]);

        const contents = await invoke<Entry[]>("read_folder", {
          base: saved,
          child: null,
        });

        setFiles(contents);
      }
    }

    init();
  }, []);

  async function openFolder(name: string) {
    const currentPath = pathStack[pathStack.length - 1];
    if (!currentPath) return;

    const contents = await invoke<Entry[]>("read_folder", {
      base: currentPath,
      child: name,
    });

    const newPath = `${currentPath}/${name}`;

    setPathStack([...pathStack, newPath]);
    setFiles(contents);
  }

  async function goBack() {
    if (pathStack.length <= 1) return;

    const newStack = pathStack.slice(0, -1);
    const parentPath = newStack[newStack.length - 1];

    const contents = await invoke<Entry[]>("read_folder", {
      base: parentPath,
      child: null,
    });

    setPathStack(newStack);
    setFiles(contents);
  }

  const currentPath =
    pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;

  return (
    <div className="h-screen bg-neutral-100 text-neutral-900 flex flex-col">
      <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          files={files}
          onOpenFolder={openFolder}
          onBack={goBack}
          canGoBack={pathStack.length > 1}
          currentPath={currentPath}
        />

        <div className="flex-1 p-8 bg-white">
          <div className="text-neutral-500">
            Select a folder or note from the sidebar.
          </div>
        </div>
      </div>
    </div>
  );
}
