# VisualTrace

Multi-language algorithm execution visualizer. Paste code, run it, and step through execution line by line to understand algorithms visually.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, Monaco Editor, Tailwind CSS |
| API | FastAPI (Python) |
| Execution | Docker-isolated language runners |
| Storage | Browser Local Storage (MVP) |

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker (for isolated code execution)

### Development (without Docker)

```bash
# API — uses local Python runner
cd api
pip install -r requirements.txt
USE_DOCKER_RUNNER=false uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Full Stack (with Docker)

```bash
# Build the Python runner image
docker build -t visualtrace-python-runner ./runners/python

# Start all services
docker compose up --build
```

## Project Structure

```
visualtrace/
├── frontend/          # Next.js app
│   └── src/
│       ├── components/    # UI components
│       ├── lib/           # API client, local storage
│       └── types/         # TypeScript types
├── api/               # FastAPI backend
│   └── app/
│       ├── runners/       # LanguageRunner interface + PythonRunner
│       ├── routers/       # API endpoints
│       └── models/        # Pydantic schemas
├── runners/           # Docker-based execution runners
│   └── python/            # Python runner with sys.settrace
└── docker-compose.yml
```

## Features (MVP v1)

- **Python execution** with Docker isolation
- **Line-by-line tracing** via `sys.settrace`
- **Function invocation** with JSON arguments
- **Playback controls** — step, play, pause, restart, timeline scrubber
- **Variable inspector** — locals, globals, result
- **Call stack viewer**
- **Console output** — stdout, stderr, errors
- **Data visualizations** — arrays, dictionaries, queues, stacks, recursion
- **Local storage** — source code, sessions, playback position, settings
- **Multi-language foundation** — `LanguageRunner` interface ready for JS, Java, C++

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API health check |
| GET | `/api/languages` | List supported languages |
| POST | `/api/execute` | Execute code with tracing |

### Execute Request

```json
{
  "source": "def add(a, b):\n    return a + b",
  "language": "python",
  "stdin": "",
  "function_name": "add",
  "function_args": [3, 4],
  "trace": true
}
```

## Running Tests

```bash
# API tests
cd api && pytest -v

# Frontend lint
cd frontend && npm run lint
```

## Roadmap

- JavaScript, Java, and C++ runners
- Algorithm detection
- Richer visualizations
- AI explanations based on execution traces
- Optional cloud sync with accounts

## License

MIT
