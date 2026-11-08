import { defineConfig, devices } from "@playwright/test";

// Runs against a live server: BASE_URL (default http://localhost:3000).
// Set TEST_EVENT_SLUG to an active event to exercise the registration flow.
export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    // Hebrew is the default locale of the app; browsers announce it via Accept-Language.
    locale: "he-IL",
    trace: "off",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  // Both projects run on Chromium so one installed browser covers desktop and phone emulation.
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], browserName: "chromium" } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium", defaultBrowserType: "chromium" } },
  ],
});
