import { describe, expect, it } from "vitest";
import type { TraceStep } from "@/types";
import {
  getActiveArrayIndex,
  getVisualizableVariables,
  shouldShowRecursionTree,
} from "./visualization";

function makeStep(partial: Partial<TraceStep>): TraceStep {
  return {
    step: 0,
    line: 1,
    event: "line",
    locals: {},
    globals: {},
    stack: [],
    stdout: "",
    stderr: "",
    ...partial,
  };
}

describe("getVisualizableVariables", () => {
  it("detects arrays and dicts", () => {
    const step = makeStep({
      locals: {
        nums: [2, 7, 11, 15],
        seen: { 2: 0 },
        two_sum: "<function two_sum at 0x1>",
      },
    });

    const items = getVisualizableVariables(step);
    expect(items.map((i) => i.name).sort()).toEqual(["nums", "seen"]);
    expect(items.find((i) => i.name === "nums")?.type).toBe("array");
    expect(items.find((i) => i.name === "seen")?.type).toBe("dict");
  });

  it("detects queue and stack by name", () => {
    const step = makeStep({
      locals: {
        my_queue: [1, 2, 3],
        call_stack: [4, 5],
      },
    });

    const items = getVisualizableVariables(step);
    expect(items.find((i) => i.name === "my_queue")?.type).toBe("queue");
    expect(items.find((i) => i.name === "call_stack")?.type).toBe("stack");
  });
});

describe("shouldShowRecursionTree", () => {
  it("returns true when the same function appears multiple times", () => {
    const step = makeStep({
      stack: [
        { function: "fib", line: 3, filename: "<user_code>" },
        { function: "fib", line: 3, filename: "<user_code>" },
        { function: "<module>", line: 1, filename: "<user_code>" },
      ],
    });

    expect(shouldShowRecursionTree(step)).toBe(true);
  });

  it("returns false for non-recursive calls", () => {
    const step = makeStep({
      stack: [
        { function: "two_sum", line: 3, filename: "<user_code>" },
        { function: "<module>", line: 1, filename: "<user_code>" },
      ],
    });

    expect(shouldShowRecursionTree(step)).toBe(false);
  });
});

describe("getActiveArrayIndex", () => {
  it("returns loop index from locals", () => {
    const step = makeStep({ locals: { i: 2, num: 11 } });
    expect(getActiveArrayIndex(step)).toBe(2);
  });
});
