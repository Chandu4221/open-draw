import { describe, expect, it, vi } from "vitest";
import { ROOT_ID, SHAPE_KINDS, type ShapeId } from "@open-draw/contracts";
import { COMMANDS, createDocument, type Shape } from "@open-draw/document";
import type { Editor } from "@open-draw/canvas";
import type { OdToastContextValue } from "@open-draw/ui";
import { useToolbarActions } from "./use-toolbar-actions";

function createMockToast(): OdToastContextValue {
  return {
    toasts: [],
    push: vi.fn(),
    dismiss: vi.fn(),
  };
}

describe("useToolbarActions", () => {
  it("delegates handleUndo to editorRef.current.undo() without local fallback", () => {
    const doc = createDocument([]);
    const documentRef = { current: doc };
    const undoMock = vi.fn().mockReturnValue(true);
    const editorMock = {
      undo: undoMock,
      redo: vi.fn(),
      setDocument: vi.fn(),
      getSelection: vi.fn().mockReturnValue([]),
      clearSelection: vi.fn(),
      selectMany: vi.fn(),
    } as unknown as Editor;
    const editorRef = { current: editorMock };
    const toast = createMockToast();

    const actions = useToolbarActions({
      documentRef,
      editorRef,
      includeLegend: false,
      toast,
      setDoc: vi.fn(),
      setSelectedShapeId: vi.fn(),
      commit: vi.fn(),
      render: vi.fn(),
    });

    actions.handleUndo();
    expect(undoMock).toHaveBeenCalledTimes(1);
    expect(toast.push).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("delegates handleRedo to editorRef.current.redo() without local fallback", () => {
    const doc = createDocument([]);
    const documentRef = { current: doc };
    const redoMock = vi.fn().mockReturnValue(true);
    const editorMock = {
      undo: vi.fn(),
      redo: redoMock,
      setDocument: vi.fn(),
      getSelection: vi.fn().mockReturnValue([]),
      clearSelection: vi.fn(),
      selectMany: vi.fn(),
    } as unknown as Editor;
    const editorRef = { current: editorMock };
    const toast = createMockToast();

    const actions = useToolbarActions({
      documentRef,
      editorRef,
      includeLegend: false,
      toast,
      setDoc: vi.fn(),
      setSelectedShapeId: vi.fn(),
      commit: vi.fn(),
      render: vi.fn(),
    });

    actions.handleRedo();
    expect(redoMock).toHaveBeenCalledTimes(1);
    expect(toast.push).toHaveBeenCalledWith(expect.objectContaining({ type: "info" }));
  });

  it("delegates handleDelete to commit and clears selection on editor", () => {
    const shape: Shape = {
      id: "shape-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 100, height: 100 },
      meta: { order: {} },
    };
    const doc = createDocument([shape]);
    const documentRef = { current: doc };
    const clearSelectionMock = vi.fn();
    const editorMock = {
      undo: vi.fn(),
      redo: vi.fn(),
      setDocument: vi.fn(),
      getSelection: vi.fn().mockReturnValue([shape.id]),
      clearSelection: clearSelectionMock,
      selectMany: vi.fn(),
    } as unknown as Editor;
    const editorRef = { current: editorMock };
    const commitMock = vi.fn();
    const renderMock = vi.fn();
    const toast = createMockToast();

    const actions = useToolbarActions({
      documentRef,
      editorRef,
      includeLegend: false,
      toast,
      setDoc: vi.fn(),
      setSelectedShapeId: vi.fn(),
      commit: commitMock,
      render: renderMock,
    });

    actions.handleDelete();
    expect(commitMock).toHaveBeenCalledWith([
      expect.objectContaining({ type: COMMANDS.deleteShape, id: "shape-1" }),
    ]);
    expect(clearSelectionMock).toHaveBeenCalledTimes(1);
    expect(renderMock).toHaveBeenCalledTimes(1);
  });
});
