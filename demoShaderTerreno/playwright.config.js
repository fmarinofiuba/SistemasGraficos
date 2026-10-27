import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  workers: 1,
  timeout: 120000,
  expect: { timeout: 20000 },
  use: {
    baseURL: 'http://127.0.0.1:10002',
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:10002',
    reuseExistingServer: !process.env.CI,
  },
});
