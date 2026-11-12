// Studio UI theme hook: toggles between light and dark UI chrome (R-008, R-016).
// Theme applies to toolbars, docks, inspector panels, and dialogs.
// Canvas workbench and shape geometry remain pinned to light mode.
import { useCallback, useEffect, useState } from "react";

export const UI_THEME_STORAGE_KEY = "opendraw:ui-theme";
export type UiTheme = "light" | "dark";

function getLocalStorage(): Storage | undefined {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    // Storage access may be blocked in sandboxed frames
  }
  return undefined;
}

export function detectPreferredTheme(): UiTheme {
  const storage = getLocalStorage();
  if (storage) {
    const saved = storage.getItem(UI_THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function applyThemeToDom(theme: UiTheme): void {
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export interface UseUiThemeResult {
  readonly theme: UiTheme;
  readonly isDark: boolean;
  readonly toggleTheme: () => void;
  readonly setTheme: (theme: UiTheme) => void;
}

export function useUiTheme(): UseUiThemeResult {
  const [theme, setThemeState] = useState<UiTheme>(() => detectPreferredTheme());

  useEffect(() => {
    applyThemeToDom(theme);
    const storage = getLocalStorage();
    if (storage) {
      try {
        storage.setItem(UI_THEME_STORAGE_KEY, theme);
      } catch {
        // Ignore quota/sandbox errors
      }
    }
  }, [theme]);

  const setTheme = useCallback((next: UiTheme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme,
    setTheme,
  };
}
