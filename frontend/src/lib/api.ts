const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import type { ExecuteRequest, ExecutionResult, LanguageInfo } from "@/types";

export async function checkHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error("API health check failed");
  return res.json();
}

export async function getLanguages(): Promise<LanguageInfo[]> {
  const res = await fetch(`${API_URL}/api/languages`);
  if (!res.ok) throw new Error("Failed to fetch languages");
  const data = await res.json();
  return data.languages;
}

export async function executeCode(request: ExecuteRequest): Promise<ExecutionResult> {
  const res = await fetch(`${API_URL}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Execution failed" }));
    throw new Error(err.detail || "Execution failed");
  }

  return res.json();
}
