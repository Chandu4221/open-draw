// Playground shell for milestone 02b: the thin imperative shell (R-008)
// wiring DOM events to the pure canvas core. One gesture = one transaction =
// one commit on pointer-up (R-018); drags render transient previews, never
// mid-gesture document mutations. The camera is a wrapping transform (R-017).
import { useEffect, useRef, useState } from "react";
import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { parseShapeId, SHAPE_KINDS } from "@open-draw/contracts";
import {
  absoluteBoundingBox,
  applyTransaction,
  COMMANDS,
  createDocument,
  createEllipse,
  createPage,
  createRect,
  createTransaction,
  EMPTY_HISTORY,
  recordHistory,
  undo,
  type Document,
  type EllipseShape,
  type HistoryState,
  type RectShape,
} from "@open-draw/document";
import {
  CANVAS_EVENTS,
  clearSelection,
  DEFAULT_CAMERA,
  EMPTY_SELECTION,
  INITIAL_MACHINE_STATE,
  normalizeBox,
  panBy,
  pickHandle,
  pickShape,
  resizeBox,
  screenToWorld,
  selectOne,
  singleSelected,
  STATES,
  TOOLS,
  transition,
  zoomAt,
  type Camera,
  type HandleId,
  type MachineState,
  type Selection,
  type ToolId,
} from "@open-draw/canvas";
import { documentToSvg, previewBoxToSvg, selectionOverlayToSvg } from "@open-draw/renderer-svg";

type GestureKind = "move" | "draw" | "resize" | "pan" | "press";

interface Gesture {
  readonly kind: GestureKind;
  readonly startScreen: Point;
  readonly startWorld: Point;
  readonly shapeIds: readonly ShapeId[];
  readonly handleId: HandleId | null;
  readonly originalBox: BoundingBox | null;
  readonly parentHit: ShapeId | null;
}

const CANVAS_WIRE_STYLE = { width: "100%", height: "80vh", display: "block", touchAction: "none" };

