import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Network tests should run sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Single worker for network tests
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: "network-resilience",
      testDir: "./e2e/network",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "baileys-integration",
      testDir: "./e2e/baileys",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "php artisan serve",
      url: "http://localhost:8000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        APP_ENV: "testing",
      },
    },
  ],
  timeout: 300_000, // 5 minutes for network tests
});
