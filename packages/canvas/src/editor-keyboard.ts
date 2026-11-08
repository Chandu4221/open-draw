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

  function onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isEditable =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
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
    if (action !== undefined) {
      event.preventDefault();
      switch (action) {
        case ACTIONS.cancel:
          canvas.resetMachine();
          resetGesture();
          canvas.clearSelection();
          setTool(TOOLS.select);
          render();
          break;
        case ACTIONS.undo: {
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
          const ids = canvas.getSelectedIds();
          if (ids.length > 0) {
            execute(ids.map((id) => ({ type: COMMANDS.deleteShape, id })));
            canvas.clearSelection();
          }
          break;
        }
        case ACTIONS.duplicate: {
          const ids = canvas.getSelectedIds();
          if (ids.length > 0) {
            const doc = getDoc();
            const topLevelIds = pruneSelectedDescendants(doc, ids);
            const newShapeIds: Record<ShapeId, ShapeId> = {};
            for (const topId of topLevelIds) {
              for (const s of subtreeOf(doc, topId)) {
                newShapeIds[s.id] = nextShapeId();
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
          setTool(TOOLS.select);
          break;
        case ACTIONS.selectToolRect:
          setTool(TOOLS.drawRect);
          break;
        case ACTIONS.selectToolEllipse:
          setTool(TOOLS.drawEllipse);
          break;
        case ACTIONS.selectToolLine:
          setTool(TOOLS.drawLine);
          break;
        case ACTIONS.selectToolPenPath:
          setTool(TOOLS.drawPenPath);
          break;
        case ACTIONS.selectToolText:
          setTool(TOOLS.drawText);
          break;
      }
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
