import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  outputDir: 'test-results',
  reporter: process.env.CI ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]] : 'list',
  use: {
    colorScheme: 'light',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off'
  },
  webServer: [
    {
      command: 'npm run preview -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173/ko/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    {
      command: 'npx vite --config vite.visual.config.ts',
      url: 'http://127.0.0.1:4175/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ],
  projects: [
    {
      name: 'app-chromium',
      testMatch: 'e2e/**/*.pw.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4173' }
    },
    {
      name: 'visual-chromium',
      testMatch: 'visual/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4175' }
    }
  ]
});
