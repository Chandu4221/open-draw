import { describe, expect, it } from "vitest";
import { createDocument } from "@open-draw/document";
import { RENDER_STYLES } from "@open-draw/renderer-svg";
import { parseShapeId } from "@open-draw/contracts";
import { createPage, createRect } from "@open-draw/document";
import { GESTURE_KINDS } from "./gestures";
import { TOOLS } from "./tools";
import { computeEditorOverlays } from "./editor-overlays";

describe("computeEditorOverlays", () => {
  it("renders select tool marquee overlay using RENDER_STYLES without hardcoded css variables", () => {
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
    expect(marqueeSvg).not.toContain("var(--od-accent");
    expect(marqueeSvg).toContain(`stroke="${RENDER_STYLES.selectionStroke}"`);
    expect(marqueeSvg).toContain(`stroke-dasharray="${RENDER_STYLES.selectionDasharray}"`);
  });

  it("renders multi-selection item outlines using RENDER_STYLES without hardcoded css variables", () => {
    const pageId = parseShapeId("page-1");
    const r1 = parseShapeId("rect-1");
    const r2 = parseShapeId("rect-2");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
      createRect(r1, { x: 10, y: 10, width: 50, height: 50 }, { parent: pageId }),
      createRect(r2, { x: 100, y: 100, width: 50, height: 50 }, { parent: pageId }),
    ]);

    const overlays = computeEditorOverlays({
      doc,
      selectedId: null,
      selectedIds: [r1, r2],
      gesture: null,
      tool: TOOLS.select,
      lastWorld: { x: 0, y: 0 },
      zoom: 1,
    });

    expect(overlays.length).toBeGreaterThan(0);
    const joined = overlays.join("");
    expect(joined).not.toContain("var(--od-accent");
    expect(joined).toContain(`stroke="${RENDER_STYLES.multiSelectionStroke}"`);
    expect(joined).toContain(`stroke-dasharray="${RENDER_STYLES.selectionDasharray}"`);
  });
});
