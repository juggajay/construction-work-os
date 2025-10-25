/**
 * Invoice validation schemas
 */

import { z } from 'zod'
import { budgetCategorySchema, amountSchema } from './budget'

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

export const invoiceStatusSchema = z.enum(['pending', 'approved', 'rejected', 'paid'])

export const invoiceDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  })

// ============================================================================
// UPLOAD INVOICE
// ============================================================================

export const uploadInvoiceSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  category: budgetCategorySchema,
  file: z.instanceof(File, { message: 'File is required' })
    .refine((file) => file.size <= 26214400, 'File size must be less than 25MB')
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'].includes(file.type),
      'File must be PDF, JPEG, PNG, or HEIC'
    ),
})

export type UploadInvoiceInput = z.infer<typeof uploadInvoiceSchema>

// ============================================================================
// UPDATE INVOICE
// ============================================================================

export const updateInvoiceSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  vendorName: z.string().max(200).trim().optional(),
  invoiceNumber: z.string().max(100).trim().optional(),
  invoiceDate: invoiceDateSchema.optional(),
  amount: amountSchema.optional(),
  description: z.string().max(1000).trim().optional(),
  category: budgetCategorySchema.optional(),
})

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>

// ============================================================================
// APPROVE INVOICE
// ============================================================================

export const approveInvoiceSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
})

export type ApproveInvoiceInput = z.infer<typeof approveInvoiceSchema>

// ============================================================================
// REJECT INVOICE
// ============================================================================

export const rejectInvoiceSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(500).trim(),
})

export type RejectInvoiceInput = z.infer<typeof rejectInvoiceSchema>

// ============================================================================
// DELETE INVOICE
// ============================================================================

export const deleteInvoiceSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
})

export type DeleteInvoiceInput = z.infer<typeof deleteInvoiceSchema>
