import { getCurrentWindow } from "@tauri-apps/api/window";
import React, { useEffect, useRef, useState } from "react";
import { THEMES, type ThemeKey } from "../hooks/useTheme";
import type { BrowseView } from "../types";
import { CalendarIcon, CheckIcon, GearIcon, GridIcon, ListIcon, SidebarIcon } from "./icons";

type Props = {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  browseView: BrowseView;
  setView: (v: BrowseView) => void;
};

const win = getCurrentWindow();

const BROWSE_BUTTONS: { v: NonNullable<BrowseView>; icon: React.ReactElement; title: string }[] = [
  { v: 'icons', icon: <GridIcon />,     title: 'Icon view' },
  { v: 'list',  icon: <ListIcon />,     title: 'List view' },
  { v: 'date',  icon: <CalendarIcon />, title: 'By date created' },
];

export function TopBar({ sidebarOpen, setSidebarOpen, theme, setTheme, browseView, setView }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  return (
    <div className="h-11 flex items-center px-[18px] border-b border-border bg-sidebar flex-shrink-0 relative select-none">
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
          className="group w-3 h-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] hover:brightness-90 transition-[filter] cursor-default flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-muted/60"
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
          className="group w-3 h-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] hover:brightness-90 transition-[filter] cursor-default flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-muted/60"
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
          className="group w-3 h-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.15)] hover:brightness-90 transition-[filter] cursor-default flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-muted/60"
        >
          <span className="opacity-0 group-hover:opacity-100 text-[7px] font-bold leading-none text-black/50 transition-opacity">
            +
          </span>
        </button>
      </div>

      <span
        aria-hidden="true"
        className="absolute left-1/2 -translate-x-1/2 text-[13px] text-text-muted tracking-[0.05em] opacity-45 pointer-events-none"
      >
        Thought Catalogue
      </span>

      <div className="ml-auto flex items-center gap-1 relative z-10" ref={menuRef}>
        <div className="flex bg-hover rounded-[var(--radius)] p-0.5 mr-1">
          {BROWSE_BUTTONS.map(({ v, icon, title }) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              title={title}
              aria-pressed={browseView === v}
              className={`px-2 py-1 rounded-[var(--radius)] transition cursor-default ${
                browseView === v
                  ? 'bg-bg opacity-90'
                  : 'opacity-40 hover:opacity-70'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Theme settings"
          title="Theme"
          aria-pressed={menuOpen}
          className="p-1.5 rounded-[var(--radius)] text-text opacity-40 hover:opacity-80 hover:bg-hover transition cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-muted/60"
        >
          <GearIcon />
        </button>
        {!browseView && (
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-pressed={sidebarOpen}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className="p-1.5 rounded-[var(--radius)] text-text opacity-40 hover:opacity-70 hover:bg-hover transition cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-muted/60"
          >
            <SidebarIcon />
          </button>
        )}

        {menuOpen && (
          <div className="absolute right-0 top-9 w-[280px] p-2 rounded-[10px] bg-bg border border-border shadow-xl z-50">
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-text-faint px-2 pt-1.5 pb-1">
              Theme
            </div>
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTheme(t.key); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-[7px] text-left hover:bg-hover transition cursor-default ${
                  theme === t.key ? "bg-hover" : ""
                }`}
              >
                <div className="flex gap-[3px] flex-shrink-0">
                  {t.swatches.map((c, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-[22px] rounded-[3px] border border-black/5"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-text">{t.name}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{t.desc}</div>
                </div>
                {theme === t.key && (
                  <CheckIcon className="text-accent flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
