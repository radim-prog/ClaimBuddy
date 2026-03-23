import { test, expect } from '@playwright/test'

test.describe('Encoding', () => {
  test('x-user-name header handles diacritics', async ({ request }) => {
    // Uses storageState from auth.setup — already authenticated
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
    // Uses storageState from auth.setup — already authenticated
    const meRes = await request.get('/api/auth/me')
    expect(meRes.status()).not.toBe(500)
  })
})
