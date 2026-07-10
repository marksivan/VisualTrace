import type { AppSettings, ExecutionMode, Language, Session } from "@/types";

const STORAGE_KEYS = {
  source: (lang: Language, mode: ExecutionMode) =>
    `visualtrace:source:${lang}:${mode}`,
  legacySource: (lang: Language) => `visualtrace:source:${lang}`,
  functionName: (lang: Language) => `visualtrace:functionName:${lang}`,
  functionArgs: (lang: Language) => `visualtrace:functionArgs:${lang}`,
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

const DEFAULT_JAVASCRIPT_SCRIPT_SOURCE = `function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];
    const complement = target - num;
    if (complement in seen) {
      return [seen[complement], i];
    }
    seen[num] = i;
  }
  return [];
}

const result = twoSum([2, 7, 11, 15], 9);
console.log(result);
`;

const DEFAULT_JAVASCRIPT_FUNCTION_SOURCE = `function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];
    const complement = target - num;
    if (complement in seen) {
      return [seen[complement], i];
    }
    seen[num] = i;
  }
  return [];
}
`;

const DEFAULT_JAVA_SCRIPT_SOURCE = `import java.util.*;

class Solution {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[] {};
    }

    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int[] result = twoSum(nums, 9);
        System.out.println(Arrays.toString(result));
    }
}
`;

const DEFAULT_JAVA_FUNCTION_SOURCE = `import java.util.*;

class Solution {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[] {};
    }
}
`;

const DEFAULT_CPP_SCRIPT_SOURCE = `#include <iostream>
using namespace std;

int main() {
    int nums[] = {2, 7, 11, 15};
    int target = 9;
    for (int i = 0; i < 4; i++) {
        for (int j = i + 1; j < 4; j++) {
            if (nums[i] + nums[j] == target) {
                cout << "[" << i << ", " << j << "]" << endl;
                return 0;
            }
        }
    }
    return 0;
}
`;

const DEFAULT_CPP_FUNCTION_SOURCE = `#include <iostream>
using namespace std;

void twoSum() {
    int nums[] = {2, 7, 11, 15};
    int target = 9;
    for (int i = 0; i < 4; i++) {
        for (int j = i + 1; j < 4; j++) {
            if (nums[i] + nums[j] == target) {
                cout << "[" << i << ", " << j << "]" << endl;
                return;
            }
        }
    }
}
`;

export function getDefaultFunctionName(language: Language): string {
  switch (language) {
    case "javascript":
      return "twoSum";
    case "java":
      return "twoSum";
    case "cpp":
      return "twoSum";
    default:
      return "two_sum";
  }
}

export const DEFAULT_FUNCTION_ARGS = "[[2, 7, 11, 15], 9]";

export const EMPTY_FUNCTION_ARGS = "[]";

export function getEmptySource(
  _language: Language,
  _mode: ExecutionMode = "script"
): string {
  return "";
}

export function getDefaultSource(
  language: Language,
  mode: ExecutionMode = "script"
): string {
  switch (language) {
    case "python":
      return mode === "function"
        ? DEFAULT_PYTHON_FUNCTION_SOURCE
        : DEFAULT_PYTHON_SCRIPT_SOURCE;
    case "javascript":
      return mode === "function"
        ? DEFAULT_JAVASCRIPT_FUNCTION_SOURCE
        : DEFAULT_JAVASCRIPT_SCRIPT_SOURCE;
    case "java":
      return mode === "function"
        ? DEFAULT_JAVA_FUNCTION_SOURCE
        : DEFAULT_JAVA_SCRIPT_SOURCE;
    case "cpp":
      return mode === "function"
        ? DEFAULT_CPP_FUNCTION_SOURCE
        : DEFAULT_CPP_SCRIPT_SOURCE;
    default:
      return `// ${language} is not supported in the browser yet.\n`;
  }
}

function normalizeStoredSource(source: string): string {
  return source.replace(/\r\n/g, "\n").trimEnd();
}

export function isLegacyDefaultSource(
  source: string,
  language: Language,
  mode: ExecutionMode = "script"
): boolean {
  return (
    normalizeStoredSource(source) ===
    normalizeStoredSource(getDefaultSource(language, mode))
  );
}

function clearLegacyDefaultSource(
  language: Language,
  mode: ExecutionMode
): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.source(language, mode));
  if (mode === "script") {
    localStorage.removeItem(STORAGE_KEYS.legacySource(language));
  }
}

export function loadSource(
  language: Language,
  mode: ExecutionMode = "script"
): string {
  if (typeof window === "undefined") return getEmptySource(language, mode);

  const key = STORAGE_KEYS.source(language, mode);
  const stored = localStorage.getItem(key);
  if (stored) {
    if (isLegacyDefaultSource(stored, language, mode)) {
      clearLegacyDefaultSource(language, mode);
      return getEmptySource(language, mode);
    }
    return stored;
  }

  // Migrate legacy single-key storage into script mode.
  if (mode === "script") {
    const legacy = localStorage.getItem(STORAGE_KEYS.legacySource(language));
    if (legacy) {
      if (isLegacyDefaultSource(legacy, language, mode)) {
        localStorage.removeItem(STORAGE_KEYS.legacySource(language));
        return getEmptySource(language, mode);
      }
      localStorage.setItem(key, legacy);
      return legacy;
    }
  }

  return getEmptySource(language, mode);
}

export function saveSource(
  language: Language,
  source: string,
  mode: ExecutionMode = "script"
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.source(language, mode), source);
}

export function loadFunctionName(language: Language): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(STORAGE_KEYS.functionName(language));
  if (stored === null) return "";
  if (stored === getDefaultFunctionName(language)) {
    localStorage.removeItem(STORAGE_KEYS.functionName(language));
    return "";
  }
  return stored;
}

export function saveFunctionName(language: Language, name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.functionName(language), name);
}

export function loadFunctionArgs(language: Language): string {
  if (typeof window === "undefined") return EMPTY_FUNCTION_ARGS;
  const stored = localStorage.getItem(STORAGE_KEYS.functionArgs(language));
  if (stored === null) return EMPTY_FUNCTION_ARGS;
  if (stored === DEFAULT_FUNCTION_ARGS) {
    localStorage.removeItem(STORAGE_KEYS.functionArgs(language));
    return EMPTY_FUNCTION_ARGS;
  }
  return stored;
}

export function saveFunctionArgs(language: Language, args: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.functionArgs(language), args);
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
