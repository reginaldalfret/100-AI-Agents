import { test, expect } from '@playwright/test';

test('Debug chat streaming in real browser', async ({ page }) => {
  test.setTimeout(60000);
  const consoleLogs: string[] = [];
  const networkEvents: string[] = [];

  page.on('console', msg => {
    const log = `[BROWSER_CONSOLE_${msg.type().toUpperCase()}] ${msg.text()}`;
    console.log(log);
    consoleLogs.push(log);
  });

  page.on('pageerror', err => {
    const log = `[BROWSER_PAGE_ERROR] ${err.message}\n${err.stack}`;
    console.error(log);
    consoleLogs.push(log);
  });

  page.on('requestfailed', req => {
    const log = `[NET_REQ_FAILED] ${req.method()} ${req.url()} — ${req.failure()?.errorText}`;
    console.error(log);
    networkEvents.push(log);
  });

  page.on('response', res => {
    if (res.url().includes('/api/')) {
      const log = `[NET_RES] ${res.status()} ${res.url()}`;
      console.log(log);
      networkEvents.push(log);
    }
  });

  console.log('Navigating to http://127.0.0.1:8300/agents...');
  await page.goto('/agents', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click on agent-001 if not already selected
  const agent001 = page.locator('[data-agent-id="agent-001"], .agent-item:has-text("Writing AI Agent")').first();
  if (await agent001.isVisible()) {
    console.log('Clicking Writing AI Agent...');
    await agent001.click();
    await page.waitForTimeout(500);
  }

  // Type message
  const input = page.locator('#chatInput, textarea[placeholder*="Message"]');
  await expect(input).toBeVisible();
  console.log('Filling input...');
  await input.fill('Write a professional article about renewable energy');

  // Click send button
  const sendBtn = page.locator('#sendBtn');
  console.log('Clicking send...');
  await sendBtn.click();

  // Wait for 25 seconds observing DOM changes
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(1000);
    const messages = await page.locator('.msg-row.ai .msg-text').allInnerTexts();
    const lastMsg = messages[messages.length - 1] || '(no message yet)';
    console.log(`[T+${i + 1}s] Last AI msg text: ${lastMsg.slice(0, 100).replace(/\n/g, ' ')}`);
    if (lastMsg.includes('error') || lastMsg.includes('Ollama is active') || lastMsg.length > 50) {
      break;
    }
  }

  // Take screenshot of the result
  await page.screenshot({ path: 'test-results/chat-ollama-debug.png', fullPage: true });
  console.log('Screenshot saved to test-results/chat-ollama-debug.png');
});
