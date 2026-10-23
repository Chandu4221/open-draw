import { test, expect } from '@playwright/test';

test.describe('DOM Canvas Overlay Invariant (The Soul Test)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-container');
  });

  test('standalone shape: overlay slot maintains transform coherence under extreme pan and zoom', async ({ page }) => {
    // 1. Create shape via editor API and append test text to overlay slot
    const initResult = await page.evaluate(() => {
      const editor = (window as any).__od_debug__?.editor;
      if (!editor) return { error: 'Editor not found on window.__od_debug__' };

      const shape = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 120, fill: '#3b82f6', stroke: '' },
      });

      const slot = editor.getOverlaySlot(shape.id);
      if (!slot) return { error: `Overlay slot for shape ${shape.id} not found` };

      // Append text child into overlay slot at local (0, 0)
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'test-overlay-text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '0');
      text.textContent = 'OPENDRAW';
      slot.appendChild(text);

      return { shapeId: shape.id };
    });

    if (initResult.error) {
      throw new Error(initResult.error);
    }

    const shapeId = initResult.shapeId;

    // Helper to evaluate bounding rects & structural invariants
    const checkInvariant = async (stage: string) => {
      const state = await page.evaluate((id) => {
        const editor = (window as any).__od_debug__.editor;
        const wrapper = document.querySelector(`.od-shape[data-id="${id}"]`) as SVGGElement | null;
        const slot = editor.getOverlaySlot(id);
        if (!wrapper || !slot) {
          return { error: `Wrapper or slot not found for id ${id}` };
        }

        const wrapperRect = wrapper.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();

        // Structural assertions
        const isLastChild = wrapper.lastElementChild === slot;
        const pointerEvents = window.getComputedStyle(slot).pointerEvents;
        const transformAttr = slot.getAttribute('transform');

        return {
          wrapperRect: { x: wrapperRect.x, y: wrapperRect.y, left: wrapperRect.left, top: wrapperRect.top },
          slotRect: { x: slotRect.x, y: slotRect.y, left: slotRect.left, top: slotRect.top },
          isLastChild,
          pointerEvents,
          transformAttr,
        };
      }, shapeId);

      if (state.error) {
        throw new Error(`[${stage}] ${state.error}`);
      }

      // Pixel top-left coherence: within 1px
      expect(Math.abs(state.slotRect.left - state.wrapperRect.left), `${stage}: horizontal drift`).toBeLessThanOrEqual(1);
      expect(Math.abs(state.slotRect.top - state.wrapperRect.top), `${stage}: vertical drift`).toBeLessThanOrEqual(1);

      // Structural contract: overlay slot is wrapper's last child
      expect(state.isLastChild, `${stage}: overlay slot must be wrapper's last child`).toBe(true);

      // Structural contract: pointer-events: none
      expect(state.pointerEvents, `${stage}: overlay slot pointer-events must be none`).toBe('none');

      // Structural contract: identity transform relative to wrapper
      expect(
        !state.transformAttr || state.transformAttr === '' || state.transformAttr === 'matrix(1, 0, 0, 1, 0, 0)',
        `${stage}: overlay slot must have identity transform`,
      ).toBe(true);
    };

    // Stage 1: Initial state (1x, 0, 0)
    await checkInvariant('initial 1x');
    await page.screenshot({ path: 'docs/od-verification/2/overlay-1x.png' });

    // Stage 2: Hard pan (+2000px, -2000px)
    await page.evaluate(() => (window as any).__od_debug__.editor.pan(2000, -2000));
    await checkInvariant('pan +2000, -2000');

    // Stage 3: Hard pan back (-4000px, +4000px)
    await page.evaluate(() => (window as any).__od_debug__.editor.pan(-4000, 4000));
    await checkInvariant('pan -4000, +4000');

    // Stage 4: Zoom to 0.2x
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.setCamera({ x: 0, y: 0, zoom: 0.2 });
    });
    await checkInvariant('zoom 0.2x');
    await page.screenshot({ path: 'docs/od-verification/2/overlay-0.2x.png' });

    // Stage 5: Zoom to 5x
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.setCamera({ x: -200, y: -200, zoom: 5.0 });
    });
    await checkInvariant('zoom 5.0x');
    await page.screenshot({ path: 'docs/od-verification/2/overlay-5x.png' });

    // Stage 6: Pan again at 5x
    await page.evaluate(() => (window as any).__od_debug__.editor.pan(500, -500));
    await checkInvariant('pan at 5x');

    // Stage 7: Back to 1x
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.setCamera({ x: 0, y: 0, zoom: 1.0 });
    });
    await checkInvariant('back to 1x');
  });

  test('nested-grouped shape: overlay slot maintains transform coherence inside a group hierarchy', async ({ page }) => {
    // Hand-built group snapshot
    const initResult = await page.evaluate(() => {
      const editor = (window as any).__od_debug__?.editor;
      if (!editor) return { error: 'Editor not found' };

      editor.loadSnapshot({
        version: 1,
        shapes: [
          {
            id: 'group-1',
            type: 'group',
            x: 200,
            y: 150,
            meta: {},
            props: {},
          },
          {
            id: 'child-rect-1',
            type: 'rect',
            x: 50,
            y: 50,
            meta: { parentId: 'group-1' },
            props: { width: 160, height: 90, fill: '#10b981' },
          },
        ],
        camera: { x: 0, y: 0, zoom: 1 },
      });

      const slot = editor.getOverlaySlot('child-rect-1');
      if (!slot) return { error: 'Child overlay slot not found' };

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'test-overlay-text');
      text.textContent = 'GROUPED_CHILD';
      slot.appendChild(text);

      return { childId: 'child-rect-1' };
    });

    if (initResult.error) {
      throw new Error(initResult.error);
    }

    const checkInvariant = async (stage: string) => {
      const state = await page.evaluate((id) => {
        const editor = (window as any).__od_debug__.editor;
        const wrapper = document.querySelector(`.od-shape[data-id="${id}"]`) as SVGGElement | null;
        const slot = editor.getOverlaySlot(id);
        if (!wrapper || !slot) return { error: 'Wrapper or slot missing' };

        const wrapperRect = wrapper.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();
        const isLastChild = wrapper.lastElementChild === slot;

        return {
          driftX: Math.abs(slotRect.left - wrapperRect.left),
          driftY: Math.abs(slotRect.top - wrapperRect.top),
          isLastChild,
        };
      }, initResult.childId);

      if (state.error) throw new Error(`[${stage}] ${state.error}`);
      expect(state.driftX, `${stage}: grouped child horizontal drift`).toBeLessThanOrEqual(1);
      expect(state.driftY, `${stage}: grouped child vertical drift`).toBeLessThanOrEqual(1);
      expect(state.isLastChild, `${stage}: grouped child overlay slot must be last child`).toBe(true);
    };

    await checkInvariant('grouped initial 1x');
    await page.evaluate(() => (window as any).__od_debug__.editor.pan(-1500, 1500));
    await checkInvariant('grouped pan');
    await page.evaluate(() => (window as any).__od_debug__.editor.setCamera({ x: 0, y: 0, zoom: 0.2 }));
    await checkInvariant('grouped zoom 0.2x');
    await page.evaluate(() => (window as any).__od_debug__.editor.setCamera({ x: -100, y: -100, zoom: 5.0 }));
    await checkInvariant('grouped zoom 5.0x');
    await page.evaluate(() => (window as any).__od_debug__.editor.setCamera({ x: 0, y: 0, zoom: 1.0 }));
    await checkInvariant('grouped back to 1x');
  });

  test('rotated shape: overlay slot maintains transform coherence under rotation', async ({ page }) => {
    const initResult = await page.evaluate(() => {
      const editor = (window as any).__od_debug__?.editor;
      const shape = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        rotation: 45,
        props: { width: 100, height: 100, fill: '#3b82f6', stroke: '' },
      });
      const slot = editor.getOverlaySlot(shape.id);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'test-overlay-text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '0');
      text.textContent = 'ROTATED';
      slot?.appendChild(text);
      return { shapeId: shape.id };
    });

    const shapeId = initResult.shapeId;
    const state = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const wrapper = document.querySelector(`.od-shape[data-id="${id}"]`) as SVGGElement | null;
      const slot = editor.getOverlaySlot(id);
      if (!wrapper || !slot) return { error: 'Not found' };
      const isLastChild = wrapper.lastElementChild === slot;
      const wrapperRect = wrapper.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      return {
        isLastChild,
        wrapperLeft: wrapperRect.left,
        slotLeft: slotRect.left,
        wrapperTop: wrapperRect.top,
        slotTop: slotRect.top,
      };
    }, shapeId);

    expect(state.isLastChild).toBe(true);
    expect(Math.abs(state.slotLeft - state.wrapperLeft)).toBeLessThanOrEqual(1);
    expect(Math.abs(state.slotTop - state.wrapperTop)).toBeLessThanOrEqual(1);
  });
});
