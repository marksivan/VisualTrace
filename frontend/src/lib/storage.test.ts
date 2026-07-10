import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDefaultSource,
  getEmptySource,
  getDefaultFunctionName,
  DEFAULT_FUNCTION_ARGS,
  EMPTY_FUNCTION_ARGS,
  loadFunctionArgs,
  loadFunctionName,
  loadSource,
} from "./storage";

describe("storage defaults", () => {
  it("returns empty source for explicit clear state", () => {
    expect(getEmptySource("python", "script")).toBe("");
    expect(getEmptySource("javascript", "function")).toBe("");
  });

  it("returns two sum example as first-visit placeholder", () => {
    expect(getDefaultSource("python", "script")).toContain("two_sum");
    expect(getDefaultSource("javascript", "function")).toContain("twoSum");
    expect(getDefaultFunctionName("javascript")).toBe("twoSum");
    expect(DEFAULT_FUNCTION_ARGS).toContain("2, 7, 11, 15");
  });

  it("uses empty function args after reset", () => {
    expect(EMPTY_FUNCTION_ARGS).toBe("[]");
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
    expect(loadSource("python", "script")).toContain("two_sum");
    expect(loadFunctionName("python")).toBe("two_sum");
    expect(loadFunctionArgs("python")).toBe(DEFAULT_FUNCTION_ARGS);
  });

  it("loads empty editor after reset saved empty strings", () => {
    store.set("visualtrace:source:python:script", "");
    store.set("visualtrace:functionName:python", "");
    store.set("visualtrace:functionArgs:python", EMPTY_FUNCTION_ARGS);

    expect(loadSource("python", "script")).toBe("");
    expect(loadFunctionName("python")).toBe("");
    expect(loadFunctionArgs("python")).toBe("[]");
  });

  it("keeps user-edited source on load", () => {
    store.set("visualtrace:source:python:script", "print('mine')");

    expect(loadSource("python", "script")).toBe("print('mine')");
  });

  it("keeps persisted two sum template on load", () => {
    const template = getDefaultSource("python", "script");
    store.set("visualtrace:source:python:script", template);

    expect(loadSource("python", "script")).toBe(template);
  });
});
