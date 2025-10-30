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
  console.log('📤 uploadInvoice: Starting upload process')
  try {
    const projectId = formData.get('projectId') as string
    const category = formData.get('category') as BudgetCategory
    const file = formData.get('file') as File
    const vendorName = formData.get('vendorName') as string | null
    const invoiceNumber = formData.get('invoiceNumber') as string | null
    const invoiceDate = formData.get('invoiceDate') as string | null
    const amountStr = formData.get('amount') as string
    const description = formData.get('description') as string | null

    console.log('📤 uploadInvoice: Extracted data:', {
      projectId,
      category,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      vendorName,
      invoiceNumber,
      invoiceDate,
      amountStr,
    })

    const amount = parseFloat(amountStr)

    if (!file || !projectId || !category || !amount || isNaN(amount)) {
      console.error('❌ uploadInvoice: Missing required fields')
      return { success: false, error: 'Missing required fields' }
    }

    const supabase = await createClient()
    console.log('📤 uploadInvoice: Supabase client created')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ uploadInvoice: No user found')
      throw new UnauthorizedError('You must be logged in')
    }

    console.log('📤 uploadInvoice: User authenticated:', user.id)

    // Verify project access (manager or supervisor OR org member)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    console.log('📤 uploadInvoice: Access query result', {
      hasError: !!accessError,
      errorCode: accessError?.code,
      hasAccess: !!access,
      role: access?.role,
    })

    // If no project_access record, check organization membership as fallback
    if (accessError?.code === 'PGRST116' || !access) {
      console.log('📤 uploadInvoice: No project access found, checking org membership...')

      // Get project's organization
      const { data: projectOrg, error: projectOrgError } = await supabase
        .from('projects')
        .select('org_id')
        .eq('id', projectId)
        .is('deleted_at', null)
        .single()

      if (projectOrgError || !projectOrg) {
        console.error('❌ uploadInvoice: Could not fetch project organization')
        throw new UnauthorizedError('Only managers and supervisors can upload invoices')
      }

      // Check if user is member of the organization
      const { data: orgMember, error: orgMemberError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('org_id', projectOrg.org_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single()

      console.log('📤 uploadInvoice: Org membership result', {
        hasError: !!orgMemberError,
        errorMessage: orgMemberError?.message,
        isMember: !!orgMember,
        orgRole: orgMember?.role,
      })

      if (orgMemberError || !orgMember) {
        console.error('❌ uploadInvoice: Access denied - not an org member')
        throw new UnauthorizedError('Only managers and supervisors can upload invoices')
      }

      console.log('✅ uploadInvoice: Access verified via org membership, role:', orgMember.role)
    } else if (accessError) {
      console.error('❌ uploadInvoice: Access query error', {
        error: accessError,
      })
      throw new UnauthorizedError('Only managers and supervisors can upload invoices')
    } else if (!['manager', 'supervisor'].includes(access.role)) {
      console.error('❌ uploadInvoice: Access denied - insufficient role', {
        role: access.role,
        requiredRoles: ['manager', 'supervisor'],
      })
      throw new UnauthorizedError('Only managers and supervisors can upload invoices')
    } else {
      console.log('✅ uploadInvoice: Access verified via project access, role:', access.role)
    }

    // Upload file to storage
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = `${projectId}/invoices/${fileName}`

    console.log('📤 uploadInvoice: Uploading file to storage:', filePath)

    const { error: uploadError } = await supabase.storage
      .from('project-invoices')
      .upload(filePath, file)

    if (uploadError) {
      console.error('❌ uploadInvoice: File upload failed:', uploadError)
      return { success: false, error: `Failed to upload file: ${uploadError.message}` }
    }

    console.log('✅ uploadInvoice: File uploaded successfully')

    // Create invoice record
    console.log('📤 uploadInvoice: Creating invoice record in database')
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
      console.error('❌ uploadInvoice: Database insertion failed:', invoiceError)
      // Clean up uploaded file on error
      await supabase.storage.from('project-invoices').remove([filePath])
      return { success: false, error: invoiceError.message }
    }

    console.log('✅ uploadInvoice: Invoice created successfully, ID:', invoice.id)
    return { success: true, data: { id: invoice.id } }
  } catch (error) {
    console.error('❌ uploadInvoice: Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload invoice',
    }
  }
}
