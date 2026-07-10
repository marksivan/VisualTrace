import { getLastVisualizableStep } from "@/lib/visualization";
import type { TraceStep } from "@/types";

/** Pick the best trace step to show right after a run completes. */
export function getPreferredStepAfterRun(trace: TraceStep[]): number {
  if (trace.length === 0) return 0;
  return getLastVisualizableStep(trace);
}

/** Reset the playback scrubber when editor content no longer matches the last run. */
export function shouldResetPlaybackOnSourceChange(
  newSource: string,
  executedSource: string | null,
  hasTrace: boolean
): boolean {
  return hasTrace && executedSource !== null && newSource !== executedSource;
}
