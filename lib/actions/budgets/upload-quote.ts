/**
 * Upload Quote Document for Budget Allocation
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import type { Database } from '@/lib/types/supabase'
import { logger } from '@/lib/utils/logger'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

export interface UploadQuoteInput {
  projectId: string
  category?: BudgetCategory | null
  file: File
}

export async function uploadQuote(
  input: UploadQuoteInput
): Promise<ActionResponse<{ quoteId: string; filePath: string }>> {
  logger.debug('Starting quote upload process', {
    action: 'uploadQuote',
  })

  try {
    const { projectId, category, file } = input

    logger.debug('Quote upload input data', {
      action: 'uploadQuote',
      projectId,
      category,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    // Validate required fields
    if (!file || !projectId) {
      logger.error('Missing required fields', new Error('Validation failed'), {
        action: 'uploadQuote',
        hasFile: !!file,
        hasProjectId: !!projectId,
      })
      return { success: false, error: 'Missing required fields' }
    }

    // Validate file type (PDF, PNG, JPG, HEIC)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/jpg']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      logger.error('Invalid file type', new Error('Invalid file type'), {
        action: 'uploadQuote',
        fileType: file.type,
        allowedTypes,
      })
      return {
        success: false,
        error: 'Invalid file type. Please upload PDF, JPEG, PNG, or HEIC.',
      }
    }

    // Validate file size (max 25MB)
    const maxSize = 26214400 // 25MB in bytes
    if (file.size > maxSize) {
      logger.error('File size exceeds limit', new Error('File too large'), {
        action: 'uploadQuote',
        fileSize: file.size,
        maxSize,
      })
      return {
        success: false,
        error: 'File size exceeds 25MB limit. Please upload a smaller file.',
      }
    }

    const supabase = await createClient()
    logger.debug('Supabase client created', {
      action: 'uploadQuote',
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.error('No user found', new Error('Authentication required'), {
        action: 'uploadQuote',
      })
      throw new UnauthorizedError('You must be logged in')
    }

    logger.debug('User authenticated', {
      action: 'uploadQuote',
      userId: user.id,
    })

    // Verify project access (manager or supervisor)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (accessError || !access || !['manager', 'supervisor'].includes(access.role)) {
      logger.error('Access denied', accessError || new Error('Insufficient permissions'), {
        action: 'uploadQuote',
        projectId,
        role: access?.role,
      })
      throw new UnauthorizedError('Only managers and supervisors can upload quotes')
    }

    logger.debug('Access verified', {
      action: 'uploadQuote',
      role: access.role,
    })

    // Generate quote ID first (for consistent file path)
    const quoteId = crypto.randomUUID()

    // Upload file to storage: project-quotes/{projectId}/{quoteId}/{filename}
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${timestamp}-${sanitizedFileName}`
    const filePath = `${projectId}/${quoteId}/${fileName}`

    logger.debug('Uploading file to storage', {
      action: 'uploadQuote',
      filePath,
      fileSize: file.size,
    })

    const { error: uploadError } = await supabase.storage
      .from('project-quotes')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      logger.error('File upload to storage failed', uploadError, {
        action: 'uploadQuote',
        filePath,
      })
      return { success: false, error: `Failed to upload file: ${uploadError.message}` }
    }

    logger.debug('File uploaded successfully to storage', {
      action: 'uploadQuote',
      filePath,
    })

    // Create quote record (AI parsing happens later in separate step)
    logger.debug('Creating quote record in database', {
      action: 'uploadQuote',
      quoteId,
      projectId,
      category,
    })
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
      logger.error('Database insertion failed', quoteError, {
        action: 'uploadQuote',
        quoteId,
      })
      // Clean up uploaded file on error
      await supabase.storage.from('project-quotes').remove([filePath])
      return { success: false, error: quoteError.message }
    }

    logger.info('Quote uploaded successfully', {
      action: 'uploadQuote',
      quoteId: quote.id,
      projectId,
      fileName: file.name,
    })

    return {
      success: true,
      data: {
        quoteId: quote.id,
        filePath,
      },
    }
  } catch (error) {
    logger.error('Unexpected error during quote upload', error as Error, {
      action: 'uploadQuote',
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload quote',
    }
  }
}
