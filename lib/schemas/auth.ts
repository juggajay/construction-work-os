/**
 * Authentication validation schemas
 */

import { z } from 'zod'

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .toLowerCase()
  .trim()

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  )

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)')
  .optional()
  .nullable()

// ============================================================================
// SIGNUP
// ============================================================================

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
})

export type SignupInput = z.infer<typeof signupSchema>

// ============================================================================
// LOGIN
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ============================================================================
// MAGIC LINK
// ============================================================================

export const magicLinkSchema = z.object({
  email: emailSchema,
})

export type MagicLinkInput = z.infer<typeof magicLinkSchema>

// ============================================================================
// PASSWORD RESET
// ============================================================================

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
})

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ============================================================================
// UPDATE PASSWORD
// ============================================================================

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

// ============================================================================
// UPDATE PROFILE
// ============================================================================

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
  phone: phoneSchema,
  avatarUrl: z.string().url('Invalid URL').optional().nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
