import { test, expect } from '@playwright/test';

test.describe('Ink Shape & Capability B2x.8 E2E Gate', () => {
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
    });
  });

  test('synthetic 20-move sine squiggle -> stroke created, simplified point count < raw count', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.setTool('ink');
    });

    const containerBox = await page.locator('#canvas-container').boundingBox();
    expect(containerBox).not.toBeNull();

    const startX = (containerBox?.x ?? 0) + 100;
    const startY = (containerBox?.y ?? 0) + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // Generate synthetic 20-move sine squiggle
    for (let i = 1; i <= 20; i++) {
      const x = startX + i * 15;
      const y = startY + Math.sin(i * 0.5) * 30;
      await page.mouse.move(x, y);
    }
    await page.mouse.up();

    // 1. Verify shape exists in store
    const shapes = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
    expect(shapes.length).toBe(1);

    const shape = shapes[0];
    expect(shape.type).toBe('ink');

    // 2. Raw moves: 1 start + 20 moves = 21 points = 42 float coordinates
    // RDP simplification with epsilon 1.5 must reduce point count
    const pts = shape.props.pts as number[];
    expect(pts).toBeDefined();
    expect(pts.length).toBeGreaterThan(4);
    expect(pts.length).toBeLessThan(42);

    // 3. Verify DOM render
    const pathLocator = page.locator(`.od-shape[data-id="${shape.id}"] path.od-ink-path`);
    await expect(pathLocator).toBeVisible();

    const d = await pathLocator.getAttribute('d');
    expect(d).not.toBeNull();
    expect(d?.startsWith('M ')).toBe(true);
    expect(d?.includes('L ')).toBe(true);

    // 4. Verify tool reset back to select
    const currentTool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
    expect(currentTool).toBe('select');
  });

  test('highlighter variant creates translucent wide stroke (mix-blend-mode: multiply, stroke-opacity: 0.4)', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.setTool('highlighter');
    });

    const containerBox = await page.locator('#canvas-container').boundingBox();
    expect(containerBox).not.toBeNull();

    const startX = (containerBox?.x ?? 0) + 150;
    const startY = (containerBox?.y ?? 0) + 150;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(startX + i * 20, startY + i * 5);
    }
    await page.mouse.up();

    const shapes = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
    expect(shapes.length).toBe(1);

    const shape = shapes[0];
    expect(shape.type).toBe('highlighter');
    expect(shape.props.isHighlighter).toBe(true);
    expect(shape.props.strokeWidth).toBe(20);

    const path = page.locator(`.od-shape[data-id="${shape.id}"] path.od-ink-path`);
    await expect(path).toBeVisible();

    const strokeOpacity = await path.getAttribute('stroke-opacity');
    expect(strokeOpacity).toBe('0.4');

    const mixBlendMode = await path.evaluate((el) => window.getComputedStyle(el).mixBlendMode);
    expect(mixBlendMode).toBe('multiply');

    const stroke = await path.getAttribute('stroke');
    expect(stroke).toBe('#fef08a');
  });

  test('overlay invariant on ink (slot is last child, pointer-events: none, identity transform, label glued at start)', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const ink = editor.createShape({
        type: 'ink',
        x: 100,
        y: 100,
        props: {
          pts: [100, 100, 150, 120, 200, 100, 250, 130],
          label: 'Vector Signature',
        },
      });
      return ink.id;
    });

    const checkInvariant = async () => {
      return page.evaluate((id) => {
        const editor = (window as any).__od_debug__.editor;
        const wrapper = document.querySelector(`.od-shape[data-id="${id}"]`) as SVGGElement | null;
        const slot = editor.getOverlaySlot(id);
        if (!wrapper || !slot) return null;

        const isLastChild = wrapper.lastElementChild === slot;
        const pointerEvents = window.getComputedStyle(slot).pointerEvents;
        const transformAttr = slot.getAttribute('transform');
        const label = slot.querySelector('.od-ink-label');

        return {
          isLastChild,
          pointerEvents,
          hasIdentityTransform: !transformAttr || transformAttr === '' || transformAttr === 'matrix(1, 0, 0, 1, 0, 0)',
          labelText: label?.textContent,
          labelX: Number(label?.getAttribute('x')),
          labelY: Number(label?.getAttribute('y')),
        };
      }, shapeId);
    };

    const initial = await checkInvariant();
    expect(initial).not.toBeNull();
    expect(initial?.isLastChild).toBe(true);
    expect(initial?.pointerEvents).toBe('none');
    expect(initial?.hasIdentityTransform).toBe(true);
    expect(initial?.labelText).toBe('Vector Signature');
    expect(initial?.labelX).toBe(0); // pts[0] (100) - shape.x (100) = 0
    expect(initial?.labelY).toBe(-6); // pts[1] (100) - shape.y (100) - 6 = -6

    // Pan and zoom check
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.pan(1200, -800);
      editor.setCamera({ x: 200, y: 150, zoom: 2.5 });
    });

    const transformed = await checkInvariant();
    expect(transformed?.isLastChild).toBe(true);
    expect(transformed?.pointerEvents).toBe('none');
    expect(transformed?.hasIdentityTransform).toBe(true);
    expect(transformed?.labelText).toBe('Vector Signature');
  });

  test('perf spot-check: 100 strokes initial render < 100ms (observation recorded)', async ({ page }) => {
    const elapsed = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;

      // Prepare 100 ink stroke records
      const shapes = [];
      for (let i = 0; i < 100; i++) {
        const pts: number[] = [];
        const sx = (i % 10) * 120 + 20;
        const sy = Math.floor(i / 10) * 80 + 20;
        for (let j = 0; j < 20; j++) {
          pts.push(sx + j * 5, sy + Math.sin(j * 0.4) * 15);
        }
        shapes.push({
          id: `perf-ink-${i}`,
          type: i % 5 === 0 ? 'highlighter' : 'ink',
          x: sx,
          y: sy,
          props: {
            pts,
            stroke: i % 5 === 0 ? '#fef08a' : '#3b82f6',
            strokeWidth: i % 5 === 0 ? 16 : 3,
            isHighlighter: i % 5 === 0,
            label: i === 0 ? 'Batch Ink Perf' : undefined,
          },
          rotation: 0,
          hidden: false,
          meta: {},
        });
      }

      const t0 = performance.now();
      editor.renderer.renderAll(shapes);
      const t1 = performance.now();

      return t1 - t0;
    });

    console.log(`[PERF SPOT-CHECK] 100 ink strokes initial renderAll: ${elapsed.toFixed(2)}ms`);
    expect(elapsed).toBeLessThan(100);

    // Capture visual artifact for verification
    await page.screenshot({ path: 'docs/od-verification/2x/ink.png' });
  });
});
