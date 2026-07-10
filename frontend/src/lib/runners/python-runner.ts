import type { ExecuteRequest, ExecutionResult } from "@/types";

type PyodideInstance = {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (key: string, value: unknown) => void;
    get: (key: string) => unknown;
  };
  setStdout: (options: { batched: (msg: string) => void }) => void;
  setStderr: (options: { batched: (msg: string) => void }) => void;
};

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInstance>;
  }
}

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise: Promise<PyodideInstance> | null = null;
let pyodideScriptPromise: Promise<void> | null = null;
let harnessReady = false;

function loadPyodideScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Pyodide requires a browser environment"));
  }

  if (window.loadPyodide) return Promise.resolve();

  if (!pyodideScriptPromise) {
    pyodideScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${PYODIDE_CDN}pyodide.js`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Pyodide"));
      document.head.appendChild(script);
    });
  }

  return pyodideScriptPromise;
}

async function getPyodide(): Promise<PyodideInstance> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadPyodideScript();
      if (!window.loadPyodide) {
        throw new Error("Pyodide failed to initialize");
      }
      return window.loadPyodide({ indexURL: PYODIDE_CDN });
    })();
  }
  return pyodidePromise;
}

const TRACE_SETUP = `
import json
import sys
import traceback
from io import StringIO

def serialize_value(value, depth=0):
    if depth > 3:
        return repr(value)
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, (list, tuple)):
        return [serialize_value(v, depth + 1) for v in value[:50]]
    if isinstance(value, dict):
        return {str(k): serialize_value(v, depth + 1) for k, v in list(value.items())[:50]}
    if isinstance(value, set):
        return [serialize_value(v, depth + 1) for v in list(value)[:50]]
    node_attrs = ("val", "value", "key", "left", "right", "next", "neighbors", "children")
    if hasattr(value, "__dict__"):
        attrs = {}
        for attr in node_attrs:
            if hasattr(value, attr):
                attrs[attr] = serialize_value(getattr(value, attr), depth + 1)
        if attrs:
            return attrs
    return repr(value)

class Tracer:
    def __init__(self, user_filename="<user_code>"):
        self.user_filename = user_filename
        self.steps = []
        self.step_count = 0
        self.stdout_so_far = ""
        self.stderr_so_far = ""
        self._stdout_capture = None
        self._stderr_capture = None
        self.max_steps = 3000

    def set_captures(self, stdout, stderr):
        self._stdout_capture = stdout
        self._stderr_capture = stderr

    def trace_function(self, frame, event, arg):
        if self.step_count >= self.max_steps:
            return self.trace_function

        filename = frame.f_code.co_filename
        if filename != self.user_filename:
            return self.trace_function if event == "call" else None

        if frame.f_lineno < 1:
            return self.trace_function

        if event in ("line", "call", "return"):
            if self._stdout_capture:
                self.stdout_so_far = self._stdout_capture.getvalue()
            if self._stderr_capture:
                self.stderr_so_far = self._stderr_capture.getvalue()

            local_vars = {
                k: serialize_value(v)
                for k, v in frame.f_locals.items()
                if not k.startswith("__")
            }
            global_vars = {
                k: serialize_value(v)
                for k, v in frame.f_globals.items()
                if not k.startswith("__") and k not in ("__builtins__",)
            }

            stack = []
            current = frame
            while current:
                fn = current.f_code.co_filename
                if fn == self.user_filename:
                    stack.append({
                        "function": current.f_code.co_name,
                        "line": current.f_lineno,
                        "filename": fn,
                    })
                current = current.f_back

            self.steps.append({
                "step": self.step_count,
                "line": frame.f_lineno,
                "event": event,
                "locals": local_vars,
                "globals": global_vars,
                "stack": list(reversed(stack)),
                "stdout": self.stdout_so_far,
                "stderr": self.stderr_so_far,
            })
            self.step_count += 1

        return self.trace_function

def build_execution_source(source, function_name, function_args_json):
    if not function_name:
        return source
    return (
        source
        + "\\n\\nimport json as _vt_json\\n"
        + "_vt_args = _vt_json.loads(" + repr(function_args_json) + ")\\n"
        + "if isinstance(_vt_args, list):\\n"
        + "    _vt_result = " + function_name + "(*_vt_args)\\n"
        + "else:\\n"
        + "    _vt_result = " + function_name + "(_vt_args)\\n"
        + "result = _vt_result\\n"
    )

def run_traced_code(source, stdin_data, function_name, function_args_json, enable_trace):
    old_stdin = sys.stdin
    old_stdout = sys.stdout
    old_stderr = sys.stderr

    stdout_capture = StringIO()
    stderr_capture = StringIO()

    sys.stdin = StringIO(stdin_data or "")
    sys.stdout = stdout_capture
    sys.stderr = stderr_capture

    result = None
    error = None
    trace_steps = []
    user_filename = "<user_code>"
    tracer = Tracer(user_filename)
    tracer.set_captures(stdout_capture, stderr_capture)

    exec_source = build_execution_source(source, function_name, function_args_json)

    try:
        namespace = {}
        code = compile(exec_source, user_filename, "exec")
        if enable_trace:
            sys.settrace(tracer.trace_function)
        exec(code, namespace)
        if enable_trace:
            sys.settrace(None)
        result = namespace.get("result")
        trace_steps = tracer.steps
    except Exception:
        if enable_trace:
            sys.settrace(None)
        error = traceback.format_exc()
        trace_steps = tracer.steps
    finally:
        sys.stdin = old_stdin
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    return {
        "stdout": stdout_capture.getvalue(),
        "stderr": stderr_capture.getvalue(),
        "result": serialize_value(result),
        "error": error,
        "trace": trace_steps,
    }
`;

const RUN_CODE = `
import json
json.dumps(run_traced_code(
    __vt_source,
    __vt_stdin,
    __vt_function_name,
    __vt_function_args_json,
    __vt_trace,
))
`;

async function ensureHarness(pyodide: PyodideInstance): Promise<void> {
  if (!harnessReady) {
    await pyodide.runPythonAsync(TRACE_SETUP);
    harnessReady = true;
  }
}

export async function preloadPythonRuntime(): Promise<void> {
  const pyodide = await getPyodide();
  await ensureHarness(pyodide);
}

export async function executePythonInBrowser(
  request: ExecuteRequest
): Promise<ExecutionResult> {
  const pyodide = await getPyodide();
  await ensureHarness(pyodide);

  let stdout = "";
  let stderr = "";
  pyodide.setStdout({ batched: (msg) => { stdout += msg; } });
  pyodide.setStderr({ batched: (msg) => { stderr += msg; } });

  pyodide.globals.set("__vt_source", request.source);
  pyodide.globals.set("__vt_stdin", request.stdin || "");
  pyodide.globals.set("__vt_function_name", request.function_name || "");
  pyodide.globals.set(
    "__vt_function_args_json",
    JSON.stringify(request.function_args ?? [])
  );
  pyodide.globals.set("__vt_trace", request.trace);

  const output = await pyodide.runPythonAsync(RUN_CODE);

  if (typeof output !== "string") {
    throw new Error("Unexpected execution output from Python runtime");
  }

  const parsed = JSON.parse(output) as ExecutionResult;
  return {
    stdout: parsed.stdout || stdout,
    stderr: parsed.stderr || stderr,
    result: parsed.result,
    error: parsed.error,
    trace: parsed.trace || [],
  };
}
