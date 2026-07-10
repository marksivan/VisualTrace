"use client";

interface ArrayVizProps {
  name: string;
  data: unknown[];
}

export default function ArrayViz({ name, data }: ArrayVizProps) {
  return (
    <div className="rounded-md border border-zinc-800 p-3">
      <div className="mb-2 font-mono text-xs font-medium text-purple-400">
        {name} <span className="text-zinc-600">array[{data.length}]</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex h-10 min-w-[2.5rem] items-center justify-center rounded-md border border-purple-700/50 bg-purple-900/30 px-2 font-mono text-sm text-purple-200">
              {formatValue(item)}
            </div>
            <span className="mt-0.5 font-mono text-[10px] text-zinc-600">{i}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (typeof v === "string") return `"${v}"`;
  return String(v);
}
