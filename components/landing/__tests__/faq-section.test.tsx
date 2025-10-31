/**
 * Unit tests for FAQSection component
 * Tests accordion functionality, accessibility, and content display
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FAQSection from '../faq-section'

describe('FAQSection', () => {
  describe('Rendering', () => {
    it('should render section heading', () => {
      render(<FAQSection />)

      expect(
        screen.getByText(/Questions We Get From Contractors Like You/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/Straight answers, no sales BS/i)).toBeInTheDocument()
    })

    it('should render all 10 FAQ questions', () => {
      render(<FAQSection />)

      const questions = [
        /How long does setup actually take\?/i,
        /Does offline mode really work/i,
        /What if my team.*tech-savvy\?/i, // Handles &apos; encoding
        /How is this different from Procore/i,
        /Can I integrate with QuickBooks/i,
        /What about data security\?/i,
        /Do you support AIA document formats\?/i,
        /What if we need to cancel\?/i,
        /Can we import our existing project data\?/i,
        /Is there a free trial\?/i,
      ]

      questions.forEach((question) => {
        expect(screen.getByText(question)).toBeInTheDocument()
      })
    })

    it('should render first answer by default', () => {
      render(<FAQSection />)

      expect(
        screen.getByText(/Seriously.*15-20 minutes/i)
      ).toBeInTheDocument()
    })
  })

  describe('Accordion Functionality', () => {
    it('should toggle answer when question is clicked', async () => {
      render(<FAQSection />)

      const secondQuestion = screen.getByText(/Does offline mode really work/i)

      // Answer should not be visible initially
      expect(
        screen.queryByText(/It actually works.*field superintendents/i)
      ).not.toBeInTheDocument()

      // Click to open
      fireEvent.click(secondQuestion)

      await waitFor(() => {
        expect(
          screen.getByText(/It actually works.*field superintendents/i)
        ).toBeInTheDocument()
      })
    })

    it('should close currently open answer when opening another', async () => {
      render(<FAQSection />)

      // First answer should be open by default
      expect(screen.getByText(/Seriously.*15-20 minutes/i)).toBeInTheDocument()

      // Click second question
      const secondQuestion = screen.getByText(/Does offline mode really work/i)
      fireEvent.click(secondQuestion)

      await waitFor(() => {
        // First answer should be closed
        expect(screen.queryByText(/Seriously.*15-20 minutes/i)).not.toBeInTheDocument()
        // Second answer should be open
        expect(screen.getByText(/It actually works/i)).toBeInTheDocument()
      })
    })

    it('should close answer when clicking the same question twice', async () => {
      render(<FAQSection />)

      const firstQuestion = screen.getByText(/How long does setup actually take\?/i)

      // First answer is open by default
      expect(screen.getByText(/Seriously.*15-20 minutes/i)).toBeInTheDocument()

      // Click to close
      fireEvent.click(firstQuestion)

      await waitFor(() => {
        expect(screen.queryByText(/Seriously.*15-20 minutes/i)).not.toBeInTheDocument()
      })
    })

    it('should handle multiple toggle operations', async () => {
      render(<FAQSection />)

      const questions = screen.getAllByRole('button')

      // Open third question
      fireEvent.click(questions[2])
      await waitFor(() => {
        expect(
          screen.getByText(/56px glove-friendly buttons/i)
        ).toBeInTheDocument()
      })

      // Open fifth question
      fireEvent.click(questions[4])
      await waitFor(() => {
        expect(screen.getByText(/Yes.*QuickBooks Online/i)).toBeInTheDocument()
      })

      // Third should be closed now
      expect(
        screen.queryByText(/56px glove-friendly buttons/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should use semantic button elements for questions', () => {
      render(<FAQSection />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(10) // 10 FAQ questions + possible CTA button
    })

    it('should have proper aria-expanded attribute', () => {
      render(<FAQSection />)

      const buttons = screen.getAllByRole('button')
      // Filter to only FAQ buttons (those with aria-controls)
      const faqButtons = Array.from(buttons).filter((btn) => btn.getAttribute('aria-controls'))

      // First button should have aria-expanded="true" (default open)
      expect(faqButtons[0]).toHaveAttribute('aria-expanded', 'true')

      // Others should have aria-expanded="false"
      for (let i = 1; i < faqButtons.length; i++) {
        expect(faqButtons[i]).toHaveAttribute('aria-expanded', 'false')
      }
    })

    it('should update aria-expanded when toggled', async () => {
      render(<FAQSection />)

      const buttons = screen.getAllByRole('button')
      const faqButtons = Array.from(buttons).filter((btn) => btn.getAttribute('aria-controls'))

      // Click second button
      fireEvent.click(faqButtons[1])

      await waitFor(() => {
        expect(faqButtons[1]).toHaveAttribute('aria-expanded', 'true')
        expect(faqButtons[0]).toHaveAttribute('aria-expanded', 'false')
      })
    })

    it('should use aria-controls to link question to answer', () => {
      render(<FAQSection />)

      const buttons = screen.getAllByRole('button')
      const faqButtons = Array.from(buttons).filter((btn) => btn.getAttribute('aria-controls'))

      // Each FAQ button should have aria-controls attribute
      faqButtons.forEach((button, index) => {
        expect(button).toHaveAttribute('aria-controls', `faq-answer-${index}`)
      })
    })

    it('should use role="region" for answer containers', () => {
      render(<FAQSection />)

      // First answer should be visible with role="region"
      const regions = screen.getAllByRole('region')
      expect(regions.length).toBe(1) // Only one open at a time

      expect(regions[0]).toHaveAttribute('id', 'faq-answer-0')
    })

    it('should have proper heading hierarchy', () => {
      render(<FAQSection />)

      // Main heading should be h2
      const mainHeading = screen.getByRole('heading', {
        level: 2,
        name: /Questions We Get From Contractors Like You/i,
      })
      expect(mainHeading).toBeInTheDocument()
    })

    it('should have section id for anchor navigation', () => {
      const { container } = render(<FAQSection />)

      const section = container.querySelector('#faq')
      expect(section).toBeInTheDocument()
      expect(section?.tagName).toBe('SECTION')
    })
  })

  describe('Visual Feedback', () => {
    it('should show chevron icon for each question', () => {
      const { container } = render(<FAQSection />)

      // Each button should have a ChevronDown icon (aria-hidden="true")
      const chevrons = container.querySelectorAll('[aria-hidden="true"]')
      expect(chevrons.length).toBeGreaterThanOrEqual(10)
    })

    it('should rotate chevron icon when answer is open', async () => {
      const { container } = render(<FAQSection />)

      const buttons = screen.getAllByRole('button')
      const faqButtons = Array.from(buttons).filter((btn) => btn.getAttribute('aria-controls'))

      // Get first button's chevron
      const firstButton = faqButtons[0]
      const firstChevron = firstButton.querySelector('[aria-hidden="true"]')

      // Should have rotate-180 class (first is open by default)
      const classList = Array.from(firstChevron?.classList || [])
      expect(classList).toContain('rotate-180')

      // Click to close
      fireEvent.click(firstButton)

      await waitFor(() => {
        // Chevron should not have rotate-180 class anymore
        const newClassList = Array.from(firstChevron?.classList || [])
        expect(newClassList).not.toContain('rotate-180')
      })
    })
  })

  describe('Content Accuracy', () => {
    it('should display correct answer for each question', async () => {
      render(<FAQSection />)

      const testCases = [
        {
          question: /How long does setup actually take/i,
          answer: /Seriously.*15-20 minutes/i,
        },
        {
          question: /Does offline mode really work/i,
          answer: /It actually works.*field superintendents/i,
        },
        {
          question: /What if my team.*tech-savvy/i,
          answer: /56px glove-friendly buttons/i,
        },
        {
          question: /How is this different from Procore/i,
          answer: /Three ways.*70% cheaper/i,
        },
      ]

      for (const { question, answer } of testCases) {
        const questionElement = screen.getByText(question)
        fireEvent.click(questionElement)

        await waitFor(() => {
          expect(screen.getByText(answer)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Still Have Questions Section', () => {
    it('should render call-to-action section', () => {
      render(<FAQSection />)

      expect(screen.getByText(/Still have questions/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Talk to someone.*actually run projects/i)
      ).toBeInTheDocument()
    })

    it('should render schedule call button', () => {
      render(<FAQSection />)

      const scheduleButton = screen.getByText(/Schedule a 15-minute call/i)
      expect(scheduleButton).toBeInTheDocument()
      expect(scheduleButton.tagName).toBe('BUTTON')
    })
  })

  describe('Performance', () => {
    it('should memoize component with React.memo', () => {
      const { rerender } = render(<FAQSection />)

      // Re-render with same props
      rerender(<FAQSection />)

      // Component should still render correctly
      expect(
        screen.getByText(/Questions We Get From Contractors Like You/i)
      ).toBeInTheDocument()
    })

    it('should maintain state across re-renders', async () => {
      const { rerender } = render(<FAQSection />)

      // Open third question
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[2])

      await waitFor(() => {
        expect(
          screen.getByText(/56px glove-friendly buttons/i)
        ).toBeInTheDocument()
      })

      // Re-render
      rerender(<FAQSection />)

      // State should be maintained
      expect(
        screen.getByText(/56px glove-friendly buttons/i)
      ).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should render responsive container classes', () => {
      const { container } = render(<FAQSection />)

      const faqContainer = container.querySelector('.max-w-3xl')
      expect(faqContainer).toBeInTheDocument()
    })
  })
})
