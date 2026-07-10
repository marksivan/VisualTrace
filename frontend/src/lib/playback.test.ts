import { describe, expect, it } from "vitest";
import {
  getPreferredStepAfterRun,
  shouldResetPlaybackOnSourceChange,
} from "./playback";
import type { TraceStep } from "@/types";

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

describe("shouldResetPlaybackOnSourceChange", () => {
  it("returns true when source changes after a traced run", () => {
    expect(
      shouldResetPlaybackOnSourceChange("new code", "old code", true)
    ).toBe(true);
  });

  it("returns false when source is unchanged", () => {
    expect(
      shouldResetPlaybackOnSourceChange("same code", "same code", true)
    ).toBe(false);
  });

  it("returns false when there is no trace yet", () => {
    expect(
      shouldResetPlaybackOnSourceChange("new code", "old code", false)
    ).toBe(false);
  });
});

describe("getPreferredStepAfterRun", () => {
  it("prefers the last visualizable step", () => {
    const trace = [
      makeStep({ step: 0, locals: {} }),
      makeStep({ step: 1, locals: { nums: [1, 2, 3] } }),
      makeStep({ step: 2, locals: { x: 1 } }),
    ];
    expect(getPreferredStepAfterRun(trace)).toBe(1);
  });
});
