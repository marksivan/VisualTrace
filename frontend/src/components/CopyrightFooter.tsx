"use client";

import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface CopyrightFooterProps {
  theme?: Theme;
  author?: string;
}

export default function CopyrightFooter({
  theme = "dark",
  author = "Mark S Tamakloe",
}: CopyrightFooterProps) {
  const t = getThemeClasses(theme);
  const year = new Date().getFullYear();

  return (
    <footer
      className={`shrink-0 border-t px-3 py-2 text-center text-xs sm:px-4 ${t.panel} ${t.subtext}`}
    >
      © {year} {author}
    </footer>
  );
}
