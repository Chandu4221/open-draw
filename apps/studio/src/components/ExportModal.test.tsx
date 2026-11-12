import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { createDocument } from "@open-draw/document";
import { parseShapeId, PLATFORMS, ROOT_ID, ROOT_ROLES, SHAPE_KINDS } from "@open-draw/contracts";
import { ExportModal } from "./ExportModal";
import * as DocumentIo from "../document-io";

describe("ExportModal", () => {
  it("renders live preview fallback error message when export generation throws", () => {
    const doc = createDocument([]);
    const spy = vi.spyOn(DocumentIo, "generateExportMarkdown").mockImplementation(() => {
      throw new Error("Invalid coordinate bounding box encountered");
    });

    try {
      const html = renderToString(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          doc={doc}
          initialFormat="markdown"
          initialShowPreview={true}
        />,
      );

      expect(html).toContain("Export preview unavailable");
      expect(html).toContain("Invalid coordinate bounding box encountered");
    } finally {
      spy.mockRestore();
    }
  });

  it("does not eagerly generate markdown on mount (JIT generation on demand)", () => {
    const doc = createDocument([]);
    const spy = vi.spyOn(DocumentIo, "generateExportMarkdown");
    try {
      renderToString(
        <ExportModal isOpen={true} onClose={vi.fn()} doc={doc} initialFormat="markdown" />,
      );
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("renders export scope selector when multiple roots exist on canvas", () => {
    const doc = createDocument([
      {
        id: parseShapeId("root-1"),
        parentId: ROOT_ID,
        kind: SHAPE_KINDS.rect,
        boundingBox: { x: 0, y: 0, width: 400, height: 800 },
        meta: { platform: "androidNative", order: {} },
      },
      {
        id: parseShapeId("root-2"),
        parentId: ROOT_ID,
        kind: SHAPE_KINDS.rect,
        boundingBox: { x: 500, y: 0, width: 800, height: 600 },
        meta: { platform: PLATFORMS.web, order: {} },
      },
    ]);

    const html = renderToString(
      <ExportModal isOpen={true} onClose={vi.fn()} doc={doc} initialFormat="markdown" />,
    );

    expect(html).toContain("Export Scope");
    expect(html).toContain("Entire Canvas (All Screens &amp; Platforms)");
    expect(html).toContain("androidNative");
    expect(html).toContain("web");
  });

  it("renders root screens and component containers inside export scope selector", () => {
    const doc = createDocument([
      {
        id: parseShapeId("screen-1"),
        parentId: ROOT_ID,
        kind: SHAPE_KINDS.rect,
        boundingBox: { x: 0, y: 0, width: 360, height: 720 },
        label: "Mobile Screen",
        meta: { platform: "androidNative", role: ROOT_ROLES.screen, order: {} },
      },
      {
        id: parseShapeId("comp-1"),
        parentId: ROOT_ID,
        kind: SHAPE_KINDS.rect,
        boundingBox: { x: 400, y: 0, width: 300, height: 200 },
        label: "Card Component",
        meta: { platform: "androidNative", role: ROOT_ROLES.component, order: {} },
      },
      {
        id: parseShapeId("standalone-screen"),
        parentId: ROOT_ID,
        kind: SHAPE_KINDS.rect,
        boundingBox: { x: 800, y: 0, width: 800, height: 600 },
        label: "Landing Page",
        meta: { platform: PLATFORMS.web, order: {} },
      },
    ]);

    const html = renderToString(
      <ExportModal isOpen={true} onClose={vi.fn()} doc={doc} initialFormat="markdown" />,
    );

    expect(html).toContain("Mobile Screen (androidNative)");
    expect(html).toContain("Card Component (androidNative)");
    expect(html).toContain("Landing Page (web)");
  });
});
