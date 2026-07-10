"use client";

interface DictVizProps {
  name: string;
  data: Record<string, unknown>;
}

export default function DictViz({ name, data }: DictVizProps) {
  const entries = Object.entries(data);

  return (
    <div className="rounded-md border border-zinc-800 p-3">
      <div className="mb-2 font-mono text-xs font-medium text-amber-400">
        {name} <span className="text-zinc-600">dict({entries.length})</span>
      </div>
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center gap-2 rounded-md border border-amber-800/30 bg-amber-900/20 px-3 py-1.5"
          >
            <span className="font-mono text-xs text-amber-300">{key}</span>
            <span className="text-zinc-600">:</span>
            <span className="font-mono text-xs text-zinc-300">
              {JSON.stringify(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
