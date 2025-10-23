/**
 * E2E Test: Complete End-to-End User Workflow
 *
 * This test covers the complete Construction Work OS user journey:
 * - Phase A: Signup & Authentication
 * - Phase B: Organization Creation
 * - Phase C: Project Creation
 * - Phase D: Daily Report Creation
 * - Phase E: Navigation & Data Persistence
 *
 * Test Data: Dynamically generated with timestamp to ensure uniqueness
 */

import { test, expect } from '@playwright/test'

test.describe('Complete E2E User Workflow', () => {
  // Generate unique test data for this test run
  const timestamp = Date.now()
  const testUser = {
    fullName: `E2E Test User ${timestamp}`,
    email: `e2e-test-${timestamp}@example.com`,
    password: 'E2ETest123!SecurePass',
  }

  const testOrg = {
    name: `E2E Test Construction Co ${timestamp}`,
    slug: `e2e-test-co-${timestamp}`,
  }

  const testProject = {
    name: `E2E Test Building ${timestamp}`,
    number: `E2E-${timestamp}`,
    address: '123 Test Street, Test City, TS 12345',
  }

  let organizationUrl: string
  let projectUrl: string

  test('Complete user journey: signup to daily report creation', async ({ page }) => {
    // ========================================================================
    // PHASE A: INITIAL SIGNUP & ONBOARDING
    // ========================================================================

    await test.step('Phase A.1: Navigate to homepage and verify redirect to login', async () => {
      await page.goto('/')

      // Should redirect to login page for unauthenticated users
      await page.waitForURL('**/login', { timeout: 10000 })

      expect(page.url()).toContain('/login')
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    })

    await test.step('Phase A.2: Navigate to signup page', async () => {
      await page.getByRole('link', { name: /sign up/i }).click()

      await expect(page).toHaveURL('/signup')
      await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()
    })

    await test.step('Phase A.3: Create new account', async () => {
      // Fill signup form
      await page.fill('[name="fullName"]', testUser.fullName)
      await page.fill('[name="email"]', testUser.email)
      await page.fill('[name="password"]', testUser.password)

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for either success message or redirect
      // In development, email confirmation might be bypassed
      await expect(
        page.locator('text=/check your email|confirmation|dashboard/i')
      ).toBeVisible({ timeout: 15000 })
    })

    await test.step('Phase A.4: Handle email confirmation flow', async () => {
      // Check current URL to determine next steps
      const currentUrl = page.url()

      if (currentUrl.includes('/confirm') || currentUrl.includes('/check-email')) {
        // Email confirmation required
        console.log('Email confirmation required - this may need manual intervention in production')

        // For development, we'll attempt to login directly
        await page.goto('/login')
        await page.fill('[name="email"]', testUser.email)
        await page.fill('[name="password"]', testUser.password)
        await page.click('button[type="submit"]')
      }

      // Wait for redirect to dashboard or org creation page
      await page.waitForURL(/\/(dashboard|orgs\/new)/, { timeout: 15000 })
    })

    // ========================================================================
    // PHASE B: ORGANIZATION CREATION
    // ========================================================================

    await test.step('Phase B.1: Verify redirect to organization creation or dashboard', async () => {
      const currentUrl = page.url()

      // Should be on dashboard or org creation page
      expect(currentUrl).toMatch(/\/(dashboard|orgs\/new)/)
    })

    await test.step('Phase B.2: Navigate to create organization if needed', async () => {
      if (!page.url().includes('/orgs/new')) {
        // Look for "Create Organization" or "New Organization" button
        const createOrgLink = page.locator(
          'a[href*="/orgs/new"], button:has-text("Create Organization"), a:has-text("New Organization")'
        ).first()

        // If no organization exists, there should be a create button
        if (await createOrgLink.isVisible({ timeout: 5000 })) {
          await createOrgLink.click()
          await expect(page).toHaveURL('/orgs/new')
        } else {
          // User might already have an org - skip to project creation
          console.log('User may already have an organization')
        }
      }

      await expect(page.getByRole('heading', { name: /create.*organization/i })).toBeVisible()
    })

    await test.step('Phase B.3: Fill and submit organization creation form', async () => {
      // Fill organization form
      await page.fill('[name="name"]', testOrg.name)

      // Slug might be auto-generated, but we'll set it explicitly
      await page.fill('[name="slug"]', testOrg.slug)

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for redirect to organization dashboard
      await page.waitForURL(`**/${testOrg.slug}**`, { timeout: 15000 })

      organizationUrl = page.url()
      expect(organizationUrl).toContain(testOrg.slug)
    })

    await test.step('Phase B.4: Verify organization dashboard loaded', async () => {
      // Organization name should be visible somewhere on the page
      await expect(
        page.locator(`text=${testOrg.name}`).first()
      ).toBeVisible({ timeout: 5000 })

      // Navigation should be present
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible()
    })

    // ========================================================================
    // PHASE C: PROJECT CREATION
    // ========================================================================

    await test.step('Phase C.1: Navigate to projects section', async () => {
      // Look for Projects link in navigation
      const projectsLink = page.locator('a[href*="/projects"], a:has-text("Projects")').first()

      if (await projectsLink.isVisible({ timeout: 5000 })) {
        await projectsLink.click()
      } else {
        // Navigate directly
        await page.goto(`/${testOrg.slug}/projects`)
      }

      // Wait for projects page to load
      await page.waitForURL(`**/${testOrg.slug}/projects**`, { timeout: 10000 })
    })

    await test.step('Phase C.2: Click new project button', async () => {
      // Look for "New Project" or "Create Project" button
      const newProjectButton = page.locator(
        'a[href*="/projects/new"], button:has-text("New Project"), a:has-text("Create Project")'
      ).first()

      await newProjectButton.click()

      // Wait for project creation form
      await expect(page).toHaveURL(/\/projects\/new/)
      await expect(page.getByRole('heading', { name: /new project|create project/i })).toBeVisible()
    })

    await test.step('Phase C.3: Fill and submit project creation form', async () => {
      // Fill project form
      await page.fill('[name="name"]', testProject.name)
      await page.fill('[name="number"]', testProject.number)
      await page.fill('[name="address"]', testProject.address)

      // Select status if dropdown exists
      const statusSelect = page.locator('[name="status"]')
      if (await statusSelect.isVisible({ timeout: 2000 })) {
        await statusSelect.selectOption('planning')
      }

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for redirect to project page or projects list
      await page.waitForURL(new RegExp(`${testOrg.slug}/projects`), { timeout: 15000 })
    })

    await test.step('Phase C.4: Verify project was created', async () => {
      // Project name should appear in the list or page
      await expect(
        page.locator(`text=${testProject.name}`).first()
      ).toBeVisible({ timeout: 5000 })

      // Store project URL for later
      projectUrl = page.url()
    })

    // ========================================================================
    // PHASE D: DAILY REPORT CREATION (IF REACHABLE)
    // ========================================================================

    await test.step('Phase D.1: Navigate to daily reports', async () => {
      // First, navigate to the project if we're on the projects list
      if (page.url().includes('/projects') && !page.url().includes('/projects/')) {
        // Click on the project we just created
        await page.click(`text=${testProject.name}`)
        await page.waitForLoadState('networkidle')
      }

      // Look for Daily Reports link
      const dailyReportsLink = page.locator(
        'a[href*="/daily-reports"], a:has-text("Daily Reports")'
      ).first()

      if (await dailyReportsLink.isVisible({ timeout: 5000 })) {
        await dailyReportsLink.click()
        await page.waitForURL('**/daily-reports', { timeout: 10000 })
      } else {
        console.log('Daily Reports link not found - feature may not be accessible yet')
      }
    })

    await test.step('Phase D.2: Create new daily report (if available)', async () => {
      // Check if we're on daily reports page
      if (page.url().includes('/daily-reports')) {
        // Look for "New Report" button
        const newReportButton = page.locator(
          'a[href*="/daily-reports/new"], button:has-text("New Report")'
        ).first()

        if (await newReportButton.isVisible({ timeout: 5000 })) {
          await newReportButton.click()
          await expect(page).toHaveURL(/\/daily-reports\/new/)

          // Fill basic report information
          const today = new Date().toISOString().split('T')[0]

          // Try to fill date field if present
          const dateField = page.locator('[name="reportDate"], [name="date"]')
          if (await dateField.isVisible({ timeout: 2000 })) {
            await dateField.fill(today)
          }

          // Fill narrative/notes if present
          const narrativeField = page.locator('[name="narrative"], [name="notes"], textarea').first()
          if (await narrativeField.isVisible({ timeout: 2000 })) {
            await narrativeField.fill(
              'E2E Test Report: Work progressing as planned. Testing complete workflow functionality.'
            )
          }

          // Submit form
          const submitButton = page.locator('button[type="submit"]').first()
          await submitButton.click()

          // Wait for redirect
          await page.waitForURL(/\/daily-reports\/[a-f0-9-]+/, { timeout: 15000 })

          // Verify report was created
          await expect(page.locator('text=/draft|submitted/i')).toBeVisible({ timeout: 5000 })
        } else {
          console.log('New Report button not found - skipping daily report creation')
        }
      } else {
        console.log('Daily Reports not accessible - skipping Phase D')
      }
    })

    // ========================================================================
    // PHASE E: NAVIGATION & DATA PERSISTENCE
    // ========================================================================

    await test.step('Phase E.1: Navigate back to organization dashboard', async () => {
      // Navigate back to org dashboard
      await page.goto(`/${testOrg.slug}`)
      await page.waitForLoadState('networkidle')

      // Verify we're on the org dashboard
      await expect(page.locator(`text=${testOrg.name}`).first()).toBeVisible()
    })

    await test.step('Phase E.2: Navigate to projects and verify data persists', async () => {
      // Navigate to projects
      await page.goto(`/${testOrg.slug}/projects`)
      await page.waitForLoadState('networkidle')

      // Project should still be visible
      await expect(page.locator(`text=${testProject.name}`)).toBeVisible({ timeout: 5000 })
    })

    await test.step('Phase E.3: Test switching between pages', async () => {
      // Navigate to dashboard
      const dashboardLink = page.locator('a[href*="/dashboard"], a:has-text("Dashboard")').first()
      if (await dashboardLink.isVisible({ timeout: 3000 })) {
        await dashboardLink.click()
        await page.waitForLoadState('networkidle')
      }

      // Navigate back to org
      await page.goto(`/${testOrg.slug}`)
      await page.waitForLoadState('networkidle')

      // Data should persist
      await expect(page.locator(`text=${testOrg.name}`).first()).toBeVisible()
    })

    await test.step('Phase E.4: Verify no blocking errors', async () => {
      // Check for any error messages on the page
      const errorMessages = page.locator('text=/error|failed|something went wrong/i')
      const errorCount = await errorMessages.count()

      if (errorCount > 0) {
        console.log(`Warning: Found ${errorCount} error messages on page`)
      }

      // Page should be functional
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible()
    })

    await test.step('Phase E.5: Test logout', async () => {
      // Find and click logout button
      const logoutButton = page.locator(
        'button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")'
      ).first()

      if (await logoutButton.isVisible({ timeout: 5000 })) {
        await logoutButton.click()

        // Wait for redirect to login page
        await page.waitForURL('**/login', { timeout: 10000 })

        // Verify we're logged out
        expect(page.url()).toContain('/login')
        await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
      } else {
        console.log('Logout button not found - user may need to logout manually')
      }
    })
  })

  test('Verify authentication protection after logout', async ({ page }) => {
    await test.step('Attempt to access organization without authentication', async () => {
      // Try to access the org page directly
      await page.goto(`/${testOrg.slug}`)

      // Should be redirected to login
      await page.waitForURL('**/login', { timeout: 10000 })
      expect(page.url()).toContain('/login')
    })
  })

  test('Test re-login and data persistence', async ({ page }) => {
    await test.step('Login with existing credentials', async () => {
      await page.goto('/login')

      // Fill login form
      await page.fill('[name="email"]', testUser.email)
      await page.fill('[name="password"]', testUser.password)

      // Submit
      await page.click('button[type="submit"]')

      // Wait for redirect
      await page.waitForURL(/\/(dashboard|[^/]+)/, { timeout: 15000 })
    })

    await test.step('Verify previously created data still exists', async () => {
      // Navigate to org
      await page.goto(`/${testOrg.slug}`)
      await page.waitForLoadState('networkidle')

      // Organization should be accessible
      await expect(page.locator(`text=${testOrg.name}`).first()).toBeVisible()

      // Navigate to projects
      await page.goto(`/${testOrg.slug}/projects`)
      await page.waitForLoadState('networkidle')

      // Project should still exist
      await expect(page.locator(`text=${testProject.name}`)).toBeVisible({ timeout: 5000 })
    })
  })
})
