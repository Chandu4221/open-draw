// Canvas controller entry point (R-004, R-008, R-036, ADR-0003 D1).
// Encapsulates machine transition, camera transform, selection state,
// shape-kind capabilities, and action dispatch.
import type { BoundingBox, CapabilityId, DeviceType, Point, ShapeId } from "@open-draw/contracts";
import { type Document, shapeListInOrder } from "@open-draw/document";
import type { ActionId, KeyboardEventDescriptor } from "@open-draw/input";
import { resolveKeyBinding } from "@open-draw/input";
import {
  type Camera,
  clampCamera,
  DEFAULT_CAMERA,
  panBy,
  screenToWorld,
  worldToScreen,
  zoomAt,
} from "./camera";
import { CONTROLLER_EVENTS, type CanvasEvent, type ControllerEvent } from "./events";
import type { HandleId } from "./handles";
import { pickHandle, pickShape, pickShapesInBox, resolveSelectionDrillDown } from "./hit-test";
import { buildSpatialIndexFromDocument, type SpatialIndex } from "./spatial/spatial-index";
import { INITIAL_MACHINE_STATE, type MachineState, transition } from "./machine";
import { DEFAULT_SHAPE_REGISTRATIONS } from "./default-shapes";
import {
  createShapeKindRegistry,
  registerShapeKind,
  type ShapeKindRegistration,
  type ShapeKindRegistry,
} from "./register-shape-kind";
import {
  clearSelection,
  EMPTY_SELECTION,
  isSelected,
  type Selection,
  selectMany,
  selectOne,
  selectedIds,
  singleSelected,
  toggleSelection,
} from "./selection";

export interface CanvasOptions {
  readonly camera?: Camera;
  readonly selection?: Selection;
  readonly shapeKinds?: ShapeKindRegistry | readonly ShapeKindRegistration[];
  readonly activeDeviceType?: DeviceType;
  readonly activeDeviceTypes?: Readonly<Record<ShapeId, DeviceType | undefined>>;
  readonly visibleChipRootIds?: readonly ShapeId[] | ReadonlySet<ShapeId>;
}

export interface CanvasController {
  getCamera(): Camera;
  setCamera(camera: Camera): void;
  panBy(screenDelta: Point): void;
  zoomAt(screenPoint: Point, factor: number): void;
  screenToWorld(screenPoint: Point): Point;
  worldToScreen(worldPoint: Point): Point;

  getSelection(): Selection;
  getSelectedId(): ShapeId | null;
  getSelectedIds(): readonly ShapeId[];
  select(id: ShapeId): void;
  selectMany(ids: readonly ShapeId[]): void;
  toggleSelection(id: ShapeId): void;
  clearSelection(): void;
  isSelected(id: ShapeId): boolean;

  getMachineState(): MachineState;
  dispatch(event: CanvasEvent): MachineState;
  resetMachine(): void;

  getShapeKindRegistry(): ShapeKindRegistry;
  registerShapeKind(registration: ShapeKindRegistration): void;
  hasCapability(kind: string, capability: CapabilityId): boolean;

  pickShape(doc: Document, worldPoint: Point): ShapeId | null;
  pickShapesInBox(doc: Document, marqueeBox: BoundingBox): readonly ShapeId[];
  getSpatialIndex(doc: Document): SpatialIndex;
  invalidateSpatialIndex(): void;
  pickHandle(worldBox: BoundingBox, screenPoint: Point): HandleId | null;
  resolveAction(event: KeyboardEventDescriptor): ActionId | undefined;
  resolveSelectionDrillDown(doc: Document, hitId: ShapeId, isDoubleClick?: boolean): ShapeId;

  subscribe(event: ControllerEvent, listener: () => void): () => void;
  emit(event: ControllerEvent): void;
  batch(fn: () => void): void;
  clearListeners(): void;

  getActiveDeviceType(rootId?: ShapeId): DeviceType | undefined;
  setActiveDeviceType(deviceType?: DeviceType, rootId?: ShapeId): void;
  getActiveDeviceTypes(): Readonly<Record<ShapeId, DeviceType | undefined>>;

  getVisibleChipRootIds(): ReadonlySet<ShapeId>;
  isRootChipsVisible(rootId: ShapeId): boolean;
  toggleRootChipsVisible(rootId: ShapeId): void;
  setRootChipsVisible(rootId: ShapeId, visible: boolean): void;
}

