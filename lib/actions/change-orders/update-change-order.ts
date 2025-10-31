/**
 * Update Change Order Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/utils/errors'
import { updateChangeOrderSchema, type UpdateChangeOrderInput } from '@/lib/schemas'
import { ZodError } from 'zod'

export async function updateChangeOrder(
  input: unknown
): Promise<ActionResponse<void>> {
  try {
    // Validate input
    const validatedInput = updateChangeOrderSchema.parse(input)
    const { changeOrderId, ...updates } = validatedInput

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Check if CO is editable (not approved/invoiced)
    const { data: co } = await supabase
      .from('change_orders')
      .select('status, created_by')
      .eq('id', changeOrderId)
      .single()

    if (!co) {
      return { success: false, error: 'Change order not found' }
    }

    if (co.status === 'approved' || co.status === 'invoiced') {
      return { success: false, error: 'Cannot edit approved or invoiced change orders' }
    }

    const { error } = await supabase
      .from('change_orders')
      .update(updates)
      .eq('id', changeOrderId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errorMessage = error.issues.map(issue => issue.message).join(', ')
      return {
        success: false,
        error: `Validation failed: ${errorMessage}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update change order',
    }
  }
}
