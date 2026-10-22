import { test, expect } from '@playwright/test';

test.describe('Phase 2.y §4: Z-Order Operations E2E Gate', () => {
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

  test('stack 3 overlapping rects, bring front, verify DOM & snapshot array order, screenshot, undo restores exact order', async ({ page }) => {
    const { id1, id2, id3 } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s1 = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 100, fill: '#ef4444' }, // Red (bottom)
      });
      const s2 = editor.createShape({
        type: 'rect',
        x: 130,
        y: 130,
        props: { width: 100, height: 100, fill: '#10b981' }, // Green (middle)
      });
      const s3 = editor.createShape({
        type: 'rect',
        x: 160,
        y: 160,
        props: { width: 100, height: 100, fill: '#3b82f6' }, // Blue (top)
      });
      return { id1: s1.id, id2: s2.id, id3: s3.id };
    });

    // 1. Initial snapshot order
    let order = await page.evaluate(() => {
      return (window as any).__od_debug__.editor.store.listShapes().map((s: any) => s.id);
    });
    expect(order).toEqual([id1, id2, id3]);

    // Select bottom shape id1
    await page.evaluate((id) => {
      (window as any).__od_debug__.editor.selectShape(id);
    }, id1);

    // 2. Bring to front via shortcut Ctrl/Cmd+Shift+]
    const isMac = process.platform === 'darwin';
    const modKey = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modKey}+Shift+]`);

    // Verify snapshot array order is now [id2, id3, id1]
    order = await page.evaluate(() => {
      return (window as any).__od_debug__.editor.store.listShapes().map((s: any) => s.id);
    });
    expect(order).toEqual([id2, id3, id1]);

    // Verify DOM sibling order in .od-shapes-layer
    const domOrder = await page.evaluate(() => {
      const shapesLayer = document.querySelector('.od-shapes-layer');
      if (!shapesLayer) return [];
      return Array.from(shapesLayer.children).map((el) => el.getAttribute('data-id'));
    });
    expect(domOrder).toEqual([id2, id3, id1]);

    // 3. Capture verification screenshot
    await page.screenshot({ path: 'docs/od-verification/2y/zorder.png' });

    // 4. Undo restores exact array order and DOM order
    await page.keyboard.press(`${modKey}+z`);

    order = await page.evaluate(() => {
      return (window as any).__od_debug__.editor.store.listShapes().map((s: any) => s.id);
    });
    expect(order).toEqual([id1, id2, id3]);

    const restoredDomOrder = await page.evaluate(() => {
      const shapesLayer = document.querySelector('.od-shapes-layer');
      if (!shapesLayer) return [];
      return Array.from(shapesLayer.children).map((el) => el.getAttribute('data-id'));
    });
    expect(restoredDomOrder).toEqual([id1, id2, id3]);

    // 5. Send Backward one step via API
    await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      editor.sendBackward([id]);
    }, id3);

    order = await page.evaluate(() => {
      return (window as any).__od_debug__.editor.store.listShapes().map((s: any) => s.id);
    });
    expect(order).toEqual([id1, id3, id2]);

    // 6. Send to back
    await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      editor.sendToBack([id]);
    }, id3);

    order = await page.evaluate(() => {
      return (window as any).__od_debug__.editor.store.listShapes().map((s: any) => s.id);
    });
    expect(order).toEqual([id3, id1, id2]);
  });
});
