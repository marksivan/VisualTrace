"""Language runner interface for VisualTrace.

All language runners implement this common interface, enabling
multi-language support without changing the API contract.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ExecutionRequest:
    source: str
    stdin: str = ""
    function_name: str | None = None
    function_args: list[Any] = field(default_factory=list)
    trace: bool = True


@dataclass
class TraceStep:
    step: int
    line: int
    event: str
    locals: dict[str, Any]
    globals: dict[str, Any]
    stack: list[dict[str, Any]]
    stdout: str
    stderr: str


@dataclass
class ExecutionResult:
    stdout: str
    stderr: str
    result: Any = None
    error: str | None = None
    trace: list[TraceStep] = field(default_factory=list)


class LanguageRunner(ABC):
    """Abstract base for language-specific execution runners."""

    @property
    @abstractmethod
    def language_id(self) -> str:
        pass

    @abstractmethod
    async def execute(self, request: ExecutionRequest) -> ExecutionResult:
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        pass
