"use client";

import { useMemo } from "react";
import type { Language, TraceStep } from "@/types";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";
import { detectPattern } from "@/lib/patternDetection";
import {
  getActiveArrayIndices,
  getVisualizableVariables,
  isAdjacencyList,
  isLinkedListNode,
  isStringArrayValue,
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
import ScalarsViz from "./ScalarsViz";
import TreeViz from "./TreeViz";

interface DataVisualizationProps {
  step: TraceStep | null;
  source: string;
  language: Language;
  trace: TraceStep[];
  currentStep: number;
  totalSteps: number;
  hasRun?: boolean;
  theme?: Theme;
}

function TraceStepBanner({
  step,
  currentStep,
  totalSteps,
  theme,
}: {
  step: TraceStep | null;
  currentStep: number;
  totalSteps: number;
  theme: Theme;
}) {
  const t = getThemeClasses(theme);

  if (totalSteps === 0) return null;

  return (
    <div className={`rounded-md border px-3 py-2 text-xs ${t.card}`}>
      <span className={`font-medium ${t.cardText}`}>
        Step {currentStep + 1} of {totalSteps}
      </span>
      {step && (
        <span className={`ml-2 ${t.subtext}`}>· line {step.line}</span>
      )}
    </div>
  );
}

export default function DataVisualization({
  step,
  source,
  language,
  trace,
  currentStep,
  totalSteps,
  hasRun = false,
  theme = "dark",
}: DataVisualizationProps) {
  const t = getThemeClasses(theme);
  const detection = useMemo(
    () => (hasRun ? detectPattern(source, language, trace) : null),
    [hasRun, source, language, trace]
  );

  const items = step ? getVisualizableVariables(step) : [];
  const scalarItems = items.filter((item) => item.type === "primitive");
  const structureItems = items.filter((item) => item.type !== "primitive");
  const showRecursion = step ? shouldShowRecursionTree(step) : false;
  const activeIndices = step ? getActiveArrayIndices(step) : [];
  const hasStepVisuals = items.length > 0 || showRecursion;

  if (!hasRun) {
    return (
      <p className={`text-sm ${t.subtext}`}>
        Run your code to see data structure visualizations.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <DetectedPattern detection={detection} theme={theme} />
      <TraceStepBanner
        step={step}
        currentStep={currentStep}
        totalSteps={totalSteps}
        theme={theme}
      />

      {!step && (
        <p className={`text-sm ${t.subtext}`}>
          No trace steps available for visualization.
        </p>
      )}

      {step && !hasStepVisuals && (
        <p className={`text-sm ${t.subtext}`}>
          No specialized visualization at this step. Scrub the timeline below the
          editor to step through arrays, trees, and other structures.
        </p>
      )}

      {step && showRecursion && <RecursionViz stack={step.stack} theme={theme} />}

      {step && scalarItems.length > 0 && (
        <ScalarsViz variables={scalarItems} theme={theme} />
      )}

      {step &&
        structureItems.map(({ name, type, value }) => {
          switch (type) {
            case "array": {
              const data = toArrayItems(value);
              const highlights = activeIndices.filter((index) => index < data.length);
              return (
                <ArrayViz
                  key={name}
                  name={name}
                  data={data}
                  highlightIndices={highlights.length > 0 ? highlights : undefined}
                  variant={isStringArrayValue(value) ? "string" : "array"}
                  theme={theme}
                />
              );
            }
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
