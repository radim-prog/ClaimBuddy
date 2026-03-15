import { test as setup } from '@playwright/test'

const AUTH_FILE = 'e2e/.auth/user.json'

setup('authenticate', async ({ page, request }) => {
  // Login via API to get auth cookie
  const response = await request.post('/api/auth/login', {
    data: { username: 'radim', password: 'admin123' },
  })

  // Extract Set-Cookie from response and add to context
  const setCookie = response.headers()['set-cookie']
  if (setCookie) {
    // Parse auth_token from Set-Cookie header
    const match = setCookie.match(/auth_token=([^;]+)/)
    if (match) {
      await page.context().addCookies([{
        name: 'auth_token',
        value: match[1],
        domain: new URL('https://app.zajcon.cz').hostname,
        path: '/',
      }])
    }
  }

  // Verify we can access authenticated page
  await page.goto('/accountant/dashboard')
  await page.waitForTimeout(3000)

  await page.context().storageState({ path: AUTH_FILE })
})
