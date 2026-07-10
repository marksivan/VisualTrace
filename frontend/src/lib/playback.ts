import { getInspectableVariables } from "@/lib/format";
import type { TraceStep } from "@/types";

/** Pick the best trace step to show right after a run completes. */
export function getPreferredStepAfterRun(trace: TraceStep[]): number {
  if (trace.length === 0) return 0;

  for (let i = trace.length - 1; i >= 0; i--) {
    if (getInspectableVariables(trace[i]).length > 0) {
      return i;
    }
  }

  return trace.length - 1;
}
