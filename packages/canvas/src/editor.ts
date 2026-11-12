// Batteries-included standalone canvas editor (R-004, R-008, R-010, R-016, R-018, ADR-0008).
// Mounts an interactive SVG drawing canvas into any DOM container with zero framework dependencies.
import {
  isRootId,
  type BoundingBox,
  type CustomShapeKind,
  type DeviceType,
  type Point,
  type ShapeId,
} from "@open-draw/contracts";
import {
  applyTransaction,
  COMMANDS,
  createDocument,
  createTransaction,
  EMPTY_HISTORY,
  isCustomShape,
  parseDocument,
  recordHistory,
  redo,
  serializeDocument,
  undo,
  type Command,
  type Document,
  type HistoryState,
  type Shape,
} from "@open-draw/document";
import {
  documentToSvg,
  escapeXml,
  renderSingleShapeSvg,
  type ShapeSvgRenderer,
} from "@open-draw/renderer-svg";
import { cameraToViewportBox, DEFAULT_CAMERA } from "./camera";
import { createCanvas } from "./create-canvas";
import { querySpatialIndexBox } from "./spatial/spatial-index";
import { CONTROLLER_EVENTS } from "./events";
import { TOOLS, type ToolId } from "./tools";
import { type ActiveGesture, createShapeIdGenerator } from "./editor-gestures";
import { computeEditorOverlays } from "./editor-overlays";
import { attachPointerListeners } from "./editor-pointer";
import { attachKeyboardListeners } from "./editor-keyboard";
import { exportDocumentToSvg } from "./editor-export";
import { resolveToolCursor } from "./cursor";
import {
  createDefaultCustomShape,
  validateCustomShapeExtension,
  type CustomShapeCreateOptions,
  type CustomShapeExtension,
} from "./extension";
import type { Editor, EditorOptions, SetDocumentOptions } from "./editor-types";

export type {
  Editor,
  EditorOptions,
  EditorOverlayContext,
  SetDocumentOptions,
} from "./editor-types";

function isPropertyMutationCommand(cmd: Command): boolean {
  return (
    cmd.type === COMMANDS.setShapeStyle ||
    cmd.type === COMMANDS.setShapeLabel ||
    cmd.type === COMMANDS.setShapeContent ||
    cmd.type === COMMANDS.setShapeSemantic ||
    cmd.type === COMMANDS.setShapeHiddenOn
  );
}

function isGeometryMutationCommand(cmd: Command): boolean {
  return (
    cmd.type === COMMANDS.createShape ||
    cmd.type === COMMANDS.deleteShape ||
    cmd.type === COMMANDS.reparentShape ||
    cmd.type === COMMANDS.moveShapes ||
    cmd.type === COMMANDS.setShapeBoundingBox ||
    cmd.type === COMMANDS.duplicateShapes
  );
}

