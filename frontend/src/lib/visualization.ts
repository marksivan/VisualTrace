import type { TraceStep } from "@/types";
import { isInspectableVariable } from "@/lib/format";

export type VizType =
  | "array"
  | "dict"
  | "queue"
  | "stack"
  | "linked_list"
  | "tree"
  | "graph"
  | "primitive";

export interface VizItem {
  name: string;
  type: VizType;
  value: unknown;
}

export interface LinkedListNode {
  val?: unknown;
  value?: unknown;
  next?: LinkedListNode | null;
}

export interface TreeNode {
  val?: unknown;
  value?: unknown;
  key?: unknown;
  left?: TreeNode | null;
  right?: TreeNode | null;
  children?: TreeNode[];
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

  if (value !== null && typeof value === "object") {
    if (isLinkedListNode(value)) return "linked_list";
    if (isTreeNode(value)) return "tree";
    if (isAdjacencyList(value)) return "graph";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasNodeShape(value: Record<string, unknown>): boolean {
  return (
    "val" in value ||
    "value" in value ||
    "key" in value ||
    "left" in value ||
    "right" in value ||
    "next" in value ||
    "children" in value ||
    "neighbors" in value
  );
}

export function isLinkedListNode(value: unknown): value is LinkedListNode {
  if (!isRecord(value) || !hasNodeShape(value)) return false;
  if ("left" in value || "right" in value || "children" in value) return false;
  if ("next" in value) return true;
  return lowerIncludesLinkedListHint(value);
}

export function isTreeNode(value: unknown): value is TreeNode {
  if (!isRecord(value) || !hasNodeShape(value)) return false;
  if ("left" in value || "right" in value || "children" in value) return true;
  return false;
}

export function isAdjacencyList(value: unknown): value is Record<string, unknown[]> {
  if (!isRecord(value) || Object.keys(value).length === 0) return false;

  return Object.values(value).every(
    (entry) =>
      Array.isArray(entry) &&
      entry.every((item) => typeof item === "string" || typeof item === "number")
  );
}

function lowerIncludesLinkedListHint(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((key) => key.toLowerCase().includes("next"));
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

export function linkedListToArray(head: LinkedListNode | null | undefined): unknown[] {
  const items: unknown[] = [];
  const seen = new Set<unknown>();
  let current: LinkedListNode | null | undefined = head;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    items.push(current.val ?? current.value ?? "?");
    const next = current.next;
    current = next && typeof next === "object" ? next : null;
    if (items.length > 50) break;
  }

  return items;
}

export function treeNodeLabel(node: TreeNode | null | undefined): string {
  if (!node || typeof node !== "object") return "null";
  const label = node.val ?? node.value ?? node.key;
  if (label === null || label === undefined) return "·";
  return String(label);
}
