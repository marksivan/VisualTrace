import type { DetectionContext, PatternDetector } from "../Pattern";
import {
  clampConfidence,
  hasReverseListTriplet,
  hasSlowFastPair,
  result,
  sourceMatches,
  traceHasLocals,
} from "../heuristics";

function detectLinkedListTraversal(ctx: DetectionContext): number {
  const { parsed, executionTrace } = ctx;
  let score = 0;

  if (parsed.memberAccess.has("next")) score += 0.45;
  if (sourceMatches(parsed, [/linked\s*list/, /listnode/, /\.next\b/, /->next/])) score += 0.35;
  if (traceHasLocals(executionTrace, ["head", "curr", "current", "node"])) score += 0.15;

  return clampConfidence(score);
}

function detectFastSlowPointer(ctx: DetectionContext): number {
  const { parsed, executionTrace } = ctx;
  let score = 0;

  if (hasSlowFastPair(parsed.identifiers)) score += 0.45;
  if (parsed.memberAccess.has("next")) score += 0.2;
  if (traceHasLocals(executionTrace, ["slow", "fast"])) score += 0.25;
  if (sourceMatches(parsed, [/cycle/, /middle\s+of/])) score += 0.15;

  return clampConfidence(score);
}

function detectReverseLinkedList(ctx: DetectionContext): number {
  const { parsed } = ctx;
  let score = 0;

  if (hasReverseListTriplet(parsed.identifiers)) score += 0.55;
  if (parsed.memberAccess.has("next") && sourceMatches(parsed, [/reverse/, /prev/])) score += 0.3;

  return clampConfidence(score);
}

export const linkedListTraversalDetector: PatternDetector = {
  name: "Linked List Traversal",
  detect(ctx) {
    const confidence = detectLinkedListTraversal(ctx);
    return result(confidence, confidence > 0 ? "Linked List Traversal" : null);
  },
};

export const fastSlowPointerDetector: PatternDetector = {
  name: "Fast & Slow Pointer",
  detect(ctx) {
    const confidence = detectFastSlowPointer(ctx);
    return result(confidence, confidence > 0 ? "Fast & Slow Pointer" : null);
  },
};

export const reverseLinkedListDetector: PatternDetector = {
  name: "Reverse Linked List",
  detect(ctx) {
    const confidence = detectReverseLinkedList(ctx);
    return result(confidence, confidence > 0 ? "Reverse Linked List" : null);
  },
};
