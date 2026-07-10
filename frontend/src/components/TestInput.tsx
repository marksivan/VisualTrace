"use client";

import type { ExecutionMode } from "@/types";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface TestInputProps {
  executionMode: ExecutionMode;
  onExecutionModeChange: (mode: ExecutionMode) => void;
  stdin: string;
  onStdinChange: (value: string) => void;
  functionName: string;
  onFunctionNameChange: (value: string) => void;
  functionArgs: string;
  onFunctionArgsChange: (value: string) => void;
  theme?: Theme;
}

export default function TestInput({
  executionMode,
  onExecutionModeChange,
  stdin,
  onStdinChange,
  functionName,
  onFunctionNameChange,
  functionArgs,
  onFunctionArgsChange,
  theme = "dark",
}: TestInputProps) {
  const t = getThemeClasses(theme);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <label className={`mb-1 block text-xs font-medium ${t.subtext}`}>
          Execution Mode
        </label>
        <div className={`inline-flex rounded-md border p-0.5 ${t.panel}`}>
          {(["script", "function"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onExecutionModeChange(mode)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize ${
                executionMode === mode ? t.tabActive : t.tabInactive
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <p className={`mt-1 text-[11px] ${t.labelMuted}`}>
          {executionMode === "script"
            ? "Write the full script, including any function calls, in the editor."
            : "Keep only the function definition in the editor. Call it with the fields below."}
        </p>
      </div>

      <div>
        <label className={`mb-1 block text-xs font-medium ${t.subtext}`}>
          Standard Input
        </label>
        <textarea
          value={stdin}
          onChange={(e) => onStdinChange(e.target.value)}
          placeholder="Program input (stdin)..."
          rows={2}
          className={`w-full resize-none ${t.input}`}
        />
      </div>

      {executionMode === "function" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`mb-1 block text-xs font-medium ${t.subtext}`}>
              Function Name
            </label>
            <input
              type="text"
              value={functionName}
              onChange={(e) => onFunctionNameChange(e.target.value)}
              placeholder="e.g. two_sum"
              className={`w-full ${t.input}`}
            />
          </div>
          <div>
            <label className={`mb-1 block text-xs font-medium ${t.subtext}`}>
              Function Args (JSON)
            </label>
            <input
              type="text"
              value={functionArgs}
              onChange={(e) => onFunctionArgsChange(e.target.value)}
              placeholder='e.g. [[2,7,11,15], 9]'
              className={`w-full ${t.input}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
