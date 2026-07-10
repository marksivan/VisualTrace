# VisualTrace

Multi-language algorithm execution visualizer. Paste code, run it, and step through execution line by line to understand algorithms visually.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| API | FastAPI (Python) |
| Execution | Docker-isolated language runners |
| Storage | Browser Local Storage (planned) |

## Milestone 1 — Project Setup

This milestone establishes:

- Monorepo structure (`frontend/`, `api/`, `runners/`)
- Next.js frontend scaffold with VisualTrace branding
- FastAPI backend with `/health` endpoint
- Docker Compose configuration for local development
- API health check test

## Quick Start

### Development

```bash
# API
cd api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page shows API connection status.

### Docker

```bash
docker compose up --build
```

## Project Structure

```
visualtrace/
├── frontend/          # Next.js app
├── api/               # FastAPI backend
│   └── app/routers/   # Health endpoint
├── runners/python/    # Docker runner (placeholder until Milestone 3)
└── docker-compose.yml
```

## Upcoming Milestones

2. Editor — Monaco, language selector, test input, execution controls
3. Execution — Docker Python runner
4. Function Calls — JSON arguments and invocation
5. Tracing — Line-by-line `sys.settrace`
6. Playback — Step controls and timeline
7. Inspector — Variables, console, call stack
8. Visualizations — Arrays, dicts, queues, stacks, recursion
9. Multi-language — `LanguageRunner` interface
10. Polish — UX, tests, documentation

## Running Tests

```bash
cd api && python3 -m pytest -v
```

## License

MIT
