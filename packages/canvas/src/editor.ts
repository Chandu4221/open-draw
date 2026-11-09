// Batteries-included standalone canvas editor (R-004, R-008, R-010, R-016, R-018, ADR-0008).
// Mounts an interactive SVG drawing canvas into any DOM container with zero framework dependencies.
import type { DeviceType, Point, ShapeId } from "@open-draw/contracts";
import {
  applyTransaction,
  COMMANDS,
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
import { DEFAULT_CAMERA } from "./camera";
import { createCanvas } from "./create-canvas";
import { CONTROLLER_EVENTS } from "./events";
import { TOOLS, type ToolId } from "./tools";
import { type ActiveGesture, createShapeIdGenerator } from "./editor-gestures";
import { computeEditorOverlays } from "./editor-overlays";
import { attachPointerListeners } from "./editor-pointer";
import { attachKeyboardListeners } from "./editor-keyboard";
import { mountInlineTextEditor } from "./editor-text";
import { exportDocumentToSvg } from "./editor-export";
import type { Editor, EditorOptions, SetDocumentOptions } from "./editor-types";

export type {
  Editor,
  EditorOptions,
  EditorOverlayContext,
  SetDocumentOptions,
} from "./editor-types";

export function createEditor(container: HTMLElement, options: EditorOptions = {}): Editor {
  const canvas = createCanvas(options.canvasOptions);
  let doc = options.document ?? createDocument([]);
  const idSequence = createShapeIdGenerator(doc);
  let history: HistoryState = EMPTY_HISTORY;
  let activeTool: ToolId = options.tool ?? TOOLS.select;
  let gesture: ActiveGesture | null = null;
  let lastWorld: Point = { x: 0, y: 0 };
  let spacePressed = false;
  let activeInlineEditor: (() => void) | null = null;

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
    nextShapeId: idSequence.nextShapeId,
    onDoubleClick: (hitId) => {
      if (activeInlineEditor !== null) {
        activeInlineEditor();
        activeInlineEditor = null;
      }
      activeInlineEditor = mountInlineTextEditor({
        container,
        doc,
        shapeId: hitId,
        camera: canvas.getCamera(),
        onCommit: (id, content) => {
          activeInlineEditor = null;
          execute([{ type: COMMANDS.setShapeContent, id, content }]);
        },
        onCancel: () => {
          activeInlineEditor = null;
        },
      });
    },
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
    nextShapeId: idSequence.nextShapeId,
  });

  const unsubCamera = canvas.subscribe(CONTROLLER_EVENTS.cameraChanged, () => {
    updateCameraTransform();
    renderOverlays();
  });
  const unsubSelection = canvas.subscribe(CONTROLLER_EVENTS.selectionChanged, () => {
    renderOverlays();
  });

  render();

  function resetDoc(nextDoc: Document, preserveHistory?: boolean): void {
    doc = nextDoc;
    idSequence.seed(nextDoc);
    if (!preserveHistory) {
      history = EMPTY_HISTORY;
      canvas.emit(CONTROLLER_EVENTS.historyChanged);
    }
    canvas.clearSelection();
    canvas.emit(CONTROLLER_EVENTS.documentChanged);
    renderDocument();
    renderOverlays();
  }

  function applyHistory(result: { document: Document; history: HistoryState } | null): boolean {
    if (result === null) return false;
    doc = result.document;
    history = result.history;
    reconcileSelection();
    canvas.emit(CONTROLLER_EVENTS.historyChanged);
    canvas.emit(CONTROLLER_EVENTS.documentChanged);
    renderDocument();
    renderOverlays();
    return true;
  }

  return {
    container,
    svg,
    canvas,
    getDocument: () => doc,
    setDocument: (nextDoc, opts?: SetDocumentOptions) => resetDoc(nextDoc, opts?.preserveHistory),
    loadJson: (json, opts?: SetDocumentOptions) =>
      resetDoc(parseDocument(json), opts?.preserveHistory),
    toJson: () => serializeDocument(doc),
    toSvg: () =>
      exportDocumentToSvg(doc, {
        activeDeviceType: canvas.getActiveDeviceType(),
        activeDeviceTypes: canvas.getActiveDeviceTypes(),
        customRenderers: options.customRenderers,
      }),
    setTextContent: (id: ShapeId, content: string | null) => {
      execute([{ type: COMMANDS.setShapeContent, id, content }]);
    },
    setShapeStyle: (id: ShapeId, style) => {
      execute([{ type: COMMANDS.setShapeStyle, id, ...style }]);
    },
    setShapeOrder: (id: ShapeId, deviceType: DeviceType, order: number | null) => {
      execute([{ type: COMMANDS.setShapeOrder, id, deviceType, order }]);
    },
    execute,
    undo: () => applyHistory(undo(doc, history)),
    redo: () => applyHistory(redo(doc, history)),
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
      if (activeInlineEditor !== null) {
        activeInlineEditor();
        activeInlineEditor = null;
      }
      detachPointer();
      detachKeyboard();
      unsubCamera();
      unsubSelection();
      svg.removeEventListener("wheel", onWheel);
      if (container.contains(svg)) container.removeChild(svg);
    },
  };
}
