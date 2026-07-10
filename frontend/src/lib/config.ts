/**
 * App configuration for local dev and GitHub Pages deployment.
 */

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export function isGitHubPagesHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith("github.io");
}
