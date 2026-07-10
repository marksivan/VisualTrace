"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Loader2, RotateCcw } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import LanguageSelector from "@/components/LanguageSelector";
import TestInput from "@/components/TestInput";
import ExecutionControls from "@/components/ExecutionControls";
import PlaybackControls from "@/components/PlaybackControls";
import Inspector from "@/components/Inspector";
import ThemeToggle from "@/components/ThemeToggle";
import ConfirmDialog from "@/components/ConfirmDialog";
import CopyrightFooter from "@/components/CopyrightFooter";
import {
  BROWSER_LANGUAGES,
  executeInBrowser,
  getRuntimeStatus,
  isLanguageReady,
  preloadPythonRuntime,
  preloadRuntime,
  type RuntimeLoadStatus,
} from "@/lib/browser-runner";
import { getPreferredStepAfterRun, shouldResetPlaybackOnSourceChange } from "@/lib/playback";
import { getLanguageDisplayName } from "@/lib/runners/shared";
import {
  DEFAULT_FUNCTION_ARGS,
  getDefaultFunctionName,
  getDefaultSource,
  loadFunctionArgs,
  loadFunctionName,
  loadSettings,
  loadSource,
  saveFunctionArgs,
  saveFunctionName,
  saveSession,
  saveSource,
  savePlaybackPosition,
  saveSettings,
} from "@/lib/storage";
import { getThemeClasses, type Theme } from "@/lib/theme";
import type {
  AppSettings,
  ExecutionMode,
  ExecutionResult,
  InspectorTab,
  Language,
  LanguageInfo,
  PlaybackState,
  TraceStep,
} from "@/types";

