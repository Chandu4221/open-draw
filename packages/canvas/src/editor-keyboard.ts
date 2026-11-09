// Keyboard shortcut interaction handlers for standalone editor (R-008, R-010, R-018).
import type { ShapeId } from "@open-draw/contracts";
import {
  COMMANDS,
  pruneSelectedDescendants,
  redo,
  subtreeOf,
  undo,
  type Command,
  type Document,
  type HistoryState,
  type Shape,
} from "@open-draw/document";
import {
  ACTIONS,
  KEY_CODES,
  shouldHandleKeyEvent,
  type KeyboardEventDescriptor,
} from "@open-draw/input";
import type { CanvasController } from "./create-canvas";
import { CONTROLLER_EVENTS } from "./events";
import { TOOLS, type ToolId } from "./tools";
import { nextShapeId } from "./editor-gestures";

export interface KeyboardBindingContext {
  readonly canvas: CanvasController;
  readonly getDoc: () => Document;
  readonly setDoc: (doc: Document) => void;
  readonly getHistory: () => HistoryState;
  readonly setHistory: (history: HistoryState) => void;
  readonly setTool: (tool: ToolId) => void;
  readonly setSpacePressed: (pressed: boolean) => void;
  readonly resetGesture: () => void;
  readonly execute: (commands: readonly Command[]) => void;
  readonly render: () => void;
  readonly nextShapeId?: ((doc?: Document) => ShapeId) | undefined;
}

