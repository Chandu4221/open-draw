import { describe, expect, it } from "vitest";
import { parseShapeId, ROOT_ID } from "@open-draw/contracts";
import type { Shape } from "./shape";
import { createEllipse, createPage, createRect, createSection } from "./shape";
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
    const ellipse = createEllipse(
      parseShapeId("ellipse-1"),
      { x: 10, y: 10, width: 50, height: 50 },
      { parent: parseShapeId("section-1") },
    );
    const nested = createRect(
      parseShapeId("rect-2"),
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parent: parseShapeId("ellipse-1"),
      },
    );
    expect(() => parseDocument(serialize([page, section, ellipse, nested]))).toThrow(DocumentError);
  });

  it("allows a nested rectangle to contain child shapes for N-level nesting", () => {
    const nested = createRect(
      parseShapeId("rect-2"),
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parent: parseShapeId("rect-1"),
      },
    );
    const doc = parseDocument(serialize([page, section, rect, nested]));
    expect(doc.shapes[parseShapeId("rect-2")]?.parent).toBe("rect-1");
  });

  it("accepts a root child that is not a page as a freestanding shape on canvas", () => {
    const stray = createRect(
      parseShapeId("stray-1"),
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parent: ROOT_ID,
      },
    );
    const doc = parseDocument(serialize([stray]));
    expect(doc.shapes[parseShapeId("stray-1")]?.kind).toBe("rect");
    expect(doc.shapes[parseShapeId("stray-1")]?.parent).toBe(ROOT_ID);
  });

  it("rejects an unknown device type in meta", () => {
    const input = serialize([page, section, rect]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    input.shapes["rect-1"]!.meta = { order: { phablet: 1 } };
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("accepts platform and style on root pages (R-026)", () => {
    const rootPage = createPage(
      parseShapeId("page-1"),
      { x: 0, y: 0, width: 1440, height: 900 },
      {
        meta: {
          order: {},
          platform: "web",
          style: "minimal",
        },
      },
    );
    const document = parseDocument(serialize([rootPage]));
    expect(document.shapes[parseShapeId("page-1")]?.meta.platform).toBe("web");
    expect(document.shapes[parseShapeId("page-1")]?.meta.style).toBe("minimal");
  });

  it("accepts platform and style on root rects (R-026)", () => {
    const rootRect = createRect(
      parseShapeId("root-rect-1"),
      { x: 0, y: 0, width: 640, height: 480 },
      {
        parent: ROOT_ID,
        meta: {
          order: {},
          platform: "androidNative",
          style: "minimal",
        },
      },
    );
    const document = parseDocument(serialize([rootRect]));
    expect(document.shapes[parseShapeId("root-rect-1")]?.meta.platform).toBe("androidNative");
    expect(document.shapes[parseShapeId("root-rect-1")]?.meta.style).toBe("minimal");
  });

  it("allows a root rectangle to contain child shapes", () => {
    const rootRect = createRect(
      parseShapeId("root-rect-1"),
      { x: 0, y: 0, width: 640, height: 480 },
      { parent: ROOT_ID },
    );
    const childRect = createRect(
      parseShapeId("child-rect-1"),
      { x: 10, y: 10, width: 100, height: 50 },
      { parent: parseShapeId("root-rect-1") },
    );
    const document = parseDocument(serialize([rootRect, childRect]));
    expect(document.shapes[parseShapeId("child-rect-1")]?.parent).toBe("root-rect-1");
  });

  it("rejects platform on non-root shapes (R-026)", () => {
    const input = serialize([page, section, rect]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    input.shapes["rect-1"]!.meta = { order: {}, platform: "web" };
    expect(() => parseDocument(input)).toThrow(/platform may only be set on root shapes/);
  });

  it("rejects style on non-root shapes (R-026)", () => {
    const input = serialize([page, section, rect]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    input.shapes["section-1"]!.meta = { order: {}, style: "minimal" };
    expect(() => parseDocument(input)).toThrow(/style may only be set on root shapes/);
  });

  it("validates semantic tag and properties envelope (R-044)", () => {
    const input = serialize([page, section, rect]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    input.shapes["rect-1"]!.meta = {
      order: {},
      semantic: {
        id: "button",
        platform: "web",
        properties: { variant: "primary", disabled: false, count: 5 },
      },
    };
    const document = parseDocument(input);
    expect(document.shapes[parseShapeId("rect-1")]?.meta.semantic?.properties?.variant).toBe(
      "primary",
    );

    // Reject non-primitive property values
    const invalidInput = serialize([page, section, rect]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    invalidInput.shapes["rect-1"]!.meta = {
      order: {},
      semantic: {
        id: "button",
        platform: "web",
        properties: { nested: { invalid: true } },
      },
    };
    expect(() => parseDocument(invalidInput)).toThrow(/semantic property.*must be a string/);
  });
});
