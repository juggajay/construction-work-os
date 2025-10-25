/**
 * Submit Change Order for Approval
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export async function submitForApproval(changeOrderId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get change order and validate
    const { data: co, error: coError } = await supabase
      .from('change_orders')
      .select('*, project_id')
      .eq('id', changeOrderId)
      .single()

    if (coError || !co) {
      return { success: false, error: 'Change order not found' }
    }

    // Can only submit contemplated or potential
    if (co.status !== 'contemplated' && co.status !== 'potential') {
      return { success: false, error: 'Can only submit draft change orders' }
    }

    // Check if has line items (optional but recommended)
    const { data: lineItems } = await supabase
      .from('change_order_line_items')
      .select('id')
      .eq('change_order_id', changeOrderId)
      .eq('version', co.current_version)

    if (!lineItems || lineItems.length === 0) {
      return {
        success: false,
        error: 'Change order must have at least one line item before submission',
      }
    }

    // Update status to proposed
    const { error: updateError } = await supabase
      .from('change_orders')
      .update({
        status: 'proposed',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', changeOrderId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Create initial approval stage (gc_review)
    const { error: approvalError } = await supabase
      .from('change_order_approvals')
      .insert({
        change_order_id: changeOrderId,
        version: co.current_version,
        stage: 'gc_review',
        status: 'pending',
      })

    if (approvalError) {
      return { success: false, error: approvalError.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit for approval',
    }
  }
}
