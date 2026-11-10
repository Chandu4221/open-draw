import { expect, test } from "@playwright/test";

test.describe("Standalone Canvas browser integration tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/canvas-test.html");
    await expect(page.locator("#editor-primary svg")).toBeVisible();
    await expect(page.locator("#editor-secondary svg")).toBeVisible();
  });

  test("mounts standalone editor into DOM and creates SVG element with region role and tabindex", async ({
    page,
  }) => {
    const primarySvg = page.locator("#editor-primary svg");
    await expect(primarySvg).toHaveAttribute("role", "region");
    await expect(primarySvg).toHaveAttribute("tabindex", "0");
    await expect(primarySvg).toHaveAttribute("aria-label", "Drawing canvas");

    const secondarySvg = page.locator("#editor-secondary svg");
    await expect(secondarySvg).toHaveAttribute("role", "region");
    await expect(secondarySvg).toHaveAttribute("tabindex", "0");
  });

  test("draws rectangle shape interactively and updates canonical document", async ({ page }) => {
    const primarySvg = page.locator("#editor-primary svg");
    const box = (await primarySvg.boundingBox())!;

    // Set tool to drawRect via editor API
    await page.evaluate(() => {
      window.__editorPrimary?.setTool("drawRect");
    });

    // Draw rect from (200, 150) to (320, 250)
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 320, box.y + 250);
    await page.mouse.up();

    // Verify document now has 2 shapes
    const shapesCount = await page.evaluate(() => {
      return Object.keys(window.__editorPrimary?.getDocument().shapes ?? {}).length;
    });
    expect(shapesCount).toBe(2);

    // Verify SVG scene contains the newly drawn rect
    const renderedRects = primarySvg.locator(".od-document-scene rect");
    await expect(renderedRects).toHaveCount(2);
  });

  test("drags shape to new position with live feedback and undo support", async ({ page }) => {
    const primarySvg = page.locator("#editor-primary svg");
    const box = (await primarySvg.boundingBox())!;

    // Initial shape rect-init is at (50, 50, 120, 80). Center is at (110, 90).
    const startX = box.x + 110;
    const startY = box.y + 90;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY + 80);
    await page.mouse.up();

    // Verify shape bounding box in document was updated to (150, 130)
    const newBox = await page.evaluate(() => {
      const doc = window.__editorPrimary?.getDocument();
      const shape = Object.values(doc?.shapes ?? {})[0];
      return shape?.boundingBox;
    });
    expect(newBox?.x).toBe(150);
    expect(newBox?.y).toBe(130);

    // Undo reverts back to (50, 50)
    await page.evaluate(() => {
      window.__editorPrimary?.undo();
    });
    const revertedBox = await page.evaluate(() => {
      const doc = window.__editorPrimary?.getDocument();
      const shape = Object.values(doc?.shapes ?? {})[0];
      return shape?.boundingBox;
    });
    expect(revertedBox?.x).toBe(50);
    expect(revertedBox?.y).toBe(50);
  });

  test("resizes shape via corner handle and updates bounding box", async ({ page }) => {
    const primarySvg = page.locator("#editor-primary svg");
    const box = (await primarySvg.boundingBox())!;

    // Select shape rect-init by clicking center (110, 90)
    await page.mouse.click(box.x + 110, box.y + 90);

    // SE handle of rect-init at (50, 50, 120, 80) is at (170, 130)
    const handleX = box.x + 170;
    const handleY = box.y + 130;

    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    // Drag SE handle to expand by +60px width, +40px height -> (230, 170)
    await page.mouse.move(handleX + 60, handleY + 40);
    await page.mouse.up();

    const resizedBox = await page.evaluate(() => {
      const doc = window.__editorPrimary?.getDocument();
      const shape = Object.values(doc?.shapes ?? {})[0];
      return shape?.boundingBox;
    });
    expect(resizedBox?.width).toBe(180);
    expect(resizedBox?.height).toBe(120);
  });

  test("handles 50 rapid container resize cycles dynamically via ResizeObserver in Chromium (2x Safety)", async ({
    page,
  }) => {
    // Perform 50 rapid programmatic container dimension changes
    await page.evaluate(() => {
      const container = document.getElementById("editor-primary");
      if (!container) return;
      for (let i = 0; i < 50; i++) {
        container.style.width = `${400 + (i % 10) * 20}px`;
        container.style.height = `${300 + (i % 10) * 15}px`;
      }
      container.style.width = "450px";
      container.style.height = "350px";
    });

    // Wait for next animation frame / observer propagation
    await page.waitForTimeout(100);

    // Verify SVG element scaled with container
    const primarySvg = page.locator("#editor-primary svg");
    const box = (await primarySvg.boundingBox())!;
    expect(box.width).toBe(450);
    expect(box.height).toBe(350);

    // Verify scene is intact and fully responsive
    const sceneHtml = await page.evaluate(() => {
      const svg = document.querySelector("#editor-primary .od-document-scene");
      return svg?.innerHTML ?? "";
    });
    expect(sceneHtml).toContain("<rect");
  });

  test("registers and renders custom shape extension with custom geometry and hit testing in browser", async ({
    page,
  }) => {
    // Register custom star extension and insert star shape
    await page.evaluate(() => {
      const ed = window.__editorPrimary;
      const ext = window.__customStarExtension;
      if (ed && ext) {
        ed.registerCustomShape(ext);
        ed.insertCustomShape(ext.kind, { x: 200, y: 150, width: 80, height: 80 });
      }
    });

    // Verify custom SVG renderer output rendered into real DOM
    const starPolygon = page.locator("#editor-primary .od-document-scene polygon.custom-star");
    await expect(starPolygon).toBeVisible();

    const box = (await page.locator("#editor-primary svg").boundingBox())!;

    // Clear selection
    await page.evaluate(() => {
      window.__editorPrimary?.clearSelection();
    });
    let selection = await page.evaluate(() => window.__editorPrimary?.getSelection() ?? []);
    expect(selection).toHaveLength(0);

    // Click corner of bounding box (205, 155) -> outside diamond star hit-test
    await page.mouse.click(box.x + 205, box.y + 155);
    selection = await page.evaluate(() => window.__editorPrimary?.getSelection() ?? []);
    expect(selection).toHaveLength(0);

    // Click center of diamond star (240, 190) -> inside diamond star hit-test
    await page.mouse.click(box.x + 240, box.y + 190);
    selection = await page.evaluate(() => window.__editorPrimary?.getSelection() ?? []);
    expect(selection).toHaveLength(1);
  });

  test("guarantees complete isolation between multiple editors on the same page (Multi-Editor Isolation)", async ({
    page,
  }) => {
    // 1. Selection Isolation: select shape in editorPrimary
    await page.evaluate(() => {
      const docA = window.__editorPrimary?.getDocument();
      const firstShapeA = Object.keys(docA?.shapes ?? {})[0];
      if (firstShapeA) window.__editorPrimary?.select(firstShapeA as never);
    });

    const selA = await page.evaluate(() => window.__editorPrimary?.getSelection() ?? []);
    const selB = await page.evaluate(() => window.__editorSecondary?.getSelection() ?? []);
    expect(selA).toHaveLength(1);
    expect(selB).toHaveLength(0);

    // 2. Document & Transaction Isolation: insert shape in editorPrimary
    await page.evaluate(() => {
      window.__editorPrimary?.execute({
        type: "CreateShape",
        shape: {
          id: "rect-extra" as never,
          kind: "rect",
          parentId: "canvas:root",
          boundingBox: { x: 200, y: 200, width: 50, height: 50 },
          meta: { order: {} },
        },
      });
    });

    const countA = await page.evaluate(
      () => Object.keys(window.__editorPrimary?.getDocument().shapes ?? {}).length,
    );
    const countB = await page.evaluate(
      () => Object.keys(window.__editorSecondary?.getDocument().shapes ?? {}).length,
    );
    expect(countA).toBe(2);
    expect(countB).toBe(1);

    // 3. History Isolation: undo in editorPrimary
    expect(await page.evaluate(() => window.__editorPrimary?.canUndo())).toBe(true);
    expect(await page.evaluate(() => window.__editorSecondary?.canUndo())).toBe(false);

    await page.evaluate(() => {
      window.__editorPrimary?.undo();
    });
    expect(
      await page.evaluate(
        () => Object.keys(window.__editorPrimary?.getDocument().shapes ?? {}).length,
      ),
    ).toBe(1);
    expect(
      await page.evaluate(
        () => Object.keys(window.__editorSecondary?.getDocument().shapes ?? {}).length,
      ),
    ).toBe(1);

    // 4. Camera Isolation: pan and zoom editorPrimary
    await page.evaluate(() => {
      window.__editorPrimary?.setCamera({ x: 100, y: 150, zoom: 2 });
    });
    const camA = await page.evaluate(() => window.__editorPrimary?.getCamera());
    const camB = await page.evaluate(() => window.__editorSecondary?.getCamera());
    expect(camA).toEqual({ x: 100, y: 150, zoom: 2 });
    expect(camB).toEqual({ x: 0, y: 0, zoom: 1 });
  });
});
