# VisualTrace

Multi-language algorithm execution visualizer. Paste code, run it, and step through execution line by line to understand algorithms visually.

**No terminal required.** Open the website, write Python, and run — everything executes in your browser and saves to local storage.

## How to use (just open the webpage)

### Live site (recommended)

After GitHub Pages is enabled, visit:

**https://marksivan.github.io/VisualTrace/**

That's it. No install, no API, no Docker.

### Local preview (optional)

If you want to preview before deploying:

```bash
cd frontend
npm install
npm run build:pages
npx serve out
```

Open **http://localhost:3000/VisualTrace/**

## How it works

| Feature | Technology |
|---------|-----------|
| UI | Next.js static site (GitHub Pages) |
| Python execution | [Pyodide](https://pyodide.org/) — runs in your browser |
| Code & sessions | Browser **local storage** (persists on your machine) |
| Tracing | `sys.settrace` inside Pyodide |

On first visit, the Python runtime downloads once (~10 MB). After that it loads from cache.

Your code never leaves your browser unless you share it yourself.

## What you can do

- Edit Python in the Monaco code editor
- Run with function name + JSON arguments (e.g. `two_sum` with `[[2,7,11,15], 9]`)
- Step through execution line by line
- Inspect variables, call stack, and console output
- Visualize arrays, dictionaries, and recursion
- Auto-save source code to local storage

## Publish to GitHub Pages

1. Merge to `main`
2. Go to **Settings → Pages → Build and deployment**
3. Set **Source** to **GitHub Actions**

The workflow deploys automatically on every push to `main`.

## Optional: API backend (advanced)

The `api/` folder contains a FastAPI server for Docker-isolated execution. This is **optional** — the website works without it.

```bash
cd api && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Use the API only if you need server-side Docker sandboxing later.

## Project structure

```
visualtrace/
├── .github/workflows/   # GitHub Pages deploy
├── frontend/            # Static web app (Pyodide + local storage)
├── api/                 # Optional FastAPI backend
└── runners/python/      # Optional Docker runner
```

## Running tests

```bash
cd api && python3 -m pytest -v
```

## License

MIT
