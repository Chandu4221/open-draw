import { describe, expect, it } from "vitest";
import { createDocument } from "@open-draw/document";
import { GESTURE_KINDS } from "./gestures";
import { TOOLS } from "./tools";
import { computeEditorOverlays } from "./editor-overlays";

describe("computeEditorOverlays", () => {
  it("renders select tool marquee overlay with borders only and no background fill", () => {
    const doc = createDocument();
    const overlays = computeEditorOverlays({
      doc,
      selectedId: null,
      selectedIds: [],
      gesture: {
        kind: GESTURE_KINDS.select,
        pointerId: 1,
        startScreen: { x: 50, y: 50 },
        startWorld: { x: 50, y: 50 },
        shapeIds: [],
        handleId: null,
        originalBox: null,
        parentHit: null,
        targetShapeId: null,
        points: [],
      },
      tool: TOOLS.select,
      lastWorld: { x: 200, y: 150 },
      zoom: 1,
    });

    expect(overlays.length).toBe(1);
    const marqueeSvg = overlays[0]!;
    expect(marqueeSvg).toContain('fill="none"');
    expect(marqueeSvg).not.toContain("var(--od-accent-soft");
    expect(marqueeSvg).toContain('stroke="var(--od-accent, #000000)"');
    expect(marqueeSvg).toContain('stroke-dasharray="4 4"');
  });
});
