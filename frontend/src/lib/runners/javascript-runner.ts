import type { ExecuteRequest, ExecutionResult, StackFrame, TraceStep } from "@/types";
import { instrumentJavaScript } from "@/lib/runners/javascript-instrument";
import {
  buildJavaScriptExecutionSource,
  formatJavaScriptError,
  serializeValue,
} from "@/lib/runners/shared";

const MAX_STEPS = 3000;
const USER_FILENAME = "<user_code>";

export function executeJavaScriptInBrowser(
  request: ExecuteRequest
): ExecutionResult {
  const steps: TraceStep[] = [];
  const scopeVars: Record<string, unknown> = {};
  const stackFrames: StackFrame[] = [];
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];
  let error: string | null = null;
  let result: unknown = undefined;

  const appendStdout = (value: string) => {
    stdoutChunks.push(value);
  };

  const appendStderr = (value: string) => {
    stderrChunks.push(value);
  };

  const stdoutSoFar = () => stdoutChunks.join("");
  const stderrSoFar = () => stderrChunks.join("");

  const recordStep = (line: number, event: string) => {
    if (!request.trace || steps.length >= MAX_STEPS) return;

    const locals = Object.fromEntries(
      Object.entries(scopeVars).map(([key, value]) => [key, serializeValue(value)])
    );

    steps.push({
      step: steps.length,
      line,
      event,
      locals,
      globals: { ...locals },
      stack: stackFrames.map((frame) => ({ ...frame })),
      stdout: stdoutSoFar(),
      stderr: stderrSoFar(),
    });
  };

  const __vt_line = (line: number, event: string) => {
    recordStep(line, event);
  };

  const __vt_call = (name: string, line: number) => {
    stackFrames.push({ function: name, line, filename: USER_FILENAME });
    recordStep(line, "call");
  };

  const __vt_return = (line: number) => {
    recordStep(line, "return");
    stackFrames.pop();
  };

  const __vt_var = (name: string, value: unknown) => {
    scopeVars[name] = value;
    if (name === "result") {
      result = value;
    }
  };

  const consoleShim = {
    log: (...args: unknown[]) => {
      appendStdout(
        args
          .map((arg) => {
            if (typeof arg === "string") return arg;
            try {
              return JSON.stringify(serializeValue(arg));
            } catch {
              return String(arg);
            }
          })
          .join(" ") + "\n"
      );
    },
    error: (...args: unknown[]) => {
      appendStderr(
        args
          .map((arg) => (typeof arg === "string" ? arg : String(arg)))
          .join(" ") + "\n"
      );
    },
  };

  const executionSource = buildJavaScriptExecutionSource(
    request.source,
    request.function_name,
    request.function_args
  );

  const instrumented = instrumentJavaScript(executionSource);
  if (instrumented.error) {
    return {
      stdout: "",
      stderr: "",
      result: null,
      error: `Syntax error: ${instrumented.error}`,
      trace: [],
    };
  }

  try {
    const runner = new Function(
      "__vt_line",
      "__vt_call",
      "__vt_return",
      "__vt_var",
      "console",
      instrumented.code
    );

    runner(__vt_line, __vt_call, __vt_return, __vt_var, consoleShim);

    if (result === undefined && "result" in scopeVars) {
      result = scopeVars.result;
    }
  } catch (err) {
    error = formatJavaScriptError(err);
  }

  return {
    stdout: stdoutSoFar(),
    stderr: stderrSoFar(),
    result: serializeValue(result ?? null),
    error,
    trace: steps,
  };
}
