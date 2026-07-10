import { describe, expect, it } from "vitest";
import { getPreferredStepAfterRun } from "@/lib/playback";
import { getVisualizableVariables, hasVisualizableTrace } from "@/lib/visualization";
import { instrumentJavaScript } from "./javascript-instrument";
import { executeJavaScriptInBrowser } from "./javascript-runner";
import { serializeValue } from "./shared";

describe("serializeValue", () => {
  it("serializes nested arrays and objects", () => {
    expect(serializeValue({ a: [1, 2], b: { c: 3 } })).toEqual({
      a: [1, 2],
      b: { c: 3 },
    });
  });

  it("skips functions", () => {
    const value = serializeValue({ fn: () => 1, count: 2 }) as Record<string, unknown>;
    expect(value.count).toBe(2);
    expect(value.fn).toBeUndefined();
  });

  it("serializes non-finite numbers as JSON-safe strings", () => {
    expect(serializeValue(Number.POSITIVE_INFINITY)).toBe("Infinity");
    expect(serializeValue(Number.NEGATIVE_INFINITY)).toBe("-Infinity");
    expect(serializeValue(Number.NaN)).toBe("NaN");
    expect(
      JSON.parse(
        JSON.stringify({
          minimum_length: serializeValue(Number.POSITIVE_INFINITY),
        })
      )
    ).toEqual({ minimum_length: "Infinity" });
  });
});

describe("instrumentJavaScript", () => {
  it("injects trace calls for statements and functions", () => {
    const source = `function add(a, b) {
  return a + b;
}
const result = add(1, 2);`;

    const { code, error } = instrumentJavaScript(source);
    expect(error).toBeNull();
    expect(code).toContain("__vt_call(\"add\"");
    expect(code).toContain("__vt_line(");
    expect(code).toContain("__vt_var(\"result\",result)");
  });

  it("returns parse errors without throwing", () => {
    const { error } = instrumentJavaScript("function oops( {");
    expect(error).toBeTruthy();
  });
});

describe("executeJavaScriptInBrowser", () => {
  it("runs script mode and captures stdout", () => {
    const result = executeJavaScriptInBrowser({
      source: `const result = [1, 2, 3].reduce((sum, n) => sum + n, 0);
console.log(result);`,
      language: "javascript",
      stdin: "",
      trace: true,
    });

    expect(result.error).toBeNull();
    expect(result.stdout.trim()).toBe("6");
    expect(result.result).toBe(6);
    expect(result.trace.length).toBeGreaterThan(0);
  });

  it("keeps visualizable trace data in script mode even with stdout", () => {
    const result = executeJavaScriptInBrowser({
      source: `function walk(text) {
  let left = 0;
  let right = text.length - 1;
  while (left < right) {
    left += 1;
    right -= 1;
  }
}
const result = walk("racecar");
console.log("done");`,
      language: "javascript",
      stdin: "",
      trace: true,
    });

    expect(result.error).toBeNull();
    expect(hasVisualizableTrace(result.trace)).toBe(true);
    expect(
      getVisualizableVariables(result.trace[getPreferredStepAfterRun(result.trace)])
        .some((item) => item.name === "text")
    ).toBe(true);
  });

  it("runs function mode via wrapper", () => {
    const result = executeJavaScriptInBrowser({
      source: `function twoSum(nums, target) {
  const seen = {};
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];
    const complement = target - num;
    if (complement in seen) {
      return [seen[complement], i];
    }
    seen[num] = i;
  }
  return [];
}`,
      language: "javascript",
      stdin: "",
      function_name: "twoSum",
      function_args: [[2, 7, 11, 15], 9],
      trace: true,
    });

    expect(result.error).toBeNull();
    expect(result.result).toEqual([0, 1]);
  });

  it("reports syntax errors", () => {
    const result = executeJavaScriptInBrowser({
      source: "const x = ;",
      language: "javascript",
      stdin: "",
      trace: true,
    });

    expect(result.error).toContain("Syntax error");
  });
});
