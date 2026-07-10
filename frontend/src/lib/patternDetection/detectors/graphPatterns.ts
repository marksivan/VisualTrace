import type { DetectionContext, PatternDetector } from "../Pattern";
import { clampConfidence, countSelfRecursiveCalls, result, sourceMatches, traceUsesCall } from "../heuristics";

function detectBfs(ctx: DetectionContext): number {
  const { parsed, executionTrace } = ctx;
  let score = 0;

  if (parsed.imports.has("collections.deque") || parsed.callNames.has("deque")) score += 0.2;
  if (parsed.memberAccess.has("popleft")) score += 0.2;
  if (sourceMatches(parsed, [/visited/, /graph/, /neighbors?/, /breadth/])) score += 0.35;
  if (
    sourceMatches(parsed, [/visited/]) &&
    sourceMatches(parsed, [/graph/, /neighbors?/, /adjacency/])
  ) {
    score += 0.35;
  }
  if (traceUsesCall(executionTrace, "bfs")) score += 0.25;

  return clampConfidence(score);
}

function detectDfs(ctx: DetectionContext): number {
  const { parsed, executionTrace } = ctx;
  let score = 0;

  const recursiveFns = [...parsed.functionNames].filter((name) =>
    countSelfRecursiveCalls(executionTrace, name) > 0
  );

  if (recursiveFns.length > 0) score += 0.35;
  if (parsed.memberAccess.has("pop") && parsed.memberAccess.has("append")) score += 0.25;
  if (sourceMatches(parsed, [/visited/, /\bdfs\b/, /depth/])) score += 0.25;
  if (traceUsesCall(executionTrace, "dfs")) score += 0.2;

  return clampConfidence(score);
}

export const bfsDetector: PatternDetector = {
  name: "Breadth-First Search (BFS)",
  detect(ctx) {
    const confidence = detectBfs(ctx);
    return result(confidence, confidence > 0 ? "Breadth-First Search (BFS)" : null);
  },
};

export const dfsDetector: PatternDetector = {
  name: "Depth-First Search (DFS)",
  detect(ctx) {
    const confidence = detectDfs(ctx);
    return result(confidence, confidence > 0 ? "Depth-First Search (DFS)" : null);
  },
};
