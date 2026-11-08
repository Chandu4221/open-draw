// Batteries-included standalone canvas editor (R-004, R-008, R-010, R-016, R-018, ADR-0008).
// Mounts an interactive SVG drawing canvas into any DOM container with zero framework dependencies.
import type { DeviceType, Point, ShapeId } from "@open-draw/contracts";
import {
  applyTransaction,
  createDocument,
  createTransaction,
  EMPTY_HISTORY,
  parseDocument,
  recordHistory,
  redo,
  serializeDocument,
  undo,
  type Command,
  type Document,
  type HistoryState,
} from "@open-draw/document";
import { documentToSvg } from "@open-draw/renderer-svg";
import { type Camera, DEFAULT_CAMERA } from "./camera";
import { createCanvas, type CanvasController, type CanvasOptions } from "./create-canvas";
import { CONTROLLER_EVENTS, type ControllerEvent } from "./events";
import { TOOLS, type ToolId } from "./tools";
import { type ActiveGesture, seedShapeSequence } from "./editor-gestures";
import { computeEditorOverlays } from "./editor-overlays";
import { attachPointerListeners } from "./editor-pointer";
import { attachKeyboardListeners } from "./editor-keyboard";

export interface EditorOverlayContext {
  readonly doc: Document;
  readonly selectedIds: readonly ShapeId[];
  readonly camera: Camera;
  readonly zoom: number;
  readonly activeDeviceType?: DeviceType | undefined;
}

export interface EditorOptions {
  readonly document?: Document;
  readonly canvasOptions?: CanvasOptions;
  readonly tool?: ToolId;
  readonly renderCustomOverlays?: (context: EditorOverlayContext) => readonly string[];
  readonly onFallback?: (message: string) => void;
}

export interface Editor {
  readonly container: HTMLElement;
  readonly svg: SVGSVGElement;
  readonly canvas: CanvasController;
  getDocument(): Document;
  setDocument(doc: Document): void;
  loadJson(json: string): void;
  toJson(): string;
  toSvg(): string;
  execute(commands: Command | readonly Command[], options?: { record?: boolean }): void;
  undo(): boolean;
  redo(): boolean;
  getTool(): ToolId;
  setTool(tool: ToolId): void;
  getSelection(): readonly ShapeId[];
  select(id: ShapeId): void;
  selectMany(ids: readonly ShapeId[]): void;
  clearSelection(): void;
  getCamera(): Camera;
  setCamera(camera: Camera): void;
  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
  subscribe(event: ControllerEvent, listener: () => void): () => void;
  render(): void;
  destroy(): void;
}

