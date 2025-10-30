/**
 * Validation schemas for analytics
 */

import { z } from 'zod'

/**
 * Organization ID validation schema
 */
export const OrgIdSchema = z.string().uuid('Invalid organization ID')

export type OrgIdInput = z.infer<typeof OrgIdSchema>
