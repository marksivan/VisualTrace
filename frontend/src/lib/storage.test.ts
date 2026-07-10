import { describe, expect, it } from "vitest";
import {
  getDefaultSource,
  getEmptySource,
  getDefaultFunctionName,
  DEFAULT_FUNCTION_ARGS,
  EMPTY_FUNCTION_ARGS,
} from "./storage";

describe("storage defaults", () => {
  it("returns empty source for initial editor state", () => {
    expect(getEmptySource("python", "script")).toBe("");
    expect(getEmptySource("javascript", "function")).toBe("");
  });

  it("returns two sum example as optional template defaults", () => {
    expect(getDefaultSource("python", "script")).toContain("two_sum");
    expect(getDefaultSource("javascript", "function")).toContain("twoSum");
    expect(getDefaultFunctionName("javascript")).toBe("twoSum");
    expect(DEFAULT_FUNCTION_ARGS).toContain("2, 7, 11, 15");
  });

  it("uses empty function args for initial state", () => {
    expect(EMPTY_FUNCTION_ARGS).toBe("[]");
  });
});
