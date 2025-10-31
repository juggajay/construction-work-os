/**
 * Common validation schemas using Zod
 * Used across Server Actions to validate inputs and prevent malformed data
 */

import { z } from 'zod'

// ============================================================================
// UUID Validation
// ============================================================================

export const uuidSchema = z.string().uuid({
  message: 'Invalid ID format',
})

export const optionalUuidSchema = z.string().uuid().optional()

// ============================================================================
// Organization & Project Validation
// ============================================================================

export const orgIdSchema = z.object({
  orgId: uuidSchema,
})

export const projectIdSchema = z.object({
  projectId: uuidSchema,
})

export const orgSlugSchema = z.object({
  orgSlug: z
    .string()
    .min(3, 'Organization slug must be at least 3 characters')
    .max(30, 'Organization slug must not exceed 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Organization slug must contain only lowercase letters, numbers, and hyphens'),
})

// ============================================================================
// Pagination Validation
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
})

// ============================================================================
// Date Range Validation
// ============================================================================

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
  }
)

// ============================================================================
// Project Creation/Update Validation
// ============================================================================

const projectBaseSchema = z.object({
  orgId: uuidSchema,
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must not exceed 200 characters')
    .trim(),
  number: z
    .string()
    .max(50, 'Project number must not exceed 50 characters')
    .trim()
    .optional(),
  address: z
    .string()
    .max(500, 'Address must not exceed 500 characters')
    .trim()
    .optional(),
  budget: z
    .number()
    .positive('Budget must be positive')
    .max(1000000000, 'Budget must not exceed 1 billion')
    .optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).default('planning'),
})

export const createProjectSchema = projectBaseSchema.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
)

export const updateProjectSchema = projectBaseSchema.partial().required({ orgId: true }).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
)

// ============================================================================
// Search & Filter Validation
// ============================================================================

export const searchQuerySchema = z.object({
  query: z
    .string()
    .max(200, 'Search query must not exceed 200 characters')
    .trim()
    .optional(),
})

// ============================================================================
// File Upload Validation
// ============================================================================

export const fileUploadSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name must not exceed 255 characters'),
  fileSize: z
    .number()
    .positive('File size must be positive')
    .max(10485760, 'File size must not exceed 10MB'), // 10MB limit
  mimeType: z
    .string()
    .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/, 'Invalid MIME type format'),
})

// ============================================================================
// Amount/Currency Validation
// ============================================================================

export const currencyAmountSchema = z
  .number()
  .min(-1000000000, 'Amount must be greater than -1 billion')
  .max(1000000000, 'Amount must not exceed 1 billion')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places')

// ============================================================================
// Text Content Validation (prevents XSS)
// ============================================================================

export const safeTextSchema = (maxLength: number = 1000) =>
  z
    .string()
    .max(maxLength, `Text must not exceed ${maxLength} characters`)
    .trim()
    .transform((val) => {
      // Remove potential XSS vectors (basic sanitization)
      // For production, consider using a library like DOMPurify
      return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    })

export const safeHtmlSchema = (maxLength: number = 10000) =>
  z
    .string()
    .max(maxLength, `HTML content must not exceed ${maxLength} characters`)
    .trim()
    // Add more sophisticated HTML sanitization in production

// ============================================================================
// Email Validation
// ============================================================================

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim()

// ============================================================================
// Phone Number Validation
// ============================================================================

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164 format required)')
  .optional()

// ============================================================================
// Helper Types
// ============================================================================

export type UuidInput = z.infer<typeof uuidSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type SearchQueryInput = z.infer<typeof searchQuerySchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
