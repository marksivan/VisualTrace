import { describe, expect, it } from "vitest";
import { buildCppExecutionSource, executeCppInBrowser } from "./cpp-runner";

describe("buildCppExecutionSource", () => {
  it("returns source unchanged in script mode", () => {
    const source = "int main() { return 0; }";
    expect(buildCppExecutionSource(source)).toBe(source);
  });

  it("wraps function mode with main and includes", () => {
    const source = "int twoSum() { return 42; }";
    const wrapped = buildCppExecutionSource(source, "twoSum");
    expect(wrapped).toContain("#include <iostream>");
    expect(wrapped).toContain("twoSum();");
    expect(wrapped).toContain("int main()");
  });

  it("passes function arguments in the call", () => {
    const source = "int add(int a, int b) { return a + b; }";
    const wrapped = buildCppExecutionSource(source, "add", [2, 3]);
    expect(wrapped).toContain("add(2, 3);");
  });
});

describe("executeCppInBrowser", () => {
  it("runs script mode and captures stdout", async () => {
    const result = await executeCppInBrowser({
      source: `#include <iostream>
using namespace std;
int main() {
  cout << 6;
  return 0;
}`,
      language: "cpp",
      stdin: "",
      trace: false,
    });

    expect(result.error).toBeNull();
    expect(result.stdout.trim()).toBe("6");
  });

  it("runs function mode via wrapper", async () => {
    const result = await executeCppInBrowser({
      source: `int add(int a, int b) {
  return a + b;
}`,
      language: "cpp",
      stdin: "",
      function_name: "add",
      function_args: [2, 3],
      trace: false,
    });

    expect(result.error).toBeNull();
  });

  it("captures trace steps when enabled", async () => {
    const result = await executeCppInBrowser({
      source: `#include <iostream>
using namespace std;
int main() {
  int x = 1;
  cout << x;
  return 0;
}`,
      language: "cpp",
      stdin: "",
      trace: true,
    });

    expect(result.error).toBeNull();
    expect(result.trace.length).toBeGreaterThan(0);
  });
});
