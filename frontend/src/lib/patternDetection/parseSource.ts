import * as acorn from "acorn";
import * as walk from "acorn-walk";
import type { Language } from "@/types";
import type { ParsedSource } from "./Pattern";

const IDENTIFIER_RE = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
const IMPORT_RE = /^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm;
const FROM_IMPORT_RE = /from\s+([\w.]+)\s+import/g;
const DEF_RE = /\bdef\s+([A-Za-z_][A-Za-z0-9_]*)/g;
const FUNC_RE = /\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)/g;
const CALL_RE = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
const MEMBER_RE = /\.([A-Za-z_][A-Za-z0-9_]*)/g;

function addMatches(target: Set<string>, text: string, regex: RegExp, group = 1): void {
  regex.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const value = match[group];
    if (value) target.add(value);
  }
}

function parseTextualSource(source: string, language: Language): Omit<ParsedSource, "ast"> {
  const identifiers = new Set<string>();
  const imports = new Set<string>();
  const callNames = new Set<string>();
  const functionNames = new Set<string>();
  const memberAccess = new Set<string>();

  addMatches(identifiers, source, IDENTIFIER_RE);
  addMatches(imports, source, IMPORT_RE, 1);
  addMatches(imports, source, IMPORT_RE, 2);
  addMatches(imports, source, FROM_IMPORT_RE);
  addMatches(functionNames, source, DEF_RE);
  addMatches(functionNames, source, FUNC_RE);
  addMatches(callNames, source, CALL_RE);
  addMatches(memberAccess, source, MEMBER_RE);

  if (language === "python") {
    if (/\bcollections\.deque\b/.test(source) || /\bfrom collections import .*deque/.test(source)) {
      imports.add("collections.deque");
      callNames.add("deque");
    }
    if (/\bimport heapq\b/.test(source) || /\bfrom heapq import\b/.test(source)) {
      imports.add("heapq");
      callNames.add("heapq");
    }
    if (/\b\.popleft\s*\(/.test(source)) memberAccess.add("popleft");
    if (/\b\.append\s*\(/.test(source)) memberAccess.add("append");
    if (/\b\.pop\s*\(/.test(source)) memberAccess.add("pop");
    if (/\b\.next\b/.test(source)) memberAccess.add("next");
  }

  if (language === "java") {
    if (/\bQueue\b/.test(source)) imports.add("Queue");
    if (/\bStack\b/.test(source)) imports.add("Stack");
    if (/\bHashMap\b/.test(source)) imports.add("HashMap");
    if (/\bPriorityQueue\b/.test(source)) imports.add("PriorityQueue");
  }

  if (language === "cpp") {
    if (/#include\s*<queue>/.test(source)) imports.add("queue");
    if (/#include\s*<stack>/.test(source)) imports.add("stack");
    if (/\bstd::queue\b/.test(source)) callNames.add("queue");
    if (/\bstd::stack\b/.test(source)) callNames.add("stack");
    if (/\bstd::priority_queue\b/.test(source)) callNames.add("priority_queue");
  }

  return {
    language,
    source,
    normalized: source.toLowerCase(),
    lines: source.split(/\r?\n/),
    identifiers,
    imports,
    callNames,
    functionNames,
    memberAccess,
  };
}

function parseJavaScriptAst(source: string, base: Omit<ParsedSource, "ast">): unknown | null {
  try {
    const ast = acorn.parse(source, {
      ecmaVersion: "latest",
      sourceType: "script",
      locations: false,
    });

    walk.simple(ast, {
      Identifier(node) {
        base.identifiers.add(node.name);
      },
      FunctionDeclaration(node) {
        if (node.id) base.functionNames.add(node.id.name);
      },
      FunctionExpression(node) {
        if (node.id) base.functionNames.add(node.id.name);
      },
      CallExpression(node) {
        if (node.callee.type === "Identifier") {
          base.callNames.add(node.callee.name);
        }
        if (
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.property.type === "Identifier"
        ) {
          base.memberAccess.add(node.callee.property.name);
        }
      },
      MemberExpression(node) {
        if (!node.computed && node.property.type === "Identifier") {
          base.memberAccess.add(node.property.name);
        }
      },
    });

    return ast;
  } catch {
    return null;
  }
}

export function parseSource(source: string, language: Language): ParsedSource {
  const base = parseTextualSource(source, language);
  const ast = language === "javascript" ? parseJavaScriptAst(source, base) : null;
  return { ...base, ast };
}
