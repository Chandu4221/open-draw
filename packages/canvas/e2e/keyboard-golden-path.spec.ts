import { test, expect } from '@playwright/test';

test.describe('Phase 2.y §2: Keyboard-Only Golden Path E2E Gate (Zero Mouse Events)', () => {
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

  test('complete keyboard navigation, a11y focus, nudge, duplicate, delete, undo cycle with zero mouse events', async ({ page }) => {
    const { id1, id2 } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s1 = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        meta: { name: 'Alpha' },
        props: { width: 50, height: 50, fill: '#3b82f6' },
      });
      const s2 = editor.createShape({
        type: 'rect',
        x: 250,
        y: 250,
        meta: { name: 'Beta' },
        props: { width: 50, height: 50, fill: '#10b981' },
      });
      return { id1: s1.id, id2: s2.id };
    });

    // 1. Accessibility attributes verification
    const a11yProps = await page.evaluate(({ firstId, secondId }) => {
      const el1 = document.querySelector(`.od-shape[data-id="${firstId}"]`);
      const el2 = document.querySelector(`.od-shape[data-id="${secondId}"]`);
      return {
        el1: {
          tabindex: el1?.getAttribute('tabindex'),
          role: el1?.getAttribute('role'),
          ariaLabel: el1?.getAttribute('aria-label'),
        },
        el2: {
          tabindex: el2?.getAttribute('tabindex'),
          role: el2?.getAttribute('role'),
          ariaLabel: el2?.getAttribute('aria-label'),
        },
      };
    }, { firstId: id1, secondId: id2 });

    expect(a11yProps.el1.tabindex).toBe('0');
    expect(a11yProps.el1.role).toBe('button');
    expect(a11yProps.el1.ariaLabel).toBe('rect Alpha');

    expect(a11yProps.el2.tabindex).toBe('0');
    expect(a11yProps.el2.role).toBe('button');
    expect(a11yProps.el2.ariaLabel).toBe('rect Beta');

    // 2. Tab to first shape
    await page.keyboard.press('Tab');
    const focusedId = await page.evaluate(() => {
      return document.activeElement?.getAttribute('data-id');
    });
    expect(focusedId).toBe(id1);

    // 3. Enter selects focused shape
    await page.keyboard.press('Enter');
    let sel = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(sel).toEqual([id1]);

    // 4. Arrow keys to move (exact coords)
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    let s1 = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), id1);
    expect(s1.x).toBe(101);
    expect(s1.y).toBe(101);

    // 5. Shift+arrows 10px
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowDown');
    s1 = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), id1);
    expect(s1.x).toBe(111);
    expect(s1.y).toBe(111);

    // 6. Ctrl/Cmd+D duplicate
    const isMac = process.platform === 'darwin';
    const modKey = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modKey}+d`);

    sel = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(sel.length).toBe(1);
    const dupeId = sel[0];
    expect(dupeId).not.toBe(id1);

    let dupe = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), dupeId);
    expect(dupe.x).toBe(121);
    expect(dupe.y).toBe(121);

    // 7. Arrows move the duplicate
    await page.keyboard.press('ArrowRight');
    dupe = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), dupeId);
    expect(dupe.x).toBe(122);
    expect(dupe.y).toBe(121);

    // 8. Delete key removes duplicate
    await page.keyboard.press('Delete');
    dupe = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), dupeId);
    expect(dupe).toBeUndefined();

    sel = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(sel).toEqual([]);

    // 9. Ctrl/Cmd+Z restores the duplicate
    await page.keyboard.press(`${modKey}+z`);
    dupe = await page.evaluate((id) => (window as any).__od_debug__.editor.store.getShape(id), dupeId);
    expect(dupe).toBeDefined();
    expect(dupe.x).toBe(122);
    expect(dupe.y).toBe(121);

    // 10. Capture verification screenshot (zero mouse events in entire test)
    await page.screenshot({ path: 'docs/od-verification/2y/keyboard-golden-path.png' });
  });
});
