"use client";

import { Check } from "lucide-react";
import {
  CONFIDENCE_THRESHOLD,
  GENERIC_PATTERN_LABEL,
  type PatternDetectionResult,
} from "@/lib/patternDetection";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface DetectedPatternProps {
  detection: PatternDetectionResult | null;
  theme?: Theme;
}

export default function DetectedPattern({
  detection,
  theme = "dark",
}: DetectedPatternProps) {
  const t = getThemeClasses(theme);
  const hasMatch =
    detection !== null &&
    detection.pattern !== null &&
    detection.confidence >= CONFIDENCE_THRESHOLD;
  const label = hasMatch ? detection.pattern! : GENERIC_PATTERN_LABEL;

  return (
    <div className={`mb-4 rounded-md border p-3 ${t.card}`}>
      <div className={`text-xs font-medium uppercase tracking-wide ${t.label}`}>
        Detected Pattern
      </div>
      <div className={`mt-1 flex items-center gap-2 text-sm font-medium ${t.cardText}`}>
        <Check
          className={`h-4 w-4 shrink-0 ${
            hasMatch ? "text-green-500" : "text-zinc-400 dark:text-zinc-500"
          }`}
        />
        <span>{label}</span>
      </div>
    </div>
  );
}
