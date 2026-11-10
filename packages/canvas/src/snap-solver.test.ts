// Tests for pure spatial snap solver and alignment guides (R-015).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { HANDLES } from "./handles";
import {
  computeHandleSnap,
  computeSnap,
  SNAP_AXES,
  snapGuidesToSvg,
  type SnapTarget,
} from "./snap-solver";

describe("snap-solver", () => {
  const targetA: SnapTarget = {
    id: parseShapeId("target-a"),
    box: { x: 100, y: 100, width: 200, height: 100 }, // left=100, center=200, right=300, top=100, center=150, bottom=200
  };

  const targetB: SnapTarget = {
    id: parseShapeId("target-b"),
    box: { x: 500, y: 400, width: 100, height: 100 }, // left=500, center=550, right=600, top=400, center=450, bottom=500
  };

  it("snaps candidate left edge to target left edge within threshold", () => {
    // Candidate left at 103 (diff = -3 to align with targetA left at 100)
    const candidate = { x: 103, y: 300, width: 80, height: 50 };
    const result = computeSnap(candidate, [targetA], { thresholdPx: 5, zoom: 1 });

    expect(result.dx).toBe(-3);
    expect(result.dy).toBe(0);
    expect(result.snappedBox.x).toBe(100);
    expect(result.guides).toHaveLength(1);
    expect(result.guides[0]).toEqual({
      axis: SNAP_AXES.x,
      coordinate: 100,
      start: 100,
      end: 350,
    });
  });

  it("snaps candidate center to target center within threshold", () => {
    // targetA center X is 200. Candidate width is 60.
    // If candidate X is 172, candidate center is 202 (diff = -2 to align with 200).
    const candidate = { x: 172, y: 300, width: 60, height: 50 };
    const result = computeSnap(candidate, [targetA], { thresholdPx: 5, zoom: 1 });

    expect(result.dx).toBe(-2);
    expect(result.snappedBox.x).toBe(170);
    expect(result.snappedBox.x + result.snappedBox.width / 2).toBe(200);
    expect(result.guides).toHaveLength(1);
    expect(result.guides[0]!.coordinate).toBe(200);
  });

  it("snaps candidate right edge to target right edge within threshold", () => {
    // targetA right X is 300. Candidate width is 80.
    // Candidate X is 218 -> right is 298 (diff = +2 to align with 300).
    const candidate = { x: 218, y: 300, width: 80, height: 50 };
    const result = computeSnap(candidate, [targetA], { thresholdPx: 5, zoom: 1 });

    expect(result.dx).toBe(2);
    expect(result.snappedBox.x).toBe(220);
    expect(result.snappedBox.x + result.snappedBox.width).toBe(300);
    expect(result.guides).toHaveLength(1);
    expect(result.guides[0]!.coordinate).toBe(300);
  });

  it("snaps candidate top, center, and bottom along Y axis", () => {
    // targetA top is 100, center is 150, bottom is 200.
    // Candidate Y at 97 -> top snaps to 100 (diff = +3).
    const candTop = { x: 500, y: 97, width: 80, height: 60 };
    const resTop = computeSnap(candTop, [targetA], { thresholdPx: 5, zoom: 1 });
    expect(resTop.dy).toBe(3);
    expect(resTop.snappedBox.y).toBe(100);
    expect(resTop.guides[0]).toEqual({
      axis: SNAP_AXES.y,
      coordinate: 100,
      start: 100,
      end: 580,
    });

    // Candidate bottom near targetA bottom: candidate Y at 138, height 60 -> bottom is 198 (diff = +2 to 200).
    const candBottom = { x: 500, y: 138, width: 80, height: 60 };
    const resBottom = computeSnap(candBottom, [targetA], { thresholdPx: 5, zoom: 1 });
    expect(resBottom.dy).toBe(2);
    expect(resBottom.snappedBox.y).toBe(140);
  });

  it("snaps both X and Y simultaneously when both axes align", () => {
    // Candidate left at 102 (targetA left = 100), candidate top at 98 (targetA top = 100)
    const candidate = { x: 102, y: 98, width: 50, height: 50 };
    const result = computeSnap(candidate, [targetA], { thresholdPx: 5, zoom: 1 });

    expect(result.dx).toBe(-2);
    expect(result.dy).toBe(2);
    expect(result.snappedBox.x).toBe(100);
    expect(result.snappedBox.y).toBe(100);
    expect(result.guides).toHaveLength(2);
    expect(result.guides.map((g) => g.axis).sort()).toEqual([SNAP_AXES.x, SNAP_AXES.y]);
  });

  it("selects the closest alignment when multiple targets are within threshold", () => {
    // Target 1 left at 100; Target 2 left at 102.
    // Candidate left at 101.5 -> closer to 102 (distance 0.5) than 100 (distance 1.5).
    const t1: SnapTarget = { box: { x: 100, y: 0, width: 50, height: 50 } };
    const t2: SnapTarget = { box: { x: 102, y: 0, width: 50, height: 50 } };
    const candidate = { x: 101.5, y: 200, width: 50, height: 50 };

    const result = computeSnap(candidate, [t1, t2], { thresholdPx: 5, zoom: 1 });
    expect(result.dx).toBeCloseTo(0.5);
    expect(result.snappedBox.x).toBeCloseTo(102);
  });

  it("ignores excluded targets by id", () => {
    const candidate = { x: 102, y: 300, width: 50, height: 50 };
    const excludeIds = new Set([parseShapeId("target-a")]);

    const result = computeSnap(candidate, [targetA, targetB], {
      thresholdPx: 5,
      zoom: 1,
      excludeIds,
    });
    // targetA is within 2px, but excluded; targetB is at 500 (too far)
    expect(result.dx).toBe(0);
    expect(result.guides).toHaveLength(0);
  });

  it("respects disabled flag and returns zero deltas without guides", () => {
    const candidate = { x: 102, y: 102, width: 50, height: 50 };
    const result = computeSnap(candidate, [targetA], { disabled: true });
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
    expect(result.guides).toHaveLength(0);
  });

  it("scales threshold inversely with zoom", () => {
    // At zoom = 2, threshold 5px screen = 2.5px world.
    // Candidate diff is 3px. At zoom 1 (threshold 5), it snaps; at zoom 2 (threshold 2.5), it does not.
    const candidate = { x: 103, y: 300, width: 50, height: 50 };
    const resZoom1 = computeSnap(candidate, [targetA], { thresholdPx: 5, zoom: 1 });
    expect(resZoom1.dx).toBe(-3);

    const resZoom2 = computeSnap(candidate, [targetA], { thresholdPx: 5, zoom: 2 });
    expect(resZoom2.dx).toBe(0);
  });

  it("constrains snapping to active handle edges during resize", () => {
    // East handle (e): only snaps right edge along X
    // Candidate left at 50, width 248 -> right edge is 298 (targetA right is 300, diff = +2)
    const candEast = { x: 50, y: 500, width: 248, height: 50 };
    const resEast = computeHandleSnap(candEast, HANDLES.e, [targetA], { thresholdPx: 5, zoom: 1 });
    expect(resEast.dx).toBe(2);
    expect(resEast.dy).toBe(0);
    expect(resEast.guides).toHaveLength(1);
    expect(resEast.guides[0]!.axis).toBe(SNAP_AXES.x);
    expect(resEast.guides[0]!.coordinate).toBe(300);

    // North-West handle (nw): snaps left along X and top along Y
    // Candidate left at 102, top at 98 -> left snaps to 100, top snaps to 100
    const candNw = { x: 102, y: 98, width: 50, height: 50 };
    const resNw = computeHandleSnap(candNw, HANDLES.nw, [targetA], { thresholdPx: 5, zoom: 1 });
    expect(resNw.dx).toBe(-2);
    expect(resNw.dy).toBe(2);
    expect(resNw.guides).toHaveLength(2);
  });

  it("renders svg lines with crisp stroke width and dash array", () => {
    const candidate = { x: 101, y: 99, width: 50, height: 50 };
    const result = computeSnap(candidate, [targetA], { thresholdPx: 5, zoom: 2 });
    expect(result.guides).toHaveLength(2);

    const svg = snapGuidesToSvg(result.guides, 2);
    expect(svg).toContain('<line x1="100"');
    expect(svg).toContain('stroke="var(--od-snap-guide, #ff007a)"');
    expect(svg).toContain('stroke-width="0.50"');
  });
});
