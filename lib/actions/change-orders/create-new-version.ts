/**
 * Create New Version (for rejected change orders)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse, ChangeOrderVersionInsert } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface CreateNewVersionInput {
  changeOrderId: string
  reason: string // Why creating new version (e.g., "Reduced scope per owner request")
}

export async function createNewVersion(
  input: CreateNewVersionInput
): Promise<ActionResponse<{ versionNumber: number }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get current change order
    const { data: co, error: coError } = await supabase
      .from('change_orders')
      .select('*')
      .eq('id', input.changeOrderId)
      .single()

    if (coError || !co) {
      return { success: false, error: 'Change order not found' }
    }

    // Can only create new version if rejected
    if (co.status !== 'rejected') {
      return { success: false, error: 'Can only create new version for rejected change orders' }
    }

    const newVersionNumber = co.current_version + 1

    // Create version record
    const versionData: ChangeOrderVersionInsert = {
      change_order_id: input.changeOrderId,
      version_number: newVersionNumber,
      created_by: user.id,
      reason: input.reason,
      cost_impact: co.cost_impact,
      schedule_impact_days: co.schedule_impact_days,
    }

    const { error: versionError } = await supabase
      .from('change_order_versions')
      .insert(versionData)

    if (versionError) {
      return { success: false, error: versionError.message }
    }

    // Copy line items from previous version to new version
    const { data: prevLineItems } = await supabase
      .from('change_order_line_items')
      .select('*')
      .eq('change_order_id', input.changeOrderId)
      .eq('version', co.current_version)

    if (prevLineItems && prevLineItems.length > 0) {
      const newLineItems = prevLineItems.map((item: any) => ({
        change_order_id: input.changeOrderId,
        version: newVersionNumber,
        csi_section: item.csi_section,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        sub_cost: item.sub_cost,
        gc_markup_percent: item.gc_markup_percent,
        unit_cost: item.unit_cost,
        tax_rate: item.tax_rate,
        sort_order: item.sort_order,
      }))

      const { error: lineItemsError } = await supabase
        .from('change_order_line_items')
        .insert(newLineItems)

      if (lineItemsError) {
        console.error('Error copying line items:', lineItemsError)
        // Continue anyway - user can add line items manually
      }
    }

    // Update change order to new version and reset status to potential
    const { error: updateError } = await supabase
      .from('change_orders')
      .update({
        current_version: newVersionNumber,
        status: 'potential',
        rejected_at: null,
      })
      .eq('id', input.changeOrderId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, data: { versionNumber: newVersionNumber } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create new version',
    }
  }
}
