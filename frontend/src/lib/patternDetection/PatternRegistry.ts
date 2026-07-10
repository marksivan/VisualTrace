import type { Language } from "@/types";
import type { TraceStep } from "@/types";
import {
  binarySearchDetector,
  prefixSumDetector,
  slidingWindowDetector,
  twoPointersDetector,
} from "./detectors/arrayPatterns";
import {
  hashMapDetector,
  heapDetector,
  queueDetector,
  stackDetector,
} from "./detectors/dataStructurePatterns";
import { bfsDetector, dfsDetector } from "./detectors/graphPatterns";
import {
  fastSlowPointerDetector,
  linkedListTraversalDetector,
  reverseLinkedListDetector,
} from "./detectors/linkedListPatterns";
import {
  dp1dDetector,
  dp2dDetector,
  recursionDetector,
  treeTraversalDetector,
} from "./detectors/treeDpRecursionPatterns";
import {
  CONFIDENCE_THRESHOLD,
  type DetectionContext,
  type PatternDetectionResult,
  type PatternDetector,
} from "./Pattern";
import { parseSource } from "./parseSource";

const DEFAULT_DETECTORS: PatternDetector[] = [
  twoPointersDetector,
  slidingWindowDetector,
  binarySearchDetector,
  prefixSumDetector,
  bfsDetector,
  dfsDetector,
  stackDetector,
  queueDetector,
  heapDetector,
  hashMapDetector,
  linkedListTraversalDetector,
  fastSlowPointerDetector,
  reverseLinkedListDetector,
  treeTraversalDetector,
  dp1dDetector,
  dp2dDetector,
  recursionDetector,
];

export class PatternRegistry {
  private detectors: PatternDetector[] = [];

  constructor(detectors: PatternDetector[] = DEFAULT_DETECTORS) {
    detectors.forEach((detector) => this.register(detector));
  }

  register(detector: PatternDetector): void {
    this.detectors.push(detector);
  }

  list(): PatternDetector[] {
    return [...this.detectors];
  }

  detect(
    sourceCode: string,
    language: Language,
    executionTrace: TraceStep[]
  ): PatternDetectionResult {
    const parsed = parseSource(sourceCode, language);
    const context: DetectionContext = {
      sourceCode,
      language,
      executionTrace,
      parsed,
    };

    let best: PatternDetectionResult = { confidence: 0, pattern: null };

    for (const detector of this.detectors) {
      if (
        detector.supportedLanguages &&
        !detector.supportedLanguages.includes(language)
      ) {
        continue;
      }

      const result = detector.detect(context);
      const pattern = result.pattern ?? detector.name;
      if (result.confidence > best.confidence) {
        best = { confidence: result.confidence, pattern };
      }
    }

    if (best.confidence >= CONFIDENCE_THRESHOLD) {
      return best;
    }

    return { confidence: best.confidence, pattern: null };
  }
}

export const defaultPatternRegistry = new PatternRegistry();

export function detectPattern(
  sourceCode: string,
  language: Language,
  executionTrace: TraceStep[]
): PatternDetectionResult {
  return defaultPatternRegistry.detect(sourceCode, language, executionTrace);
}
