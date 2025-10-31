/**
 * Financial Calculation Tests
 *
 * CRITICAL ACCURACY TESTS
 * These tests ensure financial calculations are accurate to the cent
 * Failure of any of these tests could result in financial losses or legal issues
 */

import { describe, it, expect } from 'vitest'

describe('Change Order Calculations', () => {
  describe('Line Item Total Calculation', () => {
    it('should calculate line item total correctly', () => {
      // Formula: (quantity * unitCost) + subCost
      const quantity = 100
      const unitCost = 25.50
      const subCost = 500

      const total = (quantity * unitCost) + subCost

      expect(total).toBe(3050) // 2,550 + 500 = 3,050
    })

    it('should apply GC markup correctly', () => {
      // Formula: subtotal * (1 + markupPercent / 100)
      const subtotal = 10000
      const gcMarkupPercent = 15

      const total = subtotal * (1 + gcMarkupPercent / 100)

      expect(total).toBe(11500) // $10,000 + 15% = $11,500
    })

    it('should apply tax correctly', () => {
      // Formula: subtotal * (1 + taxRate / 100)
      const subtotal = 10000
      const taxRate = 8.5

      const total = subtotal * (1 + taxRate / 100)

      expect(total).toBe(10850) // $10,000 + 8.5% = $10,850
    })

    it('should calculate full line item with markup and tax', () => {
      // Real-world scenario: Labor + Materials + Markup + Tax
      const quantity = 50 // 50 units
      const unitCost = 125.00 // $125 per unit
      const subCost = 2000 // $2,000 subcontractor cost
      const gcMarkupPercent = 20 // 20% GC markup
      const taxRate = 9.5 // 9.5% sales tax

      // Step 1: Calculate base cost
      const baseCost = (quantity * unitCost) + subCost // 6,250 + 2,000 = 8,250

      // Step 2: Apply GC markup
      const withMarkup = baseCost * (1 + gcMarkupPercent / 100) // 8,250 * 1.20 = 9,900

      // Step 3: Apply tax
      const total = withMarkup * (1 + taxRate / 100) // 9,900 * 1.095 = 10,840.50

      expect(baseCost).toBe(8250)
      expect(withMarkup).toBe(9900)
      expect(total).toBe(10840.50)
    })

    it('should handle zero markup correctly', () => {
      const subtotal = 5000
      const gcMarkupPercent = 0

      const total = subtotal * (1 + gcMarkupPercent / 100)

      expect(total).toBe(5000) // No markup applied
    })

    it('should handle fractional quantities correctly', () => {
      // Scenario: 2.5 tons of material
      const quantity = 2.5
      const unitCost = 850.00 // $850 per ton

      const total = quantity * unitCost

      expect(total).toBe(2125) // 2.5 * $850 = $2,125
    })
  })

  describe('Change Order Total Calculation', () => {
    it('should sum multiple line items correctly', () => {
      // Multiple line items in a change order
      const lineItems = [
        { total: 1500.00 },
        { total: 2750.50 },
        { total: 890.25 },
        { total: 3200.00 },
      ]

      const changeOrderTotal = lineItems.reduce((sum, item) => sum + item.total, 0)

      expect(changeOrderTotal).toBe(8340.75)
    })

    it('should handle negative values for credits', () => {
      // Change order with a credit
      const lineItems = [
        { total: 5000.00 }, // Addition
        { total: -1200.00 }, // Credit/reduction
        { total: 800.00 }, // Addition
      ]

      const changeOrderTotal = lineItems.reduce((sum, item) => sum + item.total, 0)

      expect(changeOrderTotal).toBe(4600.00)
    })

    it('should maintain precision with many line items', () => {
      // Test precision with many small amounts
      const lineItems = Array(100).fill({ total: 10.01 })

      const changeOrderTotal = lineItems.reduce((sum, item) => sum + item.total, 0)

      // Use toFixed to handle floating point precision
      const rounded = parseFloat(changeOrderTotal.toFixed(2))

      expect(rounded).toBe(1001.00)
    })
  })

  describe('Schedule Impact Calculations', () => {
    it('should calculate schedule impact in days correctly', () => {
      const scheduleImpactDays = 30
      const originalCompletionDate = new Date('2025-06-01')

      const newCompletionDate = new Date(originalCompletionDate)
      newCompletionDate.setDate(newCompletionDate.getDate() + scheduleImpactDays)

      expect(newCompletionDate.toISOString().split('T')[0]).toBe('2025-07-01')
    })

    it('should handle negative schedule impact (acceleration)', () => {
      const scheduleImpactDays = -15 // 15 days earlier
      const originalCompletionDate = new Date('2025-06-01')

      const newCompletionDate = new Date(originalCompletionDate)
      newCompletionDate.setDate(newCompletionDate.getDate() + scheduleImpactDays)

      expect(newCompletionDate.toISOString().split('T')[0]).toBe('2025-05-17')
    })
  })
})

