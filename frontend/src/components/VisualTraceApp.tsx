"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import LanguageSelector from "@/components/LanguageSelector";
import TestInput from "@/components/TestInput";
import ExecutionControls from "@/components/ExecutionControls";
import PlaybackControls from "@/components/PlaybackControls";
import Inspector from "@/components/Inspector";
import { executeCode, getLanguages } from "@/lib/api";
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
  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
  const [language, setLanguage] = useState<Language>("python");
  const [source, setSource] = useState(() => loadSource("python"));
  const [stdin, setStdin] = useState("");
  const [functionName, setFunctionName] = useState("two_sum");
  const [functionArgs, setFunctionArgs] = useState("[[2, 7, 11, 15], 9]");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [showTestInput, setShowTestInput] = useState(true);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const settings = loadSettings();

  useEffect(() => {
    getLanguages()
      .then(setLanguages)
      .catch(() =>
        setLanguages([{ id: "python", name: "Python", enabled: true }])
      );

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/health`)
      .then((r) => (r.ok ? setApiStatus("connected") : setApiStatus("disconnected")))
      .catch(() => setApiStatus("disconnected"));
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
        return;
      }
    }

    try {
      const execResult = await executeCode({
        source,
        language,
        stdin,
        function_name: functionName || undefined,
        function_args: parsedArgs,
        trace: true,
      });

      setResult(execResult);
      setCurrentStep(0);
      setPlaybackState(execResult.trace.length > 0 ? "paused" : "finished");

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
          <span className="text-xs text-zinc-600">Algorithm Visualizer</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${
                apiStatus === "connected"
                  ? "bg-green-500"
                  : apiStatus === "checking"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
            <span className="text-xs text-zinc-500">API</span>
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
