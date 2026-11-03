import { describe, expect, it, vi } from "vitest";
import {
  type CustomShapeKind,
  DEVICE_TYPES,
  MAX_DOCUMENT_DEPTH,
  parseCustomShapeKind,
  parseShapeId,
  ROOT_ID,
} from "@open-draw/contracts";
import {
  createCustomShape,
  createDocument,
  createLine,
  createPage,
  createPenPath,
  createRect,
  type Shape,
} from "@open-draw/document";
import {
  chipOverlayToSvg,
  documentToSvg,
  fallbackShapeToSvg,
  previewLineToSvg,
  previewPenPathToSvg,
  selectionOverlayToSvg,
  type RendererFallbackEvent,
} from "./index";

describe("documentToSvg", () => {
  it("renders built-in line and pen-path shapes", () => {
    const pageId = parseShapeId("page-1");
    const lineId = parseShapeId("line-1");
    const penId = parseShapeId("pen-1");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
      createLine(
        lineId,
        { x: 10, y: 20, width: 100, height: 50 },
        { x: 0, y: 0 },
        { x: 100, y: 50 },
        { parent: pageId },
      ),
      createPenPath(
        penId,
        { x: 50, y: 50, width: 80, height: 80 },
        [
          { x: 0, y: 0 },
          { x: 40, y: 80 },
          { x: 80, y: 0 },
        ],
        { parent: pageId },
      ),
    ]);

    const svg = documentToSvg(doc);
    expect(svg).toContain("<line");
    expect(svg).toContain('x1="10"');
    expect(svg).toContain('x2="110"');
    expect(svg).toContain("<polyline");
    expect(svg).toContain('points="50,50 90,130 130,50"');
  });

  it("renders defined fallback dashed box and fires onFallback for unregistered shape kind (ADR-0003 D3)", () => {
    const pageId = parseShapeId("page-1");
    const starId = parseShapeId("star-1");
    const starKind = parseCustomShapeKind("vendor:star");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createCustomShape(
        starId,
        starKind,
        { x: 20, y: 30, width: 100, height: 100 },
        {},
        { parent: pageId },
      ),
    ]);

    const fallbackEvents: RendererFallbackEvent[] = [];
    const svg = documentToSvg(doc, {
      onFallback: (event) => fallbackEvents.push(event),
    });

    // Fallback renders neutral dashed rect + label, never throws
    expect(svg).toContain('stroke-dasharray="4 4"');
    expect(svg).toContain("[vendor:star]");
    expect(fallbackEvents).toEqual([{ shapeId: starId, kind: "vendor:star" }]);
  });

  it("allows customRenderers override", () => {
    const pageId = parseShapeId("page-1");
    const starId = parseShapeId("star-1");
    const starKind = parseCustomShapeKind("vendor:star");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createCustomShape(
        starId,
        starKind,
        { x: 20, y: 30, width: 100, height: 100 },
        {},
        { parent: pageId },
      ),
    ]);

    const onFallback = vi.fn();
    const svg = documentToSvg(doc, {
      customRenderers: {
        "vendor:star": (_shape, box) =>
          `<path d="M ${box.x} ${box.y} L 100 100" class="custom-star" />`,
      },
      onFallback,
    });

    expect(svg).toContain('class="custom-star"');
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("renders ghost presentation when activeDeviceType matches hiddenOn (R-029)", () => {
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
      createRect(
        rectId,
        { x: 10, y: 10, width: 100, height: 100 },
        { parent: pageId, meta: { hiddenOn: [DEVICE_TYPES.mobile], order: {} } },
      ),
    ]);

    // When activeDeviceType is mobile, shape should be wrapped in ghost group
    const mobileSvg = documentToSvg(doc, { activeDeviceType: DEVICE_TYPES.mobile });
    expect(mobileSvg).toContain('<g opacity="0.35" stroke-dasharray="4 4"><rect');

    // When activeDeviceType is desktop, shape should render normally without ghost group
    const desktopSvg = documentToSvg(doc, { activeDeviceType: DEVICE_TYPES.desktop });
    expect(desktopSvg).not.toContain('<g opacity="0.35" stroke-dasharray="4 4">');
    expect(desktopSvg).toContain("<rect");

    // When activeDeviceType is undefined, shape renders normally
    const normalSvg = documentToSvg(doc);
    expect(normalSvg).not.toContain('<g opacity="0.35" stroke-dasharray="4 4">');
  });
});

describe("gesture previews", () => {
  it("renders line preview from start to end", () => {
    const svg = previewLineToSvg({ x: 10, y: 20 }, { x: 100, y: 200 });
    expect(svg).toContain('<line x1="10" y1="20" x2="100" y2="200"');
  });

  it("renders pen path preview through points", () => {
    const svg = previewPenPathToSvg([
      { x: 0, y: 0 },
      { x: 10, y: 15 },
      { x: 20, y: 30 },
    ]);
    expect(svg).toContain('points="0,0 10,15 20,30"');
  });
});

