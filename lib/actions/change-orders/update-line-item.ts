/**
 * Update Line Item
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse, ChangeOrderLineItemUpdate } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface UpdateLineItemInput {
  description?: string
  quantity?: number
  unit?: string
  unitCost?: number
  subCost?: number
  gcMarkupPercent?: number
  taxRate?: number
  csiSection?: string
}

export async function updateLineItem(
  lineItemId: string,
  updates: UpdateLineItemInput
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get line item and check if CO is editable
    const { data: lineItem } = await supabase
      .from('change_order_line_items')
      .select('change_order_id')
      .eq('id', lineItemId)
      .single()

    if (!lineItem) {
      return { success: false, error: 'Line item not found' }
    }

    const { data: co } = await supabase
      .from('change_orders')
      .select('status')
      .eq('id', lineItem.change_order_id)
      .single()

    if (co?.status === 'approved' || co?.status === 'invoiced') {
      return { success: false, error: 'Cannot edit line items of approved/invoiced change orders' }
    }

    // Build update object
    const updateData: any = {}
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity
    if (updates.unit !== undefined) updateData.unit = updates.unit
    if (updates.unitCost !== undefined) updateData.unit_cost = updates.unitCost
    if (updates.subCost !== undefined) updateData.sub_cost = updates.subCost
    if (updates.gcMarkupPercent !== undefined) updateData.gc_markup_percent = updates.gcMarkupPercent
    if (updates.taxRate !== undefined) updateData.tax_rate = updates.taxRate
    if (updates.csiSection !== undefined) updateData.csi_section = updates.csiSection

    const { error } = await supabase
      .from('change_order_line_items')
      .update(updateData)
      .eq('id', lineItemId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Trigger will automatically recalculate costs
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update line item',
    }
  }
}
