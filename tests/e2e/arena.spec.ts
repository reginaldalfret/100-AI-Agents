import { test, expect } from '@playwright/test';

test.describe('Model Arena 8-Model GPU Comparison Suite', () => {
  test('renders 8 model cards in grid and validates prompt bar controls', async ({ page }) => {
    await page.goto('/arena');

    // 1. Verify 8 model cards rendered in the grid
    const cards = page.locator('.arena-card');
    await expect(cards).toHaveCount(8);

    // 2. Verify expected models present
    const expectedModels = [
      'nemotron-3-nano',
      'gemma3-1b',
      'local-code-specialist',
      'llama3.2-1b',
      'granite4-1b-h',
      'phi4-mini',
      'smollm2-1.7b',
      'falcon3-1b-instruct'
    ];

    for (const modelId of expectedModels) {
      await expect(page.locator(`.arena-card[data-model-id="${modelId}"]`)).toBeVisible();
    }

    // 3. Verify prompt input and action buttons
    const promptInput = page.locator('#arenaPromptInput');
    await expect(promptInput).toBeVisible();
    await expect(promptInput).toBeEmpty();

    const compareBtn = page.locator('#btnArenaCompare');
    await expect(compareBtn).toBeVisible();

    const clearBtn = page.locator('#btnArenaClear');
    await expect(clearBtn).toBeVisible();

    const stopBtn = page.locator('#btnArenaStopAll');
    await expect(stopBtn).toBeVisible();
    await expect(stopBtn).toBeDisabled();

    // 4. Research Mode toggle shows metrics
    const researchToggle = page.locator('#arenaResearchMode');
    await expect(researchToggle).toBeVisible();
    await researchToggle.check();
    await expect(page.locator('.arena-card-metrics').first()).toHaveClass(/visible/);
  });
});
