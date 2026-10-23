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

      // 2. Drag-to-draw on canvas to create ellipse
      const containerBox = await page.locator('#canvas-container').boundingBox();
      expect(containerBox).not.toBeNull();
      const clickX = (containerBox?.x ?? 0) + 200;
      const clickY = (containerBox?.y ?? 0) + 150;

      await page.mouse.move(clickX, clickY);
      await page.mouse.down();
      await page.mouse.move(clickX + 100, clickY + 100);
      await page.mouse.up();

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

  test.describe('B2x.3 Note', () => {
    test('creates note via tool, drags, undos in single transaction, verifies snapshot & overlay invariant', async ({ page }) => {
      // 1. Activate note tool
      await page.evaluate(() => {
        const editor = (window as any).__od_debug__.editor;
        editor.setTool('note');
      });

      const tool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
      expect(tool).toBe('note');

      // 2. Drag-to-draw on canvas to create note
      const containerBox = await page.locator('#canvas-container').boundingBox();
      expect(containerBox).not.toBeNull();
      const clickX = (containerBox?.x ?? 0) + 250;
      const clickY = (containerBox?.y ?? 0) + 180;

      await page.mouse.move(clickX, clickY);
      await page.mouse.down();
      await page.mouse.move(clickX + 200, clickY + 160);
      await page.mouse.up();

      // 3. Verify shape created in store and DOM
      const shapes = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
      expect(shapes.length).toBe(1);
      const shape = shapes[0];
      expect(shape.type).toBe('note');
      expect(shape.x).toBe(250);
      expect(shape.y).toBe(180);
      expect(shape.props.width).toBe(200);
      expect(shape.props.height).toBe(160);

      // Verify DOM elements rendered
      const noteElement = page.locator(`.od-shape[data-id="${shape.id}"] .od-note-bg`);
      await expect(noteElement).toBeVisible();

      // Verify tool reset to 'select'
      const resetTool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
      expect(resetTool).toBe('select');

      // 4. Drag the shape: move 70px right and 50px down
      await page.mouse.move(clickX + 50, clickY + 50);
      await page.mouse.down();
      await page.mouse.move(clickX + 80, clickY + 70);
      await page.mouse.move(clickX + 120, clickY + 100);
      await page.mouse.up();

      // Verify dragged position
      const draggedShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
      expect(draggedShape.x).toBe(320);
      expect(draggedShape.y).toBe(230);

      // 5. Undo: single gesture must undo in EXACTLY ONE transaction
      const canUndoBefore = await page.evaluate(() => (window as any).__od_debug__.editor.canUndo());
      expect(canUndoBefore).toBe(true);

      await page.evaluate(() => (window as any).__od_debug__.editor.undo());

      const revertedShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
      expect(revertedShape.x).toBe(250);
      expect(revertedShape.y).toBe(180);

      // Redo restores dragged position
      await page.evaluate(() => (window as any).__od_debug__.editor.redo());
      const redoneShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
      expect(redoneShape.x).toBe(320);
      expect(redoneShape.y).toBe(230);

      // 6. Snapshot round-trip
      await page.evaluate(() => {
        const editor = (window as any).__od_debug__.editor;
        const snapshot = editor.getSnapshot();
        editor.loadSnapshot(snapshot);
      });

      const shapesAfterSnapshot = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
      expect(shapesAfterSnapshot.length).toBe(1);
      expect(shapesAfterSnapshot[0].id).toBe(shape.id);
      expect(shapesAfterSnapshot[0].type).toBe('note');
      expect(shapesAfterSnapshot[0].x).toBe(320);
      expect(shapesAfterSnapshot[0].y).toBe(230);

      // 7. Overlay-invariant extended to Note
      await page.evaluate((id) => {
        const editor = (window as any).__od_debug__.editor;
        const slot = editor.getOverlaySlot(id);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'note-overlay-label');
        text.setAttribute('x', '0');
        text.setAttribute('y', '0');
        text.textContent = 'NOTE-LABEL';
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
        editor.pan(250, -150);
      });
      await checkSlotInvariant('after-pan');

      // Zoom camera to 1.8x and verify invariant holds
      await page.evaluate(() => {
        const editor = (window as any).__od_debug__.editor;
        editor.zoomAroundPoint({ x: 300, y: 300 }, 1.8);
      });
      await checkSlotInvariant('after-zoom');

      // Capture verification screenshot for exit gate
      await page.locator('#canvas-container').screenshot({ path: 'docs/od-verification/2x/note.png' });
    });
  });

  test.describe('B2x.4 Image', () => {
    test('creates image via tool, drags, undos in single transaction, verifies snapshot & overlay invariant', async ({ page }) => {
      // 1. Activate image tool
      await page.evaluate(() => {
        const editor = (window as any).__od_debug__.editor;
        editor.setTool('image');
      });

      const tool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
      expect(tool).toBe('image');

      // 2. Drag-to-draw on canvas to create image
      const containerBox = await page.locator('#canvas-container').boundingBox();
      expect(containerBox).not.toBeNull();
      const clickX = (containerBox?.x ?? 0) + 150;
      const clickY = (containerBox?.y ?? 0) + 120;

      await page.mouse.move(clickX, clickY);
      await page.mouse.down();
      await page.mouse.move(clickX + 200, clickY + 200);
      await page.mouse.up();

      // 3. Verify shape created in store and DOM
      const shapes = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
      expect(shapes.length).toBe(1);
      const shape = shapes[0];
      expect(shape.type).toBe('image');
      expect(shape.x).toBe(150);
      expect(shape.y).toBe(120);
      expect(shape.props.width).toBe(200);
      expect(shape.props.height).toBe(200);

      // Verify DOM element rendered
      const imgElement = page.locator(`.od-shape[data-id="${shape.id}"] image.od-shape-body`);
      await expect(imgElement).toBeVisible();

      // Update props.src with sample SVG dataURL and verify DOM update
      const mockSrc = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="%23ec4899"/></svg>';
      await page.evaluate(({ id, src }) => {
        const editor = (window as any).__od_debug__.editor;
        editor.store.updateShape(id, { props: { ...editor.getShape(id).props, src } });
      }, { id: shape.id, src: mockSrc });

      const href = await imgElement.getAttribute('href');
      expect(href).toBe(mockSrc);

      // Verify tool reset to 'select'
      const resetTool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
      expect(resetTool).toBe('select');

      // 4. Drag the shape: move 60px right and 40px down
      await page.mouse.move(clickX + 50, clickY + 50);
      await page.mouse.down();
      await page.mouse.move(clickX + 80, clickY + 70);
      await page.mouse.move(clickX + 110, clickY + 90);
      await page.mouse.up();

      // Verify dragged position
      const draggedShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
      expect(draggedShape.x).toBe(210);
      expect(draggedShape.y).toBe(160);

      // 5. Undo: single gesture must undo in EXACTLY ONE transaction
      const canUndoBefore = await page.evaluate(() => (window as any).__od_debug__.editor.canUndo());
      expect(canUndoBefore).toBe(true);

      await page.evaluate(() => (window as any).__od_debug__.editor.undo());

      const revertedShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
      expect(revertedShape.x).toBe(150);
      expect(revertedShape.y).toBe(120);

      // Redo restores dragged position
      await page.evaluate(() => (window as any).__od_debug__.editor.redo());
      const redoneShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
      expect(redoneShape.x).toBe(210);
      expect(redoneShape.y).toBe(160);

      // 6. Snapshot round-trip
      await page.evaluate(() => {
        const editor = (window as any).__od_debug__.editor;
        const snapshot = editor.getSnapshot();
        editor.loadSnapshot(snapshot);
      });

      const shapesAfterSnapshot = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
      expect(shapesAfterSnapshot.length).toBe(1);
      expect(shapesAfterSnapshot[0].id).toBe(shape.id);
      expect(shapesAfterSnapshot[0].type).toBe('image');
      expect(shapesAfterSnapshot[0].x).toBe(210);
      expect(shapesAfterSnapshot[0].y).toBe(160);

      // 7. Overlay-invariant extended to Image
      await page.evaluate((id) => {
        const editor = (window as any).__od_debug__.editor;
        const slot = editor.getOverlaySlot(id);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'image-overlay-label');
        text.setAttribute('x', '0');
        text.setAttribute('y', '0');
        text.textContent = 'IMAGE-LABEL';
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
        editor.pan(200, -100);
      });
      await checkSlotInvariant('after-pan');

      // Zoom camera to 2.0x and verify invariant holds
      await page.evaluate(() => {
        const editor = (window as any).__od_debug__.editor;
        editor.zoomAroundPoint({ x: 250, y: 250 }, 2.0);
      });
      await checkSlotInvariant('after-zoom');

      // Capture verification screenshot for exit gate
      await page.locator('#canvas-container').screenshot({ path: 'docs/od-verification/2x/image.png' });
    });
  });
});
