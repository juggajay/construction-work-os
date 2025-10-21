/**
 * Server Action utilities
 */

import { ZodSchema } from 'zod'
import type { ActionResponse, ActionSuccess } from '@/lib/types'
import { toActionError } from './errors'

// Re-export for convenience
export { toActionError }

// ============================================================================
// ACTION WRAPPER
// ============================================================================

/**
 * Wraps a server action with error handling and validation
 *
 * @example
 * export const createProject = withAction(
 *   createProjectSchema,
 *   async (data, context) => {
 *     const supabase = await createClient()
 *     // ... implementation
 *     return { success: true, data: project }
 *   }
 * )
 */
export function withAction<TInput, TOutput>(
  schema: ZodSchema<TInput> | { parse: (data: unknown) => TInput },
  handler: (data: TInput) => Promise<ActionResponse<TOutput>>
) {
  return async (formData: unknown): Promise<ActionResponse<TOutput>> => {
    try {
      // Validate input
      const validatedData = schema.parse(formData) as TInput

      // Execute handler
      const result = await handler(validatedData)

      return result
    } catch (error) {
      // Re-throw Next.js redirect errors so they can be handled by the framework
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = (error as { digest?: string }).digest
        if (digest?.startsWith('NEXT_REDIRECT')) {
          throw error
        }
      }

      // Convert other errors to ActionError format
      return toActionError(error)
    }
  }
}

// ============================================================================
// FORM DATA UTILITIES
// ============================================================================

/**
 * Converts FormData to a plain object
 * Useful for handling form submissions in Server Actions
 */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}

  formData.forEach((value, key) => {
    // Handle multiple values with same key (e.g., checkboxes)
    if (obj[key]) {
      if (!Array.isArray(obj[key])) {
        obj[key] = [obj[key]]
      }
      ;(obj[key] as unknown[]).push(value)
    } else {
      obj[key] = value
    }
  })

  return obj
}

/**
 * Type-safe FormData parser with schema validation
 */
export function parseFormData<T>(formData: FormData, schema: ZodSchema<T>): T {
  const obj = formDataToObject(formData)
  return schema.parse(obj)
}

// ============================================================================
// RESPONSE BUILDERS
// ============================================================================

/**
 * Creates a successful action response
 */
export function success<T>(data: T): ActionSuccess<T> {
  return {
    success: true,
    data,
  }
}

/**
 * Creates an error action response
 */
export function error(
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionResponse<never> {
  return {
    success: false,
    error: message,
    fieldErrors,
  }
}

// ============================================================================
// REVALIDATION HELPERS
// ============================================================================

import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Revalidates organization-related paths
 */
export function revalidateOrganization(orgSlug: string) {
  revalidatePath(`/org/${orgSlug}`)
  revalidatePath(`/org/${orgSlug}/settings`)
  revalidatePath(`/org/${orgSlug}/members`)
  revalidateTag(`organization-${orgSlug}`)
}

/**
 * Revalidates project-related paths
 */
export function revalidateProject(orgSlug: string, projectId: string) {
  revalidatePath(`/org/${orgSlug}/projects`)
  revalidatePath(`/org/${orgSlug}/projects/${projectId}`)
  revalidateTag(`project-${projectId}`)
}

/**
 * Revalidates user profile paths
 */
export function revalidateProfile(userId: string) {
  revalidatePath('/profile')
  revalidatePath('/settings')
  revalidateTag(`profile-${userId}`)
}
