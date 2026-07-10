"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Activity } from "lucide-react";
import { getApiUrl, isGitHubPagesHost } from "@/lib/config";

type ApiStatus = "checking" | "connected" | "disconnected";

function useIsGitHubPages() {
  return useSyncExternalStore(
    () => () => {},
    () => isGitHubPagesHost(),
    () => false
  );
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const onGitHubPages = useIsGitHubPages();

  useEffect(() => {
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/health`)
      .then((res) => setApiStatus(res.ok ? "connected" : "disconnected"))
      .catch(() => setApiStatus("disconnected"));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-6 py-4">
        <Activity className="h-6 w-6 text-blue-500" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">VisualTrace</h1>
          <p className="text-sm text-zinc-500">Algorithm Visualizer</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <div className="max-w-lg text-center">
          <h2 className="text-2xl font-medium text-zinc-200">
            Project setup complete
          </h2>
          <p className="mt-3 text-zinc-400">
            Milestone 1 establishes the monorepo, Next.js frontend, FastAPI
            backend, Docker configuration, and health endpoints. The code editor
            and execution engine arrive in upcoming milestones.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                apiStatus === "connected"
                  ? "bg-green-500"
                  : apiStatus === "checking"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
            <span className="text-sm text-zinc-300">
              API{" "}
              {apiStatus === "connected"
                ? "connected"
                : apiStatus === "checking"
                  ? "checking..."
                  : "disconnected"}
            </span>
          </div>
          {apiStatus === "disconnected" && onGitHubPages && (
            <p className="mt-2 text-xs text-zinc-500">
              The live site is the frontend only. Run the API locally for full
              functionality, or deploy it separately and set{" "}
              <code className="text-zinc-400">NEXT_PUBLIC_API_URL</code> at build
              time.
            </p>
          )}
          {apiStatus === "disconnected" && !onGitHubPages && (
            <p className="mt-2 text-xs text-zinc-500">
              Start the API with:{" "}
              <code className="text-zinc-400">
                cd api && uvicorn app.main:app --reload
              </code>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
