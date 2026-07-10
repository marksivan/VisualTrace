"use client";

interface QueueStackVizProps {
  name: string;
  type: "queue" | "stack";
  data: string;
}

export default function QueueStackViz({ name, type, data }: QueueStackVizProps) {
  let items: string[] = [];
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) items = parsed.map(String);
  } catch {
    items = data ? [data] : [];
  }

  const displayItems = type === "stack" ? [...items].reverse() : items;
  const color = type === "queue" ? "teal" : "orange";

  return (
    <div className="rounded-md border border-zinc-800 p-3">
      <div className={`mb-2 font-mono text-xs font-medium text-${color}-400`}>
        {name} <span className="text-zinc-600">{type}</span>
      </div>
      <div className="flex items-end gap-1">
        {type === "queue" && (
          <span className="mr-1 font-mono text-[10px] text-zinc-600">front →</span>
        )}
        {displayItems.map((item, i) => (
          <div
            key={i}
            className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-md border bg-${color}-900/30 px-2 font-mono text-sm`}
            style={{
              borderColor: type === "queue" ? "rgb(45 212 191 / 0.5)" : "rgb(251 146 60 / 0.5)",
              backgroundColor: type === "queue" ? "rgb(19 78 74 / 0.3)" : "rgb(124 45 18 / 0.3)",
              color: type === "queue" ? "rgb(153 246 228)" : "rgb(254 215 170)",
            }}
          >
            {item}
          </div>
        ))}
        {type === "queue" && (
          <span className="ml-1 font-mono text-[10px] text-zinc-600">← back</span>
        )}
        {type === "stack" && (
          <span className="ml-1 font-mono text-[10px] text-zinc-600">↑ top</span>
        )}
      </div>
    </div>
  );
}
