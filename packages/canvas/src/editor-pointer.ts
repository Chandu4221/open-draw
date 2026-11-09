import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { absoluteBoundingBox, type Command, type Document } from "@open-draw/document";
import type { CanvasController } from "./create-canvas";
import { CANVAS_EVENTS } from "./events";
import { GESTURE_KINDS, type GestureKind } from "./gestures";
import { pickShapesInBox } from "./hit-test";
import { normalizeBox, unionBoxes } from "./geometry";
import { STATES } from "./states";
import { TOOLS, type ToolId } from "./tools";
import {
  type ActiveGesture,
  type NestingMode,
  commitDragGesture,
  commitDrawGesture,
  commitResizeGesture,
} from "./editor-gestures";

export const DRAG_THRESHOLD_PX = 3;

export interface PointerBindingContext {
  readonly svg: SVGSVGElement;
  readonly canvas: CanvasController;
  readonly getDoc: () => Document;
  readonly getTool: () => ToolId;
  readonly setTool: (tool: ToolId) => void;
  readonly getSpacePressed: () => boolean;
  readonly execute: (commands: readonly Command[]) => void;
  readonly render: () => void;
  readonly getGesture: () => ActiveGesture | null;
  readonly setGesture: (g: ActiveGesture | null) => void;
  readonly setLastWorld: (p: Point) => void;
  readonly nestingMode?: NestingMode | undefined;
  readonly nextShapeId?: ((doc?: Document) => ShapeId) | undefined;
  readonly onDoubleClick?: ((shapeId: ShapeId) => void) | undefined;
  readonly interceptPointerDown?:
    | ((
        event: PointerEvent,
        context: {
          readonly world: Point;
          readonly screen: Point;
          readonly canvas: CanvasController;
          readonly doc: Document;
        },
      ) => boolean | void)
    | undefined;
}

