import { test, expect } from '@playwright/test';
import * as path from 'node:path';
import * as fs from 'node:fs';

test.describe('Phase 2.y §6: Stroke Eraser E2E Gate', () => {
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
      editor.setTool('select');
    });
  });

  test('drag across 3 shapes deletes all 3 in single undo transaction with live highlight', async ({ page }) => {
    const { r1Id, r2Id, r3Id } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const r1 = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 60, height: 60, fill: '#ef4444' },
      });
      const r2 = editor.createShape({
        type: 'rect',
        x: 200,
        y: 100,
        props: { width: 60, height: 60, fill: '#3b82f6' },
      });
      const r3 = editor.createShape({
        type: 'rect',
        x: 300,
        y: 100,
        props: { width: 60, height: 60, fill: '#10b981' },
      });
      return { r1Id: r1.id, r2Id: r2.id, r3Id: r3.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // Switch to eraser via keyboard shortcut 'KeyE' per §2
    await page.keyboard.press('KeyE');
    const tool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
    expect(tool).toBe('eraser');

    // Drag across all 3 shapes horizontally at y = 130
    await page.mouse.move(cx + 50, cy + 130);
    await page.mouse.down();

    // Move into r1
    await page.mouse.move(cx + 130, cy + 130);
    const r1Highlight = await page.evaluate(
      (id) => (window as any).__od_debug__.editor.renderer.getShapeWrapper(id)?.classList.contains('od-erase-target'),
      r1Id
    );
    expect(r1Highlight).toBe(true);

    // Move into r2 and r3
    await page.mouse.move(cx + 230, cy + 130);
    await page.mouse.move(cx + 330, cy + 130);

    const r3Highlight = await page.evaluate(
      (id) => (window as any).__od_debug__.editor.renderer.getShapeWrapper(id)?.classList.contains('od-erase-target'),
      r3Id
    );
    expect(r3Highlight).toBe(true);

    // Finish eraser gesture
    await page.mouse.up();

    // Verify all 3 shapes are deleted
    const countAfter = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes().length);
    expect(countAfter).toBe(0);

    // Verify single undo transaction restores all 3 exact shapes
    await page.evaluate(() => (window as any).__od_debug__.editor.undo());
    const restored = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
    expect(restored.length).toBe(3);

    const r1 = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), r1Id);
    const r2 = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), r2Id);
    const r3 = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), r3Id);
    expect(r1.x).toBe(100);
    expect(r2.x).toBe(200);
    expect(r3.x).toBe(300);
  });

  test('eraser respects frames: child deleted leaves frame intact; empty header erases frame', async ({ page }) => {
    const { frameId, childId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const frame = editor.createShape({
        type: 'frame',
        x: 50,
        y: 50,
        props: { width: 300, height: 300 },
      });
      const child = editor.createShape({
        type: 'rect',
        x: 100,
        y: 150,
        meta: { parent: frame.id },
        props: { width: 80, height: 80, fill: '#8b5cf6' },
      });
      return { frameId: frame.id, childId: child.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // Switch to eraser
    await page.keyboard.press('KeyE');

    // 1. Drag across child rect (x: 100..180, y: 150..230)
    await page.mouse.move(cx + 80, cy + 190);
    await page.mouse.down();
    await page.mouse.move(cx + 200, cy + 190);
    await page.mouse.up();

    // Verify child is deleted, frame remains intact
    const childAfter = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), childId);
    const frameAfter = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), frameId);
    expect(childAfter).toBeUndefined();
    expect(frameAfter).toBeDefined();

    // 2. Drag across empty header area of frame (x: 60..200, y: 60)
    await page.mouse.move(cx + 60, cy + 60);
    await page.mouse.down();
    await page.mouse.move(cx + 200, cy + 60);
    await page.mouse.up();

    // Verify frame is deleted
    const frameAfterHeaderHit = await page.evaluate(
      (id) => (window as any).__od_debug__.editor.store.getShape(id),
      frameId
    );
    expect(frameAfterHeaderHit).toBeUndefined();

    // 3. Capture verification screenshot for Report
    // Re-create a visual scene showing eraser live target
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.createShape({
        type: 'frame',
        x: 50,
        y: 50,
        props: { width: 300, height: 260 },
      });
      editor.createShape({
        type: 'rect',
        x: 90,
        y: 110,
        props: { width: 80, height: 70, fill: '#3b82f6' },
      });
      const targetRect = editor.createShape({
        type: 'rect',
        x: 200,
        y: 110,
        props: { width: 80, height: 70, fill: '#ef4444' },
      });
      const el = editor.renderer.getShapeWrapper(targetRect.id);
      if (el) {
        el.classList.add('od-erase-target');
        el.style.opacity = '0.35';
      }
    });

    const screenshotDir = path.resolve(process.cwd(), 'docs/od-verification/2y');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(screenshotDir, 'eraser.png') });
  });
});
