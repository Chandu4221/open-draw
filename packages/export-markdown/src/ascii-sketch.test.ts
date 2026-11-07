import { describe, expect, it } from "vitest";
import {
  parseDocument,
  createDocument,
  createRect,
  createLine,
  createPenPath,
} from "@open-draw/document";
import { parseShapeId, ROOT_ID } from "@open-draw/contracts";
import { exportMarkdown } from "./export-markdown";
import { ASCII_SKETCH_SHAPE_THRESHOLD } from "./ascii-constants";

const PROFIE_CARD_FIXTURE = JSON.stringify({
  schema: {
    version: 1,
  },
  shapes: {
    "s-7a01": {
      id: "s-7a01",
      kind: "rect",
      parentId: "canvas:root",
      boundingBox: {
        x: 386.03,
        y: 125.25,
        width: 605.62,
        height: 319.96,
      },
      label: "Profie Card",
      meta: {
        semantic: {
          id: "card",
          platform: "web",
          properties: {
            elevation: "low",
          },
        },
        platform: "web",
        role: "component",
      },
    },
    "s-7a02": {
      id: "s-7a02",
      kind: "ellipse",
      parentId: "s-7a01",
      boundingBox: {
        x: 44.21,
        y: 53.36,
        width: 198.15,
        height: 193.05,
      },
      meta: {},
    },
    "s-7a03": {
      id: "s-7a03",
      kind: "text",
      parentId: "s-7a01",
      content: "Alex Muller",
      meta: {
        semantic: {
          id: "heading",
          platform: "web",
        },
      },
      boundingBox: {
        x: 275.09,
        y: 79.93,
        width: 100,
        height: 32,
      },
    },
    "s-7a05": {
      id: "s-7a05",
      kind: "text",
      parentId: "s-7a01",
      content: "Software developer",
      meta: {
        semantic: {
          id: "heading",
          platform: "web",
          properties: {
            level: "5",
          },
        },
      },
      boundingBox: {
        x: 271.81,
        y: 114.59,
        width: 162.54,
        height: 32.39,
      },
    },
    "s-7a06": {
      id: "s-7a06",
      kind: "rect",
      parentId: "s-7a01",
      content: "Hire Me",
      label: "Hire Me",
      meta: {
        semantic: {
          id: "button",
          platform: "web",
        },
      },
      boundingBox: {
        x: 268.45,
        y: 161.66,
        width: 222.14,
        height: 60.3,
      },
    },
  },
});

const LANDING_PAGE_7_SHAPES_FIXTURE = JSON.stringify({
  schema: { version: 1 },
  shapes: {
    "s-page": {
      id: "s-page",
      kind: "rect",
      parentId: "canvas:root",
      boundingBox: { x: 0, y: 0, width: 1200, height: 800 },
      label: "Landing Page",
      meta: {
        semantic: { id: "page", platform: "web" },
        platform: "web",
        role: "screen",
      },
    },
    "s-header": {
      id: "s-header",
      kind: "rect",
      parentId: "s-page",
      boundingBox: { x: 40, y: 40, width: 1120, height: 80 },
      label: "Header",
      meta: { semantic: { id: "navigation", platform: "web" } },
    },
    "s-title": {
      id: "s-title",
      kind: "text",
      parentId: "s-header",
      content: "Acme Inc",
      boundingBox: { x: 20, y: 24, width: 200, height: 32 },
      meta: {
        semantic: { id: "heading", platform: "web", properties: { level: "1" } },
      },
    },
    "s-hero": {
      id: "s-hero",
      kind: "rect",
      parentId: "s-page",
      boundingBox: { x: 40, y: 160, width: 1120, height: 300 },
      label: "Hero Section",
      meta: { semantic: { id: "section", platform: "web" } },
    },
    "s-cta": {
      id: "s-cta",
      kind: "rect",
      parentId: "s-hero",
      content: "Get Started",
      label: "Get Started",
      boundingBox: { x: 400, y: 200, width: 320, height: 50 },
      meta: { semantic: { id: "button", platform: "web" } },
    },
    "s-card-1": {
      id: "s-card-1",
      kind: "rect",
      parentId: "s-page",
      boundingBox: { x: 40, y: 500, width: 540, height: 240 },
      label: "Feature Alpha",
      meta: { semantic: { id: "card", platform: "web" } },
    },
    "s-card-2": {
      id: "s-card-2",
      kind: "rect",
      parentId: "s-page",
      boundingBox: { x: 620, y: 500, width: 540, height: 240 },
      label: "Feature Beta",
      meta: { semantic: { id: "card", platform: "web" } },
    },
  },
});

