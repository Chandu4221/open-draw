import { useEffect } from "react";
import type { DeviceType, Point, ShapeId } from "@open-draw/contracts";
import { SHAPE_KINDS } from "@open-draw/contracts";
import {
  CANVAS_EVENTS,
  GESTURE_KINDS,
  normalizeBox,
  pickShapesInBox,
  STATES,
  TOOLS,
  type CanvasController,
  type GestureKind,
  type HandleId,
  type ToolId,
} from "@open-draw/canvas";
import { absoluteBoundingBox, type Command, type Document } from "@open-draw/document";
import type { Gesture } from "./types";
import { commitDragGesture, commitDrawGesture, commitResizeGesture } from "./canvas-gestures";
import { pickAnyRootChip, pickAnyRootDeviceButton } from "./canvas-overlays";

export interface CanvasInteractionsProps {
  readonly svgRef: React.RefObject<SVGSVGElement | null>;
  readonly canvasRef: React.MutableRefObject<CanvasController>;
  readonly documentRef: React.MutableRefObject<Document>;
  readonly gestureRef: React.MutableRefObject<Gesture | null>;
  readonly lastScreenRef: React.MutableRefObject<Point>;
  readonly lastWorldRef: React.MutableRefObject<Point>;
  readonly spaceRef: React.MutableRefObject<boolean>;
  readonly toolRef: React.MutableRefObject<ToolId>;
  readonly chooseTool: (tool: ToolId) => void;
  readonly setSelectedShapeId: (id: ShapeId | null) => void;
  readonly setZoomPercent: (pct: number) => void;
  readonly handleDeviceChange: (deviceType?: DeviceType) => void;
  readonly commit: (commands: readonly Command[]) => void;
  readonly render: () => void;
}

