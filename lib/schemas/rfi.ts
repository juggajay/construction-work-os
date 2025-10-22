/**
 * RFI validation schemas
 */

import { z } from 'zod'

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

export const rfiStatusSchema = z.enum(['draft', 'submitted', 'under_review', 'answered', 'closed', 'cancelled'])

export const rfiPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

// ============================================================================
// CREATE RFI
// ============================================================================

export const createRFISchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(500).trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').trim(),
  discipline: z.string().max(100).trim().optional().nullable(),
  specSection: z.string().max(100).trim().optional().nullable(),
  drawingReference: z.string().max(500).trim().optional().nullable(),
  priority: rfiPrioritySchema.default('medium'),
  assignedToId: z.string().uuid().optional().nullable(),
  assignedToOrg: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  responseDueDate: z.string().datetime().optional().nullable(),
  costImpact: z.number().min(0).optional().nullable(),
  scheduleImpact: z.number().int().min(0).optional().nullable(),
})

export type CreateRFIInput = z.infer<typeof createRFISchema>

// ============================================================================
// UPDATE RFI
// ============================================================================

export const updateRFISchema = z.object({
  rfiId: z.string().uuid('Invalid RFI ID'),
  title: z.string().min(3).max(500).trim().optional(),
  description: z.string().min(10).trim().optional(),
  discipline: z.string().max(100).trim().optional().nullable(),
  specSection: z.string().max(100).trim().optional().nullable(),
  drawingReference: z.string().max(500).trim().optional().nullable(),
  priority: rfiPrioritySchema.optional(),
  costImpact: z.number().min(0).optional().nullable(),
  scheduleImpact: z.number().int().min(0).optional().nullable(),
})

export type UpdateRFIInput = z.infer<typeof updateRFISchema>

// ============================================================================
// SUBMIT RFI
// ============================================================================

export const submitRFISchema = z
  .object({
    rfiId: z.string().uuid('Invalid RFI ID'),
    assignedToId: z.string().uuid().optional().nullable(),
    assignedToOrg: z.string().uuid().optional().nullable(),
    responseDueDate: z.string().datetime().optional().nullable(),
  })
  .refine((data) => data.assignedToId || data.assignedToOrg, {
    message: 'Must assign to either a user or organization',
  })

export type SubmitRFIInput = z.infer<typeof submitRFISchema>

// ============================================================================
// ASSIGN RFI
// ============================================================================

export const assignRFISchema = z
  .object({
    rfiId: z.string().uuid('Invalid RFI ID'),
    assignedToId: z.string().uuid().optional().nullable(),
    assignedToOrg: z.string().uuid().optional().nullable(),
  })
  .refine((data) => data.assignedToId || data.assignedToOrg, {
    message: 'Must assign to either a user or organization',
  })
  .refine((data) => !(data.assignedToId && data.assignedToOrg), {
    message: 'Cannot assign to both user and organization',
  })

export type AssignRFIInput = z.infer<typeof assignRFISchema>

// ============================================================================
// ADD RESPONSE
// ============================================================================

export const addResponseSchema = z.object({
  rfiId: z.string().uuid('Invalid RFI ID'),
  content: z.string().min(1, 'Response content cannot be empty').trim(),
  isOfficialAnswer: z.boolean().default(false),
})

export type AddResponseInput = z.infer<typeof addResponseSchema>

// ============================================================================
// CLOSE RFI
// ============================================================================

export const closeRFISchema = z.object({
  rfiId: z.string().uuid('Invalid RFI ID'),
})

export type CloseRFIInput = z.infer<typeof closeRFISchema>

// ============================================================================
// UPLOAD ATTACHMENT
// ============================================================================

export const uploadAttachmentSchema = z.object({
  rfiId: z.string().uuid('Invalid RFI ID'),
  responseId: z.string().uuid('Invalid response ID').optional().nullable(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  fileType: z.string().regex(/^(application\/pdf|image\/(jpeg|png)|application\/(vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet)))$/, 'Invalid file type'),
  filePath: z.string().min(1),
  drawingSheet: z.string().max(100).trim().optional().nullable(),
})

export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>

// ============================================================================
// DELETE ATTACHMENT
// ============================================================================

export const deleteAttachmentSchema = z.object({
  attachmentId: z.string().uuid('Invalid attachment ID'),
})

export type DeleteAttachmentInput = z.infer<typeof deleteAttachmentSchema>
