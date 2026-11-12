import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  applyThemeToDom,
  detectPreferredTheme,
  UI_THEME_STORAGE_KEY,
  useUiTheme,
} from "./use-ui-theme";

describe("useUiTheme", () => {
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

  it("detects light as fallback when no storage or matchMedia exists", () => {
    expect(detectPreferredTheme()).toBe("light");
  });

  it("detects saved dark theme from storage", () => {
    store[UI_THEME_STORAGE_KEY] = "dark";
    expect(detectPreferredTheme()).toBe("dark");
  });

  it("detects saved light theme from storage even when matchMedia prefers dark", () => {
    store[UI_THEME_STORAGE_KEY] = "light";
    vi.stubGlobal("window", {
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
      localStorage: globalThis.localStorage,
    });
    expect(detectPreferredTheme()).toBe("light");
  });

  it("detects system dark preference when storage has no theme", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
      localStorage: globalThis.localStorage,
    });
    expect(detectPreferredTheme()).toBe("dark");
  });

  it("applies theme attribute to document element", () => {
    const mockElement = {
      attributes: {} as Record<string, string>,
      setAttribute: vi.fn((name: string, val: string) => {
        mockElement.attributes[name] = val;
      }),
      getAttribute: vi.fn((name: string) => mockElement.attributes[name]),
    };
    vi.stubGlobal("document", {
      documentElement: mockElement,
    });

    applyThemeToDom("dark");
    expect(mockElement.setAttribute).toHaveBeenCalledWith("data-theme", "dark");

    applyThemeToDom("light");
    expect(mockElement.setAttribute).toHaveBeenCalledWith("data-theme", "light");
  });

  it("renders with initial detected theme in component", () => {
    store[UI_THEME_STORAGE_KEY] = "dark";

    function ThemeConsumer(): React.JSX.Element {
      const { theme, isDark } = useUiTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="is-dark">{isDark ? "yes" : "no"}</span>
        </div>
      );
    }

    const html = renderToString(<ThemeConsumer />);
    expect(html).toContain("dark");
    expect(html).toContain("yes");
  });
});
