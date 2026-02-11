import { test, expect } from '@playwright/test'

test.describe('API Health Checks', () => {
  test('health endpoint returns healthy', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.checks.supabase.status).toBe('ok')
  })

  test('auth/me returns 401 without cookie', async ({ request }) => {
    const response = await request.get('/api/auth/me')
    expect(response.status()).toBe(401)
  })

  test('matrix API responds', async ({ request }) => {
    const response = await request.get('/api/accountant/matrix')
    // May return 401 or 200 depending on auth
    expect([200, 401]).toContain(response.status())
  })

  test('companies API responds', async ({ request }) => {
    const response = await request.get('/api/accountant/companies')
    expect([200, 401]).toContain(response.status())
  })

  test('closures API responds', async ({ request }) => {
    const response = await request.get('/api/accountant/closures')
    expect([200, 401]).toContain(response.status())
  })

  test('tasks API responds', async ({ request }) => {
    const response = await request.get('/api/tasks')
    expect([200, 401]).toContain(response.status())
  })
})
