// Tests for documentToSvgWithLegend (F4, ADR-0006 Option A).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createDocument, createPage, createRect } from "@open-draw/document";
import { computeSceneBounds, documentToSvgWithLegend } from "./export-image";
import { documentToSvg } from "./document-to-svg";

describe("documentToSvgWithLegend (F4, ADR-0006 Option A)", () => {
  const pageId = parseShapeId("page-1");
  const rectId = parseShapeId("rect-1");
  const doc = createDocument([
    createPage(pageId, { x: 0, y: 0, width: 400, height: 300 }),
    createRect(rectId, { x: 50, y: 50, width: 100, height: 80 }, { parent: pageId }),
  ]);

  it("exports a standalone SVG with root svg tag, viewBox, and background", () => {
    const svg = documentToSvgWithLegend(doc);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('viewBox="');
    expect(svg).toContain("<rect");
    expect(svg).toContain("</svg>");
    expect(svg).not.toContain("Legend");
  });

  it("appends an expanded legend box below the scene when legendItems are provided", () => {
    const svg = documentToSvgWithLegend(doc, {
      legendItems: [
        { tag: "section", label: "Hero Section" },
        { tag: "button", label: "Primary Action" },
      ],
    });

    expect(svg).toContain("Legend");
    expect(svg).toContain("Hero Section");
    expect(svg).toContain("Primary Action");
    expect(svg).toContain("section");
    expect(svg).toContain("button");
  });

  it("escapes hostile XML in legend tags and labels", () => {
    const svg = documentToSvgWithLegend(doc, {
      legendItems: [
        {
          tag: '<script>alert("tag")</script>',
          label: 'Hostile & "Label" <script>',
        },
      ],
    });

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;alert(&quot;tag&quot;)&lt;/script&gt;");
    expect(svg).toContain("Hostile &amp; &quot;Label&quot; &lt;script&gt;");
  });

  it("handles an empty document safely", () => {
    const emptyDoc = createDocument([]);
    const svg = documentToSvgWithLegend(emptyDoc);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  describe("SVG annotations layer (Milestone 11A Work Package C)", () => {
    const taggedDoc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 400, height: 300 }),
      createRect(
        rectId,
        { x: 50, y: 50, width: 100, height: 80 },
        {
          parent: pageId,
          label: "Card Container",
          meta: {
            order: {},
            semantic: { id: "card", platform: "web" },
          },
        },
      ),
    ]);

    it("includes C1 data attributes on shape groups by default in export", () => {
      const svg = documentToSvgWithLegend(taggedDoc);
      // Page (root parent canvas:root)
      expect(svg).toContain('data-shape-id="page-1"');
      expect(svg).toContain('data-chip-id="#page-1"');
      expect(svg).not.toContain('data-parent-id="canvas:root"');

      // Rect child
      expect(svg).toContain('data-shape-id="rect-1"');
      expect(svg).toContain('data-chip-id="#rect-1"');
      expect(svg).toContain('data-semantic="card"');
      expect(svg).toContain('data-parent-id="page-1"');
    });

    it("includes C2 accessibility <title> and role/aria-label on shape groups", () => {
      const svg = documentToSvgWithLegend(taggedDoc);
      expect(svg).toContain('role="img"');
      expect(svg).toContain('aria-label="#rect-1 — Card Container"');
      expect(svg).toContain("<title>#rect-1 — Card Container</title>");
    });

    it("respects resolveDisplayName option in a11y and legend", () => {
      const svg = documentToSvgWithLegend(taggedDoc, {
        resolveDisplayName: (shape) => `${shape.label ?? shape.kind} (Card)`,
      });
      expect(svg).toContain("<title>#rect-1 — Card Container (Card)</title>");
      expect(svg).toContain('aria-label="#rect-1 — Card Container (Card)"');
    });

    it("renders C3 annotation chips layer in a top-level group", () => {
      const svg = documentToSvgWithLegend(taggedDoc);
      expect(svg).toContain('<g class="annotation-chips">');
      expect(svg).toContain("#page-1");
      expect(svg).toContain("#rect-1");
    });

    it("omits legend by default and renders C4 chip-keyed legend on demand", () => {
      const defaultSvg = documentToSvgWithLegend(taggedDoc);
      expect(defaultSvg).not.toContain("diagram-legend");

      const legendSvg = documentToSvgWithLegend(taggedDoc, {
        includeLegend: true,
        resolveDisplayName: (shape) => `${shape.label ?? shape.kind} (Card)`,
      });
      expect(legendSvg).toContain('<g class="diagram-legend">');
      expect(legendSvg).toContain("#rect-1");
      expect(legendSvg).toContain("Card Container (Card)");
    });

    it("omits data attributes and annotation chips when includeAnnotations is false", () => {
      const svg = documentToSvgWithLegend(taggedDoc, { includeAnnotations: false });
      expect(svg).not.toContain('data-shape-id="rect-1"');
      expect(svg).not.toContain('class="annotation-chips"');
    });

    it("guards live canvas render from annotations pollution", () => {
      // documentToSvg without export options must NOT include annotation layers
      const liveSvg = documentToSvg(taggedDoc);
      expect(liveSvg).not.toContain('data-shape-id="');
      expect(liveSvg).not.toContain('class="annotation-chips"');
    });

    it("accounts for strokeWidth in exported scene bounds to prevent stroke clipping", () => {
      const strokeDoc = createDocument([
        createRect(
          parseShapeId("thick-rect"),
          { x: 100, y: 100, width: 200, height: 100 },
          { stroke: "#000000", strokeWidth: 20 },
        ),
      ]);
      const bounds = computeSceneBounds(strokeDoc);
      expect(bounds.x).toBe(90);
      expect(bounds.y).toBe(90);
      expect(bounds.width).toBe(220);
      expect(bounds.height).toBe(120);
    });
    it("encloses text clip paths inside defs and specifies fill none on clipping rect to prevent black box rendering", () => {
      const textDoc = createDocument([
        createRect(
          parseShapeId("rect-clip-defs"),
          { x: 100, y: 200, width: 200, height: 100 },
          { content: "Submit Form" },
        ),
      ]);
      const svg = documentToSvgWithLegend(textDoc);
      expect(svg).toContain('<defs><clipPath id="clip-rect-clip-defs">');
      expect(svg).toContain(
        '<rect x="100" y="200" width="200" height="100" fill="none" /></clipPath></defs>',
      );
    });
  });
});
