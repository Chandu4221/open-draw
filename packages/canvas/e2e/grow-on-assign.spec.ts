import { test, expect } from '@playwright/test';

test.describe('Phase 5 §7.5: Grow-On-Assign Repair Suite', () => {
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

  test('selecting out-of-bounds child and assigning parent via inspector auto-grows parent to union bounds', async ({ page }) => {
    const { frameId, childId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const f = editor.createShape({
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 200, height: 200 },
        meta: {},
      });
      const c = editor.createShape({
        type: 'rect',
        x: 250,
        y: 250,
        props: { width: 100, height: 100 },
        meta: {},
      });
      editor.selectShape(c.id);
      return { frameId: f.id, childId: c.id };
    });

    // Inspector should show parent select
    await expect(page.locator('#inspector-parent-select')).toBeVisible();

    // Select the frame as parent
    await page.selectOption('#inspector-parent-select', frameId);

    // Verify parent is assigned and frame has auto-grown to union bounds
    const state = await page.evaluate(({ fId, cId }) => {
      const editor = (window as any).__od_debug__.editor;
      const f = editor.store.getShape(fId);
      const c = editor.store.getShape(cId);
      return {
        childParent: c?.meta['parent'],
        frameX: f?.x,
        frameY: f?.y,
        frameWidth: f?.props['width'],
        frameHeight: f?.props['height'],
      };
    }, { fId: frameId, cId: childId });

    expect(state.childParent).toBe(frameId);
    expect(state.frameX).toBe(100);
    expect(state.frameY).toBe(100);
    expect(state.frameWidth).toBe(250); // 100 to (250 + 100) = 350 - 100 = 250
    expect(state.frameHeight).toBe(250);

    // Single undo reverts BOTH growth and parenting
    await page.evaluate(() => (window as any).__od_debug__.editor.undo());

    const reverted = await page.evaluate(({ fId, cId }) => {
      const editor = (window as any).__od_debug__.editor;
      const f = editor.store.getShape(fId);
      const c = editor.store.getShape(cId);
      return {
        childParent: c?.meta['parent'],
        frameWidth: f?.props['width'],
        frameHeight: f?.props['height'],
      };
    }, { fId: frameId, cId: childId });

    expect(reverted.childParent).toBeUndefined();
    expect(reverted.frameWidth).toBe(200);
    expect(reverted.frameHeight).toBe(200);
  });

  test('cascading growth grows both inner frame and outer ancestor frame in a single transaction', async ({ page }) => {
    const { outerId, innerId, childId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const outer = editor.createShape({
        type: 'frame',
        x: 50,
        y: 50,
        props: { width: 300, height: 300 },
        meta: {},
      });
      const inner = editor.createShape({
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 150, height: 150 },
        meta: { parent: outer.id },
      });
      const child = editor.createShape({
        type: 'rect',
        x: 350,
        y: 350,
        props: { width: 100, height: 100 },
        meta: {},
      });
      editor.selectShape(child.id);
      return { outerId: outer.id, innerId: inner.id, childId: child.id };
    });

    await page.selectOption('#inspector-parent-select', innerId);

    const state = await page.evaluate(({ oId, iId }) => {
      const editor = (window as any).__od_debug__.editor;
      const outer = editor.store.getShape(oId);
      const inner = editor.store.getShape(iId);
      return {
        innerWidth: inner?.props['width'],
        innerHeight: inner?.props['height'],
        outerWidth: outer?.props['width'],
        outerHeight: outer?.props['height'],
      };
    }, { oId: outerId, iId: innerId });

    expect(state.innerWidth).toBe(350); // 100 to 450
    expect(state.innerHeight).toBe(350);
    expect(state.outerWidth).toBe(400); // 50 to 450
    expect(state.outerHeight).toBe(400);
  });

  test('hovering parent select dropdown confirms target frame with highlight class', async ({ page }) => {
    const { frameId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const f = editor.createShape({
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 200, height: 200 },
        meta: {},
      });
      const c = editor.createShape({
        type: 'rect',
        x: 120,
        y: 120,
        props: { width: 50, height: 50 },
        meta: { parent: f.id },
      });
      editor.selectShape(c.id);
      return { frameId: f.id };
    });

    await expect(page.locator('#inspector-parent-select')).toHaveValue(frameId);

    // Hover parent select -> frame element gains highlight class
    await page.locator('#inspector-parent-select').hover();
    await expect(page.locator(`.od-shape[data-id="${frameId}"]`)).toHaveClass(/od-parent-hover-highlight/);

    // Move away -> highlight class removed
    await page.mouse.move(0, 0);
    await expect(page.locator(`.od-shape[data-id="${frameId}"]`)).not.toHaveClass(/od-parent-hover-highlight/);
  });
});
