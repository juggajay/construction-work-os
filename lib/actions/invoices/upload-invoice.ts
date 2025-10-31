/**
 * Upload Invoice (with manual entry for now, AI parsing to be added)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import type { Database } from '@/lib/types/supabase'
import { logger } from '@/lib/utils/logger'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

export async function uploadInvoice(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  logger.debug('Starting invoice upload process', {
    action: 'uploadInvoice',
  })
  try {
    const projectId = formData.get('projectId') as string
    const category = formData.get('category') as BudgetCategory
    const file = formData.get('file') as File
    const vendorName = formData.get('vendorName') as string | null
    const invoiceNumber = formData.get('invoiceNumber') as string | null
    const invoiceDate = formData.get('invoiceDate') as string | null
    const amountStr = formData.get('amount') as string
    const description = formData.get('description') as string | null

    logger.debug('Extracted form data', {
      action: 'uploadInvoice',
      projectId,
      category,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      hasVendorName: !!vendorName,
      hasInvoiceNumber: !!invoiceNumber,
      amount: amountStr,
    })

    const amount = parseFloat(amountStr)

    if (!file || !projectId || !category || !amount || isNaN(amount)) {
      logger.error('Missing required fields', new Error('Validation failed'), {
        action: 'uploadInvoice',
        hasFile: !!file,
        hasProjectId: !!projectId,
        hasCategory: !!category,
        hasAmount: !!amount,
      })
      return { success: false, error: 'Missing required fields' }
    }

    const supabase = await createClient()
    logger.debug('Supabase client created', {
      action: 'uploadInvoice',
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.error('No user found', new Error('Authentication required'), {
        action: 'uploadInvoice',
      })
      throw new UnauthorizedError('You must be logged in')
    }

    logger.debug('User authenticated', {
      action: 'uploadInvoice',
      userId: user.id,
    })

    // Verify project access (manager or supervisor OR org member)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    logger.debug('Access query result', {
      action: 'uploadInvoice',
      hasError: !!accessError,
      errorCode: accessError?.code,
      hasAccess: !!access,
      role: access?.role,
    })

    // If no project_access record, check organization membership as fallback
    if (accessError?.code === 'PGRST116' || !access) {
      logger.debug('No project access found, checking org membership', {
        action: 'uploadInvoice',
        projectId,
      })

      // Get project's organization
      const { data: projectOrg, error: projectOrgError } = await supabase
        .from('projects')
        .select('org_id')
        .eq('id', projectId)
        .is('deleted_at', null)
        .single()

      if (projectOrgError || !projectOrg) {
        logger.error('Could not fetch project organization', projectOrgError || new Error('Project not found'), {
          action: 'uploadInvoice',
          projectId,
        })
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

      logger.debug('Org membership result', {
        action: 'uploadInvoice',
        hasError: !!orgMemberError,
        isMember: !!orgMember,
        orgRole: orgMember?.role,
      })

      if (orgMemberError || !orgMember) {
        logger.error('Access denied - not an org member', orgMemberError || new Error('Not authorized'), {
          action: 'uploadInvoice',
          projectId,
          userId: user.id,
        })
        throw new UnauthorizedError('Only managers and supervisors can upload invoices')
      }

      logger.info('Access verified via org membership', {
        action: 'uploadInvoice',
        role: orgMember.role,
      })
    } else if (accessError) {
      logger.error('Access query error', accessError, {
        action: 'uploadInvoice',
      })
      throw new UnauthorizedError('Only managers and supervisors can upload invoices')
    } else if (!['manager', 'supervisor'].includes(access.role)) {
      logger.error('Access denied - insufficient role', new Error('Insufficient permissions'), {
        action: 'uploadInvoice',
        role: access.role,
        requiredRoles: ['manager', 'supervisor'],
      })
      throw new UnauthorizedError('Only managers and supervisors can upload invoices')
    } else {
      logger.info('Access verified via project access', {
        action: 'uploadInvoice',
        role: access.role,
      })
    }

    // Upload file to storage
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = `${projectId}/invoices/${fileName}`

    logger.debug('Uploading file to storage', {
      action: 'uploadInvoice',
      filePath,
      fileSize: file.size,
    })

    const { error: uploadError } = await supabase.storage
      .from('project-invoices')
      .upload(filePath, file)

    if (uploadError) {
      logger.error('File upload to storage failed', uploadError, {
        action: 'uploadInvoice',
        filePath,
      })
      return { success: false, error: `Failed to upload file: ${uploadError.message}` }
    }

    logger.debug('File uploaded successfully to storage', {
      action: 'uploadInvoice',
      filePath,
    })

    // Create invoice record
    logger.debug('Creating invoice record in database', {
      action: 'uploadInvoice',
      projectId,
      category,
      amount,
    })
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
      logger.error('Database insertion failed', invoiceError, {
        action: 'uploadInvoice',
        projectId,
      })
      // Clean up uploaded file on error
      await supabase.storage.from('project-invoices').remove([filePath])
      return { success: false, error: invoiceError.message }
    }

    logger.info('Invoice uploaded successfully', {
      action: 'uploadInvoice',
      invoiceId: invoice.id,
      projectId,
      category,
      amount,
    })
    return { success: true, data: { id: invoice.id } }
  } catch (error) {
    logger.error('Unexpected error during invoice upload', error as Error, {
      action: 'uploadInvoice',
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload invoice',
    }
  }
}
