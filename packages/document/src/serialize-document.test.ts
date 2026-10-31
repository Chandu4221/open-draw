// Serialization and boundary parser behavior (R-006, R-015, R-041).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createDocument } from "./document";
import { createPage, createRect } from "./shape";
import { DocumentError } from "./errors";
import { parseDocument } from "./parse-document";
import { serializeDocument } from "./serialize-document";

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

  it("throws DocumentError on unknown shape kind", () => {
    const badKind = JSON.stringify({
      schema: { version: 1 },
      shapes: {
        "shape-1": {
          id: "shape-1",
          kind: "polygon",
          parent: "page-1",
          boundingBox: { x: 0, y: 0, width: 10, height: 10 },
        },
      },
    });
    expect(() => parseDocument(badKind)).toThrow(DocumentError);
  });
});
