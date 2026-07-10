"use client";

import { Play, Square, Loader2 } from "lucide-react";

interface ExecutionControlsProps {
  onRun: () => void;
  onStop: () => void;
  isRunning: boolean;
}

export default function ExecutionControls({
  onRun,
  onStop,
  isRunning,
}: ExecutionControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {isRunning ? (
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-500"
        >
          <Square className="h-3.5 w-3.5" />
          Stop
        </button>
      ) : (
        <button
          onClick={onRun}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Run
        </button>
      )}
    </div>
  );
}
