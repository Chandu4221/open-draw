import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { absoluteBoundingBox, type Command, type Document } from "@open-draw/document";
import type { CanvasController } from "./create-canvas";
import { CANVAS_EVENTS } from "./events";
import { GESTURE_KINDS, type GestureKind } from "./gestures";
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
import { resolveHandleCursor, resolveToolCursor } from "./cursor";
import {
  addTouchPointer,
  createTouchTracker,
  removeTouchPointer,
  updateTouchPointer,
} from "./touch-gesture";

import { cameraToViewportBox } from "./camera";
import type { SnapConfig } from "./editor-types";
import { resolvePointerSnap } from "./snap-solver";

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
  readonly nextShapeId: (doc?: Document) => ShapeId;
  readonly onDoubleClick?: ((shapeId: ShapeId) => void) | undefined;
  readonly snapConfig?: SnapConfig | boolean | undefined;
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
  let touchTracker = createTouchTracker();

  function screenPoint(event: MouseEvent | PointerEvent | WheelEvent): Point {
    const rect = cachedRect ?? svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    try {
      svg.focus();
    } catch {
      // Environments without focus support
    }
    cachedRect = svg.getBoundingClientRect();
    const doc = getDoc();
    const tool = getTool();
    const screen = screenPoint(event);
    const world = canvas.screenToWorld(screen);

    if (event.pointerType === "touch") {
      touchTracker = addTouchPointer(touchTracker, event.pointerId, screen);
      if (touchTracker.pointers.size === 2) {
        if (getGesture() !== null || canvas.getMachineState().stateId !== STATES.idle) {
          canvas.dispatch({ type: CANVAS_EVENTS.pointerCancel });
          setGesture(null);
          hasPassedDragThreshold = false;
          render();
        }
        return;
      }
      if (touchTracker.pointers.size > 2) {
        return;
      }
    }

    const currentGesture = getGesture();
    if (currentGesture !== null && currentGesture.pointerId !== event.pointerId) {
      return;
    }

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

    if (originalBox === null && shapeIds.length > 0) {
      if (shapeIds.length === 1) {
        const s = doc.shapes[shapeIds[0]!];
        if (s !== undefined && s.kind !== "page") {
          originalBox = absoluteBoundingBox(doc, s);
        }
      } else {
        const boxes: BoundingBox[] = [];
        for (const id of shapeIds) {
          const s = doc.shapes[id];
          if (s !== undefined && s.kind !== "page") {
            boxes.push(absoluteBoundingBox(doc, s));
          }
        }
        originalBox = unionBoxes(boxes);
      }
    }

    setGesture({
      pointerId: event.pointerId,
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
    const screen = screenPoint(event);
    if (event.pointerType === "touch") {
      if (touchTracker.pointers.size === 2 && touchTracker.pointers.has(event.pointerId)) {
        const res = updateTouchPointer(touchTracker, event.pointerId, screen);
        touchTracker = res.tracker;
        if (res.pinchDelta !== null) {
          canvas.panBy(res.pinchDelta.panDelta);
          canvas.zoomAt(res.pinchDelta.center, res.pinchDelta.zoomFactor);
        }
        return;
      }
      if (touchTracker.pointers.size > 2) {
        return;
      }
    }

    const gesture = getGesture();
    if (gesture === null || gesture.pointerId !== event.pointerId) return;
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

    if (gesture.kind === GESTURE_KINDS.pan) {
      svg.style.cursor = "grabbing";
    } else if (gesture.kind === GESTURE_KINDS.move) {
      svg.style.cursor = "move";
    } else if (gesture.kind === GESTURE_KINDS.resize && gesture.handleId) {
      svg.style.cursor = resolveHandleCursor(gesture.handleId);
    }

    const state = canvas.getMachineState();
    if (state.stateId === STATES.panning) {
      canvas.panBy({ x: screen.x - lastScreen.x, y: screen.y - lastScreen.y });
    }

    let effectiveWorld = world;
    let snapGuides = gesture.snapGuides ?? [];

    const isSnapDisabled =
      event.altKey ||
      ctx.snapConfig === false ||
      (typeof ctx.snapConfig === "object" && ctx.snapConfig.enabled === false);

    const isSnappableGesture =
      gesture.kind === GESTURE_KINDS.move ||
      gesture.kind === GESTURE_KINDS.resize ||
      (gesture.kind === GESTURE_KINDS.draw && getTool() !== TOOLS.drawPenPath);

    if (!isSnapDisabled && isSnappableGesture) {
      const mode =
        gesture.kind === GESTURE_KINDS.resize
          ? "resize"
          : gesture.kind === GESTURE_KINDS.draw
            ? "draw"
            : "move";
      const rect = cachedRect ?? svg.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : 1000;
      const height = rect.height > 0 ? rect.height : 800;
      const viewportBox = cameraToViewportBox(canvas.getCamera(), width, height, 64);
      const thresholdPx =
        typeof ctx.snapConfig === "object" && ctx.snapConfig.thresholdPx !== undefined
          ? ctx.snapConfig.thresholdPx
          : undefined;

      const snapRes = resolvePointerSnap({
        mode,
        rawWorld: world,
        originalBox: gesture.originalBox,
        startWorld: gesture.startWorld,
        handleId: gesture.handleId,
        movingShapeIds: gesture.shapeIds,
        doc: getDoc(),
        spatialIndex: canvas.getSpatialIndex(getDoc()),
        viewportBox,
        zoom: canvas.getCamera().zoom,
        thresholdPx,
        activeDeviceType: canvas.getActiveDeviceType(),
      });
      effectiveWorld = snapRes.snappedWorld;
      snapGuides = snapRes.guides;
    } else if (isSnapDisabled && snapGuides.length > 0) {
      snapGuides = [];
    }

    setGesture({
      ...gesture,
      snapGuides,
      snappedWorld: effectiveWorld,
      ...(gesture.kind === GESTURE_KINDS.draw && getTool() === TOOLS.drawPenPath
        ? { points: [...gesture.points, world] }
        : {}),
    });
    lastScreen = screen;
    setLastWorld(effectiveWorld);
    render();
  }

  function onPointerUp(event: PointerEvent): void {
    const wasPinching = touchTracker.pointers.size >= 2;
    if (event.pointerType === "touch") {
      touchTracker = removeTouchPointer(touchTracker, event.pointerId);
    }
    try {
      if (typeof svg.hasPointerCapture === "function" && svg.hasPointerCapture(event.pointerId)) {
        svg.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Environments without pointer capture support
    }

    if (wasPinching) {
      setGesture(null);
      hasPassedDragThreshold = false;
      cachedRect = null;
      svg.style.cursor = resolveToolCursor(getTool(), getSpacePressed());
      render();
      return;
    }

    const gesture = getGesture();
    if (gesture === null || gesture.pointerId !== event.pointerId) return;
    const doc = getDoc();
    const tool = getTool();
    const screen = screenPoint(event);
    const world = canvas.screenToWorld(screen);
    const before = canvas.getMachineState().stateId;
    const commitWorld = gesture.snappedWorld ?? world;

    canvas.dispatch({
      type: CANVAS_EVENTS.pointerUp,
      screenPoint: screen,
      worldPoint: commitWorld,
    });

    if (hasPassedDragThreshold) {
      if (before === STATES.draggingShape && gesture.shapeIds.length > 0) {
        commitDragGesture(doc, gesture, commitWorld, execute, ctx.nestingMode);
      } else if (before === STATES.resizingShape) {
        commitResizeGesture(doc, canvas, gesture, commitWorld, execute);
      } else if (before === STATES.drawingShape) {
        commitDrawGesture(
          doc,
          canvas,
          gesture,
          commitWorld,
          tool,
          execute,
          ctx.nestingMode,
          ctx.nextShapeId,
        );
        setTool(TOOLS.select);
      } else if (before === STATES.selecting || gesture.kind === GESTURE_KINDS.select) {
        const marqueeBox = normalizeBox(gesture.startWorld, world);
        if (marqueeBox.width > 2 || marqueeBox.height > 2) {
          const picked = canvas.pickShapesInBox(doc, marqueeBox);
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
    svg.style.cursor = resolveToolCursor(tool, getSpacePressed());
    render();
  }

  function onPointerCancel(event?: PointerEvent): void {
    const gesture = getGesture();
    if (event !== undefined && event.pointerId !== undefined) {
      touchTracker = removeTouchPointer(touchTracker, event.pointerId);
      try {
        if (typeof svg.hasPointerCapture === "function" && svg.hasPointerCapture(event.pointerId)) {
          svg.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Environments without pointer capture support
      }
      if (gesture !== null && gesture.pointerId !== event.pointerId) {
        return;
      }
    } else {
      touchTracker = createTouchTracker();
    }

    if (getGesture() !== null || canvas.getMachineState().stateId !== STATES.idle) {
      canvas.dispatch({ type: CANVAS_EVENTS.pointerCancel });
      setGesture(null);
      hasPassedDragThreshold = false;
      cachedRect = null;
      svg.style.cursor = resolveToolCursor(getTool(), getSpacePressed());
      render();
    }
  }

  function onBlur(): void {
    onPointerCancel();
  }

  function onVisibilityChange(): void {
    if (typeof document !== "undefined" && document.hidden) {
      onPointerCancel();
    }
  }

  function onDoubleClick(event: MouseEvent): void {
    if (event.button !== undefined && event.button !== 0) return;
    const screen = screenPoint(event);
    const world = canvas.screenToWorld(screen);
    const rawHit = canvas.pickShape(getDoc(), world);
    if (rawHit === null) return;
    const hit = canvas.resolveSelectionDrillDown(getDoc(), rawHit, true);
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
  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("visibilitychange", onVisibilityChange);
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
    if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}
