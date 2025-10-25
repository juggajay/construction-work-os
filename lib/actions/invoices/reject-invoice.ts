/**
 * Reject Invoice
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export async function rejectInvoice(
  invoiceId: string,
  reason: string
): Promise<ActionResponse<void>> {
  try {
    if (!invoiceId || !reason) {
      return { success: false, error: 'Invoice ID and reason are required' }
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
      .select('project_id, status, description')
      .eq('id', invoiceId)
      .is('deleted_at', null)
      .single()

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    if (invoice.status !== 'pending') {
      return { success: false, error: `Cannot reject invoice with status: ${invoice.status}` }
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
      throw new UnauthorizedError('Only managers can reject invoices')
    }

    // Reject invoice (append reason to description)
    const rejectionNote = `\n\n[REJECTED by ${user.email}]: ${reason}`
    const { error: updateError } = await supabase
      .from('project_invoices')
      .update({
        status: 'rejected',
        description: (invoice.description || '') + rejectionNote,
      })
      .eq('id', invoiceId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject invoice',
    }
  }
}
