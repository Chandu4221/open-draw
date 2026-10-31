// Keybinding resolver behavior (R-011, R-015).
import { describe, expect, it } from "vitest";
import { ACTIONS } from "./actions";
import { resolveKeyBinding } from "./resolve-key-binding";

describe("resolveKeyBinding", () => {
  it("resolves Escape to cancel", () => {
    expect(resolveKeyBinding({ code: "Escape" })).toBe(ACTIONS.cancel);
  });

  it("resolves Ctrl+Z to undo", () => {
    expect(resolveKeyBinding({ code: "KeyZ", ctrlKey: true })).toBe(ACTIONS.undo);
  });

  it("resolves Meta+Shift+Z to redo", () => {
    expect(resolveKeyBinding({ code: "KeyZ", metaKey: true, shiftKey: true })).toBe(ACTIONS.redo);
  });

  it("resolves Delete and Backspace to deleteSelected", () => {
    expect(resolveKeyBinding({ code: "Delete" })).toBe(ACTIONS.deleteSelected);
    expect(resolveKeyBinding({ code: "Backspace" })).toBe(ACTIONS.deleteSelected);
  });

  it("returns undefined for unbound keys", () => {
    expect(resolveKeyBinding({ code: "KeyP" })).toBeUndefined();
  });
});
