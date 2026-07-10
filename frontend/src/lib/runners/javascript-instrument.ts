import * as acorn from "acorn";
import type { Node } from "acorn";

export interface InstrumentResult {
  code: string;
  error: string | null;
}

interface Insertion {
  pos: number;
  text: string;
}

type ParentType = string | undefined;

export function instrumentJavaScript(source: string): InstrumentResult {
  let ast: Node;

  try {
    ast = acorn.parse(source, {
      ecmaVersion: "latest",
      sourceType: "script",
      locations: true,
    });
  } catch (error) {
    return {
      code: source,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const insertions: Insertion[] = [];

  const insertAt = (pos: number, text: string) => {
    insertions.push({ pos, text });
  };

  const lineOf = (node: Node & { loc?: acorn.SourceLocation | null }) =>
    node.loc?.start.line ?? 1;

  const captureIdentifier = (name: string) =>
    `__vt_var(${JSON.stringify(name)},${name});`;

  const walkChildren = (
    node: Node,
    inFunction: boolean,
    parentType: ParentType,
    keys: string[]
  ) => {
    for (const key of keys) {
      const child = (node as unknown as Record<string, unknown>)[key];
      if (!child) continue;
      if (Array.isArray(child)) {
        child.forEach((item) => {
          if (item && typeof item === "object" && "type" in item) {
            walk(item as Node, inFunction, node.type);
          }
        });
      } else if (typeof child === "object" && child && "type" in child) {
        walk(child as Node, inFunction, node.type);
      }
    }
  };

  const walk = (node: Node, inFunction = false, parentType?: ParentType) => {
    switch (node.type) {
      case "Program": {
        const program = node as acorn.Program;
        for (const child of program.body) {
          walk(child, false, "Program");
        }
        break;
      }

      case "BlockStatement": {
        const block = node as acorn.BlockStatement;
        for (const child of block.body) {
          walk(child, inFunction, "BlockStatement");
        }
        break;
      }

      case "FunctionDeclaration": {
        const fn = node as acorn.FunctionDeclaration;
        const name = fn.id?.name ?? "anonymous";
        if (fn.body) {
          const paramCaptures = fn.params
            .map((param) => {
              if (param.type === "Identifier") {
                return captureIdentifier(param.name);
              }
              return "";
            })
            .filter(Boolean)
            .join("");

          insertAt(
            fn.body.start + 1,
            `__vt_call(${JSON.stringify(name)},${lineOf(fn)});${paramCaptures}`
          );

          for (const child of fn.body.body) {
            walk(child, true, "FunctionDeclaration");
          }
        }
        break;
      }

      case "ForStatement": {
        const forNode = node as acorn.ForStatement;
        insertAt(forNode.start, `__vt_line(${lineOf(forNode)},'line');`);
        if (forNode.init) {
          walk(forNode.init, inFunction, "ForStatement");
        }
        if (forNode.test) {
          walk(forNode.test, inFunction, "ForStatement");
        }
        if (forNode.update) {
          walk(forNode.update, inFunction, "ForStatement");
        }
        if (
          forNode.init?.type === "VariableDeclaration" &&
          forNode.body?.type === "BlockStatement"
        ) {
          const initDecl = forNode.init as acorn.VariableDeclaration;
          const captures = initDecl.declarations
            .filter((declarator) => declarator.id.type === "Identifier")
            .map((declarator) =>
              captureIdentifier((declarator.id as acorn.Identifier).name)
            )
            .join("");
          if (captures) {
            insertAt(forNode.body.start + 1, captures);
          }
        }
        if (forNode.body) {
          walk(forNode.body, inFunction, "ForStatement");
        }
        break;
      }

      case "ForInStatement":
      case "ForOfStatement":
        insertAt(node.start, `__vt_line(${lineOf(node)},'line');`);
        walkChildren(node, inFunction, parentType, ["left", "right", "body"]);
        break;

      case "WhileStatement":
      case "DoWhileStatement":
      case "IfStatement":
      case "SwitchStatement":
      case "TryStatement":
      case "WithStatement":
        insertAt(node.start, `__vt_line(${lineOf(node)},'line');`);
        walkChildren(node, inFunction, parentType, [
          "test",
          "consequent",
          "alternate",
          "body",
          "block",
          "handler",
          "finalizer",
          "discriminant",
          "cases",
          "object",
        ]);
        break;

      case "ReturnStatement": {
        const ret = node as acorn.ReturnStatement;
        insertAt(ret.start, `__vt_return(${lineOf(ret)});`);
        if (ret.argument) walk(ret.argument, inFunction, "ReturnStatement");
        break;
      }

      case "VariableDeclaration": {
        const decl = node as acorn.VariableDeclaration;
        const inForHeader =
          parentType === "ForStatement" ||
          parentType === "ForInStatement" ||
          parentType === "ForOfStatement";

        if (!inForHeader) {
          insertAt(decl.start, `__vt_line(${lineOf(decl)},'line');`);
        }

        for (const declarator of decl.declarations) {
          if (declarator.init) {
            walk(declarator.init, inFunction, "VariableDeclaration");
          }
        }

        if (!inForHeader) {
          const captures = decl.declarations
            .filter(
              (declarator) =>
                declarator.id.type === "Identifier" && declarator.init !== null
            )
            .map((declarator) =>
              captureIdentifier((declarator.id as acorn.Identifier).name)
            )
            .join("");

          if (captures) {
            insertAt(decl.end, captures);
          }
        }
        break;
      }

      case "ExpressionStatement": {
        const expr = node as acorn.ExpressionStatement;
        insertAt(expr.start, `__vt_line(${lineOf(expr)},'line');`);
        walk(expr.expression, inFunction, "ExpressionStatement");

        if (expr.expression.type === "AssignmentExpression") {
          const assign = expr.expression as acorn.AssignmentExpression;
          if (assign.left.type === "Identifier") {
            insertAt(expr.end, captureIdentifier(assign.left.name));
          }
        } else if (expr.expression.type === "UpdateExpression") {
          const update = expr.expression as acorn.UpdateExpression;
          if (update.argument.type === "Identifier") {
            insertAt(expr.end, captureIdentifier(update.argument.name));
          }
        }
        break;
      }

      default:
        break;
    }
  };

  walk(ast, false);

  insertions.sort((a, b) => b.pos - a.pos);
  let code = source;
  for (const insertion of insertions) {
    code = code.slice(0, insertion.pos) + insertion.text + code.slice(insertion.pos);
  }

  return { code, error: null };
}