export function createEditor(container: HTMLElement, options: EditorOptions = {}): Editor {
  const canvas = createCanvas(options.canvasOptions);
  let doc = options.document ?? createDocument([]);
  const idSequence = createShapeIdGenerator(doc);
  let history: HistoryState = EMPTY_HISTORY;
  let activeTool: ToolId = options.tool ?? TOOLS.select;
  let gesture: ActiveGesture | null = null;
  let lastWorld: Point = { x: 0, y: 0 };
  let spacePressed = false;
  let isDestroyed = false;

  const customShapeRegistry: Record<string, CustomShapeExtension> = Object.create(null);
  const activeCustomRenderers: Record<string, ShapeSvgRenderer> = {
    ...(options.customRenderers ?? {}),
  };

  function validateAndHydrateDocument(targetDoc: Document): Document {
    let modified = false;
    const shapes: Shape[] = [];
    for (const shape of Object.values(targetDoc.shapes)) {
      if (isRootId(shape.id)) continue;
      const ext = customShapeRegistry[shape.kind];
      if (ext) {
        let current = shape;
        if (ext.deserialize && isCustomShape(shape) && shape.customData !== undefined) {
          current = ext.deserialize(shape.customData, shape);
          modified = true;
        }
        if (ext.validate) {
          ext.validate(current);
        }
        shapes.push(current);
      } else {
        shapes.push(shape);
      }
    }
    return modified ? createDocument(shapes) : targetDoc;
  }

  function registerCustomShape(extension: CustomShapeExtension): void {
    validateCustomShapeExtension(extension);
    canvas.registerShapeKind({
      kind: extension.kind,
      capabilities: extension.capabilities,
      ...(extension.hitTest !== undefined ? { hitTest: extension.hitTest } : {}),
    });
    activeCustomRenderers[extension.kind] = extension.render;
    customShapeRegistry[extension.kind] = extension;
    const hasAnyInstances = Object.values(doc.shapes).some((s) => s.kind === extension.kind);
    if (hasAnyInstances) {
      doc = validateAndHydrateDocument(doc);
      renderDocument(true);
    }
  }

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

  let renderedDoc: Document | null = null;
  let renderedVisibleIds: ReadonlySet<ShapeId> | undefined = undefined;

  function setsEqual(
    a: ReadonlySet<ShapeId> | undefined,
    b: ReadonlySet<ShapeId> | undefined,
  ): boolean {
    if (a === undefined && b === undefined) return true;
    if (a === undefined || b === undefined) return false;
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }

  function renderDocument(force?: boolean, incrementalShapeIds?: ReadonlySet<ShapeId>): void {
    if (isDestroyed) return;
    const cam = canvas.getCamera();
    let visibleShapeIds: ReadonlySet<ShapeId> | undefined;

    const hasZeroContainer =
      typeof container.clientWidth === "number" &&
      typeof container.clientHeight === "number" &&
      (container.clientWidth === 0 || container.clientHeight === 0);

    const rect = hasZeroContainer ? { width: 0, height: 0 } : svg.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : container.clientWidth;
    const height = rect.height > 0 ? rect.height : container.clientHeight;
    if (width > 0 && height > 0) {
      const spatialIndex = canvas.getSpatialIndex(doc);
      const viewportBox = cameraToViewportBox(cam, width, height, 128);
      const hits = querySpatialIndexBox(spatialIndex, viewportBox);
      const set = new Set(hits.map((h) => h.id));
      for (const id of canvas.getSelectedIds()) {
        set.add(id);
      }
      visibleShapeIds = set;
    } else {
      visibleShapeIds = new Set();
    }

    if (!force && doc === renderedDoc && setsEqual(renderedVisibleIds, visibleShapeIds)) {
      return;
    }

    const renderOpts = {
      activeDeviceType: canvas.getActiveDeviceType(),
      activeDeviceTypes: canvas.getActiveDeviceTypes(),
      customRenderers: activeCustomRenderers,
      visibleShapeIds,
      wrapShapeId: true,
      onFallback: (evt: { shapeId: ShapeId; kind: string }) => {
        options.onFallback?.(`Fallback render: ${evt.shapeId} (${evt.kind})`);
      },
    };

    if (
      !force &&
      incrementalShapeIds !== undefined &&
      incrementalShapeIds.size > 0 &&
      renderedDoc !== null &&
      setsEqual(renderedVisibleIds, visibleShapeIds) &&
      typeof docScene.querySelector === "function"
    ) {
      let domPatched = true;
      for (const id of incrementalShapeIds) {
        const shape = doc.shapes[id];
        const prevShape = renderedDoc.shapes[id];
        if (!shape || !prevShape || shape.parentId !== prevShape.parentId) {
          domPatched = false;
          break;
        }
        const targetEl = docScene.querySelector(`[data-shape-id="${escapeXml(id)}"]`);
        if (targetEl && "outerHTML" in targetEl) {
          const newSvg = renderSingleShapeSvg(doc, shape, renderOpts);
          try {
            (targetEl as SVGElement).outerHTML = newSvg;
          } catch {
            domPatched = false;
            break;
          }
        } else {
          domPatched = false;
          break;
        }
      }

      if (domPatched) {
        renderedDoc = doc;
        renderedVisibleIds = visibleShapeIds;
        return;
      }
    }

    renderedDoc = doc;
    renderedVisibleIds = visibleShapeIds;

    docScene.innerHTML = documentToSvg(doc, renderOpts);
  }

  function renderOverlays(): void {
    if (isDestroyed) return;
    const cam = canvas.getCamera();
    const activeDeviceType = canvas.getActiveDeviceType();
    const customOverlays = options.renderCustomOverlays?.({
      doc,
      selectedIds: canvas.getSelectedIds(),
      camera: cam,
      zoom: cam.zoom,
      activeDeviceType,
      canvas,
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
    if (isDestroyed) return;
    updateCameraTransform();
    renderDocument();
    renderOverlays();
  }

  function execute(commands: Command | readonly Command[], opts?: { record?: boolean }): void {
    if (isDestroyed) return;
    const cmds = Array.isArray(commands) ? commands : [commands];
    if (cmds.length === 0) return;
    const result = applyTransaction(doc, createTransaction(cmds));
    if (result.document === doc && result.inverse.length === 0) {
      return;
    }
    const hasGeometryChange = cmds.some(isGeometryMutationCommand);
    if (hasGeometryChange) {
      canvas.invalidateSpatialIndex();
    }
    const isAllPropertyMutations = cmds.every(isPropertyMutationCommand);
    const affectedShapeIds = isAllPropertyMutations
      ? new Set((cmds as Array<{ id: ShapeId }>).map((c) => c.id))
      : undefined;

    canvas.batch(() => {
      doc = result.document;
      reconcileSelection();
      if (opts?.record !== false && result.inverse.length > 0) {
        history = recordHistory(history, result.inverse);
        canvas.emit(CONTROLLER_EVENTS.historyChanged);
      }
      canvas.emit(CONTROLLER_EVENTS.documentChanged);
    });
    renderDocument(false, affectedShapeIds);
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

  function updateCursor(): void {
    svg.style.cursor = resolveToolCursor(activeTool, spacePressed);
  }

  const detachPointer = attachPointerListeners({
    svg,
    canvas,
    getDoc: () => doc,
    getTool: () => activeTool,
    setTool: (t) => {
      activeTool = t;
      canvas.emit(CONTROLLER_EVENTS.toolChanged);
      updateCursor();
      renderOverlays();
    },
    getSpacePressed: () => spacePressed,
    execute: (cmds) => execute(cmds),
    render: () => renderOverlays(),
    renderDocument: (force) => renderDocument(force),
    getGesture: () => gesture,
    setGesture: (g) => {
      gesture = g;
    },
    setLastWorld: (p) => {
      lastWorld = p;
    },
    nestingMode: options.nestingMode ?? "containers-only",
    nextShapeId: idSequence.nextShapeId,
    interceptPointerDown: options.interceptPointerDown,
    onDoubleClick: (hitId) => {
      options.onDoubleClick?.(hitId);
    },
    snapConfig: options.snapping,
  });

  const detachKeyboard = attachKeyboardListeners({
    canvas,
    container,
    svg,
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
      updateCursor();
      renderOverlays();
    },
    setSpacePressed: (pressed) => {
      spacePressed = pressed;
      updateCursor();
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
    renderDocument();
    renderOverlays();
  });
  const unsubSelection = canvas.subscribe(CONTROLLER_EVENTS.selectionChanged, () => {
    renderDocument();
    renderOverlays();
  });

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      if (isDestroyed) return;
      renderDocument();
      renderOverlays();
    });
    resizeObserver.observe(container);
  }

  if (options.customShapes) {
    for (const ext of options.customShapes) {
      registerCustomShape(ext);
    }
  }

  render();
  updateCursor();

  function resetDoc(nextDoc: Document, preserveHistory?: boolean): void {
    canvas.invalidateSpatialIndex();
    const validated = validateAndHydrateDocument(nextDoc);
    doc = validated;
    idSequence.seed(validated);
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
    canvas.invalidateSpatialIndex();
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
    toJson: () => {
      const hasCustomSerializers = Object.values(customShapeRegistry).some((ext) =>
        Boolean(ext?.serialize),
      );
      if (!hasCustomSerializers) {
        return serializeDocument(doc);
      }
      const shapes: Shape[] = [];
      let modified = false;
      for (const shape of Object.values(doc.shapes)) {
        if (isRootId(shape.id)) continue;
        const ext = customShapeRegistry[shape.kind];
        if (ext?.serialize && isCustomShape(shape)) {
          const serializedData = ext.serialize(shape);
          shapes.push({
            ...shape,
            customData: serializedData,
          });
          modified = true;
        } else {
          shapes.push(shape);
        }
      }
      const docToSerialize = modified ? createDocument(shapes) : doc;
      return serializeDocument(docToSerialize);
    },
    toSvg: () =>
      exportDocumentToSvg(doc, {
        activeDeviceType: canvas.getActiveDeviceType(),
        activeDeviceTypes: canvas.getActiveDeviceTypes(),
        customRenderers: activeCustomRenderers,
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
      updateCursor();
      renderOverlays();
    },

    getSelection: () => canvas.getSelectedIds(),
    select: (id) => {
      if (doc.shapes[id] !== undefined) {
        canvas.select(id);
      } else {
        canvas.clearSelection();
      }
    },
    selectMany: (ids) => {
      const surviving = ids.filter((id) => doc.shapes[id] !== undefined);
      canvas.selectMany(surviving);
    },
    reconcileSelection: () => reconcileSelection(),
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
    registerCustomShape,
    getCustomShape: (kind: CustomShapeKind | string) => customShapeRegistry[kind],
    getCustomShapes: () => Object.values(customShapeRegistry),
    insertCustomShape: (
      kind: CustomShapeKind,
      box: BoundingBox,
      opts?: CustomShapeCreateOptions,
    ): Shape => {
      const ext = customShapeRegistry[kind];
      const shapeId = idSequence.nextShapeId(doc);
      const shape = ext
        ? createDefaultCustomShape(ext, shapeId, box, opts)
        : createDefaultCustomShape(
            {
              kind,
              label: kind,
              capabilities: [],
              render: () => "",
            },
            shapeId,
            box,
            opts,
          );
      if (ext?.validate) {
        ext.validate(shape);
      }
      execute([{ type: COMMANDS.createShape, shape }]);
      canvas.select(shapeId);
      return shape;
    },
    render,
    destroy: () => {
      isDestroyed = true;
      detachPointer();
      detachKeyboard();
      unsubCamera();
      unsubSelection();
      canvas.clearListeners();
      svg.removeEventListener("wheel", onWheel);
      if (resizeObserver !== null) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      if (container.contains(svg)) container.removeChild(svg);
    },
  };
}
