import { test, expect } from '@playwright/test';
import * as path from 'node:path';
import * as fs from 'node:fs';

test.describe('Phase 2.y §5: Gesture Re-Parenting E2E Gate (closes Q-002)', () => {
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
    });
  });

  test('drag rect from frame A into frame B, undo, and drag out to empty canvas', async ({ page }) => {
    const { frameAId, frameBId, rectId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const fA = editor.createShape({
        type: 'frame',
        x: 50,
        y: 50,
        props: { width: 200, height: 200 },
      });
      const fB = editor.createShape({
        type: 'frame',
        x: 350,
        y: 50,
        props: { width: 200, height: 200 },
      });
      const r = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        meta: { parent: fA.id },
        props: { width: 60, height: 60, fill: '#3b82f6' },
      });
      return { frameAId: fA.id, frameBId: fB.id, rectId: r.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // 1. Drag rect from Frame A into Frame B
    // Rect center is at (130, 130). Move it by +300px to (430, 130) inside Frame B [350..550]
    await page.mouse.move(cx + 130, cy + 130);
    await page.mouse.down();
    await page.mouse.move(cx + 430, cy + 130);
    await page.mouse.up();

    let rect = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), rectId);
    expect(rect.meta['parent']).toBe(frameBId);

    // 2. Undo restores original parent A in ONE transaction
    await page.evaluate(() => (window as any).__od_debug__.editor.undo());
    rect = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), rectId);
    expect(rect.meta['parent']).toBe(frameAId);
    expect(rect.x).toBe(100);
    expect(rect.y).toBe(100);

    // 3. Drag out to empty canvas (move down to y=350, outside Frame A [50..250])
    await page.mouse.move(cx + 130, cy + 130);
    await page.mouse.down();
    await page.mouse.move(cx + 130, cy + 350);
    await page.mouse.up();

    rect = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), rectId);
    expect(rect.meta['parent']).toBeUndefined();

    // 4. Capture verification screenshot
    const screenshotDir = path.resolve(process.cwd(), 'docs/od-verification/2y');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(screenshotDir, 'reparent.png') });
  });

  test('overlapping frames fixture: smallest area candidate wins', async ({ page }) => {
    const { smallFrameId, rectId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      // Large Frame: 450x450 (area = 202,500)
      const big = editor.createShape({
        type: 'frame',
        x: 50,
        y: 50,
        props: { width: 450, height: 450 },
      });
      // Small Frame: 180x180 (area = 32,400) inside Big Frame
      const small = editor.createShape({
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 180, height: 180 },
      });
      // Standalone rect outside
      const r = editor.createShape({
        type: 'rect',
        x: 550,
        y: 100,
        props: { width: 50, height: 50, fill: '#10b981' },
      });
      return { bigFrameId: big.id, smallFrameId: small.id, rectId: r.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // Drag rect into (140, 140) which is inside BOTH frames
    await page.mouse.move(cx + 575, cy + 125);
    await page.mouse.down();
    await page.mouse.move(cx + 140, cy + 140);
    await page.mouse.up();

    const rect = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), rectId);
    // Smallest area frame must win
    expect(rect.meta['parent']).toBe(smallFrameId);
  });
});
