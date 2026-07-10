"use client";

import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface TestInputProps {
  stdin: string;
  onStdinChange: (value: string) => void;
  theme?: Theme;
}

export default function TestInput({
  stdin,
  onStdinChange,
  theme = "dark",
}: TestInputProps) {
  const t = getThemeClasses(theme);

  return (
    <div className="flex flex-col gap-3 p-3">
      <p className={`text-[11px] ${t.labelMuted}`}>
        Write the full script in the editor, including function calls and print
        statements.
      </p>

      <div>
        <label className={`mb-1 block text-xs font-medium ${t.subtext}`}>
          Standard Input
        </label>
        <textarea
          value={stdin}
          onChange={(e) => onStdinChange(e.target.value)}
          placeholder="Program input (stdin)..."
          rows={2}
          className={`w-full resize-none ${t.input}`}
        />
      </div>
    </div>
  );
}
