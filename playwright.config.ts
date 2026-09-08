import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false, // Maintain sequential execution to prevent VRAM competition
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Strict single worker for GPU safety
  reporter: [['list']],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:8300',
    channel: 'chrome', // Use pre-installed system Google Chrome (Air-gapped compatible)
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        channel: 'chrome',
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: 'mobile-chrome',
      use: {
        channel: 'chrome',
        ...devices['iPhone 13']
      }
    }
  ]
});
