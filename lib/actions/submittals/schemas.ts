/**
 * Zod Validation Schemas for Submittals
 * Central location for all input validation
 */

import { z } from 'zod';

/**
 * Submittal type enum
 */
export const SubmittalTypeSchema = z.enum([
  'product_data',
  'shop_drawings',
  'samples',
  'mixed',
]);

/**
 * Submittal status enum
 */
export const SubmittalStatusSchema = z.enum([
  'draft',
  'submitted',
  'gc_review',
  'ae_review',
  'owner_review',
  'approved',
  'approved_as_noted',
  'revise_resubmit',
  'rejected',
  'cancelled',
]);

/**
 * Review stage enum
 */
export const ReviewStageSchema = z.enum([
  'draft',
  'gc_review',
  'ae_review',
  'owner_review',
  'complete',
]);

/**
 * Review action enum
 */
export const ReviewActionSchema = z.enum([
  'approved',
  'approved_as_noted',
  'revise_resubmit',
  'rejected',
  'forwarded',
]);

/**
 * Submittal attachment type enum
 */
export const SubmittalAttachmentTypeSchema = z.enum([
  'product_data',
  'shop_drawing',
  'sample_photo',
  'specification',
  'other',
]);

/**
 * Create Submittal Input Schema
 */
export const CreateSubmittalSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().optional(),
  submittalType: SubmittalTypeSchema,
  specSection: z
    .string()
    .min(1, 'Spec section is required')
    .regex(/^[0-9]{2}\s[0-9]{2}\s[0-9]{2}$/, 'Invalid spec section format (e.g., "03 30 00")'),
  specSectionTitle: z.string().optional(),
  requiredOnSite: z.string().optional(), // ISO date string
  leadTimeDays: z.number().int().min(0).optional(),
  submittedByOrg: z.string().uuid().optional(),
});

/**
 * Update Submittal Input Schema
 */
export const UpdateSubmittalSchema = z.object({
  submittalId: z.string().uuid('Invalid submittal ID'),
  title: z.string().min(1, 'Title is required').max(500).optional(),
  description: z.string().optional(),
  requiredOnSite: z.string().optional(), // ISO date string
  leadTimeDays: z.number().int().min(0).optional(),
});

/**
 * Submit For Review Input Schema
 */
export const SubmitForReviewSchema = z.object({
  submittalId: z.string().uuid('Invalid submittal ID'),
  reviewerId: z.string().uuid('Invalid reviewer ID'),
});

/**
 * Review Submittal Input Schema
 */
export const ReviewSubmittalSchema = z.object({
  submittalId: z.string().uuid('Invalid submittal ID'),
  action: ReviewActionSchema,
  comments: z.string().min(1, 'Comments are required'),
  nextReviewerId: z.string().uuid().optional(), // Required for "forwarded" action
});

/**
 * Create Resubmittal Input Schema
 */
export const CreateResubmittalSchema = z.object({
  parentSubmittalId: z.string().uuid('Invalid parent submittal ID'),
  notes: z.string().min(1, 'Please describe what changed in this revision'),
});

/**
 * Upload Attachment Input Schema
 */
export const UploadAttachmentSchema = z.object({
  submittalId: z.string().uuid('Invalid submittal ID'),
  versionNumber: z.number().int().min(0),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  fileType: z.string().min(1),
  filePath: z.string().min(1),
  attachmentType: SubmittalAttachmentTypeSchema,
});

/**
 * Delete Attachment Input Schema
 */
export const DeleteAttachmentSchema = z.object({
  attachmentId: z.string().uuid('Invalid attachment ID'),
});

/**
 * Get Submittal List Input Schema (filters)
 */
export const GetSubmittalListSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  status: SubmittalStatusSchema.optional(),
  currentStage: ReviewStageSchema.optional(),
  specSection: z.string().optional(), // Partial match (e.g., "03" for all Division 03)
  overdue: z.boolean().optional(),
  assignedToMe: z.boolean().optional(),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Get Submittal Detail Input Schema
 */
export const GetSubmittalDetailSchema = z.object({
  submittalId: z.string().uuid('Invalid submittal ID'),
});

/**
 * Get My Pending Reviews Input Schema
 */
export const GetMyPendingReviewsSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
});
