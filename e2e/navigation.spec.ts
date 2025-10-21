import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('auth pages are accessible without authentication', async ({ page }) => {
    const authPages = [
      '/login',
      '/signup',
      '/magic-link',
      '/forgot-password',
    ]

    for (const path of authPages) {
      await page.goto(path)
      await expect(page).toHaveURL(path)
    }
  })

  test('protected pages redirect to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('root path redirects to login for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })
})
