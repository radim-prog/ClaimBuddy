import { test, expect } from '@playwright/test'
import { TEST_USER } from './test-config'

test.describe('Encoding', () => {
  test('x-user-name header handles diacritics', async ({ request }) => {
    // Login first to get auth cookie
    const loginRes = await request.post('/api/auth/login', {
      data: { username: TEST_USER.username, password: TEST_USER.password },
    })
    expect(loginRes.ok()).toBeTruthy()

    // Make authenticated request — server should decode the name correctly
    const companiesRes = await request.get('/api/client/companies')
    expect(companiesRes.ok()).toBeTruthy()
    const data = await companiesRes.json()
    // userName should not contain URL-encoded sequences in the response
    if (data.userName) {
      expect(data.userName).not.toContain('%')
      // Should contain Czech characters if the user has them
      expect(data.userName).toMatch(/^[\w\s\u00C0-\u024F]+$/)
    }
  })

  test('middleware does not crash on non-ASCII names', async ({ request }) => {
    // Login should work fine even though the name contains Czech chars
    const loginRes = await request.post('/api/auth/login', {
      data: { username: TEST_USER.username, password: TEST_USER.password },
    })
    expect(loginRes.ok()).toBeTruthy()
    expect(loginRes.status()).toBe(200)

    // Subsequent API calls should not 500
    const meRes = await request.get('/api/auth/me')
    expect(meRes.status()).not.toBe(500)
  })
})
