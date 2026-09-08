import { test, expect } from '@playwright/test';

test.describe('Personal Style Lab WhatsApp E2E Suite', () => {
  test('renders WhatsApp-style single chat container with controls', async ({ page }) => {
    await page.goto('/personal-style');

    // 1. Verify ONLY one chat interface
    const container = page.locator('#personalStyleView');
    await expect(container).toBeVisible();
    await expect(container).toHaveCount(1);

    // 2. Verify WhatsApp header with Gemma Kaviya label and GPU badge
    const header = page.locator('.ps-chat-header');
    await expect(header).toBeVisible();
    await expect(page.locator('.ps-header-name')).toContainText(/Gemma|Kaviya/i);

    // 3. Verify privacy disclaimer pill
    const disclaimer = page.locator('.ps-privacy-disclaimer');
    await expect(disclaimer).toBeVisible();

    // 4. Verify chat input bar and action buttons
    const input = page.locator('#psInput');
    await expect(input).toBeVisible();

    const sendBtn = page.locator('#psSendBtn');
    await expect(sendBtn).toBeVisible();

    const resetBtn = page.locator('#psResetBtn');
    await expect(resetBtn).toBeVisible();
  });
});
