/**
 * Authentication Server Actions
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  signupSchema,
  loginSchema,
  magicLinkSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  updateProfileSchema,
  type SignupInput,
  type LoginInput,
  type MagicLinkInput,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
  type UpdateProfileInput,
} from '@/lib/schemas'
import type { ActionResponse, ActionSuccess } from '@/lib/types'
import { withAction, success, revalidateProfile } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError } from '@/lib/utils/errors'
import { logger } from '@/lib/utils/logger'

// ============================================================================
// SIGNUP
// ============================================================================

export const signup = withAction(signupSchema, async (data: SignupInput): Promise<ActionResponse<void>> => {
  const supabase = await createClient()

  // Create user account
  const { data: authData, error: signupError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (signupError) {
    logger.error('Signup failed', signupError, {
      action: 'signup',
      email: data.email,
    })
    return {
      success: false,
      error: signupError.message,
    }
  }

  if (!authData.user) {
    logger.error('Signup succeeded but no user returned', new Error('Missing user'), {
      action: 'signup',
      email: data.email,
    })
    return {
      success: false,
      error: ErrorMessages.UNEXPECTED_ERROR,
    }
  }

  // Profile is automatically created by database trigger
  // See: supabase/migrations/20250123000000_auto_create_profile.sql
  // The trigger handles profile creation with full_name from auth.users.raw_user_meta_data

  logger.info('User signup successful', {
    action: 'signup',
    userId: authData.user.id,
    email: data.email,
  })

  return success(undefined)
})

// ============================================================================
// LOGIN
// ============================================================================

export const login = withAction(loginSchema, async (data: LoginInput): Promise<ActionResponse<void>> => {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return {
      success: false,
      error: ErrorMessages.AUTH_INVALID_CREDENTIALS,
    }
  }

  // Redirect to dashboard after successful login
  // Using redirect() ensures cookies are properly set
  redirect('/dashboard')
})

// ============================================================================
// LOGOUT
// ============================================================================

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ============================================================================
// MAGIC LINK
// ============================================================================

export const sendMagicLink = withAction(
  magicLinkSchema,
  async (data: MagicLinkInput): Promise<ActionResponse<void>> => {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return success(undefined)
  }
)

// ============================================================================
// PASSWORD RESET
// ============================================================================

export const requestPasswordReset = withAction(
  requestPasswordResetSchema,
  async (data: RequestPasswordResetInput): Promise<ActionResponse<void>> => {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }

    // Always return success (don't reveal if email exists)
    return success(undefined)
  }
)

export const resetPassword = withAction(
  resetPasswordSchema,
  async (data: ResetPasswordInput): Promise<ActionResponse<void>> => {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (error) {
      throw new Error(error.message)
    }

    return success(undefined)
  }
)

// ============================================================================
// UPDATE PASSWORD
// ============================================================================

export const updatePassword = withAction(
  updatePasswordSchema,
  async (data: UpdatePasswordInput): Promise<ActionResponse<void>> => {
    const supabase = await createClient()

    // Verify current password by attempting to sign in
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.currentPassword,
    })

    if (verifyError) {
      throw new Error('Current password is incorrect')
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    })

    if (updateError) {
      throw new Error(updateError.message)
    }

    return success(undefined)
  }
)

// ============================================================================
// UPDATE PROFILE
// ============================================================================

export const updateProfile = withAction(
  updateProfileSchema,
  async (data: UpdateProfileInput): Promise<ActionResponse<void>> => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Update profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        phone: data.phone,
        avatar_url: data.avatarUrl,
      })
      .eq('id', user.id)

    if (profileError) {
      throw new Error(profileError.message)
    }

    // Update auth metadata if full name changed
    if (data.fullName) {
      await supabase.auth.updateUser({
        data: { full_name: data.fullName },
      })
    }

    revalidateProfile(user.id)

    return success(undefined)
  }
)

// ============================================================================
// GET CURRENT USER
// ============================================================================

export async function getCurrentUser(): Promise<ActionResponse<{
  id: string
  email: string
  profile: any
}>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Fetch profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email ?? '',
        profile,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current user',
    }
  }
}
