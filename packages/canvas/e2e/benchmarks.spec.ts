import { test, expect } from '@playwright/test';
import fs from 'node:fs';

export interface BenchmarkResult {
  shapeCount: number;
  domNodeCount: number;
  ttffMs: number;
  avgDragBlockMs: number;
  maxDragBlockMs: number;
  pan02xMs: number;
  pan10xMs: number;
  pan50xMs: number;
}

test.describe('DOM Canvas Core Benchmark Spike', () => {
  test('measures TTFF, drag main-thread blocking, and pan latency for 100, 500, 1000 shapes', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await page.waitForSelector('#canvas-container');

    const counts = [100, 500, 1000];
    const results: BenchmarkResult[] = [];

    for (const count of counts) {
      const data = await page.evaluate(async (shapeCount) => {
        const editor = (window as any).__od_debug__.editor;

        // Reset camera
        editor.setCamera({ x: 0, y: 0, zoom: 1.0 });

        // 1. Generate grid of simple shapes
        const shapes = [];
        const cols = 25;
        for (let i = 0; i < shapeCount; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          shapes.push({
            id: `shape-${i}`,
            type: 'rect',
            x: col * 120,
            y: row * 120,
            meta: {},
            props: { width: 100, height: 100, fill: '#3b82f6' },
          });
        }

        // 2. Measure Time-To-First-Frame (TTFF)
        const t0 = performance.now();
        editor.loadSnapshot({
          version: 1,
          shapes,
          camera: { x: 0, y: 0, zoom: 1.0 },
        });

        // Wait two animation frames to ensure DOM update and layout/paint completion
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const ttffMs = performance.now() - t0;

        // Count all DOM elements under root SVG
        const domNodeCount = document.querySelectorAll('.od-canvas-root *').length;

        // 3. Measure Main-Thread Blocking during Drag of one shape among N
        const dragTargetId = 'shape-0';
        const targetShape = editor.getShape(dragTargetId);
        const dragSteps = 30;
        const dragBlockTimes: number[] = [];

        editor.store.beginTransaction();
        for (let step = 1; step <= dragSteps; step++) {
          const startTick = performance.now();
          editor.updateShape(dragTargetId, {
            x: targetShape.x + step * 2,
            y: targetShape.y + step * 2,
          });
          const endTick = performance.now();
          dragBlockTimes.push(endTick - startTick);
        }
        editor.store.commitTransaction();

        const avgDragBlockMs = dragBlockTimes.reduce((a, b) => a + b, 0) / dragBlockTimes.length;
        const maxDragBlockMs = Math.max(...dragBlockTimes);

        // 4. Measure Camera Pan at 0.2x, 1.0x, 5.0x
        const measurePanAtZoom = async (zoomLevel: number) => {
          editor.setCamera({ x: 0, y: 0, zoom: zoomLevel });
          await new Promise((r) => requestAnimationFrame(r));

          const panSteps = 20;
          const panDurations: number[] = [];

          for (let step = 1; step <= panSteps; step++) {
            const panStart = performance.now();
            editor.pan(10, 10);
            await new Promise((r) => requestAnimationFrame(r));
            panDurations.push(performance.now() - panStart);
          }

          return panDurations.reduce((a, b) => a + b, 0) / panDurations.length;
        };

        const pan02xMs = await measurePanAtZoom(0.2);
        const pan10xMs = await measurePanAtZoom(1.0);
        const pan50xMs = await measurePanAtZoom(5.0);

        return {
          shapeCount,
          domNodeCount,
          ttffMs,
          avgDragBlockMs,
          maxDragBlockMs,
          pan02xMs,
          pan10xMs,
          pan50xMs,
        };
      }, count);

      results.push(data);
    }

    fs.writeFileSync('docs/od-verification/2/benchmark-results.json', JSON.stringify(results, null, 2));
    expect(results.length).toBe(3);
  });
});
