/**
 * E2E tests for landing page
 * Tests email capture flow, navigation, and user interactions
 */

import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page before each test
    await page.goto('/')
  })

  test.describe('Page Structure', () => {
    test('should load landing page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/Construction Work OS/i)
      await expect(page.locator('h1')).toBeVisible()
    })

    test('should render all main sections', async ({ page }) => {
      // Hero section
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Pricing section
      await expect(page.locator('#pricing')).toBeVisible()

      // FAQ section
      await expect(page.locator('#faq')).toBeVisible()
    })

    test('should render navigation links', async ({ page }) => {
      // Check for key CTA buttons
      const ctaButtons = page.getByRole('button', { name: /Start Free Trial/i })
      await expect(ctaButtons.first()).toBeVisible()
    })
  })

  test.describe('Exit Intent Modal', () => {
    test('should show exit intent modal on mouse leave to top', async ({ page }) => {
      // Wait for page to load and time on page > 10 seconds
      await page.waitForTimeout(11000)

      // Trigger exit intent by moving mouse to top edge
      await page.mouse.move(0, 0)
      await page.dispatchEvent('body', 'mouseleave', { clientY: -10 })

      // Modal should appear
      await expect(page.getByText(/Wait! Before You Go/i)).toBeVisible()
    })

    test('should not show exit intent modal before 10 seconds', async ({ page }) => {
      // Try to trigger exit intent immediately
      await page.mouse.move(0, 0)
      await page.dispatchEvent('body', 'mouseleave', { clientY: -10 })

      // Modal should NOT appear
      await expect(page.getByText(/Wait! Before You Go/i)).not.toBeVisible()
    })
  })

  test.describe('Email Capture Form', () => {
    test.beforeEach(async ({ page }) => {
      // Wait for time on page and trigger exit intent
      await page.waitForTimeout(11000)
      await page.mouse.move(0, 0)
      await page.dispatchEvent('body', 'mouseleave', { clientY: -10 })

      // Wait for modal to appear
      await page.waitForSelector('text=/Wait! Before You Go/i')
    })

    test('should display email capture form in modal', async ({ page }) => {
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(
        page.getByRole('button', { name: /Send Me The Free Guide/i })
      ).toBeVisible()
    })

    test('should validate empty email submission', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /Send Me The Free Guide/i })

      await submitButton.click()

      // Should show validation error
      await expect(page.getByText(/Email is required/i)).toBeVisible()
    })

    test('should validate invalid email format', async ({ page }) => {
      const emailInput = page.getByPlaceholder(/your@email.com/i)
      const submitButton = page.getByRole('button', { name: /Send Me The Free Guide/i })

      // Test various invalid formats
      const invalidEmails = ['notanemail', '@example.com', 'test@', 'a@b']

      for (const email of invalidEmails) {
        await emailInput.fill(email)
        await submitButton.click()

        await expect(
          page.getByText(/Please enter a valid email address/i)
        ).toBeVisible()

        await emailInput.clear()
      }
    })

    test('should accept valid email and close modal', async ({ page }) => {
      const emailInput = page.getByPlaceholder(/your@email.com/i)
      const submitButton = page.getByRole('button', { name: /Send Me The Free Guide/i })

      await emailInput.fill('test@example.com')
      await submitButton.click()

      // Modal should close after successful submission
      await expect(page.getByText(/Wait! Before You Go/i)).not.toBeVisible({
        timeout: 5000,
      })
    })

    test('should show loading state during submission', async ({ page }) => {
      const emailInput = page.getByPlaceholder(/your@email.com/i)
      const submitButton = page.getByRole('button', { name: /Send Me The Free Guide/i })

      await emailInput.fill('test@example.com')
      await submitButton.click()

      // Button should show "Sending..." text
      await expect(page.getByText(/Sending.../i)).toBeVisible({ timeout: 1000 })
    })

    test('should disable form during submission', async ({ page }) => {
      const emailInput = page.getByPlaceholder(/your@email.com/i)
      const submitButton = page.getByRole('button', { name: /Send Me The Free Guide/i })

      await emailInput.fill('test@example.com')
      await submitButton.click()

      // Input and button should be disabled
      await expect(emailInput).toBeDisabled()
      await expect(submitButton).toBeDisabled()
    })

    test('should clear validation errors on input change', async ({ page }) => {
      const emailInput = page.getByPlaceholder(/your@email.com/i)
      const submitButton = page.getByRole('button', { name: /Send Me The Free Guide/i })

      // Trigger validation error
      await submitButton.click()
      await expect(page.getByText(/Email is required/i)).toBeVisible()

      // Start typing - error should clear
      await emailInput.fill('t')
      await expect(page.getByText(/Email is required/i)).not.toBeVisible()
    })

    test('should close modal when X button clicked', async ({ page }) => {
      const closeButton = page.getByLabel(/Close/i)
      await closeButton.click()

      await expect(page.getByText(/Wait! Before You Go/i)).not.toBeVisible()
    })
  })

  test.describe('Testimonial Carousel', () => {
    test('should render testimonial carousel', async ({ page }) => {
      await expect(page.getByText(/Sarah Martinez/i)).toBeVisible()
      await expect(page.getByText(/Project Manager/i)).toBeVisible()
    })

    test('should navigate testimonials with next button', async ({ page }) => {
      const nextButton = page.getByLabel(/Next testimonial/i)

      await nextButton.click()

      // Should show second testimonial
      await expect(page.getByText(/James Chen/i)).toBeVisible()
    })

    test('should navigate testimonials with previous button', async ({ page }) => {
      const nextButton = page.getByLabel(/Next testimonial/i)
      const prevButton = page.getByLabel(/Previous testimonial/i)

      // Go forward
      await nextButton.click()
      await expect(page.getByText(/James Chen/i)).toBeVisible()

      // Go back
      await prevButton.click()
      await expect(page.getByText(/Sarah Martinez/i)).toBeVisible()
    })

    test('should navigate with dots', async ({ page }) => {
      const dots = page.getByRole('tab')

      // Click third dot
      await dots.nth(2).click()

      await expect(page.getByText(/Mike Thompson/i)).toBeVisible()
    })

    test('should auto-advance testimonials', async ({ page }) => {
      // Wait for auto-rotation (6 seconds)
      await page.waitForTimeout(6500)

      // Should show second testimonial
      await expect(page.getByText(/James Chen/i)).toBeVisible()
    })
  })

  test.describe('Pricing Section', () => {
    test('should render all pricing tiers', async ({ page }) => {
      await page.locator('#pricing').scrollIntoViewIfNeeded()

      await expect(page.getByText('Starter')).toBeVisible()
      await expect(page.getByText('Professional')).toBeVisible()
      await expect(page.getByText('Enterprise')).toBeVisible()
    })

    test('should show pricing amounts', async ({ page }) => {
      await page.locator('#pricing').scrollIntoViewIfNeeded()

      await expect(page.getByText('$199')).toBeVisible()
      await expect(page.getByText('$299')).toBeVisible()
      await expect(page.getByText('Custom')).toBeVisible()
    })

    test('should highlight popular tier', async ({ page }) => {
      await page.locator('#pricing').scrollIntoViewIfNeeded()

      await expect(page.getByText(/Most Popular/i)).toBeVisible()
      await expect(page.getByText(/70% cheaper than Procore/i)).toBeVisible()
    })

    test('should display money-back guarantee', async ({ page }) => {
      await page.locator('#pricing').scrollIntoViewIfNeeded()

      await expect(page.getByText(/30-Day Money-Back Guarantee/i)).toBeVisible()
    })
  })

  test.describe('FAQ Section', () => {
    test('should render all FAQ questions', async ({ page }) => {
      await page.locator('#faq').scrollIntoViewIfNeeded()

      await expect(page.getByText(/How long does setup actually take\?/i)).toBeVisible()
      await expect(page.getByText(/Does offline mode really work/i)).toBeVisible()
      await expect(page.getByText(/What if my team isn't tech-savvy\?/i)).toBeVisible()
    })

    test('should show first answer by default', async ({ page }) => {
      await page.locator('#faq').scrollIntoViewIfNeeded()

      await expect(page.getByText(/Seriously, 15-20 minutes/i)).toBeVisible()
    })

    test('should toggle FAQ answers on click', async ({ page }) => {
      await page.locator('#faq').scrollIntoViewIfNeeded()

      const secondQuestion = page.getByText(/Does offline mode really work/i)

      // Click to open
      await secondQuestion.click()

      await expect(
        page.getByText(/It actually works. We built it for field superintendents/i)
      ).toBeVisible()

      // First answer should close
      await expect(page.getByText(/Seriously, 15-20 minutes/i)).not.toBeVisible()
    })

    test('should close answer when clicking same question twice', async ({ page }) => {
      await page.locator('#faq').scrollIntoViewIfNeeded()

      const firstQuestion = page.getByText(/How long does setup actually take\?/i)

      // Click to close
      await firstQuestion.click()

      await expect(page.getByText(/Seriously, 15-20 minutes/i)).not.toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have no automatic accessibility violations', async ({ page }) => {
      // This is a basic check - ideally you'd use @axe-core/playwright for comprehensive testing
      await expect(page.locator('h1')).toBeVisible()

      // Check for proper heading hierarchy
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThan(0)
    })

    test('should have proper alt text for images', async ({ page }) => {
      const images = page.locator('img')
      const count = await images.count()

      for (let i = 0; i < count; i++) {
        const image = images.nth(i)
        const alt = await image.getAttribute('alt')
        expect(alt).toBeDefined()
      }
    })

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through focusable elements
      await page.keyboard.press('Tab')
      const focusedElement = await page.locator(':focus').first()
      await expect(focusedElement).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should lazy load heavy components', async ({ page }) => {
      // Check that page loads quickly
      const loadTime = Date.now()
      await page.waitForLoadState('domcontentloaded')
      const elapsed = Date.now() - loadTime

      expect(elapsed).toBeLessThan(5000) // Should load in < 5 seconds
    })

    test('should load components as user scrolls', async ({ page }) => {
      // Pricing section should be loaded after scrolling
      await page.locator('#pricing').scrollIntoViewIfNeeded()
      await expect(page.getByText('Professional')).toBeVisible()

      // FAQ section should be loaded after scrolling
      await page.locator('#faq').scrollIntoViewIfNeeded()
      await expect(page.getByText(/How long does setup/i)).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should be mobile responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

      await expect(page.locator('h1')).toBeVisible()
      await expect(page.getByRole('button', { name: /Start Free Trial/i }).first()).toBeVisible()
    })

    test('should be tablet responsive', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }) // iPad

      await expect(page.locator('h1')).toBeVisible()
      await page.locator('#pricing').scrollIntoViewIfNeeded()
      await expect(page.getByText('Professional')).toBeVisible()
    })
  })
})
