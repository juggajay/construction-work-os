/**
 * Delete Change Order Server Action (soft delete)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export async function deleteChangeOrder(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Check if CO is deletable (contemplated or potential only)
    const { data: co } = await supabase
      .from('change_orders')
      .select('status')
      .eq('id', id)
      .single()

    if (!co) {
      return { success: false, error: 'Change order not found' }
    }

    if (co.status !== 'contemplated' && co.status !== 'potential') {
      return { success: false, error: 'Can only delete draft change orders' }
    }

    const { error } = await supabase
      .from('change_orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete change order',
    }
  }
}
