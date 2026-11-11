import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { parseShapeId, ROOT_ID, SHAPE_KINDS } from "@open-draw/contracts";
import { createDocument, type Shape } from "@open-draw/document";
import { ExportPanel } from "./ExportPanel";

describe("ExportPanel", () => {
  const rootShape: Shape = {
    id: parseShapeId("screen-1"),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 0, y: 0, width: 360, height: 720 },
    label: "Login Screen",
    meta: { order: {}, platform: "androidNative" },
  };

  const rootShape2: Shape = {
    id: parseShapeId("screen-2"),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 400, y: 0, width: 360, height: 720 },
    label: "Home Screen",
    meta: { order: {}, platform: "androidNative" },
  };

  const doc = createDocument([rootShape]);
  const multiScreenDoc = createDocument([rootShape, rootShape2]);

  it("renders 2x2 format checkboxes for Markdown, JSON, PNG, and SVG", () => {
    const html = renderToString(
      <ExportPanel doc={doc} targetRootShape={rootShape} onOpenAdvancedModal={vi.fn()} />,
    );

    expect(html).toContain("Markdown");
    expect(html).toContain("JSON");
    expect(html).toContain("PNG");
    expect(html).toContain("SVG");
  });

  it("does not display format count in button when a single container is selected", () => {
    const html = renderToString(
      <ExportPanel doc={doc} targetRootShape={rootShape} onOpenAdvancedModal={vi.fn()} />,
    );

    // Must be "Export ZIP · Login Screen" without any misleading format count like (2) or (3)
    expect(html).toContain("Export ZIP · Login Screen");
    expect(html).not.toMatch(/Export ZIP \(\d+\)/);
  });

  it("displays container count when exporting entire canvas with 2 or more containers", () => {
    const html = renderToString(
      <ExportPanel
        doc={multiScreenDoc}
        targetRootShape={undefined}
        onOpenAdvancedModal={vi.fn()}
      />,
    );

    expect(html).toContain("Export ZIP (2) · Entire Canvas");
  });

  it("displays container count when 2 or more containers are selected in multi-selection", () => {
    const html = renderToString(
      <ExportPanel
        doc={multiScreenDoc}
        targetRootShape={rootShape}
        selectedShapes={[rootShape, rootShape2]}
        onOpenAdvancedModal={vi.fn()}
      />,
    );

    expect(html).toContain("Export ZIP (2) · Selected Screens");
  });

  it("labels export as Entire Canvas when no target root shape is selected on a single-screen document", () => {
    const html = renderToString(
      <ExportPanel doc={doc} targetRootShape={undefined} onOpenAdvancedModal={vi.fn()} />,
    );

    expect(html).toContain("Export ZIP · Entire Canvas");
  });
});
