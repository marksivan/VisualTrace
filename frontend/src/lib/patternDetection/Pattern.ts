import type { Language } from "@/types";
import type { TraceStep } from "@/types";

/** Alias for the runtime execution trace passed to detectors. */
export type ExecutionTrace = TraceStep[];

export interface DetectionResult {
  confidence: number;
  pattern: string | null;
}

export interface PatternDetectionResult {
  confidence: number;
  pattern: string | null;
}

export const CONFIDENCE_THRESHOLD = 0.55;

export const GENERIC_PATTERN_LABEL = "Unknown / Generic Algorithm";

export interface ParsedSource {
  language: Language;
  source: string;
  normalized: string;
  lines: string[];
  identifiers: Set<string>;
  imports: Set<string>;
  callNames: Set<string>;
  functionNames: Set<string>;
  memberAccess: Set<string>;
  /** Language-specific parsed AST (e.g. Acorn for JavaScript). Parsed once per run. */
  ast: unknown | null;
}

export interface DetectionContext {
  sourceCode: string;
  language: Language;
  executionTrace: ExecutionTrace;
  parsed: ParsedSource;
}

export interface PatternDetector {
  name: string;
  /** When omitted, detector runs for all languages using shared heuristics. */
  supportedLanguages?: Language[];
  detect(context: DetectionContext): DetectionResult;
}
