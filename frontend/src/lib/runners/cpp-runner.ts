import type { ExecuteRequest, ExecutionResult, StackFrame, TraceStep } from "@/types";
import { serializeValue } from "@/lib/runners/shared";

const MAX_STEPS = 3000;
const USER_FILENAME = "<user_code>";

type JSCPPDebugger = {
  done: boolean;
  next(): boolean | number;
  nextNode(): { sLine: number; eLine: number; type: string | null };
  variable(name?: string): Array<{ name: string; type: string; value: string }> | { value: string };
};

type JSCPPModule = {
  default: {
    run: (
      code: string,
      input: string,
      config?: Record<string, unknown>
    ) => number | JSCPPDebugger;
  };
};

let jscppPromise: Promise<JSCPPModule["default"]> | null = null;

async function getJSCPP(): Promise<JSCPPModule["default"]> {
  if (!jscppPromise) {
    jscppPromise = import("JSCPP").then((mod) => mod.default ?? mod);
  }
  return jscppPromise;
}

export async function preloadCppRuntime(): Promise<void> {
  await getJSCPP();
}

export function buildCppExecutionSource(
  source: string,
  functionName?: string,
  functionArgs?: unknown[]
): string {
  if (!functionName) return source;

  const args = functionArgs ?? [];
  const argList = args.map((arg) => toCppLiteral(arg)).join(", ");
  const call = argList.length > 0 ? `${functionName}(${argList});` : `${functionName}();`;

  const includes = source.includes("#include")
    ? ""
    : "#include <iostream>\nusing namespace std;\n\n";

  return `${includes}${source}

int main() {
    ${call}
    return 0;
}
`;
}

function toCppLiteral(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "number")) {
      return `{${value.join(", ")}}`;
    }
    return `{${value.map((item) => toCppLiteral(item)).join(", ")}}`;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "0";
}

function captureVariables(
  dbg: JSCPPDebugger
): Record<string, unknown> {
  const raw = dbg.variable();
  if (!Array.isArray(raw)) return {};

  const locals: Record<string, unknown> = {};
  for (const entry of raw) {
    const parsed = Number(entry.value);
    locals[entry.name] = Number.isNaN(parsed) ? entry.value : parsed;
  }
  return locals;
}

function runWithTrace(
  runFn: (
    code: string,
    input: string,
    config: Record<string, unknown>
  ) => number | JSCPPDebugger,
  code: string,
  stdin: string,
  config: Record<string, unknown>
): { stdout: string; steps: TraceStep[]; error: string | null; exitCode: number } {
  const stdoutChunks: string[] = [];
  const steps: TraceStep[] = [];
  let error: string | null = null;
  let exitCode = 0;

  const runtimeConfig = {
    ...config,
    stdio: {
      write: (text: string) => {
        stdoutChunks.push(text);
      },
    },
    debug: true,
    maxTimeout: 15000,
  };

  try {
    const dbg = runFn(code, stdin, runtimeConfig) as JSCPPDebugger;
    const stack: StackFrame[] = [{ function: "main", line: 1, filename: USER_FILENAME }];

    while (!dbg.done && steps.length < MAX_STEPS) {
      const node = dbg.nextNode();
      const line = node?.sLine > 0 ? node.sLine : 1;
      const locals = captureVariables(dbg);

      steps.push({
        step: steps.length,
        line,
        event: "line",
        locals: Object.fromEntries(
          Object.entries(locals).map(([key, value]) => [key, serializeValue(value)])
        ),
        globals: {},
        stack: stack.map((frame) => ({ ...frame })),
        stdout: stdoutChunks.join(""),
        stderr: "",
      });

      const stepResult = dbg.next();
      if (stepResult !== false) {
        exitCode = typeof stepResult === "number" ? stepResult : 0;
        break;
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return {
    stdout: stdoutChunks.join(""),
    steps,
    error,
    exitCode,
  };
}

export async function executeCppInBrowser(
  request: ExecuteRequest
): Promise<ExecutionResult> {
  const JSCPP = await getJSCPP();
  const code = buildCppExecutionSource(
    request.source,
    request.function_name,
    request.function_args
  );

  if (request.trace) {
    const traced = runWithTrace(JSCPP.run.bind(JSCPP), code, request.stdin || "", {});
    return {
      stdout: traced.stdout,
      stderr: "",
      result: null,
      error: traced.error,
      trace: traced.steps,
    };
  }

  const stdoutChunks: string[] = [];
  let error: string | null = null;
  let exitCode = 0;

  try {
    exitCode = JSCPP.run(code, request.stdin || "", {
      stdio: {
        write: (text: string) => {
          stdoutChunks.push(text);
        },
      },
      maxTimeout: 15000,
    }) as number;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return {
    stdout: stdoutChunks.join(""),
    stderr: "",
    result: null,
    error,
    trace: [],
  };
}
