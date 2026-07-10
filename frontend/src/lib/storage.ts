import type { AppSettings, ExecutionMode, Language, Session } from "@/types";

const STORAGE_KEYS = {
  source: (lang: Language, mode: ExecutionMode) =>
    `visualtrace:source:${lang}:${mode}`,
  legacySource: (lang: Language) => `visualtrace:source:${lang}`,
  functionName: "visualtrace:functionName",
  functionArgs: "visualtrace:functionArgs",
  sessions: "visualtrace:sessions",
  settings: "visualtrace:settings",
  playback: (sessionId: string) => `visualtrace:playback:${sessionId}`,
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  fontSize: 14,
  autoSave: true,
  executionMode: "script",
};

const DEFAULT_PYTHON_SCRIPT_SOURCE = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

result = two_sum([2, 7, 11, 15], 9)
print(result)
`;

const DEFAULT_PYTHON_FUNCTION_SOURCE = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
`;

export const DEFAULT_FUNCTION_NAME = "two_sum";
export const DEFAULT_FUNCTION_ARGS = "[[2, 7, 11, 15], 9]";

export function getDefaultSource(
  language: Language,
  mode: ExecutionMode = "script"
): string {
  switch (language) {
    case "python":
      return mode === "function"
        ? DEFAULT_PYTHON_FUNCTION_SOURCE
        : DEFAULT_PYTHON_SCRIPT_SOURCE;
    default:
      return "# Language not yet supported\n";
  }
}

export function loadSource(
  language: Language,
  mode: ExecutionMode = "script"
): string {
  if (typeof window === "undefined") return getDefaultSource(language, mode);

  const key = STORAGE_KEYS.source(language, mode);
  const stored = localStorage.getItem(key);
  if (stored) return stored;

  // Migrate legacy single-key storage into script mode.
  if (mode === "script") {
    const legacy = localStorage.getItem(STORAGE_KEYS.legacySource(language));
    if (legacy) {
      localStorage.setItem(key, legacy);
      return legacy;
    }
  }

  return getDefaultSource(language, mode);
}

export function saveSource(
  language: Language,
  source: string,
  mode: ExecutionMode = "script"
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.source(language, mode), source);
}

export function loadFunctionName(): string {
  if (typeof window === "undefined") return DEFAULT_FUNCTION_NAME;
  return localStorage.getItem(STORAGE_KEYS.functionName) || DEFAULT_FUNCTION_NAME;
}

export function saveFunctionName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.functionName, name);
}

export function loadFunctionArgs(): string {
  if (typeof window === "undefined") return DEFAULT_FUNCTION_ARGS;
  return localStorage.getItem(STORAGE_KEYS.functionArgs) || DEFAULT_FUNCTION_ARGS;
}

export function saveFunctionArgs(args: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.functionArgs, args);
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sessions);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions.slice(0, 20)));
}

export function savePlaybackPosition(sessionId: string, position: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.playback(sessionId), String(position));
}

export function loadPlaybackPosition(sessionId: string): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(STORAGE_KEYS.playback(sessionId));
  return raw ? parseInt(raw, 10) : 0;
}