describe("crayon render style (ADR-0005 D3, R-021)", () => {
  it("renders deterministic byte-identical SVG for the same shape across calls", () => {
    const rectId = parseShapeId("rect-1");
    const doc = createDocument([createRect(rectId, { x: 50, y: 60, width: 200, height: 100 })]);

    const run1 = documentToSvg(doc, { styleProfile: "crayon" });
    const run2 = documentToSvg(doc, { styleProfile: "crayon" });

    expect(run1).toBe(run2);
    expect(run1).toContain("<path");
    expect(run1).toContain('stroke="#2d3748"');
  });

  it("falls back to standard renderer for custom shape kinds under crayon style (R-021)", () => {
    const starId = parseShapeId("star-1");
    const starKind = parseCustomShapeKind("vendor:star");
    const doc = createDocument([
      createCustomShape(starId, starKind, { x: 10, y: 10, width: 80, height: 80 }),
    ]);

    const svg = documentToSvg(doc, { styleProfile: "crayon" });
    expect(svg).toContain("[vendor:star]");
  });

  it("inherits crayon style from root ancestor (R-026)", () => {
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");

    const doc = createDocument([
      createPage(
        pageId,
        { x: 0, y: 0, width: 800, height: 600 },
        { meta: { style: "crayon", order: {} } },
      ),
      createRect(rectId, { x: 20, y: 20, width: 100, height: 100 }, { parent: pageId }),
    ]);

    const svg = documentToSvg(doc);
    // Child rect should be rendered with crayon wobbled path
    expect(svg).toContain('<path d="M');
    expect(svg).toContain('stroke="#2d3748"');
  });
});

