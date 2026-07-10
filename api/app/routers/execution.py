from fastapi import APIRouter, HTTPException

from app.models.execution import ExecuteRequest, ExecuteResponse, TraceStepResponse
from app.runners.base import ExecutionRequest
from app.runners.python_runner import get_runner

router = APIRouter()


@router.get("/languages")
async def list_languages():
    return {
        "languages": [
            {"id": "python", "name": "Python", "enabled": True},
            {"id": "javascript", "name": "JavaScript", "enabled": False},
            {"id": "java", "name": "Java", "enabled": False},
            {"id": "cpp", "name": "C++", "enabled": False},
        ]
    }


@router.post("/execute", response_model=ExecuteResponse)
async def execute_code(request: ExecuteRequest):
    runner = get_runner(request.language)
    if runner is None:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {request.language}")

    exec_request = ExecutionRequest(
        source=request.source,
        stdin=request.stdin,
        function_name=request.function_name,
        function_args=request.function_args,
        trace=request.trace,
    )

    result = await runner.execute(exec_request)

    return ExecuteResponse(
        stdout=result.stdout,
        stderr=result.stderr,
        result=result.result,
        error=result.error,
        trace=[
            TraceStepResponse(
                step=step.step,
                line=step.line,
                event=step.event,
                locals=step.locals,
                globals=step.globals,
                stack=step.stack,
                stdout=step.stdout,
                stderr=step.stderr,
            )
            for step in result.trace
        ],
    )
