import { test, expect } from '@playwright/test';

test.describe('Privileged Capability #3: Arrow & Connector Reconciliation E2E Gate', () => {
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

  test('anti-stale-detach proof: move target 200px, endpoints follow dynamically from target bounds', async ({ page }) => {
    const { rectId, arrowId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;

      const rect = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 100, fill: '#60a5fa' },
      });

      const arrow = editor.createShape({
        type: 'arrow',
        x: 0,
        y: 0,
        props: {
          startBinding: { shapeId: rect.id, anchor: 'right' },
          endPoint: { x: 500, y: 150 },
          label: 'Direct Link',
        },
      });

      return { rectId: rect.id, arrowId: arrow.id };
    });

    // 1. Initial path check: start is at rect right anchor (200, 150), end is at (500, 150)
    const initialPath = await page.locator(`.od-shape[data-id="${arrowId}"] path.od-arrow-path`).getAttribute('d');
    expect(initialPath).toBe('M 200 150 L 500 150');

    // 2. Drag rect by (+200, +0) to (300, 100)
    const containerBox = await page.locator('#canvas-container').boundingBox();
    expect(containerBox).not.toBeNull();
    const dragStartX = (containerBox?.x ?? 0) + 150;
    const dragStartY = (containerBox?.y ?? 0) + 150;

    await page.mouse.move(dragStartX, dragStartY);
    await page.mouse.down();
    await page.mouse.move(dragStartX + 200, dragStartY, { steps: 5 });
    await page.mouse.up();

    // 3. Verify rect moved to (300, 100)
    const rectPos = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const r = editor.store.getShape(id);
      return { x: r.x, y: r.y };
    }, rectId);
    expect(rectPos).toEqual({ x: 300, y: 100 });

    // 4. Verify rendered path dynamically followed target bounds: right anchor is now at (400, 150)
    const movedPath = await page.locator(`.od-shape[data-id="${arrowId}"] path.od-arrow-path`).getAttribute('d');
    expect(movedPath).toBe('M 400 150 L 500 150');

    // 5. Anti-stale assertion: arrow props NEVER had absolute start coords written!
    const arrowProps = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const a = editor.store.getShape(id);
      return a.props;
    }, arrowId);
    expect(arrowProps.startBinding).toEqual({ shapeId: rectId, anchor: 'right' });
    expect(arrowProps.startPoint).toBeUndefined();
  });

  test('delete target unbinds arrow, fires event with fallback point, arrow persists, and undo restores binding', async ({ page }) => {
    const result = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const unboundEvents: any[] = [];
      editor.connector.onTargetUnbound((ev: any) => {
        unboundEvents.push(ev);
      });

      const rect = editor.createShape({
        type: 'rect',
        x: 200,
        y: 150,
        props: { width: 120, height: 80 },
      });

      const arrow = editor.createShape({
        type: 'arrow',
        x: 0,
        y: 0,
        props: {
          startBinding: { shapeId: rect.id, anchor: 'right' },
          endPoint: { x: 600, y: 190 },
        },
      });

      // Right anchor of rect is at (320, 190)
      // Delete target rect via editor method
      editor.deleteShape(rect.id);

      const persistedArrow = editor.store.getShape(arrow.id);
      return {
        rectId: rect.id,
        arrowId: arrow.id,
        events: unboundEvents,
        persistedArrowProps: persistedArrow?.props,
      };
    });

    // 1. Unbind event fired with correct fallback coordinates
    expect(result.events.length).toBe(1);
    expect(result.events[0]).toEqual({
      arrowId: result.arrowId,
      which: 'start',
      previousTargetId: result.rectId,
      fallbackPoint: { x: 320, y: 190 },
    });

    // 2. Arrow persists with fallback coordinates
    expect(result.persistedArrowProps.startBinding).toBeUndefined();
    expect(result.persistedArrowProps.startPoint).toEqual({ x: 320, y: 190 });

    // 3. Single undo restores both rect and arrow binding
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.store.undo();
    });

    const restoredState = await page.evaluate(({ rectId, arrowId }) => {
      const editor = (window as any).__od_debug__.editor;
      const r = editor.store.getShape(rectId);
      const a = editor.store.getShape(arrowId);
      return {
        rectExists: Boolean(r),
        arrowBinding: a.props.startBinding,
      };
    }, { rectId: result.rectId, arrowId: result.arrowId });

    expect(restoredState.rectExists).toBe(true);
    expect(restoredState.arrowBinding).toEqual({ shapeId: result.rectId, anchor: 'right' });
  });

  test('both ends bound to two shapes, move both, live reconciliation, overlay invariant glued at midpoint, screenshot', async ({ page }) => {
    const { rectAId, rectBId, arrowId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;

      const rectA = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 100, height: 100, fill: '#10b981' },
      });

      const rectB = editor.createShape({
        type: 'rect',
        x: 500,
        y: 100,
        props: { width: 100, height: 100, fill: '#8b5cf6' },
      });

      const arrow = editor.createShape({
        type: 'arrow',
        x: 0,
        y: 0,
        props: {
          startBinding: { shapeId: rectA.id, anchor: 'right' },
          endBinding: { shapeId: rectB.id, anchor: 'left' },
          label: 'Dataflow Connection',
        },
      });

      return { rectAId: rectA.id, rectBId: rectB.id, arrowId: arrow.id };
    });

    // Initial path from (200, 150) to (500, 150), midpoint at (350, 150)
    const initialPath = await page.locator(`.od-shape[data-id="${arrowId}"] path.od-arrow-path`).getAttribute('d');
    expect(initialPath).toBe('M 200 150 L 500 150');

    // Check overlay invariant on arrow
    const arrowInvariant = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const wrapper = document.querySelector(`.od-shape[data-id="${id}"]`) as SVGGElement | null;
      const slot = editor.getOverlaySlot(id);
      if (!wrapper || !slot) return { error: 'Arrow wrapper or slot not found' };

      const isLastChild = wrapper.lastElementChild === slot;
      const pointerEvents = getComputedStyle(slot).pointerEvents;
      const transformAttr = slot.getAttribute('transform');
      const label = slot.querySelector('.od-arrow-label');
      const labelX = label?.getAttribute('x');
      const labelY = label?.getAttribute('y');
      const labelText = label?.textContent;

      return {
        isLastChild,
        pointerEvents,
        hasIdentityTransform: !transformAttr || transformAttr === '' || transformAttr === 'matrix(1, 0, 0, 1, 0, 0)',
        labelX: Number(labelX),
        labelY: Number(labelY),
        labelText,
      };
    }, arrowId);

    expect(arrowInvariant.isLastChild).toBe(true);
    expect(arrowInvariant.pointerEvents).toBe('none');
    expect(arrowInvariant.hasIdentityTransform).toBe(true);
    expect(arrowInvariant.labelX).toBe(350);
    expect(arrowInvariant.labelY).toBe(144);
    expect(arrowInvariant.labelText).toBe('Dataflow Connection');

    // Move Rect A by (+50, +50) and Rect B by (-50, +50)
    await page.evaluate(({ rectAId, rectBId }) => {
      const editor = (window as any).__od_debug__.editor;
      editor.store.transact(() => {
        const a = editor.store.getShape(rectAId);
        const b = editor.store.getShape(rectBId);
        editor.store.updateShape(rectAId, { x: a.x + 50, y: a.y + 50 });
        editor.store.updateShape(rectBId, { x: b.x - 50, y: b.y + 50 });
      });
    }, { rectAId, rectBId });

    // Assert live reconciliation: start followed to (250, 200), end followed to (450, 200)
    const reconciledPath = await page.locator(`.od-shape[data-id="${arrowId}"] path.od-arrow-path`).getAttribute('d');
    expect(reconciledPath).toBe('M 250 200 L 450 200');

    // Assert label followed midpoint live to (350, 194)
    const reconciledMidpoint = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const slot = editor.getOverlaySlot(id);
      const label = slot?.querySelector('.od-arrow-label');
      return {
        x: Number(label?.getAttribute('x')),
        y: Number(label?.getAttribute('y')),
      };
    }, arrowId);
    expect(reconciledMidpoint.x).toBe(350);
    expect(reconciledMidpoint.y).toBe(194);

    // Capture screenshot
    await page.screenshot({ path: 'docs/od-verification/2x/arrow.png' });
  });
});
