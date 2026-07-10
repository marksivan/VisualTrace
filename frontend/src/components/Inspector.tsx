"use client";

import { useState } from "react";
import type { TraceStep } from "@/types";
import DataVisualization from "./visualizations/DataVisualization";

interface InspectorProps {
  step: TraceStep | null;
  stdout: string;
  stderr: string;
  result: unknown;
  error: string | null;
}

export default function Inspector({
  step,
  stdout,
  stderr,
  result,
  error,
}: InspectorProps) {
  const [activeTab, setActiveTab] = useState<"variables" | "stack" | "console" | "visualize">("variables");

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-zinc-800">
        {(["variables", "stack", "console", "visualize"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium capitalize ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3">
        {activeTab === "variables" && (
          <VariablesPanel step={step} result={result} />
        )}
        {activeTab === "stack" && <StackPanel step={step} />}
        {activeTab === "console" && (
          <ConsolePanel stdout={stdout} stderr={stderr} error={error} />
        )}
        {activeTab === "visualize" && <DataVisualization step={step} />}
      </div>
    </div>
  );
}

function VariablesPanel({
  step,
  result,
}: {
  step: TraceStep | null;
  result: unknown;
}) {
  if (!step) {
    return (
      <p className="text-sm text-zinc-500">
        Run your code to inspect variables at each step.
      </p>
    );
  }

  const allVars = { ...step.globals, ...step.locals };

  return (
    <div className="space-y-3">
      {Object.keys(allVars).length === 0 ? (
        <p className="text-sm text-zinc-500">No variables in scope.</p>
      ) : (
        Object.entries(allVars).map(([name, value]) => (
          <div key={name} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
            <div className="font-mono text-xs font-medium text-blue-400">{name}</div>
            <pre className="mt-1 overflow-x-auto font-mono text-xs text-zinc-300">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))
      )}
      {result !== null && result !== undefined && (
        <div className="rounded-md border border-green-800/50 bg-green-900/20 p-2">
          <div className="font-mono text-xs font-medium text-green-400">result</div>
          <pre className="mt-1 overflow-x-auto font-mono text-xs text-zinc-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function StackPanel({ step }: { step: TraceStep | null }) {
  if (!step || step.stack.length === 0) {
    return <p className="text-sm text-zinc-500">No call stack available.</p>;
  }

  return (
    <div className="space-y-1">
      {step.stack.map((frame, i) => (
        <div
          key={`${frame.function}-${frame.line}-${i}`}
          className={`rounded-md border px-3 py-2 font-mono text-xs ${
            i === 0
              ? "border-blue-700/50 bg-blue-900/20 text-blue-300"
              : "border-zinc-800 bg-zinc-900/50 text-zinc-400"
          }`}
        >
          <span className="font-medium">{frame.function}</span>
          <span className="text-zinc-600"> @ line {frame.line}</span>
        </div>
      ))}
    </div>
  );
}

function ConsolePanel({
  stdout,
  stderr,
  error,
}: {
  stdout: string;
  stderr: string;
  error: string | null;
}) {
  const hasOutput = stdout || stderr || error;

  if (!hasOutput) {
    return <p className="text-sm text-zinc-500">No console output yet.</p>;
  }

  return (
    <div className="space-y-2 font-mono text-xs">
      {stdout && (
        <div>
          <div className="mb-1 text-zinc-500">stdout</div>
          <pre className="whitespace-pre-wrap rounded-md bg-zinc-900 p-2 text-zinc-300">
            {stdout}
          </pre>
        </div>
      )}
      {stderr && (
        <div>
          <div className="mb-1 text-yellow-600">stderr</div>
          <pre className="whitespace-pre-wrap rounded-md bg-yellow-900/20 p-2 text-yellow-300">
            {stderr}
          </pre>
        </div>
      )}
      {error && (
        <div>
          <div className="mb-1 text-red-500">error</div>
          <pre className="whitespace-pre-wrap rounded-md bg-red-900/20 p-2 text-red-300">
            {error}
          </pre>
        </div>
      )}
    </div>
  );
}
