/**
 * Update Change Order Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse, ChangeOrderUpdate } from '@/lib/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/utils/errors'

export async function updateChangeOrder(
  id: string,
  updates: Partial<ChangeOrderUpdate>
): Promise<ActionResponse<void>> {
  try {
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
      .eq('id', id)
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
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update change order',
    }
  }
}