export default function App() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const documentRef = useRef<Document>(
    createDocument([createPage(parseShapeId("page-1"), { x: 40, y: 40, width: 640, height: 480 })]),
  );
  const cameraRef = useRef<Camera>(DEFAULT_CAMERA);
  const selectionRef = useRef<Selection>(EMPTY_SELECTION);
  const machineRef = useRef<MachineState>(INITIAL_MACHINE_STATE);
  const historyRef = useRef<HistoryState>(EMPTY_HISTORY);
  const gestureRef = useRef<Gesture | null>(null);
  const lastScreenRef = useRef<Point>({ x: 0, y: 0 });
  const lastWorldRef = useRef<Point>({ x: 0, y: 0 });
  const shapeCounterRef = useRef(0);
  const pageCounterRef = useRef(1);
  const spaceRef = useRef(false);
  const toolRef = useRef<ToolId>(TOOLS.select);
  const [tool, setTool] = useState<ToolId>(TOOLS.select);

  function chooseTool(next: ToolId): void {
    toolRef.current = next;
    setTool(next);
  }

  function screenPointFrom(event: PointerEvent | WheelEvent): Point {
    const svg = svgRef.current;
    if (svg === null) {
      return { x: 0, y: 0 };
    }
    const rect = svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function render(): void {
    const svg = svgRef.current;
    if (svg === null) {
      return;
    }
    const camera = cameraRef.current;
    const doc = documentRef.current;
    const overlays: string[] = [];
    const selectedId = singleSelected(selectionRef.current);
    if (selectedId !== null) {
      const shape = doc.shapes[selectedId];
      if (shape !== undefined) {
        let box = absoluteBoundingBox(doc, shape);
        const gesture = gestureRef.current;
        if (gesture !== null && gesture.kind === "move" && gesture.shapeIds.includes(selectedId)) {
          box = {
            ...box,
            x: box.x + (lastWorldRef.current.x - gesture.startWorld.x),
            y: box.y + (lastWorldRef.current.y - gesture.startWorld.y),
          };
        }
        if (
          gesture !== null &&
          gesture.kind === "resize" &&
          gesture.originalBox !== null &&
          gesture.handleId !== null
        ) {
          box = resizeBox(gesture.originalBox, gesture.handleId, lastWorldRef.current);
        }
        overlays.push(selectionOverlayToSvg(box, camera.zoom));
      }
    }
    const gesture = gestureRef.current;
    if (gesture !== null && gesture.kind === "draw") {
      overlays.push(previewBoxToSvg(normalizeBox(gesture.startWorld, lastWorldRef.current)));
    }
    const world = documentToSvg(doc) + overlays.join("");
    svg.innerHTML =
      `<g transform="translate(${-camera.x * camera.zoom} ${-camera.y * camera.zoom}) ` +
      `scale(${camera.zoom})">${world}</g>`;
  }

  function commit(commands: Parameters<typeof createTransaction>[0]): void {
    const result = applyTransaction(documentRef.current, createTransaction(commands));
    documentRef.current = result.document;
    historyRef.current = recordHistory(historyRef.current, result.inverse);
  }

  function nextShapeId(): ShapeId {
    shapeCounterRef.current += 1;
    return `shape-${shapeCounterRef.current}` as ShapeId;
  }

  function nextPageId(): ShapeId {
    pageCounterRef.current += 1;
    return `page-${pageCounterRef.current}` as ShapeId;
  }

  function onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    const screen = screenPointFrom(event);
    const world = screenToWorld(cameraRef.current, screen);
    const doc = documentRef.current;
    const camera = cameraRef.current;
    const selectedId = singleSelected(selectionRef.current);
    let handle: HandleId | null = null;
    if (selectedId !== null) {
      const shape = doc.shapes[selectedId];
      if (shape !== undefined && shape.kind !== SHAPE_KINDS.page) {
        handle = pickHandle(camera, absoluteBoundingBox(doc, shape), screen);
      }
    }
    const panRequested = event.button === 1 || spaceRef.current;
    const hit = panRequested ? null : pickShape(doc, world);
    machineRef.current = transition(machineRef.current, {
      type: CANVAS_EVENTS.pointerDown,
      screenPoint: screen,
      worldPoint: world,
      hit,
      handle,
      selectedShapeId: selectedId,
      tool: toolRef.current,
      panRequested,
    });
    // Select on pointer-down (inventory item 11): the pressed shape carries
    // its selection overlay through the whole gesture (review Bug 6 fix).
    // Never when a draw tool is active — drawing over a page must not
    // select it (review round 2, Finding 1).
    if (hit !== null && toolRef.current === TOOLS.select) {
      selectionRef.current = selectOne(hit);
    }
    // Capture on the persistent <svg> root — inner nodes are destroyed by
    // every render(), which would abort the gesture (review Bug 5 fix).
    svgRef.current?.setPointerCapture(event.pointerId);
    const state = machineRef.current;
    const kind: GestureKind =
      state.stateId === STATES.panning
        ? "pan"
        : state.stateId === STATES.drawingShape
          ? "draw"
          : state.stateId === STATES.pointingHandle
            ? "resize"
            : state.stateId === STATES.pointingShape
              ? "move"
              : "press";
    let shapeIds: readonly ShapeId[] = [];
    if (state.stateId === STATES.pointingShape && state.activeShapeId !== null) {
      shapeIds = [state.activeShapeId];
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
    };
    lastScreenRef.current = screen;
    lastWorldRef.current = world;
    render();
  }

  function onPointerMove(event: PointerEvent): void {
    const gesture = gestureRef.current;
    if (gesture === null) {
      return;
    }
    const screen = screenPointFrom(event);
    const world = screenToWorld(cameraRef.current, screen);
    machineRef.current = transition(machineRef.current, {
      type: CANVAS_EVENTS.pointerMove,
      screenPoint: screen,
      worldPoint: world,
    });
    if (machineRef.current.stateId === STATES.draggingShape && gesture.kind === "move") {
      gestureRef.current = {
        ...gesture,
        kind: "move",
        shapeIds: [machineRef.current.activeShapeId!],
      };
    }
    if (gesture.kind === "pan") {
      cameraRef.current = panBy(cameraRef.current, {
        x: screen.x - lastScreenRef.current.x,
        y: screen.y - lastScreenRef.current.y,
      });
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
    const screen = screenPointFrom(event);
    const world = screenToWorld(cameraRef.current, screen);
    const before = machineRef.current.stateId;
    machineRef.current = transition(machineRef.current, {
      type: CANVAS_EVENTS.pointerUp,
      screenPoint: screen,
      worldPoint: world,
    });
    if (before === STATES.draggingShape && gesture.shapeIds.length > 0) {
      const dx = world.x - gesture.startWorld.x;
      const dy = world.y - gesture.startWorld.y;
      if (dx !== 0 || dy !== 0) {
        commit([{ type: COMMANDS.moveShapes, ids: gesture.shapeIds, dx, dy }]);
      }
    } else if (before === STATES.resizingShape) {
      commitResize(gesture, world);
    } else if (before === STATES.drawingShape) {
      commitDraw(gesture, world);
    } else if (before === STATES.idle && gesture.kind === "press") {
      selectionRef.current = clearSelection();
    }
    gestureRef.current = null;
    render();
  }

  // Resize commit: the gesture box is world-space (absolute); the document
  // stores parent-local boxes (ADR-0002 D4). The local box is derived by
  // subtracting the PARENT's absolute origin — never the shape's own
  // (review Bug 4 fix).
  function commitResize(gesture: Gesture, world: Point): void {
    const selectedId = singleSelected(selectionRef.current);
    if (selectedId === null || gesture.handleId === null || gesture.originalBox === null) {
      return;
    }
    const doc = documentRef.current;
    const shape = doc.shapes[selectedId];
    if (shape === undefined) {
      return;
    }
    const parentShape = doc.shapes[shape.parent];
    const parentOrigin =
      parentShape === undefined ? { x: 0, y: 0 } : absoluteBoundingBox(doc, parentShape);
    const resized = resizeBox(gesture.originalBox, gesture.handleId, world);
    commit([
      {
        type: COMMANDS.setShapeBoundingBox,
        id: selectedId,
        boundingBox: {
          x: resized.x - parentOrigin.x,
          y: resized.y - parentOrigin.y,
          width: resized.width,
          height: resized.height,
        },
      },
    ]);
  }

  // Drag-to-draw: over a page → shape parented there (parent-local box,
  // `parent` explicitly passed — review Bug 1 fix); over empty canvas → a
  // new page sized to the drag with the shape filling it (inventory item 6).
  // The drawn kind follows the active tool in BOTH branches (review Bug 2
  // fix).
  function commitDraw(gesture: Gesture, world: Point): void {
    const box = normalizeBox(gesture.startWorld, world);
    const doc = documentRef.current;
    const parentHit = gesture.parentHit;
    const createDrawnShape = (parent: ShapeId, localBox: BoundingBox): RectShape | EllipseShape =>
      toolRef.current === TOOLS.drawEllipse
        ? createEllipse(nextShapeId(), localBox, { parent })
        : createRect(nextShapeId(), localBox, { parent });
    if (parentHit !== null) {
      const parent = doc.shapes[parentHit];
      if (parent !== undefined && parent.kind === SHAPE_KINDS.page) {
        const parentBox = absoluteBoundingBox(doc, parent);
        const shape = createDrawnShape(parent.id, {
          x: box.x - parentBox.x,
          y: box.y - parentBox.y,
          width: box.width,
          height: box.height,
        });
        commit([{ type: COMMANDS.createShape, shape }]);
        selectionRef.current = selectOne(shape.id);
        return;
      }
    }
    const page = createPage(nextPageId(), box);
    const shape = createDrawnShape(page.id, {
      x: 0,
      y: 0,
      width: box.width,
      height: box.height,
    });
    commit([
      { type: COMMANDS.createShape, shape: page },
      { type: COMMANDS.createShape, shape },
    ]);
    selectionRef.current = selectOne(shape.id);
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const screen = screenPointFrom(event);
    const factor = Math.exp(-event.deltaY * 0.001);
    cameraRef.current = zoomAt(cameraRef.current, screen, factor);
    machineRef.current = transition(machineRef.current, {
      type: CANVAS_EVENTS.wheel,
      screenPoint: screen,
      factor,
    });
    render();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.code === "Space") {
      spaceRef.current = true;
    }
    if (event.code === "Escape") {
      machineRef.current = transition(machineRef.current, { type: CANVAS_EVENTS.keyEscape });
      gestureRef.current = null;
      render();
    }
    if (event.ctrlKey && event.code === "KeyZ") {
      event.preventDefault();
      const undone = undo(documentRef.current, historyRef.current);
      if (undone !== null) {
        documentRef.current = undone.document;
        historyRef.current = undone.history;
        render();
      }
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    if (event.code === "Space") {
      spaceRef.current = false;
    }
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
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    render();
    return () => {
      svg.removeEventListener("pointerdown", onPointerDown);
      svg.removeEventListener("pointermove", onPointerMove);
      svg.removeEventListener("pointerup", onPointerUp);
      svg.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  return (
    <main>
      <h1>OpenDraw Playground</h1>
      <div>
        <button type="button" onClick={() => chooseTool(TOOLS.select)}>
          Select
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawRect)}>
          Draw rect
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawEllipse)}>
          Draw ellipse
        </button>
        <span>{tool === TOOLS.select ? "select tool" : "draw tool"}</span>
      </div>
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" style={CANVAS_WIRE_STYLE} />
    </main>
  );
}
