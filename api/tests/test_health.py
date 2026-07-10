from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "visualtrace-api"


def test_languages_endpoint():
    response = client.get("/api/languages")
    assert response.status_code == 200
    data = response.json()
    assert "languages" in data
    assert len(data["languages"]) >= 1
    python = next(lang for lang in data["languages"] if lang["id"] == "python")
    assert python["enabled"] is True
