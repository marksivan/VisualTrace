"use client";

import type { TraceStep } from "@/types";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";
import {
  getActiveArrayIndex,
  getVisualizableVariables,
  shouldShowRecursionTree,
  toArrayItems,
} from "@/lib/visualization";
import ArrayViz from "./ArrayViz";
import DictViz from "./DictViz";
import QueueStackViz from "./QueueStackViz";
import RecursionViz from "./RecursionViz";

interface DataVisualizationProps {
  step: TraceStep | null;
  theme?: Theme;
}

export default function DataVisualization({ step, theme = "dark" }: DataVisualizationProps) {
  const t = getThemeClasses(theme);

  if (!step) {
    return (
      <p className={`text-sm ${t.subtext}`}>
        Run your code to see data structure visualizations.
      </p>
    );
  }

  const items = getVisualizableVariables(step);
  const showRecursion = shouldShowRecursionTree(step);
  const activeIndex = getActiveArrayIndex(step);

  if (items.length === 0 && !showRecursion) {
    return <p className={`text-sm ${t.subtext}`}>No data to visualize at this step.</p>;
  }

  return (
    <div className="space-y-4">
      {showRecursion && <RecursionViz stack={step.stack} theme={theme} />}

      {items.map(({ name, type, value }) => {
        switch (type) {
          case "array":
            return (
              <ArrayViz
                key={name}
                name={name}
                data={toArrayItems(value)}
                highlightIndex={
                  activeIndex !== undefined && activeIndex < toArrayItems(value).length
                    ? activeIndex
                    : undefined
                }
                theme={theme}
              />
            );
          case "dict":
            return (
              <DictViz
                key={name}
                name={name}
                data={value as Record<string, unknown>}
                theme={theme}
              />
            );
          case "queue":
            return (
              <QueueStackViz
                key={name}
                name={name}
                type="queue"
                items={toArrayItems(value)}
                theme={theme}
              />
            );
          case "stack":
            return (
              <QueueStackViz
                key={name}
                name={name}
                type="stack"
                items={toArrayItems(value)}
                theme={theme}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
