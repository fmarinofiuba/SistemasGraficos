import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', testMatch: 'sampler.spec.js', workers: 1, timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:10012', viewport: { width: 160, height: 160 }, headless: true,
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run dev -- --port 10012 --strictPort',
    url: 'http://127.0.0.1:10012', reuseExistingServer: false, timeout: 30000,
  },
});
