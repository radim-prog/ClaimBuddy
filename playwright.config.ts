import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'https://app.zajcon.cz',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { browserName: 'chromium' },
    },
    {
      name: 'setup-client',
      testMatch: /auth-client\.setup\.ts/,
      use: { browserName: 'chromium' },
    },
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth.*\.setup\.ts/,
    },
    {
      name: 'client-tests',
      use: {
        browserName: 'chromium',
        storageState: 'e2e/.auth/client.json',
      },
      dependencies: ['setup-client'],
      testMatch: /client-walkthrough\.spec\.ts/,
    },
  ],
})
