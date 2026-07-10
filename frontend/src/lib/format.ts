import type { TraceStep } from "@/types";

/**
 * Format a value for display in the inspector.
 * Simple values stay compact; complex structures are pretty-printed.
 */
export function formatValueForDisplay(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  try {
    const compact = JSON.stringify(value);
    if (compact && compact.length <= 80) return compact;
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function isMultilineDisplay(text: string): boolean {
  return text.includes("\n");
}

/** Hide functions, modules, and other non-data values from the inspector. */
export function isInspectableVariable(name: string, value: unknown): boolean {
  if (name.startsWith("_")) return false;
  if (name === "result") return false;

  if (typeof value === "function") return false;

  if (typeof value === "string") {
    const hiddenPrefixes = [
      "<function ",
      "<builtin function",
      "<method ",
      "<module ",
      "<class ",
      "<cell ",
      "<wrapper ",
    ];
    if (hiddenPrefixes.some((prefix) => value.startsWith(prefix))) {
      return false;
    }
  }

  return true;
}

/** Return `result` only if it exists in scope at the current trace step. */
export function getResultAtStep(step: TraceStep | null): unknown | undefined {
  if (!step) return undefined;

  if (Object.prototype.hasOwnProperty.call(step.locals, "result")) {
    return step.locals.result;
  }
  if (Object.prototype.hasOwnProperty.call(step.globals, "result")) {
    return step.globals.result;
  }

  return undefined;
}

export function getInspectableVariables(
  step: TraceStep | null
): Array<[string, unknown]> {
  if (!step) return [];

  const merged = { ...step.globals, ...step.locals };
  return Object.entries(merged).filter(([name, value]) =>
    isInspectableVariable(name, value)
  );
}
