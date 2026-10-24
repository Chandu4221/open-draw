import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase 0.2.0 §2: Accessibility (a11y) Audit Suite', () => {
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

  test('State 1: Empty canvas passes axe-core audit with zero critical violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('#canvas-container')
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious, `Critical violations on empty canvas: ${JSON.stringify(criticalOrSerious, null, 2)}`).toHaveLength(0);
  });

  test('State 2: 20 diverse shapes have valid roles, accessible names, and pass axe-core', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const types = ['rect', 'ellipse', 'note', 'text', 'frame', 'arrow', 'ink', 'image'] as const;
      for (let i = 0; i < 20; i++) {
        const type = types[i % types.length]!;
        editor.createShape({
          type,
          x: (i % 5) * 150 + 50,
          y: Math.floor(i / 5) * 150 + 50,
          meta: { name: `Item ${i + 1}` },
          props: {
            width: 100,
            height: 80,
            fill: '#e2e8f0',
            text: type === 'text' ? 'Sample Text' : undefined,
            label: type === 'frame' ? 'Sample Frame' : undefined,
          },
        });
      }
    });

    const shapeAttributes = await page.evaluate(() => {
      const wrappers = Array.from(document.querySelectorAll('.od-shape'));
      return wrappers.map((w) => ({
        id: w.getAttribute('data-id'),
        role: w.getAttribute('role'),
        tabindex: w.getAttribute('tabindex'),
        ariaLabel: w.getAttribute('aria-label'),
      }));
    });

    expect(shapeAttributes).toHaveLength(20);
    for (const attr of shapeAttributes) {
      expect(['button', 'group']).toContain(attr.role);
      expect(attr.tabindex).toBe('0');
      expect(attr.ariaLabel).toMatch(/Item \d+/);
    }

    const results = await new AxeBuilder({ page })
      .include('#canvas-container')
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious, `Violations on 20-shape canvas: ${JSON.stringify(criticalOrSerious, null, 2)}`).toHaveLength(0);
  });

  test('State 3: Active selection with 8 handles and rotate passes axe-core', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        meta: { name: 'Active Rect' },
        props: { width: 200, height: 120, fill: '#3b82f6' },
      });
      editor.selectionManager.setSelection([s.id]);
      return s.id;
    });

    const hasSelection = await page.evaluate((id) => {
      const slot = (window as any).__od_debug__.editor.getOverlaySlot(id);
      return slot?.querySelector('.od-selection-frame') !== null;
    }, shapeId);
    expect(hasSelection).toBe(true);

    const results = await new AxeBuilder({ page })
      .include('#canvas-container')
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious, `Violations on active selection: ${JSON.stringify(criticalOrSerious, null, 2)}`).toHaveLength(0);
  });

  test('State 4: Mid-gesture in-flight state passes axe-core', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.createShape({
        type: 'rect',
        x: 150,
        y: 150,
        props: { width: 100, height: 80, fill: '#10b981' },
      });
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const startX = (box?.x ?? 0) + 160;
    const startY = (box?.y ?? 0) + 160;

    // Start drag gesture and pause mid-flight
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 50, { steps: 5 });

    const results = await new AxeBuilder({ page })
      .include('#canvas-container')
      .analyze();

    await page.mouse.up();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious, `Violations during in-flight gesture: ${JSON.stringify(criticalOrSerious, null, 2)}`).toHaveLength(0);
  });

  test('State 5: Text editing mode with active textarea passes axe-core', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'text',
        x: 100,
        y: 100,
        props: { text: 'Editable Title' },
      });
      editor.textEditing.startEditing(s.id, editor);
    });

    const isEditing = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      return editor.textEditing.isEditing();
    });
    expect(isEditing).toBe(true);

    const results = await new AxeBuilder({ page })
      .include('#canvas-container')
      .analyze();

    await page.evaluate(() => {
      (window as any).__od_debug__.editor.textEditing.cancel();
    });

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious, `Violations in text editing mode: ${JSON.stringify(criticalOrSerious, null, 2)}`).toHaveLength(0);
  });

  test('State 6: Frame container with nested children maintains a11y hierarchy', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const frame = editor.createShape({
        type: 'frame',
        x: 80,
        y: 80,
        meta: { name: 'Main Frame' },
        props: { width: 300, height: 250, label: 'Main Frame' },
      });
      editor.createShape({
        type: 'rect',
        x: 120,
        y: 120,
        meta: { parent: frame.id, name: 'Child Box 1' },
        props: { width: 80, height: 60, fill: '#6366f1' },
      });
      editor.createShape({
        type: 'rect',
        x: 220,
        y: 120,
        meta: { parent: frame.id, name: 'Child Box 2' },
        props: { width: 80, height: 60, fill: '#ec4899' },
      });
    });

    const frameChildrenInfo = await page.evaluate(() => {
      const frame = document.querySelector('.od-shape[data-id][aria-label*="frame"]');
      const children = frame?.querySelectorAll('.od-frame-children .od-shape');
      return {
        frameFound: frame !== null,
        childrenCount: children?.length ?? 0,
      };
    });

    expect(frameChildrenInfo.frameFound).toBe(true);
    expect(frameChildrenInfo.childrenCount).toBe(2);

    const results = await new AxeBuilder({ page })
      .include('#canvas-container')
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious, `Violations with frame hierarchy: ${JSON.stringify(criticalOrSerious, null, 2)}`).toHaveLength(0);
  });

  test('State 7: Tag panel open with selected shape and focused input passes axe-core', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        meta: { name: 'Card Item', semantic: { type: 'card', name: 'Card Item' } },
        props: { width: 140, height: 90, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
    });

    const isVisible = await page.locator('#tag-panel').isVisible();
    expect(isVisible).toBe(true);

    await page.focus('#tag-panel-name');

    const results = await new AxeBuilder({ page })
      .include(['#canvas-container', '#tag-panel'])
      .analyze();

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious, `Violations with tag panel open: ${JSON.stringify(criticalOrSerious, null, 2)}`).toHaveLength(0);
  });

  test('State 8: Compile specification modal passes axe-core with zero critical violations', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        meta: { name: 'Demo Rect', semantic: { type: 'card' } },
        props: { width: 100, height: 80, fill: '#e2e8f0' },
      });
      (window as any).__od_debug__.compileModal.open();
    });

    const isModalVisible = await page.locator('#od-compile-modal').isVisible();
    expect(isModalVisible).toBe(true);

    const results = await new AxeBuilder({ page })
      .include('#od-compile-modal')
      .analyze();

    await page.evaluate(() => {
      (window as any).__od_debug__.compileModal.close();
    });

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious, `Violations on compile modal: ${JSON.stringify(criticalOrSerious, null, 2)}`).toHaveLength(0);
  });
});

