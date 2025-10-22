/**
 * E2E Test: Complete user flow from signup to project creation
 * Tests: Signup → Create Organization → Create Project
 */

import { test, expect } from '@playwright/test'

test.describe('Organization and Project Creation Flow', () => {
  // Generate unique email for each test run
  const timestamp = Date.now()
  const testEmail = `test-e2e-${timestamp}@example.com`
  const testPassword = 'SecureTestPass123!'
  const orgName = `Test E2E Org ${timestamp}`
  const orgSlug = `test-e2e-org-${timestamp}`
  const projectName = `Test E2E Project ${timestamp}`

  test('complete flow: signup → create org → create project', async ({ page }) => {
    // ========================================================================
    // STEP 1: User Signup
    // ========================================================================

    await test.step('User signs up with email and password', async () => {
      await page.goto('/signup')

      // Fill signup form
      await page.fill('[name="email"]', testEmail)
      await page.fill('[name="password"]', testPassword)
      await page.fill('[name="confirmPassword"]', testPassword)

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for confirmation message or redirect
      // Note: In development, email confirmation might be bypassed
      await expect(
        page.locator('text=/check your email|confirm|dashboard/i')
      ).toBeVisible({ timeout: 10000 })
    })

    // ========================================================================
    // STEP 2: Login (if confirmation required)
    // ========================================================================

    await test.step('User logs in if needed', async () => {
      // Check if we're already on dashboard
      const isDashboard = await page.url().includes('/dashboard')

      if (!isDashboard) {
        // Navigate to login
        await page.goto('/login')

        // Fill login form
        await page.fill('[name="email"]', testEmail)
        await page.fill('[name="password"]', testPassword)

        // Submit
        await page.click('button[type="submit"]')

        // Wait for dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 })
      }

      // Verify we're on dashboard
      expect(page.url()).toContain('/dashboard')
    })

    // ========================================================================
    // STEP 3: Create Organization
    // ========================================================================

    await test.step('User creates a new organization', async () => {
      // Look for "Create Organization" or "New Organization" button
      const createOrgButton = page.locator(
        'a[href*="/orgs/new"], button:has-text("Create Organization"), a:has-text("New Organization")'
      ).first()

      await createOrgButton.click()

      // Wait for org creation form
      await expect(page).toHaveURL(/\/orgs\/new/)

      // Fill organization form
      await page.fill('[name="name"]', orgName)
      await page.fill('[name="slug"]', orgSlug)

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for redirect to org page
      await page.waitForURL(`**/${orgSlug}`, { timeout: 10000 })

      // Verify org was created
      expect(page.url()).toContain(orgSlug)
      await expect(
        page.locator(`text=${orgName}`).first()
      ).toBeVisible({ timeout: 5000 })
    })

    // ========================================================================
    // STEP 4: Create Project
    // ========================================================================

    await test.step('User creates a project in the organization', async () => {
      // Look for "Create Project" or "New Project" button/link
      const createProjectButton = page.locator(
        'a[href*="/projects/new"], button:has-text("Create Project"), a:has-text("New Project")'
      ).first()

      await createProjectButton.click()

      // Wait for project creation form
      await expect(page).toHaveURL(/\/projects\/new/)

      // Fill project form
      await page.fill('[name="name"]', projectName)
      await page.fill('[name="number"]', 'P-E2E-001')
      await page.fill('[name="address"]', '123 Test St, Test City, TS 12345')

      // Select status (if dropdown exists)
      const statusSelect = page.locator('[name="status"]')
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption('planning')
      }

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for redirect to project page or projects list
      await page.waitForURL(new RegExp(`${orgSlug}/projects`), { timeout: 10000 })

      // Verify project appears
      await expect(
        page.locator(`text=${projectName}`).first()
      ).toBeVisible({ timeout: 5000 })
    })

    // ========================================================================
    // STEP 5: Verify Navigation
    // ========================================================================

    await test.step('User can navigate between org and project', async () => {
      // Verify sidebar is visible
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible()

      // Verify org name in header or sidebar
      await expect(
        page.locator(`text=${orgName}`).first()
      ).toBeVisible()

      // Click on projects link in sidebar
      await page.click('a:has-text("Projects")')

      // Should see the project in the list
      await expect(page.locator(`text=${projectName}`)).toBeVisible()
    })

    // ========================================================================
    // STEP 6: Logout
    // ========================================================================

    await test.step('User can log out', async () => {
      // Find and click logout button
      const logoutButton = page.locator(
        'button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")'
      ).first()

      await logoutButton.click()

      // Wait for redirect to login page
      await page.waitForURL('**/login', { timeout: 5000 })

      // Verify we're logged out
      expect(page.url()).toContain('/login')
    })
  })

  test('should prevent access to org when not logged in', async ({ page }) => {
    await test.step('Anonymous user is redirected from org page', async () => {
      // Try to access org page directly
      await page.goto(`/${orgSlug}`)

      // Should be redirected to login
      await page.waitForURL('**/login', { timeout: 5000 })

      expect(page.url()).toContain('/login')
    })
  })

  test('should show validation errors for invalid org data', async ({ page, context }) => {
    await test.step('Log in as test user', async () => {
      await page.goto('/login')
      await page.fill('[name="email"]', testEmail)
      await page.fill('[name="password"]', testPassword)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard', { timeout: 10000 })
    })

    await test.step('Validation errors shown for invalid slug', async () => {
      // Go to create org page
      await page.goto('/orgs/new')

      // Try invalid slug (with uppercase)
      await page.fill('[name="name"]', 'Invalid Org')
      await page.fill('[name="slug"]', 'Invalid-Slug-123')

      await page.click('button[type="submit"]')

      // Should show validation error
      await expect(
        page.locator('text=/lowercase|invalid/i').first()
      ).toBeVisible({ timeout: 3000 })
    })

    await test.step('Validation errors shown for duplicate slug', async () => {
      // Try to create org with existing slug
      await page.fill('[name="name"]', 'Another Org')
      await page.fill('[name="slug"]', orgSlug) // Existing slug

      await page.click('button[type="submit"]')

      // Should show error about slug already in use
      await expect(
        page.locator('text=/already|in use|taken/i').first()
      ).toBeVisible({ timeout: 3000 })
    })
  })
})
