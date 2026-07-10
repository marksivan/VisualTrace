import type { DetectionContext, PatternDetector } from "../Pattern";
import {
  clampConfidence,
  hasBinarySearchBounds,
  hasPointerPair,
  result,
  sourceMatches,
  traceHasLocals,
  traceLocalChanges,
} from "../heuristics";

function detectTwoPointers(ctx: DetectionContext): number {
  const { parsed, executionTrace } = ctx;
  let score = 0;

  if (parsed.identifiers.has("mid")) return 0;
  if (sourceMatches(parsed, [/while\s+left\s*<=\s*right/, /while\s+low\s*<=\s*high/])) return 0;
  if (hasBinarySearchBounds(parsed.identifiers) && parsed.identifiers.has("mid")) return 0;

  if (hasPointerPair(parsed.identifiers)) score += 0.35;
  if (
    sourceMatches(parsed, [
      /while\s+left\s*<\s*right/,
      /while\s+l\s*<\s*r/,
      /while\s+.*left.*right/,
    ])
  ) {
    score += 0.35;
  }
  if (traceHasLocals(executionTrace, ["left", "right", "l", "r"])) score += 0.15;
  if (traceLocalChanges(executionTrace, "left") || traceLocalChanges(executionTrace, "right")) {
    score += 0.2;
  }

  return clampConfidence(score);
}

function detectSlidingWindow(ctx: DetectionContext): number {
  const { parsed, executionTrace } = ctx;
  let score = 0;

  if (hasPointerPair(parsed.identifiers)) score += 0.25;
  if (
    sourceMatches(parsed, [
      /while\s+right\s*<\s*len/,
      /while\s+right\s*<\s*n/,
      /\bright\s*\+?=?\s*1\b/,
      /\bleft\s*\+?=?\s*1\b/,
      /window/,
    ])
  ) {
    score += 0.35;
  }
  if (traceHasLocals(executionTrace, ["left", "right"]) && traceLocalChanges(executionTrace, "right")) {
    score += 0.25;
  }

  return clampConfidence(score);
}

function detectBinarySearch(ctx: DetectionContext): number {
  const { parsed, executionTrace } = ctx;
  let score = 0;

  const hasMid =
    parsed.identifiers.has("mid") ||
    parsed.identifiers.has("middle") ||
    sourceMatches(parsed, [/\bmid\b/, /\bmiddle\b/]);

  if (hasBinarySearchBounds(parsed.identifiers) && hasMid) score += 0.45;
  if (
    [...parsed.functionNames].some((name) => /search|bisect/i.test(name)) &&
    hasMid
  ) {
    score += 0.35;
  }
  if (
    sourceMatches(parsed, [
      /while\s+left\s*<=\s*right/,
      /while\s+low\s*<=\s*high/,
      /while\s+lo\s*<=\s*hi/,
      /\bmid\s*=\s*\(?\s*\(?\s*(left|low|lo)\s*\+\s*(right|high|hi)\s*\)?\s*\/\s*2/,
      /\bmid\s*=\s*.*\/\/?\s*2/,
      /math\.floor\s*\(\s*\(\s*(left|low)\s*\+\s*(right|high)\s*\)/,
      /nums\s*\[\s*mid\s*\]/,
      /binary\s*search/,
      /bisect/,
    ])
  ) {
    score += 0.4;
  }
  if (
    traceHasLocals(executionTrace, ["left", "right", "mid", "low", "high", "lo", "hi"])
  ) {
    score += 0.15;
  }

  return clampConfidence(score);
}

function detectPrefixSum(ctx: DetectionContext): number {
  const { parsed } = ctx;
  let score = 0;

  const hasPrefixName = [...parsed.identifiers].some((name) =>
    /^(prefix|pref|psum|cum)/i.test(name)
  );
  if (hasPrefixName) score += 0.4;
  if (sourceMatches(parsed, [/prefix/, /running\s+sum/, /cumsum/, /accumulate/])) score += 0.35;
  if (parsed.identifiers.has("dp") && sourceMatches(parsed, [/prefix/])) score += 0.1;

  return clampConfidence(score);
}

export const twoPointersDetector: PatternDetector = {
  name: "Two Pointers",
  detect(ctx) {
    const confidence = detectTwoPointers(ctx);
    return result(confidence, confidence > 0 ? "Two Pointers" : null);
  },
};

export const slidingWindowDetector: PatternDetector = {
  name: "Sliding Window",
  detect(ctx) {
    const confidence = detectSlidingWindow(ctx);
    return result(confidence, confidence > 0 ? "Sliding Window" : null);
  },
};

export const binarySearchDetector: PatternDetector = {
  name: "Binary Search",
  detect(ctx) {
    const confidence = detectBinarySearch(ctx);
    return result(confidence, confidence > 0 ? "Binary Search" : null);
  },
};

export const prefixSumDetector: PatternDetector = {
  name: "Prefix Sum",
  detect(ctx) {
    const confidence = detectPrefixSum(ctx);
    return result(confidence, confidence > 0 ? "Prefix Sum" : null);
  },
};
