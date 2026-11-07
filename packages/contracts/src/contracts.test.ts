import { describe, expect, it } from "vitest";
import {
  CAPABILITIES,
  CAPABILITY_VALUES,
  CONTROL_TYPES,
  isValidCustomShapeKind,
  isValidPluginId,
  isValidSemanticId,
  MAX_DOCUMENT_DEPTH,
  MAX_HISTORY_DEPTH,
  parseCustomShapeKind,
  parsePluginId,
  parseSemanticId,
  SEMANTIC_CONFLICTS,
  SHAPE_KINDS,
  SHAPE_KIND_LABELS,
  SHAPE_KIND_VALUES,
  EXPORT_FORMATS,
  EXPORT_FORMAT_BY_VALUE,
  isExportFormat,
  STYLE_PROFILES,
  STYLE_PROFILE_BY_VALUE,
  DESIGN_STYLES,
  DESIGN_STYLE_BY_VALUE,
  DESIGN_STYLE_LABELS,
  isDesignStyle,
  ROOT_ROLES,
  ROOT_ROLE_BY_VALUE,
  isRootRole,
  CREATIVITY_LEVELS,
  CREATIVITY_LEVEL_DEFINITIONS,
  DEFAULT_CREATIVITY_LEVEL,
  THEME_PALETTE_SLOTS,
} from "./index";

describe("capabilities", () => {
  it("exposes all defined capability identifiers", () => {
    expect(CAPABILITIES.resizable).toBe("resizable");
    expect(CAPABILITIES.movable).toBe("movable");
    expect(CAPABILITIES.textLabel).toBe("text-label");
    expect(CAPABILITIES.freehandPath).toBe("freehand-path");
    expect(CAPABILITY_VALUES.has("resizable")).toBe(true);
    expect(CAPABILITY_VALUES.has("unknown")).toBe(false);
  });
});

describe("plugin-contract", () => {
  it("validates well-formed plugin ids", () => {
    expect(isValidPluginId("vendor:my-plugin")).toBe(true);
    expect(isValidPluginId("custom-scope:tool-123")).toBe(true);
    expect(parsePluginId("vendor:my-plugin")).toBe("vendor:my-plugin");
  });

  it("rejects malformed plugin ids with loud error", () => {
    expect(isValidPluginId("no-colon")).toBe(false);
    expect(isValidPluginId("Uppercase:Plugin")).toBe(false);
    expect(isValidPluginId("")).toBe(false);
    expect(() => parsePluginId("invalid")).toThrow(/invalid plugin id/);
  });
});

describe("shape-kinds", () => {
  it("includes line and pen-path in built-in shape kinds and labels", () => {
    expect(SHAPE_KINDS.line).toBe("line");
    expect(SHAPE_KINDS.penPath).toBe("pen-path");
    expect(SHAPE_KIND_LABELS.line).toBe("Line");
    expect(SHAPE_KIND_LABELS["pen-path"]).toBe("Pen Path");
    expect(SHAPE_KIND_VALUES.has("line")).toBe(true);
    expect(SHAPE_KIND_VALUES.has("pen-path")).toBe(true);
  });

  it("includes text in built-in shape kinds and labels", () => {
    expect(SHAPE_KINDS.text).toBe("text");
    expect(SHAPE_KIND_LABELS.text).toBe("Text");
    expect(SHAPE_KIND_VALUES.has("text")).toBe(true);
  });

  it("validates namespaced custom shape kinds", () => {
    expect(isValidCustomShapeKind("vendor:star")).toBe(true);
    expect(isValidCustomShapeKind("open-draw:cloud")).toBe(true);
    expect(isValidCustomShapeKind("plain-name")).toBe(false);
    expect(isValidCustomShapeKind("vendor:Star")).toBe(false);
    expect(parseCustomShapeKind("vendor:star")).toBe("vendor:star");
    expect(() => parseCustomShapeKind("invalid")).toThrow(/invalid custom shape kind/);
  });
});

describe("semantic-contract", () => {
  it("validates kebab-case semantic ids", () => {
    expect(isValidSemanticId("navbar")).toBe(true);
    expect(isValidSemanticId("top-app-bar")).toBe(true);
    expect(isValidSemanticId("button-1")).toBe(true);
    expect(isValidSemanticId("Button")).toBe(false);
    expect(isValidSemanticId("nav_bar")).toBe(false);
    expect(isValidSemanticId("")).toBe(false);
    expect(parseSemanticId("card")).toBe("card");
    expect(() => parseSemanticId("Invalid_Id")).toThrow(/invalid semantic id/);
  });

  it("exposes control types and conflict statuses", () => {
    expect(CONTROL_TYPES.text).toBe("text");
    expect(CONTROL_TYPES.select).toBe("select");
    expect(CONTROL_TYPES.toggle).toBe("toggle");
    expect(CONTROL_TYPES.number).toBe("number");
    expect(SEMANTIC_CONFLICTS.valid).toBe("valid");
    expect(SEMANTIC_CONFLICTS.conflicted).toBe("conflicted");
  });
});

