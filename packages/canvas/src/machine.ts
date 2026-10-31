// Interaction state machine: a pure (state, event) → state table (R-009).
// The machine owns state, not side effects — gesture effects (transactions)
// are computed by the shell at pointer-up: one gesture = one commit (R-008,
// R-018). Camera changes are transforms handled by the shell (R-017); the
// machine ignores wheel events.
import type { Point, ShapeId } from "@open-draw/contracts";
import type { HandleId } from "./handles";
import { CANVAS_EVENTS, type CanvasEvent } from "./events";
import { STATES, type CanvasStateId } from "./states";
import { TOOLS } from "./tools";

export interface MachineState {
  readonly stateId: CanvasStateId;
  readonly activeShapeId: ShapeId | null;
  readonly activeHandleId: HandleId | null;
  readonly drawOrigin: Point | null;
}

export const INITIAL_MACHINE_STATE: MachineState = {
  stateId: STATES.idle,
  activeShapeId: null,
  activeHandleId: null,
  drawOrigin: null,
};

export function transition(previous: MachineState, event: CanvasEvent): MachineState {
  switch (event.type) {
    case CANVAS_EVENTS.pointerDown: {
      if (event.panRequested) {
        return { ...INITIAL_MACHINE_STATE, stateId: STATES.panning };
      }
      // A draw tool always draws — even over pages and shapes. Checked BEFORE
      // hit/handle so drawing inside an existing page is never hijacked into
      // a drag of the page itself (review round 2, Finding 1).
      if (event.tool !== TOOLS.select) {
        return {
          ...INITIAL_MACHINE_STATE,
          stateId: STATES.drawingShape,
          drawOrigin: event.worldPoint,
        };
      }
      if (event.handle !== null) {
        return {
          ...INITIAL_MACHINE_STATE,
          stateId: STATES.pointingHandle,
          activeShapeId: event.selectedShapeId,
          activeHandleId: event.handle,
        };
      }
      if (event.hit !== null) {
        return {
          ...INITIAL_MACHINE_STATE,
          stateId: STATES.pointingShape,
          activeShapeId: event.hit,
        };
      }
      return INITIAL_MACHINE_STATE;
    }
    case CANVAS_EVENTS.pointerMove: {
      if (previous.stateId === STATES.pointingShape) {
        return { ...previous, stateId: STATES.draggingShape };
      }
      if (previous.stateId === STATES.pointingHandle) {
        return { ...previous, stateId: STATES.resizingShape };
      }
      return previous;
    }
    case CANVAS_EVENTS.pointerUp: {
      return INITIAL_MACHINE_STATE;
    }
    case CANVAS_EVENTS.wheel: {
      return previous;
    }
    case CANVAS_EVENTS.keyEscape: {
      return INITIAL_MACHINE_STATE;
    }
  }
}
