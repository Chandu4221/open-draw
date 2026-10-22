import { test, expect } from '@playwright/test';

test.describe('Privileged Capability #2: Frame & Clipping E2E Gate', () => {
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
    });
  });

  test('create frame, drop rect inside, drag frame moves child in single transaction, undo restores both', async ({ page }) => {
    // 1. Create frame via tool
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.setTool('frame');
    });

    const containerBox = await page.locator('#canvas-container').boundingBox();
    expect(containerBox).not.toBeNull();
    const frameClickX = (containerBox?.x ?? 0) + 100;
    const frameClickY = (containerBox?.y ?? 0) + 100;
    await page.mouse.click(frameClickX, frameClickY);

    const frameShape = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      return editor.store.listShapes()[0];
    });
    expect(frameShape).toBeDefined();
    expect(frameShape.type).toBe('frame');
    expect(frameShape.x).toBe(100);
    expect(frameShape.y).toBe(100);

    // 2. Drop rect inside frame
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.setTool('rect');
    });

    const rectClickX = (containerBox?.x ?? 0) + 150;
    const rectClickY = (containerBox?.y ?? 0) + 150;
    await page.mouse.click(rectClickX, rectClickY);

    const childRect = await page.evaluate((frameId) => {
      const editor = (window as any).__od_debug__.editor;
      const shapes = editor.store.listShapes();
      return shapes.find((s: any) => s.id !== frameId);
    }, frameShape.id);

    expect(childRect).toBeDefined();
    expect(childRect.meta.parent).toBe(frameShape.id);

    // Verify DOM structure: child wrapper is inside frame's .od-frame-children
    const isChildInsideFrameDOM = await page.evaluate(({ frameId, childId }) => {
      const frameEl = document.querySelector(`.od-shape[data-id="${frameId}"]`);
      const childEl = document.querySelector(`.od-shape[data-id="${childId}"]`);
      const frameChildren = frameEl?.querySelector('.od-frame-children');
      return frameChildren?.contains(childEl) === true;
    }, { frameId: frameShape.id, childId: childRect.id });
    expect(isChildInsideFrameDOM).toBe(true);

    // 3. Drag frame by (+80, +60)
    // Click on frame header/background (x=110, y=110)
    const dragStartX = (containerBox?.x ?? 0) + 110;
    const dragStartY = (containerBox?.y ?? 0) + 110;
    await page.mouse.move(dragStartX, dragStartY);
    await page.mouse.down();
    await page.mouse.move(dragStartX + 80, dragStartY + 60, { steps: 5 });
    await page.mouse.up();

    const movedPositions = await page.evaluate(({ frameId, childId }) => {
      const editor = (window as any).__od_debug__.editor;
      const f = editor.store.getShape(frameId);
      const c = editor.store.getShape(childId);
      return { frame: { x: f.x, y: f.y }, child: { x: c.x, y: c.y } };
    }, { frameId: frameShape.id, childId: childRect.id });

    expect(movedPositions.frame).toEqual({ x: 180, y: 160 });
    expect(movedPositions.child).toEqual({ x: 230, y: 210 });

    // 4. Single undo restores both frame and child
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.store.undo();
    });

    const undonePositions = await page.evaluate(({ frameId, childId }) => {
      const editor = (window as any).__od_debug__.editor;
      const f = editor.store.getShape(frameId);
      const c = editor.store.getShape(childId);
      return { frame: { x: f.x, y: f.y }, child: { x: c.x, y: c.y } };
    }, { frameId: frameShape.id, childId: childRect.id });

    expect(undonePositions.frame).toEqual({ x: 100, y: 100 });
    expect(undonePositions.child).toEqual({ x: 150, y: 150 });
  });

  test('child visually clipped at frame edge, overlay invariant holds, screenshot captured', async ({ page }) => {
    const { frameId, childId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const frame = editor.createShape({
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 300, height: 200, label: 'Hero Frame' },
      });

      // Child positioned near bottom-right edge of frame so it overflows
      const child = editor.createShape({
        type: 'rect',
        x: 250,
        y: 200,
        meta: { parent: frame.id },
        props: { width: 250, height: 180, fill: '#3b82f6' },
      });

      const slot = editor.getOverlaySlot(child.id);
      if (slot) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.textContent = 'CHILD_OVERLAY';
        slot.appendChild(text);
      }

      return { frameId: frame.id, childId: child.id };
    });

    // Check overlay invariant on frame
    const frameInvariant = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const wrapper = document.querySelector(`.od-shape[data-id="${id}"]`) as SVGGElement | null;
      const slot = editor.getOverlaySlot(id);
      if (!wrapper || !slot) return { error: 'Frame wrapper or slot not found' };

      const wrapperRect = wrapper.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const isLastChild = wrapper.lastElementChild === slot;
      const pointerEvents = getComputedStyle(slot).pointerEvents;
      const transformAttr = slot.getAttribute('transform');
      const label = slot.querySelector('.od-frame-label');

      return {
        driftX: Math.abs(slotRect.left - wrapperRect.left),
        driftY: Math.abs(slotRect.top - wrapperRect.top),
        isLastChild,
        pointerEvents,
        transformAttr,
        labelText: label?.textContent,
      };
    }, frameId);

    expect(frameInvariant.driftX).toBeLessThanOrEqual(1);
    expect(frameInvariant.driftY).toBeLessThanOrEqual(1);
    expect(frameInvariant.isLastChild).toBe(true);
    expect(frameInvariant.pointerEvents).toBe('none');
    expect(frameInvariant.labelText).toBe('Hero Frame');

    // Check overlay invariant on child
    const childInvariant = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const wrapper = document.querySelector(`.od-shape[data-id="${id}"]`) as SVGGElement | null;
      const slot = editor.getOverlaySlot(id);
      if (!wrapper || !slot) return { error: 'Child wrapper or slot not found' };

      const wrapperRect = wrapper.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const isLastChild = wrapper.lastElementChild === slot;

      return {
        driftX: Math.abs(slotRect.left - wrapperRect.left),
        driftY: Math.abs(slotRect.top - wrapperRect.top),
        isLastChild,
      };
    }, childId);

    expect(childInvariant.driftX).toBeLessThanOrEqual(1);
    expect(childInvariant.driftY).toBeLessThanOrEqual(1);
    expect(childInvariant.isLastChild).toBe(true);

    // Verify visual clipping: frame children layer has clip-path pointing to frame clipPath def
    const clipPathApplied = await page.evaluate((id) => {
      const frameEl = document.querySelector(`.od-shape[data-id="${id}"]`);
      const childrenGroup = frameEl?.querySelector('.od-frame-children');
      const clipAttr = childrenGroup?.getAttribute('clip-path');
      return clipAttr?.includes(`od-frame-clip-${id}`) === true;
    }, frameId);
    expect(clipPathApplied).toBe(true);

    // Capture verification screenshot
    await page.screenshot({ path: 'docs/od-verification/2x/frame.png' });
  });

  test('parent delete orphans children with event and no silent reparenting', async ({ page }) => {
    const result = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const orphanedEvents: any[] = [];
      editor.clipping.onChildOrphaned((ev: any) => {
        orphanedEvents.push(ev);
      });

      const frame = editor.createShape({
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 300, height: 200 },
      });

      const child = editor.createShape({
        type: 'rect',
        x: 150,
        y: 150,
        meta: { parent: frame.id },
        props: { width: 100, height: 60 },
      });

      // Delete the parent frame
      editor.store.deleteShape(frame.id);

      const updatedChild = editor.store.getShape(child.id);
      const childEl = document.querySelector(`.od-shape[data-id="${child.id}"]`);
      const shapesLayer = document.querySelector('.od-shapes-layer');
      const isTopLevel = shapesLayer?.contains(childEl) && childEl?.parentElement === shapesLayer;

      return {
        events: orphanedEvents,
        childMetaParent: updatedChild?.meta['parent'],
        isTopLevel,
        childPos: { x: updatedChild?.x, y: updatedChild?.y },
      };
    });

    expect(result.events.length).toBe(1);
    expect(result.events[0].previousParentId).toBeDefined();
    expect(result.childMetaParent).toBeUndefined();
    expect(result.isTopLevel).toBe(true);
    expect(result.childPos).toEqual({ x: 150, y: 150 });
  });

  test('overlap fixture: innermost (smallest area) frame wins on drop in intersection', async ({ page }) => {
    const parentId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;

      // Large frame: 600x500 at (50, 50), area = 300,000
      const largeFrame = editor.createShape({
        type: 'frame',
        x: 50,
        y: 50,
        props: { width: 600, height: 500, label: 'Outer Big Frame' },
      });

      // Small frame: 250x200 at (100, 100), area = 50,000
      const smallFrame = editor.createShape({
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 250, height: 200, label: 'Inner Small Frame' },
      });

      // Drop child in intersection at (150, 150)
      editor.setTool('rect');
      return { largeId: largeFrame.id, smallId: smallFrame.id };
    });

    const containerBox = await page.locator('#canvas-container').boundingBox();
    expect(containerBox).not.toBeNull();
    const clickX = (containerBox?.x ?? 0) + 150;
    const clickY = (containerBox?.y ?? 0) + 150;
    await page.mouse.click(clickX, clickY);

    const childParent = await page.evaluate(({ largeId, smallId }) => {
      const editor = (window as any).__od_debug__.editor;
      const shapes = editor.store.listShapes();
      const child = shapes.find((s: any) => s.id !== largeId && s.id !== smallId);
      return child?.meta['parent'];
    }, parentId);

    // Smallest area (innermost) frame must win
    expect(childParent).toBe(parentId.smallId);
  });
});
