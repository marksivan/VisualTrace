"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import LanguageSelector from "@/components/LanguageSelector";
import TestInput from "@/components/TestInput";
import ExecutionControls from "@/components/ExecutionControls";
import PlaybackControls from "@/components/PlaybackControls";
import Inspector from "@/components/Inspector";
import {
  BROWSER_LANGUAGES,
  executeInBrowser,
  preloadPythonRuntime,
} from "@/lib/browser-runner";
import {
  loadSettings,
  loadSource,
  saveSession,
  saveSource,
  savePlaybackPosition,
} from "@/lib/storage";
import type {
  ExecutionResult,
  Language,
  LanguageInfo,
  PlaybackState,
  TraceStep,
} from "@/types";

export default function VisualTraceApp() {
  const [languages] = useState<LanguageInfo[]>(BROWSER_LANGUAGES);
  const [language, setLanguage] = useState<Language>("python");
  const [source, setSource] = useState(() => loadSource("python"));
  const [stdin, setStdin] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [functionArgs, setFunctionArgs] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [runtimeStatus, setRuntimeStatus] = useState<"loading" | "ready" | "error">("loading");
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [showTestInput, setShowTestInput] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<"variables" | "stack" | "console" | "visualize">("variables");
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "session-local"
  );
  const settings = loadSettings();

  useEffect(() => {
    preloadPythonRuntime()
      .then(() => setRuntimeStatus("ready"))
      .catch((err) => {
        setRuntimeStatus("error");
        setRuntimeError(err instanceof Error ? err.message : "Failed to load Python runtime");
      });
  }, []);

  const handleSourceChange = useCallback(
    (value: string) => {
      setSource(value);
      if (settings.autoSave) saveSource(language, value);
    },
    [language, settings.autoSave]
  );

  const handleLanguageChange = (langId: string) => {
    saveSource(language, source);
    setLanguage(langId as Language);
    setSource(loadSource(langId as Language));
    setResult(null);
    setCurrentStep(0);
    setPlaybackState("idle");
  };

  const handleRun = async () => {
    if (runtimeStatus === "loading") {
      setResult({
        stdout: "",
        stderr: "",
        result: null,
        error: "Python runtime is still loading. Please wait a moment and try again.",
        trace: [],
      });
      setInspectorTab("console");
      return;
    }

    if (runtimeStatus === "error") {
      setResult({
        stdout: "",
        stderr: "",
        result: null,
        error: runtimeError || "Python runtime failed to load. Refresh the page and try again.",
        trace: [],
      });
      setInspectorTab("console");
      return;
    }

    setIsRunning(true);
    setResult(null);
    setCurrentStep(0);
    setPlaybackState("idle");

    let parsedArgs: unknown[] = [];
    if (functionArgs.trim()) {
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

    if (functionName.trim() && parsedArgs.length === 0 && functionArgs.trim()) {
      setResult({
        stdout: "",
        stderr: "",
        result: null,
        error: "Function args must be a JSON array when calling a function by name",
        trace: [],
      });
      setIsRunning(false);
      setInspectorTab("console");
      return;
    }

    try {
      const execResult = await executeInBrowser({
        source,
        language,
        stdin,
        function_name: functionName.trim() || undefined,
        function_args: parsedArgs,
        trace: true,
      });

      setResult(execResult);
      setCurrentStep(0);
      setPlaybackState(execResult.trace.length > 0 ? "paused" : "finished");
      setInspectorTab(execResult.error ? "console" : "variables");

      saveSession({
        id: sessionIdRef.current,
        language,
        source,
        stdin,
        functionName,
        functionArgs,
        createdAt: new Date().toISOString(),
        result: execResult,
        playbackPosition: 0,
      });
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

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-blue-500" />
          <h1 className="text-lg font-semibold tracking-tight">VisualTrace</h1>
          <span className="text-xs text-zinc-600">Runs in your browser · saved to local storage</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {runtimeStatus === "loading" && (
              <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
            )}
            <div
              className={`h-2 w-2 rounded-full ${
                runtimeStatus === "ready"
                  ? "bg-green-500"
                  : runtimeStatus === "loading"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
            <span className="text-xs text-zinc-500">
              Python{" "}
              {runtimeStatus === "ready"
                ? "ready"
                : runtimeStatus === "loading"
                  ? "loading..."
                  : "failed"}
            </span>
          </div>
          <LanguageSelector
            languages={languages}
            selected={language}
            onChange={handleLanguageChange}
          />
          <ExecutionControls
            onRun={handleRun}
            onStop={handleStop}
            isRunning={isRunning}
            hasResult={!!result}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-1/2 flex-col border-r border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5">
            <span className="text-xs font-medium text-zinc-500">Editor</span>
            <button
              onClick={() => setShowTestInput(!showTestInput)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              {showTestInput ? "Hide" : "Show"} Input
            </button>
          </div>

          {showTestInput && (
            <div className="border-b border-zinc-800">
              <TestInput
                stdin={stdin}
                onStdinChange={setStdin}
                functionName={functionName}
                onFunctionNameChange={setFunctionName}
                functionArgs={functionArgs}
                onFunctionArgsChange={setFunctionArgs}
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
              theme={settings.theme}
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
          />
        </div>

        <div className="flex w-1/2 flex-col">
          <div className="border-b border-zinc-800 px-3 py-1.5">
            <span className="text-xs font-medium text-zinc-500">Inspector</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Inspector
              step={currentTraceStep}
              stdout={currentTraceStep?.stdout ?? result?.stdout ?? ""}
              stderr={currentTraceStep?.stderr ?? result?.stderr ?? ""}
              result={result?.result}
              error={result?.error ?? null}
              activeTab={inspectorTab}
              onTabChange={setInspectorTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
