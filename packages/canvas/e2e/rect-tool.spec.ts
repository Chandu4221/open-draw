import { test, expect } from '@playwright/test';

test.describe('Rect Plugin & Tool E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-container');
  });

  test('creates rect via tool, selects, drags with pointer, and undos in a single transaction', async ({ page }) => {
    // 1. Activate rect tool
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.setTool('rect');
    });

    const tool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
    expect(tool).toBe('rect');

    // 2. Click on canvas to create rect
    const containerBox = await page.locator('#canvas-container').boundingBox();
    expect(containerBox).not.toBeNull();
    const clickX = (containerBox?.x ?? 0) + 200;
    const clickY = (containerBox?.y ?? 0) + 150;

    await page.mouse.click(clickX, clickY);

    // 3. Verify shape created in store and DOM
    const shapes = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
    expect(shapes.length).toBe(1);
    const shape = shapes[0];
    expect(shape.type).toBe('rect');
    expect(shape.x).toBe(200);
    expect(shape.y).toBe(150);
    expect(shape.props.width).toBe(100);
    expect(shape.props.height).toBe(100);

    // Verify DOM element rendered
    const rectElement = page.locator(`.od-shape[data-id="${shape.id}"] rect.od-shape-body`);
    await expect(rectElement).toBeVisible();

    // Verify tool reset to 'select'
    const resetTool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
    expect(resetTool).toBe('select');

    // 4. Drag the shape: move 80px right and 60px down
    await page.mouse.move(clickX + 30, clickY + 30);
    await page.mouse.down();
    await page.mouse.move(clickX + 60, clickY + 50);
    await page.mouse.move(clickX + 90, clickY + 70);
    await page.mouse.move(clickX + 110, clickY + 90);
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

    // 6. Redo: single redo restores the dragged position
    await page.evaluate(() => (window as any).__od_debug__.editor.redo());
    const redoneShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
    expect(redoneShape.x).toBe(280);
    expect(redoneShape.y).toBe(210);
  });
});
