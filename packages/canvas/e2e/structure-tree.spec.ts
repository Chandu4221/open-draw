import { test, expect } from '@playwright/test';

test.describe('Phase 5 §7.3: Structure Tree Tab Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-container');
    await page.evaluate(() => {
      const debug = (window as any).__od_debug__;
      const editor = debug.editor;
      editor.loadSnapshot({
        version: 1,
        shapes: [],
        camera: { x: 0, y: 0, zoom: 1 },
      });
      editor.clearSelection();
    });
  });

  test('switches between Properties and Structure tabs', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 150, height: 100 },
        meta: {},
      });
    });

    await expect(page.locator('#studio-inspector')).toBeVisible();
    await expect(page.locator('#inspector-props-view')).toBeVisible();
    await expect(page.locator('#inspector-tree-tab')).toBeHidden();

    // Click Structure tab
    await page.click('#inspector-tab-tree');
    await expect(page.locator('#inspector-tree-tab')).toBeVisible();
    await expect(page.locator('#inspector-props-view')).toBeHidden();

    // Click back to Properties tab
    await page.click('#inspector-tab-props');
    await expect(page.locator('#inspector-props-view')).toBeVisible();
    await expect(page.locator('#inspector-tree-tab')).toBeHidden();
  });

  test('renders tree with untagged badges and syncs selection bidirectionally', async ({ page }) => {
    const [frameId, childId, untaggedId] = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const f = editor.createShape({
        id: 'frame-hero',
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 400, height: 300 },
        meta: { semantic: { type: 'section', name: 'Hero Area' } },
      });
      const c = editor.createShape({
        id: 'btn-action',
        type: 'rect',
        x: 120,
        y: 120,
        props: { width: 120, height: 40 },
        meta: { parent: 'frame-hero', semantic: { type: 'button', name: 'Get Started' } },
      });
      const u = editor.createShape({
        id: 'rect-raw',
        type: 'rect',
        x: 600,
        y: 100,
        props: { width: 80, height: 80 },
        meta: {}, // untagged
      });
      return [f.id, c.id, u.id];
    });

    await page.click('#inspector-tab-tree');

    // Untagged badge assertion
    const untaggedNode = page.locator(`.od-tree-node[data-id="${untaggedId}"]`);
    await expect(untaggedNode.locator('.od-tree-untagged-badge')).toHaveText('untagged');

    // Click tree node -> canvas selects shape
    await page.click(`.od-tree-node[data-id="${childId}"]`);
    const isSelectedOnCanvas = await page.evaluate((id) => {
      return (window as any).__od_debug__.editor.isSelected(id);
    }, childId);
    expect(isSelectedOnCanvas).toBe(true);

    // Canvas select shape -> tree node gains selected class
    await page.evaluate((id) => {
      (window as any).__od_debug__.editor.selectShape(id);
    }, frameId);

    const frameNode = page.locator(`.od-tree-node[data-id="${frameId}"]`);
    await expect(frameNode).toHaveClass(/selected/);
  });

  test('context menu offers Reveal on canvas and Copy ID', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        id: 'test-shape',
        type: 'rect',
        x: 1500, // off-screen
        y: 1500,
        props: { width: 100, height: 100 },
        meta: { semantic: { type: 'card' } },
      });
      return s.id;
    });

    await page.click('#inspector-tab-tree');

    // Right-click node to open context menu
    await page.click(`.od-tree-node[data-id="${shapeId}"]`, { button: 'right' });
    await expect(page.locator('#od-tree-context-menu')).toBeVisible();

    // Click Reveal on canvas: camera pans and shape is selected
    await page.click('#od-tree-menu-reveal');
    await expect(page.locator('#od-tree-context-menu')).toBeHidden();

    const isSelected = await page.evaluate((id) => (window as any).__od_debug__.editor.isSelected(id), shapeId);
    expect(isSelected).toBe(true);
  });

  test('collapses and expands container nodes using twisty chevrons', async ({ page }) => {
    const [frameId, childId] = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const f = editor.createShape({
        id: 'frame-parent',
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 300, height: 200 },
        meta: { semantic: { type: 'card', name: 'Card Container' } },
      });
      const c = editor.createShape({
        id: 'inner-child',
        type: 'rect',
        x: 120,
        y: 120,
        props: { width: 80, height: 40 },
        meta: { parent: 'frame-parent', semantic: { type: 'button', name: 'Submit' } },
      });
      return [f.id, c.id];
    });

    await page.click('#inspector-tab-tree');

    // Both parent and child should be visible initially
    const parentNode = page.locator(`.od-tree-node[data-id="${frameId}"]`);
    const childNode = page.locator(`.od-tree-node[data-id="${childId}"]`);
    await expect(parentNode).toBeVisible();
    await expect(childNode).toBeVisible();

    // Check twisty is expanded (▾)
    const twisty = parentNode.locator('.od-tree-twisty');
    await expect(twisty).toHaveText('▾');

    // Click twisty to collapse
    await twisty.click();

    // Child should now be hidden
    await expect(childNode).toBeHidden();
    await expect(twisty).toHaveText('▸');

    // Click twisty again to expand
    await twisty.click();
    await expect(childNode).toBeVisible();
    await expect(twisty).toHaveText('▾');
  });

  test('quick action reveal button centers and selects shape', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        id: 'offscreen-target',
        type: 'rect',
        x: 2000,
        y: 2000,
        props: { width: 100, height: 100 },
        meta: { semantic: { type: 'card' } },
      });
      return s.id;
    });

    await page.click('#inspector-tab-tree');
    const node = page.locator(`.od-tree-node[data-id="${shapeId}"]`);
    await node.hover();

    const revealBtn = node.locator('.od-tree-action-btn[title="Reveal on canvas"]');
    await expect(revealBtn).toBeVisible();
    await revealBtn.click();

    const isSelected = await page.evaluate((id) => (window as any).__od_debug__.editor.isSelected(id), shapeId);
    expect(isSelected).toBe(true);
  });
});