export function createEditor(container: HTMLElement, options: EditorOptions = {}): Editor {
  const canvas = createCanvas(options.canvasOptions);
  let doc = options.document ?? createDocument([]);
  seedShapeSequence(doc);
  let history: HistoryState = EMPTY_HISTORY;
  let activeTool: ToolId = options.tool ?? TOOLS.select;
  let gesture: ActiveGesture | null = null;
  let lastWorld: Point = { x: 0, y: 0 };
  let spacePressed = false;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.style.cssText = "display:block;user-select:none;touch-action:none;overflow:hidden;";

  const viewport = document.createElementNS("http://www.w3.org/2000/svg", "g");
  viewport.setAttribute("class", "od-scene-viewport");
  const docScene = document.createElementNS("http://www.w3.org/2000/svg", "g");
  docScene.setAttribute("class", "od-document-scene");
  const overlayScene = document.createElementNS("http://www.w3.org/2000/svg", "g");
  overlayScene.setAttribute("class", "od-overlay-scene");

  viewport.appendChild(docScene);
  viewport.appendChild(overlayScene);
  svg.appendChild(viewport);
  container.appendChild(svg);

  function render(): void {
    const cam = canvas.getCamera();
    viewport.setAttribute(
      "transform",
      `translate(${-cam.x * cam.zoom} ${-cam.y * cam.zoom}) scale(${cam.zoom})`,
    );

    const activeDeviceType = canvas.getActiveDeviceType();
    const activeDeviceTypes = canvas.getActiveDeviceTypes();

    docScene.innerHTML = documentToSvg(doc, {
      activeDeviceType,
      activeDeviceTypes,
      onFallback: (evt) => {
        options.onFallback?.(`Fallback render: ${evt.shapeId} (${evt.kind})`);
      },
    });

    const customOverlays = options.renderCustomOverlays?.({
      doc,
      selectedIds: canvas.getSelectedIds(),
      camera: cam,
      zoom: cam.zoom,
      activeDeviceType,
    });

    const overlays = computeEditorOverlays({
      doc,
      selectedId: canvas.getSelectedId(),
      selectedIds: canvas.getSelectedIds(),
      gesture,
      tool: activeTool,
      lastWorld,
      zoom: cam.zoom,
      customOverlays,
    });
    overlayScene.innerHTML = overlays.join("");
  }

  function execute(commands: Command | readonly Command[], opts?: { record?: boolean }): void {
    const cmds = Array.isArray(commands) ? commands : [commands];
    if (cmds.length === 0) return;
    const result = applyTransaction(doc, createTransaction(cmds));
    doc = result.document;
    if (opts?.record !== false) {
      history = recordHistory(history, result.inverse);
      canvas.emit(CONTROLLER_EVENTS.historyChanged);
    }
    canvas.emit(CONTROLLER_EVENTS.documentChanged);
    render();
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const r = svg.getBoundingClientRect();
    const screen = { x: event.clientX - r.left, y: event.clientY - r.top };
    if (event.ctrlKey || event.metaKey) {
      canvas.zoomAt(screen, Math.exp(-event.deltaY * 0.002));
    } else {
      canvas.panBy({ x: -event.deltaX, y: -event.deltaY });
    }
    render();
  }

  svg.addEventListener("wheel", onWheel, { passive: false });

  const detachPointer = attachPointerListeners({
    svg,
    canvas,
    getDoc: () => doc,
    getTool: () => activeTool,
    setTool: (t) => {
      activeTool = t;
    },
    getSpacePressed: () => spacePressed,
    execute: (cmds) => execute(cmds),
    render,
    getGesture: () => gesture,
    setGesture: (g) => {
      gesture = g;
    },
    setLastWorld: (p) => {
      lastWorld = p;
    },
  });

  const detachKeyboard = attachKeyboardListeners({
    canvas,
    getDoc: () => doc,
    setDoc: (nextDoc) => {
      doc = nextDoc;
    },
    getHistory: () => history,
    setHistory: (nextHistory) => {
      history = nextHistory;
    },
    setTool: (t) => {
      activeTool = t;
    },
    setSpacePressed: (pressed) => {
      spacePressed = pressed;
    },
    resetGesture: () => {
      gesture = null;
    },
    execute: (cmds) => execute(cmds),
    render,
  });

  render();

  return {
    container,
    svg,
    canvas,
    getDocument: () => doc,
    setDocument: (nextDoc) => {
      doc = nextDoc;
      seedShapeSequence(nextDoc);
      history = EMPTY_HISTORY;
      canvas.clearSelection();
      canvas.emit(CONTROLLER_EVENTS.documentChanged);
      render();
    },
    loadJson: (json) => {
      const loaded = parseDocument(json);
      doc = loaded;
      seedShapeSequence(loaded);
      history = EMPTY_HISTORY;
      canvas.clearSelection();
      canvas.emit(CONTROLLER_EVENTS.documentChanged);
      render();
    },
    toJson: () => JSON.stringify(serializeDocument(doc)),
    toSvg: () => svg.outerHTML,
    execute,
    undo: () => {
      const undone = undo(doc, history);
      if (undone === null) return false;
      doc = undone.document;
      history = undone.history;
      canvas.emit(CONTROLLER_EVENTS.historyChanged);
      canvas.emit(CONTROLLER_EVENTS.documentChanged);
      render();
      return true;
    },
    redo: () => {
      const redone = redo(doc, history);
      if (redone === null) return false;
      doc = redone.document;
      history = redone.history;
      canvas.emit(CONTROLLER_EVENTS.historyChanged);
      canvas.emit(CONTROLLER_EVENTS.documentChanged);
      render();
      return true;
    },
    getTool: () => activeTool,
    setTool: (nextTool) => {
      activeTool = nextTool;
    },
    getSelection: () => canvas.getSelectedIds(),
    select: (id) => {
      canvas.select(id);
      render();
    },
    selectMany: (ids) => {
      canvas.selectMany(ids);
      render();
    },
    clearSelection: () => {
      canvas.clearSelection();
      render();
    },
    getCamera: () => canvas.getCamera(),
    setCamera: (cam) => {
      canvas.setCamera(cam);
      render();
    },
    zoomIn: () => {
      const r = svg.getBoundingClientRect();
      canvas.zoomAt({ x: r.width / 2, y: r.height / 2 }, 1.25);
      render();
    },
    zoomOut: () => {
      const r = svg.getBoundingClientRect();
      canvas.zoomAt({ x: r.width / 2, y: r.height / 2 }, 0.8);
      render();
    },
    resetZoom: () => {
      canvas.setCamera(DEFAULT_CAMERA);
      render();
    },
    subscribe: (event, listener) => canvas.subscribe(event, listener),
    render,
    destroy: () => {
      detachPointer();
      detachKeyboard();
      svg.removeEventListener("wheel", onWheel);
      if (container.contains(svg)) container.removeChild(svg);
    },
  };
}
