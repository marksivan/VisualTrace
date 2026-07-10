import type { AppSettings, Language, Session } from "@/types";

const STORAGE_KEYS = {
  source: (lang: Language) => `visualtrace:source:${lang}`,
  sessions: "visualtrace:sessions",
  settings: "visualtrace:settings",
  playback: (sessionId: string) => `visualtrace:playback:${sessionId}`,
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  fontSize: 14,
  autoSave: true,
};

const DEFAULT_PYTHON_SOURCE = `def two_sum(nums, target):
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

export function getDefaultSource(language: Language): string {
  switch (language) {
    case "python":
      return DEFAULT_PYTHON_SOURCE;
    default:
      return "# Language not yet supported\n";
  }
}

export function loadSource(language: Language): string {
  if (typeof window === "undefined") return getDefaultSource(language);
  return localStorage.getItem(STORAGE_KEYS.source(language)) || getDefaultSource(language);
}

export function saveSource(language: Language, source: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.source(language), source);
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
