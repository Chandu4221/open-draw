// Macro rendering and scale benchmarks across 2k, 5k, 10k, and 20k shapes (2x Safety).
import { describe, expect, it } from "vitest";
import { parseShapeId, ROOT_ID } from "@open-draw/contracts";
import { createDocument, createRect, type Shape } from "@open-draw/document";
import { documentToSvg } from "@open-draw/renderer-svg";
import { cameraToViewportBox } from "./camera";
import { createCanvas } from "./create-canvas";
import { querySpatialIndexBox } from "./spatial/spatial-index";

function generateGridDocument(count: number): Shape[] {
  const shapes: Shape[] = [];
  const cols = Math.ceil(Math.sqrt(count * 1.5));
  for (let i = 1; i <= count; i++) {
    const col = (i - 1) % cols;
    const row = Math.floor((i - 1) / cols);
    shapes.push(
      createRect(
        parseShapeId(`macro-rect-${i}`),
        { x: col * 80 + 10, y: row * 80 + 10, width: 60, height: 60 },
        { parentId: ROOT_ID },
      ),
    );
  }
  return shapes;
}

describe("Macro Rendering Benchmarks (ADR-0008, ADR-0011)", () => {
  const scales = [
    { count: 2000, label: "2k baseline", maxCullMs: 30, maxHitMs: 1.0 },
    { count: 5000, label: "5k macro scale", maxCullMs: 70, maxHitMs: 1.0 },
    { count: 10000, label: "10k stress scale", maxCullMs: 150, maxHitMs: 1.5 },
    { count: 20000, label: "20k 2x Safety scale", maxCullMs: 350, maxHitMs: 2.0 },
  ];

  for (const { count, label, maxCullMs, maxHitMs } of scales) {
    it(`evaluates ${label} (${count} shapes) within strict latency budgets`, () => {
      const shapes = generateGridDocument(count);
      const doc = createDocument(shapes);
      const canvas = createCanvas();

      // 1. Spatial indexing & initial culling benchmark
      const startCull = performance.now();
      const spatialIndex = canvas.getSpatialIndex(doc);
      const cam = { x: 500, y: 500, zoom: 1 };
      const viewportBox = cameraToViewportBox(cam, 1200, 800, 128);
      const hits = querySpatialIndexBox(spatialIndex, viewportBox);
      const visibleIds = new Set(hits.map((h) => h.id));
      const cullDurationMs = performance.now() - startCull;

      expect(cullDurationMs).toBeLessThan(maxCullMs);
      expect(visibleIds.size).toBeGreaterThan(0);
      expect(visibleIds.size).toBeLessThanOrEqual(count);

      // 2. Viewport rendering benchmark with culled set
      const startRender = performance.now();
      const svg = documentToSvg(doc, { visibleShapeIds: visibleIds });
      const renderDurationMs = performance.now() - startRender;

      expect(renderDurationMs).toBeLessThan(maxCullMs * 2);
      expect(svg).toContain("<rect");

      // 3. Point hit-testing latency across 50 sample probes
      const probePoints = [
        { x: 90, y: 90 },
        { x: 450, y: 350 },
        { x: 890, y: 650 },
        { x: 1250, y: 950 },
        { x: 99999, y: 99999 }, // miss
      ];

      const startHit = performance.now();
      const rounds = 10;
      for (let r = 0; r < rounds; r++) {
        for (const pt of probePoints) {
          canvas.pickShape(doc, pt);
        }
      }
      const totalHitMs = performance.now() - startHit;
      const avgHitMs = totalHitMs / (rounds * probePoints.length);

      expect(avgHitMs).toBeLessThan(maxHitMs);
    });
  }
});
