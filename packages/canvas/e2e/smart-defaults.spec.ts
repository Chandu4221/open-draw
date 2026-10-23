import { test, expect } from '@playwright/test';

test.describe('Smart Defaults & Trust Gate (Phase 3 Soul Test)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-container');
    // Enable 'always' chips for inspection
    await page.evaluate(() => {
      (window as any).__od_debug__.setChipMode('always');
    });
  });

  test('creation-time inference applies section to full-width rect, and retagged shape NEVER re-types on resize', async ({ page }) => {
    // 1. Create a page frame
    const pageId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const p = editor.createShape({
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 1000, height: 600, label: 'Main Page' },
        meta: { semantic: { type: 'page' } },
      });
      return p.id;
    });

    // 2. Draw a full-width rectangle inside the page frame
    const rectId = await page.evaluate((parentId) => {
      const editor = (window as any).__od_debug__.editor;
      const r = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 900, height: 250, fill: '#3b82f6', stroke: '' },
        meta: { parent: parentId },
      });
      return r.id;
    }, pageId);

    // Assert that creation-time inference set semantic.type to 'section'
    const inferredType = await page.evaluate((id) => {
      const shape = (window as any).__od_debug__.editor.store.getShape(id);
      return shape?.meta?.semantic?.type;
    }, rectId);
    expect(inferredType, 'full-width rect inside page frame must infer section').toBe('section');

    // Assert that the visual chip displays 'section'
    const chipText = await page.evaluate((id) => {
      const chip = document.querySelector(`.od-semantic-chip[data-shape-id="${id}"] text`);
      return chip?.textContent;
    }, rectId);
    expect(chipText).toContain('section');

    // 3. User explicitly retags the shape to 'card'
    await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const shape = editor.store.getShape(id);
      editor.store.updateShape(id, {
        meta: {
          ...shape.meta,
          semantic: {
            ...shape.meta.semantic,
            type: 'card',
          },
          userRetagged: true,
        },
      });
    }, rectId);

    const retaggedType = await page.evaluate((id) => {
      const shape = (window as any).__od_debug__.editor.store.getShape(id);
      return shape?.meta?.semantic?.type;
    }, rectId);
    expect(retaggedType).toBe('card');

    // 4. Wildly resize and move the shape (THE SOUL TEST: must NEVER re-type)
    await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      // Shrink width
      editor.store.updateShape(id, { x: 120, y: 150, props: { width: 300, height: 180 } });
      // Expand width beyond full width
      editor.store.updateShape(id, { x: 100, y: 100, props: { width: 1000, height: 500 } });
      // Move outside
      editor.store.updateShape(id, { x: 50, y: 50, props: { width: 950, height: 350 } });
    }, rectId);

    // Verify that after wild moves and resizes, type STAYS 'card'
    const finalType = await page.evaluate((id) => {
      const shape = (window as any).__od_debug__.editor.store.getShape(id);
      return shape?.meta?.semantic?.type;
    }, rectId);
    expect(finalType, 'SOUL TEST FAILED: explicitly retagged shape was mutated by resize').toBe('card');

    // 5. Test Undo: undo removes the last resize and undoing to creation removes the shape cleanly
    const shapesBeforeUndo = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes().length);
    expect(shapesBeforeUndo).toBe(2); // page + rect

    // Undo repeatedly to origin
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      while (editor.canUndo()) {
        editor.undo();
      }
    });

    const finalCount = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes().length);
    expect(finalCount, 'undo stack must cleanly wipe all shapes').toBe(0);
  });

  test('weak rules do not auto-apply as default', async ({ page }) => {
    // Create a small rect that matches the weak 'button' rule
    const rectId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const r = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 120, height: 40 },
        meta: {},
      });
      return r.id;
    });

    // Verify that weak rule did NOT auto-apply as default type
    const inferredType = await page.evaluate((id) => {
      const shape = (window as any).__od_debug__.editor.store.getShape(id);
      return shape?.meta?.semantic?.type;
    }, rectId);
    expect(inferredType).toBeUndefined();
  });
});
