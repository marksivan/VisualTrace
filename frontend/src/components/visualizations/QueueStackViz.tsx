"use client";

import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface QueueStackVizProps {
  name: string;
  type: "queue" | "stack";
  items: unknown[];
  theme?: Theme;
}

export default function QueueStackViz({
  name,
  type,
  items,
  theme = "dark",
}: QueueStackVizProps) {
  const t = getThemeClasses(theme);
  const displayItems = (type === "stack" ? [...items].reverse() : items).map(String);
  const isQueue = type === "queue";

  const colors = isQueue
    ? {
        label: "text-teal-600 dark:text-teal-400",
        cell: "border-teal-400/50 bg-teal-50 text-teal-800 dark:border-teal-700/50 dark:bg-teal-900/30 dark:text-teal-200",
      }
    : {
        label: "text-orange-600 dark:text-orange-400",
        cell: "border-orange-400/50 bg-orange-50 text-orange-800 dark:border-orange-700/50 dark:bg-orange-900/30 dark:text-orange-200",
      };

  return (
    <div className={`p-3 ${t.card}`}>
      <div className={`mb-2 font-mono text-xs font-medium ${colors.label}`}>
        {name} <span className={t.labelMuted}>{type}</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto">
        {isQueue && (
          <span className={`mr-1 shrink-0 font-mono text-[10px] ${t.labelMuted}`}>
            front →
          </span>
        )}
        {displayItems.length === 0 ? (
          <span className={`text-xs ${t.subtext}`}>empty</span>
        ) : (
          displayItems.map((item, i) => (
            <div
              key={`${item}-${i}`}
              className={`flex h-10 min-w-[2.5rem] shrink-0 items-center justify-center rounded-md border px-2 font-mono text-sm ${colors.cell}`}
            >
              {item}
            </div>
          ))
        )}
        {isQueue && displayItems.length > 0 && (
          <span className={`ml-1 shrink-0 font-mono text-[10px] ${t.labelMuted}`}>
            ← back
          </span>
        )}
        {!isQueue && displayItems.length > 0 && (
          <span className={`ml-1 shrink-0 font-mono text-[10px] ${t.labelMuted}`}>
            ↑ top
          </span>
        )}
      </div>
    </div>
  );
}
