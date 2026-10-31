// Serialization and boundary parser behavior (R-006, R-015, R-041, R-044, ADR-0003).
import { describe, expect, it } from "vitest";
import { parseCustomShapeKind, parsePluginId, parseShapeId } from "@open-draw/contracts";
import { COMMANDS } from "./commands";
import { applySetShapeBoundingBox } from "./commands/set-shape-bounding-box";
import { createDocument } from "./document";
import { DocumentError } from "./errors";
import { parseDocument } from "./parse-document";
import { serializeDocument } from "./serialize-document";
import {
  createCustomShape,
  createLine,
  createPage,
  createPenPath,
  createRect,
  type CustomShape,
  type LineShape,
  type PenPathShape,
} from "./shape";

describe("serializeDocument & parseDocument", () => {
  it("round-trips a document byte-stably", () => {
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
      createRect(
        rectId,
        { x: 10, y: 20, width: 100, height: 80 },
        { parent: pageId, label: "Box" },
      ),
    ]);

    const serialized = serializeDocument(doc);
    const parsed = parseDocument(serialized);
    const reSerialized = serializeDocument(parsed);

    expect(reSerialized).toBe(serialized);
    expect(parsed.shapes[rectId]?.label).toBe("Box");
  });

  it("preserves sibling z-order across serialization round-trip", () => {
    const pageId = parseShapeId("page-1");
    const r1 = parseShapeId("r-1");
    const r2 = parseShapeId("r-2");
    const r3 = parseShapeId("r-3");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
      createRect(r1, { x: 10, y: 10, width: 20, height: 20 }, { parent: pageId }),
      createRect(r2, { x: 20, y: 20, width: 20, height: 20 }, { parent: pageId }),
      createRect(r3, { x: 30, y: 30, width: 20, height: 20 }, { parent: pageId }),
    ]);

    const serialized = serializeDocument(doc);
    const parsed = parseDocument(serialized);

    const keysBefore = Object.keys(doc.shapes);
    const keysAfter = Object.keys(parsed.shapes);
    expect(keysAfter).toEqual(keysBefore);
  });

  it("never includes ROOT_ID in serialized shapes", () => {
    const pageId = parseShapeId("page-1");
    const doc = createDocument([createPage(pageId, { x: 0, y: 0, width: 100, height: 100 })]);
    const serialized = serializeDocument(doc);
    expect(serialized).not.toContain('"__root__"');
  });

  it("round-trips line and pen-path shapes byte-stably", () => {
    const pageId = parseShapeId("page-1");
    const lineId = parseShapeId("line-1");
    const penId = parseShapeId("pen-1");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 1000, height: 1000 }),
      createLine(
        lineId,
        { x: 100, y: 100, width: 200, height: 150 },
        { x: 0, y: 0 },
        { x: 200, y: 150 },
        { parent: pageId },
      ),
      createPenPath(
        penId,
        { x: 50, y: 50, width: 80, height: 80 },
        [
          { x: 0, y: 10 },
          { x: 40, y: 80 },
          { x: 80, y: 0 },
        ],
        { parent: pageId },
      ),
    ]);

    const serialized = serializeDocument(doc);
    const parsed = parseDocument(serialized);
    const reSerialized = serializeDocument(parsed);

    expect(reSerialized).toBe(serialized);

    const parsedLine = parsed.shapes[lineId] as LineShape;
    expect(parsedLine.kind).toBe("line");
    expect(parsedLine.start).toEqual({ x: 0, y: 0 });
    expect(parsedLine.end).toEqual({ x: 200, y: 150 });

    const parsedPen = parsed.shapes[penId] as PenPathShape;
    expect(parsedPen.kind).toBe("pen-path");
    expect(parsedPen.points).toHaveLength(3);
    expect(parsedPen.points[1]).toEqual({ x: 40, y: 80 });
  });

  it("preserves meta.pluginData opaquely and byte-stably (R-044)", () => {
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const pluginA = parsePluginId("third-party:analytics");
    const pluginB = parsePluginId("custom-vendor:settings");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createRect(
        rectId,
        { x: 20, y: 20, width: 100, height: 100 },
        {
          parent: pageId,
          meta: {
            order: {},
            pluginData: {
              [pluginA]: { views: 42, tags: ["chart", "primary"], enabled: true },
              [pluginB]: { nested: { deep: "value", list: [1, 2, 3] } },
            },
          },
        },
      ),
    ]);

    const serialized = serializeDocument(doc);
    const parsed = parseDocument(serialized);
    const reSerialized = serializeDocument(parsed);

    expect(reSerialized).toBe(serialized);

    const rect = parsed.shapes[rectId]!;
    expect(rect.meta.pluginData?.[pluginA]).toEqual({
      views: 42,
      tags: ["chart", "primary"],
      enabled: true,
    });
    expect(rect.meta.pluginData?.[pluginB]).toEqual({
      nested: { deep: "value", list: [1, 2, 3] },
    });
  });

  it("rejects non-serializable pluginData at serialize time with DocumentError (R-044)", () => {
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const pluginA = parsePluginId("vendor:broken");

    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createRect(
        rectId,
        { x: 20, y: 20, width: 100, height: 100 },
        {
          parent: pageId,
          meta: {
            order: {},
            pluginData: {
              [pluginA]: circular,
            },
          },
        },
      ),
    ]);

    expect(() => serializeDocument(doc)).toThrow(DocumentError);
  });

  it("rejects invalid plugin id syntax at parse boundary with DocumentError", () => {
    const raw = JSON.stringify({
      schema: { version: 1 },
      shapes: {
        "page-1": {
          id: "page-1",
          kind: "page",
          parent: "canvas:root",
          boundingBox: { x: 0, y: 0, width: 100, height: 100 },
          meta: {
            order: {},
            pluginData: {
              InvalidPluginIdWithoutColon: { foo: "bar" },
            },
          },
        },
      },
    });

    expect(() => parseDocument(raw)).toThrow(DocumentError);
  });

  it("round-trips custom shape kinds byte-stably", () => {
    const pageId = parseShapeId("page-1");
    const starId = parseShapeId("star-1");
    const starKind = parseCustomShapeKind("vendor:star");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createCustomShape(
        starId,
        starKind,
        { x: 30, y: 30, width: 60, height: 60 },
        { pointsCount: 5, innerRadius: 15 },
        { parent: pageId },
      ),
    ]);

    const serialized = serializeDocument(doc);
    const parsed = parseDocument(serialized);
    const reSerialized = serializeDocument(parsed);

    expect(reSerialized).toBe(serialized);
    expect(parsed.shapes[starId]?.kind).toBe("vendor:star");
    expect((parsed.shapes[starId] as CustomShape).customData?.pointsCount).toBe(5);
  });

  it("throws DocumentError on unknown shape kind (not built-in and not custom format)", () => {
    const badKind = JSON.stringify({
      schema: { version: 1 },
      shapes: {
        "shape-1": {
          id: "shape-1",
          kind: "plain-unnamespaced",
          parent: "page-1",
          boundingBox: { x: 0, y: 0, width: 10, height: 10 },
          meta: { order: {} },
        },
      },
    });
    expect(() => parseDocument(badKind)).toThrow(DocumentError);
  });

  it("throws DocumentError on invalid JSON syntax", () => {
    expect(() => parseDocument("not valid json")).toThrow(DocumentError);
  });

  it("throws DocumentError on unsupported schema version", () => {
    const badVersion = JSON.stringify({
      schema: { version: 999 },
      shapes: {},
    });
    expect(() => parseDocument(badVersion)).toThrow(DocumentError);
  });

  it("throws DocumentError on missing schema block", () => {
    const noSchema = JSON.stringify({
      shapes: {},
    });
    expect(() => parseDocument(noSchema)).toThrow(DocumentError);
  });
});

