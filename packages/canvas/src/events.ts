// Named interaction events from the registry (R-019). The imperative shell
// computes hits and intents; the machine consumes pure data (R-008/R-009).
import type { Point, ShapeId } from "@open-draw/contracts";
import type { HandleId } from "./handles";
import type { ToolId } from "./tools";

export const CANVAS_EVENTS = {
  pointerDown: "pointerDown",
  pointerMove: "pointerMove",
  pointerUp: "pointerUp",
  wheel: "wheel",
  keyEscape: "keyEscape",
} as const;

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

export interface WheelEvent {
  readonly type: (typeof CANVAS_EVENTS)["wheel"];
  readonly screenPoint: Point;
  readonly factor: number;
}

export interface KeyEscapeEvent {
  readonly type: (typeof CANVAS_EVENTS)["keyEscape"];
}

export type CanvasEvent =
  PointerDownEvent | PointerMoveEvent | PointerUpEvent | WheelEvent | KeyEscapeEvent;
