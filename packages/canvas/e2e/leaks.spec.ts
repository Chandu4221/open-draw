import { test, expect } from '@playwright/test';

test.describe('Phase 0.2.0 §3: Memory & Listener Leak Suite', () => {
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

  test('§3.1 Editor lifecycle leak test: 50 cycles of create -> draw 50 -> destroy', async ({ page }) => {
    test.setTimeout(60000);

    const result = await page.evaluate(async () => {
      const CanvasEditor = (window as any).__od_debug__.CanvasEditor;
      const testHost = document.createElement('div');
      testHost.id = 'leak-test-host';
      testHost.style.cssText = 'width: 800px; height: 600px; position: absolute; left: -9999px;';
      document.body.appendChild(testHost);

      const nodeCounts: number[] = [];
      const heapSamples: number[] = [];

      for (let cycle = 0; cycle < 50; cycle++) {
        const editor = new CanvasEditor();
        editor.mount(testHost);

        // Draw 50 shapes
        for (let i = 0; i < 50; i++) {
          editor.createShape({
            type: i % 2 === 0 ? 'rect' : 'ellipse',
            x: (i % 10) * 50,
            y: Math.floor(i / 10) * 50,
            props: { width: 40, height: 40, fill: '#6366f1' },
          });
        }

        // Verify shapes mounted
        const shapeElementsCount = testHost.querySelectorAll('.od-shape').length;
        if (shapeElementsCount !== 50) {
          throw new Error(`Expected 50 shape elements, found ${shapeElementsCount} at cycle ${cycle}`);
        }

        // Teardown
        editor.destroy();

        // Sample DOM node count and memory
        const currentDOMCount = document.querySelectorAll('*').length;
        nodeCounts.push(currentDOMCount);

        const perfMem = (window.performance as any)?.memory?.usedJSHeapSize;
        if (typeof perfMem === 'number') {
          heapSamples.push(perfMem);
        }

        if (testHost.children.length !== 0) {
          throw new Error(`Expected 0 children in testHost after destroy at cycle ${cycle}, found ${testHost.children.length}`);
        }
      }

      document.body.removeChild(testHost);

      return {
        cycle10Nodes: nodeCounts[9]!,
        cycle30Nodes: nodeCounts[29]!,
        cycle50Nodes: nodeCounts[49]!,
        heapSamplesCount: heapSamples.length,
        initialHeap: heapSamples[0] ?? null,
        finalHeap: heapSamples[heapSamples.length - 1] ?? null,
      };
    });

    // Node count must plateau: cycle 50 node count matches cycle 10 within tight bounded threshold
    const nodeGrowth = Math.abs(result.cycle50Nodes - result.cycle10Nodes);
    expect(nodeGrowth, `DOM nodes accumulated across cycles: cycle10=${result.cycle10Nodes}, cycle50=${result.cycle50Nodes}`).toBeLessThanOrEqual(2);
  });

  test('§3.2 Listener audit: every addEventListener has matching removeEventListener and zero callbacks after destroy', async ({ page }) => {
    const auditResult = await page.evaluate(() => {
      const CanvasEditor = (window as any).__od_debug__.CanvasEditor;
      const host = document.createElement('div');
      host.style.cssText = 'width: 500px; height: 500px;';
      document.body.appendChild(host);

      const activeListeners: Array<{ target: string; type: string }> = [];
      const origHostAdd = host.addEventListener.bind(host);
      const origHostRemove = host.removeEventListener.bind(host);
      const origWinAdd = window.addEventListener.bind(window);
      const origWinRemove = window.removeEventListener.bind(window);

      host.addEventListener = (type: string, listener: any, options?: any) => {
        activeListeners.push({ target: 'host', type });
        return origHostAdd(type, listener, options);
      };
      host.removeEventListener = (type: string, listener: any, options?: any) => {
        const idx = activeListeners.findIndex((l) => l.target === 'host' && l.type === type);
        if (idx !== -1) activeListeners.splice(idx, 1);
        return origHostRemove(type, listener, options);
      };
      window.addEventListener = (type: string, listener: any, options?: any) => {
        activeListeners.push({ target: 'window', type });
        return origWinAdd(type, listener, options);
      };
      window.removeEventListener = (type: string, listener: any, options?: any) => {
        const idx = activeListeners.findIndex((l) => l.target === 'window' && l.type === type);
        if (idx !== -1) activeListeners.splice(idx, 1);
        return origWinRemove(type, listener, options);
      };

      try {
        const editor = new CanvasEditor();
        editor.mount(host);

        // Verify listeners were attached
        const listenerCountDuringMount = activeListeners.length;

        // Create initial shape
        editor.createShape({
          type: 'rect',
          x: 100,
          y: 100,
          props: { width: 80, height: 80, fill: '#3b82f6' },
        });

        const initialSnapshot = JSON.stringify(editor.store.getSnapshot());

        // Destroy editor
        editor.destroy();

        // Check dangling listeners immediately after destroy
        const danglingListenersAfterDestroy = [...activeListeners];

        // Dispatch various user events on orphaned host and window
        host.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: 120, clientY: 120 }));
        host.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 120, clientY: 120 }));
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 200 }));
        window.dispatchEvent(new PointerEvent('pointerup', { clientX: 200, clientY: 200 }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
        host.dispatchEvent(new DragEvent('dragover', { bubbles: true }));
        host.dispatchEvent(new DragEvent('drop', { bubbles: true }));

        const postEventsSnapshot = JSON.stringify(editor.store.getSnapshot());
        const isStillMounted = editor.isMounted;

        return {
          listenerCountDuringMount,
          danglingListeners: danglingListenersAfterDestroy,
          isStillMounted,
          initialSnapshot,
          postEventsSnapshot,
        };
      } finally {
        host.addEventListener = origHostAdd;
        host.removeEventListener = origHostRemove;
        window.addEventListener = origWinAdd;
        window.removeEventListener = origWinRemove;
        document.body.removeChild(host);
      }
    });

    expect(auditResult.listenerCountDuringMount).toBeGreaterThan(0);
    expect(auditResult.danglingListeners, `Dangling listeners after destroy: ${JSON.stringify(auditResult.danglingListeners)}`).toHaveLength(0);
    expect(auditResult.isStillMounted).toBe(false);
    expect(auditResult.postEventsSnapshot).toBe(auditResult.initialSnapshot);
  });

  test('§3.3 Gesture-path leak test: rapid in-flight gesture teardown', async ({ page }) => {
    const gestureResult = await page.evaluate(() => {
      const CanvasEditor = (window as any).__od_debug__.CanvasEditor;
      const host = document.createElement('div');
      host.style.cssText = 'width: 500px; height: 500px;';
      document.body.appendChild(host);

      let errorsEncountered = 0;

      for (let i = 0; i < 20; i++) {
        try {
          const editor = new CanvasEditor();
          editor.mount(host);
          editor.createShape({
            type: 'rect',
            x: 50,
            y: 50,
            props: { width: 100, height: 100 },
          });

          // Begin gesture
          host.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 60, clientY: 60 }));
          window.dispatchEvent(new PointerEvent('pointermove', { clientX: 80, clientY: 80 }));

          // Destroy mid-flight
          editor.destroy();

          // Complete gesture on orphaned/window DOM
          window.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 100 }));

          if (host.children.length !== 0) {
            errorsEncountered++;
          }
        } catch {
          errorsEncountered++;
        }
      }

      document.body.removeChild(host);
      return { errorsEncountered };
    });

    expect(gestureResult.errorsEncountered).toBe(0);
  });

  test('§3.4 exportPNG leak test: 100 exports on one editor maintains DOM stability', async ({ page }) => {
    test.setTimeout(45000);

    const exportResult = await page.evaluate(async () => {
      const editor = (window as any).__od_debug__.editor;

      // Populate 20 shapes with overlays
      for (let i = 0; i < 20; i++) {
        editor.createShape({
          type: i % 2 === 0 ? 'rect' : 'note',
          x: (i % 5) * 80 + 20,
          y: Math.floor(i / 5) * 80 + 20,
          props: { width: 60, height: 60, fill: '#10b981', text: 'Note' },
        });
      }

      // Activate selection to spawn overlays
      const shapes = editor.store.listShapes();
      editor.selectionManager.setSelection([shapes[0]!.id, shapes[1]!.id]);

      const initialDOMCount = document.querySelectorAll('*').length;
      const initialOverlayCount = document.querySelectorAll('.od-overlay-slot *').length;

      // Execute 100 exports toggling chips flag
      for (let i = 0; i < 100; i++) {
        await editor.exportPNG({ chips: i % 2 === 0 });
      }

      const finalDOMCount = document.querySelectorAll('*').length;
      const finalOverlayCount = document.querySelectorAll('.od-overlay-slot *').length;

      return {
        initialDOMCount,
        finalDOMCount,
        initialOverlayCount,
        finalOverlayCount,
      };
    });

    expect(exportResult.finalDOMCount, 'DOM elements leaked during exportPNG').toBe(exportResult.initialDOMCount);
    expect(exportResult.finalOverlayCount, 'Overlays corrupted or leaked during exportPNG').toBe(exportResult.initialOverlayCount);
  });
});
