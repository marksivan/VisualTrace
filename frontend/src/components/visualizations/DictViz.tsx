"use client";

import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface DictVizProps {
  name: string;
  data: Record<string, unknown>;
  theme?: Theme;
}

export default function DictViz({ name, data, theme = "dark" }: DictVizProps) {
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";
  const entries = Object.entries(data);

  return (
    <div className={`p-3 ${t.card}`}>
      <div className="mb-2 font-mono text-xs font-medium text-amber-600 dark:text-amber-400">
        {name} <span className={t.labelMuted}>dict({entries.length})</span>
      </div>
      {entries.length === 0 ? (
        <span className={`text-xs ${t.subtext}`}>empty</span>
      ) : (
        <div className="space-y-1">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 ${
                isDark
                  ? "border-amber-800/30 bg-amber-900/20"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <span className="font-mono text-xs text-amber-700 dark:text-amber-300">
                {key}
              </span>
              <span className={t.labelMuted}>:</span>
              <span className={`font-mono text-xs ${t.cardText}`}>
                {JSON.stringify(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
