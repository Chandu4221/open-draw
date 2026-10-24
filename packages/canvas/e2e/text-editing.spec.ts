import { test, expect } from '@playwright/test';

test.describe('Privileged Capability #1: Text Editing E2E Gate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-container');
  });

  test('dblclick -> type "Hello" -> blur -> props.text === "Hello", bounds grew', async ({ page }) => {
    // 1. Create a text shape via editor
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const shape = editor.createShape({
        type: 'text',
        x: 100,
        y: 100,
        props: {
          text: 'Hi',
          fontSize: 16,
          width: 50,
          height: 30,
        },
      });
      return shape.id;
    });

    const shapeElement = page.locator(`.od-shape[data-id="${shapeId}"]`);
    await expect(shapeElement).toBeVisible();

    // 2. Double-click on text shape
    await shapeElement.dblclick();

    // Verify editor enters editing mode
    const mode = await page.evaluate(() => (window as any).__od_debug__.editor.mode);
    expect(mode).toBe('editing');

    // Verify textarea rendered inside overlay slot
    const textarea = page.locator(`.od-shape[data-id="${shapeId}"] textarea.od-text-editor`);
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeFocused();

    // 3. Clear and type "Hello"
    await textarea.fill('Hello');

    // 4. Blur to commit
    await page.locator('#canvas-container').click({ position: { x: 500, y: 500 } });

    // Verify editor mode returned to 'none'
    const modeAfter = await page.evaluate(() => (window as any).__od_debug__.editor.mode);
    expect(modeAfter).toBe('none');

    // Verify text and auto-grown bounds in store
    const updatedShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shapeId);
    expect(updatedShape.props.text).toBe('Hello');
    expect(updatedShape.props.width).toBeGreaterThan(50);

    // Verify rendered DOM text element updated
    const textDom = page.locator(`.od-shape[data-id="${shapeId}"] .od-text-body`);
    await expect(textDom).toHaveText('Hello');

    // Capture visual verification screenshot
    await page.locator('#canvas-container').screenshot({ path: 'docs/od-verification/2x/text-editing.png' });
  });

  test('Escape mid-edit leaves text unchanged and does not produce extra undo entry', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const shape = editor.createShape({
        type: 'text',
        x: 150,
        y: 150,
        props: { text: 'Original', width: 80, height: 30 },
      });
      return shape.id;
    });

    const shapeElement = page.locator(`.od-shape[data-id="${shapeId}"]`);
    await shapeElement.dblclick();

    const textarea = page.locator(`.od-shape[data-id="${shapeId}"] textarea.od-text-editor`);
    await expect(textarea).toBeVisible();

    await textarea.fill('Modified But Cancelled');
    await page.keyboard.press('Escape');

    // Verify mode returned to 'none' and textarea removed
    const mode = await page.evaluate(() => (window as any).__od_debug__.editor.mode);
    expect(mode).toBe('none');
    await expect(textarea).toHaveCount(0);

    // Verify text remains unchanged in store
    const shape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shapeId);
    expect(shape.props.text).toBe('Original');

    // Verify undo stack does not have a commit for the cancelled edit
    const canUndo = await page.evaluate(() => (window as any).__od_debug__.editor.canUndo());
    // Only the initial creation is on the undo stack
    await page.evaluate(() => (window as any).__od_debug__.editor.undo());
    const shapeAfterUndo = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shapeId);
    expect(shapeAfterUndo).toBeUndefined();
  });

  test('empty text on commit deletes shape in one transaction', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const shape = editor.createShape({
        type: 'text',
        x: 200,
        y: 200,
        props: { text: 'To Delete', width: 80, height: 30 },
      });
      return shape.id;
    });

    const shapeElement = page.locator(`.od-shape[data-id="${shapeId}"]`);
    await shapeElement.dblclick();

    const textarea = page.locator(`.od-shape[data-id="${shapeId}"] textarea.od-text-editor`);
    await textarea.fill('   '); // empty whitespace
    await page.locator('#canvas-container').click({ position: { x: 500, y: 500 } });

    // Verify shape was deleted from store
    const shape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shapeId);
    expect(shape).toBeUndefined();

    // Verify shape element removed from DOM
    await expect(shapeElement).toHaveCount(0);

    // Verify undo restores shape in single step
    await page.evaluate(() => (window as any).__od_debug__.editor.undo());
    const restoredShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shapeId);
    expect(restoredShape).toBeDefined();
    expect(restoredShape.props.text).toBe('To Delete');
  });

  test('overlay-invariant holds during edit AND after commit', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const shape = editor.createShape({
        type: 'note',
        x: 100,
        y: 100,
        props: { width: 200, height: 160, color: '#fef08a', text: 'Note content' },
      });

      // Append test label into overlay slot
      const slot = editor.getOverlaySlot(shape.id);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'glued-badge');
      text.setAttribute('x', '0');
      text.setAttribute('y', '0');
      text.textContent = 'BADGE';
      slot.appendChild(text);

      return shape.id;
    });

    const checkInvariant = async (stage: string) => {
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
      }, shapeId);

      expect(res.error).toBeUndefined();
      expect(res.dx, `${stage}: slot x drift <= 1px`).toBeLessThanOrEqual(1);
      expect(res.dy, `${stage}: slot y drift <= 1px`).toBeLessThanOrEqual(1);
      expect(res.isLastChild, `${stage}: slot is last child`).toBe(true);
      expect(res.pointerEvents, `${stage}: pointer-events none`).toBe('none');
    };

    // 1. Initial state
    await checkInvariant('initial');

    // 2. Start editing
    const noteElement = page.locator(`.od-shape[data-id="${shapeId}"]`);
    await noteElement.dblclick();

    // Check invariant during active edit
    await checkInvariant('during-edit');

    // 3. Edit text and commit via blur
    const textarea = page.locator(`.od-shape[data-id="${shapeId}"] textarea.od-text-editor`);
    await textarea.fill('Updated note text after commit');
    await page.locator('#canvas-container').click({ position: { x: 500, y: 500 } });

    // Check invariant after commit
    await checkInvariant('after-commit');

    // 4. Pan & zoom and verify invariant still holds
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.pan(200, 100);
      editor.zoomAroundPoint({ x: 200, y: 200 }, 2.0);
    });
    await checkInvariant('after-pan-zoom');
  });

  test('typing text with spaces accepts space between characters', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const shape = editor.createShape({
        type: 'text',
        x: 100,
        y: 100,
        props: {
          text: 'Init',
          fontSize: 16,
          width: 50,
          height: 30,
        },
      });
      return shape.id;
    });

    const shapeElement = page.locator(`.od-shape[data-id="${shapeId}"]`);
    await shapeElement.dblclick();

    const textarea = page.locator(`.od-shape[data-id="${shapeId}"] textarea.od-text-editor`);
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeFocused();

    // Type with spaces using real keyboard keypress events (not fill)
    await page.keyboard.type('Hello World with spaces');
    await expect(textarea).toHaveValue('Hello World with spaces');

    // Commit via canvas blur
    await page.locator('#canvas-container').click({ position: { x: 500, y: 500 } });

    // Verify text shape in store contains all spaces
    const updatedShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shapeId);
    expect(updatedShape.props.text).toBe('Hello World with spaces');
  });

  test('single click on canvas with text tool inserts text shape and opens inline editor', async ({ page }) => {
    // 1. Activate text tool
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.setTool('text');
    });

    const tool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
    expect(tool).toBe('text');

    // 2. Click canvas at (250, 180) without dragging
    const containerBox = await page.locator('#canvas-container').boundingBox();
    expect(containerBox).not.toBeNull();
    const clickX = (containerBox?.x ?? 0) + 250;
    const clickY = (containerBox?.y ?? 0) + 180;

    await page.mouse.move(clickX, clickY);
    await page.mouse.down();
    await page.mouse.up();

    // 3. Verify text shape was created in store
    const shapes = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
    expect(shapes.length).toBe(1);
    const shape = shapes[0];
    expect(shape.type).toBe('text');
    expect(shape.x).toBe(250);
    expect(shape.y).toBe(180);

    // Verify tool reset to 'select'
    const resetTool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
    expect(resetTool).toBe('select');

    // 4. Verify text editor textarea is mounted and active
    const textarea = page.locator(`.od-shape[data-id="${shape.id}"] textarea.od-text-editor`);
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeFocused();

    // 5. Type text and commit via canvas blur
    await page.keyboard.type('Clicked text');
    await page.locator('#canvas-container').click({ position: { x: 500, y: 500 } });

    // Verify committed text
    const updatedShape = await page.evaluate((id) => (window as any).__od_debug__.editor.getShape(id), shape.id);
    expect(updatedShape.props.text).toBe('Clicked text');
  });

  test('single click on canvas with rect tool does not insert shape', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.setTool('rect');
    });

    const containerBox = await page.locator('#canvas-container').boundingBox();
    expect(containerBox).not.toBeNull();
    const clickX = (containerBox?.x ?? 0) + 250;
    const clickY = (containerBox?.y ?? 0) + 180;

    await page.mouse.move(clickX, clickY);
    await page.mouse.down();
    await page.mouse.up();

    const shapes = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
    expect(shapes.length).toBe(0);

    const resetTool = await page.evaluate(() => (window as any).__od_debug__.editor.getTool());
    expect(resetTool).toBe('select');
  });

  test('double click on rect inserts text shape inside and typing commits it', async ({ page }) => {
    const rectId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const rect = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
      });
      return rect.id;
    });

    const rectElement = page.locator(`.od-shape[data-id="${rectId}"]`);
    await expect(rectElement).toBeVisible();

    // Double-click the rect
    await rectElement.dblclick({ position: { x: 50, y: 50 } });

    // Verify mode is editing
    const mode = await page.evaluate(() => (window as any).__od_debug__.editor.mode);
    expect(mode).toBe('editing');

    // Textarea is visible and focused
    const textarea = page.locator('textarea.od-text-editor');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeFocused();

    // Type text
    await textarea.fill('Button Label');

    // Blur to commit
    await page.locator('#canvas-container').click({ position: { x: 500, y: 500 } });

    const modeAfter = await page.evaluate(() => (window as any).__od_debug__.editor.mode);
    expect(modeAfter).toBe('none');

    // Verify new text shape exists inside the rect bounds
    const shapes = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
    const textShape = shapes.find((s: any) => s.type === 'text');
    expect(textShape).toBeDefined();
    expect(textShape.props.text).toBe('Button Label');
    expect(textShape.x).toBeGreaterThanOrEqual(100);
    expect(textShape.x).toBeLessThan(300);
    expect(textShape.y).toBeGreaterThanOrEqual(100);
    expect(textShape.y).toBeLessThan(200);

    // Verify single undo removes the text shape
    await page.evaluate(() => (window as any).__od_debug__.editor.undo());
    const shapesAfterUndo = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
    expect(shapesAfterUndo.some((s: any) => s.type === 'text')).toBe(false);
    expect(shapesAfterUndo.some((s: any) => s.id === rectId)).toBe(true);
  });

  test('double click on frame inserts text shape parented to the frame', async ({ page }) => {
    const frameId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const frame = editor.createShape({
        type: 'frame',
        x: 100,
        y: 100,
        props: { width: 300, height: 300 },
      });
      return frame.id;
    });

    const frameElement = page.locator(`.od-shape[data-id="${frameId}"]`);
    await frameElement.dblclick({ position: { x: 80, y: 80 } });

    const textarea = page.locator('textarea.od-text-editor');
    await expect(textarea).toBeVisible();
    await textarea.fill('Frame Content');

    await page.locator('#canvas-container').click({ position: { x: 500, y: 500 } });

    const shapes = await page.evaluate(() => (window as any).__od_debug__.editor.store.listShapes());
    const textShape = shapes.find((s: any) => s.type === 'text');
    expect(textShape).toBeDefined();
    expect(textShape.props.text).toBe('Frame Content');
    expect(textShape.meta.parent).toBe(frameId);
  });
});

