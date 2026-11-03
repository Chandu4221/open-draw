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

  it("resolves tool shortcut keys according to ratified keybindings (R-011, R2)", () => {
    expect(resolveKeyBinding({ code: "KeyV" })).toBe(ACTIONS.selectTool);
    expect(resolveKeyBinding({ code: "Digit1" })).toBe(ACTIONS.selectTool);
    expect(resolveKeyBinding({ code: "KeyR" })).toBe(ACTIONS.selectToolRect);
    expect(resolveKeyBinding({ code: "KeyO" })).toBe(ACTIONS.selectToolEllipse);
    expect(resolveKeyBinding({ code: "KeyL" })).toBe(ACTIONS.selectToolLine);
    expect(resolveKeyBinding({ code: "KeyP" })).toBe(ACTIONS.selectToolPenPath);
    expect(resolveKeyBinding({ code: "KeyD" })).toBe(ACTIONS.selectToolPenPath);
  });

  it("resolves clipboard shortcuts (duplicate, copy, paste) when modifier is present (F5)", () => {
    expect(resolveKeyBinding({ code: "KeyD", ctrlKey: true })).toBe(ACTIONS.duplicate);
    expect(resolveKeyBinding({ code: "KeyD", metaKey: true })).toBe(ACTIONS.duplicate);
    expect(resolveKeyBinding({ code: "KeyC", ctrlKey: true })).toBe(ACTIONS.copy);
    expect(resolveKeyBinding({ code: "KeyC", metaKey: true })).toBe(ACTIONS.copy);
    expect(resolveKeyBinding({ code: "KeyV", ctrlKey: true })).toBe(ACTIONS.paste);
    expect(resolveKeyBinding({ code: "KeyV", metaKey: true })).toBe(ACTIONS.paste);
  });

  it("returns undefined for unbound keys", () => {
    expect(resolveKeyBinding({ code: "KeyT" })).toBeUndefined();
    expect(resolveKeyBinding({ code: "KeyX" })).toBeUndefined();
  });
});
