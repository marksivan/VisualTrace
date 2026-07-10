import { describe, expect, it } from "vitest";
import { buildJavaExecutionSource, executeJavaInBrowser } from "./java-runner";

describe("buildJavaExecutionSource", () => {
  it("returns source unchanged in script mode", () => {
    const source = "class Main { public static void main(String[] args) {} }";
    expect(buildJavaExecutionSource(source)).toBe(source);
  });

  it("wraps function mode with runner main", () => {
    const source = `class Solution {
  public static int[] twoSum(int[] nums, int target) {
    return new int[] {0, 1};
  }
}`;
    const wrapped = buildJavaExecutionSource(source, "twoSum", [[2, 7, 11, 15], 9]);
    expect(wrapped).toContain("class __VT_Runner__");
    expect(wrapped).toContain("Solution.twoSum(_vt_arg0, _vt_arg1)");
    expect(wrapped).toContain("new int[] {2, 7, 11, 15}");
  });
});

describe("executeJavaInBrowser", () => {
  it("runs script mode and captures stdout", async () => {
    const result = await executeJavaInBrowser({
      source: `class Main {
  public static void main(String[] args) {
    System.out.println(6);
  }
}`,
      language: "java",
      stdin: "",
      trace: true,
    });

    expect(result.error).toBeNull();
    expect(result.stdout.trim()).toBe("6");
  });

  it("runs function mode via wrapper", async () => {
    const result = await executeJavaInBrowser({
      source: `class Solution {
  public static int[] twoSum(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) {
      for (int j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] == target) {
          return new int[] {i, j};
        }
      }
    }
    return new int[] {};
  }
}`,
      language: "java",
      stdin: "",
      function_name: "twoSum",
      function_args: [[2, 7, 11, 15], 9],
      trace: true,
    });

    expect(result.error).toBeNull();
    expect(result.stdout.trim()).toBe("[0, 1]");
  });

  it("reports compilation errors", async () => {
    const result = await executeJavaInBrowser({
      source: "class Main { public static void main(String[] args) { int x = ; } }",
      language: "java",
      stdin: "",
      trace: true,
    });

    expect(result.error).toContain("Compilation error");
  });
});
