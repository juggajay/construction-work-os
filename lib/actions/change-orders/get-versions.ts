/**
 * Get Version History for Change Order
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse, ChangeOrderVersion } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export async function getVersions(changeOrderId: string): Promise<ActionResponse<ChangeOrderVersion[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get all versions for this change order
    const { data, error } = await supabase
      .from('change_order_versions')
      .select('*')
      .eq('change_order_id', changeOrderId)
      .order('version_number', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as ChangeOrderVersion[] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get versions',
    }
  }
}
