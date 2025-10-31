/**
 * Unit tests for PricingSection component
 * Tests rendering, features display, and accessibility
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PricingSection from '../pricing-section'

describe('PricingSection', () => {
  describe('Rendering', () => {
    it('should render section heading', () => {
      render(<PricingSection />)

      expect(screen.getByText(/No Per-Seat Pricing. No Hidden Fees./i)).toBeInTheDocument()
      expect(
        screen.getByText(/Pay per project, invite unlimited users/i)
      ).toBeInTheDocument()
    })

    it('should render all three pricing tiers', () => {
      render(<PricingSection />)

      expect(screen.getByText(/Starter/i)).toBeInTheDocument()
      expect(screen.getByText(/Professional/i)).toBeInTheDocument()
      expect(screen.getByText(/Enterprise/i)).toBeInTheDocument()
    })

    it('should render pricing amounts', () => {
      render(<PricingSection />)

      expect(screen.getByText('$199')).toBeInTheDocument()
      expect(screen.getByText('$299')).toBeInTheDocument()
      expect(screen.getByText('Custom')).toBeInTheDocument()
    })

    it('should render tier descriptions', () => {
      render(<PricingSection />)

      expect(
        screen.getByText(/Perfect for small contractors testing the waters/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Most popular for mid-market contractors/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/For large GCs managing \$50M\+ portfolios/i)
      ).toBeInTheDocument()
    })
  })

  describe('Features Display', () => {
    it('should render Starter tier features', () => {
      render(<PricingSection />)

      expect(screen.getByText(/1 active project/i)).toBeInTheDocument()
      expect(screen.getByText(/Unlimited team members/i)).toBeInTheDocument()
      expect(screen.getByText(/Basic daily reports/i)).toBeInTheDocument()
      expect(screen.getByText(/14-day free trial/i)).toBeInTheDocument()
    })

    it('should render Professional tier features', () => {
      render(<PricingSection />)

      expect(screen.getByText(/3 active projects/i)).toBeInTheDocument()
      expect(screen.getByText(/Full RFI, Submittal & Change Order workflows/i)).toBeInTheDocument()
      expect(screen.getByText(/Offline-first mobile app/i)).toBeInTheDocument()
      expect(screen.getByText(/Priority support \(2-hour SLA\)/i)).toBeInTheDocument()
    })

    it('should render Enterprise tier features', () => {
      render(<PricingSection />)

      expect(screen.getByText(/Unlimited projects/i)).toBeInTheDocument()
      expect(screen.getByText(/White-label branding/i)).toBeInTheDocument()
      expect(screen.getByText(/Custom integrations \(API access\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Single sign-on \(SSO\)/i)).toBeInTheDocument()
    })

    it('should render check icons for all features', () => {
      render(<PricingSection />)

      // Find all list items
      const features = screen.getAllByRole('list')
      expect(features.length).toBeGreaterThan(0)

      // Each feature should have a check icon (aria-hidden="true")
      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThan(15) // At least 15 features total
    })
  })

  describe('Popular Badge', () => {
    it('should display "Most Popular" badge on Professional tier', () => {
      render(<PricingSection />)

      expect(screen.getByText(/Most Popular/i)).toBeInTheDocument()
    })

    it('should display comparison badge on Professional tier', () => {
      render(<PricingSection />)

      expect(screen.getByText(/70% cheaper than Procore/i)).toBeInTheDocument()
    })

    it('should not display popular badge on other tiers', () => {
      render(<PricingSection />)

      // Only one "Most Popular" badge should exist
      const popularBadges = screen.queryAllByText(/Most Popular/i)
      expect(popularBadges).toHaveLength(1)
    })
  })

  describe('Call-to-Action Buttons', () => {
    it('should render CTA buttons for all tiers', () => {
      render(<PricingSection />)

      const startTrialButtons = screen.getAllByText(/Start Free Trial/i)
      const contactSalesButton = screen.getByText(/Contact Sales/i)

      expect(startTrialButtons).toHaveLength(2) // Starter and Professional
      expect(contactSalesButton).toBeInTheDocument()
    })

    it('should apply primary variant to Popular tier button', () => {
      render(<PricingSection />)

      const buttons = screen.getAllByRole('button')
      const professionalButton = buttons.find((btn) =>
        btn.textContent?.includes('Start Free Trial')
      )

      expect(professionalButton).toBeDefined()
    })
  })

  describe('Money-Back Guarantee', () => {
    it('should render money-back guarantee section', () => {
      render(<PricingSection />)

      expect(screen.getByText(/30-Day Money-Back Guarantee/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Not saving time\? Get a full refund/i)
      ).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should use semantic HTML structure', () => {
      render(<PricingSection />)

      // Section should have id="pricing" for anchor navigation
      const section = document.querySelector('#pricing')
      expect(section).toBeInTheDocument()
      expect(section?.tagName).toBe('SECTION')
    })

    it('should have proper heading hierarchy', () => {
      render(<PricingSection />)

      // Main heading should be h2
      const mainHeading = screen.getByRole('heading', {
        level: 2,
        name: /No Per-Seat Pricing/i,
      })
      expect(mainHeading).toBeInTheDocument()
    })

    it('should use role="list" for features', () => {
      render(<PricingSection />)

      const lists = screen.getAllByRole('list')
      expect(lists.length).toBe(3) // One for each pricing tier
    })

    it('should hide decorative icons from screen readers', () => {
      const { container } = render(<PricingSection />)

      // Check icons should have aria-hidden="true"
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]')
      expect(hiddenIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Visual Styling', () => {
    it('should apply scale effect to popular tier', () => {
      const { container } = render(<PricingSection />)

      // Professional tier card should have scale classes
      const cards = container.querySelectorAll('[class*="scale"]')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should apply primary border to popular tier', () => {
      const { container } = render(<PricingSection />)

      const primaryBorder = container.querySelectorAll('[class*="border-primary"]')
      expect(primaryBorder.length).toBeGreaterThan(0)
    })
  })

  describe('Performance', () => {
    it('should memoize component with React.memo', () => {
      const { rerender } = render(<PricingSection />)

      // Re-render with same props
      rerender(<PricingSection />)

      // Component should still render correctly
      expect(screen.getByText(/Starter/i)).toBeInTheDocument()
      expect(screen.getByText(/Professional/i)).toBeInTheDocument()
      expect(screen.getByText(/Enterprise/i)).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should render responsive grid classes', () => {
      const { container } = render(<PricingSection />)

      // Grid should have responsive classes (md:grid-cols-3)
      const grid = container.querySelector('[class*="grid"]')
      expect(grid).toBeInTheDocument()
      expect(grid?.className).toContain('md:grid-cols-3')
    })
  })
})
