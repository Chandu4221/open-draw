import { describe, expect, it } from "vitest";
import { DESIGN_STYLES, parseShapeId, ROOT_ID, ROOT_ROLES } from "@open-draw/contracts";
import type { Shape } from "./shape";
import { createEllipse, createPage, createRect, createSection } from "./shape";
import { DocumentError } from "./errors";
import { serializeDocument } from "./serialize-document";
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
    parentId: parseShapeId("page-1"),
  },
);
const rect = createRect(
  parseShapeId("rect-1"),
  { x: 10, y: 10, width: 200, height: 80 },
  {
    parentId: parseShapeId("section-1"),
    label: "Hero",
  },
);

describe("parseDocument", () => {
  it("parses a valid document and preserves shape data", () => {
    const document = parseDocument(serialize([page, section, rect]));
    expect(document.schema.version).toBe(1);
    expect(document.shapes[parseShapeId("rect-1")]?.label).toBe("Hero");
    expect(document.shapes[parseShapeId("rect-1")]?.parentId).toBe("section-1");
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
    input.shapes["page-1"]!.parentId = "section-1";
    delete input.shapes["page-1"]!.parent;
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("rejects a non-container parent", () => {
    const ellipse = createEllipse(
      parseShapeId("ellipse-1"),
      { x: 10, y: 10, width: 50, height: 50 },
      { parentId: parseShapeId("section-1") },
    );
    const nested = createRect(
      parseShapeId("rect-2"),
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parentId: parseShapeId("ellipse-1"),
      },
    );
    expect(() => parseDocument(serialize([page, section, ellipse, nested]))).toThrow(DocumentError);
  });

  it("allows a nested rectangle to contain child shapes for N-level nesting", () => {
    const nested = createRect(
      parseShapeId("rect-2"),
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parentId: parseShapeId("rect-1"),
      },
    );
    const doc = parseDocument(serialize([page, section, rect, nested]));
    expect(doc.shapes[parseShapeId("rect-2")]?.parentId).toBe("rect-1");
  });

  it("accepts a root child that is not a page as a freestanding shape on canvas", () => {
    const stray = createRect(
      parseShapeId("stray-1"),
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parentId: ROOT_ID,
      },
    );
    const doc = parseDocument(serialize([stray]));
    expect(doc.shapes[parseShapeId("stray-1")]?.kind).toBe("rect");
    expect(doc.shapes[parseShapeId("stray-1")]?.parentId).toBe(ROOT_ID);
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
    expect(document.shapes[parseShapeId("child-rect-1")]?.parentId).toBe("root-rect-1");
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

  it("accepts designStyle on root shapes and rejects on non-root shapes (R-026)", () => {
    const rootPage = createPage(
      parseShapeId("page-1"),
      { x: 0, y: 0, width: 1440, height: 900 },
      {
        meta: {
          order: {},
          designStyle: DESIGN_STYLES.neoBrutalism,
        },
      },
    );
    const doc = parseDocument(serialize([rootPage]));
    expect(doc.shapes[parseShapeId("page-1")]?.meta.designStyle).toBe(DESIGN_STYLES.neoBrutalism);

    const nonRootInput = serialize([page, section, rect]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    nonRootInput.shapes["rect-1"]!.meta = {
      order: {},
      designStyle: DESIGN_STYLES.neoBrutalism,
    };
    expect(() => parseDocument(nonRootInput)).toThrow(/designStyle may only be set on root shapes/);
  });

  it("rejects invalid designStyle", () => {
    const input = serialize([page]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    input.shapes["page-1"]!.meta = { order: {}, designStyle: "invalid-design-style" };
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("accepts role on root shapes and rejects on non-root shapes (R-026)", () => {
    const rootComponent = createRect(
      parseShapeId("rect-comp-1"),
      { x: 0, y: 0, width: 300, height: 200 },
      {
        parent: ROOT_ID,
        meta: {
          order: {},
          role: ROOT_ROLES.component,
        },
      },
    );
    const doc = parseDocument(serialize([rootComponent]));
    expect(doc.shapes[parseShapeId("rect-comp-1")]?.meta.role).toBe(ROOT_ROLES.component);

    // Serialization round-trip
    const serialized = serializeDocument(doc);
    expect(serialized).toContain('"role": "component"');
    const roundTripped = parseDocument(JSON.parse(serialized));
    expect(roundTripped.shapes[parseShapeId("rect-comp-1")]?.meta.role).toBe(ROOT_ROLES.component);

    const nonRootInput = serialize([page, section, rect]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    nonRootInput.shapes["rect-1"]!.meta = {
      order: {},
      role: ROOT_ROLES.component,
    };
    expect(() => parseDocument(nonRootInput)).toThrow(/role may only be set on root shapes/);
  });

  it("rejects invalid role in meta", () => {
    const input = serialize([page]) as {
      shapes: Record<string, Record<string, unknown>>;
    };
    input.shapes["page-1"]!.meta = { order: {}, role: "invalid-role" };
    expect(() => parseDocument(input)).toThrow(DocumentError);
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

  describe("document depth limits (Ruling V1, Task S2)", () => {
    function createNestedChain(depth: number): Shape[] {
      const shapes: Shape[] = [];
      const root = createPage(parseShapeId("shape-1"), { x: 0, y: 0, width: 1000, height: 1000 });
      shapes.push(root);
      for (let i = 2; i <= depth; i++) {
        const parentId = parseShapeId(`shape-${i - 1}`);
        const shapeId = parseShapeId(`shape-${i}`);
        shapes.push(
          createSection(shapeId, { x: 0, y: 0, width: 100, height: 100 }, "column", {
            parent: parentId,
          }),
        );
      }
      return shapes;
    }

    it("rejects a document nested one level over the maximum (257 levels) with documentDepthExceeded (Ruling V1, Task S2)", () => {
      const chain = createNestedChain(257);
      const input = serialize(chain);
      let thrownError: unknown;
      try {
        parseDocument(input);
      } catch (err) {
        thrownError = err;
      }
      expect(thrownError).toBeInstanceOf(DocumentError);
      expect((thrownError as DocumentError).code).toBe("documentDepthExceeded");
    });

    it("loads and preserves a document at exactly the maximum depth (256 levels)", () => {
      const chain = createNestedChain(256);
      const input = serialize(chain);
      const doc = parseDocument(input);
      expect(Object.keys(doc.shapes)).toHaveLength(256);
      expect(doc.shapes[parseShapeId("shape-256")]?.parentId).toBe("shape-255");
      const serialized = serializeDocument(doc);
      const parsed = JSON.parse(serialized) as { shapes: Record<string, unknown> };
      expect(Object.keys(parsed.shapes)).toHaveLength(256);
    });

    it("rejects a 20,000-level document in under 1 second", () => {
      const shapes: Record<string, Record<string, unknown>> = {
        "shape-1": {
          id: "shape-1",
          kind: "page",
          parent: ROOT_ID,
          boundingBox: { x: 0, y: 0, width: 100, height: 100 },
          meta: { order: {} },
        },
      };
      for (let i = 2; i <= 20000; i++) {
        shapes[`shape-${i}`] = {
          id: `shape-${i}`,
          kind: "section",
          parent: `shape-${i - 1}`,
          direction: "column",
          boundingBox: { x: 0, y: 0, width: 100, height: 100 },
          meta: { order: {} },
        };
      }
      const start = Date.now();
      let thrownError: unknown;
      try {
        parseDocument({ schema: { version: 1 }, shapes });
      } catch (err) {
        thrownError = err;
      }
      const durationMs = Date.now() - start;

      expect(thrownError).toBeInstanceOf(DocumentError);
      expect((thrownError as DocumentError).code).toBe("documentDepthExceeded");
      expect(durationMs).toBeLessThan(1000);
    });
  });

  describe("shape colors and stroke width validation (F1, R-006)", () => {
    it("parses valid hex colors and positive strokeWidth", () => {
      const shapeWithStyle = createRect(
        parseShapeId("rect-styled"),
        { x: 10, y: 10, width: 100, height: 100 },
        { parent: parseShapeId("page-1"), fill: "#ff0000", stroke: "#00ff00", strokeWidth: 3 },
      );
      const doc = parseDocument(serialize([page, shapeWithStyle]));
      const parsedShape = doc.shapes[parseShapeId("rect-styled")];
      expect(parsedShape?.fill).toBe("#ff0000");
      expect(parsedShape?.stroke).toBe("#00ff00");
      expect(parsedShape?.strokeWidth).toBe(3);
    });

    it("rejects hostile or invalid fill color", () => {
      const input = serialize([page, rect]) as {
        shapes: Record<string, Record<string, unknown>>;
      };
      input.shapes["rect-1"]!.fill = '<script>alert("xss")</script>';
      expect(() => parseDocument(input)).toThrow(DocumentError);
    });

    it("rejects negative stroke width", () => {
      const input = serialize([page, rect]) as {
        shapes: Record<string, Record<string, unknown>>;
      };
      input.shapes["rect-1"]!.strokeWidth = -4;
      expect(() => parseDocument(input)).toThrow(DocumentError);
    });

    it("parses valid string content and rejects non-string content", () => {
      const shapeWithContent = createRect(
        parseShapeId("rect-content"),
        { x: 10, y: 10, width: 100, height: 100 },
        { parent: parseShapeId("page-1"), content: "Button Text" },
      );
      const doc = parseDocument(serialize([page, shapeWithContent]));
      const parsedShape = doc.shapes[parseShapeId("rect-content")];
      expect(parsedShape?.content).toBe("Button Text");

      const invalidInput = serialize([page, shapeWithContent]) as {
        shapes: Record<string, Record<string, unknown>>;
      };
      invalidInput.shapes["rect-content"]!.content = 12345;
      expect(() => parseDocument(invalidInput)).toThrow(DocumentError);
    });
  });
});
