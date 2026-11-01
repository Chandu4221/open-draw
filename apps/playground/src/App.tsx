// Playground shell for milestone 5: wires DOM events and UI controls to
// the createCanvas controller, @open-draw/input action resolution, @open-draw/shapes
// extensions, @open-draw/profiles, @open-draw/semantics, and document serialization/parsing
// (R-004, R-008, R-011, R-018, R-024, R-025, R-026, R-027, R-028, R-029, R-041, R-044).
import { useEffect, useRef, useState } from "react";
import type {
  BoundingBox,
  DeviceType,
  PlatformId,
  Point,
  SemanticId,
  ShapeId,
  StyleId,
} from "@open-draw/contracts";
import {
  DEVICE_TYPES,
  PLATFORMS,
  SHAPE_KINDS,
  STYLE_PROFILES,
  parseShapeId,
} from "@open-draw/contracts";
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
  type PageShape,
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
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import {
  computeSemanticConflict,
  resolveRootPage,
  resolveRootPlatform,
  resolveRootStyle,
  resolveShapeDisplayName,
  walkSemanticTree,
} from "@open-draw/semantics";

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

const CANVAS_WIRE_STYLE = { width: "100%", height: "100%", display: "block", touchAction: "none" };

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
  const [doc, setDoc] = useState<Document>(() =>
    createDocument([createPage(parseShapeId("page-1"), { x: 40, y: 40, width: 640, height: 480 })]),
  );
  const documentRef = useRef<Document>(doc);
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
  const [selectedShapeId, setSelectedShapeId] = useState<ShapeId | null>(null);
  const [activeDeviceType, setActiveDeviceType] = useState<DeviceType | undefined>(undefined);

  function chooseTool(next: ToolId): void {
    toolRef.current = next;
    setTool(next);
  }

  function handleDeviceChange(deviceType?: DeviceType): void {
    canvasRef.current.setActiveDeviceType(deviceType);
    setActiveDeviceType(deviceType);
    render();
  }

  function selectShape(id: ShapeId): void {
    canvasRef.current.select(id);
    setSelectedShapeId(id);
    render();
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
        activeDeviceType: canvas.getActiveDeviceType(),
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
    setDoc(result.document);
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
      setSelectedShapeId(hit);
    } else if (handle === null && hit === null && toolRef.current === TOOLS.select) {
      canvas.clearSelection();
      setSelectedShapeId(null);
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

    const state = canvas.getMachineState();
    if (state.stateId === STATES.panning) {
      canvas.panBy({
        x: screen.x - lastScreenRef.current.x,
        y: screen.y - lastScreenRef.current.y,
      });
    }

    if (gesture.kind === "draw" && toolRef.current === TOOLS.drawPenPath) {
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
    setSelectedShapeId(canvas.getSelectedId());
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
        setSelectedShapeId(null);
        setDoc(loaded);
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

  function handleSetPlatform(platform: PlatformId): void {
    if (!rootPage) return;
    commit([{ type: COMMANDS.setRootPlatform, id: rootPage.id, platform }]);
    render();
  }

  function handleSetStyle(style: StyleId): void {
    if (!rootPage) return;
    commit([{ type: COMMANDS.setRootStyle, id: rootPage.id, style }]);
    render();
  }

  function handleSetSemantic(semanticIdStr: string): void {
    if (!selectedShape) return;
    if (semanticIdStr === "") {
      commit([{ type: COMMANDS.setShapeSemantic, id: selectedShape.id, semantic: null }]);
    } else {
      let platform = activeProfile.id;
      if (!activeProfile.semantics[semanticIdStr]) {
        for (const [pid, prof] of Object.entries(PLATFORM_PROFILES)) {
          if (prof.semantics[semanticIdStr]) {
            platform = pid as PlatformId;
            break;
          }
        }
      }
      commit([
        {
          type: COMMANDS.setShapeSemantic,
          id: selectedShape.id,
          semantic: {
            id: semanticIdStr as SemanticId,
            platform,
            properties: {},
          },
        },
      ]);
    }
    render();
  }

  function handlePropertyChange(propId: string, val: string | number | boolean): void {
    if (!selectedShape || !selectedShape.meta.semantic) return;
    const currentProps = selectedShape.meta.semantic.properties ?? {};
    commit([
      {
        type: COMMANDS.setShapeSemantic,
        id: selectedShape.id,
        semantic: {
          ...selectedShape.meta.semantic,
          properties: {
            ...currentProps,
            [propId]: val,
          },
        },
      },
    ]);
    render();
  }

  function handleToggleHiddenOn(dt: DeviceType): void {
    if (!selectedShape) return;
    const current = selectedShape.meta.hiddenOn ?? [];
    const next = current.includes(dt) ? current.filter((d) => d !== dt) : [...current, dt];
    commit([
      {
        type: COMMANDS.setShapeHiddenOn,
        id: selectedShape.id,
        hiddenOn: next.length > 0 ? next : null,
      },
    ]);
    render();
  }

  function handleOrderChange(dt: DeviceType, valStr: string): void {
    if (!selectedShape) return;
    const order = valStr.trim() === "" ? null : Number(valStr);
    commit([
      {
        type: COMMANDS.setShapeOrder,
        id: selectedShape.id,
        deviceType: dt,
        order,
      },
    ]);
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

  const selectedShape = selectedShapeId !== null ? doc.shapes[selectedShapeId] : undefined;
  const rootPage = selectedShape
    ? resolveRootPage(doc, selectedShape.id)
    : (Object.values(doc.shapes).find((s) => s.kind === SHAPE_KINDS.page) as PageShape | undefined);
  const rootPlatform = rootPage ? resolveRootPlatform(doc, rootPage.id) : PLATFORMS.web;
  const rootStyle = rootPage ? resolveRootStyle(doc, rootPage.id) : STYLE_PROFILES.minimal;
  const activeProfile = PLATFORM_PROFILES[rootPlatform] ?? PLATFORM_PROFILES.web;
  const conflict = selectedShape
    ? computeSemanticConflict(doc, selectedShape, activeProfile)
    : undefined;
  const semanticDef =
    selectedShape?.meta.semantic !== undefined
      ? activeProfile.semantics[selectedShape.meta.semantic.id]
      : undefined;
  const semanticProps = selectedShape?.meta.semantic?.properties ?? {};
  const treeNodes = rootPage
    ? walkSemanticTree(doc, rootPage.id, activeProfile, activeDeviceType)
    : [];

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <header
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          flexShrink: 0,
        }}
      >
        <h1 style={{ fontSize: "18px", margin: "0 0 8px 0" }}>OpenDraw Playground</h1>
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: "13px",
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
          <span>|</span>
          <span style={{ fontWeight: 600 }}>Device:</span>
          <button
            type="button"
            style={{
              fontWeight: activeDeviceType === undefined ? 700 : 400,
              backgroundColor: activeDeviceType === undefined ? "#2563eb" : undefined,
              color: activeDeviceType === undefined ? "#ffffff" : undefined,
            }}
            onClick={() => handleDeviceChange(undefined)}
          >
            All
          </button>
          {(Object.keys(DEVICE_TYPES) as DeviceType[]).map((dt) => (
            <button
              key={dt}
              type="button"
              style={{
                fontWeight: activeDeviceType === dt ? 700 : 400,
                backgroundColor: activeDeviceType === dt ? "#2563eb" : undefined,
                color: activeDeviceType === dt ? "#ffffff" : undefined,
              }}
              onClick={() => handleDeviceChange(dt)}
            >
              {DEVICE_TYPES[dt]}
            </button>
          ))}
          {statusMessage && (
            <span style={{ color: "#2563eb", marginLeft: "8px" }}>[{statusMessage}]</span>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            height: "100%",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#f8fafc",
          }}
        >
          <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" style={CANVAS_WIRE_STYLE} />
        </div>

        {/* Inspector Sidebar */}
        <aside
          style={{
            width: "360px",
            height: "100%",
            boxSizing: "border-box",
            borderLeft: "1px solid #cbd5e1",
            overflowY: "auto",
            padding: "16px",
            backgroundColor: "#ffffff",
            fontSize: "13px",
          }}
        >
          {/* Root Page Platform and Style Configuration */}
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "16px",
            }}
          >
            <h2 style={{ fontSize: "15px", margin: "0 0 12px 0", color: "#0f172a" }}>
              Page Configuration
            </h2>
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
                Page ID
              </label>
              <div style={{ color: "#64748b" }}>{rootPage ? rootPage.id : "None"}</div>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
                Platform Profile (R-026)
              </label>
              <select
                value={rootPlatform}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
                disabled={!rootPage}
                onChange={(e) => handleSetPlatform(e.target.value as PlatformId)}
              >
                <option value={PLATFORMS.web}>Web</option>
                <option value={PLATFORMS.androidNative}>Android Native (Material 3)</option>
                <option value={PLATFORMS.flutter}>Flutter</option>
                <option value={PLATFORMS.ios}>iOS (Stub)</option>
              </select>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
                Design Style (R-026)
              </label>
              <select
                value={rootStyle}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
                disabled={!rootPage}
                onChange={(e) => handleSetStyle(e.target.value as StyleId)}
              >
                <option value={STYLE_PROFILES.minimal}>Minimal</option>
              </select>
            </div>
          </div>

          {/* Selected Shape Inspector */}
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "16px",
            }}
          >
            <h2 style={{ fontSize: "15px", margin: "0 0 12px 0", color: "#0f172a" }}>
              Shape Inspector
            </h2>
            {!selectedShape ? (
              <p style={{ color: "#64748b", margin: 0 }}>
                Select a shape to inspect semantics and responsive properties.
              </p>
            ) : (
              <div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Name:</strong> {resolveShapeDisplayName(selectedShape, activeProfile)}
                </div>
                <div style={{ marginBottom: "8px", color: "#64748b" }}>
                  <strong>ID:</strong> {selectedShape.id} | <strong>Kind:</strong>{" "}
                  {selectedShape.kind}
                </div>

                {selectedShape.kind === SHAPE_KINDS.page ? (
                  <p style={{ color: "#64748b", fontStyle: "italic" }}>
                    This is a root page. Platform and style settings are configured above.
                  </p>
                ) : (
                  <>
                    {/* Semantic Tagging */}
                    <div style={{ marginTop: "12px", marginBottom: "12px" }}>
                      <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
                        Semantic Tag (R-024)
                      </label>
                      <select
                        value={selectedShape.meta.semantic?.id ?? ""}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                        }}
                        onChange={(e) => handleSetSemantic(e.target.value)}
                      >
                        <option value="">(None / Baseline)</option>
                        {Object.values(activeProfile.semantics).map((def) => (
                          <option key={def.id} value={def.id}>
                            {def.displayName} ({def.id})
                          </option>
                        ))}
                        {selectedShape.meta.semantic &&
                          !activeProfile.semantics[selectedShape.meta.semantic.id] && (
                            <option value={selectedShape.meta.semantic.id}>
                              [Foreign] {selectedShape.meta.semantic.id} (
                              {selectedShape.meta.semantic.platform})
                            </option>
                          )}
                      </select>
                    </div>

                    {/* Semantic Conflict Warning Banner (R-025) */}
                    {conflict && (
                      <div
                        style={{
                          backgroundColor: "#fef2f2",
                          border: "1px solid #f87171",
                          borderRadius: "4px",
                          padding: "8px 12px",
                          marginBottom: "12px",
                          color: "#991b1b",
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: "2px" }}>
                          Semantic Conflict ({conflict.status})
                        </div>
                        <div style={{ fontSize: "12px" }}>{conflict.reason}</div>
                      </div>
                    )}

                    {/* Semantic Properties (Ruling 8) */}
                    {semanticDef?.properties && semanticDef.properties.length > 0 && (
                      <div style={{ marginTop: "12px", marginBottom: "12px" }}>
                        <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
                          Properties ({semanticDef.displayName})
                        </label>
                        {semanticDef.properties.map((schema) => {
                          const val = semanticProps[schema.id];
                          return (
                            <div key={schema.id} style={{ marginBottom: "8px" }}>
                              <label
                                style={{
                                  display: "block",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  marginBottom: "2px",
                                }}
                              >
                                {schema.label}
                              </label>
                              {schema.control === "text" && (
                                <input
                                  type="text"
                                  value={val !== undefined ? String(val) : ""}
                                  style={{
                                    width: "100%",
                                    padding: "4px 8px",
                                    boxSizing: "border-box",
                                  }}
                                  onChange={(e) => handlePropertyChange(schema.id, e.target.value)}
                                />
                              )}
                              {schema.control === "number" && (
                                <input
                                  type="number"
                                  value={val !== undefined ? Number(val) : ""}
                                  style={{
                                    width: "100%",
                                    padding: "4px 8px",
                                    boxSizing: "border-box",
                                  }}
                                  onChange={(e) =>
                                    handlePropertyChange(
                                      schema.id,
                                      e.target.value === "" ? 0 : Number(e.target.value),
                                    )
                                  }
                                />
                              )}
                              {schema.control === "toggle" && (
                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(val)}
                                    onChange={(e) =>
                                      handlePropertyChange(schema.id, e.target.checked)
                                    }
                                  />
                                  <span>Enabled</span>
                                </label>
                              )}
                              {schema.control === "select" && (
                                <select
                                  value={
                                    val !== undefined
                                      ? String(val)
                                      : (schema.options?.[0]?.value ?? "")
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "4px 8px",
                                    boxSizing: "border-box",
                                  }}
                                  onChange={(e) => handlePropertyChange(schema.id, e.target.value)}
                                >
                                  {schema.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Responsive Hidden On (R-028, R-029) */}
                    <div style={{ marginTop: "16px", marginBottom: "12px" }}>
                      <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
                        Responsive Visibility (hiddenOn)
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {(Object.keys(DEVICE_TYPES) as DeviceType[]).map((dt) => {
                          const isHidden = selectedShape.meta.hiddenOn?.includes(dt) ?? false;
                          return (
                            <label
                              key={dt}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isHidden}
                                onChange={() => handleToggleHiddenOn(dt)}
                              />
                              <span>{DEVICE_TYPES[dt]}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Responsive Order (R-027) */}
                    <div style={{ marginTop: "16px", marginBottom: "12px" }}>
                      <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
                        Responsive Order (order)
                      </label>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "6px",
                        }}
                      >
                        {(Object.keys(DEVICE_TYPES) as DeviceType[]).map((dt) => {
                          const orderVal = selectedShape.meta.order[dt];
                          return (
                            <div key={dt} style={{ fontSize: "12px" }}>
                              <label style={{ display: "block", color: "#64748b" }}>
                                {DEVICE_TYPES[dt]}:
                              </label>
                              <input
                                type="number"
                                placeholder="0"
                                value={orderVal !== undefined ? orderVal : ""}
                                style={{
                                  width: "100%",
                                  padding: "3px 6px",
                                  boxSizing: "border-box",
                                }}
                                onChange={(e) => handleOrderChange(dt, e.target.value)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Page Tree Outline */}
          <div>
            <h2 style={{ fontSize: "15px", margin: "0 0 8px 0", color: "#0f172a" }}>
              Page Tree Outline
            </h2>
            <div
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                padding: "6px",
                backgroundColor: "#f8fafc",
              }}
            >
              {treeNodes.length === 0 ? (
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>Empty tree</span>
              ) : (
                treeNodes.map((node) => (
                  <div
                    key={node.shape.id}
                    style={{
                      paddingLeft: `${node.depth * 14 + 4}px`,
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      paddingRight: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                      borderRadius: "3px",
                      backgroundColor:
                        node.shape.id === selectedShapeId ? "#dbeafe" : "transparent",
                      color: node.shape.id === selectedShapeId ? "#1d4ed8" : "#334155",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                    onClick={() => selectShape(node.shape.id)}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {node.displayName}
                    </span>
                    {node.conflict && (
                      <span
                        style={{
                          backgroundColor: "#fee2e2",
                          color: "#dc2626",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "1px 4px",
                          borderRadius: "2px",
                          marginLeft: "4px",
                          flexShrink: 0,
                        }}
                        title={node.conflict.reason}
                      >
                        conflict
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
