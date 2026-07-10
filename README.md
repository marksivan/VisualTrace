# VisualTrace

Multi-language algorithm execution visualizer. Runs in your browser with local storage.

**Live site:** https://marksivan.github.io/VisualTrace/

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Project setup | Done |
| 2 | Editor (Monaco, language selector, inputs) | Done |
| 3 | Execution (browser Pyodide) | Done |
| 4 | Function calls with JSON args | Done |
| 5 | Line-by-line tracing | Done |
| 6 | Playback controls | Done |
| 7 | Inspector (variables, stack, console) | Done |
| 8 | Data structure visualizations | Done |
| 9 | Multi-language foundation | Planned |
| 10 | Polish & documentation | Planned |

## Visualize tab

The **Visualize** tab renders:

- **Arrays** — indexed cells with active index highlighted during loops
- **Dictionaries** — key/value pairs
- **Queues & stacks** — horizontal layout with front/back or top labels
- **Recursion** — call stack tree when a function calls itself

## Local preview

```bash
cd frontend && npm install && npm run build:pages && npx serve out
```

Open http://localhost:3000/VisualTrace/

## License

MIT