export function attachKeyboardListeners(ctx: KeyboardBindingContext): () => void {
  const {
    canvas,
    getDoc,
    setDoc,
    getHistory,
    setHistory,
    setTool,
    setSpacePressed,
    resetGesture,
    execute,
    render,
  } = ctx;

  let clipboard: {
    readonly shapes: readonly Shape[];
    readonly topLevelIds: readonly ShapeId[];
    count: number;
  } | null = null;

  function pasteShapes(
    shapesToPaste: readonly Shape[],
    topIdsToPaste: readonly ShapeId[],
    count: number,
  ): void {
    const offset = 20 * count;
    const doc = getDoc();
    const generateId = ctx.nextShapeId ?? nextShapeId;
    const idMap = new Map<ShapeId, ShapeId>();
    for (const s of shapesToPaste) {
      idMap.set(s.id, generateId(doc));
    }
    const topLevelSet = new Set<ShapeId>(topIdsToPaste);
    const pastedShapes: Shape[] = shapesToPaste.map((shape): Shape => {
      const isTopLevel = topLevelSet.has(shape.id);
      const newId = idMap.get(shape.id)!;
      const newParentId = isTopLevel
        ? shape.parentId
        : (idMap.get(shape.parentId) ?? shape.parentId);
      const newBoundingBox = isTopLevel
        ? {
            ...shape.boundingBox,
            x: shape.boundingBox.x + offset,
            y: shape.boundingBox.y + offset,
          }
        : shape.boundingBox;
      return {
        ...shape,
        id: newId,
        parentId: newParentId,
        boundingBox: newBoundingBox,
      };
    });
    execute(pastedShapes.map((shape) => ({ type: COMMANDS.createShape, shape })));
    const newTopLevelIds = topIdsToPaste.map((id) => idMap.get(id)!);
    canvas.selectMany(newTopLevelIds);
  }

  function onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isEditable =
      (typeof HTMLInputElement !== "undefined" && target instanceof HTMLInputElement) ||
      (typeof HTMLTextAreaElement !== "undefined" && target instanceof HTMLTextAreaElement) ||
      (typeof HTMLSelectElement !== "undefined" && target instanceof HTMLSelectElement) ||
      Boolean(target?.isContentEditable);

    const descriptor: KeyboardEventDescriptor = {
      code: event.code,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      isEditableTarget: isEditable,
    };

    if (!shouldHandleKeyEvent(descriptor)) return;
    if (event.code === KEY_CODES.space) setSpacePressed(true);

    const action = canvas.resolveAction(descriptor);
    if (action === undefined) return;

    switch (action) {
      case ACTIONS.copy: {
        const ids = canvas.getSelectedIds();
        if (ids.length > 0) {
          event.preventDefault();
          const doc = getDoc();
          const topLevelIds = pruneSelectedDescendants(doc, ids);
          const shapes: Shape[] = [];
          for (const topId of topLevelIds) {
            shapes.push(...subtreeOf(doc, topId));
          }
          clipboard = { shapes, topLevelIds, count: 0 };
          if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
            try {
              const serialized = JSON.stringify({
                type: "open-draw/clipboard",
                version: 1,
                shapes,
                topLevelIds,
              });
              void navigator.clipboard.writeText(serialized).catch(() => {});
            } catch {
              // Ignore clipboard write failures in non-secure contexts
            }
          }
        }
        break;
      }
      case ACTIONS.paste: {
        if (clipboard !== null && clipboard.shapes.length > 0) {
          event.preventDefault();
          clipboard.count += 1;
          pasteShapes(clipboard.shapes, clipboard.topLevelIds, clipboard.count);
        } else if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
          event.preventDefault();
          void navigator.clipboard
            .readText()
            .then((text) => {
              try {
                const data = JSON.parse(text);
                if (
                  data?.type === "open-draw/clipboard" &&
                  Array.isArray(data.shapes) &&
                  Array.isArray(data.topLevelIds)
                ) {
                  pasteShapes(data.shapes, data.topLevelIds, 1);
                }
              } catch {
                // Ignore non-open-draw clipboard text
              }
            })
            .catch(() => {});
        }
        break;
      }
      case ACTIONS.cancel:
        event.preventDefault();
        canvas.resetMachine();
        resetGesture();
        canvas.clearSelection();
        setTool(TOOLS.select);
        render();
        break;
      case ACTIONS.undo: {
        event.preventDefault();
        const undone = undo(getDoc(), getHistory());
        if (undone !== null) {
          setDoc(undone.document);
          setHistory(undone.history);
          canvas.emit(CONTROLLER_EVENTS.historyChanged);
          canvas.emit(CONTROLLER_EVENTS.documentChanged);
          render();
        }
        break;
      }
      case ACTIONS.redo: {
        event.preventDefault();
        const redone = redo(getDoc(), getHistory());
        if (redone !== null) {
          setDoc(redone.document);
          setHistory(redone.history);
          canvas.emit(CONTROLLER_EVENTS.historyChanged);
          canvas.emit(CONTROLLER_EVENTS.documentChanged);
          render();
        }
        break;
      }
      case ACTIONS.deleteSelected: {
        event.preventDefault();
        const ids = canvas.getSelectedIds();
        if (ids.length > 0) {
          const topLevelIds = pruneSelectedDescendants(getDoc(), ids);
          execute(topLevelIds.map((id) => ({ type: COMMANDS.deleteShape, id })));
          canvas.clearSelection();
        }
        break;
      }
      case ACTIONS.duplicate: {
        event.preventDefault();
        const ids = canvas.getSelectedIds();
        if (ids.length > 0) {
          const doc = getDoc();
          const topLevelIds = pruneSelectedDescendants(doc, ids);
          const generateId = ctx.nextShapeId ?? nextShapeId;
          const newShapeIds: Record<ShapeId, ShapeId> = {};
          for (const topId of topLevelIds) {
            for (const s of subtreeOf(doc, topId)) {
              newShapeIds[s.id] = generateId(doc);
            }
          }
          execute([
            {
              type: COMMANDS.duplicateShapes,
              ids: topLevelIds,
              dx: 20,
              dy: 20,
              newShapeIds,
            },
          ]);
          const newTopIds = topLevelIds.map((id) => newShapeIds[id]!);
          canvas.selectMany(newTopIds);
        }
        break;
      }
      case ACTIONS.selectTool:
        event.preventDefault();
        setTool(TOOLS.select);
        break;
      case ACTIONS.selectToolRect:
        event.preventDefault();
        setTool(TOOLS.drawRect);
        break;
      case ACTIONS.selectToolEllipse:
        event.preventDefault();
        setTool(TOOLS.drawEllipse);
        break;
      case ACTIONS.selectToolLine:
        event.preventDefault();
        setTool(TOOLS.drawLine);
        break;
      case ACTIONS.selectToolPenPath:
        event.preventDefault();
        setTool(TOOLS.drawPenPath);
        break;
      case ACTIONS.selectToolText:
        event.preventDefault();
        setTool(TOOLS.drawText);
        break;
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    if (event.code === KEY_CODES.space) setSpacePressed(false);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}
