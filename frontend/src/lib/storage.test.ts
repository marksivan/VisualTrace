import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDefaultSource,
  getEmptySource,
  getDefaultFunctionName,
  DEFAULT_FUNCTION_ARGS,
  EMPTY_FUNCTION_ARGS,
  isLegacyDefaultSource,
  loadFunctionArgs,
  loadFunctionName,
  loadSource,
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

  it("detects legacy two sum templates", () => {
    expect(
      isLegacyDefaultSource(getDefaultSource("python", "script"), "python", "script")
    ).toBe(true);
    expect(isLegacyDefaultSource("print('hello')", "python", "script")).toBe(false);
  });
});

describe("storage migration", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
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

  it("clears cached two sum source on load", () => {
    store.set(
      "visualtrace:source:python:script",
      getDefaultSource("python", "script")
    );

    expect(loadSource("python", "script")).toBe("");
    expect(store.has("visualtrace:source:python:script")).toBe(false);
  });

  it("keeps user-edited source on load", () => {
    store.set("visualtrace:source:python:script", "print('mine')");

    expect(loadSource("python", "script")).toBe("print('mine')");
  });

  it("clears cached default function inputs on load", () => {
    store.set("visualtrace:functionName:python", "two_sum");
    store.set("visualtrace:functionArgs:python", DEFAULT_FUNCTION_ARGS);

    expect(loadFunctionName("python")).toBe("");
    expect(loadFunctionArgs("python")).toBe("[]");
    expect(store.has("visualtrace:functionName:python")).toBe(false);
    expect(store.has("visualtrace:functionArgs:python")).toBe(false);
  });
});
