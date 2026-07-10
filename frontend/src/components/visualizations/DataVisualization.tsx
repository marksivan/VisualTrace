"use client";

import type { TraceStep } from "@/types";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";
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
import DictViz from "./DictViz";
import GraphViz from "./GraphViz";
import LinkedListViz from "./LinkedListViz";
import QueueStackViz from "./QueueStackViz";
import RecursionViz from "./RecursionViz";
import TreeViz from "./TreeViz";

interface DataVisualizationProps {
  step: TraceStep | null;
  hasRun?: boolean;
  theme?: Theme;
}

export default function DataVisualization({
  step,
  hasRun = false,
  theme = "dark",
}: DataVisualizationProps) {
  const t = getThemeClasses(theme);

  if (!step) {
    return (
      <p className={`text-sm ${t.subtext}`}>
        {hasRun
          ? "No specialized visualization detected. Variable and call-stack tracing are still available."
          : "Run your code to see data structure visualizations."}
      </p>
    );
  }

  const items = getVisualizableVariables(step);
  const showRecursion = shouldShowRecursionTree(step);
  const activeIndex = getActiveArrayIndex(step);

  if (items.length === 0 && !showRecursion) {
    return (
      <p className={`text-sm ${t.subtext}`}>
        No specialized visualization detected. Variable and call-stack tracing are
        still available.
      </p>
    );
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
