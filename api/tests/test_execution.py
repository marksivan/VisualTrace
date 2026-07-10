import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# Use local runner for tests (no Docker required)
os.environ["USE_DOCKER_RUNNER"] = "false"


def test_execute_simple_code():
    response = client.post(
        "/api/execute",
        json={
            "source": "x = 1 + 2\nresult = x",
            "language": "python",
            "trace": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["result"] == 3
    assert len(data["trace"]) > 0


def test_execute_with_function():
    source = """
def add(a, b):
    return a + b
"""
    response = client.post(
        "/api/execute",
        json={
            "source": source,
            "language": "python",
            "function_name": "add",
            "function_args": [3, 4],
            "trace": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["error"] is None
    assert data["result"] == 7


def test_execute_with_stdout():
    response = client.post(
        "/api/execute",
        json={
            "source": 'print("hello")\nresult = 42',
            "language": "python",
            "trace": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "hello" in data["stdout"]
    assert data["result"] == 42


def test_execute_invalid_language():
    response = client.post(
        "/api/execute",
        json={
            "source": "console.log(1)",
            "language": "javascript",
        },
    )
    assert response.status_code == 400


def test_trace_contains_locals():
    source = """
nums = [1, 2, 3]
total = sum(nums)
result = total
"""
    response = client.post(
        "/api/execute",
        json={
            "source": source,
            "language": "python",
            "trace": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["trace"]) > 0
    last_step = data["trace"][-1]
    assert "locals" in last_step or "globals" in last_step
