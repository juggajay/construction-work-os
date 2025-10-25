/**
 * Approve Invoice
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { type ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export async function approveInvoice(
  invoiceId: string
): Promise<ActionResponse<void>> {
  try {
    if (!invoiceId) {
      return { success: false, error: 'Invoice ID is required' }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get invoice to verify access
    const { data: invoice, error: invoiceError } = await supabase
      .from('project_invoices')
      .select('project_id, status')
      .eq('id', invoiceId)
      .is('deleted_at', null)
      .single()

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    if (invoice.status !== 'pending') {
      return { success: false, error: `Cannot approve invoice with status: ${invoice.status}` }
    }

    // Verify project access (manager only)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', invoice.project_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (accessError || !access || access.role !== 'manager') {
      throw new UnauthorizedError('Only managers can approve invoices')
    }

    // Approve invoice
    const { error: updateError } = await supabase
      .from('project_invoices')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Trigger will auto-refresh materialized view

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve invoice',
    }
  }
}