describe("applySetShapeBoundingBox point scaling", () => {
  it("scales line endpoints proportionally on resize", () => {
    const pageId = parseShapeId("page-1");
    const lineId = parseShapeId("line-1");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 1000, height: 1000 }),
      createLine(
        lineId,
        { x: 10, y: 10, width: 100, height: 50 },
        { x: 10, y: 10 },
        { x: 90, y: 40 },
        { parent: pageId },
      ),
    ]);

    const result = applySetShapeBoundingBox(doc, {
      type: COMMANDS.setShapeBoundingBox,
      id: lineId,
      boundingBox: { x: 10, y: 10, width: 200, height: 100 },
    });

    const resizedLine = result.document.shapes[lineId] as LineShape;
    expect(resizedLine.boundingBox).toEqual({ x: 10, y: 10, width: 200, height: 100 });
    expect(resizedLine.start).toEqual({ x: 20, y: 20 });
    expect(resizedLine.end).toEqual({ x: 180, y: 80 });
  });

  it("scales pen-path points proportionally on resize", () => {
    const pageId = parseShapeId("page-1");
    const penId = parseShapeId("pen-1");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 1000, height: 1000 }),
      createPenPath(
        penId,
        { x: 20, y: 20, width: 100, height: 100 },
        [
          { x: 10, y: 20 },
          { x: 50, y: 60 },
        ],
        { parent: pageId },
      ),
    ]);

    const result = applySetShapeBoundingBox(doc, {
      type: COMMANDS.setShapeBoundingBox,
      id: penId,
      boundingBox: { x: 20, y: 20, width: 300, height: 200 },
    });

    const resizedPen = result.document.shapes[penId] as PenPathShape;
    expect(resizedPen.points).toEqual([
      { x: 30, y: 40 },
      { x: 150, y: 120 },
    ]);
  });
});
