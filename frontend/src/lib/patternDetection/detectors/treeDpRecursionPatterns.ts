import type { DetectionContext, PatternDetector } from "../Pattern";
import { clampConfidence, countSelfRecursiveCalls, result, sourceMatches } from "../heuristics";

function detectTreeTraversal(ctx: DetectionContext): number {
  const { parsed, executionTrace } = ctx;
  let score = 0;

  if (sourceMatches(parsed, [/treenode/, /binary\s+tree/, /root\.left/, /root\.right/, /\.left\b/, /\.right\b/])) {
    score += 0.35;
  }
  if (sourceMatches(parsed, [/inorder/, /preorder/, /postorder/, /levelorder/])) score += 0.35;
  if ([...parsed.functionNames].some((name) => countSelfRecursiveCalls(executionTrace, name) > 0)) {
    score += 0.2;
  }
  if (traceUsesTreeLocals(executionTrace)) score += 0.15;

  return clampConfidence(score);
}

function traceUsesTreeLocals(trace: DetectionContext["executionTrace"]): boolean {
  return trace.some((step) =>
    ["root", "node", "left", "right"].some((name) => name in step.locals)
  );
}

export const treeTraversalDetector: PatternDetector = {
  name: "Tree Traversal",
  detect(ctx) {
    const confidence = detectTreeTraversal(ctx);
    return result(confidence, confidence > 0 ? "Tree Traversal" : null);
  },
};

function detectDp1D(ctx: DetectionContext): number {
  const { parsed } = ctx;
  let score = 0;

  if (sourceMatches(parsed, [/dp\s*\[\s*\w+\s*\]\s*\[\s*\w+\s*\]/, /dp\[i\]\[j\]/])) {
    return 0;
  }

  if (parsed.identifiers.has("dp")) score += 0.4;
  if (sourceMatches(parsed, [/\bdp\s*\[/, /memo\s*=\s*\{/, /memo\s*=\s*\[/, /memoization/])) score += 0.35;
  if (sourceMatches(parsed, [/for\s+.*\s+in\s+range\(len\(dp\)/, /dp\[i\]/])) score += 0.25;

  return clampConfidence(score);
}

function detectDp2D(ctx: DetectionContext): number {
  const { parsed } = ctx;
  let score = 0;

  if (parsed.identifiers.has("dp") && sourceMatches(parsed, [/dp\s*\[\s*\w+\s*\]\s*\[\s*\w+\s*\]/, /dp\[i\]\[j\]/])) {
    score += 0.75;
  }
  if (sourceMatches(parsed, [/2d\s*dp/, /matrix/, /grid/]) && parsed.identifiers.has("dp")) score += 0.2;

  return clampConfidence(score);
}

export const dp1dDetector: PatternDetector = {
  name: "1D DP",
  detect(ctx) {
    const confidence = detectDp1D(ctx);
    return result(confidence, confidence > 0 ? "1D DP" : null);
  },
};

export const dp2dDetector: PatternDetector = {
  name: "2D DP",
  detect(ctx) {
    const confidence = detectDp2D(ctx);
    return result(confidence, confidence > 0 ? "2D DP" : null);
  },
};

function detectRecursion(ctx: DetectionContext): number {
  const { parsed, executionTrace } = ctx;
  let score = 0;

  for (const fn of parsed.functionNames) {
    const calls = countSelfRecursiveCalls(executionTrace, fn);
    if (calls > 0) score = Math.max(score, 0.5 + Math.min(0.4, calls / 10));
  }

  if (sourceMatches(parsed, [/return\s+\w+\s*\(/])) score += 0.15;

  return clampConfidence(score);
}

export const recursionDetector: PatternDetector = {
  name: "Recursive Function",
  detect(ctx) {
    const confidence = detectRecursion(ctx);
    return result(confidence, confidence > 0 ? "Recursive Function" : null);
  },
};
