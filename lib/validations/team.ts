/**
 * Validation schemas for team management
 */

import { z } from 'zod'

/**
 * Certification object schema
 */
export const CertificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required').max(200, 'Name too long'),
  issuer: z.string().min(1, 'Issuer is required').max(200, 'Issuer name too long'),
  issuedDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().optional(),
})

/**
 * Update team member profile schema
 */
export const UpdateTeamMemberProfileSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  jobTitle: z.string().max(100, 'Job title too long').optional(),
  company: z.string().max(200, 'Company name too long').optional(),
  certifications: z.array(CertificationSchema).max(50, 'Too many certifications').optional(),
})

export type CertificationInput = z.infer<typeof CertificationSchema>
export type UpdateTeamMemberProfileInput = z.infer<typeof UpdateTeamMemberProfileSchema>
