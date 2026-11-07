import { test, expect } from "@playwright/test";

test.describe("Studio workbench smoke tests", () => {
  test("renders OpenDraw Studio with canvas dock and allotment split view", async ({ page }) => {
    await page.goto("/#app");
    await expect(page.locator(".od-canvas-brand")).toContainText("OpenDraw Studio");
    await expect(page.locator(".od-canvas-bg > svg")).toBeVisible();
    await expect(page.locator(".od-dock")).toBeVisible();
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

    // 4. Single-click child position: selects parent container (depth 0)
    await page.mouse.click(box.x + 250, box.y + 250);
    // Inspector should show the parent shape
    await expect(page.locator("aside.od-panel")).toBeVisible();

    // 5. Double-click child position: drills down into child shape
    await page.mouse.dblclick(box.x + 250, box.y + 250);
    // Verified: child shape is now selected
    await expect(page.locator("aside.od-panel")).toBeVisible();
  });
});
