import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { createDocument } from "@open-draw/document";
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
        <ExportModal isOpen={true} onClose={vi.fn()} doc={doc} initialFormat="markdown" />,
      );

      expect(html).toContain("Export preview unavailable");
      expect(html).toContain("Invalid coordinate bounding box encountered");
    } finally {
      spy.mockRestore();
    }
  });
});
