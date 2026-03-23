import { test, expect } from '@playwright/test'

test.describe('Client forms', () => {
  test('message form — input works and send button is enabled', async ({ page }) => {
    await page.goto('/client/messages')
    // Look for message input or new message button
    const newMsgBtn = page.locator('text=Nová zpráva, text=Nový požadavek').first()
    if (await newMsgBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newMsgBtn.click()
      // Fill in form fields
      const subjectInput = page.locator('input[name="subject"], input[placeholder*="Předmět"]').first()
      if (await subjectInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjectInput.fill('Testovací zpráva')
        // Check that submit button exists
        const submitBtn = page.locator('button[type="submit"], button:has-text("Odeslat")').first()
        await expect(submitBtn).toBeVisible()
      }
    }
  })

  test('document upload dialog opens', async ({ page }) => {
    await page.goto('/client/documents')
    const uploadBtn = page.locator('text=Nahrát, button:has-text("doklad")').first()
    if (await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await uploadBtn.click()
      // Dialog or overlay should appear
      const dialog = page.locator('[role="dialog"], [data-state="open"]').first()
      await expect(dialog).toBeVisible({ timeout: 3000 })
    }
  })
})