function createDocWithShapes(count: number) {
  const shapes = [];
  for (let i = 1; i <= count; i++) {
    shapes.push(
      createRect(
        parseShapeId(`shape-${i}`),
        { x: i * 20, y: i * 20, width: 100, height: 40 },
        { parent: ROOT_ID, label: `Shape ${i}` },
      ),
    );
  }
  return createDocument(shapes);
}

describe("ASCII layout sketch renderer (B4)", () => {
  it("omits ASCII sketch by default when shape count is <= threshold (5 shapes)", () => {
    expect(ASCII_SKETCH_SHAPE_THRESHOLD).toBe(5);
    const doc = parseDocument(PROFIE_CARD_FIXTURE);
    const md = exportMarkdown(doc);

    expect(md).not.toContain("## Layout Sketch");
    expect(md).not.toContain("ascii sketch — approximate spatial layout");
  });

  it("includes ASCII sketch when explicitly enabled via includeAsciiSketch toggle on <= 5 shapes", () => {
    const doc = parseDocument(PROFIE_CARD_FIXTURE);
    const md = exportMarkdown(doc, { includeAsciiSketch: true });

    expect(md).toContain("## Layout Sketch\n");
    expect(md).toContain(
      "ascii sketch — approximate spatial layout; boxes in tree above are exact",
    );
    expect(md).toContain("┌");
    expect(md).toContain("┘");
    expect(md).toContain("◯");
    expect(md).toContain("[ Hire Me ]");
    expect(md).toContain("Alex Muller");
  });

  it("auto-includes ASCII sketch when shape count exceeds threshold (7 shapes > 5)", () => {
    const doc = createDocWithShapes(7);
    const md = exportMarkdown(doc);

    expect(md).toContain("## Layout Sketch\n");
    expect(md).toContain(
      "ascii sketch — approximate spatial layout; boxes in tree above are exact",
    );
  });

  it("omits ASCII sketch when includeAsciiSketch is explicitly false even if > 5 shapes", () => {
    const doc = createDocWithShapes(7);
    const md = exportMarkdown(doc, { includeAsciiSketch: false });

    expect(md).not.toContain("## Layout Sketch");
    expect(md).not.toContain("ascii sketch — approximate spatial layout");
  });

  it("appends omission caption when document contains skipped line shapes", () => {
    const doc = createDocWithShapes(6);
    const line = createLine(
      parseShapeId("line-1"),
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { parent: ROOT_ID },
    );
    const docWithLine = createDocument([...Object.values(doc.shapes), line]);
    const md = exportMarkdown(docWithLine);

    expect(md).toContain("sketch omits: lines");
    expect(md).not.toContain("sketch omits: pen-paths");
  });

  it("appends omission caption when document contains skipped pen-path shapes", () => {
    const doc = createDocWithShapes(6);
    const penPath = createPenPath(
      parseShapeId("pen-1"),
      { x: 0, y: 0, width: 50, height: 50 },
      [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
      ],
      { parent: ROOT_ID },
    );
    const docWithPen = createDocument([...Object.values(doc.shapes), penPath]);
    const md = exportMarkdown(docWithPen);

    expect(md).toContain("sketch omits: pen-paths");
    expect(md).not.toContain("sketch omits: lines, pen-paths");
  });

  it("appends combined omission caption when document contains both line and pen-path shapes", () => {
    const doc = createDocWithShapes(6);
    const line = createLine(
      parseShapeId("line-1"),
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { parent: ROOT_ID },
    );
    const penPath = createPenPath(
      parseShapeId("pen-1"),
      { x: 0, y: 0, width: 50, height: 50 },
      [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
      ],
      { parent: ROOT_ID },
    );
    const docWithBoth = createDocument([...Object.values(doc.shapes), line, penPath]);
    const md = exportMarkdown(docWithBoth);

    expect(md).toContain("sketch omits: lines, pen-paths");
  });

  it("auto-includes ASCII sketch on the 7-shape landing page fixture", () => {
    const doc = parseDocument(LANDING_PAGE_7_SHAPES_FIXTURE);
    const md = exportMarkdown(doc);

    expect(md).toContain("## Layout Sketch\n");
    expect(md).toContain(
      "ascii sketch — approximate spatial layout; boxes in tree above are exact",
    );
    expect(md).toContain("Landing Page");
    expect(md).toContain("[ Get Started ]");
  });

  it("is 100% byte-stable across repeated invocations (R-041)", () => {
    const doc = parseDocument(PROFIE_CARD_FIXTURE);
    const run1 = exportMarkdown(doc, { includeAsciiSketch: true });
    const run2 = exportMarkdown(doc, { includeAsciiSketch: true });

    expect(run1).toBe(run2);
  });
});
