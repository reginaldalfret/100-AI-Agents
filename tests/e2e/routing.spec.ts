import { test, expect } from '@playwright/test';

test.describe('301 Super AI Application Route Navigation', () => {
  test('Root / or /agents loads Agent Workspace', async ({ page }) => {
    await page.goto('/agents');
    await expect(page).toHaveTitle(/301 Super AI/);
    await expect(page.locator('#appSidebar')).toBeVisible();
    await expect(page.locator('.sidebar-tools-grid')).toBeVisible();
  });

  test('/arena loads Model Arena view without nested duplicates', async ({ page }) => {
    await page.goto('/arena');
    await expect(page.locator('.arena-view-container')).toBeVisible();
    await expect(page.locator('#arenaGrid')).toBeVisible();
    const headers = await page.locator('.arena-header').count();
    expect(headers).toBe(1);
  });

  test('/personal-style loads Personal Style Lab', async ({ page }) => {
    await page.goto('/personal-style');
    await expect(page.locator('#personalStyleView')).toBeVisible();
    const chats = await page.locator('#personalStyleView').count();
    expect(chats).toBe(1);
  });

  test('/datasets loads Dataset Intelligence view', async ({ page }) => {
    await page.goto('/datasets');
    await expect(page.locator('#finetuningView')).toBeVisible();
  });

  test('/fine-tuning loads Fine-Tuning Factory view', async ({ page }) => {
    await page.goto('/fine-tuning');
    await expect(page.locator('#finetuningView')).toBeVisible();
  });

  test('/knowledge loads Knowledge View', async ({ page }) => {
    await page.goto('/knowledge');
    await expect(page.locator('#knowledgeView')).toBeVisible();
  });
});
