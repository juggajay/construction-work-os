/**
 * Organization validation schemas
 */

import { z } from 'zod'

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

export const orgSlugSchema = z
  .string()
  .min(3, 'Organization slug must be at least 3 characters')
  .max(30, 'Organization slug must be less than 30 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .refine((val) => !val.startsWith('-') && !val.endsWith('-'), {
    message: 'Slug cannot start or end with a hyphen',
  })

export const orgRoleSchema = z.enum(['owner', 'admin', 'member'])

// ============================================================================
// CREATE ORGANIZATION
// ============================================================================

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100).trim(),
  slug: orgSlugSchema,
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

// ============================================================================
// UPDATE ORGANIZATION
// ============================================================================

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100).trim().optional(),
  settings: z.record(z.any()).optional(),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>

// ============================================================================
// INVITE MEMBER
// ============================================================================

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  role: orgRoleSchema,
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>

// ============================================================================
// UPDATE MEMBER ROLE
// ============================================================================

export const updateMemberRoleSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
  role: orgRoleSchema,
})

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>

// ============================================================================
// REMOVE MEMBER
// ============================================================================

export const removeMemberSchema = z.object({
  memberId: z.string().uuid('Invalid member ID'),
})

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>

// ============================================================================
// ACCEPT INVITATION
// ============================================================================

export const acceptInvitationSchema = z.object({
  orgId: z.string().uuid('Invalid organization ID'),
})

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>
