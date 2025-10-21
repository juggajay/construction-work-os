/**
 * Error handling utilities
 */

import { ZodError } from 'zod'
import type { ActionError } from '@/lib/types'

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 422)
    this.name = 'ValidationError'
  }
}

// ============================================================================
// ERROR FORMATTERS
// ============================================================================

/**
 * Formats Zod validation errors into field-specific error messages
 */
export function formatZodError(error: ZodError): {
  message: string
  fieldErrors: Record<string, string[]>
} {
  const fieldErrors: Record<string, string[]> = {}

  error.errors.forEach((err) => {
    const path = err.path.join('.')
    if (!fieldErrors[path]) {
      fieldErrors[path] = []
    }
    fieldErrors[path]?.push(err.message)
  })

  return {
    message: 'Validation failed',
    fieldErrors,
  }
}

/**
 * Converts any error to an ActionError response
 */
export function toActionError(error: unknown): ActionError {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formatted = formatZodError(error)
    return {
      success: false,
      error: formatted.message,
      fieldErrors: formatted.fieldErrors,
    }
  }

  // Handle custom ValidationError
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      fieldErrors: error.fieldErrors,
    }
  }

  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
    }
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    }
  }

  // Handle unknown error types
  return {
    success: false,
    error: 'An unexpected error occurred',
  }
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ErrorMessages = {
  // Auth
  AUTH_REQUIRED: 'Authentication required',
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_EMAIL_NOT_CONFIRMED: 'Please confirm your email address',
  AUTH_WEAK_PASSWORD: 'Password does not meet security requirements',
  AUTH_EMAIL_IN_USE: 'Email address is already in use',

  // Organizations
  ORG_NOT_FOUND: 'Organization not found',
  ORG_NO_ACCESS: 'You do not have access to this organization',
  ORG_SLUG_IN_USE: 'Organization slug is already in use',
  ORG_ADMIN_REQUIRED: 'Organization admin access required',
  ORG_OWNER_REQUIRED: 'Organization owner access required',

  // Projects
  PROJECT_NOT_FOUND: 'Project not found',
  PROJECT_NO_ACCESS: 'You do not have access to this project',
  PROJECT_MANAGER_REQUIRED: 'Project manager access required',

  // Members
  MEMBER_NOT_FOUND: 'Member not found',
  MEMBER_ALREADY_EXISTS: 'User is already a member of this organization',
  MEMBER_CANNOT_REMOVE_OWNER: 'Cannot remove organization owner',
  MEMBER_CANNOT_CHANGE_OWN_ROLE: 'Cannot change your own role',

  // Generic
  VALIDATION_FAILED: 'Validation failed',
  OPERATION_FAILED: 'Operation failed',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
} as const
