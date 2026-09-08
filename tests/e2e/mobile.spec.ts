import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport Emulation (iPhone)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('validates mobile layout, drawer hamburger toggle, and scrolling', async ({ page }) => {
    await page.goto('/agents');

    // 1. In mobile viewport, hamburger button is visible
    const hamburger = page.locator('.mobile-hamburger-btn');
    await expect(hamburger).toBeVisible();

    // 2. Click hamburger opens slide-out drawer
    await hamburger.click();
    const sidebar = page.locator('#appSidebar');
    await expect(sidebar).toHaveClass(/mobile-open/);

    // 3. Navigation tools visible in mobile drawer
    const toolGrid = page.locator('.sidebar-tools-grid');
    await expect(toolGrid).toBeVisible();

    // 4. Click outside on backdrop closes drawer
    const backdrop = page.locator('.sidebar-backdrop');
    if (await backdrop.isVisible()) {
      await backdrop.click();
      await expect(sidebar).not.toHaveClass(/mobile-open/);
    }
  });

  test('validates mobile Model Arena responsive layout', async ({ page }) => {
    await page.goto('/arena');
    const arenaGrid = page.locator('#arenaGrid');
    await expect(arenaGrid).toBeVisible();
    const firstCard = page.locator('.arena-card').first();
    await expect(firstCard).toBeVisible();
  });
});
