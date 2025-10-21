import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('displays login page correctly', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('displays sign up page correctly', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
    await expect(page.getByLabel('Full Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible()
  })

  test('navigates between auth pages', async ({ page }) => {
    await page.goto('/login')

    // Go to sign up
    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL('/signup')

    // Go back to login
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/login')

    // Go to magic link
    await page.getByRole('link', { name: 'Sign in with magic link' }).click()
    await expect(page).toHaveURL('/magic-link')

    // Go to forgot password
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL('/forgot-password')
  })

  test('shows validation errors on empty form submission', async ({ page }) => {
    await page.goto('/login')

    // Try to submit without filling fields
    await page.getByRole('button', { name: 'Sign in' }).click()

    // HTML5 validation should prevent submission
    const emailInput = page.getByPlaceholder('you@example.com')
    await expect(emailInput).toBeFocused()
  })
})
