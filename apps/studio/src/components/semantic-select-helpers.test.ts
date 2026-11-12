import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANDROID_NATIVE_PROFILE, WEB_PROFILE } from "@open-draw/profiles";
import {
  groupProfileSemantics,
  loadRecentSemanticTags,
  resolveRecentDefinitions,
  saveRecentSemanticTag,
} from "./semantic-select-helpers";

describe("semantic select helpers", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      length: 0,
      key: vi.fn(),
    };
    vi.stubGlobal("localStorage", mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("groups active profile semantics across all 10 categories", () => {
    const groups = groupProfileSemantics(WEB_PROFILE);
    expect(groups.length).toBe(10);

    const marketingGroup = groups.find((g) => g.category === "marketing");
    expect(marketingGroup).toBeDefined();
    expect(marketingGroup?.items.some((i) => i.id === "hero")).toBe(true);
    expect(marketingGroup?.items.some((i) => i.id === "pricing-table")).toBe(true);

    const layoutGroup = groups.find((g) => g.category === "layout");
    expect(layoutGroup).toBeDefined();
    expect(layoutGroup?.items.some((i) => i.id === "section")).toBe(true);
    expect(layoutGroup?.items.some((i) => i.id === "app-shell")).toBe(true);
  });

  it("returns empty array when active profile is undefined", () => {
    expect(groupProfileSemantics(undefined)).toEqual([]);
  });

  it("manages and resolves recently selected semantic tags", () => {
    saveRecentSemanticTag("hero");
    saveRecentSemanticTag("pricing-table");
    const recent = loadRecentSemanticTags();
    const resolved = resolveRecentDefinitions(WEB_PROFILE, recent);

    expect(resolved.some((d) => d.id === "hero")).toBe(true);
    expect(resolved.some((d) => d.id === "pricing-table")).toBe(true);
  });

  it("scopes recent tags by profile to prevent cross-profile tag leakage", () => {
    saveRecentSemanticTag("navbar", "web");
    saveRecentSemanticTag("top-app-bar", "androidNative");

    expect(loadRecentSemanticTags("web")).toEqual(["navbar"]);
    expect(loadRecentSemanticTags("androidNative")).toEqual(["top-app-bar"]);
    expect(loadRecentSemanticTags("flutter")).toEqual([]);
  });

  it("groups android native profile semantics into 5 Material 3 categories with none in other", () => {
    const groups = groupProfileSemantics(ANDROID_NATIVE_PROFILE);
    expect(groups.length).toBe(5);

    const categories = groups.map((g) => g.category);
    expect(categories).toEqual(["layout", "navigation", "interactive", "forms", "feedback"]);

    const otherGroup = groups.find((g) => g.category === "other");
    expect(otherGroup).toBeUndefined();

    const navGroup = groups.find((g) => g.category === "navigation");
    expect(navGroup?.items.some((i) => i.id === "top-app-bar")).toBe(true);
    expect(navGroup?.items.some((i) => i.id === "navigation-rail")).toBe(true);

    const layoutGroup = groups.find((g) => g.category === "layout");
    expect(layoutGroup?.items.some((i) => i.id === "scaffold")).toBe(true);
    expect(layoutGroup?.items.some((i) => i.id === "card")).toBe(true);
  });
});
