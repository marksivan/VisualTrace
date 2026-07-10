"use client";

import type { LanguageInfo } from "@/types";
import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";

interface LanguageSelectorProps {
  languages: LanguageInfo[];
  selected: string;
  onChange: (languageId: string) => void;
  theme?: Theme;
}

export default function LanguageSelector({
  languages,
  selected,
  onChange,
  theme = "dark",
}: LanguageSelectorProps) {
  const t = getThemeClasses(theme);

  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className={`max-w-[8.5rem] text-sm sm:max-w-none ${t.select}`}
      aria-label="Select programming language"
    >
      {languages.map((lang) => (
        <option key={lang.id} value={lang.id} disabled={!lang.enabled}>
          {lang.name}{!lang.enabled ? " (coming soon)" : ""}
        </option>
      ))}
    </select>
  );
}
