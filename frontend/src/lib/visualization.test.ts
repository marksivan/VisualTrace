import { describe, expect, it } from "vitest";
import type { TraceStep } from "@/types";
import { getPreferredStepAfterRun } from "./playback";
import {
  getActiveArrayIndex,
  getFirstVisualizableStep,
  getVisualizableVariables,
  isAdjacencyList,
  isLinkedListNode,
  isTreeNode,
  linkedListToArray,
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

describe("getPreferredStepAfterRun", () => {
  it("jumps to the last step with inspectable variables", () => {
    const trace = [
      makeStep({ step: 0, locals: {} }),
      makeStep({ step: 1, locals: { a: 10 } }),
      makeStep({ step: 2, locals: { a: 10, b: 3 } }),
    ];

    expect(getPreferredStepAfterRun(trace)).toBe(2);
  });

  it("falls back to the final step when no locals exist", () => {
    const trace = [makeStep({ step: 0 }), makeStep({ step: 1 })];
    expect(getPreferredStepAfterRun(trace)).toBe(1);
  });
});

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

  it("detects linked lists, trees, and graphs", () => {
    const step = makeStep({
      locals: {
        head: { val: 1, next: { val: 2, next: null } },
        root: { val: 3, left: { val: 1 }, right: null },
        graph: { A: ["B", "C"], B: ["A"], C: ["A"] },
      },
    });

    const items = getVisualizableVariables(step);
    expect(items.find((i) => i.name === "head")?.type).toBe("linked_list");
    expect(items.find((i) => i.name === "root")?.type).toBe("tree");
    expect(items.find((i) => i.name === "graph")?.type).toBe("graph");
  });
});

describe("structure helpers", () => {
  it("identifies linked list nodes", () => {
    expect(isLinkedListNode({ val: 1, next: { val: 2 } })).toBe(true);
    expect(isLinkedListNode({ left: 1, right: 2 })).toBe(false);
  });

  it("identifies tree nodes", () => {
    expect(isTreeNode({ val: 1, left: null, right: null })).toBe(true);
    expect(isTreeNode({ val: 1, next: null })).toBe(false);
  });

  it("identifies adjacency lists", () => {
    expect(isAdjacencyList({ A: ["B"], B: ["A"] })).toBe(true);
    expect(isAdjacencyList({ A: 1 })).toBe(false);
  });

  it("flattens linked lists for display", () => {
    expect(
      linkedListToArray({ val: 1, next: { val: 2, next: { val: 3, next: null } } })
    ).toEqual([1, 2, 3]);
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

describe("getFirstVisualizableStep", () => {
  it("returns the first step with visualizable variables", () => {
    const trace = [
      makeStep({ locals: { x: 1 } }),
      makeStep({ locals: { nums: [1, 2, 3] } }),
      makeStep({ locals: { nums: [1, 2, 3], i: 1 } }),
    ];

    expect(getFirstVisualizableStep(trace)).toBe(1);
  });
});

describe("getActiveArrayIndex", () => {
  it("returns loop index from locals", () => {
    const step = makeStep({ locals: { i: 2, num: 11 } });
    expect(getActiveArrayIndex(step)).toBe(2);
  });
});
