from typing import Any

from pydantic import BaseModel, Field


class ExecuteRequest(BaseModel):
    source: str
    language: str = "python"
    stdin: str = ""
    function_name: str | None = None
    function_args: list[Any] = Field(default_factory=list)
    trace: bool = True


class TraceStepResponse(BaseModel):
    step: int
    line: int
    event: str
    locals: dict[str, Any]
    globals: dict[str, Any]
    stack: list[dict[str, Any]]
    stdout: str
    stderr: str


class ExecuteResponse(BaseModel):
    stdout: str
    stderr: str
    result: Any = None
    error: str | None = None
    trace: list[TraceStepResponse] = Field(default_factory=list)
