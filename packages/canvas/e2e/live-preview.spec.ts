import { test, expect } from '@playwright/test';

test.describe('Phase 2.z §0: Live-Preview Repair & Midpoint Sampling Gate', () => {
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

  test('in-flight resize: DOM dimensions match midpoint within ±1px, handles track, store unmutated until drop', async ({ page }) => {
    const { shapeId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
      return { shapeId: s.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // SE handle starts at (100+200, 100+100) = (300, 200) relative to canvas container
    await page.mouse.move(cx + 300, cy + 200);
    await page.mouse.down();

    // 1. Move to midpoint: +60px X, +40px Y -> target width: 260, height: 140
    await page.mouse.move(cx + 360, cy + 240);

    // Assert shape DOM element reflects in-flight dimensions live
    const midDOM = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const wrapper = editor.getShapeWrapper(id);
      const rect = wrapper?.querySelector('rect');
      const storeShape = editor.store.getShape(id);
      return {
        domWidth: Number(rect?.getAttribute('width')),
        domHeight: Number(rect?.getAttribute('height')),
        storeWidth: storeShape?.props.width,
        storeHeight: storeShape?.props.height,
      };
    }, shapeId);

    // Live DOM must match midpoint within ±1px
    expect(midDOM.domWidth).toBeCloseTo(260, 0);
    expect(midDOM.domHeight).toBeCloseTo(140, 0);
    // Store must remain untouched mid-gesture
    expect(midDOM.storeWidth).toBe(200);
    expect(midDOM.storeHeight).toBe(100);

    // Assert handles track the live preview shape
    const seHandlePos = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const slot = editor.getOverlaySlot(id);
      const handle = slot?.querySelector('[data-handle="se"]');
      const r = handle?.getBoundingClientRect();
      return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
    }, shapeId);

    expect(seHandlePos).not.toBeNull();
    expect(seHandlePos!.x - cx).toBeCloseTo(360, 0);
    expect(seHandlePos!.y - cy).toBeCloseTo(240, 0);

    // 2. Move to final position and release: +100px X, +50px Y -> 300 x 150
    await page.mouse.move(cx + 400, cy + 250);
    await page.mouse.up();

    const finalShape = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      return editor.store.getShape(id);
    }, shapeId);

    expect(finalShape.props.width).toBeCloseTo(300, 0);
    expect(finalShape.props.height).toBeCloseTo(150, 0);
  });

  test('in-flight move: DOM translation matches midpoint within ±1px, overlay tracks, store unmutated until drop', async ({ page }) => {
    const { shapeId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
      return { shapeId: s.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // Grab shape at center: (100 + 100, 100 + 50) = (200, 150)
    await page.mouse.move(cx + 200, cy + 150);
    await page.mouse.down();

    // 1. Move to midpoint: +50px X, +30px Y
    await page.mouse.move(cx + 250, cy + 180);

    const midMove = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const wrapper = editor.getShapeWrapper(id);
      const transform = wrapper?.getAttribute('transform') ?? '';
      const storeShape = editor.store.getShape(id);
      return {
        transform,
        storeX: storeShape?.x,
        storeY: storeShape?.y,
      };
    }, shapeId);

    // Live DOM transform must match translated position (150, 130)
    expect(midMove.transform).toContain('translate(150, 130)');
    // Store remains unmutated
    expect(midMove.storeX).toBe(100);
    expect(midMove.storeY).toBe(100);

    // Assert overlay handles track live movement
    const nwHandlePos = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const slot = editor.getOverlaySlot(id);
      const handle = slot?.querySelector('[data-handle="nw"]');
      const r = handle?.getBoundingClientRect();
      return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
    }, shapeId);

    expect(nwHandlePos).not.toBeNull();
    expect(nwHandlePos!.x - cx).toBeCloseTo(150, 0);
    expect(nwHandlePos!.y - cy).toBeCloseTo(130, 0);

    // 2. Drop at final destination: +100px X, +60px Y
    await page.mouse.move(cx + 300, cy + 210);
    await page.mouse.up();

    const finalShape = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      return editor.store.getShape(id);
    }, shapeId);

    expect(finalShape.x).toBeCloseTo(200, 0);
    expect(finalShape.y).toBeCloseTo(160, 0);
  });

  test('in-flight rotate: DOM rotation matches midpoint within ±1°, store unmutated until drop', async ({ page }) => {
    const { shapeId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 200, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
      return { shapeId: s.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // Center is (200, 200). Rotate handle is 24px above top center: (200, 76)
    await page.mouse.move(cx + 200, cy + 76);
    await page.mouse.down();

    // Rotate 90° clockwise: pointer at right of center (cx + 324, cy + 200)
    await page.mouse.move(cx + 324, cy + 200);

    const midRotate = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const wrapper = editor.getShapeWrapper(id);
      const transform = wrapper?.getAttribute('transform') ?? '';
      const storeShape = editor.store.getShape(id);
      return {
        transform,
        storeRotation: storeShape?.rotation,
      };
    }, shapeId);

    // Mid-gesture DOM must have rotated
    expect(midRotate.transform).toContain('rotate(90');
    // Store must remain untouched
    expect(midRotate.storeRotation ?? 0).toBe(0);

    // Release mouse
    await page.mouse.up();

    const finalShape = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      return editor.store.getShape(id);
    }, shapeId);

    expect(finalShape.rotation).toBe(90);
  });

  test('in-flight cancel via Escape: reverts to initial state, creates 0 undo entries', async ({ page }) => {
    const { shapeId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
      editor.clearHistory();
      return { shapeId: s.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // SE handle at (300, 200)
    await page.mouse.move(cx + 300, cy + 200);
    await page.mouse.down();
    await page.mouse.move(cx + 360, cy + 240);

    // Verify it changed in DOM
    const midWidth = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      return Number(editor.getShapeWrapper(id)?.querySelector('rect')?.getAttribute('width'));
    }, shapeId);
    expect(midWidth).toBeCloseTo(260, 0);

    // Press Escape mid-drag
    await page.keyboard.press('Escape');

    // DOM must immediately revert to initial dimensions (200x100)
    const revertedDOM = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const rect = editor.getShapeWrapper(id)?.querySelector('rect');
      const storeShape = editor.store.getShape(id);
      return {
        domWidth: Number(rect?.getAttribute('width')),
        domHeight: Number(rect?.getAttribute('height')),
        storeWidth: storeShape?.props.width,
        storeHeight: storeShape?.props.height,
        canUndo: editor.canUndo(),
      };
    }, shapeId);

    expect(revertedDOM.domWidth).toBe(200);
    expect(revertedDOM.domHeight).toBe(100);
    expect(revertedDOM.storeWidth).toBe(200);
    expect(revertedDOM.storeHeight).toBe(100);
    // Crucial: 0 undo entries created!
    expect(revertedDOM.canUndo).toBe(false);

    // Release mouse — should not commit anything
    await page.mouse.up();

    const afterUp = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      return {
        storeWidth: editor.store.getShape(id)?.props.width,
        canUndo: editor.canUndo(),
      };
    }, shapeId);

    expect(afterUp.storeWidth).toBe(200);
    expect(afterUp.canUndo).toBe(false);
  });

  test('single undo restores exact initial state in 1 step after completed drag', async ({ page }) => {
    const { shapeId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
      });
      editor.selectShape(s.id);
      editor.clearHistory();
      return { shapeId: s.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // Drag SE handle
    await page.mouse.move(cx + 300, cy + 200);
    await page.mouse.down();
    await page.mouse.move(cx + 350, cy + 230);
    await page.mouse.move(cx + 400, cy + 250);
    await page.mouse.up();

    // Verify final store shape
    const mutated = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      return {
        width: editor.store.getShape(id)?.props.width,
        canUndo: editor.canUndo(),
      };
    }, shapeId);
    expect(mutated.width).toBeCloseTo(300, 0);
    expect(mutated.canUndo).toBe(true);

    // Trigger exactly ONE undo
    await page.evaluate(() => {
      (window as any).__od_debug__.editor.undo();
    });

    // Check store shape restored to 200 and history stack empty
    const restored = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const rect = editor.getShapeWrapper(id)?.querySelector('rect');
      return {
        domWidth: Number(rect?.getAttribute('width')),
        storeWidth: editor.store.getShape(id)?.props.width,
        canUndo: editor.canUndo(),
      };
    }, shapeId);

    expect(restored.storeWidth).toBe(200);
    expect(restored.domWidth).toBe(200);
    // Initial creation was before snapshot clear, so canUndo should now be false
    expect(restored.canUndo).toBe(false);
  });

  test('re-parent target frame highlight: .od-frame-target at midpoint, removed on drop, single transaction', async ({ page }) => {
    const { frameId, childId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const f = editor.createShape({
        type: 'frame',
        x: 300,
        y: 100,
        props: { width: 300, height: 300, label: 'Target Frame' },
      });
      const c = editor.createShape({
        type: 'rect',
        x: 50,
        y: 100,
        props: { width: 100, height: 100, fill: '#10b981' },
      });
      editor.selectShape(c.id);
      return { frameId: f.id, childId: c.id };
    });

    const box = await page.locator('#canvas-container').boundingBox();
    expect(box).not.toBeNull();
    const cx = box?.x ?? 0;
    const cy = box?.y ?? 0;

    // Grab child rect center: (50 + 50, 100 + 50) = (100, 150)
    await page.mouse.move(cx + 100, cy + 150);
    await page.mouse.down();

    // 1. Move into frame: target at (400, 200) (inside frame bounds 300..600 x 100..400)
    await page.mouse.move(cx + 400, cy + 200);

    // Midpoint assertion: frame element MUST have class .od-frame-target
    const hasHighlight = await page.evaluate((fId) => {
      const editor = (window as any).__od_debug__.editor;
      const frameWrapper = editor.getShapeWrapper(fId);
      return frameWrapper?.classList.contains('od-frame-target');
    }, frameId);
    expect(hasHighlight).toBe(true);

    // 2. Drop shape
    await page.mouse.up();

    // Frame element MUST NO LONGER have .od-frame-target
    const highlightAfterDrop = await page.evaluate((fId) => {
      const editor = (window as any).__od_debug__.editor;
      const frameWrapper = editor.getShapeWrapper(fId);
      return frameWrapper?.classList.contains('od-frame-target');
    }, frameId);
    expect(highlightAfterDrop).toBe(false);

    // Child rect MUST be parented to frame
    const parentId = await page.evaluate((cId) => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.store.getShape(cId);
      return s?.meta['parent'];
    }, childId);
    expect(parentId).toBe(frameId);

    // Single undo reverts both movement and parenting in one step
    await page.evaluate(() => {
      (window as any).__od_debug__.editor.undo();
    });

    const undoneChild = await page.evaluate((cId) => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.store.getShape(cId);
      return { x: s?.x, y: s?.y, parent: s?.meta['parent'] };
    }, childId);

    expect(undoneChild.x).toBe(50);
    expect(undoneChild.y).toBe(100);
    expect(undoneChild.parent).toBeUndefined();
  });
});
