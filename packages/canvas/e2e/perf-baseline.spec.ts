import { test, expect } from '@playwright/test';

test.describe('Phase 2.z §1: Performance Telemetry & 100-Shape Baseline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-container');
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.loadSnapshot({
        version: 1,
        shapes: [],
        camera: { x: 0, y: 0, zoom: 1 },
      });
      editor.clearSelection();

      // Populate 100 mixed shapes on canvas
      const types = ['rect', 'ellipse', 'note', 'frame', 'arrow'];
      for (let i = 0; i < 100; i++) {
        const type = types[i % types.length]!;
        const col = i % 10;
        const row = Math.floor(i / 10);
        const x = 50 + col * 120;
        const y = 50 + row * 100;

        if (type === 'arrow') {
          editor.createShape({
            id: `shape-${i}`,
            type: 'arrow',
            x,
            y,
            props: { startPoint: { x, y }, endPoint: { x: x + 80, y: y + 50 } },
          });
        } else if (type === 'frame') {
          editor.createShape({
            id: `shape-${i}`,
            type: 'frame',
            x,
            y,
            props: { width: 90, height: 70, label: `Frame ${i}` },
          });
        } else {
          editor.createShape({
            id: `shape-${i}`,
            type,
            x,
            y,
            props: { width: 80, height: 60, fill: '#3b82f6' },
          });
        }
      }
    });
  });

  test('measure 100-shape baseline across drag, resize, rotate, and pan', async ({ page }) => {
    test.setTimeout(60000);

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // --- 1. Single-shape drag (100 shapes on canvas) ---
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.selectShape('shape-0'); // Rect at (50, 50), w=80, h=60
      editor.telemetry.enable();
      editor.telemetry.reset();
    });

    // Center of shape-0 is at (90, 80)
    await page.mouse.move(cx + 90, cy + 80);
    await page.mouse.down();
    for (let step = 0; step < 180; step++) {
      const angle = (step / 30) * Math.PI * 2;
      const x = cx + 90 + Math.cos(angle) * 50;
      const y = cy + 80 + Math.sin(angle) * 30;
      await page.mouse.move(x, y);
      await page.waitForTimeout(16); // ~60Hz input
    }
    await page.mouse.up();

    const dragMetrics = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      return editor.telemetry.getMetrics();
    });

    console.log('[PERF BASELINE] Drag 100 shapes:', JSON.stringify(dragMetrics));

    // --- 2. 8-handle resize (100 shapes on canvas) ---
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.telemetry.reset();
    });

    // SE handle for shape-0 at (50+80, 50+60) = (130, 110)
    await page.mouse.move(cx + 130, cy + 110);
    await page.mouse.down();
    for (let step = 0; step < 180; step++) {
      const offset = Math.sin((step / 20) * Math.PI) * 40;
      await page.mouse.move(cx + 130 + offset, cy + 110 + offset / 2);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();

    const resizeMetrics = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      return editor.telemetry.getMetrics();
    });

    console.log('[PERF BASELINE] Resize 100 shapes:', JSON.stringify(resizeMetrics));

    // --- 3. Rotate handle drag (100 shapes on canvas) ---
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.telemetry.reset();
    });

    // Center of shape-0 is at (90, 80). Rotate handle is at (90, 50 - 24) = (90, 26)
    await page.mouse.move(cx + 90, cy + 26);
    await page.mouse.down();
    for (let step = 0; step < 180; step++) {
      const angle = (step / 30) * Math.PI * 2;
      const x = cx + 90 + Math.cos(angle) * 60;
      const y = cy + 80 + Math.sin(angle) * 60;
      await page.mouse.move(x, y);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();

    const rotateMetrics = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      return editor.telemetry.getMetrics();
    });

    console.log('[PERF BASELINE] Rotate 100 shapes:', JSON.stringify(rotateMetrics));

    // --- 4. Camera pan at 1x (100 shapes on canvas) ---
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.telemetry.reset();
    });

    for (let step = 0; step < 180; step++) {
      const dx = Math.sin((step / 20) * Math.PI) * 10;
      const dy = Math.cos((step / 20) * Math.PI) * 10;
      await page.evaluate(({ dx, dy }) => {
        const editor = (window as any).__od_debug__.editor;
        editor.telemetry.recordInput();
        editor.pan(dx, dy);
      }, { dx, dy });
      await page.waitForTimeout(16);
    }

    const panMetrics = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      return editor.telemetry.getMetrics();
    });

    console.log('[PERF BASELINE] Pan 100 shapes:', JSON.stringify(panMetrics));

    // CI Performance Regression Fence (§3)
    // Budget: <= 16.6ms p95 latency (60fps threshold) and 0 dropped frames
    const BUDGET_P95_MS = 16.6;
    expect(dragMetrics.p95LatencyMs, `Drag p95 latency ${dragMetrics.p95LatencyMs}ms exceeds budget ${BUDGET_P95_MS}ms`).toBeLessThanOrEqual(BUDGET_P95_MS);
    expect(resizeMetrics.p95LatencyMs, `Resize p95 latency ${resizeMetrics.p95LatencyMs}ms exceeds budget ${BUDGET_P95_MS}ms`).toBeLessThanOrEqual(BUDGET_P95_MS);
    expect(rotateMetrics.p95LatencyMs, `Rotate p95 latency ${rotateMetrics.p95LatencyMs}ms exceeds budget ${BUDGET_P95_MS}ms`).toBeLessThanOrEqual(BUDGET_P95_MS);
    expect(panMetrics.p95LatencyMs, `Pan p95 latency ${panMetrics.p95LatencyMs}ms exceeds budget ${BUDGET_P95_MS}ms`).toBeLessThanOrEqual(BUDGET_P95_MS);

    expect(dragMetrics.droppedFrames, 'Drag dropped frames must be 0').toBe(0);
    expect(resizeMetrics.droppedFrames, 'Resize dropped frames must be 0').toBe(0);
    expect(rotateMetrics.droppedFrames, 'Rotate dropped frames must be 0').toBe(0);
    expect(panMetrics.droppedFrames, 'Pan dropped frames must be 0').toBe(0);
  });
});
