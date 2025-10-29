/**
 * Upload Quote Document for Budget Allocation
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import type { Database } from '@/lib/types/supabase'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

export interface UploadQuoteInput {
  projectId: string
  category?: BudgetCategory | null
  file: File
}

export async function uploadQuote(
  input: UploadQuoteInput
): Promise<ActionResponse<{ quoteId: string; filePath: string }>> {
  console.log('📤 uploadQuote: Starting upload process')

  try {
    const { projectId, category, file } = input

    console.log('📤 uploadQuote: Input data:', {
      projectId,
      category,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    // Validate required fields
    if (!file || !projectId) {
      console.error('❌ uploadQuote: Missing required fields')
      return { success: false, error: 'Missing required fields' }
    }

    // Validate file type (PDF, PNG, JPG, HEIC)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/jpg']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      console.error('❌ uploadQuote: Invalid file type:', file.type)
      return {
        success: false,
        error: 'Invalid file type. Please upload PDF, JPEG, PNG, or HEIC.',
      }
    }

    // Validate file size (max 25MB)
    const maxSize = 26214400 // 25MB in bytes
    if (file.size > maxSize) {
      console.error('❌ uploadQuote: File size exceeds limit:', file.size)
      return {
        success: false,
        error: 'File size exceeds 25MB limit. Please upload a smaller file.',
      }
    }

    const supabase = await createClient()
    console.log('📤 uploadQuote: Supabase client created')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ uploadQuote: No user found')
      throw new UnauthorizedError('You must be logged in')
    }

    console.log('📤 uploadQuote: User authenticated:', user.id)

    // Verify project access (manager or supervisor)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (accessError || !access || !['manager', 'supervisor'].includes(access.role)) {
      console.error('❌ uploadQuote: Access denied', { accessError, access })
      throw new UnauthorizedError('Only managers and supervisors can upload quotes')
    }

    console.log('📤 uploadQuote: Access verified, role:', access.role)

    // Generate quote ID first (for consistent file path)
    const quoteId = crypto.randomUUID()

    // Upload file to storage: project-quotes/{projectId}/{quoteId}/{filename}
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${timestamp}-${sanitizedFileName}`
    const filePath = `${projectId}/${quoteId}/${fileName}`

    console.log('📤 uploadQuote: Uploading file to storage:', filePath)

    const { error: uploadError } = await supabase.storage
      .from('project-quotes')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ uploadQuote: File upload failed:', uploadError)
      return { success: false, error: `Failed to upload file: ${uploadError.message}` }
    }

    console.log('✅ uploadQuote: File uploaded successfully')

    // Create quote record (AI parsing happens later in separate step)
    console.log('📤 uploadQuote: Creating quote record in database')
    const insertData: any = {
      id: quoteId,
      project_id: projectId,
      budget_category: category || null,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      ai_parsed: false, // Will be set to true after AI parsing
      uploaded_by: user.id,
    }
    const { data: quote, error: quoteError } = await supabase
      .from('project_quotes')
      .insert(insertData)
      .select('id')
      .single()

    if (quoteError) {
      console.error('❌ uploadQuote: Database insertion failed:', quoteError)
      // Clean up uploaded file on error
      await supabase.storage.from('project-quotes').remove([filePath])
      return { success: false, error: quoteError.message }
    }

    console.log('✅ uploadQuote: Quote record created successfully, ID:', quote.id)

    return {
      success: true,
      data: {
        quoteId: quote.id,
        filePath,
      },
    }
  } catch (error) {
    console.error('❌ uploadQuote: Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload quote',
    }
  }
}
