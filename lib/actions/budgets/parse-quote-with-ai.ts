/**
 * Parse Quote with AI (OpenAI Vision API)
 * Server action for extracting line items from uploaded quotes
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { parseQuoteWithAI, type ParsedQuoteData } from '@/lib/utils/parse-quote'
import { logger } from '@/lib/utils/logger'

export interface ParseQuoteInput {
  quoteId: string
}

export async function parseQuoteWithAIAction(
  input: ParseQuoteInput
): Promise<ActionResponse<ParsedQuoteData>> {
  try {
    logger.debug('Starting AI quote parse', {
      action: 'parseQuoteWithAIAction',
      quoteId: input.quoteId,
    })

    const { quoteId } = input

    if (!quoteId) {
      return { success: false, error: 'Quote ID is required' }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    logger.debug('User authenticated', {
      action: 'parseQuoteWithAIAction',
      userId: user.id,
    })

    // Fetch quote record to get file path and verify access
    const { data: quote, error: quoteError } = await supabase
      .from('project_quotes')
      .select('id, project_id, file_path, mime_type, ai_parsed')
      .eq('id', quoteId)
      .is('deleted_at', null)
      .single()

    if (quoteError || !quote) {
      logger.error('Quote not found', quoteError || new Error('Quote not found'), {
        action: 'parseQuoteWithAIAction',
        quoteId,
      })
      return { success: false, error: 'Quote not found' }
    }

    logger.debug('Quote found', {
      action: 'parseQuoteWithAIAction',
      quoteId: quote.id,
      projectId: quote.project_id,
    })

    // Verify project access
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', quote.project_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (accessError || !access) {
      logger.error('Access denied to project', accessError || new Error('No access'), {
        action: 'parseQuoteWithAIAction',
        projectId: quote.project_id,
        userId: user.id,
      })
      throw new UnauthorizedError('You do not have access to this project')
    }

    logger.debug('Access verified', {
      action: 'parseQuoteWithAIAction',
      role: access.role,
    })

    // Download file from storage
    logger.debug('Downloading file from storage', {
      action: 'parseQuoteWithAIAction',
      filePath: quote.file_path,
    })
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('project-quotes')
      .download(quote.file_path)

    if (downloadError || !fileData) {
      logger.error('File download failed', downloadError || new Error('Download failed'), {
        action: 'parseQuoteWithAIAction',
        filePath: quote.file_path,
      })
      return { success: false, error: 'Failed to download quote file' }
    }

    logger.debug('File downloaded successfully', {
      action: 'parseQuoteWithAIAction',
      fileSize: fileData.size,
    })

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse quote with OpenAI Vision API
    logger.debug('Sending to AI for parsing', {
      action: 'parseQuoteWithAIAction',
      mimeType: quote.mime_type,
      fileSize: buffer.length,
    })
    const parsedData = await parseQuoteWithAI(buffer, quote.mime_type)

    logger.info('AI parsing complete', {
      action: 'parseQuoteWithAIAction',
      lineItemsExtracted: parsedData.line_items.length,
      confidence: parsedData.confidence,
      vendor: parsedData.vendor,
    })

    // Update quote record with AI metadata (but don't save line items yet - that happens in confirm step)
    const { error: updateError } = await supabase
      .from('project_quotes')
      .update({
        ai_confidence: parsedData.confidence,
        ai_raw_response: parsedData as any, // Store full response for debugging
        vendor_name: parsedData.vendor,
        quote_number: parsedData.quote_number,
        quote_date: parsedData.quote_date,
        total_amount: parsedData.total_amount,
      })
      .eq('id', quoteId)

    if (updateError) {
      logger.warn('Failed to update quote metadata', {
        action: 'parseQuoteWithAIAction',
        quoteId,
        error: updateError.message,
      })
      // Don't fail the whole operation - just log the error
    }

    logger.info('Quote metadata updated successfully', {
      action: 'parseQuoteWithAIAction',
      quoteId,
    })

    return { success: true, data: parsedData }
  } catch (error) {
    logger.error('Error during AI quote parsing', error as Error, {
      action: 'parseQuoteWithAIAction',
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse quote',
    }
  }
}
