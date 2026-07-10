"use client";

import type { Theme } from "@/lib/theme";
import { getThemeClasses } from "@/lib/theme";
import type { TreeNode } from "@/lib/visualization";
import { treeNodeLabel } from "@/lib/visualization";

interface TreeVizProps {
  name: string;
  root: TreeNode | null | undefined;
  theme?: Theme;
}

export default function TreeViz({ name, root, theme = "dark" }: TreeVizProps) {
  const t = getThemeClasses(theme);

  return (
    <div className={`p-3 ${t.card}`}>
      <div className="mb-2 font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
        {name} <span className={t.labelMuted}>tree</span>
      </div>
      {!root || typeof root !== "object" ? (
        <span className={`text-xs ${t.subtext}`}>empty</span>
      ) : (
        <TreeNodeView node={root} theme={theme} />
      )}
    </div>
  );
}

function TreeNodeView({ node, theme }: { node: TreeNode; theme: Theme }) {
  const t = getThemeClasses(theme);
  const isDark = theme === "dark";
  const children = getChildNodes(node);

  return (
    <div className="flex flex-col items-center">
      <div
        className={`rounded-md border px-3 py-1.5 font-mono text-sm ${
          isDark
            ? "border-emerald-700/50 bg-emerald-900/30 text-emerald-200"
            : "border-emerald-300 bg-emerald-50 text-emerald-800"
        }`}
      >
        {treeNodeLabel(node)}
      </div>
      {children.length > 0 && (
        <div className="mt-2 flex items-start gap-4">
          {children.map((child, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className={`mb-1 font-mono text-[10px] ${t.labelMuted}`}>
                {child.label}
              </span>
              {child.node ? (
                <TreeNodeView node={child.node} theme={theme} />
              ) : (
                <span className={`text-xs ${t.subtext}`}>null</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getChildNodes(
  node: TreeNode
): Array<{ label: string; node: TreeNode | null | undefined }> {
  if (Array.isArray(node.children) && node.children.length > 0) {
    return node.children.map((child, i) => ({
      label: `child ${i}`,
      node: child,
    }));
  }

  return [
    { label: "left", node: node.left },
    { label: "right", node: node.right },
  ];
}