export function useCanvasInteractions(props: CanvasInteractionsProps): void {
  const {
    svgRef,
    canvasRef,
    documentRef,
    gestureRef,
    lastScreenRef,
    lastWorldRef,
    spaceRef,
    toolRef,
    chooseTool,
    setSelectedShapeId,
    setZoomPercent,
    handleDeviceChange,
    commit,
    render,
  } = props;

  function screenPointFrom(event: PointerEvent | WheelEvent): Point {
    const svg = svgRef.current;
    if (svg === null) {
      return { x: event.clientX, y: event.clientY };
    }
    const rect = svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    const world = canvas.screenToWorld(screen);
    const doc = documentRef.current;

    const zoom = canvas.getCamera().zoom;
    const hitDevice = pickAnyRootDeviceButton(doc, world, zoom);
    if (hitDevice !== null) {
      handleDeviceChange(hitDevice === "all" ? undefined : hitDevice);
      return;
    }
    const hitRootChip = pickAnyRootChip(doc, world, zoom);
    if (hitRootChip !== null) {
      canvas.toggleRootChipsVisible(hitRootChip);
      render();
      return;
    }

    const selectedId = canvas.getSelectedId();

    let handle: HandleId | null = null;
    if (selectedId !== null) {
      const shape = doc.shapes[selectedId];
      if (shape !== undefined && shape.kind !== SHAPE_KINDS.page) {
        handle = canvas.pickHandle(absoluteBoundingBox(doc, shape), screen);
      }
    }

    const panRequested = event.button === 1 || spaceRef.current;
    const hit = panRequested ? null : canvas.pickShape(doc, world);

    canvas.dispatch({
      type: CANVAS_EVENTS.pointerDown,
      screenPoint: screen,
      worldPoint: world,
      hit,
      handle,
      selectedShapeId: selectedId,
      tool: toolRef.current,
      panRequested,
    });

    if (handle === null && toolRef.current === TOOLS.select) {
      if (event.shiftKey && hit !== null) {
        canvas.toggleSelection(hit);
        setSelectedShapeId(canvas.getSelectedId());
      } else if (hit !== null) {
        if (!canvas.isSelected(hit)) {
          canvas.select(hit);
          setSelectedShapeId(hit);
        }
      } else if (!event.shiftKey) {
        canvas.clearSelection();
        setSelectedShapeId(null);
      }
    }

    svgRef.current?.setPointerCapture(event.pointerId);
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

    gestureRef.current = {
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
    };
    lastScreenRef.current = screen;
    lastWorldRef.current = world;
    render();
  }

  function onPointerMove(event: PointerEvent): void {
    const gesture = gestureRef.current;
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    const world = canvas.screenToWorld(screen);

    if (gesture === null) {
      const zoom = canvas.getCamera().zoom;
      const hitDevice = pickAnyRootDeviceButton(documentRef.current, world, zoom);
      const hitChip = pickAnyRootChip(documentRef.current, world, zoom);
      if (svgRef.current) {
        if (hitDevice !== null || hitChip !== null) {
          svgRef.current.style.cursor = "pointer";
        } else if (svgRef.current.style.cursor === "pointer") {
          svgRef.current.style.cursor = "";
        }
      }
      return;
    }

    canvas.dispatch({
      type: CANVAS_EVENTS.pointerMove,
      screenPoint: screen,
      worldPoint: world,
    });

    const state = canvas.getMachineState();
    if (state.stateId === STATES.panning) {
      canvas.panBy({
        x: screen.x - lastScreenRef.current.x,
        y: screen.y - lastScreenRef.current.y,
      });
    }

    if (gesture.kind === GESTURE_KINDS.draw && toolRef.current === TOOLS.drawPenPath) {
      gestureRef.current = {
        ...gesture,
        points: [...gesture.points, world],
      };
    }
    lastScreenRef.current = screen;
    lastWorldRef.current = world;
    render();
  }

  function onPointerUp(event: PointerEvent): void {
    const gesture = gestureRef.current;
    if (gesture === null) {
      return;
    }
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    const world = canvas.screenToWorld(screen);
    const before = canvas.getMachineState().stateId;

    canvas.dispatch({
      type: CANVAS_EVENTS.pointerUp,
      screenPoint: screen,
      worldPoint: world,
    });

    if (before === STATES.draggingShape && gesture.shapeIds.length > 0) {
      commitDragGesture(documentRef.current, gesture, world, commit);
    } else if (before === STATES.resizingShape) {
      commitResizeGesture(documentRef.current, canvas, gesture, world, commit);
    } else if (before === STATES.drawingShape) {
      commitDrawGesture(documentRef.current, canvas, gesture, world, toolRef.current, commit);
      chooseTool(TOOLS.select);
    } else if (before === STATES.selecting || gesture.kind === GESTURE_KINDS.select) {
      const marqueeBox = normalizeBox(gesture.startWorld, world);
      if (marqueeBox.width > 2 || marqueeBox.height > 2) {
        const picked = pickShapesInBox(documentRef.current, marqueeBox);
        if (event.shiftKey) {
          const combined = new Set([...canvas.getSelectedIds(), ...picked]);
          canvas.selectMany(Array.from(combined));
        } else {
          canvas.selectMany(picked);
        }
      } else if (!event.shiftKey) {
        canvas.clearSelection();
      }
    } else if (before === STATES.pointingShape && !event.shiftKey && gesture.parentHit !== null) {
      if (canvas.getSelectedIds().length > 1) {
        canvas.select(gesture.parentHit);
      }
    } else if (before === STATES.idle && gesture.kind === GESTURE_KINDS.press) {
      canvas.clearSelection();
    }
    gestureRef.current = null;
    setSelectedShapeId(canvas.getSelectedId());
    render();
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    if (event.ctrlKey || event.metaKey) {
      const factor = Math.exp(-event.deltaY * 0.002);
      canvas.zoomAt(screen, factor);
      setZoomPercent(Math.round(canvas.getCamera().zoom * 100));
      canvas.dispatch({
        type: CANVAS_EVENTS.wheel,
        screenPoint: screen,
        factor,
      });
    } else {
      canvas.panBy({ x: -event.deltaX, y: -event.deltaY });
    }
    render();
  }

  useEffect(() => {
    const svg = svgRef.current;
    if (svg === null) {
      return;
    }
    svg.addEventListener("pointerdown", onPointerDown);
    svg.addEventListener("pointermove", onPointerMove);
    svg.addEventListener("pointerup", onPointerUp);
    svg.addEventListener("wheel", onWheel, { passive: false });
    render();
    return () => {
      svg.removeEventListener("pointerdown", onPointerDown);
      svg.removeEventListener("pointermove", onPointerMove);
      svg.removeEventListener("pointerup", onPointerUp);
      svg.removeEventListener("wheel", onWheel);
    };
  });
}
