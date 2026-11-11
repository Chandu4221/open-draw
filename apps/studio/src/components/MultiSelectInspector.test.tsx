import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { parseShapeId, ROOT_ID, SHAPE_KINDS } from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import { MultiSelectInspector } from "./MultiSelectInspector";

function createMockRect(id: string): Shape {
  return {
    id: parseShapeId(id),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 0, y: 0, width: 100, height: 100 },
    meta: { order: {} },
  };
}

function createMockEllipse(id: string): Shape {
  return {
    id: parseShapeId(id),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.ellipse,
    boundingBox: { x: 0, y: 0, width: 100, height: 100 },
    meta: { order: {} },
  };
}

describe("MultiSelectInspector", () => {
  it("renders consistent OdCard sections for Selection, Align & Distribute, Shared Style, and Actions", () => {
    const s1 = createMockRect("s1");
    const s2 = createMockEllipse("s2");

    const html = renderToString(
      <MultiSelectInspector
        selectedShapes={[s1, s2]}
        onAlign={vi.fn()}
        onDistribute={vi.fn()}
        onBatchStyleChange={vi.fn()}
        onBatchDelete={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );

    // Section 1: Selection
    expect(html).toContain("Selection");
    expect(html).toContain("1 rect, 1 ellipse");
    expect(html).toContain("Clear");

    // Section 2: Unified Align & Distribute
    expect(html).toContain("Align &amp; Distribute");
    expect(html).toContain("Alignment");
    expect(html).toContain("Distribution");
    expect(html).toContain("Horizontal");
    expect(html).toContain("Vertical");

    // Section 3: Shared Style
    expect(html).toContain("Shared Style");
    expect(html).toContain("Fill");
    expect(html).toContain("Stroke");
    expect(html).toContain("Stroke Width");
    expect(html).toContain("PX");

    // Section 4: Actions
    expect(html).toContain("Actions");
    expect(html).toMatch(/Delete.*2.*Shapes/);
  });

  it("disables distribution when fewer than 3 shapes are selected", () => {
    const s1 = createMockRect("s1");
    const s2 = createMockRect("s2");

    const html = renderToString(
      <MultiSelectInspector
        selectedShapes={[s1, s2]}
        onAlign={vi.fn()}
        onDistribute={vi.fn()}
        onBatchStyleChange={vi.fn()}
        onBatchDelete={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );

    expect(html).toContain("Requires 3+ shapes");
    expect(html).toContain("disabled");
  });

  it("enables distribution when 3 or more shapes are selected", () => {
    const s1 = createMockRect("s1");
    const s2 = createMockRect("s2");
    const s3 = createMockRect("s3");

    const html = renderToString(
      <MultiSelectInspector
        selectedShapes={[s1, s2, s3]}
        onAlign={vi.fn()}
        onDistribute={vi.fn()}
        onBatchStyleChange={vi.fn()}
        onBatchDelete={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );

    expect(html).not.toContain("Requires 3+ shapes");
    expect(html).toContain("3 rects");
  });
});
