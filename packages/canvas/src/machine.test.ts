// Interaction machine behavior (R-009/R-015). Ids are branded types — use
// parseShapeId at the boundary (R-006), never bare literals.
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { CANVAS_EVENTS } from "./events";
import { INITIAL_MACHINE_STATE, transition } from "./machine";
import { STATES } from "./states";
import { TOOLS } from "./tools";

const downOnShape = {
  type: CANVAS_EVENTS.pointerDown,
  screenPoint: { x: 0, y: 0 },
  worldPoint: { x: 10, y: 10 },
  hit: parseShapeId("shape-1"),
  handle: null,
  selectedShapeId: null,
  tool: TOOLS.select,
  panRequested: false,
} as const;

describe("interaction machine", () => {
  it("goes idle to pointingShape on pointer down over a shape", () => {
    const next = transition(INITIAL_MACHINE_STATE, downOnShape);
    expect(next.stateId).toBe(STATES.pointingShape);
    expect(next.activeShapeId).toBe("shape-1");
  });

  it("promotes pointingShape to draggingShape on the first move", () => {
    const pointing = transition(INITIAL_MACHINE_STATE, downOnShape);
    const dragging = transition(pointing, {
      type: CANVAS_EVENTS.pointerMove,
      screenPoint: { x: 5, y: 5 },
      worldPoint: { x: 15, y: 15 },
    });
    expect(dragging.stateId).toBe(STATES.draggingShape);
  });

  it("returns to idle on pointer up", () => {
    const dragging = transition(transition(INITIAL_MACHINE_STATE, downOnShape), {
      type: CANVAS_EVENTS.pointerMove,
      screenPoint: { x: 5, y: 5 },
      worldPoint: { x: 15, y: 15 },
    });
    const released = transition(dragging, {
      type: CANVAS_EVENTS.pointerUp,
      screenPoint: { x: 5, y: 5 },
      worldPoint: { x: 15, y: 15 },
    });
    expect(released.stateId).toBe(STATES.idle);
  });

  it("starts drawing on pointer down over empty space with a draw tool", () => {
    const next = transition(INITIAL_MACHINE_STATE, {
      ...downOnShape,
      hit: null,
      tool: TOOLS.drawRect,
    });
    expect(next.stateId).toBe(STATES.drawingShape);
    expect(next.drawOrigin).toEqual({ x: 10, y: 10 });
  });

  it("draws even when the pointer is over a shape with a draw tool", () => {
    // Review round 2, Finding 1: the draw-tool check MUST win over the hit —
    // otherwise drawing inside the default page drags the page instead.
    const next = transition(INITIAL_MACHINE_STATE, {
      ...downOnShape,
      tool: TOOLS.drawRect,
    });
    expect(next.stateId).toBe(STATES.drawingShape);
  });

  it("stays idle on pointer down over empty space with the select tool", () => {
    const next = transition(INITIAL_MACHINE_STATE, { ...downOnShape, hit: null });
    expect(next.stateId).toBe(STATES.idle);
  });

  it("enters panning when pan is requested", () => {
    const next = transition(INITIAL_MACHINE_STATE, { ...downOnShape, panRequested: true });
    expect(next.stateId).toBe(STATES.panning);
  });

  it("cancels any gesture on escape", () => {
    const drawing = transition(INITIAL_MACHINE_STATE, {
      ...downOnShape,
      hit: null,
      tool: TOOLS.drawEllipse,
    });
    expect(transition(drawing, { type: CANVAS_EVENTS.keyEscape })).toEqual(INITIAL_MACHINE_STATE);
  });
});
