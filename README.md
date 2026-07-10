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

### Publish to GitHub Pages

The frontend is a **static site** and deploys automatically when changes merge to `main`.

**One-time setup in your GitHub repo:**

1. Go to **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**

After the first merge to `main`, the workflow publishes the site to:

**https://marksivan.github.io/VisualTrace/**

To preview the production build locally:

```bash
cd frontend
npm run build:pages
npx serve out
```

Then open `http://localhost:3000/VisualTrace/`.

> **Note:** GitHub Pages hosts the frontend only. The FastAPI backend must run locally or on a separate host. Set `NEXT_PUBLIC_API_URL` at build time if you deploy the API elsewhere.

### Docker

```bash
docker compose up --build
```

## Project Structure

```
visualtrace/
├── .github/workflows/ # GitHub Pages deploy workflow
├── frontend/          # Next.js static site
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
