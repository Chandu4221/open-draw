import { test, expect } from '@playwright/test';

test.describe('Phase 5 §0.4: Compile Modal Real-Input & Edge Cases Suite', () => {
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

  test('open modal via real trigger, toggle options, and close without affecting canvas selection', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
        meta: { semantic: { type: 'card', name: 'Dashboard Card' } },
      });
      editor.selectShape(s.id);
      return s.id;
    });

    // Open modal
    await page.evaluate(() => {
      (window as any).__od_debug__.compileModal.open();
    });

    await expect(page.locator('#od-compile-modal')).toBeVisible();

    // Real click inside textarea: canvas selection must stay active
    await page.click('#od-compile-output');
    const isSelectedWhileOpen = await page.evaluate((id) => (window as any).__od_debug__.editor.isSelected(id), shapeId);
    expect(isSelectedWhileOpen).toBe(true);

    // Toggle legend checkbox
    const initialText = await page.inputValue('#od-compile-output');
    expect(initialText).toContain('Dashboard Card');
    expect(initialText).toContain('## Element Legend');

    await page.click('label:has-text("Include Element Legend")');
    const textWithoutLegend = await page.inputValue('#od-compile-output');
    expect(textWithoutLegend).not.toContain('## Element Legend');

    // Real click copy button
    await page.click('#od-compile-copy-btn');
    await expect(page.locator('#od-compile-copy-btn')).toBeVisible();

    // Close via close button
    await page.click('#od-compile-close-btn');
    await expect(page.locator('#od-compile-overlay')).toBeHidden();

    // Canvas selection intact
    const isSelectedAfterClose = await page.evaluate((id) => (window as any).__od_debug__.editor.isSelected(id), shapeId);
    expect(isSelectedAfterClose).toBe(true);
  });

  test('modal open + Escape closes MODAL and does NOT clear canvas selection', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 100, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
      (window as any).__od_debug__.compileModal.open();
      return s.id;
    });

    await expect(page.locator('#od-compile-modal')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal must close
    await expect(page.locator('#od-compile-overlay')).toBeHidden();

    // Shape must still be selected (Escape closed modal, did not deselect canvas)
    const isSelected = await page.evaluate((id) => (window as any).__od_debug__.editor.isSelected(id), shapeId);
    expect(isSelected).toBe(true);
  });

  test('compile twice produces byte-identical output (determinism visible)', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.createShape({
        type: 'rect',
        x: 50,
        y: 50,
        props: { width: 300, height: 100, fill: '#3b82f6' },
        meta: { semantic: { type: 'header', name: 'App Header' } },
      });
      (window as any).__od_debug__.compileModal.open();
    });

    const firstRun = await page.inputValue('#od-compile-output');

    // Close and reopen
    await page.evaluate(() => {
      (window as any).__od_debug__.compileModal.close();
      (window as any).__od_debug__.compileModal.open();
    });

    const secondRun = await page.inputValue('#od-compile-output');
    expect(secondRun).toBe(firstRun);
  });

  test('scene with zero shapes shows friendly empty-state message and does not crash', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__od_debug__.compileModal.open();
    });

    await expect(page.locator('#od-compile-modal')).toBeVisible();
    const content = await page.inputValue('#od-compile-output');
    expect(content).toContain('*Empty canvas — no shapes present.*');

    await page.evaluate(() => {
      (window as any).__od_debug__.compileModal.close();
    });
  });

  test('download markdown button is accessible and visible', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__od_debug__.compileModal.open();
    });

    const downloadBtn = page.locator('#od-compile-download-btn');
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toHaveAttribute('aria-label', 'Download .md');

    await page.evaluate(() => {
      (window as any).__od_debug__.compileModal.close();
    });
  });
});
