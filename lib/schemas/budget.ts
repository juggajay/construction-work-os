/**
 * Budget validation schemas
 */

import { z } from 'zod'

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

export const budgetCategorySchema = z.enum(['labor', 'materials', 'equipment', 'other'])

export const amountSchema = z
  .number()
  .nonnegative('Amount must be a positive number')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places')

// ============================================================================
// BUDGET ALLOCATION
// ============================================================================

export const budgetAllocationSchema = z.object({
  category: budgetCategorySchema,
  amount: amountSchema,
})

export type BudgetAllocation = z.infer<typeof budgetAllocationSchema>

// ============================================================================
// UPDATE BUDGET ALLOCATION
// ============================================================================

export const updateBudgetAllocationSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  allocations: z.array(budgetAllocationSchema).min(1, 'At least one budget allocation is required'),
  reason: z.string().max(500).trim().optional(),
})

export type UpdateBudgetAllocationInput = z.infer<typeof updateBudgetAllocationSchema>

// ============================================================================
// GET BUDGET BREAKDOWN
// ============================================================================

export const getBudgetBreakdownSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
})

export type GetBudgetBreakdownInput = z.infer<typeof getBudgetBreakdownSchema>
