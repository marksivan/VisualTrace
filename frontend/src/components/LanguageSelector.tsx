"use client";

import type { LanguageInfo } from "@/types";

interface LanguageSelectorProps {
  languages: LanguageInfo[];
  selected: string;
  onChange: (languageId: string) => void;
}

export default function LanguageSelector({
  languages,
  selected,
  onChange,
}: LanguageSelectorProps) {
  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
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
