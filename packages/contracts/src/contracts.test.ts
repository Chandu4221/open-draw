import { describe, expect, it } from "vitest";
import {
  CAPABILITIES,
  CAPABILITY_VALUES,
  CONTROL_TYPES,
  isValidCustomShapeKind,
  isValidPluginId,
  isValidSemanticId,
  parseCustomShapeKind,
  parsePluginId,
  parseSemanticId,
  SEMANTIC_CONFLICTS,
  SHAPE_KINDS,
  SHAPE_KIND_LABELS,
  SHAPE_KIND_VALUES,
  STYLE_PROFILES,
  STYLE_PROFILE_BY_VALUE,
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
    expect(STYLE_PROFILE_BY_VALUE.minimal).toBe("minimal");
  });
});
