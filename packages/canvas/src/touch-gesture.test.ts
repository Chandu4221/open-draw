// Tests for pure touch tracker and pinch-to-zoom / pan calculations (R-015).
import { describe, expect, it } from "vitest";
import {
  addTouchPointer,
  createTouchTracker,
  removeTouchPointer,
  updateTouchPointer,
} from "./touch-gesture";

describe("touch-gesture tracker", () => {
  it("tracks pointer addition and removal accurately", () => {
    let tracker = createTouchTracker();
    expect(tracker.pointers.size).toBe(0);
    expect(tracker.lastCenter).toBeNull();
    expect(tracker.lastDistance).toBeNull();

    // 1 pointer added
    tracker = addTouchPointer(tracker, 1, { x: 100, y: 100 });
    expect(tracker.pointers.size).toBe(1);
    expect(tracker.lastCenter).toBeNull();
    expect(tracker.lastDistance).toBeNull();

    // 2nd pointer added
    tracker = addTouchPointer(tracker, 2, { x: 300, y: 100 });
    expect(tracker.pointers.size).toBe(2);
    expect(tracker.lastCenter).toEqual({ x: 200, y: 100 });
    expect(tracker.lastDistance).toBe(200);

    // Remove 1 pointer
    tracker = removeTouchPointer(tracker, 1);
    expect(tracker.pointers.size).toBe(1);
    expect(tracker.lastCenter).toBeNull();
    expect(tracker.lastDistance).toBeNull();
  });

  it("computes pinch zoom factor and pan delta when two pointers expand", () => {
    let tracker = createTouchTracker();
    tracker = addTouchPointer(tracker, 1, { x: 100, y: 100 });
    tracker = addTouchPointer(tracker, 2, { x: 200, y: 100 });

    // Expand distance from 100 to 200 centered at (150, 100)
    const res1 = updateTouchPointer(tracker, 1, { x: 50, y: 100 });
    tracker = res1.tracker;
    expect(res1.pinchDelta).not.toBeNull();
    expect(res1.pinchDelta!.zoomFactor).toBeCloseTo(1.5);
    expect(res1.pinchDelta!.panDelta).toEqual({ x: -25, y: 0 });

    const res2 = updateTouchPointer(tracker, 2, { x: 250, y: 100 });
    expect(res2.pinchDelta).not.toBeNull();
    expect(res2.pinchDelta!.zoomFactor).toBeCloseTo(200 / 150);
    expect(res2.pinchDelta!.center).toEqual({ x: 150, y: 100 });
  });

  it("computes pan delta when two pointers move in parallel without zooming", () => {
    let tracker = createTouchTracker();
    tracker = addTouchPointer(tracker, 1, { x: 100, y: 100 });
    tracker = addTouchPointer(tracker, 2, { x: 200, y: 100 });

    // Move both pointers by (+20, +30)
    const res1 = updateTouchPointer(tracker, 1, { x: 120, y: 130 });
    tracker = res1.tracker;

    const res2 = updateTouchPointer(tracker, 2, { x: 220, y: 130 });

    // The combined zoom factor across both pointer updates is 1.0 (no net scale change)
    const combinedZoom = res1.pinchDelta!.zoomFactor * res2.pinchDelta!.zoomFactor;
    expect(combinedZoom).toBeCloseTo(1.0);
    expect(res2.pinchDelta!.center).toEqual({ x: 170, y: 130 });
  });

  it("returns null pinchDelta when fewer or more than two pointers are active", () => {
    let tracker = createTouchTracker();
    tracker = addTouchPointer(tracker, 1, { x: 10, y: 10 });

    // Single pointer move does not pinch
    const singleMove = updateTouchPointer(tracker, 1, { x: 20, y: 20 });
    expect(singleMove.pinchDelta).toBeNull();

    // 3 pointers active
    tracker = addTouchPointer(tracker, 2, { x: 50, y: 50 });
    tracker = addTouchPointer(tracker, 3, { x: 100, y: 100 });
    const threeMove = updateTouchPointer(tracker, 1, { x: 15, y: 15 });
    expect(threeMove.pinchDelta).toBeNull();
  });
});
