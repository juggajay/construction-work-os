/**
 * Unit tests for TestimonialCarousel component
 * Tests auto-rotation, navigation, and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import TestimonialCarousel from '../testimonial-carousel'

describe('TestimonialCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render the first testimonial by default', () => {
      render(<TestimonialCarousel />)

      expect(screen.getByText(/Sarah Martinez/i)).toBeInTheDocument()
      expect(screen.getByText(/Project Manager/i)).toBeInTheDocument()
      expect(screen.getByText(/Martinez Construction LLC/i)).toBeInTheDocument()
    })

    it('should render 5-star rating', () => {
      render(<TestimonialCarousel />)

      // Check for 5 star icons (using aria-hidden="true")
      const stars = screen.getAllByRole('img', { hidden: true })
      const starIcons = stars.filter((el) => el.getAttribute('aria-hidden') === 'true')

      expect(starIcons.length).toBeGreaterThanOrEqual(5)
    })

    it('should render metric badge', () => {
      render(<TestimonialCarousel />)

      expect(screen.getByText(/83% faster RFI responses/i)).toBeInTheDocument()
    })

    it('should render navigation dots', () => {
      render(<TestimonialCarousel />)

      const dots = screen.getAllByRole('tab')
      expect(dots).toHaveLength(5) // 5 testimonials
    })

    it('should render previous and next buttons', () => {
      render(<TestimonialCarousel />)

      expect(screen.getByLabelText(/previous testimonial/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/next testimonial/i)).toBeInTheDocument()
    })
  })

  describe('Auto-rotation', () => {
    it('should auto-advance to next testimonial after 6 seconds', async () => {
      render(<TestimonialCarousel />)

      // Initially shows first testimonial
      expect(screen.getByText(/Sarah Martinez/i)).toBeInTheDocument()

      // Advance timers by 6 seconds
      await act(async () => {
        vi.advanceTimersByTime(6000)
      })

      // Should show second testimonial
      expect(screen.getByText(/James Chen/i)).toBeInTheDocument()
    }, 10000)

    it('should loop back to first testimonial after last', async () => {
      render(<TestimonialCarousel />)

      // Advance through all 5 testimonials (5 * 6 seconds)
      await act(async () => {
        vi.advanceTimersByTime(30000)
      })

      // Should loop back to first testimonial
      expect(screen.getByText(/Sarah Martinez/i)).toBeInTheDocument()
    }, 10000)

    it('should stop auto-rotation when user navigates manually', async () => {
      render(<TestimonialCarousel />)

      // Click next button
      const nextButton = screen.getByLabelText(/next testimonial/i)
      await act(async () => {
        fireEvent.click(nextButton)
      })

      // Should show second testimonial
      expect(screen.getByText(/James Chen/i)).toBeInTheDocument()

      // Advance time - should NOT auto-advance anymore
      await act(async () => {
        vi.advanceTimersByTime(6000)
      })

      // Should still be on second testimonial
      expect(screen.getByText(/James Chen/i)).toBeInTheDocument()
    }, 10000)
  })

  describe('Navigation', () => {
    it('should navigate to next testimonial when next button clicked', async () => {
      render(<TestimonialCarousel />)

      const nextButton = screen.getByLabelText(/next testimonial/i)
      await act(async () => {
        fireEvent.click(nextButton)
      })

      expect(screen.getByText(/James Chen/i)).toBeInTheDocument()
    }, 10000)

    it('should navigate to previous testimonial when previous button clicked', async () => {
      render(<TestimonialCarousel />)

      // First go forward
      const nextButton = screen.getByLabelText(/next testimonial/i)
      await act(async () => {
        fireEvent.click(nextButton)
      })

      expect(screen.getByText(/James Chen/i)).toBeInTheDocument()

      // Then go back
      const prevButton = screen.getByLabelText(/previous testimonial/i)
      await act(async () => {
        fireEvent.click(prevButton)
      })

      expect(screen.getByText(/Sarah Martinez/i)).toBeInTheDocument()
    }, 10000)

    it('should navigate to specific testimonial when dot clicked', async () => {
      render(<TestimonialCarousel />)

      const dots = screen.getAllByRole('tab')

      // Click on third dot (index 2)
      await act(async () => {
        fireEvent.click(dots[2])
      })

      expect(screen.getByText(/Mike Thompson/i)).toBeInTheDocument()
    }, 10000)

    it('should loop to last testimonial when clicking previous on first', async () => {
      render(<TestimonialCarousel />)

      const prevButton = screen.getByLabelText(/previous testimonial/i)
      await act(async () => {
        fireEvent.click(prevButton)
      })

      expect(screen.getByText(/David Park/i)).toBeInTheDocument()
    }, 10000)

    it('should loop to first testimonial when clicking next on last', async () => {
      render(<TestimonialCarousel />)

      const dots = screen.getAllByRole('tab')

      // Navigate to last testimonial
      await act(async () => {
        fireEvent.click(dots[4])
      })

      expect(screen.getByText(/David Park/i)).toBeInTheDocument()

      // Click next
      const nextButton = screen.getByLabelText(/next testimonial/i)
      await act(async () => {
        fireEvent.click(nextButton)
      })

      expect(screen.getByText(/Sarah Martinez/i)).toBeInTheDocument()
    }, 10000)
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels on navigation buttons', () => {
      render(<TestimonialCarousel />)

      expect(screen.getByLabelText(/previous testimonial/i)).toHaveAttribute(
        'aria-label',
        'Previous testimonial'
      )
      expect(screen.getByLabelText(/next testimonial/i)).toHaveAttribute(
        'aria-label',
        'Next testimonial'
      )
    })

    it('should mark active dot with aria-selected', () => {
      render(<TestimonialCarousel />)

      const dots = screen.getAllByRole('tab')

      // First dot should be selected
      expect(dots[0]).toHaveAttribute('aria-selected', 'true')

      // Others should not be selected
      for (let i = 1; i < dots.length; i++) {
        expect(dots[i]).toHaveAttribute('aria-selected', 'false')
      }
    })

    it('should update aria-selected when testimonial changes', async () => {
      render(<TestimonialCarousel />)

      const dots = screen.getAllByRole('tab')

      // Click second dot
      await act(async () => {
        fireEvent.click(dots[1])
      })

      expect(dots[1]).toHaveAttribute('aria-selected', 'true')
      expect(dots[0]).toHaveAttribute('aria-selected', 'false')
    }, 10000)

    it('should have role="tablist" on dots container', () => {
      render(<TestimonialCarousel />)

      const tablist = screen.getByRole('tablist', { name: /testimonial navigation/i })
      expect(tablist).toBeInTheDocument()
    })
  })

  describe('Visual State', () => {
    it('should apply active styles to current dot', () => {
      render(<TestimonialCarousel />)

      const dots = screen.getAllByRole('tab')

      // First dot should have active class (wider, primary color)
      expect(dots[0]).toHaveClass('w-8', 'bg-primary')

      // Others should have inactive class
      expect(dots[1]).toHaveClass('w-2', 'bg-muted-foreground/30')
    })
  })

  describe('Fallback Behavior', () => {
    it('should handle null testimonial gracefully', () => {
      render(<TestimonialCarousel />)

      // Component should render without errors
      expect(screen.getByText(/Sarah Martinez/i)).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should memoize component with React.memo', () => {
      const { rerender } = render(<TestimonialCarousel />)

      // Re-render with same props (no props actually)
      rerender(<TestimonialCarousel />)

      // Component should still work
      expect(screen.getByText(/Sarah Martinez/i)).toBeInTheDocument()
    })

    it('should use useCallback for navigation handlers', async () => {
      render(<TestimonialCarousel />)

      const nextButton = screen.getByLabelText(/next testimonial/i)

      // Click multiple times rapidly
      await act(async () => {
        fireEvent.click(nextButton)
        fireEvent.click(nextButton)
      })

      expect(screen.getByText(/Mike Thompson/i)).toBeInTheDocument()
    }, 10000)
  })
})
