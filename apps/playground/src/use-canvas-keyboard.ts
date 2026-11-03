import { useEffect } from "react";
import { TOOLS, type CanvasController, type ToolId } from "@open-draw/canvas";
import type { ShapeId } from "@open-draw/contracts";
import {
  COMMANDS,
  redo,
  undo,
  type Command,
  type Document,
  type HistoryState,
} from "@open-draw/document";
import {
  ACTIONS,
  KEY_CODES,
  shouldHandleKeyEvent,
  type ActionId,
  type KeyboardEventDescriptor,
} from "@open-draw/input";
import type { Gesture } from "./types";

export interface CanvasKeyboardProps {
  readonly canvasRef: React.MutableRefObject<CanvasController>;
  readonly documentRef: React.MutableRefObject<Document>;
  readonly historyRef: React.MutableRefObject<HistoryState>;
  readonly gestureRef: React.MutableRefObject<Gesture | null>;
  readonly spaceRef: React.MutableRefObject<boolean>;
  readonly setSelectedShapeId: (id: ShapeId | null) => void;
  readonly setStatusMessage: (msg: string) => void;
  readonly setDoc: (doc: Document) => void;
  readonly chooseTool: (tool: ToolId) => void;
  readonly commit: (commands: readonly Command[]) => void;
  readonly render: () => void;
}

export function useCanvasKeyboard(props: CanvasKeyboardProps): void {
  const {
    canvasRef,
    documentRef,
    historyRef,
    gestureRef,
    spaceRef,
    setSelectedShapeId,
    setStatusMessage,
    setDoc,
    chooseTool,
    commit,
    render,
  } = props;

  function executeAction(action: ActionId): void {
    const canvas = canvasRef.current;
    switch (action) {
      case ACTIONS.cancel: {
        canvas.resetMachine();
        gestureRef.current = null;
        canvas.clearSelection();
        setSelectedShapeId(null);
        chooseTool(TOOLS.select);
        setStatusMessage("Cancelled / Selection cleared");
        render();
        break;
      }
      case ACTIONS.undo: {
        const undone = undo(documentRef.current, historyRef.current);
        if (undone !== null) {
          documentRef.current = undone.document;
          historyRef.current = undone.history;
          setSelectedShapeId(canvas.getSelectedId());
          setDoc(undone.document);
          setStatusMessage("Undo performed");
          render();
        }
        break;
      }
      case ACTIONS.redo: {
        const redone = redo(documentRef.current, historyRef.current);
        if (redone !== null) {
          documentRef.current = redone.document;
          historyRef.current = redone.history;
          setSelectedShapeId(canvas.getSelectedId());
          setDoc(redone.document);
          setStatusMessage("Redo performed");
          render();
        }
        break;
      }
      case ACTIONS.deleteSelected: {
        const selectedId = canvas.getSelectedId();
        if (selectedId !== null) {
          commit([{ type: COMMANDS.deleteShape, id: selectedId }]);
          canvas.clearSelection();
          setSelectedShapeId(null);
          setStatusMessage(`Deleted shape: ${selectedId}`);
          render();
        }
        break;
      }
      case ACTIONS.selectTool: {
        chooseTool(TOOLS.select);
        break;
      }
      case ACTIONS.selectToolRect: {
        chooseTool(TOOLS.drawRect);
        break;
      }
      case ACTIONS.selectToolEllipse: {
        chooseTool(TOOLS.drawEllipse);
        break;
      }
      case ACTIONS.selectToolLine: {
        chooseTool(TOOLS.drawLine);
        break;
      }
      case ACTIONS.selectToolPenPath: {
        chooseTool(TOOLS.drawPenPath);
        break;
      }
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isEditableTarget =
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
      isEditableTarget,
    };

    if (!shouldHandleKeyEvent(descriptor)) {
      return;
    }

    if (event.code === KEY_CODES.space) {
      spaceRef.current = true;
    }

    const action = canvasRef.current.resolveAction(descriptor);
    if (action !== undefined) {
      event.preventDefault();
      executeAction(action);
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    if (event.code === KEY_CODES.space) {
      spaceRef.current = false;
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });
}