export default function VisualTraceApp() {
  const [languages] = useState<LanguageInfo[]>(BROWSER_LANGUAGES);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [language, setLanguage] = useState<Language>("python");
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(
    () => loadSettings().executionMode
  );
  const [source, setSource] = useState(() =>
    loadSource("python", loadSettings().executionMode)
  );
  const [stdin, setStdin] = useState("");
  const [functionName, setFunctionName] = useState(() => loadFunctionName("python"));
  const [functionArgs, setFunctionArgs] = useState(() => loadFunctionArgs("python"));
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [pythonStatus, setPythonStatus] = useState<RuntimeLoadStatus>("loading");
  const [cppStatus, setCppStatus] = useState<RuntimeLoadStatus>("loading");
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [showTestInput, setShowTestInput] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("console");
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRunSourceRef = useRef<string | null>(null);
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "session-local"
  );
  const theme = settings.theme;
  const t = getThemeClasses(theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    preloadPythonRuntime()
      .then(() => setPythonStatus("ready"))
      .catch((err) => {
        setPythonStatus("error");
        setRuntimeError(err instanceof Error ? err.message : "Failed to load Python runtime");
      });

    preloadRuntime("cpp")
      .then(() => setCppStatus("ready"))
      .catch((err) => {
        setCppStatus("error");
        setRuntimeError((prev) =>
          prev ?? (err instanceof Error ? err.message : "Failed to load C++ runtime")
        );
      });
  }, []);

  const runtimeStatuses = { python: pythonStatus, cpp: cppStatus };
  const runtimeStatus = getRuntimeStatus(language, runtimeStatuses);
  const languageLabel = getLanguageDisplayName(language);

  const resetPlaybackToStart = useCallback(() => {
    setCurrentStep(0);
    setPlaybackState("paused");
    savePlaybackPosition(sessionIdRef.current, 0);
  }, []);

  const handleSourceChange = useCallback(
    (value: string) => {
      if (
        shouldResetPlaybackOnSourceChange(
          value,
          lastRunSourceRef.current,
          (result?.trace.length ?? 0) > 0
        )
      ) {
        resetPlaybackToStart();
      }
      setSource(value);
      if (settings.autoSave) saveSource(language, value, executionMode);
    },
    [language, executionMode, settings.autoSave, result, resetPlaybackToStart]
  );

  const handleThemeToggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const updated = { ...settings, theme: next };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleExecutionModeChange = (mode: ExecutionMode) => {
    saveSource(language, source, executionMode);
    setExecutionMode(mode);
    const updated = { ...settings, executionMode: mode };
    setSettings(updated);
    saveSettings(updated);
    setSource(loadSource(language, mode));
    setResult(null);
    lastRunSourceRef.current = null;
    setCurrentStep(0);
    setPlaybackState("idle");
  };

  const handleLanguageChange = (langId: string) => {
    saveSource(language, source, executionMode);
    saveFunctionName(language, functionName);
    saveFunctionArgs(language, functionArgs);
    const nextLanguage = langId as Language;
    setLanguage(nextLanguage);
    setSource(loadSource(nextLanguage, executionMode));
    setFunctionName(loadFunctionName(nextLanguage));
    setFunctionArgs(loadFunctionArgs(nextLanguage));
    setResult(null);
    lastRunSourceRef.current = null;
    setCurrentStep(0);
    setPlaybackState("idle");
  };

  const handleFunctionNameChange = (value: string) => {
    setFunctionName(value);
    saveFunctionName(language, value);
  };

  const handleFunctionArgsChange = (value: string) => {
    setFunctionArgs(value);
    saveFunctionArgs(language, value);
  };

  const handleInspectorTabChange = (tab: InspectorTab) => {
    if (tab === "visualize" && inspectorTab !== "visualize" && (result?.trace.length ?? 0) > 0) {
      resetPlaybackToStart();
    }
    setInspectorTab(tab);
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    setShowResetConfirm(false);

    const defaultSource = getDefaultSource(language, executionMode);
    const defaultFunctionName = getDefaultFunctionName(language);

    setSource(defaultSource);
    setStdin("");
    setFunctionName(defaultFunctionName);
    setFunctionArgs(DEFAULT_FUNCTION_ARGS);
    setResult(null);
    lastRunSourceRef.current = null;
    setCurrentStep(0);
    setPlaybackState("idle");
    setInspectorTab("console");

    if (settings.autoSave) {
      saveSource(language, defaultSource, executionMode);
      saveFunctionName(language, defaultFunctionName);
      saveFunctionArgs(language, DEFAULT_FUNCTION_ARGS);
    }
    savePlaybackPosition(sessionIdRef.current, 0);
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
  };

  const handleRun = async () => {
    if (!isLanguageReady(language, runtimeStatuses)) {
      if (runtimeStatus === "unsupported") {
        setResult({
          stdout: "",
          stderr: "",
          result: null,
          error: `${languageLabel} is not supported in the browser yet.`,
          trace: [],
        });
        setInspectorTab("console");
        return;
      }

      if (pythonStatus === "loading") {
        setResult({
          stdout: "",
          stderr: "",
          result: null,
          error: `${languageLabel} runtime is still loading. Please wait a moment and try again.`,
          trace: [],
        });
        setInspectorTab("console");
        return;
      }

      setResult({
        stdout: "",
        stderr: "",
        result: null,
        error:
          runtimeError ||
          `${languageLabel} runtime failed to load. Refresh the page and try again.`,
        trace: [],
      });
      setInspectorTab("console");
      return;
    }

    setIsRunning(true);
    setResult(null);
    setCurrentStep(0);
    setPlaybackState("idle");

    const useFunctionMode = executionMode === "function";
    let parsedArgs: unknown[] = [];

    if (useFunctionMode) {
      if (!functionName.trim()) {
        setResult({
          stdout: "",
          stderr: "",
          result: null,
          error: "Function mode requires a function name.",
          trace: [],
        });
        setIsRunning(false);
        setInspectorTab("console");
        return;
      }

      if (!functionArgs.trim()) {
        setResult({
          stdout: "",
          stderr: "",
          result: null,
          error: "Function mode requires function arguments as JSON.",
          trace: [],
        });
        setIsRunning(false);
        setInspectorTab("console");
        return;
      }

      try {
        const parsed = JSON.parse(functionArgs);
        parsedArgs = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        setResult({
          stdout: "",
          stderr: "",
          result: null,
          error: "Invalid JSON in function arguments",
          trace: [],
        });
        setIsRunning(false);
        setInspectorTab("console");
        return;
      }
    }

    try {
      const execResult = await executeInBrowser({
        source,
        language,
        stdin,
        function_name: useFunctionMode ? functionName.trim() : undefined,
        function_args: useFunctionMode ? parsedArgs : undefined,
        trace: true,
      });

      const initialStep = getPreferredStepAfterRun(execResult.trace);

      setResult(execResult);
      lastRunSourceRef.current = source;
      setCurrentStep(initialStep);
      setPlaybackState(execResult.trace.length > 0 ? "paused" : "finished");

      if (execResult.error || execResult.stdout || execResult.stderr) {
        setInspectorTab("console");
      } else {
        setInspectorTab("visualize");
      }

      saveSession({
        id: sessionIdRef.current,
        language,
        executionMode,
        source,
        stdin,
        functionName,
        functionArgs,
        createdAt: new Date().toISOString(),
        result: execResult,
        playbackPosition: initialStep,
      });
      savePlaybackPosition(sessionIdRef.current, initialStep);
    } catch (err) {
      setResult({
        stdout: "",
        stderr: "",
        result: null,
        error: err instanceof Error ? err.message : "Execution failed",
        trace: [],
      });
      setInspectorTab("console");
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const totalSteps = result?.trace.length ?? 0;
  const currentTraceStep: TraceStep | null =
    result && result.trace.length > 0 ? result.trace[currentStep] : null;

  const handleStepBack = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
    setPlaybackState("paused");
    savePlaybackPosition(sessionIdRef.current, Math.max(0, currentStep - 1));
  };

  const handleStepForward = () => {
    setCurrentStep((s) => Math.min(totalSteps - 1, s + 1));
    setPlaybackState("paused");
    savePlaybackPosition(sessionIdRef.current, Math.min(totalSteps - 1, currentStep + 1));
  };

  const handlePlay = () => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
    }
    setPlaybackState("playing");
  };

  const handlePause = () => {
    setPlaybackState("paused");
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setPlaybackState("paused");
    savePlaybackPosition(sessionIdRef.current, 0);
  };

  const handleSeek = (step: number) => {
    setCurrentStep(step);
    setPlaybackState("paused");
    savePlaybackPosition(sessionIdRef.current, step);
  };

  useEffect(() => {
    if (playbackState === "playing") {
      playIntervalRef.current = setInterval(() => {
        setCurrentStep((s) => {
          if (s >= totalSteps - 1) {
            setPlaybackState("finished");
            return s;
          }
          return s + 1;
        });
      }, 500);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [playbackState, totalSteps]);

  const currentLine = currentTraceStep?.line;
  const displayStdout = currentTraceStep?.stdout || result?.stdout || "";
  const displayStderr = currentTraceStep?.stderr || result?.stderr || "";

  return (
    <div className={`flex h-screen flex-col ${t.app}`}>
      <header className={`flex items-center justify-between border-b px-4 py-2 ${t.header}`}>
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-500" />
          <h1 className="text-lg font-semibold tracking-tight">VisualTrace</h1>
          <span className={`text-xs ${t.labelMuted}`}>
            Runs in your browser · saved to local storage
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {runtimeStatus === "loading" &&
              (language === "python" || language === "cpp") && (
              <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
            )}
            <div
              className={`h-2 w-2 rounded-full ${
                runtimeStatus === "ready"
                  ? "bg-green-500"
                  : runtimeStatus === "loading"
                    ? "bg-yellow-500"
                    : runtimeStatus === "unsupported"
                      ? "bg-zinc-500"
                      : "bg-red-500"
              }`}
            />
            <span className={`text-xs ${t.subtext}`}>
              {languageLabel}{" "}
              {runtimeStatus === "ready"
                ? "ready"
                : runtimeStatus === "loading"
                  ? "loading..."
                  : runtimeStatus === "unsupported"
                    ? "coming soon"
                    : "failed"}
            </span>
          </div>
          <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
          <LanguageSelector
            languages={languages}
            selected={language}
            onChange={handleLanguageChange}
            theme={theme}
          />
          <ExecutionControls
            onRun={handleRun}
            onStop={handleStop}
            isRunning={isRunning}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex w-1/2 flex-col border-r ${t.panel}`}>
          <div className={`flex items-center justify-between border-b px-3 py-1.5 ${t.panel}`}>
            <span className={`text-xs font-medium ${t.label}`}>Editor</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetClick}
                className="flex items-center gap-1.5 rounded-md border border-amber-600/60 bg-amber-600/15 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-600/25 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25"
                title="Reset editor and inputs to the two sum example"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                onClick={() => setShowTestInput(!showTestInput)}
                className={`text-xs ${t.subtext} hover:opacity-80`}
              >
                {showTestInput ? "Hide" : "Show"} Input
              </button>
            </div>
          </div>

          {showTestInput && (
            <div className={`border-b ${t.panel}`}>
              <TestInput
                executionMode={executionMode}
                onExecutionModeChange={handleExecutionModeChange}
                stdin={stdin}
                onStdinChange={setStdin}
                functionName={functionName}
                onFunctionNameChange={handleFunctionNameChange}
                functionArgs={functionArgs}
                onFunctionArgsChange={handleFunctionArgsChange}
                theme={theme}
              />
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <CodeEditor
              language={language}
              value={source}
              onChange={handleSourceChange}
              currentLine={currentLine}
              fontSize={settings.fontSize}
              theme={theme}
            />
          </div>

          <PlaybackControls
            currentStep={currentStep}
            totalSteps={totalSteps}
            isPlaying={playbackState === "playing"}
            onStepBack={handleStepBack}
            onStepForward={handleStepForward}
            onPlay={handlePlay}
            onPause={handlePause}
            onRestart={handleRestart}
            onSeek={handleSeek}
            disabled={!result || totalSteps === 0}
            theme={theme}
          />
        </div>

        <div className="flex w-1/2 flex-col">
          <div className={`border-b px-3 py-1.5 ${t.panel}`}>
            <span className={`text-xs font-medium ${t.label}`}>Inspector</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Inspector
              step={currentTraceStep}
              stdout={displayStdout}
              stderr={displayStderr}
              error={result?.error ?? null}
              theme={theme}
              activeTab={inspectorTab}
              onTabChange={handleInspectorTabChange}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset to example?"
        message="This will replace your current code, inputs, and run results with the default two sum example for the selected language."
        confirmLabel="Reset"
        theme={theme}
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
      />

      <CopyrightFooter theme={theme} />
    </div>
  );
}
