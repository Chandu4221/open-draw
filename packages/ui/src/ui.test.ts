import { describe, expect, it } from "vitest";
import {
  ICONS,
  ICON_IDS,
  OD_TOAST_TYPES,
  OdButton,
  OdField,
  OdIcon,
  OdIconButton,
  OdSegmentedControl,
  OdToastHost,
  OdToastProvider,
  OdTooltip,
  useToast,
} from "./index";

describe("icons registry", () => {
  it("contains all required icon glyphs with non-empty path data", () => {
    const requiredIcons = [
      "select-tool",
      "rect-tool",
      "ellipse-tool",
      "line-tool",
      "pen-tool",
      "board-tool",
      "save",
      "open",
      "export",
      "copy",
      "check",
      "delete",
      "duplicate",
      "paste",
      "undo",
      "redo",
      "zoom-in",
      "zoom-out",
      "fit-all",
      "smartphone",
      "tablet",
      "laptop",
      "desktop",
      "monitor",
      "chevron",
      "close",
      "help",
      "panel",
    ] as const;

    for (const iconId of requiredIcons) {
      expect(ICONS[iconId]).toBeDefined();
      expect(typeof ICONS[iconId]).toBe("string");
      expect(ICONS[iconId].length).toBeGreaterThan(0);
    }
  });

  it("exposes typed ICON_IDS array matching keys of ICONS", () => {
    expect(ICON_IDS).toHaveLength(Object.keys(ICONS).length);
  });
});

describe("toast registry", () => {
  it("defines standard toast types", () => {
    expect(OD_TOAST_TYPES.success).toBe("success");
    expect(OD_TOAST_TYPES.error).toBe("error");
    expect(OD_TOAST_TYPES.info).toBe("info");
  });
});

describe("public exports", () => {
  it("exports all required UI components and hooks", () => {
    expect(OdButton).toBeDefined();
    expect(OdIconButton).toBeDefined();
    expect(OdIcon).toBeDefined();
    expect(OdTooltip).toBeDefined();
    expect(OdSegmentedControl).toBeDefined();
    expect(OdField).toBeDefined();
    expect(OdToastHost).toBeDefined();
    expect(OdToastProvider).toBeDefined();
    expect(useToast).toBeDefined();
  });
});
