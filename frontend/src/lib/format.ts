/**
 * Format a value for display in the inspector.
 * Simple values stay compact; complex structures are pretty-printed.
 */
export function formatValueForDisplay(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  try {
    const compact = JSON.stringify(value);
    if (compact && compact.length <= 80) return compact;
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function isMultilineDisplay(text: string): boolean {
  return text.includes("\n");
}
