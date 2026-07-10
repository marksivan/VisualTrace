import type { ExecutionTrace, ParsedSource } from "./Pattern";

export function hasAnyIdentifier(identifiers: Set<string>, names: string[]): boolean {
  return names.some((name) => identifiers.has(name));
}

export function hasPointerPair(identifiers: Set<string>): boolean {
  return (
    (identifiers.has("left") && identifiers.has("right")) ||
    (identifiers.has("l") && identifiers.has("r")) ||
    (identifiers.has("start") && identifiers.has("end"))
  );
}

export function hasSlowFastPair(identifiers: Set<string>): boolean {
  return (
    (identifiers.has("slow") && identifiers.has("fast")) ||
    (identifiers.has("tortoise") && identifiers.has("hare"))
  );
}

export function hasReverseListTriplet(identifiers: Set<string>): boolean {
  return (
    identifiers.has("prev") &&
    identifiers.has("curr") &&
    (identifiers.has("next") || identifiers.has("nxt"))
  );
}

export function sourceMatches(source: ParsedSource, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(source.normalized));
}

export function traceHasLocals(trace: ExecutionTrace, names: string[]): boolean {
  return trace.some((step) => names.some((name) => name in step.locals));
}

export function traceLocalChanges(trace: ExecutionTrace, name: string): boolean {
  let last: unknown;
  let seen = false;
  let changes = 0;

  for (const step of trace) {
    if (!(name in step.locals)) continue;
    const value = step.locals[name];
    if (seen && value !== last) changes += 1;
    last = value;
    seen = true;
  }

  return changes >= 1;
}

export function traceUsesCall(trace: ExecutionTrace, callName: string): boolean {
  const needle = callName.toLowerCase();
  return trace.some((step) =>
    step.stack.some((frame) => frame.function.toLowerCase().includes(needle))
  );
}

export function countSelfRecursiveCalls(trace: ExecutionTrace, fnName: string): number {
  const normalized = fnName.toLowerCase();
  let count = 0;

  for (const step of trace) {
    if (step.stack.length < 2) continue;
    const top = step.stack[0]?.function.toLowerCase() ?? "";
    const next = step.stack[1]?.function.toLowerCase() ?? "";
    if (top.includes(normalized) && next.includes(normalized)) count += 1;
  }

  return count;
}

export function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function result(confidence: number, pattern: string | null): { confidence: number; pattern: string | null } {
  return { confidence: clampConfidence(confidence), pattern };
}
