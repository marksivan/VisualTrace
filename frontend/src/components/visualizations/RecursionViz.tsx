"use client";

import type { StackFrame } from "@/types";

interface RecursionVizProps {
  name: string;
  stack: StackFrame[];
}

export default function RecursionViz({ stack }: RecursionVizProps) {
  const frames = stack.filter((f) => f.function !== "<module>");

  if (frames.length < 2) return null;

  return (
    <div className="rounded-md border border-zinc-800 p-3">
      <div className="mb-2 font-mono text-xs font-medium text-cyan-400">
        Recursion Tree
      </div>
      <div className="space-y-0">
        {frames.map((frame, i) => (
          <div key={`${frame.function}-${i}`} style={{ paddingLeft: `${i * 16}px` }}>
            <div className="flex items-center gap-1 py-0.5">
              {i > 0 && <span className="text-zinc-600">└─</span>}
              <span className="rounded border border-cyan-800/40 bg-cyan-900/20 px-2 py-0.5 font-mono text-xs text-cyan-300">
                {frame.function}() @ L{frame.line}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
