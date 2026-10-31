import { describe, expect, it, vi } from "vitest";
import { parseCustomShapeKind, parseShapeId } from "@open-draw/contracts";
import {
  createCustomShape,
  createDocument,
  createLine,
  createPage,
  createPenPath,
} from "@open-draw/document";
import {
  documentToSvg,
  previewLineToSvg,
  previewPenPathToSvg,
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
