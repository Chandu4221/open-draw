// Pointer interaction handlers for standalone editor (R-008, R-010, R-018).
import type { Point, ShapeId } from "@open-draw/contracts";
import { absoluteBoundingBox, type Command, type Document } from "@open-draw/document";
import type { CanvasController } from "./create-canvas";
import { CANVAS_EVENTS } from "./events";
import { GESTURE_KINDS, type GestureKind } from "./gestures";
import { pickShapesInBox } from "./hit-test";
import { normalizeBox } from "./geometry";
import { STATES } from "./states";
import { TOOLS, type ToolId } from "./tools";
import {
  type ActiveGesture,
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
  let hasPassedDragThreshold = false;

  function screenPoint(event: MouseEvent | PointerEvent | WheelEvent): Point {
    const rect = svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    const doc = getDoc();
    const tool = getTool();
    const screen = screenPoint(event);
    const world = canvas.screenToWorld(screen);
    const selectedId = canvas.getSelectedId();

    let handle = null;
    if (selectedId !== null) {
      const shape = doc.shapes[selectedId];
      if (shape !== undefined && shape.kind !== "page") {
        handle = canvas.pickHandle(absoluteBoundingBox(doc, shape), screen);
      }
    }

    const panRequested = event.button === 1 || getSpacePressed();
    const hit = panRequested ? null : canvas.pickShape(doc, world);

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

    if (handle === null && tool === TOOLS.select) {
      if (event.shiftKey && hit !== null) {
        canvas.toggleSelection(hit);
      } else if (hit !== null) {
        if (!canvas.isSelected(hit)) canvas.select(hit);
      } else if (!event.shiftKey) {
        canvas.clearSelection();
      }
    }

    svg.setPointerCapture(event.pointerId);
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
    }

    setGesture({
      kind,
      startScreen: screen,
      startWorld: world,
      shapeIds,
      handleId: state.activeHandleId,
      originalBox:
        selectedId !== null && doc.shapes[selectedId] !== undefined
          ? absoluteBoundingBox(doc, doc.shapes[selectedId]!)
          : null,
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
        commitDragGesture(doc, gesture, world, execute);
      } else if (before === STATES.resizingShape) {
        commitResizeGesture(doc, canvas, gesture, world, execute);
      } else if (before === STATES.drawingShape) {
        commitDrawGesture(doc, canvas, gesture, world, tool, execute);
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
        commitDrawGesture(doc, canvas, gesture, world, tool, execute);
        setTool(TOOLS.select);
      } else if (before === STATES.idle && gesture.kind === GESTURE_KINDS.press) {
        canvas.clearSelection();
      }
    }

    setGesture(null);
    hasPassedDragThreshold = false;
    render();
  }

  svg.addEventListener("pointerdown", onPointerDown);
  svg.addEventListener("pointermove", onPointerMove);
  svg.addEventListener("pointerup", onPointerUp);

  return () => {
    svg.removeEventListener("pointerdown", onPointerDown);
    svg.removeEventListener("pointermove", onPointerMove);
    svg.removeEventListener("pointerup", onPointerUp);
  };
}
