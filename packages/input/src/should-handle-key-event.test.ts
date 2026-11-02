// Keyboard event guard behavior (R-008, R-011, R-015).
import { describe, expect, it } from "vitest";
import { shouldHandleKeyEvent } from "./should-handle-key-event";

describe("shouldHandleKeyEvent", () => {
  it("allows keyboard events when target is not editable", () => {
    expect(shouldHandleKeyEvent({ code: "KeyV", isEditableTarget: false })).toBe(true);
    expect(shouldHandleKeyEvent({ code: "Space" })).toBe(true);
    expect(shouldHandleKeyEvent({ code: "Backspace" })).toBe(true);
  });

  it("blocks keyboard events when target is editable", () => {
    expect(shouldHandleKeyEvent({ code: "KeyV", isEditableTarget: true })).toBe(false);
    expect(shouldHandleKeyEvent({ code: "KeyR", isEditableTarget: true })).toBe(false);
    expect(shouldHandleKeyEvent({ code: "Space", isEditableTarget: true })).toBe(false);
    expect(shouldHandleKeyEvent({ code: "Backspace", isEditableTarget: true })).toBe(false);
    expect(shouldHandleKeyEvent({ code: "Delete", isEditableTarget: true })).toBe(false);
  });
});
