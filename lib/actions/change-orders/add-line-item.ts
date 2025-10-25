/**
 * Add Line Item to Change Order
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse, ChangeOrderLineItemInsert } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface AddLineItemInput {
  changeOrderId: string
  description: string
  quantity?: number
  unit?: string
  unitCost?: number
  subCost?: number
  gcMarkupPercent?: number
  taxRate?: number
  csiSection?: string
}

export async function addLineItem(input: AddLineItemInput): Promise<ActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get current version and max sort_order
    const { data: co } = await supabase
      .from('change_orders')
      .select('current_version')
      .eq('id', input.changeOrderId)
      .single()

    if (!co) {
      return { success: false, error: 'Change order not found' }
    }

    const { data: maxSort } = await supabase
      .from('change_order_line_items')
      .select('sort_order')
      .eq('change_order_id', input.changeOrderId)
      .eq('version', (co as any).current_version)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = ((maxSort as any)?.sort_order || 0) + 1

    const lineItemData: ChangeOrderLineItemInsert = {
      change_order_id: input.changeOrderId,
      version: (co as any).current_version,
      description: input.description,
      quantity: input.quantity || 1,
      unit: input.unit || null,
      unit_cost: input.unitCost || 0,
      sub_cost: input.subCost || 0,
      gc_markup_percent: input.gcMarkupPercent || 0,
      tax_rate: input.taxRate || 0,
      csi_section: input.csiSection || null,
      sort_order: nextSortOrder,
    }

    const { data, error } = await supabase
      .from('change_order_line_items')
      .insert(lineItemData)
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: { id: data.id } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add line item',
    }
  }
}
