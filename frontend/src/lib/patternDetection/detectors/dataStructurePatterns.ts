import type { DetectionContext, PatternDetector } from "../Pattern";
import { clampConfidence, result, sourceMatches } from "../heuristics";

function detectStack(ctx: DetectionContext): number {
  const { parsed } = ctx;
  let score = 0;

  if (parsed.imports.has("Stack") || parsed.callNames.has("stack")) score += 0.25;
  if (parsed.memberAccess.has("append") && parsed.memberAccess.has("pop")) score += 0.55;
  if (parsed.identifiers.has("stack")) score += 0.2;
  if (sourceMatches(parsed, [/\bstack\b/, /\.pop\s*\(/, /\.push\s*\(/])) score += 0.15;

  return clampConfidence(score);
}

function detectQueue(ctx: DetectionContext): number {
  const { parsed } = ctx;
  let score = 0;

  if (sourceMatches(parsed, [/visited/, /graph/, /neighbors?/])) score -= 0.25;

  if (parsed.imports.has("collections.deque") || parsed.callNames.has("deque")) score += 0.3;
  if (parsed.imports.has("Queue") || parsed.callNames.has("queue")) score += 0.25;
  if (parsed.identifiers.has("queue")) score += 0.2;
  if (parsed.memberAccess.has("popleft") || parsed.memberAccess.has("shift")) score += 0.35;
  if (sourceMatches(parsed, [/\bqueue\b/, /\.enqueue/, /\.dequeue/])) score += 0.15;

  return clampConfidence(score);
}

function detectHeap(ctx: DetectionContext): number {
  const { parsed } = ctx;
  let score = 0;

  if (parsed.imports.has("heapq") || parsed.callNames.has("heapq")) score += 0.35;
  if (
    sourceMatches(parsed, [/heappush/, /heappop/, /heapify/, /priority_queue/, /priorityqueue/])
  ) {
    score += 0.45;
  }
  if (parsed.imports.has("PriorityQueue")) score += 0.25;

  return clampConfidence(score);
}

function detectHashMap(ctx: DetectionContext): number {
  const { parsed } = ctx;
  let score = 0;

  if (sourceMatches(parsed, [/hashmap/, /unordered_map/, /\bseen\b/, /\bmap\b/, /\bdict\b/])) {
    score += 0.35;
  }
  if (parsed.imports.has("HashMap") || parsed.callNames.has("HashMap")) score += 0.25;
  if ([...parsed.identifiers].some((name) => /seen|lookup|counts|freq/i.test(name))) score += 0.4;
  if (parsed.memberAccess.has("get") && parsed.memberAccess.has("set")) score += 0.15;

  return clampConfidence(score);
}

export const stackDetector: PatternDetector = {
  name: "Stack",
  detect(ctx) {
    const confidence = detectStack(ctx);
    return result(confidence, confidence > 0 ? "Stack" : null);
  },
};

export const queueDetector: PatternDetector = {
  name: "Queue",
  detect(ctx) {
    const confidence = detectQueue(ctx);
    return result(confidence, confidence > 0 ? "Queue" : null);
  },
};

export const heapDetector: PatternDetector = {
  name: "Heap",
  detect(ctx) {
    const confidence = detectHeap(ctx);
    return result(confidence, confidence > 0 ? "Heap" : null);
  },
};

export const hashMapDetector: PatternDetector = {
  name: "Hash Map",
  detect(ctx) {
    const confidence = detectHashMap(ctx);
    return result(confidence, confidence > 0 ? "Hash Map" : null);
  },
};
