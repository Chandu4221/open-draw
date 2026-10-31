// Closed registry of interaction states (R-009/R-012): one item = one folder
// = one index.ts, always. This file is the registry index.
import { DRAWING_SHAPE } from "./drawing-shape";
import { DRAGGING_SHAPE } from "./dragging-shape";
import { IDLE } from "./idle";
import { PANNING } from "./panning";
import { POINTING_HANDLE } from "./pointing-handle";
import { POINTING_SHAPE } from "./pointing-shape";
import { RESIZING_SHAPE } from "./resizing-shape";

export const STATES = {
  idle: IDLE,
  pointingShape: POINTING_SHAPE,
  pointingHandle: POINTING_HANDLE,
  draggingShape: DRAGGING_SHAPE,
  resizingShape: RESIZING_SHAPE,
  drawingShape: DRAWING_SHAPE,
  panning: PANNING,
} as const;

export type CanvasStateId = (typeof STATES)[keyof typeof STATES];
