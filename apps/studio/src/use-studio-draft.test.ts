import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROOT_ID, SHAPE_KINDS, type ShapeId } from "@open-draw/contracts";
import { createDocument, serializeDocument, type Shape } from "@open-draw/document";
import {
  clearDraftDocument,
  DRAFT_STORAGE_KEY,
  loadInitialDocument,
  saveDraftDocument,
} from "./use-studio-draft";

function createMockShape(id: string): Shape {
  return {
    id: id as ShapeId,
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 10, y: 10, width: 100, height: 50 },
    meta: { order: {} },
  };
}

describe("useStudioDraft", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      length: 0,
      key: vi.fn(),
    };
    vi.stubGlobal("localStorage", mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads empty document when localStorage has no draft", () => {
    const doc = loadInitialDocument();
    expect(Object.keys(doc.shapes)).toHaveLength(0);
  });

  it("loads and parses existing valid draft from localStorage", () => {
    const shape = createMockShape("saved-shape");
    const original = createDocument([shape]);
    store[DRAFT_STORAGE_KEY] = serializeDocument(original);

    const loaded = loadInitialDocument();
    expect(loaded.shapes[shape.id]?.id).toBe("saved-shape");
  });

  it("recovers gracefully to empty document if localStorage draft is corrupted", () => {
    store[DRAFT_STORAGE_KEY] = "{ corrupted json ";
    const loaded = loadInitialDocument();
    expect(Object.keys(loaded.shapes)).toHaveLength(0);
  });

  it("persists document to localStorage when shapes exist", () => {
    const shape = createMockShape("draft-1");
    const doc = createDocument([shape]);
    saveDraftDocument(doc);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      DRAFT_STORAGE_KEY,
      expect.stringContaining("draft-1"),
    );
  });

  it("removes draft from localStorage when document becomes empty", () => {
    const doc = createDocument([]);
    saveDraftDocument(doc);

    expect(localStorage.removeItem).toHaveBeenCalledWith(DRAFT_STORAGE_KEY);
  });

  it("explicitly clears draft with clearDraftDocument", () => {
    store[DRAFT_STORAGE_KEY] = "active-draft";
    clearDraftDocument();
    expect(localStorage.removeItem).toHaveBeenCalledWith(DRAFT_STORAGE_KEY);
  });
});
