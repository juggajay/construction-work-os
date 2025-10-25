/**
 * Cost validation schemas
 */

import { z } from 'zod'
import { budgetCategorySchema, amountSchema } from './budget'

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

export const costDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  })

export const attachmentSchema = z.object({
  file_path: z.string(),
  file_name: z.string(),
})

// ============================================================================
// CREATE COST
// ============================================================================

export const createCostSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  category: budgetCategorySchema,
  amount: amountSchema.refine((val) => val > 0, {
    message: 'Amount must be greater than 0',
  }),
  description: z.string().min(5, 'Description must be at least 5 characters').max(1000).trim(),
  costDate: costDateSchema,
  attachments: z.array(z.instanceof(File)).max(5, 'Maximum 5 attachments allowed').optional(),
})

export type CreateCostInput = z.infer<typeof createCostSchema>

// ============================================================================
// UPDATE COST
// ============================================================================

export const updateCostSchema = z.object({
  costId: z.string().uuid('Invalid cost ID'),
  category: budgetCategorySchema.optional(),
  amount: amountSchema.refine((val) => val > 0, {
    message: 'Amount must be greater than 0',
  }).optional(),
  description: z.string().min(5, 'Description must be at least 5 characters').max(1000).trim().optional(),
  costDate: costDateSchema.optional(),
})

export type UpdateCostInput = z.infer<typeof updateCostSchema>

// ============================================================================
// DELETE COST
// ============================================================================

export const deleteCostSchema = z.object({
  costId: z.string().uuid('Invalid cost ID'),
})

export type DeleteCostInput = z.infer<typeof deleteCostSchema>
