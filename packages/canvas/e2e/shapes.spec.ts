import { test, expect } from '@playwright/test';

test.describe('Simple Shapes E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-container');
  });

  test.describe('B2x.2 Ellipse', () => {
    test('creates ellipse via tool, drags, undos in single transaction, verifies snapshot & overlay invariant', async ({ page }) => {
      // 1. Activate ellipse tool
      await page.evaluate(() => {
        const editor = (window as any).__od_debug__.editor;
        editor.setTool('ellipse');
      });

      const tool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
      expect(tool).toBe('ellipse');

      // 2. Click on canvas to create ellipse
      const containerBox = await page.locator('#canvas-container').boundingBox();
      expect(containerBox).not.toBeNull();
      const clickX = (containerBox?.x ?? 0) + 200;
      const clickY = (containerBox?.y ?? 0) + 150;

      await page.mouse.click(clickX, clickY);

      // 3. Verify shape created in store and DOM
      const shapes = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
      expect(shapes.length).toBe(1);
      const shape = shapes[0];
      expect(shape.type).toBe('ellipse');
      expect(shape.x).toBe(200);
      expect(shape.y).toBe(150);
      expect(shape.props.width).toBe(100);
      expect(shape.props.height).toBe(100);

      // Verify DOM element rendered
      const ellipseElement = page.locator(`.od-shape[data-id="${shape.id}"] ellipse.od-shape-body`);
      await expect(ellipseElement).toBeVisible();

      // Verify tool reset to 'select'
      const resetTool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
      expect(resetTool).toBe('select');

      // 4. Drag the shape: move 80px right and 60px down
      await page.mouse.move(clickX + 50, clickY + 50);
      await page.mouse.down();
      await page.mouse.move(clickX + 80, clickY + 70);
      await page.mouse.move(clickX + 110, clickY + 90);
      await page.mouse.move(clickX + 130, clickY + 110);
      await page.mouse.up();

      // Verify dragged position
      const draggedShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
      expect(draggedShape.x).toBe(280);
      expect(draggedShape.y).toBe(210);

      // 5. Undo: single gesture must undo in EXACTLY ONE transaction
      const canUndoBefore = await page.evaluate(() => (window as any).__od_debug__.editor.canUndo());
      expect(canUndoBefore).toBe(true);

      await page.evaluate(() => (window as any).__od_debug__.editor.undo());

      const revertedShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
      expect(revertedShape.x).toBe(200);
      expect(revertedShape.y).toBe(150);

      // Redo restores dragged position
      await page.evaluate(() => (window as any).__od_debug__.editor.redo());
      const redoneShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
      expect(redoneShape.x).toBe(280);
      expect(redoneShape.y).toBe(210);

      // 6. Snapshot round-trip
      await page.evaluate(() => {
        const editor = (window as any).__od_debug__.editor;
        const snapshot = editor.getSnapshot();
        editor.loadSnapshot(snapshot);
      });

      const shapesAfterSnapshot = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
      expect(shapesAfterSnapshot.length).toBe(1);
      expect(shapesAfterSnapshot[0].id).toBe(shape.id);
      expect(shapesAfterSnapshot[0].type).toBe('ellipse');
      expect(shapesAfterSnapshot[0].x).toBe(280);
      expect(shapesAfterSnapshot[0].y).toBe(210);

      // 7. Overlay-invariant extended to Ellipse
      await page.evaluate((id) => {
        const editor = (window as any).__od_debug__.editor;
        const slot = editor.getOverlaySlot(id);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'ellipse-overlay-label');
        text.setAttribute('x', '0');
        text.setAttribute('y', '0');
        text.textContent = 'ELLIPSE-LABEL';
        slot.appendChild(text);
      }, shape.id);

      const checkSlotInvariant = async (stage: string) => {
        const res = await page.evaluate((id) => {
          const editor = (window as any).__od_debug__.editor;
          const wrapper = document.querySelector(`.od-shape[data-id="${id}"]`) as SVGGElement | null;
          const slot = editor.getOverlaySlot(id);
          if (!wrapper || !slot) return { error: 'Not found' };

          const wRect = wrapper.getBoundingClientRect();
          const sRect = slot.getBoundingClientRect();

          return {
            dx: Math.abs(sRect.left - wRect.left),
            dy: Math.abs(sRect.top - wRect.top),
            isLastChild: wrapper.lastElementChild === slot,
            pointerEvents: window.getComputedStyle(slot).pointerEvents,
          };
        }, shape.id);

        expect(res.error).toBeUndefined();
        expect(res.dx, `${stage}: slot x drift <= 1px`).toBeLessThanOrEqual(1);
        expect(res.dy, `${stage}: slot y drift <= 1px`).toBeLessThanOrEqual(1);
        expect(res.isLastChild, `${stage}: slot is last child`).toBe(true);
        expect(res.pointerEvents, `${stage}: pointer-events none`).toBe('none');
      };

      await checkSlotInvariant('initial');

      // Pan camera and verify invariant holds
      await page.evaluate(() => {
        const editor = (window as any).__od_debug__.editor;
        editor.pan(300, -200);
      });
      await checkSlotInvariant('after-pan');

      // Zoom camera to 2.5x and verify invariant holds
      await page.evaluate(() => {
        const editor = (window as any).__od_debug__.editor;
        editor.zoomAroundPoint({ x: 300, y: 300 }, 2.5);
      });
      await checkSlotInvariant('after-zoom');

      // Capture verification screenshot for exit gate
      await page.locator('#canvas-container').screenshot({ path: 'docs/od-verification/2x/ellipse.png' });
    });
  });
});
