import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROOT_ID, SHAPE_KINDS, type ShapeId } from "@open-draw/canvas";
import { PLATFORMS } from "@open-draw/profiles";
import { createDocument, parseDocument, type Document, type Shape } from "@open-draw/canvas";
import {
  extractDocumentLegendItems,
  generateExportJson,
  generateExportMarkdown,
  generateExportSvg,
  generateSaveDocumentJson,
  exportDocumentJson,
  exportDocumentMarkdown,
  exportDocumentSvg,
  saveDocumentJson,
  promptLoadDocumentJson,
} from "./document-io";

function createMockShape(
  id: string,
  parentId = ROOT_ID,
  meta: Shape["meta"] = { order: {} },
): Shape {
  return {
    id: id as ShapeId,
    parentId,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 10, y: 10, width: 120, height: 60 },
    meta,
  };
}

describe("document-io", () => {
  let originalDocument: unknown;
  let originalUrl: unknown;

  beforeEach(() => {
    originalDocument = globalThis.document;
    originalUrl = globalThis.URL;
  });

  afterEach(() => {
    // Restore globals
    if (originalDocument !== undefined) {
      globalThis.document = originalDocument as Document & typeof globalThis.document;
    } else {
      // @ts-expect-error cleanup mock
      delete globalThis.document;
    }
    if (originalUrl !== undefined) {
      globalThis.URL = originalUrl as typeof URL;
    } else {
      // @ts-expect-error cleanup mock
      delete globalThis.URL;
    }
  });

  it("extracts unique semantic tags and display names for legend items", () => {
    const rootShape = createMockShape("root-1", ROOT_ID, {
      order: {},
      platform: PLATFORMS.web,
    });
    const s1 = createMockShape("s1", "root-1" as ShapeId, {
      order: {},
      semantic: { id: "button", platform: PLATFORMS.web },
    });
    const s2 = createMockShape("s2", "root-1" as ShapeId, {
      order: {},
      semantic: { id: "button", platform: PLATFORMS.web },
    });
    const doc: Document = {
      ...createDocument(),
      shapes: {
        [rootShape.id]: rootShape,
        [s1.id]: s1,
        [s2.id]: s2,
      },
    };

    const legendItems = extractDocumentLegendItems(doc);

    expect(legendItems).toHaveLength(1);
    expect(legendItems[0]?.tag).toBe("button");
    expect(legendItems[0]?.label).toBe("Button");
  });

  it("generates export SVG containing shape elements", () => {
    const s1 = createMockShape("s1");
    const doc: Document = {
      ...createDocument(),
      shapes: { [s1.id]: s1 },
    };

    const svg = generateExportSvg(doc);

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('data-shape-id="s1"');
  });

  it("generates export JSON string conforming to schema", () => {
    const s1 = createMockShape("s1");
    const doc: Document = {
      ...createDocument(),
      shapes: { [s1.id]: s1 },
    };

    const jsonStr = generateExportJson(doc);
    const parsed = JSON.parse(jsonStr) as {
      schema: { version: string };
      shapes: Record<string, unknown>;
    };

    expect(parsed.schema).toBeDefined();
    expect(parsed.shapes["s1"]).toBeDefined();
  });

  it("generates markdown document export", () => {
    const s1 = createMockShape("s1");
    const doc: Document = {
      ...createDocument(),
      shapes: { [s1.id]: s1 },
    };

    const md = generateExportMarkdown(doc);

    expect(typeof md).toBe("string");
    expect(md.length).toBeGreaterThan(0);
  });

  it("triggers SVG download with correct filename and cleans up object URL", () => {
    const s1 = createMockShape("s1");
    const doc: Document = {
      ...createDocument(),
      shapes: { [s1.id]: s1 },
    };

    const mockAnchor = { href: "", download: "", click: vi.fn() };
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-svg-url");
    const revokeObjectURL = vi.fn();

    // @ts-expect-error mock DOM
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
    };
    // @ts-expect-error mock URL
    globalThis.URL = { createObjectURL, revokeObjectURL };

    exportDocumentSvg(doc);

    expect(mockAnchor.download).toBe("opendraw-diagram.svg");
    expect(mockAnchor.href).toBe("blob:mock-svg-url");
    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-svg-url");
  });

  it("serializes full document for save and round-trips via parseDocument", () => {
    const s1 = createMockShape("s1");
    const doc = createDocument([s1]);
    const jsonStr = generateSaveDocumentJson(doc);
    const parsed = parseDocument(jsonStr);
    expect(parsed.schema.version).toBe(1);
    expect(parsed.shapes[s1.id]?.id).toBe(s1.id);
  });

  it("triggers document save download with opendraw-document.json", () => {
    const doc = createDocument();
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-save-url");
    const revokeObjectURL = vi.fn();

    // @ts-expect-error mock DOM
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
    };
    // @ts-expect-error mock URL
    globalThis.URL = { createObjectURL, revokeObjectURL };

    saveDocumentJson(doc);

    expect(mockAnchor.download).toBe("opendraw-document.json");
    expect(mockAnchor.href).toBe("blob:mock-save-url");
    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-save-url");
  });

  it("triggers JSON document export download", () => {
    const doc = createDocument();
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-json-url");
    const revokeObjectURL = vi.fn();

    // @ts-expect-error mock DOM
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
    };
    // @ts-expect-error mock URL
    globalThis.URL = { createObjectURL, revokeObjectURL };

    exportDocumentJson(doc);

    expect(mockAnchor.download).toBe("opendraw-document.json");
    expect(mockAnchor.href).toBe("blob:mock-json-url");
    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-json-url");
  });

  it("triggers Markdown document export download", () => {
    const doc = createDocument();
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-md-url");
    const revokeObjectURL = vi.fn();

    // @ts-expect-error mock DOM
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
    };
    // @ts-expect-error mock URL
    globalThis.URL = { createObjectURL, revokeObjectURL };

    exportDocumentMarkdown(doc);

    expect(mockAnchor.download).toBe("opendraw-document.md");
    expect(mockAnchor.href).toBe("blob:mock-md-url");
    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-md-url");
  });

  it("triggers Markdown export download with custom filename when options.filename is provided (R-042)", () => {
    const doc = createDocument();
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-md-url");
    const revokeObjectURL = vi.fn();

    // @ts-expect-error mock DOM
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
    };
    // @ts-expect-error mock URL
    globalThis.URL = { createObjectURL, revokeObjectURL };

    exportDocumentMarkdown(doc, { filename: "profile-card.md" });

    expect(mockAnchor.download).toBe("profile-card.md");
  });

  it("triggers JSON export download with custom filename when options.filename is provided (R-042)", () => {
    const doc = createDocument();
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-json-url");
    const revokeObjectURL = vi.fn();

    // @ts-expect-error mock DOM
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
    };
    // @ts-expect-error mock URL
    globalThis.URL = { createObjectURL, revokeObjectURL };

    exportDocumentJson(doc, { filename: "profile-card.json" });

    expect(mockAnchor.download).toBe("profile-card.json");
  });

  it("triggers SVG export download with custom filename when options.filename is provided (R-042)", () => {
    const doc = createDocument();
    const mockAnchor = { href: "", download: "", click: vi.fn() };
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-svg-url");
    const revokeObjectURL = vi.fn();

    // @ts-expect-error mock DOM
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockAnchor),
    };
    // @ts-expect-error mock URL
    globalThis.URL = { createObjectURL, revokeObjectURL };

    exportDocumentSvg(doc, { filename: "profile-card.svg" });

    expect(mockAnchor.download).toBe("profile-card.svg");
  });

  it("prompts file picker and parses loaded document JSON", async () => {
    const validDoc = createDocument();
    const jsonText = JSON.stringify(validDoc);

    const mockFile = {
      text: vi.fn().mockResolvedValue(jsonText),
    };
    const mockInput: {
      type: string;
      accept: string;
      files: unknown[];
      onchange: (() => Promise<void>) | null;
      click: () => void;
    } = {
      type: "",
      accept: "",
      files: [mockFile],
      onchange: null,
      click: vi.fn(),
    };

    // @ts-expect-error mock DOM
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockInput),
    };

    const onLoaded = vi.fn();
    const onError = vi.fn();

    promptLoadDocumentJson(onLoaded, onError);

    expect(mockInput.type).toBe("file");
    expect(mockInput.accept).toBe(".json");
    expect(mockInput.click).toHaveBeenCalledTimes(1);

    // Simulate file selection
    await mockInput.onchange?.();

    expect(onLoaded).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("rejects files exceeding MAX_LOAD_FILE_SIZE_BYTES (10 MB) and clears input value", async () => {
    const mockFile = {
      size: 15 * 1024 * 1024,
      text: vi.fn(),
    };
    const mockInput = {
      type: "",
      accept: "",
      value: "something.json",
      files: [mockFile],
      onchange: null as (() => Promise<void>) | null,
      click: vi.fn(),
    };

    // @ts-expect-error mock DOM
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockInput),
    };

    const onLoaded = vi.fn();
    const onError = vi.fn();

    promptLoadDocumentJson(onLoaded, onError);
    await mockInput.onchange?.();

    expect(onLoaded).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("exceeds maximum allowed limit"),
      }),
    );
    expect(mockInput.value).toBe("");
  });
});
