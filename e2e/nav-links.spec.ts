import { test, expect } from '@playwright/test'

// Uses client auth (test-klient/test2026) via client-tests project

test.describe('Accounting nav destinations', () => {
  const links = [
    { name: 'Nástěnka', expected: '/client/dashboard' },
    { name: 'Měsíční uzávěrky', expected: '/client/closures' },
    { name: 'Doklady & Faktury', expected: '/client/documents' },
    { name: 'Kniha jízd', expected: '/client/travel' },
    { name: 'Zprávy', expected: '/client/messages' },
  ]
  for (const link of links) {
    test(`"${link.name}" → ${link.expected}`, async ({ page }) => {
      await page.goto('/client/dashboard')
      await page.waitForLoadState('networkidle')
      // Dismiss cookie banner if present
      const okBtn = page.locator('button').filter({ hasText: /^OK$/ })
      if (await okBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await okBtn.click()
        await page.waitForTimeout(300)
      }
      const navLink = page.locator(`aside a:has-text("${link.name}")`).first()
      if (await navLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await navLink.click()
        await page.waitForURL(`**${link.expected}**`, { timeout: 10000 })
        expect(page.url()).toContain(link.expected)
      }
    })
  }
})

test.describe('Claims nav destinations', () => {
  const links = [
    { name: 'Moje případy', expected: '/client/claims' },
    { name: 'Soubory', expected: '/client/claims/documents' },
    { name: 'Zprávy', expected: '/client/claims/messages' },
    { name: 'Nahlásit událost', expected: '/client/claims/new' },
  ]

  test.beforeEach(async ({ page }) => {
    await page.goto('/client/claims')
    await page.waitForLoadState('networkidle')
    // Dismiss cookie banner if present
    const okBtn = page.locator('button').filter({ hasText: /^OK$/ })
    if (await okBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await okBtn.click()
      await page.waitForTimeout(300)
    }
  })

  for (const link of links) {
    test(`"${link.name}" → ${link.expected}`, async ({ page }) => {
      const navLink = page.locator(`aside a:has-text("${link.name}")`).first()
      if (await navLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await navLink.click()
        await page.waitForURL(`**${link.expected}**`, { timeout: 10000 })
        expect(page.url()).toContain(link.expected)
        // Must NOT be on accounting page
        const h = await page.locator('h1, h2').first().textContent({ timeout: 5000 }).catch(() => '')
        expect(h).not.toContain('Doklady & Faktury')
      }
    })
  }
})
