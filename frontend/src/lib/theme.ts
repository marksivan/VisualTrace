import type { AppSettings } from "@/types";

export type Theme = AppSettings["theme"];

export function getThemeClasses(theme: Theme) {
  const isDark = theme === "dark";

  return {
    app: isDark ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900",
    header: isDark ? "border-zinc-800" : "border-zinc-200",
    panel: isDark ? "border-zinc-800" : "border-zinc-200",
    label: isDark ? "text-zinc-500" : "text-zinc-500",
    labelMuted: isDark ? "text-zinc-600" : "text-zinc-400",
    subtext: isDark ? "text-zinc-500" : "text-zinc-600",
    input:
      "rounded-md border px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none " +
      (isDark
        ? "border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
        : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400"),
    select:
      "rounded-md border px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none " +
      (isDark
        ? "border-zinc-700 bg-zinc-800 text-zinc-100"
        : "border-zinc-300 bg-white text-zinc-900"),
    card: isDark
      ? "rounded-md border border-zinc-800 bg-zinc-900/50"
      : "rounded-md border border-zinc-200 bg-white shadow-sm",
    cardText: isDark ? "text-zinc-200" : "text-zinc-800",
    cardPre: isDark ? "text-zinc-300" : "text-zinc-700",
    resultCard: isDark
      ? "rounded-md border border-green-800/50 bg-green-900/20"
      : "rounded-md border border-green-300 bg-green-50",
    stackActive: isDark
      ? "border-blue-700/50 bg-blue-900/20 text-blue-300"
      : "border-blue-300 bg-blue-50 text-blue-800",
    stackInactive: isDark
      ? "border-zinc-800 bg-zinc-900/50 text-zinc-400"
      : "border-zinc-200 bg-zinc-50 text-zinc-600",
    consoleBg: isDark ? "bg-zinc-900" : "bg-zinc-100",
    iconBtn: isDark
      ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900",
    tabActive: "border-b-2 border-blue-500 text-blue-500",
    tabInactive: isDark
      ? "text-zinc-500 hover:text-zinc-300"
      : "text-zinc-500 hover:text-zinc-800",
    errorBox: isDark
      ? "border-red-800/50 bg-red-900/20 text-red-300"
      : "border-red-300 bg-red-50 text-red-700",
    toggleBtn: isDark
      ? "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100",
    resetBtn: isDark
      ? "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-200"
      : "border-zinc-300 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-800",
  };
}
