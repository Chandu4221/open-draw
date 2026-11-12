// Keyboard shortcut interaction handlers for standalone editor (R-008, R-010, R-018).
import {
  MAX_COORDINATE_BOUND,
  MAX_PASTE_SHAPE_COUNT,
  ROOT_ID,
  type ShapeId,
} from "@open-draw/contracts";
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
  type ShapeMeta,
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

export interface KeyboardBindingContext {
  readonly canvas: CanvasController;
  readonly container?: HTMLElement | undefined;
  readonly svg?: SVGSVGElement | undefined;
  readonly getDoc: () => Document;
  readonly setDoc: (doc: Document) => void;
  readonly getHistory: () => HistoryState;
  readonly setHistory: (history: HistoryState) => void;
  readonly setTool: (tool: ToolId) => void;
  readonly setSpacePressed: (pressed: boolean) => void;
  readonly resetGesture: () => void;
  readonly execute: (commands: readonly Command[]) => void;
  readonly render: () => void;
  readonly nextShapeId: (doc?: Document) => ShapeId;
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

  let copySequence = 0;
  let clipboard: {
    readonly copyId: string;
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
    const generateId = ctx.nextShapeId;
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

    const activeEl = typeof document !== "undefined" ? document.activeElement : null;
    if (
      activeEl &&
      activeEl !== (typeof document !== "undefined" ? document.body : null) &&
      ctx.container &&
      !ctx.container.contains(activeEl as Node) &&
      (activeEl as Node) !== ctx.svg
    ) {
      return;
    }
    if (
      target &&
      target !== (typeof window !== "undefined" ? (window as unknown as HTMLElement) : null) &&
      target !== (typeof document !== "undefined" ? document.body : null) &&
      ctx.container &&
      !ctx.container.contains(target) &&
      (target as Node) !== ctx.svg
    ) {
      return;
    }

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
          copySequence += 1;
          const copyId = `cp-${copySequence}`;
          clipboard = { copyId, shapes, topLevelIds, count: 0 };
          if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
            try {
              const serialized = JSON.stringify({
                type: "open-draw/clipboard",
                version: 1,
                copyId,
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
        event.preventDefault();
        const fallbackToLocal = (): void => {
          if (clipboard !== null && clipboard.shapes.length > 0) {
            clipboard.count += 1;
            pasteShapes(clipboard.shapes, clipboard.topLevelIds, clipboard.count);
          }
        };

        if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
          void navigator.clipboard
            .readText()
            .then((text) => {
              try {
                const data = JSON.parse(text);
                let candidateShapes: unknown[] | null = null;
                let topLevelIds: ShapeId[] | null = null;
                let payloadCopyId: string | undefined = undefined;

                if (
                  data?.type === "open-draw/clipboard" &&
                  Array.isArray(data.shapes) &&
                  Array.isArray(data.topLevelIds)
                ) {
                  candidateShapes = data.shapes;
                  topLevelIds = data.topLevelIds as ShapeId[];
                  payloadCopyId = typeof data.copyId === "string" ? data.copyId : undefined;
                } else if (
                  typeof data === "object" &&
                  data !== null &&
                  typeof data.shapes === "object" &&
                  data.shapes !== null &&
                  !Array.isArray(data.shapes)
                ) {
                  const shapesObj = data.shapes as Record<string, unknown>;
                  const shapeKeys = Array.isArray(data.shapeOrder)
                    ? data.shapeOrder.filter(
                        (k: unknown) => typeof k === "string" && shapesObj[k] !== undefined,
                      )
                    : Object.keys(shapesObj);
                  const shapesList = shapeKeys.map((k: string) => shapesObj[k]);
                  candidateShapes = shapesList;
                  topLevelIds = shapesList
                    .filter(
                      (s: unknown): s is { id: ShapeId; parentId: ShapeId } =>
                        typeof s === "object" &&
                        s !== null &&
                        typeof (s as { id?: unknown }).id === "string" &&
                        typeof (s as { parentId?: unknown }).parentId === "string" &&
                        ((s as { parentId: string }).parentId === ROOT_ID ||
                          !shapesObj[(s as { parentId: string }).parentId]),
                    )
                    .map((s: { id: ShapeId }) => s.id);
                }

                if (candidateShapes !== null && topLevelIds !== null) {
                  if (
                    clipboard !== null &&
                    payloadCopyId !== undefined &&
                    payloadCopyId === clipboard.copyId
                  ) {
                    clipboard.count += 1;
                    pasteShapes(clipboard.shapes, clipboard.topLevelIds, clipboard.count);
                    return;
                  }

                  if (candidateShapes.length > MAX_PASTE_SHAPE_COUNT) {
                    return;
                  }

                  const sanitizedShapes: Shape[] = [];
                  for (const raw of candidateShapes) {
                    if (
                      typeof raw === "object" &&
                      raw !== null &&
                      !Object.prototype.hasOwnProperty.call(raw, "__proto__") &&
                      typeof (raw as Record<string, unknown>).id === "string" &&
                      typeof (raw as Record<string, unknown>).kind === "string" &&
                      typeof (raw as Record<string, unknown>).parentId === "string" &&
                      typeof (raw as Record<string, unknown>).boundingBox === "object" &&
                      (raw as Record<string, unknown>).boundingBox !== null &&
                      typeof (raw as { boundingBox: Record<string, unknown> }).boundingBox.x ===
                        "number" &&
                      Number.isFinite((raw as { boundingBox: { x: number } }).boundingBox.x) &&
                      Math.abs((raw as { boundingBox: { x: number } }).boundingBox.x) <=
                        MAX_COORDINATE_BOUND &&
                      typeof (raw as { boundingBox: Record<string, unknown> }).boundingBox.y ===
                        "number" &&
                      Number.isFinite((raw as { boundingBox: { y: number } }).boundingBox.y) &&
                      Math.abs((raw as { boundingBox: { y: number } }).boundingBox.y) <=
                        MAX_COORDINATE_BOUND &&
                      typeof (raw as { boundingBox: Record<string, unknown> }).boundingBox.width ===
                        "number" &&
                      Number.isFinite(
                        (raw as { boundingBox: { width: number } }).boundingBox.width,
                      ) &&
                      (raw as { boundingBox: { width: number } }).boundingBox.width > 0 &&
                      (raw as { boundingBox: { width: number } }).boundingBox.width <=
                        MAX_COORDINATE_BOUND &&
                      typeof (raw as { boundingBox: Record<string, unknown> }).boundingBox
                        .height === "number" &&
                      Number.isFinite(
                        (raw as { boundingBox: { height: number } }).boundingBox.height,
                      ) &&
                      (raw as { boundingBox: { height: number } }).boundingBox.height > 0 &&
                      (raw as { boundingBox: { height: number } }).boundingBox.height <=
                        MAX_COORDINATE_BOUND
                    ) {
                      const rawMeta =
                        typeof (raw as Record<string, unknown>).meta === "object" &&
                        (raw as Record<string, unknown>).meta !== null &&
                        !Array.isArray((raw as Record<string, unknown>).meta)
                          ? {
                              ...((raw as Record<string, unknown>).meta as Record<string, unknown>),
                            }
                          : {};
                      if (rawMeta.semantic === null) {
                        delete rawMeta.semantic;
                      }
                      if (
                        typeof rawMeta.order !== "object" ||
                        rawMeta.order === null ||
                        Array.isArray(rawMeta.order)
                      ) {
                        rawMeta.order = {};
                      }
                      sanitizedShapes.push({
                        ...(raw as Shape),
                        meta: rawMeta as unknown as ShapeMeta,
                      });
                    }
                  }

                  if (
                    sanitizedShapes.length === candidateShapes.length &&
                    sanitizedShapes.length > 0
                  ) {
                    const validTopLevelIds = topLevelIds.filter((id) =>
                      sanitizedShapes.some((s) => s.id === id),
                    );
                    const effectiveTopLevelIds =
                      validTopLevelIds.length > 0
                        ? validTopLevelIds
                        : sanitizedShapes.filter((s) => s.parentId === ROOT_ID).map((s) => s.id);

                    clipboard = {
                      copyId: payloadCopyId ?? "external",
                      shapes: sanitizedShapes,
                      topLevelIds: effectiveTopLevelIds,
                      count: 1,
                    };
                    pasteShapes(sanitizedShapes, effectiveTopLevelIds, 1);
                    return;
                  }
                }
              } catch {
                // Ignore non-open-draw clipboard text
              }
              fallbackToLocal();
            })
            .catch(() => {
              fallbackToLocal();
            });
        } else {
          fallbackToLocal();
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
          const generateId = ctx.nextShapeId;
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
