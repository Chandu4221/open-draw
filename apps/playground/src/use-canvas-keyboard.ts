import { useEffect, useRef } from "react";
import { TOOLS, type CanvasController, type ToolId } from "@open-draw/canvas";
import { ROOT_ID, type ShapeId } from "@open-draw/contracts";
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
  type ActionId,
  type KeyboardEventDescriptor,
} from "@open-draw/input";
import { nextShapeId } from "./canvas-gestures";
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

  const clipboardRef = useRef<readonly Shape[] | null>(null);

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
        const ids = canvas.getSelectedIds();
        if (ids.length > 0) {
          commit(ids.map((id) => ({ type: COMMANDS.deleteShape, id })));
          canvas.clearSelection();
          setSelectedShapeId(null);
          setStatusMessage(
            ids.length === 1 ? `Deleted shape: ${ids[0]}` : `Deleted ${ids.length} shapes`,
          );
          render();
        }
        break;
      }
      case ACTIONS.duplicate: {
        const ids = canvas.getSelectedIds();
        if (ids.length > 0) {
          const doc = documentRef.current;
          const topLevelIds = pruneSelectedDescendants(doc, ids);
          if (topLevelIds.length === 0) break;

          const newShapeIds: Record<ShapeId, ShapeId> = {};
          for (const topId of topLevelIds) {
            for (const s of subtreeOf(doc, topId)) {
              newShapeIds[s.id] = nextShapeId();
            }
          }

          commit([
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
          setSelectedShapeId(newTopIds.length === 1 ? newTopIds[0]! : null);
          setStatusMessage(
            newTopIds.length === 1
              ? `Duplicated shape: ${newTopIds[0]}`
              : `Duplicated ${newTopIds.length} shapes`,
          );
          render();
        }
        break;
      }
      case ACTIONS.copy: {
        const ids = canvas.getSelectedIds();
        if (ids.length > 0) {
          const doc = documentRef.current;
          const topLevelIds = pruneSelectedDescendants(doc, ids);
          if (topLevelIds.length === 0) break;

          const copied: Shape[] = [];
          for (const topId of topLevelIds) {
            copied.push(...subtreeOf(doc, topId));
          }
          clipboardRef.current = copied;
          setStatusMessage(
            copied.length === 1
              ? `Copied shape: ${copied[0]?.id}`
              : `Copied ${copied.length} shapes`,
          );
        }
        break;
      }
      case ACTIONS.paste: {
        const clipboard = clipboardRef.current;
        if (clipboard !== null && clipboard.length > 0) {
          const clipboardIdSet = new Set(clipboard.map((s) => s.id));
          const topLevelCopied = clipboard.filter((s) => !clipboardIdSet.has(s.parent));
          if (topLevelCopied.length === 0) break;

          const idMap = new Map<ShapeId, ShapeId>();
          for (const s of clipboard) {
            idMap.set(s.id, nextShapeId());
          }

          const clonedShapes: Shape[] = clipboard.map((shape): Shape => {
            const isTopLevel = !clipboardIdSet.has(shape.parent);
            const newId = idMap.get(shape.id)!;
            const parentExists =
              shape.parent === ROOT_ID || documentRef.current.shapes[shape.parent] !== undefined;
            const newParent = isTopLevel
              ? parentExists
                ? shape.parent
                : ROOT_ID
              : (idMap.get(shape.parent) ?? ROOT_ID);
            const newBoundingBox = isTopLevel
              ? { ...shape.boundingBox, x: shape.boundingBox.x + 20, y: shape.boundingBox.y + 20 }
              : shape.boundingBox;

            return {
              ...shape,
              id: newId,
              parent: newParent,
              boundingBox: newBoundingBox,
            };
          });

          // Offset clipboard shapes so successive pastes don't overlap exactly
          clipboardRef.current = clipboard.map((shape) => {
            if (!clipboardIdSet.has(shape.parent)) {
              return {
                ...shape,
                boundingBox: {
                  ...shape.boundingBox,
                  x: shape.boundingBox.x + 20,
                  y: shape.boundingBox.y + 20,
                },
              };
            }
            return shape;
          });

          commit(clonedShapes.map((shape) => ({ type: COMMANDS.createShape, shape })));

          const newTopIds = topLevelCopied.map((s) => idMap.get(s.id)!);
          canvas.selectMany(newTopIds);
          setSelectedShapeId(newTopIds.length === 1 ? newTopIds[0]! : null);
          setStatusMessage(
            newTopIds.length === 1
              ? `Pasted shape: ${newTopIds[0]}`
              : `Pasted ${newTopIds.length} shapes`,
          );
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
