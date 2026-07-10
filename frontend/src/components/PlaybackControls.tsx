"use client";

import {
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

interface PlaybackControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onStepBack: () => void;
  onStepForward: () => void;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onSeek: (step: number) => void;
  disabled: boolean;
}

export default function PlaybackControls({
  currentStep,
  totalSteps,
  isPlaying,
  onStepBack,
  onStepForward,
  onPlay,
  onPause,
  onRestart,
  onSeek,
  disabled,
}: PlaybackControlsProps) {
  const maxStep = Math.max(0, totalSteps - 1);

  return (
    <div className="flex flex-col gap-2 border-t border-zinc-800 px-3 py-2">
      <div className="flex items-center gap-1">
        <button
          onClick={onRestart}
          disabled={disabled || totalSteps === 0}
          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30"
          title="Restart"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={onStepBack}
          disabled={disabled || currentStep <= 0}
          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30"
          title="Previous step"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          onClick={onStepBack}
          disabled={disabled || currentStep <= 0}
          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30"
          title="Previous line"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {isPlaying ? (
          <button
            onClick={onPause}
            className="rounded-md bg-blue-600 p-1.5 text-white hover:bg-blue-500"
            title="Pause"
          >
            <Pause className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={disabled || totalSteps === 0}
            className="rounded-md bg-blue-600 p-1.5 text-white hover:bg-blue-500 disabled:opacity-30"
            title="Play"
          >
            <Play className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={onStepForward}
          disabled={disabled || currentStep >= maxStep}
          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30"
          title="Next line"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <span className="ml-2 text-xs text-zinc-500">
          Step {totalSteps > 0 ? currentStep + 1 : 0} / {totalSteps}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={maxStep}
        value={currentStep}
        onChange={(e) => onSeek(parseInt(e.target.value, 10))}
        disabled={disabled || totalSteps === 0}
        className="w-full accent-blue-500 disabled:opacity-30"
        aria-label="Timeline scrubber"
      />
    </div>
  );
}
