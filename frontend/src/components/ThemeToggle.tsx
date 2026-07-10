"use client";

import { Moon, Sun } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const t = getThemeClasses(theme);

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium ${t.toggleBtn}`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-3.5 w-3.5" />
          Light
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5" />
          Dark
        </>
      )}
    </button>
  );
}
