import { test, expect } from '@playwright/test';

test.describe('Phase 4 §0.1: Wheel Zoom & Pan Engine Gate', () => {
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

  test('ctrlKey + wheel: prevents browser zoom (defaultPrevented: true) and zooms camera', async ({ page }) => {
    const result = await page.evaluate(() => {
      const container = document.getElementById('canvas-container')!;
      const editor = (window as any).__od_debug__.editor;
      const zoomBefore = editor.camera.zoom;

      const event = new WheelEvent('wheel', {
        clientX: 300,
        clientY: 200,
        deltaY: -100,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(event);

      return {
        defaultPrevented: event.defaultPrevented,
        zoomBefore,
        zoomAfter: editor.camera.zoom,
      };
    });

    expect(result.defaultPrevented).toBe(true);
    expect(result.zoomAfter).toBeGreaterThan(result.zoomBefore);
  });

  test('plain wheel: pans camera deltaX/deltaY, preserves zoom', async ({ page }) => {
    const result = await page.evaluate(() => {
      const container = document.getElementById('canvas-container')!;
      const editor = (window as any).__od_debug__.editor;
      const zoomBefore = editor.camera.zoom;
      const xBefore = editor.camera.x;
      const yBefore = editor.camera.y;

      const event = new WheelEvent('wheel', {
        clientX: 300,
        clientY: 200,
        deltaX: 45,
        deltaY: 85,
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(event);

      return {
        defaultPrevented: event.defaultPrevented,
        zoomBefore,
        zoomAfter: editor.camera.zoom,
        panDeltaX: editor.camera.x - xBefore,
        panDeltaY: editor.camera.y - yBefore,
      };
    });

    expect(result.defaultPrevented).toBe(true);
    expect(result.zoomAfter).toBe(result.zoomBefore);
    expect(result.panDeltaX).toBe(-45);
    expect(result.panDeltaY).toBe(-85);
  });

  test('shift + wheel: horizontal pan', async ({ page }) => {
    const result = await page.evaluate(() => {
      const container = document.getElementById('canvas-container')!;
      const editor = (window as any).__od_debug__.editor;
      const zoomBefore = editor.camera.zoom;
      const xBefore = editor.camera.x;
      const yBefore = editor.camera.y;

      const event = new WheelEvent('wheel', {
        clientX: 300,
        clientY: 200,
        deltaX: 0,
        deltaY: 50,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(event);

      return {
        defaultPrevented: event.defaultPrevented,
        zoomBefore,
        zoomAfter: editor.camera.zoom,
        panDeltaX: editor.camera.x - xBefore,
        panDeltaY: editor.camera.y - yBefore,
      };
    });

    expect(result.defaultPrevented).toBe(true);
    expect(result.zoomAfter).toBe(result.zoomBefore);
    expect(result.panDeltaX).toBe(-50);
    expect(result.panDeltaY).toBe(0);
  });

  test('zoom-at-cursor precision: element directly under cursor stays pinned ±1px in screen space', async ({ page }) => {
    const { shapeId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 250,
        y: 180,
        props: { width: 100, height: 80, fill: '#3b82f6' },
      });
      return { shapeId: s.id };
    });

    const result = await page.evaluate((id) => {
      const container = document.getElementById('canvas-container')!;
      const editor = (window as any).__od_debug__.editor;
      const wrapper = editor.renderer.getShapeWrapper(id);
      const rectEl = wrapper?.querySelector('rect');
      const boxBefore = rectEl!.getBoundingClientRect();

      // Zoom centered directly at the top-left corner of the shape
      const cursorX = boxBefore.left;
      const cursorY = boxBefore.top;

      const event = new WheelEvent('wheel', {
        clientX: cursorX,
        clientY: cursorY,
        deltaY: -120, // zoom in
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(event);

      const boxAfter = rectEl!.getBoundingClientRect();

      return {
        diffX: Math.abs(boxAfter.left - boxBefore.left),
        diffY: Math.abs(boxAfter.top - boxBefore.top),
        zoomAfter: editor.camera.zoom,
      };
    }, shapeId);

    expect(result.zoomAfter).toBeGreaterThan(1);
    expect(result.diffX).toBeLessThanOrEqual(1.5);
    expect(result.diffY).toBeLessThanOrEqual(1.5);
  });

  test('middle-mouse drag (button 1) grab-pans the canvas', async ({ page }) => {
    const result = await page.evaluate(() => {
      const container = document.getElementById('canvas-container')!;
      const editor = (window as any).__od_debug__.editor;
      const xBefore = editor.camera.x;
      const yBefore = editor.camera.y;

      // Down with button 1
      container.dispatchEvent(new PointerEvent('pointerdown', {
        clientX: 200,
        clientY: 200,
        button: 1,
        bubbles: true,
      }));

      const cursorDuring = container.style.cursor;

      // Move
      window.dispatchEvent(new PointerEvent('pointermove', {
        clientX: 260,
        clientY: 240,
        bubbles: true,
      }));

      // Up
      window.dispatchEvent(new PointerEvent('pointerup', {
        clientX: 260,
        clientY: 240,
        button: 1,
        bubbles: true,
      }));

      const cursorAfter = container.style.cursor;

      return {
        cursorDuring,
        cursorAfter,
        panDeltaX: editor.camera.x - xBefore,
        panDeltaY: editor.camera.y - yBefore,
      };
    });

    expect(result.cursorDuring).toBe('grabbing');
    expect(result.cursorAfter).toBe('');
    expect(result.panDeltaX).toBe(60);
    expect(result.panDeltaY).toBe(40);
  });

  test('listener removed on destroy: wheel after destroy changes nothing, no errors', async ({ page }) => {
    const result = await page.evaluate(() => {
      const CanvasEditor = (window as any).__od_debug__.CanvasEditor;
      const host = document.createElement('div');
      host.style.cssText = 'width: 500px; height: 500px; position: absolute; left: -9999px;';
      document.body.appendChild(host);

      const tempEditor = new CanvasEditor();
      tempEditor.mount(host);

      const zoomBefore = tempEditor.camera.zoom;
      tempEditor.destroy();

      // Dispatch wheel on unmounted host
      let threw = false;
      try {
        host.dispatchEvent(new WheelEvent('wheel', {
          clientX: 200,
          clientY: 200,
          deltaY: -100,
          ctrlKey: true,
          bubbles: true,
        }));
      } catch {
        threw = true;
      }

      document.body.removeChild(host);

      return {
        threw,
        zoomBefore,
        zoomAfter: tempEditor.camera.zoom,
      };
    });

    expect(result.threw).toBe(false);
    expect(result.zoomAfter).toBe(result.zoomBefore);
  });
});
