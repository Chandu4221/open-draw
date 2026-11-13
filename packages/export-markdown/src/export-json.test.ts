import { describe, expect, it } from "vitest";
import { parseCustomShapeKind, parseShapeId, ROOT_ID } from "@open-draw/canvas";
import { CREATIVITY_LEVELS, EXPORT_CHIP_PREFIX } from "./export-contract";
import { PLATFORMS } from "@open-draw/semantics";
import {
  createCustomShape,
  createDocument,
  createLine,
  createPenPath,
  createRect,
  parseDocument,
} from "@open-draw/canvas";
import { SEMANTICS_REGISTRY_VERSION } from "@open-draw/semantics";
import { formatChipId, isChipId, parseChipId } from "./chip-id";
import { DocumentError, exportJson, roundCoordinate } from "./export-json";

describe("chip-id (Milestone 11A Section 3)", () => {
  it("formats a shape ID into an export chip reference with prefix # (R-042)", () => {
    const shapeId = parseShapeId("s-7a01");
    expect(formatChipId(shapeId)).toBe(`${EXPORT_CHIP_PREFIX}s-7a01`);
    expect(formatChipId(shapeId)).toBe("#s-7a01");
  });

  it("validates and parses chip reference back to ShapeId", () => {
    expect(isChipId("#s-7a01")).toBe(true);
    expect(isChipId("s-7a01")).toBe(false);
    expect(parseChipId("#s-7a01")).toBe(parseShapeId("s-7a01"));
  });

  it("throws loud error on invalid chip ID format", () => {
    expect(() => parseChipId("invalid-chip")).toThrow(/invalid chip id/);
  });
});

