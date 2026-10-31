// Playground shell for milestone 4: wires DOM events and UI controls to
// the createCanvas controller, @open-draw/input action resolution, @open-draw/shapes
// extensions, and document serialization/parsing (R-004, R-008, R-011, R-018, R-041, R-044).
import { useEffect, useRef, useState } from "react";
import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { parseShapeId, SHAPE_KINDS } from "@open-draw/contracts";
import {
  absoluteBoundingBox,
  applyTransaction,
  COMMANDS,
  createDocument,
  createEllipse,
  createLine,
  createPage,
  createPenPath,
  createRect,
  createTransaction,
  DocumentError,
  EMPTY_HISTORY,
  parseDocument,
  recordHistory,
  redo,
  serializeDocument,
  undo,
  type Document,
  type EllipseShape,
  type HistoryState,
  type LineShape,
  type PenPathShape,
  type RectShape,
} from "@open-draw/document";
import { ACTIONS, type ActionId, type KeyboardEventDescriptor } from "@open-draw/input";
import {
  CANVAS_EVENTS,
  createCanvas,
  normalizeBox,
  resizeBox,
  STATES,
  TOOLS,
  type CanvasController,
  type HandleId,
  type ToolId,
} from "@open-draw/canvas";
import {
  documentToSvg,
  previewBoxToSvg,
  previewLineToSvg,
  previewPenPathToSvg,
  selectionOverlayToSvg,
} from "@open-draw/renderer-svg";
import {
  deriveLineBoundingBox,
  derivePenPathBoundingBox,
  ELLIPSE_CAPABILITIES,
  hitTestEllipse,
  hitTestLine,
  hitTestPenPath,
  hitTestRect,
  LINE_CAPABILITIES,
  PEN_PATH_CAPABILITIES,
  RECT_CAPABILITIES,
} from "@open-draw/shapes";

type GestureKind = "move" | "draw" | "resize" | "pan" | "press";

interface Gesture {
  readonly kind: GestureKind;
  readonly startScreen: Point;
  readonly startWorld: Point;
  readonly shapeIds: readonly ShapeId[];
  readonly handleId: HandleId | null;
  readonly originalBox: BoundingBox | null;
  readonly parentHit: ShapeId | null;
  readonly targetShapeId: ShapeId | null;
  readonly points: readonly Point[];
}

const CANVAS_WIRE_STYLE = { width: "100%", height: "80vh", display: "block", touchAction: "none" };

function initCanvas(): CanvasController {
  return createCanvas({
    shapeKinds: [
      {
        kind: SHAPE_KINDS.rect,
        capabilities: RECT_CAPABILITIES,
        hitTest: (box, _shape, pt) => hitTestRect(box, pt),
      },
      {
        kind: SHAPE_KINDS.ellipse,
        capabilities: ELLIPSE_CAPABILITIES,
        hitTest: (box, _shape, pt) => hitTestEllipse(box, pt),
      },
      {
        kind: SHAPE_KINDS.line,
        capabilities: LINE_CAPABILITIES,
        hitTest: (box, shape, pt) => {
          const line = shape as LineShape;
          return hitTestLine(box, line.start, line.end, pt);
        },
      },
      {
        kind: SHAPE_KINDS.penPath,
        capabilities: PEN_PATH_CAPABILITIES,
        hitTest: (box, shape, pt) => {
          const pen = shape as PenPathShape;
          return hitTestPenPath(box, pen.points, pt);
        },
      },
    ],
  });
}

