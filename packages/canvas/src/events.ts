// Named interaction events from the registry (R-019). The imperative shell
// computes hits and intents; the machine consumes pure data (R-008/R-009).
import type { Point, ShapeId } from "@open-draw/contracts";
import type { HandleId } from "./handles";
import type { ToolId } from "./tools";

export const CANVAS_EVENTS = {
  pointerDown: "pointerDown",
  pointerMove: "pointerMove",
  pointerUp: "pointerUp",
  pointerCancel: "pointerCancel",
  doubleClick: "doubleClick",
  wheel: "wheel",
  keyEscape: "keyEscape",
} as const;

// Named controller events from the registry (R-005, R-019).
export const CONTROLLER_EVENTS = {
  documentChanged: "documentChanged",
  selectionChanged: "selectionChanged",
  historyChanged: "historyChanged",
  cameraChanged: "cameraChanged",
  toolChanged: "toolChanged",
  machineChanged: "machineChanged",
} as const;

export type ControllerEvent = (typeof CONTROLLER_EVENTS)[keyof typeof CONTROLLER_EVENTS];

export interface PointerDownEvent {
  readonly type: (typeof CANVAS_EVENTS)["pointerDown"];
  readonly screenPoint: Point;
  readonly worldPoint: Point;
  readonly hit: ShapeId | null;
  readonly handle: HandleId | null;
  readonly selectedShapeId: ShapeId | null;
  readonly tool: ToolId;
  readonly panRequested: boolean;
}

export interface PointerMoveEvent {
  readonly type: (typeof CANVAS_EVENTS)["pointerMove"];
  readonly screenPoint: Point;
  readonly worldPoint: Point;
}

export interface PointerUpEvent {
  readonly type: (typeof CANVAS_EVENTS)["pointerUp"];
  readonly screenPoint: Point;
  readonly worldPoint: Point;
}

export interface CanvasWheelEvent {
  readonly type: (typeof CANVAS_EVENTS)["wheel"];
  readonly screenPoint: Point;
  readonly factor: number;
}
export type WheelEvent = CanvasWheelEvent;

export interface PointerCancelEvent {
  readonly type: (typeof CANVAS_EVENTS)["pointerCancel"];
}

export interface KeyEscapeEvent {
  readonly type: (typeof CANVAS_EVENTS)["keyEscape"];
}

export interface DoubleClickEvent {
  readonly type: (typeof CANVAS_EVENTS)["doubleClick"];
  readonly screenPoint: Point;
  readonly worldPoint: Point;
  readonly hit: ShapeId | null;
}

export type CanvasEvent =
  | PointerDownEvent
  | PointerMoveEvent
  | PointerUpEvent
  | PointerCancelEvent
  | DoubleClickEvent
  | CanvasWheelEvent
  | KeyEscapeEvent;