export function createCanvas(options: CanvasOptions = {}): CanvasController {
  let camera = clampCamera(options.camera ?? DEFAULT_CAMERA);
  let selection = options.selection ?? EMPTY_SELECTION;
  let activeDeviceType = options.activeDeviceType;
  const scopedDeviceTypes = new Map<ShapeId, DeviceType | undefined>(
    options.activeDeviceTypes !== undefined
      ? (Object.entries(options.activeDeviceTypes) as [ShapeId, DeviceType | undefined][])
      : [],
  );
  const visibleChipRootIds = new Set<ShapeId>(options.visibleChipRootIds ?? []);
  let machine = INITIAL_MACHINE_STATE;
  let shapeKindRegistry: ShapeKindRegistry =
    options.shapeKinds === undefined
      ? createShapeKindRegistry(DEFAULT_SHAPE_REGISTRATIONS)
      : Array.isArray(options.shapeKinds)
        ? createShapeKindRegistry(options.shapeKinds)
        : (options.shapeKinds as ShapeKindRegistry);

  const listeners: Record<ControllerEvent, Set<() => void>> = {
    [CONTROLLER_EVENTS.documentChanged]: new Set(),
    [CONTROLLER_EVENTS.selectionChanged]: new Set(),
    [CONTROLLER_EVENTS.historyChanged]: new Set(),
    [CONTROLLER_EVENTS.cameraChanged]: new Set(),
    [CONTROLLER_EVENTS.toolChanged]: new Set(),
    [CONTROLLER_EVENTS.machineChanged]: new Set(),
  };

  let batchDepth = 0;
  const queuedEvents = new Set<ControllerEvent>();

  const emit = (event: ControllerEvent): void => {
    if (batchDepth > 0) {
      queuedEvents.add(event);
      return;
    }
    const set = listeners[event];
    if (set !== undefined) {
      for (const listener of set) {
        listener();
      }
    }
  };

  /**
   * Batches multiple synchronous controller operations, deferring and deduplicating
   * emitted controller events until the outermost batch scope completes (R-018, ADR-0002 D8).
   * Nested calls increment the batch depth and do not flush prematurely.
   */
  const batch = (fn: () => void): void => {
    batchDepth += 1;
    try {
      fn();
    } finally {
      batchDepth -= 1;
      if (batchDepth === 0) {
        const events = Array.from(queuedEvents);
        queuedEvents.clear();
        for (const event of events) {
          emit(event);
        }
      }
    }
  };

  let cachedSpatialDoc: Document | null = null;
  let cachedSpatialIndex: SpatialIndex | null = null;

  function isSpatialEquivalent(a: Document, b: Document): boolean {
    if (a === b) return true;
    const aShapes = a.shapes;
    const bShapes = b.shapes;
    const aKeys = Object.keys(aShapes);
    const bKeys = Object.keys(bShapes);
    if (aKeys.length !== bKeys.length) return false;
    let keysMatch = true;
    for (let i = 0; i < aKeys.length; i += 1) {
      if (aKeys[i] !== bKeys[i]) {
        keysMatch = false;
        break;
      }
    }
    if (keysMatch) {
      for (let i = 0; i < aKeys.length; i += 1) {
        const id = aKeys[i] as ShapeId;
        const sA = aShapes[id];
        const sB = bShapes[id];
        if (sA === undefined || sB === undefined) return false;
        if (sA === sB) continue;
        if (sA.parentId !== sB.parentId) return false;
        const boxA = sA.boundingBox;
        const boxB = sB.boundingBox;
        if (boxA === boxB) continue;
        if (
          boxA.x !== boxB.x ||
          boxA.y !== boxB.y ||
          boxA.width !== boxB.width ||
          boxA.height !== boxB.height
        ) {
          return false;
        }
      }
      return true;
    }

    // Canonical fallback when key order differed (ADR-0011)
    const aList = shapeListInOrder(a);
    const bList = shapeListInOrder(b);
    if (aList.length !== bList.length) return false;
    for (let i = 0; i < aList.length; i += 1) {
      const sA = aList[i]!;
      const sB = bList[i]!;
      if (sA.id !== sB.id || sA.parentId !== sB.parentId) return false;
      const boxA = sA.boundingBox;
      const boxB = sB.boundingBox;
      if (boxA === boxB) continue;
      if (
        boxA.x !== boxB.x ||
        boxA.y !== boxB.y ||
        boxA.width !== boxB.width ||
        boxA.height !== boxB.height
      ) {
        return false;
      }
    }
    return true;
  }

  function ensureSpatialIndex(doc: Document): SpatialIndex {
    if (
      cachedSpatialIndex !== null &&
      cachedSpatialDoc !== null &&
      isSpatialEquivalent(cachedSpatialDoc, doc)
    ) {
      cachedSpatialDoc = doc;
      return cachedSpatialIndex;
    }
    cachedSpatialDoc = doc;
    cachedSpatialIndex = buildSpatialIndexFromDocument(doc);
    return cachedSpatialIndex;
  }

  return {
    getCamera: () => camera,
    setCamera: (next) => {
      camera = clampCamera(next);
      emit(CONTROLLER_EVENTS.cameraChanged);
    },
    panBy: (delta) => {
      camera = panBy(camera, delta);
      emit(CONTROLLER_EVENTS.cameraChanged);
    },
    zoomAt: (point, factor) => {
      camera = zoomAt(camera, point, factor);
      emit(CONTROLLER_EVENTS.cameraChanged);
    },
    screenToWorld: (point) => screenToWorld(camera, point),
    worldToScreen: (point) => worldToScreen(camera, point),

    getSelection: () => selection,
    getSelectedId: () => singleSelected(selection),
    getSelectedIds: () => selectedIds(selection),
    select: (id) => {
      selection = selectOne(id);
      emit(CONTROLLER_EVENTS.selectionChanged);
    },
    selectMany: (ids) => {
      selection = selectMany(ids);
      emit(CONTROLLER_EVENTS.selectionChanged);
    },
    toggleSelection: (id) => {
      selection = toggleSelection(selection, id);
      emit(CONTROLLER_EVENTS.selectionChanged);
    },
    clearSelection: () => {
      selection = clearSelection();
      emit(CONTROLLER_EVENTS.selectionChanged);
    },
    isSelected: (id) => isSelected(selection, id),

    getMachineState: () => machine,
    dispatch: (event) => {
      const next = transition(machine, event);
      if (next !== machine) {
        machine = next;
        emit(CONTROLLER_EVENTS.machineChanged);
      }
      return machine;
    },
    resetMachine: () => {
      if (machine !== INITIAL_MACHINE_STATE) {
        machine = INITIAL_MACHINE_STATE;
        emit(CONTROLLER_EVENTS.machineChanged);
      }
    },

    getShapeKindRegistry: () => shapeKindRegistry,
    registerShapeKind: (registration) => {
      shapeKindRegistry = registerShapeKind(shapeKindRegistry, registration);
    },
    hasCapability: (kind, capability) => shapeKindRegistry.hasCapability(kind, capability),

    getSpatialIndex: (doc) => ensureSpatialIndex(doc),
    invalidateSpatialIndex: () => {
      cachedSpatialDoc = null;
      cachedSpatialIndex = null;
    },
    pickShape: (doc, point) => pickShape(doc, point, shapeKindRegistry, ensureSpatialIndex(doc)),
    pickShapesInBox: (doc, box) => pickShapesInBox(doc, box, ensureSpatialIndex(doc)),
    pickHandle: (box, point) => pickHandle(camera, box, point),
    resolveAction: (event) => resolveKeyBinding(event),
    resolveSelectionDrillDown: (doc, hitId, isDoubleClick = false) =>
      resolveSelectionDrillDown(doc, hitId, singleSelected(selection), isDoubleClick),

    subscribe: (event, listener) => {
      const set = listeners[event];
      if (set !== undefined) {
        set.add(listener);
        return () => {
          set.delete(listener);
        };
      }
      return () => {};
    },
    emit: (event) => {
      emit(event);
    },
    batch,
    clearListeners: () => {
      for (const set of Object.values(listeners)) {
        set.clear();
      }
    },

    getActiveDeviceType: (rootId) => {
      if (rootId !== undefined && scopedDeviceTypes.has(rootId)) {
        return scopedDeviceTypes.get(rootId);
      }
      return activeDeviceType;
    },
    setActiveDeviceType: (deviceType, rootId) => {
      if (rootId !== undefined) {
        if (deviceType === undefined) {
          scopedDeviceTypes.delete(rootId);
        } else {
          scopedDeviceTypes.set(rootId, deviceType);
        }
      } else {
        activeDeviceType = deviceType;
      }
    },
    getActiveDeviceTypes: () =>
      Object.fromEntries(scopedDeviceTypes.entries()) as Record<ShapeId, DeviceType | undefined>,

    getVisibleChipRootIds: () => visibleChipRootIds,
    isRootChipsVisible: (rootId) => visibleChipRootIds.has(rootId),
    toggleRootChipsVisible: (rootId) => {
      if (visibleChipRootIds.has(rootId)) {
        visibleChipRootIds.delete(rootId);
      } else {
        visibleChipRootIds.add(rootId);
      }
    },
    setRootChipsVisible: (rootId, visible) => {
      if (visible) {
        visibleChipRootIds.add(rootId);
      } else {
        visibleChipRootIds.delete(rootId);
      }
    },
  };
}
