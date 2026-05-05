import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export type ThemeKey = "paper" | "garden" | "linen" | "mono";

export const THEMES: { key: ThemeKey; name: string; desc: string; swatches: string[] }[] = [
  { key: "paper",  name: "Paper & Ink",      desc: "Off-white paper, deep ink.",          swatches: ["#f4f1ea", "#ebe7dc", "#1a1814", "#5b4a35"] },
  { key: "garden", name: "Garden",           desc: "Sage, dusty rose, soft earth.",       swatches: ["#f5f3ec", "#e9ebe2", "#3a4a3c", "#a86b6b"] },
  { key: "linen",  name: "Linen & Stone",    desc: "Cool gray-beige, slate. Very muted.", swatches: ["#eeece8", "#e3e0d9", "#3d4148", "#6d7178"] },
  { key: "mono",   name: "Monochrome Night", desc: "Grayscale + cyan pop.",               swatches: ["#1a1a1a", "#222222", "#e8e8e8", "#5fd4d6"] },
];

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeKey>("paper");

  useEffect(() => {
    invoke<ThemeKey | null>("get_theme").then(saved => {
      if (saved) setThemeState(saved);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function setTheme(t: ThemeKey) {
    setThemeState(t);
    invoke("set_theme", { theme: t }).catch(console.error);
  }

  return { theme, setTheme };
}
