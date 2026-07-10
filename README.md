# VisualTrace

Multi-language algorithm execution visualizer. Paste code, run it, and step through execution line by line to understand algorithms visually.

**No terminal required.** Open the website, write Python, and run — everything executes in your browser and saves to local storage.

## How to use

Visit **https://marksivan.github.io/VisualTrace/**

1. Wait for **Python ready** (first visit downloads ~10 MB, then caches)
2. Click **Run**
3. Step through execution with the playback controls

Your code never leaves your browser. Sessions and source code are saved to **local storage**.

### Optional function call mode

Leave **Function Name** empty to run the script as written (default `two_sum` example).

To call a specific function instead, set:
- **Function Name:** `two_sum`
- **Function Args:** `[[2, 7, 11, 15], 9]`

## Publish to GitHub Pages

1. Merge to `main`
2. **Settings → Pages → Source** → **GitHub Actions**
3. Site deploys automatically to `https://marksivan.github.io/VisualTrace/`

## Local preview

```bash
cd frontend
npm install
npm run build:pages
npx serve out
# Open http://localhost:3000/VisualTrace/
```

## Architecture

| Feature | Technology |
|---------|-----------|
| UI | Next.js static site (GitHub Pages) |
| Python | Pyodide (runs in browser) |
| Storage | Browser local storage |
| API (optional) | FastAPI + Docker for server-side execution |

## License

MIT
