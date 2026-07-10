"use client";

import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface ArrayVizProps {
  name: string;
  data: unknown[];
  highlightIndex?: number;
  highlightIndices?: number[];
  variant?: "array" | "string";
  theme?: Theme;
}

export default function ArrayViz({
  name,
  data,
  highlightIndex,
  highlightIndices,
  variant = "array",
  theme = "dark",
}: ArrayVizProps) {
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";
  const highlighted = new Set(
    highlightIndices ?? (highlightIndex !== undefined ? [highlightIndex] : [])
  );

  return (
    <div className={`p-3 ${t.card}`}>
      <div className="mb-2 font-mono text-xs font-medium text-purple-500 dark:text-purple-400">
        {name}{" "}
        <span className={t.labelMuted}>
          {variant}[{data.length}]
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {data.length === 0 ? (
          <span className={`text-xs ${t.subtext}`}>empty</span>
        ) : (
          data.map((item, i) => {
            const isHighlighted = highlighted.has(i);
            return (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-md border px-2 font-mono text-sm ${
                    isHighlighted
                      ? "border-blue-500 bg-blue-500/20 text-blue-600 dark:text-blue-200 ring-2 ring-blue-500/40"
                      : isDark
                        ? "border-purple-700/50 bg-purple-900/30 text-purple-200"
                        : "border-purple-300 bg-purple-50 text-purple-800"
                  }`}
                >
                  {formatValue(item)}
                </div>
                <span className={`mt-0.5 font-mono text-[10px] ${t.labelMuted}`}>{i}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (typeof v === "string") return `"${v}"`;
  return String(v);
}
