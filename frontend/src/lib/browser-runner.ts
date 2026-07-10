import type { ExecuteRequest, ExecutionResult, Language, LanguageInfo } from "@/types";
import { executeJavaScriptInBrowser } from "@/lib/runners/javascript-runner";
import {
  executePythonInBrowser,
  preloadPythonRuntime,
} from "@/lib/runners/python-runner";
import { isRuntimeLanguage } from "@/lib/runners/shared";

export { preloadPythonRuntime };

export async function preloadRuntime(language: Language): Promise<void> {
  if (language === "python") {
    await preloadPythonRuntime();
  }
}

export async function executeInBrowser(
  request: ExecuteRequest
): Promise<ExecutionResult> {
  switch (request.language) {
    case "python":
      return executePythonInBrowser(request);
    case "javascript":
      return executeJavaScriptInBrowser(request);
    default:
      throw new Error(
        `${request.language} is not supported in the browser yet. JavaScript and Python are available today.`
      );
  }
}

export const BROWSER_LANGUAGES: LanguageInfo[] = [
  { id: "python", name: "Python", enabled: true },
  { id: "javascript", name: "JavaScript", enabled: true },
  { id: "java", name: "Java", enabled: false },
  { id: "cpp", name: "C++", enabled: false },
];

export function languageNeedsRuntimeLoad(language: Language): boolean {
  return language === "python";
}

export function isLanguageReady(
  language: Language,
  pythonStatus: "loading" | "ready" | "error"
): boolean {
  if (language === "javascript") return true;
  if (language === "python") return pythonStatus === "ready";
  return false;
}

export function getRuntimeStatus(
  language: Language,
  pythonStatus: "loading" | "ready" | "error"
): "loading" | "ready" | "error" | "unsupported" {
  if (!isRuntimeLanguage(language)) return "unsupported";
  if (language === "javascript") return "ready";
  return pythonStatus;
}
