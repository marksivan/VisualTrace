export type Language = "python" | "javascript" | "java" | "cpp";

export type ExecutionMode = "script" | "function";

export interface LanguageInfo {
  id: Language;
  name: string;
  enabled: boolean;
}

export interface TraceStep {
  step: number;
  line: number;
  event: string;
  locals: Record<string, unknown>;
  globals: Record<string, unknown>;
  stack: StackFrame[];
  stdout: string;
  stderr: string;
}

export interface StackFrame {
  function: string;
  line: number;
  filename: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  result: unknown;
  error: string | null;
  trace: TraceStep[];
}

export interface ExecuteRequest {
  source: string;
  language: Language;
  stdin: string;
  function_name?: string;
  function_args?: unknown[];
  trace: boolean;
}

export interface Session {
  id: string;
  language: Language;
  executionMode: ExecutionMode;
  source: string;
  stdin: string;
  functionName: string;
  functionArgs: string;
  createdAt: string;
  result?: ExecutionResult;
  playbackPosition: number;
}

export interface AppSettings {
  theme: "light" | "dark";
  fontSize: number;
  autoSave: boolean;
  executionMode: ExecutionMode;
}

export type PlaybackState = "idle" | "playing" | "paused" | "finished";