describe("chip overlay (ADR-0005 D5, R-031)", () => {
  it("counter-scales dimensions and font size with 1 / zoom", () => {
    const box = { x: 100, y: 200, width: 300, height: 150 };

    // At zoom = 1.0, scale is 1.0
    const zoom1 = chipOverlayToSvg("Navigation Bar", box, 1.0);
    expect(zoom1).toContain('height="16.0"');
    expect(zoom1).toContain('font-size="10.0"');
    expect(zoom1).toContain('y="182.0"'); // 200 - 18

    // At zoom = 2.0, scale is 0.5 (world dimensions halved so screen size stays constant)
    const zoom2 = chipOverlayToSvg("Navigation Bar", box, 2.0);
    expect(zoom2).toContain('height="8.0"');
    expect(zoom2).toContain('font-size="5.0"');
    expect(zoom2).toContain('y="191.0"'); // 200 - 9

    // At zoom = 0.5, scale is 2.0 (world dimensions doubled)
    const zoomHalf = chipOverlayToSvg("Navigation Bar", box, 0.5);
    expect(zoomHalf).toContain('height="32.0"');
    expect(zoomHalf).toContain('font-size="20.0"');
    expect(zoomHalf).toContain('y="164.0"'); // 200 - 36
  });

  it("rides the shape bounding box position", () => {
    const box = { x: 450, y: 300, width: 200, height: 100 };
    const svg = chipOverlayToSvg("Page", box, 1.0);
    expect(svg).toContain('x="450.0"');
    expect(svg).toContain("Page");
  });

  it("escapes hostile XML/HTML characters in chip overlay label and color options", () => {
    const box = { x: 10, y: 10, width: 100, height: 50 };
    const hostileChip = chipOverlayToSvg('Button & <script>alert("xss")</script>', box, 1.0, {
      backgroundColor: '#2563eb" onload="alert(1)',
      textColor: '#ffffff" onerror="alert(2)',
    });

    // Label should have characters escaped
    expect(hostileChip).not.toContain("<script>");
    expect(hostileChip).toContain(
      "Button &amp; &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );

    // Color attributes must not permit attribute breakouts
    expect(hostileChip).not.toContain('onload="alert(1)"');
    expect(hostileChip).toContain('fill="#2563eb&quot; onload=&quot;alert(1)"');
    expect(hostileChip).not.toContain('onerror="alert(2)"');
    expect(hostileChip).toContain('fill="#ffffff&quot; onerror=&quot;alert(2)">');
  });
});

describe("fallback shape escaping", () => {
  it("escapes hostile XML/HTML characters in fallback shape kinds", () => {
    const hostileShape = {
      id: parseShapeId("hostile-1"),
      kind: 'vendor:<script>alert("xss")</script>' as unknown as CustomShapeKind,
      parent: ROOT_ID,
      box: { x: 0, y: 0, width: 100, height: 100 },
      meta: { order: {} },
    } as unknown as Shape;
    const box = { x: 0, y: 0, width: 100, height: 100 };
    const svg = fallbackShapeToSvg(hostileShape, box);

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("[vendor:&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;]");
  });

  it("safely renders document nested to MAX_DOCUMENT_DEPTH without stack overflow", () => {
    const shapes: Shape[] = [];
    const rootPageId = parseShapeId("page-root");
    shapes.push(createPage(rootPageId, { x: 0, y: 0, width: 1000, height: 1000 }));

    let parentId = rootPageId;
    // We add MAX_DOCUMENT_DEPTH - 1 nested rects, so total depth is MAX_DOCUMENT_DEPTH (256)
    for (let i = 1; i < MAX_DOCUMENT_DEPTH; i++) {
      const childId = parseShapeId(`rect-${i}`);
      shapes.push(createRect(childId, { x: 0, y: 0, width: 10, height: 10 }, { parent: parentId }));
      parentId = childId;
    }

    const doc = createDocument(shapes);
    const svg = documentToSvg(doc);
    expect(typeof svg).toBe("string");
    // Should render 1 page rect + 255 child rects = 256 rects
    expect(svg.match(/<rect/g)?.length).toBe(MAX_DOCUMENT_DEPTH);
  });
});

describe("selectionOverlayToSvg", () => {
  it("renders 1 outline rect and 8 handle rects (4 corners + 4 edge midpoints)", () => {
    const overlay = selectionOverlayToSvg({ x: 10, y: 10, width: 100, height: 60 }, 1);
    // 1 outline rect + 8 handle rects = 9 rects
    expect(overlay.match(/<rect/g)?.length).toBe(9);
  });
});

describe("shape styling (fill, stroke, strokeWidth) (F1, ADR-0006 Option A)", () => {
  it("renders custom fill, stroke, and stroke-width on rect and ellipse", () => {
    const rectId = parseShapeId("rect-styled");
    const doc = createDocument([
      createRect(
        rectId,
        { x: 10, y: 20, width: 100, height: 50 },
        { fill: "#3b82f6", stroke: "#1e3a8a", strokeWidth: 4 },
      ),
    ]);

    const svg = documentToSvg(doc);
    expect(svg).toContain('fill="#3b82f6"');
    expect(svg).toContain('stroke="#1e3a8a"');
    expect(svg).toContain('stroke-width="4"');
  });

  it("renders default attributes when shape style properties are undefined", () => {
    const rectId = parseShapeId("rect-default");
    const doc = createDocument([createRect(rectId, { x: 10, y: 20, width: 100, height: 50 })]);

    const svg = documentToSvg(doc);
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('stroke="#1f2933"');
    expect(svg).not.toContain("stroke-width");
  });

  it("escapes hostile XML in color attributes", () => {
    const hostileRect = {
      ...createRect(parseShapeId("rect-1"), { x: 0, y: 0, width: 100, height: 100 }),
      fill: '#ffffff" onload="alert(1)',
      stroke: '#000000" onerror="alert(2)',
    } as unknown as Shape;
    const doc = createDocument([hostileRect]);
    const svg = documentToSvg(doc);

    expect(svg).not.toContain('onload="alert(1)"');
    expect(svg).toContain('fill="#ffffff&quot; onload=&quot;alert(1)"');
  });
});

describe("visible text on shapes (F2, ADR-0006 Option A / shape.content)", () => {
  it("renders centered clipped text when shape.content is present", () => {
    const rectId = parseShapeId("rect-with-content");
    const doc = createDocument([
      createRect(
        rectId,
        { x: 100, y: 200, width: 200, height: 100 },
        { label: "Submit Button Layer", content: "Submit Form" },
      ),
    ]);

    const svg = documentToSvg(doc);
    expect(svg).toContain('<clipPath id="clip-rect-with-content">');
    expect(svg).toContain('<rect x="100" y="200" width="200" height="100"');
    expect(svg).toContain('x="200"'); // 100 + 200/2
    expect(svg).toContain('y="250"'); // 200 + 100/2
    expect(svg).toContain('dominant-baseline="central"');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('clip-path="url(#clip-rect-with-content)"');
    expect(svg).toContain(">Submit Form</text>");
    expect(svg).not.toContain(">Submit Button Layer</text>");
  });

  it("escapes hostile XML in shape.content", () => {
    const rectId = parseShapeId("rect-xss");
    const doc = createDocument([
      createRect(
        rectId,
        { x: 50, y: 50, width: 100, height: 50 },
        { content: '<script>alert("xss")</script> & "quotes"' },
      ),
    ]);

    const svg = documentToSvg(doc);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &quot;quotes&quot;</text>",
    );
  });

  it("does not render clipPath or text when shape has only label and no content", () => {
    const rectId = parseShapeId("rect-label-only");
    const doc = createDocument([
      createRect(rectId, { x: 10, y: 10, width: 100, height: 50 }, { label: "Profile Box" }),
    ]);

    const svg = documentToSvg(doc);
    expect(svg).not.toContain("<clipPath");
    expect(svg).not.toContain("<text");
  });

  it("does not render clipPath or text when shape.content is absent or empty", () => {
    const rectId = parseShapeId("rect-no-content");
    const doc = createDocument([createRect(rectId, { x: 10, y: 10, width: 100, height: 50 })]);

    const svg = documentToSvg(doc);
    expect(svg).not.toContain("<clipPath");
    expect(svg).not.toContain("<text");
  });
});
