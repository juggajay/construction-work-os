/**
 * Change Order validation schemas
 */

import { z } from 'zod'

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

export const changeOrderStatusSchema = z.enum([
  'contemplated',
  'potential',
  'proposed',
  'approved',
  'rejected',
  'cancelled',
  'invoiced',
])

export const changeOrderTypeSchema = z.enum([
  'scope_change',
  'design_change',
  'site_condition',
  'owner_requested',
  'time_extension',
  'cost_only',
  'schedule_only',
])

export const originatingEventTypeSchema = z.enum([
  'rfi',
  'submittal',
  'daily_report',
  'manual',
])

export const approvalStageSchema = z.enum([
  'gc_review',
  'owner_approval',
  'architect_approval',
])

export const approvalStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'skipped',
])

export const attachmentCategorySchema = z.enum([
  'quote',
  'drawing',
  'photo',
  'contract',
  'other',
])

// ============================================================================
// CREATE CHANGE ORDER
// ============================================================================

export const createChangeOrderSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(500)
    .trim(),
  description: z.string().trim().optional().nullable(),
  type: changeOrderTypeSchema,
  status: changeOrderStatusSchema.default('contemplated'),
  originatingEventType: originatingEventTypeSchema.optional().nullable(),
  originatingEventId: z.string().uuid().optional().nullable(),
  costImpact: z.number().optional().default(0),
  scheduleImpactDays: z.number().int().optional().default(0),
  newCompletionDate: z.string().datetime().optional().nullable(),
})

export type CreateChangeOrderInput = z.infer<typeof createChangeOrderSchema>

// ============================================================================
// UPDATE CHANGE ORDER
// ============================================================================

export const updateChangeOrderSchema = z.object({
  changeOrderId: z.string().uuid('Invalid change order ID'),
  title: z.string().min(3).max(500).trim().optional(),
  description: z.string().trim().optional().nullable(),
  type: changeOrderTypeSchema.optional(),
  scheduleImpactDays: z.number().int().optional(),
  newCompletionDate: z.string().datetime().optional().nullable(),
})

export type UpdateChangeOrderInput = z.infer<typeof updateChangeOrderSchema>

// ============================================================================
// DELETE CHANGE ORDER
// ============================================================================

export const deleteChangeOrderSchema = z.object({
  changeOrderId: z.string().uuid('Invalid change order ID'),
})

export type DeleteChangeOrderInput = z.infer<typeof deleteChangeOrderSchema>

// ============================================================================
// CANCEL CHANGE ORDER
// ============================================================================

export const cancelChangeOrderSchema = z.object({
  changeOrderId: z.string().uuid('Invalid change order ID'),
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters').trim(),
})

export type CancelChangeOrderInput = z.infer<typeof cancelChangeOrderSchema>

// ============================================================================
// LINE ITEMS
// ============================================================================

export const addLineItemSchema = z.object({
  changeOrderId: z.string().uuid('Invalid change order ID'),
  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(1000)
    .trim(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().max(50).trim().default('ea'),
  unitCost: z.number().min(0, 'Unit cost must be non-negative').optional(),
  subCost: z.number().min(0, 'Sub cost must be non-negative').optional(),
  gcMarkupPercent: z
    .number()
    .min(0)
    .max(100, 'Markup percentage must be between 0 and 100')
    .default(0),
  taxRate: z
    .number()
    .min(0)
    .max(100, 'Tax rate must be between 0 and 100')
    .default(0),
  csiSection: z.string().max(20).trim().optional().nullable(),
})

export type AddLineItemInput = z.infer<typeof addLineItemSchema>

export const updateLineItemSchema = z.object({
  lineItemId: z.string().uuid('Invalid line item ID'),
  description: z.string().min(3).max(1000).trim().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().max(50).trim().optional(),
  unitCost: z.number().min(0).optional(),
  subCost: z.number().min(0).optional(),
  gcMarkupPercent: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  csiSection: z.string().max(20).trim().optional().nullable(),
})

export type UpdateLineItemInput = z.infer<typeof updateLineItemSchema>

export const deleteLineItemSchema = z.object({
  lineItemId: z.string().uuid('Invalid line item ID'),
})

export type DeleteLineItemInput = z.infer<typeof deleteLineItemSchema>

export const reorderLineItemsSchema = z.object({
  changeOrderId: z.string().uuid('Invalid change order ID'),
  lineItemIds: z.array(z.string().uuid()).min(1, 'At least one line item required'),
})

export type ReorderLineItemsInput = z.infer<typeof reorderLineItemsSchema>

// ============================================================================
// APPROVALS
// ============================================================================

export const submitForApprovalSchema = z.object({
  changeOrderId: z.string().uuid('Invalid change order ID'),
})

export type SubmitForApprovalInput = z.infer<typeof submitForApprovalSchema>

export const approveChangeOrderSchema = z.object({
  approvalId: z.string().uuid('Invalid approval ID'),
  notes: z.string().max(2000).trim().optional().nullable(),
})

export type ApproveChangeOrderInput = z.infer<typeof approveChangeOrderSchema>

export const rejectChangeOrderSchema = z.object({
  approvalId: z.string().uuid('Invalid approval ID'),
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(2000).trim(),
})

export type RejectChangeOrderInput = z.infer<typeof rejectChangeOrderSchema>

// ============================================================================
// VERSIONS
// ============================================================================

export const createNewVersionSchema = z.object({
  changeOrderId: z.string().uuid('Invalid change order ID'),
  reason: z.string().min(10, 'Version reason must be at least 10 characters').max(2000).trim(),
})

export type CreateNewVersionInput = z.infer<typeof createNewVersionSchema>

export const compareVersionsSchema = z.object({
  changeOrderId: z.string().uuid('Invalid change order ID'),
  version1: z.number().int().positive(),
  version2: z.number().int().positive(),
})

export type CompareVersionsInput = z.infer<typeof compareVersionsSchema>

// ============================================================================
// ATTACHMENTS
// ============================================================================

export const uploadChangeOrderAttachmentSchema = z.object({
  changeOrderId: z.string().uuid('Invalid change order ID'),
  fileName: z.string().min(1).max(255),
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  fileType: z.string().min(1).max(100),
  filePath: z.string().min(1),
  category: attachmentCategorySchema.default('other'),
})

export type UploadChangeOrderAttachmentInput = z.infer<
  typeof uploadChangeOrderAttachmentSchema
>

export const deleteChangeOrderAttachmentSchema = z.object({
  attachmentId: z.string().uuid('Invalid attachment ID'),
})

export type DeleteChangeOrderAttachmentInput = z.infer<
  typeof deleteChangeOrderAttachmentSchema
>
