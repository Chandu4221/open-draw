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
});
