"use client";

import { useState } from "react";
import type { InspectorTab, Language, TraceStep } from "@/types";
import { INSPECTOR_TAB_ORDER } from "@/types";
import {
  formatValueForDisplay,
  getInspectableVariables,
  getResultAtStep,
  isMultilineDisplay,
} from "@/lib/format";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";
import DataVisualization from "./visualizations/DataVisualization";

interface InspectorProps {
  step: TraceStep | null;
  source: string;
  language: Language;
  trace: TraceStep[];
  stdout: string;
  stderr: string;
  error: string | null;
  theme?: Theme;
  activeTab?: InspectorTab;
  onTabChange?: (tab: InspectorTab) => void;
}

export default function Inspector({
  step,
  source,
  language,
  trace,
  stdout,
  stderr,
  error,
  theme = "dark",
  activeTab: controlledTab,
  onTabChange,
}: InspectorProps) {
  const [internalTab, setInternalTab] = useState<InspectorTab>("console");
  const activeTab = controlledTab ?? internalTab;
  const t = getThemeClasses(theme);
  const stepResult = getResultAtStep(step);

  const setActiveTab = (tab: InspectorTab) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  return (
    <div className="flex h-full flex-col">
      <div className={`flex shrink-0 overflow-x-auto border-b ${t.panel}`}>
        {INSPECTOR_TAB_ORDER.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-3 py-2 text-xs font-medium capitalize sm:px-4 ${
              activeTab === tab ? t.tabActive : t.tabInactive
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3">
        {error && activeTab === "variables" && (
          <div className={`mb-3 rounded-md border p-3 text-xs ${t.errorBox}`}>
            {error}
            <button
              onClick={() => setActiveTab("console")}
              className="mt-2 block underline opacity-80 hover:opacity-100"
            >
              View full error in Console
            </button>
          </div>
        )}
        {activeTab === "console" && (
          <ConsolePanel stdout={stdout} stderr={stderr} error={error} theme={theme} />
        )}
        {activeTab === "visualize" && (
          <DataVisualization
            step={step}
            source={source}
            language={language}
            trace={trace}
            hasRun={!!step || !!stdout || !!stderr || !!error}
            theme={theme}
          />
        )}
        {activeTab === "variables" && (
          <VariablesPanel step={step} stepResult={stepResult} theme={theme} />
        )}
        {activeTab === "stack" && <StackPanel step={step} theme={theme} />}
      </div>
    </div>
  );
}

function ValueDisplay({ value, theme }: { value: unknown; theme: Theme }) {
  const t = getThemeClasses(theme);
  const text = formatValueForDisplay(value);
  const multiline = isMultilineDisplay(text);

  if (multiline) {
    return (
      <pre className={`mt-1 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed ${t.cardPre}`}>
        {text}
      </pre>
    );
  }

  return (
    <code className={`mt-1 block font-mono text-sm ${t.cardText}`}>{text}</code>
  );
}

function VariablesPanel({
  step,
  stepResult,
  theme,
}: {
  step: TraceStep | null;
  stepResult: unknown;
  theme: Theme;
}) {
  const t = getThemeClasses(theme);
  const varEntries = getInspectableVariables(step);
  const hasResult = stepResult !== undefined;

  if (!step && !hasResult) {
    return (
      <p className={`text-sm ${t.subtext}`}>
        Run your code to inspect variables at each step.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {varEntries.length > 0 ? (
        varEntries.map(([name, value]) => (
          <div key={name} className={`p-3 ${t.card}`}>
            <div className="font-mono text-xs font-medium text-blue-500">{name}</div>
            <ValueDisplay value={value} theme={theme} />
          </div>
        ))
      ) : step ? (
        <p className={`text-sm ${t.subtext}`}>No local variables at this step.</p>
      ) : null}

      {hasResult && (
        <div className={`p-3 ${t.resultCard}`}>
          <div className="font-mono text-xs font-medium text-green-600 dark:text-green-400">
            result
          </div>
          <ValueDisplay value={stepResult} theme={theme} />
        </div>
      )}
    </div>
  );
}

function StackPanel({ step, theme }: { step: TraceStep | null; theme: Theme }) {
  const t = getThemeClasses(theme);

  if (!step || step.stack.length === 0) {
    return <p className={`text-sm ${t.subtext}`}>No call stack available.</p>;
  }

  return (
    <div className="space-y-1">
      {step.stack.map((frame, i) => (
        <div
          key={`${frame.function}-${frame.line}-${i}`}
          className={`rounded-md border px-3 py-2 font-mono text-xs ${
            i === 0 ? t.stackActive : t.stackInactive
          }`}
        >
          <span className="font-medium">{frame.function}</span>
          <span className={t.labelMuted}> @ line {frame.line}</span>
        </div>
      ))}
    </div>
  );
}

function ConsolePanel({
  stdout,
  stderr,
  error,
  theme,
}: {
  stdout: string;
  stderr: string;
  error: string | null;
  theme: Theme;
}) {
  const t = getThemeClasses(theme);
  const hasOutput = stdout || stderr || error;

  if (!hasOutput) {
    return <p className={`text-sm ${t.subtext}`}>No console output yet.</p>;
  }

  return (
    <div className="space-y-2 font-mono text-xs">
      {stdout && (
        <div>
          <div className={t.label}>stdout</div>
          <pre className={`mt-1 whitespace-pre-wrap rounded-md p-2 ${t.consoleBg} ${t.cardPre}`}>
            {stdout}
          </pre>
        </div>
      )}
      {stderr && (
        <div>
          <div className="text-yellow-600">stderr</div>
          <pre className="mt-1 whitespace-pre-wrap rounded-md bg-yellow-900/20 p-2 text-yellow-700 dark:text-yellow-300">
            {stderr}
          </pre>
        </div>
      )}
      {error && (
        <div>
          <div className="text-red-500">error</div>
          <pre className={`mt-1 whitespace-pre-wrap rounded-md border p-2 ${t.errorBox}`}>
            {error}
          </pre>
        </div>
      )}
    </div>
  );
}
