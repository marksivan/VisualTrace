import type { TraceStep } from "@/types";
import { isInspectableVariable } from "@/lib/format";

export type VizType = "array" | "dict" | "queue" | "stack" | "primitive";

export interface VizItem {
  name: string;
  type: VizType;
  value: unknown;
}

export function getVisualizableVariables(step: TraceStep | null): VizItem[] {
  if (!step) return [];

  const merged = { ...step.globals, ...step.locals };
  const items: VizItem[] = [];

  for (const [name, value] of Object.entries(merged)) {
    if (!isInspectableVariable(name, value)) continue;

    const type = detectVizType(name, value);
    if (type && type !== "primitive") {
      items.push({ name, type, value });
    }
  }

  return items;
}

export function shouldShowRecursionTree(step: TraceStep | null): boolean {
  if (!step || step.stack.length < 2) return false;

  const userFrames = step.stack.filter(
    (f) => f.function !== "<module>" && !f.function.startsWith("<")
  );

  if (userFrames.length < 2) return false;

  const names = userFrames.map((f) => f.function);
  const hasRepeat = names.some((name, i) => names.indexOf(name) !== i);
  return hasRepeat;
}

function detectVizType(name: string, value: unknown): VizType | null {
  const lower = name.toLowerCase();

  if (Array.isArray(value)) {
    if (lower.includes("queue") || lower.includes("deque")) return "queue";
    if (lower.includes("stack")) return "stack";
    return "array";
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return "dict";
  }

  if (lower.includes("queue") || lower.includes("deque")) return "queue";
  if (lower.includes("stack")) return "stack";

  if (
    typeof value === "number" ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return "primitive";
  }

  return null;
}

/** Find a loop index variable to highlight in array visualizations. */
export function getActiveArrayIndex(step: TraceStep | null): number | undefined {
  if (!step) return undefined;

  const indexKeys = ["i", "j", "k", "idx", "index", "left", "right", "mid"];
  for (const key of indexKeys) {
    const val = step.locals[key];
    if (typeof val === "number" && Number.isInteger(val) && val >= 0) {
      return val;
    }
  }

  return undefined;
}

export function toArrayItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}