export default function App() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<CanvasController>(initCanvas());
  const documentRef = useRef<Document>(
    createDocument([createPage(parseShapeId("page-1"), { x: 40, y: 40, width: 640, height: 480 })]),
  );
  const historyRef = useRef<HistoryState>(EMPTY_HISTORY);
  const gestureRef = useRef<Gesture | null>(null);
  const lastScreenRef = useRef<Point>({ x: 0, y: 0 });
  const lastWorldRef = useRef<Point>({ x: 0, y: 0 });
  const shapeCounterRef = useRef(0);
  const pageCounterRef = useRef(1);
  const spaceRef = useRef(false);
  const toolRef = useRef<ToolId>(TOOLS.select);
  const [tool, setTool] = useState<ToolId>(TOOLS.select);
  const [statusMessage, setStatusMessage] = useState<string>("");

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
    const canvas = canvasRef.current;
    const camera = canvas.getCamera();
    const doc = documentRef.current;
    const overlays: string[] = [];
    const selectedId = canvas.getSelectedId();

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
      if (toolRef.current === TOOLS.drawLine) {
        overlays.push(previewLineToSvg(gesture.startWorld, lastWorldRef.current));
      } else if (toolRef.current === TOOLS.drawPenPath) {
        overlays.push(previewPenPathToSvg(gesture.points));
      } else {
        overlays.push(previewBoxToSvg(normalizeBox(gesture.startWorld, lastWorldRef.current)));
      }
    }

    const world =
      documentToSvg(doc, {
        onFallback: (event) => {
          setStatusMessage(`Fallback render: ${event.shapeId} (${event.kind})`);
        },
      }) + overlays.join("");

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
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    const world = canvas.screenToWorld(screen);
    const doc = documentRef.current;
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

    if (handle === null && hit !== null && toolRef.current === TOOLS.select) {
      canvas.select(hit);
    }

    svgRef.current?.setPointerCapture(event.pointerId);
    const state = canvas.getMachineState();
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
      targetShapeId: selectedId,
      points: [world],
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
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    const world = canvas.screenToWorld(screen);

    canvas.dispatch({
      type: CANVAS_EVENTS.pointerMove,
      screenPoint: screen,
      worldPoint: world,
    });

    if (canvas.getMachineState().stateId === STATES.draggingShape && gesture.kind === "move") {
      gestureRef.current = {
        ...gesture,
        kind: "move",
        shapeIds: [canvas.getMachineState().activeShapeId!],
      };
    }
    if (gesture.kind === "pan") {
      canvas.panBy({
        x: screen.x - lastScreenRef.current.x,
        y: screen.y - lastScreenRef.current.y,
      });
    } else if (gesture.kind === "draw" && toolRef.current === TOOLS.drawPenPath) {
      // Accumulate points in transient gesture state (R-018: one gesture = one commit at pointerUp)
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
      canvas.clearSelection();
    }
    gestureRef.current = null;
    render();
  }

  function commitResize(gesture: Gesture, world: Point): void {
    const canvas = canvasRef.current;
    const selectedId = gesture.targetShapeId ?? canvas.getSelectedId();
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

  function commitDraw(gesture: Gesture, world: Point): void {
    const doc = documentRef.current;
    const parentHit = gesture.parentHit;
    const canvas = canvasRef.current;

    if (toolRef.current === TOOLS.drawLine) {
      const { boundingBox, start, end } = deriveLineBoundingBox(gesture.startWorld, world);
      if (parentHit !== null) {
        const parent = doc.shapes[parentHit];
        if (parent !== undefined && parent.kind === SHAPE_KINDS.page) {
          const parentBox = absoluteBoundingBox(doc, parent);
          const line = createLine(
            nextShapeId(),
            {
              x: boundingBox.x - parentBox.x,
              y: boundingBox.y - parentBox.y,
              width: boundingBox.width,
              height: boundingBox.height,
            },
            start,
            end,
            { parent: parent.id },
          );
          commit([{ type: COMMANDS.createShape, shape: line }]);
          canvas.select(line.id);
          return;
        }
      }
      const page = createPage(nextPageId(), boundingBox);
      const line = createLine(
        nextShapeId(),
        { x: 0, y: 0, width: boundingBox.width, height: boundingBox.height },
        start,
        end,
        { parent: page.id },
      );
      commit([
        { type: COMMANDS.createShape, shape: page },
        { type: COMMANDS.createShape, shape: line },
      ]);
      canvas.select(line.id);
      return;
    }

    if (toolRef.current === TOOLS.drawPenPath) {
      const allPoints = gesture.points.length > 0 ? gesture.points : [gesture.startWorld, world];
      const { boundingBox, points } = derivePenPathBoundingBox(allPoints);
      if (parentHit !== null) {
        const parent = doc.shapes[parentHit];
        if (parent !== undefined && parent.kind === SHAPE_KINDS.page) {
          const parentBox = absoluteBoundingBox(doc, parent);
          const pen = createPenPath(
            nextShapeId(),
            {
              x: boundingBox.x - parentBox.x,
              y: boundingBox.y - parentBox.y,
              width: boundingBox.width,
              height: boundingBox.height,
            },
            points,
            { parent: parent.id },
          );
          commit([{ type: COMMANDS.createShape, shape: pen }]);
          canvas.select(pen.id);
          return;
        }
      }
      const page = createPage(nextPageId(), boundingBox);
      const pen = createPenPath(
        nextShapeId(),
        { x: 0, y: 0, width: boundingBox.width, height: boundingBox.height },
        points,
        { parent: page.id },
      );
      commit([
        { type: COMMANDS.createShape, shape: page },
        { type: COMMANDS.createShape, shape: pen },
      ]);
      canvas.select(pen.id);
      return;
    }

    const box = normalizeBox(gesture.startWorld, world);
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
        canvas.select(shape.id);
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
    canvas.select(shape.id);
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    const factor = Math.exp(-event.deltaY * 0.001);
    canvas.zoomAt(screen, factor);
    canvas.dispatch({
      type: CANVAS_EVENTS.wheel,
      screenPoint: screen,
      factor,
    });
    render();
  }

  function executeAction(action: ActionId): void {
    const canvas = canvasRef.current;
    switch (action) {
      case ACTIONS.cancel: {
        canvas.resetMachine();
        gestureRef.current = null;
        canvas.clearSelection();
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
          setStatusMessage(`Deleted shape: ${selectedId}`);
          render();
        }
        break;
      }
      case ACTIONS.selectTool: {
        // Cycle tools: select -> drawRect -> drawEllipse -> drawLine -> drawPenPath -> select
        if (toolRef.current === TOOLS.select) chooseTool(TOOLS.drawRect);
        else if (toolRef.current === TOOLS.drawRect) chooseTool(TOOLS.drawEllipse);
        else if (toolRef.current === TOOLS.drawEllipse) chooseTool(TOOLS.drawLine);
        else if (toolRef.current === TOOLS.drawLine) chooseTool(TOOLS.drawPenPath);
        else chooseTool(TOOLS.select);
        break;
      }
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.code === "Space") {
      spaceRef.current = true;
    }

    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
      if (event.code === "KeyV") {
        chooseTool(TOOLS.select);
        return;
      }
      if (event.code === "KeyR") {
        chooseTool(TOOLS.drawRect);
        return;
      }
      if (event.code === "KeyO") {
        chooseTool(TOOLS.drawEllipse);
        return;
      }
      if (event.code === "KeyL") {
        chooseTool(TOOLS.drawLine);
        return;
      }
      if (event.code === "KeyP") {
        chooseTool(TOOLS.drawPenPath);
        return;
      }
    }

    const descriptor: KeyboardEventDescriptor = {
      code: event.code,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
    };

    const action = canvasRef.current.resolveAction(descriptor);
    if (action !== undefined) {
      event.preventDefault();
      executeAction(action);
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    if (event.code === "Space") {
      spaceRef.current = false;
    }
  }

  function handleSave(): void {
    try {
      const json = serializeDocument(documentRef.current);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "opendraw-document.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage("Document saved successfully");
    } catch (err) {
      setStatusMessage(`Save error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function handleLoad(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const loaded = parseDocument(text);
        documentRef.current = loaded;
        historyRef.current = EMPTY_HISTORY;
        canvasRef.current.clearSelection();
        setStatusMessage("Document loaded successfully");
        render();
      } catch (err) {
        if (err instanceof DocumentError) {
          setStatusMessage(`Load error (${err.code}): ${err.message}`);
        } else {
          setStatusMessage(`Load error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    };
    input.click();
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
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "8px",
        }}
      >
        <button type="button" onClick={() => chooseTool(TOOLS.select)}>
          Select (V)
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawRect)}>
          Draw rect (R)
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawEllipse)}>
          Draw ellipse (O)
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawLine)}>
          Draw line (L)
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawPenPath)}>
          Draw pen (P)
        </button>
        <span>|</span>
        <button type="button" onClick={handleSave}>
          Save JSON
        </button>
        <button type="button" onClick={handleLoad}>
          Load JSON
        </button>
        <span>|</span>
        <span>Tool: {tool}</span>
        {statusMessage && (
          <span style={{ color: "#2563eb", marginLeft: "12px" }}>[{statusMessage}]</span>
        )}
      </div>
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" style={CANVAS_WIRE_STYLE} />
    </main>
  );
}