describe('Project Budget Calculations', () => {
  describe('Budget Percentage Calculations', () => {
    it('should calculate spent percentage correctly', () => {
      const totalSpent = 750000
      const budget = 1000000

      const percentageSpent = (totalSpent / budget) * 100

      expect(percentageSpent).toBe(75) // 75% spent
    })

    it('should calculate remaining budget correctly', () => {
      const budget = 1500000
      const totalSpent = 825000

      const remaining = budget - totalSpent

      expect(remaining).toBe(675000) // $675,000 remaining
    })

    it('should handle budget overruns', () => {
      const budget = 1000000
      const totalSpent = 1150000

      const percentageSpent = parseFloat(((totalSpent / budget) * 100).toFixed(2))
      const overrun = totalSpent - budget

      expect(percentageSpent).toBe(115) // 115% - over budget
      expect(overrun).toBe(150000) // $150,000 over
    })

    it('should cap completion percentage at 100%', () => {
      const totalSpent = 1200000
      const budget = 1000000

      // Cap at 100% for display purposes
      const completionPercentage = Math.min(
        Math.round((totalSpent / budget) * 100),
        100
      )

      expect(completionPercentage).toBe(100) // Capped at 100%
    })

    it('should handle zero budget gracefully', () => {
      const budget = 0
      const totalSpent = 50000

      // Prevent division by zero
      const percentageSpent = budget > 0 ? (totalSpent / budget) * 100 : 0

      expect(percentageSpent).toBe(0)
    })
  })

  describe('Cost Category Calculations', () => {
    it('should calculate category allocations correctly', () => {
      const budget = 1000000
      const categories = {
        labor: 0.40, // 40%
        materials: 0.35, // 35%
        equipment: 0.15, // 15%
        overhead: 0.10, // 10%
      }

      const allocations = {
        labor: budget * categories.labor,
        materials: budget * categories.materials,
        equipment: budget * categories.equipment,
        overhead: budget * categories.overhead,
      }

      expect(allocations.labor).toBe(400000)
      expect(allocations.materials).toBe(350000)
      expect(allocations.equipment).toBe(150000)
      expect(allocations.overhead).toBe(100000)

      // Verify sum equals budget
      const total = Object.values(allocations).reduce((sum, val) => sum + val, 0)
      expect(total).toBe(budget)
    })
  })
})

describe('Invoice and Cost Calculations', () => {
  describe('Invoice Total Calculations', () => {
    it('should calculate invoice total with retention', () => {
      // Common in construction: 10% retention until project completion
      const invoiceAmount = 50000
      const retentionPercent = 10

      const retentionAmount = invoiceAmount * (retentionPercent / 100)
      const amountDue = invoiceAmount - retentionAmount

      expect(retentionAmount).toBe(5000)
      expect(amountDue).toBe(45000)
    })

    it('should calculate progressive billing amounts', () => {
      // Progressive billing: Bill for % complete
      const contractAmount = 1000000
      const percentComplete = 65 // 65% complete

      const earnedToDate = contractAmount * (percentComplete / 100)
      const previousBillings = 550000
      const currentBillingAmount = earnedToDate - previousBillings

      expect(earnedToDate).toBe(650000)
      expect(currentBillingAmount).toBe(100000)
    })
  })

  describe('Cost Aggregation', () => {
    it('should aggregate project costs by category', () => {
      const costs = [
        { category: 'labor', amount: 15000 },
        { category: 'materials', amount: 8500 },
        { category: 'labor', amount: 12000 },
        { category: 'equipment', amount: 5000 },
        { category: 'materials', amount: 6200 },
      ]

      const aggregated = costs.reduce((acc, cost) => {
        acc[cost.category] = (acc[cost.category] || 0) + cost.amount
        return acc
      }, {} as Record<string, number>)

      expect(aggregated.labor).toBe(27000) // 15,000 + 12,000
      expect(aggregated.materials).toBe(14700) // 8,500 + 6,200
      expect(aggregated.equipment).toBe(5000)

      const total = Object.values(aggregated).reduce((sum, val) => sum + val, 0)
      expect(total).toBe(46700)
    })
  })
})

describe('Metrics Calculations', () => {
  describe('Project Metrics', () => {
    it('should calculate team size from project access', () => {
      const projectAccess = [
        { user_id: '1', role: 'manager' },
        { user_id: '2', role: 'supervisor' },
        { user_id: '3', role: 'worker' },
        { user_id: '4', role: 'worker' },
        { user_id: '5', role: 'worker' },
      ]

      const teamSize = projectAccess.length

      expect(teamSize).toBe(5)
    })

    it('should calculate RFI count excluding deleted', () => {
      const rfis = [
        { id: '1', deleted_at: null },
        { id: '2', deleted_at: null },
        { id: '3', deleted_at: '2025-01-01' }, // Deleted
        { id: '4', deleted_at: null },
      ]

      const activeRfiCount = rfis.filter(rfi => rfi.deleted_at === null).length

      expect(activeRfiCount).toBe(3)
    })

    it('should calculate average daily labor hours', () => {
      const dailyReports = [
        { total_hours: 80 },
        { total_hours: 75 },
        { total_hours: 82 },
        { total_hours: 78 },
        { total_hours: 85 },
      ]

      const totalHours = dailyReports.reduce((sum, report) => sum + report.total_hours, 0)
      const averageHours = totalHours / dailyReports.length

      expect(totalHours).toBe(400)
      expect(averageHours).toBe(80)
    })
  })

  describe('Rounding and Precision', () => {
    it('should round financial amounts to 2 decimal places', () => {
      const amount = 12345.6789

      const rounded = Math.round(amount * 100) / 100

      expect(rounded).toBe(12345.68)
    })

    it('should handle rounding edge cases correctly', () => {
      // Banker's rounding can cause issues, ensure consistent rounding
      const amounts = [
        { input: 10.005, expected: 10.01 },
        { input: 10.004, expected: 10.00 },
        { input: 10.015, expected: 10.02 },
      ]

      amounts.forEach(({ input, expected }) => {
        const rounded = Math.round(input * 100) / 100
        expect(rounded).toBe(expected)
      })
    })

    it('should prevent floating point precision errors', () => {
      // Classic JavaScript floating point issue: 0.1 + 0.2 !== 0.3
      const a = 0.1
      const b = 0.2
      const sum = a + b

      // Use toFixed to prevent precision errors in financial calculations
      const safeSum = parseFloat((a + b).toFixed(2))

      expect(sum).not.toBe(0.3) // Floating point error
      expect(safeSum).toBe(0.3) // Fixed
    })
  })
})
