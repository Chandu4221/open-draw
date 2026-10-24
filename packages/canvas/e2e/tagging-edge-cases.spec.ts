import { test, expect } from '@playwright/test';

test.describe('Phase 5 §0.4: Tag Panel Strict Edge Cases', () => {
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
      (window as any).__od_debug__.setChipMode('always');
    });
  });

  test('edge case 1: select two shapes hides the tag panel', async ({ page }) => {
    const [id1, id2] = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s1 = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 100, fill: '#3b82f6' },
      });
      const s2 = editor.createShape({
        type: 'rect',
        x: 300,
        y: 100,
        props: { width: 100, height: 100, fill: '#ef4444' },
      });
      editor.selectionManager.setSelection([s1.id]);
      return [s1.id, s2.id];
    });

    await expect(page.locator('#tag-panel')).toBeVisible();

    // Select both shapes
    await page.evaluate(([a, b]) => {
      (window as any).__od_debug__.editor.selectionManager.setSelection([a, b]);
    }, [id1, id2]);

    // Panel must hide on multi-selection
    await expect(page.locator('#tag-panel')).toBeHidden();
  });

  test('edge case 2: panel open while shape deleted closes cleanly with no stale ref', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 100, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
      return s.id;
    });

    await expect(page.locator('#tag-panel')).toBeVisible();

    // Delete the active shape
    await page.evaluate((id) => {
      (window as any).__od_debug__.editor.deleteShape(id);
    }, shapeId);

    // Panel must be hidden and no errors thrown
    await expect(page.locator('#tag-panel')).toBeHidden();
  });

  test('edge case 3: undo and redo with panel open keeps chip and panel in sync', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 100, fill: '#3b82f6' },
        meta: { semantic: { type: 'card', name: 'Original' } },
      });
      editor.selectShape(s.id);
      return s.id;
    });

    await expect(page.locator('#tag-panel-name')).toHaveValue('Original');

    // Real change
    await page.click('#tag-panel-name');
    await page.fill('#tag-panel-name', 'Modified');
    await page.keyboard.press('Enter');

    await expect(page.locator('#tag-panel-name')).toHaveValue('Modified');
    await expect(page.locator(`.od-semantic-chip[data-shape-id="${shapeId}"] text`)).toHaveText(`#${shapeId} Modified`);

    // Undo
    await page.evaluate(() => (window as any).__od_debug__.editor.undo());
    await expect(page.locator('#tag-panel-name')).toHaveValue('Original');
    await expect(page.locator(`.od-semantic-chip[data-shape-id="${shapeId}"] text`)).toHaveText(`#${shapeId} Original`);

    // Redo
    await page.evaluate(() => (window as any).__od_debug__.editor.redo());
    await expect(page.locator('#tag-panel-name')).toHaveValue('Modified');
    await expect(page.locator(`.od-semantic-chip[data-shape-id="${shapeId}"] text`)).toHaveText(`#${shapeId} Modified`);
  });

  test('edge case 4: Escape in focused input cancels edit without closing panel or clearing selection', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 100, fill: '#3b82f6' },
        meta: { semantic: { type: 'card', name: 'Saved Name' } },
      });
      editor.selectShape(s.id);
      return s.id;
    });

    await page.click('#tag-panel-name');
    await page.fill('#tag-panel-name', 'Uncommitted Change');

    // Press Escape while focused in name input
    await page.keyboard.press('Escape');

    // Panel must still be visible and shape must still be selected
    await expect(page.locator('#tag-panel')).toBeVisible();
    const isSelected = await page.evaluate((id) => (window as any).__od_debug__.editor.isSelected(id), shapeId);
    expect(isSelected).toBe(true);

    // Value reverts to stored name
    await expect(page.locator('#tag-panel-name')).toHaveValue('Saved Name');
  });

  test('edge case 5: camera zoom while panel is open keeps panel fixed in viewport coordinates', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 100, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
    });

    const boxBefore = await page.locator('#tag-panel').boundingBox();
    expect(boxBefore).not.toBeNull();

    // Zoom camera from 1x to 2x
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.camera.setCamera({ x: 0, y: 0, zoom: 2.0 });
    });

    const boxAfter = await page.locator('#tag-panel').boundingBox();
    expect(boxAfter).not.toBeNull();

    // Panel is fixed viewport positioned and must not drift
    expect(Math.round(boxAfter!.x)).toBe(Math.round(boxBefore!.x));
    expect(Math.round(boxAfter!.y)).toBe(Math.round(boxBefore!.y));
    await expect(page.locator('#tag-panel')).toBeVisible();
  });
});