export function attachPointerListeners(ctx: PointerBindingContext): () => void {
  const {
    svg,
    canvas,
    getDoc,
    getTool,
    setTool,
    getSpacePressed,
    execute,
    render,
    getGesture,
    setGesture,
    setLastWorld,
  } = ctx;

  let lastScreen: Point = { x: 0, y: 0 };
  let lastDownTime = 0;
  let lastDownPos: Point = { x: 0, y: 0 };
  let hasPassedDragThreshold = false;
  let cachedRect: DOMRect | { left: number; top: number; width: number; height: number } | null =
    null;

  function screenPoint(event: MouseEvent | PointerEvent | WheelEvent): Point {
    const rect = cachedRect ?? svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    cachedRect = svg.getBoundingClientRect();
    const doc = getDoc();
    const tool = getTool();
    const screen = screenPoint(event);
    const world = canvas.screenToWorld(screen);

    if (ctx.interceptPointerDown?.(event, { world, screen, canvas, doc })) {
      return;
    }

    const now = Date.now();
    const dt = now - lastDownTime;
    const dist = Math.hypot(screen.x - lastDownPos.x, screen.y - lastDownPos.y);
    const isDoubleClick = event.detail >= 2 || (dt > 0 && dt <= 350 && dist <= 6);
    lastDownTime = now;
    lastDownPos = screen;

    const selectedIds = canvas.getSelectedIds();
    const selectedId = canvas.getSelectedId();

    let handle = null;
    let originalBox: BoundingBox | null = null;
    if (selectedIds.length === 1) {
      const shape = doc.shapes[selectedIds[0]!];
      if (shape !== undefined && shape.kind !== "page") {
        originalBox = absoluteBoundingBox(doc, shape);
        handle = canvas.pickHandle(originalBox, screen);
      }
    } else if (selectedIds.length > 1) {
      const boxes: BoundingBox[] = [];
      for (const id of selectedIds) {
        const s = doc.shapes[id];
        if (s !== undefined && s.kind !== "page") {
          boxes.push(absoluteBoundingBox(doc, s));
        }
      }
      originalBox = unionBoxes(boxes);
      if (originalBox !== null) {
        handle = canvas.pickHandle(originalBox, screen);
      }
    }

    const panRequested = event.button === 1 || getSpacePressed();
    const rawHit = panRequested ? null : canvas.pickShape(doc, world);
    const hit =
      rawHit !== null && tool === TOOLS.select
        ? event.metaKey || event.ctrlKey
          ? rawHit
          : canvas.resolveSelectionDrillDown(doc, rawHit, isDoubleClick)
        : rawHit;

    canvas.dispatch({
      type: CANVAS_EVENTS.pointerDown,
      screenPoint: screen,
      worldPoint: world,
      hit,
      handle,
      selectedShapeId: selectedId,
      tool,
      panRequested,
    });

    if (handle === null && tool === TOOLS.select && !panRequested) {
      if (event.shiftKey && hit !== null) {
        canvas.toggleSelection(hit);
      } else if (hit !== null) {
        if (!canvas.isSelected(hit)) canvas.select(hit);
      } else if (!event.shiftKey) {
        canvas.clearSelection();
      }
    }

    try {
      svg.setPointerCapture(event.pointerId);
    } catch {
      // In non-DOM or unsupported test environments
    }

    const state = canvas.getMachineState();
    const kind: GestureKind =
      state.stateId === STATES.panning
        ? GESTURE_KINDS.pan
        : state.stateId === STATES.drawingShape
          ? GESTURE_KINDS.draw
          : state.stateId === STATES.pointingHandle
            ? GESTURE_KINDS.resize
            : state.stateId === STATES.pointingShape
              ? GESTURE_KINDS.move
              : state.stateId === STATES.selecting
                ? GESTURE_KINDS.select
                : GESTURE_KINDS.press;

    let shapeIds: readonly ShapeId[] = [];
    if (state.stateId === STATES.pointingShape && state.activeShapeId !== null) {
      shapeIds = canvas.isSelected(state.activeShapeId)
        ? canvas.getSelectedIds()
        : [state.activeShapeId];
    } else if (state.stateId === STATES.pointingHandle) {
      shapeIds = selectedIds;
    }

    setGesture({
      kind,
      startScreen: screen,
      startWorld: world,
      shapeIds,
      handleId: state.activeHandleId,
      originalBox,
      parentHit: hit,
      targetShapeId: selectedId,
      points: [world],
    });
    hasPassedDragThreshold = false;
    lastScreen = screen;
    setLastWorld(world);
    render();
  }

  function onPointerMove(event: PointerEvent): void {
    const gesture = getGesture();
    if (gesture === null) return;
    const screen = screenPoint(event);
    const world = canvas.screenToWorld(screen);

    if (!hasPassedDragThreshold) {
      const dist = Math.hypot(screen.x - gesture.startScreen.x, screen.y - gesture.startScreen.y);
      if (dist >= DRAG_THRESHOLD_PX) {
        hasPassedDragThreshold = true;
      } else {
        lastScreen = screen;
        setLastWorld(world);
        return;
      }
    }

    canvas.dispatch({
      type: CANVAS_EVENTS.pointerMove,
      screenPoint: screen,
      worldPoint: world,
    });

    const state = canvas.getMachineState();
    if (state.stateId === STATES.panning) {
      canvas.panBy({ x: screen.x - lastScreen.x, y: screen.y - lastScreen.y });
    }

    if (gesture.kind === GESTURE_KINDS.draw && getTool() === TOOLS.drawPenPath) {
      setGesture({ ...gesture, points: [...gesture.points, world] });
    }
    lastScreen = screen;
    setLastWorld(world);
    render();
  }

  function onPointerUp(event: PointerEvent): void {
    const gesture = getGesture();
    if (gesture === null) return;
    const doc = getDoc();
    const tool = getTool();
    const screen = screenPoint(event);
    const world = canvas.screenToWorld(screen);
    const before = canvas.getMachineState().stateId;

    canvas.dispatch({
      type: CANVAS_EVENTS.pointerUp,
      screenPoint: screen,
      worldPoint: world,
    });

    if (hasPassedDragThreshold) {
      if (before === STATES.draggingShape && gesture.shapeIds.length > 0) {
        commitDragGesture(doc, gesture, world, execute, ctx.nestingMode);
      } else if (before === STATES.resizingShape) {
        commitResizeGesture(doc, canvas, gesture, world, execute);
      } else if (before === STATES.drawingShape) {
        commitDrawGesture(
          doc,
          canvas,
          gesture,
          world,
          tool,
          execute,
          ctx.nestingMode,
          ctx.nextShapeId,
        );
        setTool(TOOLS.select);
      } else if (before === STATES.selecting || gesture.kind === GESTURE_KINDS.select) {
        const marqueeBox = normalizeBox(gesture.startWorld, world);
        if (marqueeBox.width > 2 || marqueeBox.height > 2) {
          const picked = pickShapesInBox(doc, marqueeBox);
          if (event.shiftKey) {
            canvas.selectMany(Array.from(new Set([...canvas.getSelectedIds(), ...picked])));
          } else {
            canvas.selectMany(picked);
          }
        } else if (!event.shiftKey) {
          canvas.clearSelection();
        }
      }
    } else {
      if (before === STATES.drawingShape && tool === TOOLS.drawText) {
        commitDrawGesture(
          doc,
          canvas,
          gesture,
          world,
          tool,
          execute,
          ctx.nestingMode,
          ctx.nextShapeId,
        );
        setTool(TOOLS.select);
      } else if (before === STATES.idle && gesture.kind === GESTURE_KINDS.press) {
        canvas.clearSelection();
      }
    }

    setGesture(null);
    hasPassedDragThreshold = false;
    cachedRect = null;
    render();
  }

  function onPointerCancel(): void {
    if (getGesture() !== null) {
      setGesture(null);
      hasPassedDragThreshold = false;
      cachedRect = null;
      render();
    }
  }

  function onBlur(): void {
    onPointerCancel();
  }

  function onDoubleClick(event: MouseEvent): void {
    if (event.button !== undefined && event.button !== 0) return;
    const screen = screenPoint(event);
    const world = canvas.screenToWorld(screen);
    const rawHit = canvas.pickShape(getDoc(), world);
    const hit = rawHit !== null ? canvas.resolveSelectionDrillDown(getDoc(), rawHit, true) : null;
    if (hit !== null && ctx.onDoubleClick !== undefined) {
      ctx.onDoubleClick(hit);
    }
  }

  svg.addEventListener("pointerdown", onPointerDown);
  svg.addEventListener("pointermove", onPointerMove);
  svg.addEventListener("pointerup", onPointerUp);
  svg.addEventListener("pointercancel", onPointerCancel);
  svg.addEventListener("lostpointercapture", onPointerCancel);
  svg.addEventListener("dblclick", onDoubleClick);
  if (typeof window !== "undefined") {
    window.addEventListener("blur", onBlur);
  }

  return () => {
    svg.removeEventListener("pointerdown", onPointerDown);
    svg.removeEventListener("pointermove", onPointerMove);
    svg.removeEventListener("pointerup", onPointerUp);
    svg.removeEventListener("pointercancel", onPointerCancel);
    svg.removeEventListener("lostpointercapture", onPointerCancel);
    svg.removeEventListener("dblclick", onDoubleClick);
    if (typeof window !== "undefined") {
      window.removeEventListener("blur", onBlur);
    }
  };
}
