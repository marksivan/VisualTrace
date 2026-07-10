"use client";

import { useMemo } from "react";
import type { Language, TraceStep } from "@/types";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";
import { detectPattern } from "@/lib/patternDetection";
import {
  getActiveArrayIndex,
  getVisualizableVariables,
  isAdjacencyList,
  isLinkedListNode,
  isTreeNode,
  shouldShowRecursionTree,
  toArrayItems,
} from "@/lib/visualization";
import ArrayViz from "./ArrayViz";
import DetectedPattern from "./DetectedPattern";
import DictViz from "./DictViz";
import GraphViz from "./GraphViz";
import LinkedListViz from "./LinkedListViz";
import QueueStackViz from "./QueueStackViz";
import RecursionViz from "./RecursionViz";
import TreeViz from "./TreeViz";

interface DataVisualizationProps {
  step: TraceStep | null;
  source: string;
  language: Language;
  trace: TraceStep[];
  hasRun?: boolean;
  theme?: Theme;
}

export default function DataVisualization({
  step,
  source,
  language,
  trace,
  hasRun = false,
  theme = "dark",
}: DataVisualizationProps) {
  const t = getThemeClasses(theme);
  const detection = useMemo(
    () => (hasRun ? detectPattern(source, language, trace) : null),
    [hasRun, source, language, trace]
  );

  if (!step) {
    return (
      <div className="space-y-4">
        {hasRun && <DetectedPattern detection={detection} theme={theme} />}
        <p className={`text-sm ${t.subtext}`}>
          {hasRun
            ? "No specialized visualization detected. Variable and call-stack tracing are still available."
            : "Run your code to see data structure visualizations."}
        </p>
      </div>
    );
  }

  const items = getVisualizableVariables(step);
  const showRecursion = shouldShowRecursionTree(step);
  const activeIndex = getActiveArrayIndex(step);

  if (items.length === 0 && !showRecursion) {
    return (
      <div className="space-y-4">
        <DetectedPattern detection={detection} theme={theme} />
        <p className={`text-sm ${t.subtext}`}>
          No specialized visualization detected. Variable and call-stack tracing are
          still available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DetectedPattern detection={detection} theme={theme} />
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
          case "linked_list":
            return (
              <LinkedListViz
                key={name}
                name={name}
                head={isLinkedListNode(value) ? value : null}
                theme={theme}
              />
            );
          case "tree":
            return (
              <TreeViz
                key={name}
                name={name}
                root={isTreeNode(value) ? value : null}
                theme={theme}
              />
            );
          case "graph":
            return (
              <GraphViz
                key={name}
                name={name}
                adjacency={isAdjacencyList(value) ? value : {}}
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
