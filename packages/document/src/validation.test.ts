import { describe, expect, it } from "vitest";
import { parseShapeId, ROOT_ID } from "@open-draw/contracts";
import type { Shape } from "./shape";
import { createPage, createRect, createSection } from "./shape";
import { DocumentError } from "./errors";
import { parseDocument } from "./validation";

function serialize(shapes: readonly Shape[]): unknown {
  return JSON.parse(
    JSON.stringify({
      schema: { version: 1 },
      shapes: Object.fromEntries(shapes.map((shape) => [shape.id, shape])),
    }),
  );
}

const page = createPage(parseShapeId("page-1"), { x: 0, y: 0, width: 1440, height: 900 });
const section = createSection(
  parseShapeId("section-1"),
  { x: 0, y: 0, width: 1400, height: 120 },
  "row",
  {
    parent: parseShapeId("page-1"),
  },
);
const rect = createRect(
  parseShapeId("rect-1"),
  { x: 10, y: 10, width: 200, height: 80 },
  {
    parent: parseShapeId("section-1"),
    label: "Hero",
  },
);

describe("parseDocument", () => {
  it("parses a valid document and preserves shape data", () => {
    const document = parseDocument(serialize([page, section, rect]));
    expect(document.schema.version).toBe(1);
    expect(document.shapes[parseShapeId("rect-1")]?.label).toBe("Hero");
    expect(document.shapes[parseShapeId("rect-1")]?.parent).toBe("section-1");
  });

  it("rejects a schema with the wrong version", () => {
    const input = serialize([page]) as { schema: { version: number } };
    input.schema.version = 2;
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("rejects an unknown kind", () => {
    const input = serialize([page]) as { shapes: Record<string, Record<string, unknown>> };
    input.shapes["page-1"]!.kind = "pentagon";
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("rejects a record key that does not match the shape id", () => {
    const input = serialize([page]) as { shapes: Record<string, Record<string, unknown>> };
    input.shapes["wrong-key"] = input.shapes["page-1"]!;
    delete input.shapes["page-1"];
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("rejects a parent chain that cycles", () => {
    const input = serialize([page, section]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    input.shapes["page-1"]!.parent = "section-1";
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("rejects a non-container parent", () => {
    const nested = createRect(
      parseShapeId("rect-2"),
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parent: parseShapeId("rect-1"),
      },
    );
    expect(() => parseDocument(serialize([page, section, rect, nested]))).toThrow(DocumentError);
  });

  it("rejects a root child that is not a page", () => {
    const stray = createRect(
      parseShapeId("stray-1"),
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parent: ROOT_ID,
      },
    );
    expect(() => parseDocument(serialize([stray]))).toThrow(DocumentError);
  });

  it("rejects an unknown device type in meta", () => {
    const input = serialize([page, section, rect]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    input.shapes["rect-1"]!.meta = { order: { phablet: 1 } };
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });
});
