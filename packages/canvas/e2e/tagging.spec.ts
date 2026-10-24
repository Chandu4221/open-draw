import { test, expect } from '@playwright/test';

test.describe('Phase 5 §0.1: Real-Input Tag Panel & Semantics Suite', () => {
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

  test('selecting a shape opens tag panel showing read-only ID, name, and type; deselecting hides it', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
        meta: { semantic: { type: 'card', name: 'Profile Card' } },
      });
      return s.id;
    });

    // Before selection: panel is hidden
    await expect(page.locator('#tag-panel')).toBeHidden();

    // Select shape
    await page.evaluate((id) => {
      (window as any).__od_debug__.editor.selectShape(id);
    }, shapeId);

    // After selection: panel is visible and displays metadata
    await expect(page.locator('#tag-panel')).toBeVisible();
    await expect(page.locator('#tag-panel-id')).toHaveText(`#${shapeId}`);
    await expect(page.locator('#tag-panel-name')).toHaveValue('Profile Card');
    await expect(page.locator('#tag-panel-type')).toHaveValue('card');

    // Deselect -> panel hidden
    await page.evaluate(() => {
      (window as any).__od_debug__.editor.clearSelection();
    });
    await expect(page.locator('#tag-panel')).toBeHidden();
  });

  test('retag via real selectOption updates chip in single transaction; undo restores previous type', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 120, height: 40, fill: '#3b82f6' },
        meta: { semantic: { type: 'card' } },
      });
      editor.selectShape(s.id);
      return s.id;
    });

    const initialUndoCount = await page.evaluate(() => (window as any).__od_debug__.editor.store.undoStack.length);

    // Real Playwright interaction: selectOption
    await page.selectOption('#tag-panel-type', 'button');

    // Verify single undo entry created
    const undoCountAfter = await page.evaluate(() => (window as any).__od_debug__.editor.store.undoStack.length);
    expect(undoCountAfter).toBe(initialUndoCount + 1);

    // Assert store updated to button
    const typeAfter = await page.evaluate((id) => {
      const s = (window as any).__od_debug__.editor.store.getShape(id);
      return s?.meta?.semantic?.type;
    }, shapeId);
    expect(typeAfter).toBe('button');

    // Assert visible chip contains 'button'
    const chip = page.locator(`.od-semantic-chip[data-shape-id="${shapeId}"] text`);
    await expect(chip).toContainText('button');

    // Undo: single step restores 'card'
    await page.evaluate(() => {
      (window as any).__od_debug__.editor.undo();
    });

    const typeRestored = await page.evaluate((id) => {
      const s = (window as any).__od_debug__.editor.store.getShape(id);
      return s?.meta?.semantic?.type;
    }, shapeId);
    expect(typeRestored).toBe('card');
    await expect(chip).toContainText('card');
  });

  test('rename via real page.click and page.fill maintains focus, selection, and single undo entry', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 150, height: 50, fill: '#3b82f6' },
        meta: { semantic: { type: 'button' } },
      });
      editor.selectShape(s.id);
      return s.id;
    });

    const initialUndoCount = await page.evaluate(() => (window as any).__od_debug__.editor.store.undoStack.length);

    // Real click into the input: MUST NOT deselect shape or close panel (§0.4.1 defect)
    await page.click('#tag-panel-name');
    await expect(page.locator('#tag-panel')).toBeVisible();

    const isFocused = await page.evaluate(() => document.activeElement?.id === 'tag-panel-name');
    expect(isFocused).toBe(true);

    const isStillSelected = await page.evaluate((id) => (window as any).__od_debug__.editor.isSelected(id), shapeId);
    expect(isStillSelected).toBe(true);

    // Real fill and Enter key commit
    await page.fill('#tag-panel-name', 'Submit CTA');
    await page.keyboard.press('Enter');

    // Single undo entry created
    const undoCountAfter = await page.evaluate(() => (window as any).__od_debug__.editor.store.undoStack.length);
    expect(undoCountAfter).toBe(initialUndoCount + 1);

    const storeState = await page.evaluate((id) => {
      const s = (window as any).__od_debug__.editor.store.getShape(id);
      return {
        id: s?.id,
        name: s?.meta?.semantic?.name,
        type: s?.meta?.semantic?.type,
      };
    }, shapeId);

    expect(storeState.id).toBe(shapeId);
    expect(storeState.name).toBe('Submit CTA');
    expect(storeState.type).toBe('button');

    const chip = page.locator(`.od-semantic-chip[data-shape-id="${shapeId}"] text`);
    await expect(chip).toHaveText(`#${shapeId} Submit CTA`);
  });

  test('keyboard path: Tab reaches panel inputs and typing does not trigger canvas shortcuts', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 150, height: 50, fill: '#3b82f6' },
        meta: { semantic: { type: 'button' } },
      });
      editor.selectShape(s.id);
      return s.id;
    });

    // Click input to focus
    await page.click('#tag-panel-name');
    await expect(page.locator('#tag-panel-name')).toBeFocused();

    // Type letters 'r', 'v', 'd' which are canvas tool shortcuts
    await page.keyboard.type('vrd');

    // Verify canvas tool did not switch to rect/draw and shape was not deleted
    const tool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
    expect(tool).toBe('select');

    const shapeExists = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id) !== undefined, shapeId);
    expect(shapeExists).toBe(true);

    // Verify input value contains typed text
    await expect(page.locator('#tag-panel-name')).toHaveValue('vrd');
  });

  test('provenance hint displays inference status and retagged-by-you state', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const p = editor.createShape({
        type: 'frame',
        x: 50,
        y: 50,
        props: { width: 800, height: 600, label: 'Page' },
        meta: { semantic: { type: 'page' } },
      });
      const r = editor.createShape({
        type: 'rect',
        x: 50,
        y: 50,
        props: { width: 750, height: 200, fill: '#3b82f6' },
        meta: { parent: p.id },
      });
      editor.selectShape(r.id);
    });

    // Initial inferred state: should show "Inferred: section"
    await expect(page.locator('#tag-panel-hint')).toHaveText('Inferred: section');

    // Real selectOption to retag
    await page.selectOption('#tag-panel-type', 'card');

    // After user override: should show "Inferred: section — retagged by you"
    await expect(page.locator('#tag-panel-hint')).toHaveText('Inferred: section — retagged by you');
  });
});
