// Batteries-included standalone canvas editor (R-004, R-008, R-010, R-016, R-018, ADR-0008).
// Mounts an interactive SVG drawing canvas into any DOM container with zero framework dependencies.
import type { Point } from "@open-draw/contracts";
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
  type HistoryState,
} from "@open-draw/document";
import { documentToSvg } from "@open-draw/renderer-svg";
import { DEFAULT_CAMERA } from "./camera";
import { createCanvas } from "./create-canvas";
import { CONTROLLER_EVENTS } from "./events";
import { TOOLS, type ToolId } from "./tools";
import { type ActiveGesture, seedShapeSequence } from "./editor-gestures";
import { computeEditorOverlays } from "./editor-overlays";
import { attachPointerListeners } from "./editor-pointer";
import { attachKeyboardListeners } from "./editor-keyboard";
import { exportDocumentToSvg } from "./editor-export";
import type { Editor, EditorOptions } from "./editor-types";

export type { Editor, EditorOptions, EditorOverlayContext } from "./editor-types";

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
  svg.setAttribute("tabindex", "0");
  svg.setAttribute("role", "region");
  svg.setAttribute("aria-label", "Drawing canvas");
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

  function reconcileSelection(): void {
    const current = canvas.getSelectedIds();
    const surviving = current.filter((id) => doc.shapes[id] !== undefined);
    if (surviving.length !== current.length) {
      if (surviving.length === 0) {
        canvas.clearSelection();
      } else {
        canvas.selectMany(surviving);
      }
    }
  }

  function updateCameraTransform(): void {
    const cam = canvas.getCamera();
    viewport.setAttribute(
      "transform",
      `translate(${-cam.x * cam.zoom} ${-cam.y * cam.zoom}) scale(${cam.zoom})`,
    );
  }

  function renderDocument(): void {
    docScene.innerHTML = documentToSvg(doc, {
      activeDeviceType: canvas.getActiveDeviceType(),
      activeDeviceTypes: canvas.getActiveDeviceTypes(),
      customRenderers: options.customRenderers,
      onFallback: (evt) => {
        options.onFallback?.(`Fallback render: ${evt.shapeId} (${evt.kind})`);
      },
    });
  }

  function renderOverlays(): void {
    const cam = canvas.getCamera();
    const activeDeviceType = canvas.getActiveDeviceType();
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

  function render(): void {
    updateCameraTransform();
    renderDocument();
    renderOverlays();
  }

  function execute(commands: Command | readonly Command[], opts?: { record?: boolean }): void {
    const cmds = Array.isArray(commands) ? commands : [commands];
    if (cmds.length === 0) return;
    const result = applyTransaction(doc, createTransaction(cmds));
    doc = result.document;
    reconcileSelection();
    if (opts?.record !== false) {
      history = recordHistory(history, result.inverse);
      canvas.emit(CONTROLLER_EVENTS.historyChanged);
    }
    canvas.emit(CONTROLLER_EVENTS.documentChanged);
    renderDocument();
    renderOverlays();
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1;
    const deltaX = event.deltaX * factor;
    const deltaY = event.deltaY * factor;
    const r = svg.getBoundingClientRect();
    const screen = { x: event.clientX - r.left, y: event.clientY - r.top };
    if (event.ctrlKey || event.metaKey) {
      canvas.zoomAt(screen, Math.exp(-deltaY * 0.002));
    } else {
      canvas.panBy({ x: -deltaX, y: -deltaY });
    }
  }

  svg.addEventListener("wheel", onWheel, { passive: false });

  const detachPointer = attachPointerListeners({
    svg,
    canvas,
    getDoc: () => doc,
    getTool: () => activeTool,
    setTool: (t) => {
      activeTool = t;
      canvas.emit(CONTROLLER_EVENTS.toolChanged);
      renderOverlays();
    },
    getSpacePressed: () => spacePressed,
    execute: (cmds) => execute(cmds),
    render: () => renderOverlays(),
    getGesture: () => gesture,
    setGesture: (g) => {
      gesture = g;
    },
    setLastWorld: (p) => {
      lastWorld = p;
    },
    nestingMode: options.nestingMode,
  });

  const detachKeyboard = attachKeyboardListeners({
    canvas,
    getDoc: () => doc,
    setDoc: (nextDoc) => {
      doc = nextDoc;
      reconcileSelection();
      renderDocument();
      renderOverlays();
    },
    getHistory: () => history,
    setHistory: (nextHistory) => {
      history = nextHistory;
    },
    setTool: (t) => {
      activeTool = t;
      canvas.emit(CONTROLLER_EVENTS.toolChanged);
      renderOverlays();
    },
    setSpacePressed: (pressed) => {
      spacePressed = pressed;
    },
    resetGesture: () => {
      gesture = null;
    },
    execute: (cmds) => execute(cmds),
    render: () => renderOverlays(),
  });

  const unsubCamera = canvas.subscribe(CONTROLLER_EVENTS.cameraChanged, () => {
    updateCameraTransform();
    renderOverlays();
  });
  const unsubSelection = canvas.subscribe(CONTROLLER_EVENTS.selectionChanged, () => {
    renderOverlays();
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
      canvas.emit(CONTROLLER_EVENTS.historyChanged);
      canvas.emit(CONTROLLER_EVENTS.documentChanged);
      renderDocument();
      renderOverlays();
    },
    loadJson: (json) => {
      const loaded = parseDocument(json);
      doc = loaded;
      seedShapeSequence(loaded);
      history = EMPTY_HISTORY;
      canvas.clearSelection();
      canvas.emit(CONTROLLER_EVENTS.historyChanged);
      canvas.emit(CONTROLLER_EVENTS.documentChanged);
      renderDocument();
      renderOverlays();
    },
    toJson: () => serializeDocument(doc),
    toSvg: () =>
      exportDocumentToSvg(doc, {
        activeDeviceType: canvas.getActiveDeviceType(),
        activeDeviceTypes: canvas.getActiveDeviceTypes(),
        customRenderers: options.customRenderers,
      }),
    execute,
    undo: () => {
      const undone = undo(doc, history);
      if (undone === null) return false;
      doc = undone.document;
      history = undone.history;
      reconcileSelection();
      canvas.emit(CONTROLLER_EVENTS.historyChanged);
      canvas.emit(CONTROLLER_EVENTS.documentChanged);
      renderDocument();
      renderOverlays();
      return true;
    },
    redo: () => {
      const redone = redo(doc, history);
      if (redone === null) return false;
      doc = redone.document;
      history = redone.history;
      reconcileSelection();
      canvas.emit(CONTROLLER_EVENTS.historyChanged);
      canvas.emit(CONTROLLER_EVENTS.documentChanged);
      renderDocument();
      renderOverlays();
      return true;
    },
    canUndo: () => history.undoStack.length > 0,
    canRedo: () => history.redoStack.length > 0,
    getTool: () => activeTool,
    setTool: (nextTool) => {
      activeTool = nextTool;
      canvas.emit(CONTROLLER_EVENTS.toolChanged);
      renderOverlays();
    },
    getSelection: () => canvas.getSelectedIds(),
    select: (id) => canvas.select(id),
    selectMany: (ids) => canvas.selectMany(ids),
    clearSelection: () => canvas.clearSelection(),
    getCamera: () => canvas.getCamera(),
    setCamera: (cam) => canvas.setCamera(cam),
    zoomIn: () => {
      const r = svg.getBoundingClientRect();
      canvas.zoomAt({ x: r.width / 2, y: r.height / 2 }, 1.25);
    },
    zoomOut: () => {
      const r = svg.getBoundingClientRect();
      canvas.zoomAt({ x: r.width / 2, y: r.height / 2 }, 0.8);
    },
    resetZoom: () => canvas.setCamera(DEFAULT_CAMERA),
    subscribe: (event, listener) => canvas.subscribe(event, listener),
    render,
    destroy: () => {
      detachPointer();
      detachKeyboard();
      unsubCamera();
      unsubSelection();
      svg.removeEventListener("wheel", onWheel);
      if (container.contains(svg)) container.removeChild(svg);
    },
  };
}
