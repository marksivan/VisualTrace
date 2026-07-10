"use client";

import type { StackFrame } from "@/types";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface RecursionVizProps {
  stack: StackFrame[];
  theme?: Theme;
}

export default function RecursionViz({ stack, theme = "dark" }: RecursionVizProps) {
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";

  const frames = stack.filter(
    (f) => f.function !== "<module>" && !f.function.startsWith("<")
  );

  if (frames.length < 2) return null;

  return (
    <div className={`p-3 ${t.card}`}>
      <div className="mb-2 font-mono text-xs font-medium text-cyan-600 dark:text-cyan-400">
        Recursion call stack
      </div>
      <div className="space-y-0">
        {frames.map((frame, i) => (
          <div key={`${frame.function}-${frame.line}-${i}`} style={{ paddingLeft: `${i * 16}px` }}>
            <div className="flex items-center gap-1 py-0.5">
              {i > 0 && <span className={t.labelMuted}>└─</span>}
              <span
                className={`rounded border px-2 py-0.5 font-mono text-xs ${
                  isDark
                    ? "border-cyan-800/40 bg-cyan-900/20 text-cyan-300"
                    : "border-cyan-300 bg-cyan-50 text-cyan-800"
                }`}
              >
                {frame.function}() @ L{frame.line}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
