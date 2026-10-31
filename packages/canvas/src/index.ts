/// @open-draw/canvas — public SDK contract surface (R-004, R-010, R-036).
/// Pure interaction core and canvas controller.

export {
  type Camera,
  DEFAULT_CAMERA,
  MAX_ZOOM,
  MIN_ZOOM,
  panBy,
  screenToWorld,
  worldToScreen,
  zoomAt,
} from "./camera";

export {
  type CanvasEvent,
  CANVAS_EVENTS,
  type KeyEscapeEvent,
  type PointerDownEvent,
  type PointerMoveEvent,
  type PointerUpEvent,
  type WheelEvent,
} from "./events";

export { MIN_SHAPE_SIZE, normalizeBox, resizeBox } from "./geometry";

export { type HandleId, HANDLES } from "./handles";

export { HANDLE_PICK_RADIUS_PX, pickHandle, pickShape, pointInBox } from "./hit-test";

export { INITIAL_MACHINE_STATE, type MachineState, transition } from "./machine";

export {
  clearSelection,
  EMPTY_SELECTION,
  isSelected,
  type Selection,
  selectOne,
  singleSelected,
} from "./selection";

export { type CanvasStateId, STATES } from "./states";

export { TOOLS, type ToolId } from "./tools";

export { type CanvasController, type CanvasOptions, createCanvas } from "./create-canvas";
