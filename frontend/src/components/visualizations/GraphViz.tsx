"use client";

import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface GraphVizProps {
  name: string;
  adjacency: Record<string, unknown[]>;
  theme?: Theme;
}

export default function GraphViz({ name, adjacency, theme = "dark" }: GraphVizProps) {
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";
  const entries = Object.entries(adjacency);

  return (
    <div className={`p-3 ${t.card}`}>
      <div className="mb-2 font-mono text-xs font-medium text-sky-600 dark:text-sky-400">
        {name} <span className={t.labelMuted}>graph</span>
      </div>
      {entries.length === 0 ? (
        <span className={`text-xs ${t.subtext}`}>empty</span>
      ) : (
        <div className="space-y-1.5">
          {entries.map(([node, neighbors]) => (
            <div
              key={node}
              className={`flex flex-wrap items-center gap-2 rounded-md border px-3 py-1.5 ${
                isDark
                  ? "border-sky-800/30 bg-sky-900/20"
                  : "border-sky-200 bg-sky-50"
              }`}
            >
              <span className="font-mono text-xs font-medium text-sky-700 dark:text-sky-300">
                {node}
              </span>
              <span className={t.labelMuted}>→</span>
              <span className={`font-mono text-xs ${t.cardText}`}>
                {neighbors.length > 0 ? neighbors.join(", ") : "∅"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
