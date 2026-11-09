// Golden parity verification between Markdown and JSON exports (C3, C4, C8).
// Proves identical shape visitation order, chip ID matching, and rootId scoping.
// Pure Document → export projections, byte-stable (R-016, R-025, R-041).
import { describe, expect, it } from "vitest";
import { DEVICE_TYPES, parseShapeId, ROOT_ID, type ShapeId } from "@open-draw/contracts";
import { createDocument, createRect, createText } from "@open-draw/document";
import { exportJson, type ExportedJsonDocument } from "./export-json";
import { exportMarkdown } from "./export-markdown";

function extractMarkdownShapeIds(markdown: string): ShapeId[] {
  const ids: ShapeId[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    // Matches bullet line: `  - #s-xxx — `
    const match = line.match(/^\s*-\s*#([a-zA-Z0-9_-]+)\s*—/);
    if (match !== null && match[1] !== undefined) {
      ids.push(parseShapeId(match[1]));
    }
  }
  return ids;
}

describe("Markdown and JSON export parity (C3, C4, C8)", () => {
  const multiScreenDoc = createDocument([
    // Screen A
    createRect(
      parseShapeId("screen-a"),
      { x: 0, y: 0, width: 400, height: 800 },
      { parent: ROOT_ID, label: "Screen A" },
    ),
    createRect(
      parseShapeId("header-a"),
      { x: 0, y: 0, width: 400, height: 60 },
      {
        parent: parseShapeId("screen-a"),
        label: "Header A",
        meta: { order: { [DEVICE_TYPES.mobile]: 1, [DEVICE_TYPES.desktop]: 2 } },
      },
    ),
    createRect(
      parseShapeId("hero-a"),
      { x: 0, y: 60, width: 400, height: 200 },
      {
        parent: parseShapeId("screen-a"),
        label: "Hero A",
        meta: { order: { [DEVICE_TYPES.mobile]: 2, [DEVICE_TYPES.desktop]: 1 } },
      },
    ),
    createText(
      parseShapeId("hero-title"),
      { x: 20, y: 80, width: 200, height: 40 },
      { parent: parseShapeId("hero-a"), content: "Welcome" },
    ),
    createRect(
      parseShapeId("footer-a"),
      { x: 0, y: 700, width: 400, height: 100 },
      {
        parent: parseShapeId("screen-a"),
        label: "Footer A",
        meta: {
          hiddenOn: [DEVICE_TYPES.mobile],
          order: { [DEVICE_TYPES.mobile]: 3, [DEVICE_TYPES.desktop]: 3 },
        },
      },
    ),
    // Screen B
    createRect(
      parseShapeId("screen-b"),
      { x: 500, y: 0, width: 400, height: 800 },
      { parent: ROOT_ID, label: "Screen B" },
    ),
    createRect(
      parseShapeId("content-b"),
      { x: 20, y: 20, width: 360, height: 400 },
      { parent: parseShapeId("screen-b"), label: "Content B" },
    ),
  ]);

  it("visits shapes in the identical order between markdown and json for mobile layout", () => {
    const md = exportMarkdown(multiScreenDoc, { deviceType: DEVICE_TYPES.mobile });
    const jsonStr = exportJson(multiScreenDoc, { deviceType: DEVICE_TYPES.mobile });
    const jsonDoc = JSON.parse(jsonStr) as ExportedJsonDocument;

    const mdIds = extractMarkdownShapeIds(md);
    expect(jsonDoc.shapeOrder).toEqual(mdIds);
  });

  it("visits shapes in the identical order between markdown and json for desktop layout", () => {
    const md = exportMarkdown(multiScreenDoc, { deviceType: DEVICE_TYPES.desktop });
    const jsonStr = exportJson(multiScreenDoc, { deviceType: DEVICE_TYPES.desktop });
    const jsonDoc = JSON.parse(jsonStr) as ExportedJsonDocument;

    const mdIds = extractMarkdownShapeIds(md);
    expect(jsonDoc.shapeOrder).toEqual(mdIds);
  });

  it("matches chip ID format across markdown and json exports", () => {
    const jsonStr = exportJson(multiScreenDoc);
    const jsonDoc = JSON.parse(jsonStr) as ExportedJsonDocument;

    for (const id of jsonDoc.shapeOrder) {
      const shapeObj = jsonDoc.shapes[id] as { id: string; chipId: string };
      expect(shapeObj.id).toBe(id);
      expect(shapeObj.chipId).toBe(`#${id}`);
    }
  });

  it("respects rootId scoping identically in markdown and json exports", () => {
    const rootId = parseShapeId("screen-a");
    const md = exportMarkdown(multiScreenDoc, { rootId });
    const jsonStr = exportJson(multiScreenDoc, { rootId });
    const jsonDoc = JSON.parse(jsonStr) as ExportedJsonDocument;

    const mdIds = extractMarkdownShapeIds(md);
    // console.log("mdIds:", mdIds, "jsonDoc.shapeOrder:", jsonDoc.shapeOrder);
    expect(mdIds).toEqual(jsonDoc.shapeOrder);
    expect(mdIds).toContain("screen-a");
    expect(mdIds).toContain("header-a");
    expect(mdIds).toContain("hero-a");
    expect(mdIds).toContain("hero-title");
    expect(mdIds).toContain("footer-a");
    expect(mdIds).not.toContain("screen-b");
    expect(mdIds).not.toContain("content-b");
  });
});
