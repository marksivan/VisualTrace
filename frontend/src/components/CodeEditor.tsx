"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { editor as MonacoEditor } from "monaco-editor";
import type { Language } from "@/types";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeEditorProps {
  language: Language;
  value: string;
  onChange: (value: string) => void;
  currentLine?: number;
  fontSize?: number;
  theme?: "light" | "dark";
  readOnly?: boolean;
}

const MONACO_LANG_MAP: Record<Language, string> = {
  python: "python",
  javascript: "javascript",
  java: "java",
  cpp: "cpp",
};

export default function CodeEditor({
  language,
  value,
  onChange,
  currentLine,
  fontSize = 14,
  theme = "dark",
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const decorationsRef = useRef<MonacoEditor.IEditorDecorationsCollection | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    decorationsRef.current?.clear();

    if (currentLine && currentLine > 0) {
      editor.revealLineInCenter(currentLine);
      decorationsRef.current = editor.createDecorationsCollection([
        {
          range: new monaco.Range(currentLine, 1, currentLine, 1),
          options: {
            isWholeLine: true,
            className: "current-execution-line",
          },
        },
      ]);
    }
  }, [currentLine]);

  return (
    <Monaco
      height="100%"
      language={MONACO_LANG_MAP[language]}
      value={value}
      onChange={(v) => onChange(v || "")}
      theme={theme === "dark" ? "vs-dark" : "light"}
      options={{
        fontSize,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        readOnly,
        lineNumbers: "on",
        renderLineHighlight: "all",
        automaticLayout: true,
        padding: { top: 12 },
      }}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
      }}
    />
  );
}
