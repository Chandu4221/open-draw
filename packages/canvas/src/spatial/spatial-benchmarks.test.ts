// Scale and performance benchmarks for in-tree 2D STR R-Tree (ADR-0011).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createDocument, createPage, createRect, type Shape } from "@open-draw/document";
import {
  buildSpatialIndexFromDocument,
  querySpatialIndexBox,
  querySpatialIndexPoint,
} from "./spatial-index";

describe("Spatial Index Scale & Performance (ADR-0011)", () => {
  it("bulk-builds and queries a 2,000 shape document under tight performance budgets", () => {
    const pageId = parseShapeId("page-main");
    const shapes: Shape[] = [createPage(pageId, { x: 0, y: 0, width: 5000, height: 5000 })];

    // Generate 2,000 shapes in a 50 x 40 grid
    const totalShapes = 2000;
    const cols = 50;
    for (let i = 1; i <= totalShapes; i += 1) {
      const col = (i - 1) % cols;
      const row = Math.floor((i - 1) / cols);
      shapes.push(
        createRect(
          parseShapeId(`rect-${i}`),
          { x: col * 80 + 10, y: row * 80 + 10, width: 60, height: 60 },
          { parent: pageId },
        ),
      );
    }

    const doc = createDocument(shapes);

    // 1. Benchmark bulk build
    const startBuild = performance.now();
    const index = buildSpatialIndexFromDocument(doc);
    const buildDurationMs = performance.now() - startBuild;

    expect(index.count).toBe(totalShapes + 1);
    // Bulk build of 2,000 items in STR R-Tree executes rapidly even under heavy CPU contention
    expect(buildDurationMs).toBeLessThan(250);

    // 2. Benchmark point queries
    const queryPoints = [
      { x: 50, y: 50 },
      { x: 800, y: 400 },
      { x: 1600, y: 1200 },
      { x: 2400, y: 1600 },
      { x: 3200, y: 2400 },
      { x: 9999, y: 9999 }, // empty space outside
    ];

    const startQueries = performance.now();
    for (let round = 0; round < 20; round += 1) {
      for (const pt of queryPoints) {
        querySpatialIndexPoint(index, pt);
      }
    }
    const queryDurationMs = performance.now() - startQueries;
    const avgQueryMs = queryDurationMs / (20 * queryPoints.length);

    // Each spatial point query executes with sub-millisecond latency (ADR-0011)
    expect(avgQueryMs).toBeLessThan(0.5);

    // 3. Verify hit accuracy against known points
    const hit1 = querySpatialIndexPoint(index, { x: 50, y: 50 });
    expect(hit1.length).toBeGreaterThanOrEqual(1);
    expect(hit1[0]?.id).toBe(parseShapeId("rect-1"));

    const emptyHit = querySpatialIndexPoint(index, { x: 9999, y: 9999 });
    expect(emptyHit).toHaveLength(0);

    // 4. Benchmark marquee box query
    const marqueeBox = { x: 100, y: 100, width: 500, height: 500 };
    const boxHits = querySpatialIndexBox(index, marqueeBox);
    expect(boxHits.length).toBeGreaterThan(0);
    expect(boxHits.length).toBeLessThan(totalShapes);
  });
});
