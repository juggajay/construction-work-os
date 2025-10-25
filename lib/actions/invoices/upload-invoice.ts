/**
 * Upload Invoice (with manual entry for now, AI parsing to be added)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import type { Database } from '@/lib/types/supabase'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

export async function uploadInvoice(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const projectId = formData.get('projectId') as string
    const category = formData.get('category') as BudgetCategory
    const file = formData.get('file') as File
    const vendorName = formData.get('vendorName') as string | null
    const invoiceNumber = formData.get('invoiceNumber') as string | null
    const invoiceDate = formData.get('invoiceDate') as string | null
    const amountStr = formData.get('amount') as string
    const description = formData.get('description') as string | null

    const amount = parseFloat(amountStr)

    if (!file || !projectId || !category || !amount || isNaN(amount)) {
      return { success: false, error: 'Missing required fields' }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Verify project access (manager or supervisor)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (accessError || !access || !['manager', 'supervisor'].includes(access.role)) {
      throw new UnauthorizedError('Only managers and supervisors can upload invoices')
    }

    // Upload file to storage
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = `${projectId}/invoices/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('project-invoices')
      .upload(filePath, file)

    if (uploadError) {
      return { success: false, error: `Failed to upload file: ${uploadError.message}` }
    }

    // Create invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('project_invoices')
      .insert({
        project_id: projectId,
        budget_category: category,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        vendor_name: vendorName || null,
        invoice_number: invoiceNumber || null,
        invoice_date: invoiceDate || null,
        amount,
        description: description || null,
        ai_parsed: false, // Manual entry for now
        uploaded_by: user.id,
      })
      .select('id')
      .single()

    if (invoiceError) {
      // Clean up uploaded file on error
      await supabase.storage.from('project-invoices').remove([filePath])
      return { success: false, error: invoiceError.message }
    }

    return { success: true, data: { id: invoice.id } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload invoice',
    }
  }
}
