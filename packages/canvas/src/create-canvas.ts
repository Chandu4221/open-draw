// Canvas controller entry point (R-004, R-008, R-036, ADR-0003 D1).
// Encapsulates machine transition, camera transform, selection state,
// shape-kind capabilities, and action dispatch.
import type { BoundingBox, CapabilityId, DeviceType, Point, ShapeId } from "@open-draw/contracts";
import type { Document } from "@open-draw/document";
import type { ActionId, KeyboardEventDescriptor } from "@open-draw/input";
import { resolveKeyBinding } from "@open-draw/input";
import { type Camera, DEFAULT_CAMERA, panBy, screenToWorld, worldToScreen, zoomAt } from "./camera";
import { CONTROLLER_EVENTS, type CanvasEvent, type ControllerEvent } from "./events";
import type { HandleId } from "./handles";
import { pickHandle, pickShape, resolveSelectionDrillDown } from "./hit-test";
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
  pickHandle(worldBox: BoundingBox, screenPoint: Point): HandleId | null;
  resolveAction(event: KeyboardEventDescriptor): ActionId | undefined;
  resolveSelectionDrillDown(doc: Document, hitId: ShapeId, isDoubleClick?: boolean): ShapeId;

  subscribe(event: ControllerEvent, listener: () => void): () => void;
  emit(event: ControllerEvent): void;

  getActiveDeviceType(): DeviceType | undefined;
  setActiveDeviceType(deviceType?: DeviceType): void;

  getVisibleChipRootIds(): ReadonlySet<ShapeId>;
  isRootChipsVisible(rootId: ShapeId): boolean;
  toggleRootChipsVisible(rootId: ShapeId): void;
  setRootChipsVisible(rootId: ShapeId, visible: boolean): void;
}

export function createCanvas(options: CanvasOptions = {}): CanvasController {
  let camera = options.camera ?? DEFAULT_CAMERA;
  let selection = options.selection ?? EMPTY_SELECTION;
  let activeDeviceType = options.activeDeviceType;
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
  };

  const emit = (event: ControllerEvent): void => {
    const set = listeners[event];
    if (set !== undefined) {
      for (const listener of set) {
        listener();
      }
    }
  };

  return {
    getCamera: () => camera,
    setCamera: (next) => {
      camera = next;
    },
    panBy: (delta) => {
      camera = panBy(camera, delta);
    },
    zoomAt: (point, factor) => {
      camera = zoomAt(camera, point, factor);
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
      machine = transition(machine, event);
      return machine;
    },
    resetMachine: () => {
      machine = INITIAL_MACHINE_STATE;
    },

    getShapeKindRegistry: () => shapeKindRegistry,
    registerShapeKind: (registration) => {
      shapeKindRegistry = registerShapeKind(shapeKindRegistry, registration);
    },
    hasCapability: (kind, capability) => shapeKindRegistry.hasCapability(kind, capability),

    pickShape: (doc, point) => pickShape(doc, point, shapeKindRegistry),
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

    getActiveDeviceType: () => activeDeviceType,
    setActiveDeviceType: (deviceType) => {
      activeDeviceType = deviceType;
    },

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
