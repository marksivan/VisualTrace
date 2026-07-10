import type { ExecuteRequest, ExecutionResult, Language, LanguageInfo } from "@/types";
import { executeCppInBrowser, preloadCppRuntime } from "@/lib/runners/cpp-runner";
import { executeJavaScriptInBrowser } from "@/lib/runners/javascript-runner";
import { executeJavaInBrowser, preloadJavaRuntime } from "@/lib/runners/java-runner";
import {
  executePythonInBrowser,
  preloadPythonRuntime,
} from "@/lib/runners/python-runner";
import { isRuntimeLanguage } from "@/lib/runners/shared";

export { preloadPythonRuntime };

export type RuntimeLoadStatus = "loading" | "ready" | "error";

export async function preloadRuntime(language: Language): Promise<void> {
  switch (language) {
    case "python":
      await preloadPythonRuntime();
      break;
    case "cpp":
      await preloadCppRuntime();
      break;
    case "java":
      await preloadJavaRuntime();
      break;
    default:
      break;
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
    case "java":
      return executeJavaInBrowser(request);
    case "cpp":
      return executeCppInBrowser(request);
    default:
      throw new Error(`${request.language} is not supported in the browser yet.`);
  }
}

export const BROWSER_LANGUAGES: LanguageInfo[] = [
  { id: "python", name: "Python", enabled: true },
  { id: "javascript", name: "JavaScript", enabled: true },
  { id: "java", name: "Java", enabled: true },
  { id: "cpp", name: "C++", enabled: true },
];

export function languageNeedsRuntimeLoad(language: Language): boolean {
  return language === "python" || language === "cpp";
}

export function isLanguageReady(
  language: Language,
  runtimeStatuses: Record<"python" | "cpp", RuntimeLoadStatus>
): boolean {
  if (language === "javascript" || language === "java") return true;
  if (language === "python") return runtimeStatuses.python === "ready";
  if (language === "cpp") return runtimeStatuses.cpp === "ready";
  return false;
}

export function getRuntimeStatus(
  language: Language,
  runtimeStatuses: Record<"python" | "cpp", RuntimeLoadStatus>
): RuntimeLoadStatus | "unsupported" {
  if (!isRuntimeLanguage(language)) return "unsupported";
  if (language === "javascript" || language === "java") return "ready";
  if (language === "python") return runtimeStatuses.python;
  return runtimeStatuses.cpp;
}
