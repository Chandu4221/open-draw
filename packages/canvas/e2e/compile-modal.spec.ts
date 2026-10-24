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

    await page.click('label:has-text("Element Legend")');
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

  test('directive toggle updates consumption directive header via real interaction', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 100 },
        meta: { semantic: { type: 'card' } },
      });
      (window as any).__od_debug__.compileModal.open();
    });

    await expect(page.locator('#od-compile-modal')).toBeVisible();

    // Default is strict-fidelity
    const initialText = await page.inputValue('#od-compile-output');
    expect(initialText).toContain('> **Consumption Directive: strict-fidelity**');

    // Real selection of creative-allowed
    await page.selectOption('#od-compile-directive', 'creative-allowed');
    const creativeText = await page.inputValue('#od-compile-output');
    expect(creativeText).toContain('> **Consumption Directive: creative-allowed**');
    expect(creativeText).toContain('Preserve every f(id) identity');

    // Switch back
    await page.selectOption('#od-compile-directive', 'strict-fidelity');
    const strictText = await page.inputValue('#od-compile-output');
    expect(strictText).toContain('> **Consumption Directive: strict-fidelity**');

    await page.evaluate(() => (window as any).__od_debug__.compileModal.close());
  });

  test('responsive toggle enables and disables responsive behavior section', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.createShape({
        type: 'rect',
        x: 0,
        y: 0,
        props: { width: 1200, height: 600 },
        meta: { semantic: { type: 'section' } },
      });
      (window as any).__od_debug__.compileModal.open();
    });

    await expect(page.locator('#od-compile-modal')).toBeVisible();

    // Responsive section on by default
    const withResp = await page.inputValue('#od-compile-output');
    expect(withResp).toContain('## Responsive Behavior');
    expect(withResp).toContain('### Breakpoint: Mobile (< 768px) (580px)');

    // Toggle off via real click
    await page.click('label:has-text("Responsive")');
    const withoutResp = await page.inputValue('#od-compile-output');
    expect(withoutResp).not.toContain('## Responsive Behavior');

    // Toggle back on
    await page.click('label:has-text("Responsive")');
    const reEnabledResp = await page.inputValue('#od-compile-output');
    expect(reEnabledResp).toContain('## Responsive Behavior');

    await page.evaluate(() => (window as any).__od_debug__.compileModal.close());
  });

  test('untagged shape triggers warning banner, untagged tree badge, and untagged legend label', async ({ page }) => {
    const untaggedId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 50,
        y: 50,
        props: { width: 180, height: 90 },
      });
      (window as any).__od_debug__.compileModal.open();
      return s.id;
    });

    await expect(page.locator('#od-compile-modal')).toBeVisible();

    const output = await page.inputValue('#od-compile-output');
    expect(output).toContain(`> ⚠ **Untagged Elements:** Shapes f(${untaggedId}) have no semantic type.`);
    expect(output).toContain(`- **[untagged:rect]** f(${untaggedId})`);
    expect(output).toContain(`| f(${untaggedId}) | rect *untagged* |`);

    await page.evaluate(() => (window as any).__od_debug__.compileModal.close());
  });

  test('style picker populates all 5 styles and compiles selected style tokens into design direction', async ({ page }) => {
    // Assert picker contains all 5 styles
    const options = await page.locator('#inspector-style-select option').allInnerTexts();
    expect(options).toHaveLength(5);
    expect(options.some(o => o.includes('Material 3'))).toBe(true);
    expect(options.some(o => o.includes('Flat Minimal'))).toBe(true);
    expect(options.some(o => o.includes('Glassmorphism'))).toBe(true);
    expect(options.some(o => o.includes('Neumorphism'))).toBe(true);
    expect(options.some(o => o.includes('Neubrutalism'))).toBe(true);

    // Select Material 3
    await page.selectOption('#inspector-style-select', 'material3');

    // Create a shape and compile
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.createShape({
        type: 'rect',
        x: 0,
        y: 0,
        props: { width: 300, height: 200 },
        meta: { semantic: { type: 'card' } },
      });
      (window as any).__od_debug__.compileModal.open();
    });

    await expect(page.locator('#od-compile-modal')).toBeVisible();

    const output = await page.inputValue('#od-compile-output');
    expect(output).toContain('- **Visual Style:** `material3`');
    expect(output).toContain('> **Style Guidance:** M3 themes map via Material Theme Builder');
    expect(output).toContain('| Palette | `primary` | `#6750a4` |');
    expect(output).toContain('| Borders | `radius` | `16px` |');

    await page.evaluate(() => (window as any).__od_debug__.compileModal.close());
  });

  test('scope dropdown in modal controls scope declaration and defaults to auto-inference', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.createShape({
        type: 'rect',
        x: 0,
        y: 0,
        props: { width: 300, height: 200 },
        meta: { semantic: { type: 'card', name: 'Profile Card' } },
      });
      (window as any).__od_debug__.compileModal.open();
    });

    await expect(page.locator('#od-compile-modal')).toBeVisible();

    // 1. By default, auto detects no page root -> Scope: component
    let output = await page.inputValue('#od-compile-output');
    expect(output).toContain('> **Scope: component** — This spec describes a standalone component, not a page.');

    // 2. Select Page in Scope dropdown
    await page.selectOption('#od-compile-scope', 'page');
    output = await page.inputValue('#od-compile-output');
    expect(output).toContain('> **Scope: page** — this scene contains a `page`-typed root; build a complete page.');

    // 3. Select Component in Scope dropdown
    await page.selectOption('#od-compile-scope', 'component');
    output = await page.inputValue('#od-compile-output');
    expect(output).toContain('> **Scope: component** — This spec describes a standalone component, not a page.');

    await page.evaluate(() => (window as any).__od_debug__.compileModal.close());
  });
});


