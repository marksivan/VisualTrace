import type { Language } from "@/types";

const MAX_DEPTH = 3;
const MAX_ITEMS = 50;

/** Depth-capped JSON-friendly serialization (mirrors the Python harness). */
export function serializeValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return formatUnknown(value);
  }

  if (value === null || value === undefined) return value;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NaN";
    if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
    return value;
  }
  if (typeof value === "string") return value;
  if (typeof value === "function") return formatUnknown(value);
  if (typeof value === "symbol" || typeof value === "bigint") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ITEMS)
      .map((item) => serializeValue(item, depth + 1));
  }

  if (value instanceof Set) {
    return Array.from(value)
      .slice(0, MAX_ITEMS)
      .map((item) => serializeValue(item, depth + 1));
  }

  if (value instanceof Map) {
    const out: Record<string, unknown> = {};
    let count = 0;
    for (const [key, entry] of value.entries()) {
      if (count >= MAX_ITEMS) break;
      out[String(key)] = serializeValue(entry, depth + 1);
      count++;
    }
    return out;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nodeAttrs = [
      "val",
      "value",
      "key",
      "left",
      "right",
      "next",
      "neighbors",
      "children",
    ] as const;
    const attrs: Record<string, unknown> = {};
    for (const attr of nodeAttrs) {
      if (attr in record) {
        attrs[attr] = serializeValue(record[attr], depth + 1);
      }
    }
    if (Object.keys(attrs).length > 0) {
      return attrs;
    }

    const out: Record<string, unknown> = {};
    let count = 0;
    for (const [key, entry] of Object.entries(record)) {
      if (count >= MAX_ITEMS) break;
      if (typeof entry === "function") continue;
      out[key] = serializeValue(entry, depth + 1);
      count++;
    }
    return out;
  }

  return formatUnknown(value);
}

function formatUnknown(value: unknown): string {
  try {
    return Object.prototype.toString.call(value);
  } catch {
    return String(value);
  }
}

export function buildJavaScriptExecutionSource(
  source: string,
  functionName?: string,
  functionArgs?: unknown[]
): string {
  if (!functionName) return source;

  const argsJson = JSON.stringify(functionArgs ?? []);
  return `${source}

const _vt_args = ${argsJson};
const _vt_result = Array.isArray(_vt_args)
  ? ${functionName}(..._vt_args)
  : ${functionName}(_vt_args);
let result = _vt_result;
`;
}

export function formatJavaScriptError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  return String(error);
}

export function getLanguageDisplayName(language: Language): string {
  switch (language) {
    case "python":
      return "Python";
    case "javascript":
      return "JavaScript";
    case "java":
      return "Java";
    case "cpp":
      return "C++";
    default:
      return language;
  }
}

export function isRuntimeLanguage(language: Language): boolean {
  return (
    language === "python" ||
    language === "javascript" ||
    language === "java" ||
    language === "cpp"
  );
}
