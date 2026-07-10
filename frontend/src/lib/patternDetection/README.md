# Pattern Detection Engine

VisualTrace uses a deterministic, extensible pattern detection engine to classify common algorithmic patterns from source code and execution traces. No AI or LLMs are involved.

## Architecture

```
patternDetection/
  Pattern.ts              # Core types (PatternDetector, DetectionContext, etc.)
  PatternDetector.ts      # Type re-exports
  PatternRegistry.ts      # Registry + detectPattern() entry point
  parseSource.ts          # Parse source once per run (shared across detectors)
  heuristics.ts           # Shared scoring helpers
  detectors/              # One module per pattern family
  index.ts                # Public API
```

## How detection works

1. `parseSource()` analyzes the user's code once (AST for JavaScript, regex/heuristics for other languages).
2. Each registered detector scores the shared `DetectionContext` from `0.0` to `1.0`.
3. `PatternRegistry` returns up to **3** unique matches above the confidence threshold, sorted by score.
4. If none qualify, the UI shows **Unknown / Generic Algorithm**.

Detectors combine:

- Variable naming heuristics (`left`/`right`, `slow`/`fast`, `dp`, etc.)
- Source structure (`while left < right`, `heapq.heappush`, etc.)
- Runtime trace signals (locals changing, recursive stack frames)
- Standard library usage (`collections.deque`, `heapq`, `HashMap`, etc.)

## Adding a new pattern

### 1. Create a detector

```typescript
// detectors/myPattern.ts
import type { DetectionContext, PatternDetector } from "../Pattern";
import { clampConfidence, result } from "../heuristics";

export const myPatternDetector: PatternDetector = {
  name: "My Pattern",
  supportedLanguages: ["python", "javascript"], // optional
  detect(ctx: DetectionContext) {
    let score = 0;
    if (ctx.parsed.identifiers.has("foo")) score += 0.5;
    // ...
    const confidence = clampConfidence(score);
    return result(confidence, confidence > 0 ? "My Pattern" : null);
  },
};
```

### 2. Register it

```typescript
// PatternRegistry.ts
import { myPatternDetector } from "./detectors/myPattern";

const DEFAULT_DETECTORS: PatternDetector[] = [
  // ...existing detectors
  myPatternDetector,
];
```

No other detectors need to change.

### 3. Add a unit test

Add a focused test in `patternDetection.test.ts` with sample source (and trace if needed) that should score `>= 0.7`.

## Language support

- **Python**: full heuristic support today
- **JavaScript**: AST + heuristics via Acorn
- **Java / C++**: regex/import heuristics (extensible via language-specific detectors)

Use `supportedLanguages` on a detector to limit or specialize behavior per language.

## Performance

Source is parsed once per run and reused by all detectors. Typical interview-sized solutions complete in under 10 ms.

## Public API

```typescript
import { detectPattern } from "@/lib/patternDetection";

const { confidence, pattern, patterns } = detectPattern(source, language, trace);
```

- `patterns`: up to 3 matches above threshold, highest confidence first
- `pattern`: top match (same as `patterns[0]?.pattern`), or `null`
- `confidence`: highest score among matches

## UI

The Visualize tab shows:

```
Detected Pattern
✓ Two Pointers
```

or, when no strong match is found:

```
Detected Pattern
✓ Unknown / Generic Algorithm
```

Variable visualizations continue to render below the banner.
