import asyncio
import json
import os
import subprocess
from typing import Any

from app.runners.base import ExecutionRequest, ExecutionResult, LanguageRunner, TraceStep


class PythonRunner(LanguageRunner):
    """Executes Python code inside an isolated Docker container."""

    def __init__(self):
        self.image = os.getenv("PYTHON_RUNNER_IMAGE", "visualtrace-python-runner")
        self.timeout = int(os.getenv("RUNNER_TIMEOUT", "30"))
        self.memory_limit = os.getenv("RUNNER_MEMORY", "128m")
        self.use_docker = os.getenv("USE_DOCKER_RUNNER", "true").lower() == "true"
        self.runner_script = os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "runners", "python", "runner.py"
        )

    @property
    def language_id(self) -> str:
        return "python"

    async def execute(self, request: ExecutionRequest) -> ExecutionResult:
        payload = {
            "source": request.source,
            "stdin": request.stdin,
            "function_name": request.function_name,
            "function_args": request.function_args,
            "trace": request.trace,
        }

        if self.use_docker:
            raw = await self._run_docker(payload)
        else:
            raw = await self._run_local(payload)

        return self._parse_result(raw)

    async def health_check(self) -> bool:
        try:
            if self.use_docker:
                proc = await asyncio.create_subprocess_exec(
                    "docker", "image", "inspect", self.image,
                    stdout=asyncio.subprocess.DEVNULL,
                    stderr=asyncio.subprocess.DEVNULL,
                )
                await proc.wait()
                return proc.returncode == 0
            return os.path.exists(self.runner_script)
        except Exception:
            return False

    async def _run_docker(self, payload: dict) -> dict:
        cmd = [
            "docker", "run", "--rm", "-i",
            "--memory", self.memory_limit,
            "--cpus", "1",
            "--network", "none",
            "--read-only",
            "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
            self.image,
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(json.dumps(payload).encode()),
                timeout=self.timeout,
            )
        except asyncio.TimeoutError:
            proc.kill()
            return {"error": "Execution timed out", "stdout": "", "stderr": "", "trace": []}

        if proc.returncode != 0 and not stdout:
            return {
                "error": f"Runner failed: {stderr.decode()}",
                "stdout": "",
                "stderr": stderr.decode(),
                "trace": [],
            }

        try:
            return json.loads(stdout.decode())
        except json.JSONDecodeError:
            return {
                "error": f"Invalid runner output: {stdout.decode()[:200]}",
                "stdout": stdout.decode(),
                "stderr": stderr.decode(),
                "trace": [],
            }

    async def _run_local(self, payload: dict) -> dict:
        """Fallback for development without Docker."""
        proc = await asyncio.create_subprocess_exec(
            "python3", self.runner_script,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(json.dumps(payload).encode()),
                timeout=self.timeout,
            )
        except asyncio.TimeoutError:
            proc.kill()
            return {"error": "Execution timed out", "stdout": "", "stderr": "", "trace": []}

        try:
            return json.loads(stdout.decode())
        except json.JSONDecodeError:
            return {
                "error": f"Invalid runner output: {stdout.decode()[:200]}",
                "stdout": stdout.decode(),
                "stderr": stderr.decode(),
                "trace": [],
            }

    def _parse_result(self, raw: dict) -> ExecutionResult:
        trace_steps = [
            TraceStep(
                step=t.get("step", i),
                line=t.get("line", 0),
                event=t.get("event", "line"),
                locals=t.get("locals", {}),
                globals=t.get("globals", {}),
                stack=t.get("stack", []),
                stdout=t.get("stdout", ""),
                stderr=t.get("stderr", ""),
            )
            for i, t in enumerate(raw.get("trace", []))
        ]

        return ExecutionResult(
            stdout=raw.get("stdout", ""),
            stderr=raw.get("stderr", ""),
            result=raw.get("result"),
            error=raw.get("error"),
            trace=trace_steps,
        )


RUNNERS: dict[str, LanguageRunner] = {
    "python": PythonRunner(),
}


def get_runner(language: str) -> LanguageRunner | None:
    return RUNNERS.get(language)
