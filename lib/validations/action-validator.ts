/**
 * Server Action Validation Wrapper
 * Automatically validates inputs using Zod schemas and provides type-safe error handling
 */

import { z } from 'zod'
import type { ActionResponse } from '@/lib/types'

/**
 * Wraps a Server Action with Zod validation
 * Automatically validates input and handles validation errors gracefully
 *
 * @example
 * export const createProject = withValidation(
 *   createProjectSchema,
 *   async (validatedData) => {
 *     // validatedData is fully typed and validated
 *     const project = await db.projects.create(validatedData)
 *     return { success: true, data: project }
 *   }
 * )
 */
export function withValidation<TSchema extends z.ZodType, TData>(
  schema: TSchema,
  handler: (validatedData: z.infer<TSchema>) => Promise<ActionResponse<TData>>
) {
  return async (rawData: unknown): Promise<ActionResponse<TData>> => {
    try {
      // Validate input using Zod schema
      const validatedData = schema.parse(rawData)

      // Call the actual handler with validated data
      return await handler(validatedData)
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Validation failed',
          fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
        }
      }

      // Handle other errors
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Unknown error type
      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }
}

/**
 * Wraps a Server Action with Zod validation for authenticated users
 * Includes user context in the handler
 *
 * @example
 * export const createProject = withAuthValidation(
 *   createProjectSchema,
 *   async (validatedData, user) => {
 *     // Both validatedData and user are available and typed
 *     const project = await db.projects.create({
 *       ...validatedData,
 *       createdBy: user.id
 *     })
 *     return { success: true, data: project }
 *   }
 * )
 */
export function withAuthValidation<TSchema extends z.ZodType, TData>(
  schema: TSchema,
  handler: (validatedData: z.infer<TSchema>, user: { id: string; email?: string }) => Promise<ActionResponse<TData>>
) {
  return async (rawData: unknown, user: { id: string; email?: string }): Promise<ActionResponse<TData>> => {
    try {
      // Validate input
      const validatedData = schema.parse(rawData)

      // Call handler with validated data and user
      return await handler(validatedData, user)
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Validation failed',
          fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
        }
      }

      // Handle other errors
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        }
      }

      return {
        success: false,
        error: 'An unexpected error occurred',
      }
    }
  }
}

/**
 * Validates data synchronously and returns typed result
 * Useful for validating data before processing
 *
 * @example
 * const result = validateData(createProjectSchema, formData)
 * if (!result.success) {
 *   console.error(result.errors)
 *   return
 * }
 * // result.data is fully typed
 */
export function validateData<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown
): { success: true; data: z.infer<TSchema> } | { success: false; errors: Record<string, string[]> } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors as Record<string, string[]>,
      }
    }
    return {
      success: false,
      errors: { _general: ['Validation failed'] },
    }
  }
}

/**
 * Parses and validates data, throwing on error
 * Useful when you want validation errors to bubble up
 *
 * @example
 * const validatedData = parseData(createProjectSchema, formData)
 * // Throws ZodError if validation fails
 */
export function parseData<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown
): z.infer<TSchema> {
  return schema.parse(data)
}

/**
 * Safely parses data, returning undefined on error
 * Useful for optional validation
 *
 * @example
 * const validatedData = safeParseData(createProjectSchema, formData)
 * if (!validatedData) {
 *   // Handle invalid data
 * }
 */
export function safeParseData<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown
): z.infer<TSchema> | undefined {
  const result = schema.safeParse(data)
  return result.success ? result.data : undefined
}
