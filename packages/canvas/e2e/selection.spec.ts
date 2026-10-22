import { test, expect } from '@playwright/test';

test.describe('Phase 2.y §1: Selection Model E2E Gate', () => {
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

  test('click select, shift-toggle, and outline rendering in overlay slot', async ({ page }) => {
    const { id1, id2 } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s1 = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 80, fill: '#3b82f6' },
      });
      const s2 = editor.createShape({
        type: 'rect',
        x: 250,
        y: 100,
        props: { width: 100, height: 80, fill: '#10b981' },
      });
      return { id1: s1.id, id2: s2.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // 1. Click s1 to select single
    await page.mouse.click(cx + 120, cy + 120);

    let selection = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(selection).toEqual([id1]);

    // Check outline in overlay slot
    const outline1 = await page.evaluate((id) => {
      const slot = (window as any).__od_debug__.editor.getOverlaySlot(id);
      return slot?.querySelector('.od-selection-outline') !== null;
    }, id1);
    expect(outline1).toBe(true);

    // 2. Shift+click s2 to toggle into selection
    await page.keyboard.down('Shift');
    await page.mouse.click(cx + 270, cy + 120);
    await page.keyboard.up('Shift');

    selection = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(selection).toEqual([id1, id2]);

    // 3. Shift+click s1 to toggle out
    await page.keyboard.down('Shift');
    await page.mouse.click(cx + 120, cy + 120);
    await page.keyboard.up('Shift');

    selection = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(selection).toEqual([id2]);

    // 4. Click empty space clears selection
    await page.mouse.click(cx + 500, cy + 500);
    selection = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(selection).toEqual([]);
  });

  test('marquee captures exact intersecting id set and Shift+marquee adds to selection', async ({ page }) => {
    const { idA, idB, idC } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const sA = editor.createShape({
        type: 'rect',
        x: 60,
        y: 60,
        props: { width: 80, height: 80 },
      });
      const sB = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 80, height: 80 },
      });
      const sC = editor.createShape({
        type: 'rect',
        x: 400,
        y: 400,
        props: { width: 80, height: 80 },
      });
      return { idA: sA.id, idB: sB.id, idC: sC.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // Drag marquee covering parts of A and B (from 40,40 to 120,120)
    await page.mouse.move(cx + 40, cy + 40);
    await page.mouse.down();
    await page.mouse.move(cx + 120, cy + 120, { steps: 5 });
    await page.mouse.up();

    let selection = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(selection).toContain(idA);
    expect(selection).toContain(idB);
    expect(selection).not.toContain(idC);
    expect(selection.length).toBe(2);

    // Shift+marquee over C to add to selection
    await page.keyboard.down('Shift');
    await page.mouse.move(cx + 380, cy + 380);
    await page.mouse.down();
    await page.mouse.move(cx + 450, cy + 450, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Shift');

    selection = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(selection).toContain(idA);
    expect(selection).toContain(idB);
    expect(selection).toContain(idC);
    expect(selection.length).toBe(3);
  });

  test('group click selects group, shift descends, Ctrl/Cmd descends directly', async ({ page }) => {
    const { groupId, m1Id, m2Id } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const m1 = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 60, height: 60 },
      });
      const m2 = editor.createShape({
        type: 'rect',
        x: 180,
        y: 100,
        props: { width: 60, height: 60 },
      });
      const grp = editor.createShape({
        type: 'group',
        x: 100,
        y: 100,
        props: { memberIds: [m1.id, m2.id], width: 140, height: 60 },
      });
      return { groupId: grp.id, m1Id: m1.id, m2Id: m2.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // 1. Normal click on member m1 selects the group
    await page.mouse.click(cx + 120, cy + 120);
    let selection = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(selection).toEqual([groupId]);

    // Group selection visuals: group union outline + per-member outlines exist
    const visuals = await page.evaluate(({ gId, mId }) => {
      const editor = (window as any).__od_debug__.editor;
      const gSlot = editor.getOverlaySlot(gId);
      const mSlot = editor.getOverlaySlot(mId);
      return {
        groupOutline: gSlot?.querySelector('.od-selection-outline') !== null,
        memberOutline: mSlot?.querySelector('.od-selection-outline') !== null,
      };
    }, { gId: groupId, mId: m1Id });
    expect(visuals.groupOutline).toBe(true);
    expect(visuals.memberOutline).toBe(true);

    await page.screenshot({ path: 'docs/od-verification/2y/selection.png' });

    // 2. Shift+click descends into the member
    await page.keyboard.down('Shift');
    await page.mouse.click(cx + 120, cy + 120);
    await page.keyboard.up('Shift');

    selection = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(selection).toContain(m1Id);

    // 3. Clear, then Ctrl/Cmd+click descends directly to m2
    await page.keyboard.press('Escape');
    const isMac = process.platform === 'darwin';
    const modKey = isMac ? 'Meta' : 'Control';
    await page.keyboard.down(modKey);
    await page.mouse.click(cx + 200, cy + 120);
    await page.keyboard.up(modKey);

    selection = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(selection).toEqual([m2Id]);
  });

  test('Tab cycles selection in z-order and Escape clears selection', async ({ page }) => {
    const { id1, id2, id3 } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s1 = editor.createShape({ type: 'rect', x: 50, y: 50, props: { width: 50, height: 50 } });
      const s2 = editor.createShape({ type: 'rect', x: 150, y: 50, props: { width: 50, height: 50 } });
      const s3 = editor.createShape({ type: 'rect', x: 250, y: 50, props: { width: 50, height: 50 } });
      return { id1: s1.id, id2: s2.id, id3: s3.id };
    });

    // Press Tab cycles to s1
    await page.keyboard.press('Tab');
    let sel = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(sel).toEqual([id1]);

    // Press Tab cycles to s2
    await page.keyboard.press('Tab');
    sel = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(sel).toEqual([id2]);

    // Press Tab cycles to s3
    await page.keyboard.press('Tab');
    sel = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(sel).toEqual([id3]);

    // Shift+Tab cycles back to s2
    await page.keyboard.press('Shift+Tab');
    sel = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(sel).toEqual([id2]);

    // Escape clears selection
    await page.keyboard.press('Escape');
    sel = await page.evaluate(() => (window as any).__od_debug__.editor.selection);
    expect(sel).toEqual([]);
  });

  test('selection is view state and does not create undo transactions', async ({ page }) => {
    const initialHistoryLength = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.createShape({ type: 'rect', x: 50, y: 50, props: { width: 50, height: 50 } });
      editor.createShape({ type: 'rect', x: 150, y: 50, props: { width: 50, height: 50 } });
      return (editor.store as any).undoStack.length;
    });

    const box = await page.locator('#canvas-container').boundingBox();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // 1. Click select
    await page.mouse.click(cx + 60, cy + 60);
    let historyLength = await page.evaluate(() => (window as any).__od_debug__.editor.store.undoStack.length);
    expect(historyLength).toBe(initialHistoryLength);

    // 2. Marquee select
    await page.mouse.move(cx + 10, cy + 10);
    await page.mouse.down();
    await page.mouse.move(cx + 220, cy + 120);
    await page.mouse.up();
    historyLength = await page.evaluate(() => (window as any).__od_debug__.editor.store.undoStack.length);
    expect(historyLength).toBe(initialHistoryLength);

    // 3. Tab cycle
    await page.keyboard.press('Tab');
    historyLength = await page.evaluate(() => (window as any).__od_debug__.editor.store.undoStack.length);
    expect(historyLength).toBe(initialHistoryLength);

    // 4. Escape
    await page.keyboard.press('Escape');
    historyLength = await page.evaluate(() => (window as any).__od_debug__.editor.store.undoStack.length);
    expect(historyLength).toBe(initialHistoryLength);
  });
});
