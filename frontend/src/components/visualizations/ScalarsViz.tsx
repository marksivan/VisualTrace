"use client";

import { formatValueForDisplay } from "@/lib/format";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface ScalarsVizProps {
  variables: Array<{ name: string; value: unknown }>;
  theme?: Theme;
}

export default function ScalarsViz({
  variables,
  theme = "dark",
}: ScalarsVizProps) {
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";

  if (variables.length === 0) return null;

  return (
    <div className={`p-3 ${t.card}`}>
      <div className="mb-2 font-mono text-xs font-medium text-sky-600 dark:text-sky-400">
        Variables{" "}
        <span className={t.labelMuted}>({variables.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {variables.map(({ name, value }) => (
          <div
            key={name}
            className={`min-w-[5rem] rounded-md border px-3 py-2 ${
              isDark
                ? "border-sky-800/40 bg-sky-900/20"
                : "border-sky-200 bg-sky-50"
            }`}
          >
            <div className={`font-mono text-[10px] ${t.labelMuted}`}>{name}</div>
            <div
              className={`mt-0.5 font-mono text-sm font-medium text-sky-800 dark:text-sky-100`}
            >
              {formatValueForDisplay(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