describe("exportJson parity (Milestone 11A Work Package A)", () => {
  const rawFixtureJson = JSON.stringify({
    schema: { version: 1 },
    shapes: {
      "s-7a01": {
        id: "s-7a01",
        kind: "rect",
        parentId: "canvas:root",
        boundingBox: { x: 386.03, y: 125.25, width: 605.62, height: 319.96 },
        label: "Profie Card",
        meta: {
          semantic: { id: "card", platform: "web", properties: { elevation: "low" } },
          platform: "web",
          role: "component",
        },
      },
      "s-7a02": {
        id: "s-7a02",
        kind: "ellipse",
        parentId: "s-7a01",
        boundingBox: { x: 44.21, y: 53.36, width: 198.15, height: 193.05 },
        meta: {},
      },
      "s-7a03": {
        id: "s-7a03",
        kind: "text",
        parentId: "s-7a01",
        content: "Alex Muller",
        meta: { semantic: { id: "heading", platform: "web" } },
        boundingBox: { x: 275.09, y: 79.93, width: 100, height: 32 },
      },
      "s-7a05": {
        id: "s-7a05",
        kind: "text",
        parentId: "s-7a01",
        content: "Software developer",
        meta: { semantic: { id: "heading", platform: "web", properties: { level: "5" } } },
        boundingBox: { x: 271.81, y: 114.59, width: 162.54, height: 32.39 },
      },
      "s-7a06": {
        id: "s-7a06",
        kind: "rect",
        parentId: "s-7a01",
        content: "Hire Me",
        label: "Hire Me",
        meta: { semantic: { id: "button", platform: "web" } },
        boundingBox: { x: 268.45, y: 161.66, width: 222.14, height: 60.3 },
      },
    },
  });
  const fixtureDoc = parseDocument(rawFixtureJson);

  it("matches structural parity for fixtures/profie-card.document.json", () => {
    const exportedStr = exportJson(fixtureDoc);
    const parsed = JSON.parse(exportedStr);

    expect(parsed.schema).toEqual({ version: 1 });
    expect(parsed.semantics).toEqual({ version: SEMANTICS_REGISTRY_VERSION });
    expect(parsed.shapeOrder).toEqual(["s-7a01", "s-7a02", "s-7a03", "s-7a05", "s-7a06"]);

    // Root card shape
    const rootShape = parsed.shapes["s-7a01"];
    expect(rootShape.id).toBe("s-7a01");
    expect(rootShape.chipId).toBe("#s-7a01");
    expect(rootShape.kind).toBe("rect");
    expect(rootShape.label).toBe("Profie Card");
    expect(rootShape.meta.semantic.id).toBe("card");
    expect(rootShape.meta.semantic.platform).toBe("web");
    expect(rootShape.meta.role).toBe("component");

    // Untagged ellipse shape
    const ellipseShape = parsed.shapes["s-7a02"];
    expect(ellipseShape.id).toBe("s-7a02");
    expect(ellipseShape.chipId).toBe("#s-7a02");
    expect(ellipseShape.kind).toBe("ellipse");
    expect(ellipseShape.parentId).toBe("s-7a01");
    expect(ellipseShape.meta.semantic).toBeNull();
  });

  it("produces byte-identical outputs when exported twice (D2 byte-stability)", () => {
    const run1 = exportJson(fixtureDoc);
    const run2 = exportJson(fixtureDoc);
    expect(run1).toBe(run2);
  });

  it("omits empty meta.order: {} noise (A3)", () => {
    const exportedStr = exportJson(fixtureDoc);
    const parsed = JSON.parse(exportedStr);

    for (const shape of Object.values(parsed.shapes) as Array<{
      meta: { order?: unknown };
    }>) {
      expect(shape.meta.order).toBeUndefined();
    }
  });

  it("serializes explicit semantic: null for untagged shapes (A4)", () => {
    const rect = createRect(
      parseShapeId("rect-1"),
      { x: 10, y: 10, width: 100, height: 100 },
      { meta: { order: {} } },
    );
    const doc = createDocument([rect]);
    const exported = JSON.parse(exportJson(doc));

    expect(exported.shapes["rect-1"].meta.semantic).toBeNull();
  });

  it("includes fill, stroke, and strokeWidth when defined on shapes (A1)", () => {
    const styledRect = createRect(
      parseShapeId("rect-styled"),
      { x: 50, y: 50, width: 200, height: 150 },
      {
        fill: "#3b82f6",
        stroke: "#1d4ed8",
        strokeWidth: 3,
        meta: {
          semantic: { id: "card", platform: PLATFORMS.web },
          order: { desktop: 2 },
        },
      },
    );
    const doc = createDocument([styledRect]);
    const exported = JSON.parse(exportJson(doc));
    const shape = exported.shapes["rect-styled"];

    expect(shape.fill).toBe("#3b82f6");
    expect(shape.stroke).toBe("#1d4ed8");
    expect(shape.strokeWidth).toBe(3);
    expect(shape.meta.order).toEqual({ desktop: 2 });
  });

  it("includes shape-kind specific geometric properties for line and penPath", () => {
    const line = createLine(
      parseShapeId("line-1"),
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { stroke: "#000000", strokeWidth: 2 },
    );
    const pen = createPenPath(
      parseShapeId("pen-1"),
      { x: 10, y: 10, width: 80, height: 40 },
      [
        { x: 0, y: 0 },
        { x: 40, y: 20 },
        { x: 80, y: 40 },
      ],
      { stroke: "#ff0000" },
    );
    const doc = createDocument([line, pen]);
    const exported = JSON.parse(exportJson(doc));

    expect(exported.shapes["line-1"].start).toEqual({ x: 0, y: 0 });
    expect(exported.shapes["line-1"].end).toEqual({ x: 100, y: 50 });
    expect(exported.shapes["pen-1"].points).toEqual([
      { x: 0, y: 0 },
      { x: 40, y: 20 },
      { x: 80, y: 40 },
    ]);
  });

  it("rounds coordinates to 2 decimal places and throws on non-finite values (D2)", () => {
    expect(roundCoordinate(123.456)).toBe(123.46);
    expect(roundCoordinate(100.004)).toBe(100);
    expect(() => roundCoordinate(NaN)).toThrow(/Invalid non-finite number/);
    expect(() => roundCoordinate(Infinity)).toThrow(/Invalid non-finite number/);
  });

  it("includes aiGuidance directives when creativityLevel or includeAiDirectives is set", () => {
    const withDirectives = JSON.parse(
      exportJson(fixtureDoc, { creativityLevel: CREATIVITY_LEVELS[2] }),
    );
    expect(withDirectives.aiGuidance).toBeDefined();
    expect(Array.isArray(withDirectives.aiGuidance.directives)).toBe(true);
    expect(withDirectives.aiGuidance.directives.length).toBeGreaterThan(0);

    const withoutDirectives = JSON.parse(exportJson(fixtureDoc));
    expect(withoutDirectives.aiGuidance).toBeUndefined();
  });

  it("allows full recoverability of doc-model truth from export projection (D3 round-trip)", () => {
    const exportedStr = exportJson(fixtureDoc);
    const parsed = JSON.parse(exportedStr);

    // Assert shape count matches original
    const origShapeCount = Object.keys(fixtureDoc.shapes).length;
    const exportedShapeCount = Object.keys(parsed.shapes).length;
    expect(exportedShapeCount).toBe(origShapeCount);

    // Assert every shape's core data is recoverable
    for (const [id, origShape] of Object.entries(fixtureDoc.shapes)) {
      const exportedShape = parsed.shapes[id];
      expect(exportedShape).toBeDefined();
      expect(exportedShape.kind).toBe(origShape.kind);
      expect(exportedShape.parentId).toBe(origShape.parentId);
      expect(exportedShape.boundingBox.x).toBe(origShape.boundingBox.x);
      expect(exportedShape.boundingBox.y).toBe(origShape.boundingBox.y);
      expect(exportedShape.boundingBox.width).toBe(origShape.boundingBox.width);
      expect(exportedShape.boundingBox.height).toBe(origShape.boundingBox.height);
      if (origShape.meta.semantic) {
        expect(exportedShape.meta.semantic.id).toBe(origShape.meta.semantic.id);
      } else {
        expect(exportedShape.meta.semantic).toBeNull();
      }
    }

    // Assert z-order sequence matches
    expect(parsed.shapeOrder).toEqual(Object.keys(parsed.shapes));
  });

  it("filters exported shapes to only the specified rootId subtree", () => {
    const page1 = parseShapeId("screen-1");
    const child1 = parseShapeId("button-1");
    const page2 = parseShapeId("screen-2");
    const child2 = parseShapeId("button-2");
    const doc = createDocument([
      createRect(page1, { x: 0, y: 0, width: 300, height: 600 }),
      createRect(child1, { x: 10, y: 10, width: 100, height: 40 }, { parent: page1 }),
      createRect(page2, { x: 400, y: 0, width: 300, height: 600 }),
      createRect(child2, { x: 10, y: 10, width: 100, height: 40 }, { parent: page2 }),
    ]);

    const exported = JSON.parse(exportJson(doc, { rootId: page1 }));
    expect(Object.keys(exported.shapes)).toEqual(["screen-1", "button-1"]);
    expect(exported.shapeOrder).toEqual(["screen-1", "button-1"]);
  });

  it("rejects customData attempting to override reserved shape properties (C7)", () => {
    const customId = parseShapeId("custom-1");
    const kind = parseCustomShapeKind("vendor:widget");
    const doc = createDocument([
      createCustomShape(
        customId,
        kind,
        { x: 10, y: 10, width: 100, height: 100 },
        { id: "overridden-id", validKey: "validValue" },
        { parent: ROOT_ID },
      ),
    ]);

    expect(() => exportJson(doc)).toThrow(DocumentError);
  });
});
