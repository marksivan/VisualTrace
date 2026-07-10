import type { ExecuteRequest, ExecutionResult, StackFrame, TraceStep } from "@/types";
import { parseSnippet } from "@/lib/java-runtime/parser/snippet";
import { ParseError } from "@/lib/java-runtime/parser/index";
import { Interpreter, type InterpreterIO } from "@/lib/java-runtime/interpreter/interpreter";
import { registerAll } from "@/lib/java-runtime/runtime/index";
import {
  ExecutionCancelled,
  JavaException,
  StepLimitExceeded,
} from "@/lib/java-runtime/interpreter/errors";
import { serializeValue } from "@/lib/runners/shared";

const USER_FILENAME = "<user_code>";

export function buildJavaExecutionSource(
  source: string,
  functionName?: string,
  functionArgs?: unknown[]
): string {
  if (!functionName) return source;

  const className = findJavaClassName(source);
  const args = functionArgs ?? [];
  const argDecls = args.map((arg, index) => {
    const literal = toJavaLiteral(arg);
    const type = inferJavaType(arg);
    return `${type} _vt_arg${index} = ${literal};`;
  });
  const argNames = args.map((_, index) => `_vt_arg${index}`).join(", ");
  const staticMethod = isStaticJavaMethod(source, functionName);
  const call = staticMethod
    ? `${className}.${functionName}(${argNames})`
    : `new ${className}().${functionName}(${argNames})`;
  const returnType = inferJavaReturnType(source, functionName);

  return `import java.util.Arrays;

${source}

class __VT_Runner__ {
  public static void main(String[] args) throws Exception {
    ${argDecls.join("\n    ")}
    ${returnType} _vt_result = ${call};
    System.out.println(${formatJavaPrintExpression(returnType, "_vt_result")});
  }
}
`;
}

function inferJavaReturnType(source: string, methodName: string): string {
  const match = source.match(
    new RegExp(`[\\w\\[\\]<>]+\\s+${methodName}\\s*\\([^)]*\\)`)
  );
  if (!match) return "Object";
  return match[0].replace(methodName, "").replace(/\s*\(.*/, "").trim() || "Object";
}

function formatJavaPrintExpression(type: string, variableName: string): string {
  if (type.endsWith("[]")) {
    return `Arrays.toString(${variableName})`;
  }
  return variableName;
}

function findJavaClassName(source: string): string {
  const match = source.match(/class\s+(\w+)/);
  return match?.[1] ?? "Main";
}

function isStaticJavaMethod(source: string, methodName: string): boolean {
  const pattern = new RegExp(`static\\s+[\\w\\[\\]<>]+\\s+${methodName}\\s*\\(`);
  return pattern.test(source);
}

function inferJavaType(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "number")) return "int[]";
    return "Object[]";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "double";
  }
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") return "String";
  return "Object";
}

function toJavaLiteral(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "number")) {
      return `new int[] {${value.join(", ")}}`;
    }
    return `new Object[] {${value.map((item) => toJavaLiteral(item)).join(", ")}}`;
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : `${value}d`;
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  return "null";
}

export async function preloadJavaRuntime(): Promise<void> {
  // Java interpreter is bundled; nothing to preload from CDN.
}

export async function executeJavaInBrowser(
  request: ExecuteRequest
): Promise<ExecutionResult> {
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];
  const stdinLines = (request.stdin || "").split("\n");
  let stdinIndex = 0;

  const io: InterpreterIO = {
    print: (text) => {
      stdoutChunks.push(text);
    },
    println: (text) => {
      stdoutChunks.push(`${text}\n`);
    },
    requestInput: async () => {
      const line = stdinLines[stdinIndex] ?? "";
      stdinIndex += 1;
      return line;
    },
  };

  const executionSource = buildJavaExecutionSource(
    request.source,
    request.function_name,
    request.function_args
  );

  try {
    const { ast } = parseSnippet(executionSource);
    const interpreter = new Interpreter(io, { stepLimit: 3_000_000 });
    registerAll(interpreter, io);
    await interpreter.run(ast);

    return {
      stdout: stdoutChunks.join(""),
      stderr: stderrChunks.join(""),
      result: null,
      error: null,
      trace: [],
    };
  } catch (error) {
    if (error instanceof ParseError) {
      return {
        stdout: stdoutChunks.join(""),
        stderr: stderrChunks.join(""),
        result: null,
        error: `Compilation error: ${error.message}${
          error.line ? ` (line ${error.line})` : ""
        }`,
        trace: [],
      };
    }

    if (error instanceof JavaException) {
      const stack = formatJavaStack(error.stackTrace);
      return {
        stdout: stdoutChunks.join(""),
        stderr: stderrChunks.join(""),
        result: null,
        error: `Exception: ${error.message}${error.line ? ` (line ${error.line})` : ""}${stack}`,
        trace: buildJavaTraceFromStack(error, stdoutChunks.join("")),
      };
    }

    if (error instanceof StepLimitExceeded) {
      return {
        stdout: stdoutChunks.join(""),
        stderr: stderrChunks.join(""),
        result: null,
        error: "Step limit exceeded (possible infinite loop).",
        trace: [],
      };
    }

    if (error instanceof ExecutionCancelled) {
      return {
        stdout: stdoutChunks.join(""),
        stderr: stderrChunks.join(""),
        result: null,
        error: "Execution cancelled.",
        trace: [],
      };
    }

    return {
      stdout: stdoutChunks.join(""),
      stderr: stderrChunks.join(""),
      result: null,
      error: error instanceof Error ? error.message : String(error),
      trace: [],
    };
  }
}

function formatJavaStack(
  stackTrace: Array<{ className: string; methodName: string; line: number }>
): string {
  if (stackTrace.length === 0) return "";
  return `\n${stackTrace
    .map(
      (frame) =>
        `  at ${frame.className}.${frame.methodName} (line ${frame.line})`
    )
    .join("\n")}`;
}

function buildJavaTraceFromStack(
  error: JavaException,
  stdout: string
): TraceStep[] {
  if (!error.line) return [];

  const stack: StackFrame[] = error.stackTrace.map((frame) => ({
    function: `${frame.className}.${frame.methodName}`,
    line: frame.line,
    filename: USER_FILENAME,
  }));

  return [
    {
      step: 0,
      line: error.line,
      event: "line",
      locals: {},
      globals: {},
      stack,
      stdout,
      stderr: error.message,
    },
  ];
}
