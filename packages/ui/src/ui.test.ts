import { describe, expect, it } from "vitest";
import {
  ICONS,
  ICON_IDS,
  OD_TOAST_TYPES,
  OdBadge,
  OdButton,
  OdCard,
  OdField,
  OdIcon,
  OdIconButton,
  OdInputGroup,
  OdPropertyRow,
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
      "text-tool",
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
      "keyboard",
      "sun",
      "moon",
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
    expect(OdBadge).toBeDefined();
    expect(OdButton).toBeDefined();
    expect(OdCard).toBeDefined();
    expect(OdField).toBeDefined();
    expect(OdIcon).toBeDefined();
    expect(OdIconButton).toBeDefined();
    expect(OdInputGroup).toBeDefined();
    expect(OdPropertyRow).toBeDefined();
    expect(OdSegmentedControl).toBeDefined();
    expect(OdToastHost).toBeDefined();
    expect(OdToastProvider).toBeDefined();
    expect(OdTooltip).toBeDefined();
    expect(useToast).toBeDefined();
  });
});

interface NodeFs {
  readFileSync: (path: string, encoding: string) => string;
}

describe("accessibility and design tokens", () => {
  it("declares complete spacing scale including --od-6 in tokens.css", async () => {
    const fsModule = "node:fs";
    const fs = (await import(fsModule)) as unknown as NodeFs;
    const tokensPath = new URL("./tokens.css", import.meta.url).pathname;
    const css = fs.readFileSync(tokensPath, "utf-8");
    expect(css).toContain("--od-6:");
  });

  it("satisfies WCAG 2.1 AA contrast ratios (>= 4.5:1) for text colors against surfaces", async () => {
    const fsModule = "node:fs";
    const fs = (await import(fsModule)) as unknown as NodeFs;
    const tokensPath = new URL("./tokens.css", import.meta.url).pathname;
    const css = fs.readFileSync(tokensPath, "utf-8");

    function parseToken(cssText: string, token: string): string {
      const match = new RegExp(`${token}:\\s*([^;]+);`).exec(cssText);
      const val = match?.[1];
      if (!val) throw new Error(`Missing token ${token}`);
      return val.trim();
    }

    function hexToRgb(hex: string): [number, number, number] {
      const clean = hex.replace("#", "");
      return [
        parseInt(clean.slice(0, 2), 16) / 255,
        parseInt(clean.slice(2, 4), 16) / 255,
        parseInt(clean.slice(4, 6), 16) / 255,
      ];
    }
    function sRGBtoLin(c: number): number {
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    function luminance(hex: string): number {
      const [r = 0, g = 0, b = 0] = hexToRgb(hex).map(sRGBtoLin);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function contrast(hex1: string, hex2: string): number {
      const l1 = luminance(hex1);
      const l2 = luminance(hex2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    // Light Theme root block
    const rootBlock = css.split("@media")[0] ?? "";
    const lightSurface = parseToken(rootBlock, "--od-surface");
    const lightBg = parseToken(rootBlock, "--od-bg");
    const lightText = parseToken(rootBlock, "--od-text");
    const lightTextSecondary = parseToken(rootBlock, "--od-text-secondary");
    const lightTextTertiary = parseToken(rootBlock, "--od-text-tertiary");
    const lightDanger = parseToken(rootBlock, "--od-danger");
    const lightDangerSoft = parseToken(rootBlock, "--od-danger-soft");
    const lightSuccess = parseToken(rootBlock, "--od-success");

    expect(contrast(lightText, lightSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightTextSecondary, lightSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightTextTertiary, lightSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightTextTertiary, lightBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightDanger, lightSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightDanger, lightDangerSoft)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightSuccess, lightSurface)).toBeGreaterThanOrEqual(4.5);

    // Dark Theme block
    const darkBlock = css.split(':root[data-theme="dark"]')[1] ?? "";
    const darkSurface = parseToken(darkBlock, "--od-surface");
    const darkBg = parseToken(darkBlock, "--od-bg");
    const darkText = parseToken(darkBlock, "--od-text");
    const darkTextSecondary = parseToken(darkBlock, "--od-text-secondary");
    const darkTextTertiary = parseToken(darkBlock, "--od-text-tertiary");
    const darkDanger = parseToken(darkBlock, "--od-danger");
    const darkDangerSoft = parseToken(darkBlock, "--od-danger-soft");
    const darkSuccess = parseToken(darkBlock, "--od-success");

    expect(contrast(darkText, darkSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkTextSecondary, darkSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkTextTertiary, darkSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkTextTertiary, darkBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkDanger, darkSurface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkDanger, darkDangerSoft)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(darkSuccess, darkSurface)).toBeGreaterThanOrEqual(4.5);
  });

  it("enforces rounded-rectangle container and non-full-rounded segments in base.css", async () => {
    const fsModule = "node:fs";
    const fs = (await import(fsModule)) as unknown as NodeFs;
    const basePath = new URL("./base.css", import.meta.url).pathname;
    const css = fs.readFileSync(basePath, "utf-8");

    // .od-dock must be styled as a unified padded container with 12px radius, not transparent/unpadded
    expect(css).toMatch(/\.od-dock\s*\{[^}]*padding:\s*var\(--od-6\)\s*var\(--od-8\);/);
    expect(css).toMatch(/\.od-dock\s*\{[^}]*border-radius:\s*var\(--od-12\);/);

    // .od-dock-group must not be a 9999px pill
    expect(css).not.toMatch(/\.od-dock-group\s*\{[^}]*border-radius:\s*9999px;/);

    // .od-meter-segment first/last must not be full rounded
    expect(css).not.toMatch(/\.od-meter-segment:first-child\s*\{[^}]*var\(--od-radius-full\);/);
    expect(css).not.toMatch(/\.od-meter-segment:last-child\s*\{[^}]*var\(--od-radius-full\);/);
  });

  it("styles keyboard shortcuts trigger and bottom-left canvas overlay in base.css", async () => {
    const fsModule = "node:fs";
    const fs = (await import(fsModule)) as unknown as NodeFs;
    const basePath = new URL("./base.css", import.meta.url).pathname;
    const css = fs.readFileSync(basePath, "utf-8");

    expect(css).toMatch(/\.od-canvas-overlay-bottom-left\s*\{[^}]*bottom:\s*var\(--od-16\);/);
    expect(css).toMatch(/\.od-canvas-overlay-bottom-left\s*\{[^}]*left:\s*var\(--od-16\);/);
    expect(css).toMatch(/\.od-shortcuts-trigger\s*\{[^}]*border-radius:\s*var\(--od-12\);/);
    expect(css).toMatch(/\.od-kbd\s*\{[^}]*font-family:\s*var\(--od-font-mono\);/);
  });
});
