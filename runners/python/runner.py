"""Python execution runner for VisualTrace.

Executes user code with optional line-by-line tracing via sys.settrace.
Supports function invocation with JSON-serializable arguments.
"""

import json
import sys
import traceback
from io import StringIO
from typing import Any


def serialize_value(value: Any, depth: int = 0) -> Any:
    """Serialize a Python value to JSON-compatible form."""
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

    return repr(value)


def get_stack_frames() -> list[dict]:
    """Build call stack from current frame."""
    import inspect

    frames = []
    for frame_info in inspect.stack()[2:]:
        frames.append({
            "function": frame_info.function,
            "line": frame_info.lineno,
            "filename": frame_info.filename,
        })
    return frames


class Tracer:
    """Records line-by-line execution using sys.settrace."""

    def __init__(self, user_filename: str = "<user_code>"):
        self.user_filename = user_filename
        self.steps: list[dict] = []
        self.step_count = 0
        self.stdout_so_far = ""
        self.stderr_so_far = ""
        self._stdout_capture: StringIO | None = None
        self._stderr_capture: StringIO | None = None
        self.max_steps = 5000

    def set_captures(self, stdout: StringIO, stderr: StringIO):
        self._stdout_capture = stdout
        self._stderr_capture = stderr

    def trace_function(self, frame, event, arg):
        if self.step_count >= self.max_steps:
            return self.trace_function

        filename = frame.f_code.co_filename
        if filename != self.user_filename:
            if event == "call" and filename.endswith("runner.py"):
                return None
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
                "stack": stack,
                "stdout": self.stdout_so_far,
                "stderr": self.stderr_so_far,
            })
            self.step_count += 1

        return self.trace_function


def build_execution_source(
    source: str,
    function_name: str | None,
    function_args: list,
) -> str:
    """Wrap user source for function invocation if needed."""
    if not function_name:
        return source

    args_json = json.dumps(function_args)
    wrapper = f"""
{source}

import json as _vt_json
_vt_args = _vt_json.loads({repr(args_json)})
_vt_result = {function_name}(*_vt_args) if isinstance(_vt_args, list) else {function_name}(_vt_args)
result = _vt_result
"""
    return wrapper


def main():
    payload = json.loads(sys.stdin.read())
    source = payload.get("source", "")
    stdin_data = payload.get("stdin", "")
    function_name = payload.get("function_name")
    function_args = payload.get("function_args", [])
    enable_trace = payload.get("trace", True)

    source = build_execution_source(source, function_name, function_args)

    old_stdin = sys.stdin
    old_stdout = sys.stdout
    old_stderr = sys.stderr

    stdout_capture = StringIO()
    stderr_capture = StringIO()

    sys.stdin = StringIO(stdin_data)
    sys.stdout = stdout_capture
    sys.stderr = stderr_capture

    result = None
    error = None
    trace_steps: list[dict] = []

    user_filename = "<user_code>"
    tracer = Tracer(user_filename)
    tracer.set_captures(stdout_capture, stderr_capture)

    try:
        namespace: dict = {}
        code = compile(source, user_filename, "exec")

        if enable_trace:
            sys.settrace(tracer.trace_function)

        exec(code, namespace)

        if enable_trace:
            sys.settrace(None)

        result = namespace.get("result")
        if result is None and function_name and function_name in namespace:
            result = namespace.get(function_name)

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

    output = {
        "stdout": stdout_capture.getvalue(),
        "stderr": stderr_capture.getvalue(),
        "result": serialize_value(result),
        "error": error,
        "trace": trace_steps,
    }
    print(json.dumps(output))


if __name__ == "__main__":
    main()
