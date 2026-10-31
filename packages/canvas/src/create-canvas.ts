// Canvas controller entry point (R-004, R-008, R-036, ADR-0003 D1).
// Encapsulates machine transition, camera transform, selection state,
// shape-kind capabilities, and action dispatch.
import type { BoundingBox, CapabilityId, Point, ShapeId } from "@open-draw/contracts";
import type { Document } from "@open-draw/document";
import type { ActionId, KeyboardEventDescriptor } from "@open-draw/input";
import { resolveKeyBinding } from "@open-draw/input";
import { type Camera, DEFAULT_CAMERA, panBy, screenToWorld, worldToScreen, zoomAt } from "./camera";
import type { CanvasEvent } from "./events";
import type { HandleId } from "./handles";
import { pickHandle, pickShape } from "./hit-test";
import { INITIAL_MACHINE_STATE, type MachineState, transition } from "./machine";
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
  selectOne,
  singleSelected,
} from "./selection";

export interface CanvasOptions {
  readonly camera?: Camera;
  readonly selection?: Selection;
  readonly shapeKinds?: ShapeKindRegistry | readonly ShapeKindRegistration[];
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
  select(id: ShapeId): void;
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
}

export function createCanvas(options: CanvasOptions = {}): CanvasController {
  let camera = options.camera ?? DEFAULT_CAMERA;
  let selection = options.selection ?? EMPTY_SELECTION;
  let machine = INITIAL_MACHINE_STATE;
  let shapeKindRegistry: ShapeKindRegistry =
    options.shapeKinds === undefined
      ? createShapeKindRegistry()
      : Array.isArray(options.shapeKinds)
        ? createShapeKindRegistry(options.shapeKinds)
        : (options.shapeKinds as ShapeKindRegistry);

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
    select: (id) => {
      selection = selectOne(id);
    },
    clearSelection: () => {
      selection = clearSelection();
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
  };
}
