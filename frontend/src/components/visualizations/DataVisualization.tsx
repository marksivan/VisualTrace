"use client";

import type { TraceStep } from "@/types";
import ArrayViz from "./ArrayViz";
import DictViz from "./DictViz";
import QueueStackViz from "./QueueStackViz";
import RecursionViz from "./RecursionViz";

interface DataVisualizationProps {
  step: TraceStep | null;
}

export default function DataVisualization({ step }: DataVisualizationProps) {
  if (!step) {
    return (
      <p className="text-sm text-zinc-500">
        Run your code to see data structure visualizations.
      </p>
    );
  }

  const allVars = { ...step.globals, ...step.locals };
  const entries = Object.entries(allVars);

  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">No data to visualize.</p>;
  }

  return (
    <div className="space-y-4">
      {entries.map(([name, value]) => (
        <VisualizationItem key={name} name={name} value={value} stack={step.stack} />
      ))}
    </div>
  );
}

function VisualizationItem({
  name,
  value,
  stack,
}: {
  name: string;
  value: unknown;
  stack: TraceStep["stack"];
}) {
  if (Array.isArray(value)) {
    return <ArrayViz name={name} data={value} />;
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return <DictViz name={name} data={value as Record<string, unknown>} />;
  }

  if (name.toLowerCase().includes("queue")) {
    return <QueueStackViz name={name} type="queue" data={String(value)} />;
  }

  if (name.toLowerCase().includes("stack")) {
    return <QueueStackViz name={name} type="stack" data={String(value)} />;
  }

  if (stack.length > 2) {
    return <RecursionViz name={name} stack={stack} />;
  }

  return (
    <div className="rounded-md border border-zinc-800 p-3">
      <div className="mb-1 font-mono text-xs text-zinc-500">{name}</div>
      <pre className="font-mono text-xs text-zinc-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
