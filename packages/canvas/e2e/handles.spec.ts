import { test, expect } from '@playwright/test';
import * as path from 'node:path';
import * as fs from 'node:fs';

test.describe('Phase 2.y §3: 8-Handle Resize & Rotate System E2E Gate', () => {
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

  test('8 handles + rotate present at expected screen positions (±1px)', async ({ page }) => {
    const { shapeId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
      return { shapeId: s.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    const handles = await page.evaluate((id) => {
      const slot = (window as any).__od_debug__.editor.getOverlaySlot(id);
      if (!slot) return null;
      const types = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'rotate'];
      const result: Record<string, { x: number; y: number; w: number; h: number }> = {};
      for (const t of types) {
        const el = slot.querySelector(`[data-handle="${t}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        result[t] = { x: r.x, y: r.y, w: r.width, h: r.height };
      }
      return result;
    }, shapeId);

    expect(handles).not.toBeNull();
    if (!handles) return;

    // Canvas container relative expectations:
    // Shape at (100, 100) with size 200x100
    // Handles are centered on vertices/edges with 8px screen size (half=4)
    expect(handles['nw'].x + 4 - cx).toBeCloseTo(100, 0);
    expect(handles['nw'].y + 4 - cy).toBeCloseTo(100, 0);

    expect(handles['n'].x + 4 - cx).toBeCloseTo(200, 0);
    expect(handles['n'].y + 4 - cy).toBeCloseTo(100, 0);

    expect(handles['ne'].x + 4 - cx).toBeCloseTo(300, 0);
    expect(handles['ne'].y + 4 - cy).toBeCloseTo(100, 0);

    expect(handles['e'].x + 4 - cx).toBeCloseTo(300, 0);
    expect(handles['e'].y + 4 - cy).toBeCloseTo(150, 0);

    expect(handles['se'].x + 4 - cx).toBeCloseTo(300, 0);
    expect(handles['se'].y + 4 - cy).toBeCloseTo(200, 0);

    expect(handles['s'].x + 4 - cx).toBeCloseTo(200, 0);
    expect(handles['s'].y + 4 - cy).toBeCloseTo(200, 0);

    expect(handles['sw'].x + 4 - cx).toBeCloseTo(100, 0);
    expect(handles['sw'].y + 4 - cy).toBeCloseTo(200, 0);

    expect(handles['w'].x + 4 - cx).toBeCloseTo(100, 0);
    expect(handles['w'].y + 4 - cy).toBeCloseTo(150, 0);

    // Rotate handle: 24px above N handle (100 - 24 = 76)
    expect(handles['rotate'].x + 4 - cx).toBeCloseTo(200, 0);
    expect(handles['rotate'].y + 4 - cy).toBeCloseTo(76, 0);
  });

  test('drag SE +100px screen -> store bounds +100±1 page units, Shift aspect, Alt center, rotate 45°, and single undo', async ({ page }) => {
    const { shapeId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
      return { shapeId: s.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // 1. Drag SE handle +100px screen
    // SE handle is at screen cx + 300, cy + 200
    await page.mouse.move(cx + 300, cy + 200);
    await page.mouse.down();
    await page.mouse.move(cx + 400, cy + 250);
    await page.mouse.up();

    let shape = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), shapeId);
    expect(shape.props.width).toBeCloseTo(300, 0);
    expect(shape.props.height).toBeCloseTo(150, 0);

    // 2. Shift-drag maintains aspect ratio
    // Current SE handle is now at cx + 400, cy + 250
    // Aspect ratio is 300 / 150 = 2.0
    await page.keyboard.down('Shift');
    await page.mouse.move(cx + 400, cy + 250);
    await page.mouse.down();
    await page.mouse.move(cx + 460, cy + 260);
    await page.mouse.up();
    await page.keyboard.up('Shift');

    shape = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), shapeId);
    const ratio = shape.props.width / shape.props.height;
    expect(ratio).toBeCloseTo(2.0, 1);

    // 3. Alt-drag centers
    const initialCenter = {
      x: shape.x + shape.props.width / 2,
      y: shape.y + shape.props.height / 2,
    };
    const seScreenX = cx + shape.x + shape.props.width;
    const seScreenY = cy + shape.y + shape.props.height;

    await page.keyboard.down('Alt');
    await page.mouse.move(seScreenX, seScreenY);
    await page.mouse.down();
    await page.mouse.move(seScreenX + 40, seScreenY + 20);
    await page.mouse.up();
    await page.keyboard.up('Alt');

    shape = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), shapeId);
    const newCenter = {
      x: shape.x + shape.props.width / 2,
      y: shape.y + shape.props.height / 2,
    };
    expect(newCenter.x).toBeCloseTo(initialCenter.x, 1);
    expect(newCenter.y).toBeCloseTo(initialCenter.y, 1);

    // 4. Rotate 45 degrees
    const rotScreenX = cx + shape.x + shape.props.width / 2;
    const rotScreenY = cy + shape.y - 24;

    await page.mouse.move(rotScreenX, rotScreenY);
    await page.mouse.down();
    // Drag to 45 deg position: from center (rotScreenX, cy + shape.y + shape.props.height/2)
    // Moving diagonally right and up/down
    const centerY = cy + shape.y + shape.props.height / 2;
    await page.mouse.move(rotScreenX + 80, centerY - 80);
    await page.mouse.up();

    shape = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), shapeId);
    expect(shape.rotation).toBe(45);

    // 5. Assert undo = ONE entry for the whole rotate gesture
    await page.evaluate(() => (window as any).__od_debug__.editor.undo());
    shape = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), shapeId);
    expect(shape.rotation ?? 0).toBe(0);

    // Capture screenshot for verification report
    const screenshotDir = path.resolve(process.cwd(), 'docs/od-verification/2y');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(screenshotDir, 'handles.png') });
  });

  test('constant screen size: handles pixel-size equal at 0.5x and 2x zoom (within ±1px)', async ({ page }) => {
    const { shapeId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
      return { shapeId: s.id };
    });

    // 1. Set zoom to 0.5
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.camera.setCamera({ x: 0, y: 0, zoom: 0.5 });
    });

    const sizeAtHalf = await page.evaluate((id) => {
      const slot = (window as any).__od_debug__.editor.getOverlaySlot(id);
      const se = slot?.querySelector('[data-handle="se"]');
      const rot = slot?.querySelector('[data-handle="rotate"]');
      return {
        se: se?.getBoundingClientRect().width,
        rotate: rot?.getBoundingClientRect().width,
      };
    }, shapeId);

    // 2. Set zoom to 2.0
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.camera.setCamera({ x: 0, y: 0, zoom: 2.0 });
    });

    const sizeAtDouble = await page.evaluate((id) => {
      const slot = (window as any).__od_debug__.editor.getOverlaySlot(id);
      const se = slot?.querySelector('[data-handle="se"]');
      const rot = slot?.querySelector('[data-handle="rotate"]');
      return {
        se: se?.getBoundingClientRect().width,
        rotate: rot?.getBoundingClientRect().width,
      };
    }, shapeId);

    expect(sizeAtHalf.se).toBeDefined();
    expect(sizeAtDouble.se).toBeDefined();

    // Both should be 8px screen width (within ±1px)
    expect(sizeAtHalf.se!).toBeCloseTo(8, 0);
    expect(sizeAtDouble.se!).toBeCloseTo(8, 0);
    expect(Math.abs(sizeAtHalf.se! - sizeAtDouble.se!)).toBeLessThanOrEqual(1.0);

    // Rotate handle circle diameter should also be 8px screen width (within ±1px)
    expect(sizeAtHalf.rotate!).toBeCloseTo(8, 0);
    expect(sizeAtDouble.rotate!).toBeCloseTo(8, 0);
    expect(Math.abs(sizeAtHalf.rotate! - sizeAtDouble.rotate!)).toBeLessThanOrEqual(1.0);
  });
});
