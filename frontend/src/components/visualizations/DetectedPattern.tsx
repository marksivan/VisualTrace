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
  const matches =
    detection?.patterns.filter((match) => match.confidence >= CONFIDENCE_THRESHOLD) ?? [];
  const hasMatches = matches.length > 0;

  return (
    <div className={`mb-4 rounded-md border p-3 ${t.card}`}>
      <div className={`text-xs font-medium uppercase tracking-wide ${t.label}`}>
        Detected {matches.length > 1 ? "Patterns" : "Pattern"}
      </div>
      {hasMatches ? (
        <ul className="mt-2 space-y-1.5">
          {matches.map((match) => (
            <li
              key={match.pattern}
              className={`flex items-center gap-2 text-sm font-medium ${t.cardText}`}
            >
              <Check className="h-4 w-4 shrink-0 text-green-500" />
              <span>{match.pattern}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={`mt-1 flex items-center gap-2 text-sm font-medium ${t.cardText}`}>
          <Check className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
          <span>{GENERIC_PATTERN_LABEL}</span>
        </div>
      )}
    </div>
  );
}
