/**
 * Project validation schemas
 */

import { z } from 'zod'

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

export const projectStatusSchema = z.enum(['planning', 'active', 'on_hold', 'completed', 'archived'])

export const projectRoleSchema = z.enum(['manager', 'supervisor', 'viewer'])

export const budgetSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Budget must be a valid decimal number (e.g., 1000.00)')
  .refine((val) => parseFloat(val) >= 0, {
    message: 'Budget must be a positive number',
  })
  .optional()
  .nullable()

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  })

// ============================================================================
// CREATE PROJECT
// ============================================================================

export const createProjectSchema = z
  .object({
    orgId: z.string().uuid('Invalid organization ID'),
    name: z.string().min(2, 'Project name must be at least 2 characters').max(200).trim(),
    number: z.string().max(50).trim().optional().nullable(),
    address: z.string().max(500).trim().optional().nullable(),
    status: projectStatusSchema.default('planning'),
    budget: budgetSchema,
    startDate: dateSchema.optional().nullable(),
    endDate: dateSchema.optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate)
      }
      return true
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )

export type CreateProjectInput = z.infer<typeof createProjectSchema>

// ============================================================================
// UPDATE PROJECT
// ============================================================================

export const updateProjectSchema = z
  .object({
    name: z.string().min(2, 'Project name must be at least 2 characters').max(200).trim().optional(),
    number: z.string().max(50).trim().optional().nullable(),
    address: z.string().max(500).trim().optional().nullable(),
    status: projectStatusSchema.optional(),
    budget: budgetSchema,
    startDate: dateSchema.optional().nullable(),
    endDate: dateSchema.optional().nullable(),
    settings: z.record(z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate)
      }
      return true
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

// ============================================================================
// GRANT PROJECT ACCESS
// ============================================================================

export const grantProjectAccessSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  userId: z.string().uuid('Invalid user ID'),
  role: projectRoleSchema,
  trade: z.string().max(100).trim().optional().nullable(),
})

export type GrantProjectAccessInput = z.infer<typeof grantProjectAccessSchema>

// ============================================================================
// UPDATE PROJECT ACCESS
// ============================================================================

export const updateProjectAccessSchema = z.object({
  accessId: z.string().uuid('Invalid access ID'),
  role: projectRoleSchema.optional(),
  trade: z.string().max(100).trim().optional().nullable(),
})

export type UpdateProjectAccessInput = z.infer<typeof updateProjectAccessSchema>

// ============================================================================
// REVOKE PROJECT ACCESS
// ============================================================================

export const revokeProjectAccessSchema = z.object({
  accessId: z.string().uuid('Invalid access ID'),
})

export type RevokeProjectAccessInput = z.infer<typeof revokeProjectAccessSchema>

// ============================================================================
// DELETE PROJECT
// ============================================================================

export const deleteProjectSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
})

export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>
