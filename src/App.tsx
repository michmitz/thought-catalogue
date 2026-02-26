import { motion } from "framer-motion";

function Breadcrumbs() {
  return (
    <div className="text-sm text-neutral-400 flex gap-2">
      <span className="hover:text-neutral-200 cursor-pointer">
        Thoughts
      </span>
      <span>/</span>
      <span className="hover:text-neutral-200 cursor-pointer">
        New Folder
      </span>
      <span>/</span>
      <span className="text-neutral-200">
        New Folder
      </span>
    </div>
  );
}

function Actions() {
  return (
    <div className="mt-4 flex gap-3">
      <button className="px-4 py-2 text-sm border border-neutral-700 rounded-md hover:bg-neutral-800 transition">
        + Folder
      </button>
      <button className="px-4 py-2 text-sm border border-neutral-700 rounded-md hover:bg-neutral-800 transition">
        + Note
      </button>
    </div>
  );
}

function FolderList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-80 space-y-3"
    >
      <FolderItem name="New Folder" />
      <NoteItem name="Untitled" />
      <NoteItem name="Untitled" />
    </motion.div>
  );
}

function FolderItem({ name }: { name: string }) {
  return (
    <div className="text-neutral-300 hover:text-white cursor-pointer transition">
      📁 {name}
    </div>
  );
}

function NoteItem({ name }: { name: string }) {
  return (
    <div className="text-neutral-400 hover:text-white cursor-pointer transition">
      📝 {name}
    </div>
  );
}

function EditorPane() {
  return (
    <div className="flex-1 bg-neutral-900/40 rounded-xl p-8 text-neutral-500">
      Select a note to begin writing…
    </div>
  );
}

export default function App() {
  return (
    <div className="h-screen bg-neutral-950 text-neutral-200 flex flex-col">
      
      {/* Top Bar */}
      <div className="px-8 pt-8 pb-4">
        <Breadcrumbs />
        <Actions />
      </div>

      {/* Content Area */}
      <div className="flex-1 px-8 pb-8 flex gap-12">
        <FolderList />
        <EditorPane />
      </div>
    </div>
  );
}