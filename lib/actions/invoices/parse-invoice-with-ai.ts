/**
 * Parse Invoice with AI (OpenAI Vision API)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { parseInvoiceWithAI, type ParsedInvoiceData } from '@/lib/utils/parse-invoice'

export async function parseInvoiceWithAIAction(
  formData: FormData
): Promise<ActionResponse<ParsedInvoiceData>> {
  try {
    const projectId = formData.get('projectId') as string
    const file = formData.get('file') as File

    if (!file || !projectId) {
      return { success: false, error: 'Missing required fields' }
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a PDF, JPEG, PNG, or HEIC file.',
      }
    }

    // Validate file size (max 25MB)
    const maxSize = 26214400 // 25MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 25MB limit. Please upload a smaller file.',
      }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Verify project access (manager or supervisor OR org member)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    // If no project_access record, check organization membership as fallback
    if (accessError?.code === 'PGRST116' || !access) {
      // Get project's organization
      const { data: projectOrg, error: projectOrgError } = await supabase
        .from('projects')
        .select('org_id')
        .eq('id', projectId)
        .is('deleted_at', null)
        .single()

      if (projectOrgError || !projectOrg) {
        throw new UnauthorizedError('You do not have access to this project')
      }

      // Check if user is member of the organization
      const { data: orgMember, error: orgMemberError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('org_id', projectOrg.org_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single()

      if (orgMemberError || !orgMember) {
        throw new UnauthorizedError('You do not have access to this project')
      }
    } else if (accessError) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse invoice with OpenAI Vision API
    const parsedData = await parseInvoiceWithAI(buffer, file.type)

    return { success: true, data: parsedData }
  } catch (error) {
    console.error('Error parsing invoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse invoice',
    }
  }
}
