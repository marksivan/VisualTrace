"use client";

import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";
import type { LinkedListNode } from "@/lib/visualization";
import { linkedListToArray } from "@/lib/visualization";

interface LinkedListVizProps {
  name: string;
  head: LinkedListNode | null | undefined;
  theme?: Theme;
}

export default function LinkedListViz({
  name,
  head,
  theme = "dark",
}: LinkedListVizProps) {
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";
  const nodes = linkedListToArray(head);

  return (
    <div className={`p-3 ${t.card}`}>
      <div className="mb-2 font-mono text-xs font-medium text-pink-600 dark:text-pink-400">
        {name} <span className={t.labelMuted}>linked list</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {nodes.length === 0 ? (
          <span className={`text-xs ${t.subtext}`}>empty</span>
        ) : (
          nodes.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-md border px-2 font-mono text-sm ${
                  isDark
                    ? "border-pink-700/50 bg-pink-900/30 text-pink-200"
                    : "border-pink-300 bg-pink-50 text-pink-800"
                }`}
              >
                {String(item)}
              </div>
              {i < nodes.length - 1 && (
                <span className={`font-mono text-xs ${t.labelMuted}`}>→</span>
              )}
            </div>
          ))
        )}
        {nodes.length > 0 && (
          <span className={`font-mono text-xs ${t.labelMuted}`}>→ null</span>
        )}
      </div>
    </div>
  );
}
