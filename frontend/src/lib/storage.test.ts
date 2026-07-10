import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDefaultSource,
  getEmptySource,
  loadSource,
} from "./storage";

describe("storage defaults", () => {
  it("returns empty source for explicit clear state", () => {
    expect(getEmptySource("python")).toBe("");
    expect(getEmptySource("javascript")).toBe("");
  });

  it("returns two sum example as first-visit placeholder", () => {
    expect(getDefaultSource("python")).toContain("two_sum");
    expect(getDefaultSource("javascript")).toContain("twoSum");
    expect(getDefaultSource("python")).toContain("print");
  });
});

describe("storage load", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads two sum placeholder on first visit", () => {
    expect(loadSource("python")).toContain("two_sum");
    expect(loadSource("python")).toContain("print");
  });

  it("loads empty editor after reset saved empty strings", () => {
    store.set("visualtrace:source:python:script", "");

    expect(loadSource("python")).toBe("");
  });

  it("keeps user-edited source on load", () => {
    store.set("visualtrace:source:python:script", "print('mine')");

    expect(loadSource("python")).toBe("print('mine')");
  });

  it("keeps persisted two sum template on load", () => {
    const template = getDefaultSource("python");
    store.set("visualtrace:source:python:script", template);

    expect(loadSource("python")).toBe(template);
  });

  it("migrates legacy function-mode source into script storage", () => {
    store.set("visualtrace:source:python:function", "def foo():\n    pass");

    expect(loadSource("python")).toBe("def foo():\n    pass");
    expect(store.get("visualtrace:source:python:script")).toBe(
      "def foo():\n    pass"
    );
  });
});
