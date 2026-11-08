import { test, expect } from "@playwright/test";

test.describe("Studio workbench smoke tests", () => {
  test("renders OpenDraw Studio with canvas dock and allotment split view", async ({ page }) => {
    await page.goto("/#app");
    await expect(page.locator(".od-canvas-brand")).toContainText("OpenDraw Studio");
    await expect(page.locator(".od-canvas-bg > svg")).toBeVisible();
    await expect(page.locator(".od-dock")).toBeVisible();
    await expect(page.locator(".od-dock .od-dock-group")).toHaveCount(3);
    await expect(page.locator(".allotment-module")).toBeVisible();
    await expect(page.locator("aside.od-panel")).toBeVisible();
  });

  test("can launch Studio from landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Wireframe Semantics");
    await page.getByRole("button", { name: /give a try/i }).click();
    await expect(page.locator(".od-canvas-brand")).toContainText("OpenDraw Studio");
  });

  test("inserts text shape on canvas click and auto-selects it with select tool active", async ({
    page,
  }) => {
    await page.goto("/#app");
    const svg = page.locator(".od-canvas-bg > svg");
    await expect(svg).toBeVisible();

    // Select the Text tool
    await page.getByLabel("Add text (T)").click();

    // Click canvas to insert text
    const box = await svg.boundingBox();
    expect(box).not.toBeNull();
    const clickX = box!.x + 350;
    const clickY = box!.y + 250;
    await page.mouse.click(clickX, clickY);

    // Verify SVG renders the inserted text with pointer-events none
    const textElement = svg.locator("text", { hasText: "TEXT" });
    await expect(textElement).toBeVisible();
    await expect(textElement).toHaveAttribute("pointer-events", "none");
    await expect(textElement).toHaveAttribute("user-select", "none");

    // Verify tool returned to select tool
    await expect(page.getByLabel("Select tool (V)")).toHaveClass(/od-icon-btn--active/);
  });

  test("double-click drills down selection into child shape inside container", async ({ page }) => {
    await page.goto("/#app");
    const svg = page.locator(".od-canvas-bg > svg");
    await expect(svg).toBeVisible();
    const box = (await svg.boundingBox())!;

    // 1. Draw parent container rectangle (large)
    await page.getByLabel("Draw rectangle (R)").click();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 450, box.y + 450);
    await page.mouse.up();

    // 2. Draw child rectangle inside the parent container
    await page.getByLabel("Draw rectangle (R)").click();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 300);
    await page.mouse.up();

    // 3. Click empty canvas to clear selection
    await page.mouse.click(box.x + 50, box.y + 50);

    // 4. Single-click child position from unselected state: selects parent container
    await page.mouse.click(box.x + 250, box.y + 250);
    await expect(page.locator(".od-meta").filter({ hasText: "ID:" })).toContainText("ID: s-7a01");

    // 5. Double-click child position: drills down into child shape
    await page.mouse.dblclick(box.x + 250, box.y + 250);
    await expect(page.locator(".od-meta").filter({ hasText: "ID:" })).toContainText("ID: s-7a02");

    // 6. Click empty canvas to clear selection
    await page.mouse.click(box.x + 50, box.y + 50);

    // 7. Ctrl-click child position: direct selection into child shape in one click
    await page.keyboard.down("Control");
    await page.mouse.click(box.x + 250, box.y + 250);
    await page.keyboard.up("Control");
    await expect(page.locator(".od-meta").filter({ hasText: "ID:" })).toContainText("ID: s-7a02");
  });

  test("inspector renders collapsible cards and updates geometry with numeric inputs", async ({
    page,
  }) => {
    await page.goto("/#app");
    const svg = page.locator(".od-canvas-bg > svg");
    await expect(svg).toBeVisible();
    const box = (await svg.boundingBox())!;

    // Draw a rectangle
    await page.getByLabel("Draw rectangle (R)").click();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();

    // Verify collapsible cards rendered in inspector
    const cards = page.locator(".od-card");
    await expect(cards.first()).toBeVisible();
    const geomCardHeader = page.locator(".od-card__header", { hasText: "GEOMETRY" });
    await expect(geomCardHeader).toBeVisible();

    // Verify collapsible toggle
    await expect(geomCardHeader).toHaveAttribute("aria-expanded", "true");
    await geomCardHeader.click();
    await expect(geomCardHeader).toHaveAttribute("aria-expanded", "false");
    await geomCardHeader.click();
    await expect(geomCardHeader).toHaveAttribute("aria-expanded", "true");

    // Verify numeric inputs have PX badge and can update width
    const widthInput = page.getByLabel("Width");
    await expect(widthInput).toBeVisible();
    await expect(page.locator(".od-input-badge").first()).toHaveText("PX");

    await widthInput.fill("400");
    await widthInput.press("Enter");

    // Verify SVG rect width was updated
    const rectElement = svg.locator("rect").first();
    await expect(rectElement).toHaveAttribute("width", "400");
  });

  test("can collapse inspector via header close button and reopen via floating button", async ({
    page,
  }) => {
    await page.goto("/#app");
    await expect(page.locator("aside.od-panel")).toBeVisible();

    // Click close button in sidebar header
    await page.getByLabel("Hide Inspector").click();
    await expect(page.locator("aside.od-panel")).toBeHidden();

    // Verify floating toggle button appears
    const reopenBtn = page.getByRole("button", { name: "Show Inspector" });
    await expect(reopenBtn).toBeVisible();

    // Reopen sidebar
    await reopenBtn.click();
    await expect(page.locator("aside.od-panel")).toBeVisible();
  });

  test("shows reopen button when collapsing inspector via sash drag", async ({ page }) => {
    await page.goto("/#app");
    await expect(page.locator("aside.od-panel")).toBeVisible();

    // Find the Allotment sash between panes and drag it towards right edge
    const sash = page.locator(".allotment-module [role='separator']").first();
    if (await sash.isVisible()) {
      const box = (await sash.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      // Drag sash all the way to the right
      await page.mouse.move(box.x + 500, box.y + box.height / 2);
      await page.mouse.up();

      // Floating toggle button appears when collapsed
      const reopenBtn = page.getByRole("button", { name: "Show Inspector" });
      await expect(reopenBtn).toBeVisible();

      // Reopen sidebar
      await reopenBtn.click();
      await expect(page.locator("aside.od-panel")).toBeVisible();
    }
  });
});