describe("profile-contract", () => {
  it("exposes style profiles registry", () => {
    expect(STYLE_PROFILES.minimal).toBe("minimal");
    expect(STYLE_PROFILES.crayon).toBe("crayon");
    expect(STYLE_PROFILE_BY_VALUE.minimal).toBe("minimal");
    expect(STYLE_PROFILE_BY_VALUE.crayon).toBe("crayon");
  });
});

describe("export-contract", () => {
  it("exposes export formats registry and validator", () => {
    expect(EXPORT_FORMATS.json).toBe("json");
    expect(EXPORT_FORMATS.markdown).toBe("markdown");
    expect(EXPORT_FORMAT_BY_VALUE.json).toBe("json");
    expect(EXPORT_FORMAT_BY_VALUE.markdown).toBe("markdown");
    expect(isExportFormat("json")).toBe(true);
    expect(isExportFormat("markdown")).toBe(true);
    expect(isExportFormat("csv")).toBe(false);
  });
});

describe("document-limits", () => {
  it("exposes MAX_DOCUMENT_DEPTH as 256 per Ruling V1", () => {
    expect(MAX_DOCUMENT_DEPTH).toBe(256);
  });

  it("exposes MAX_HISTORY_DEPTH as 100 to prevent unbounded history growth", () => {
    expect(MAX_HISTORY_DEPTH).toBe(100);
  });
});

describe("design-styles", () => {
  it("exposes categorized design styles registry and validator", () => {
    expect(DESIGN_STYLES.neoBrutalism).toBe("neo-brutalism");
    expect(DESIGN_STYLES.glassmorphism).toBe("glassmorphism");
    expect(DESIGN_STYLES.bentoGrid).toBe("bento-grid");
    expect(DESIGN_STYLE_BY_VALUE["neo-brutalism"]).toBe(DESIGN_STYLES.neoBrutalism);
    expect(DESIGN_STYLE_LABELS[DESIGN_STYLES.neoBrutalism]).toBe("Neo-Brutalism");
    expect(isDesignStyle("neo-brutalism")).toBe(true);
    expect(isDesignStyle("non-existent-style")).toBe(false);
  });
});

describe("root-roles", () => {
  it("exposes root roles registry and validator", () => {
    expect(ROOT_ROLES.screen).toBe("screen");
    expect(ROOT_ROLES.component).toBe("component");
    expect(ROOT_ROLE_BY_VALUE.screen).toBe(ROOT_ROLES.screen);
    expect(ROOT_ROLE_BY_VALUE.component).toBe(ROOT_ROLES.component);
    expect(isRootRole("screen")).toBe(true);
    expect(isRootRole("component")).toBe(true);
    expect(isRootRole("modal")).toBe(false);
    expect(isRootRole(123)).toBe(false);
    expect(isRootRole(null)).toBe(false);
  });
});

describe("creativity-levels", () => {
  it("exposes 5 creativity levels with definitions and default", () => {
    expect(CREATIVITY_LEVELS[1]).toBe(1);
    expect(CREATIVITY_LEVELS[2]).toBe(2);
    expect(CREATIVITY_LEVELS[3]).toBe(3);
    expect(CREATIVITY_LEVELS[4]).toBe(4);
    expect(CREATIVITY_LEVELS[5]).toBe(5);

    expect(DEFAULT_CREATIVITY_LEVEL).toBe(3);

    expect(CREATIVITY_LEVEL_DEFINITIONS[1].name).toBe("Strict");
    expect(CREATIVITY_LEVEL_DEFINITIONS[2].name).toBe("Precise");
    expect(CREATIVITY_LEVEL_DEFINITIONS[3].name).toBe("Balanced");
    expect(CREATIVITY_LEVEL_DEFINITIONS[4].name).toBe("Exploratory");
    expect(CREATIVITY_LEVEL_DEFINITIONS[5].name).toBe("Imaginative");

    for (let level = 1; level <= 5; level++) {
      const def = CREATIVITY_LEVEL_DEFINITIONS[level as keyof typeof CREATIVITY_LEVELS];
      expect(def).toBeDefined();
      expect(def.description.length).toBeGreaterThan(0);
      expect(def.promptDirective.length).toBeGreaterThan(0);
    }
  });
});

describe("theme-palettes", () => {
  it("exposes all 6 semantic theme palette slots (Idea 6, R-026)", () => {
    expect(THEME_PALETTE_SLOTS).toEqual([
      "primary",
      "secondary",
      "tertiary",
      "surface",
      "error",
      "success",
    ]);
  });
});
