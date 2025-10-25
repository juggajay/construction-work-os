/**
 * Get Change Order By ID Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse, ChangeOrder, ChangeOrderLineItem, ChangeOrderApproval } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface ChangeOrderDetails extends ChangeOrder {
  line_items: ChangeOrderLineItem[]
  approvals: ChangeOrderApproval[]
}

export async function getChangeOrderById(
  id: string
): Promise<ActionResponse<ChangeOrderDetails>> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get change order with related data
    const { data: changeOrder, error: coError } = await supabase
      .from('change_orders')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (coError || !changeOrder) {
      return {
        success: false,
        error: 'Change order not found',
      }
    }

    // Get line items for current version
    const { data: lineItems } = await supabase
      .from('change_order_line_items')
      .select('*')
      .eq('change_order_id', id)
      .eq('version', changeOrder.current_version)
      .order('sort_order', { ascending: true })

    // Get approvals for current version
    const { data: approvals } = await supabase
      .from('change_order_approvals')
      .select('*')
      .eq('change_order_id', id)
      .eq('version', changeOrder.current_version)
      .order('created_at', { ascending: true })

    const result: ChangeOrderDetails = {
      ...(changeOrder as ChangeOrder),
      line_items: (lineItems || []) as ChangeOrderLineItem[],
      approvals: (approvals || []) as ChangeOrderApproval[],
    }

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Get change order by ID error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch change order',
    }
  }
}
