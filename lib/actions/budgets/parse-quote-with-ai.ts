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

export interface ParseQuoteInput {
  quoteId: string
}

export async function parseQuoteWithAIAction(
  input: ParseQuoteInput
): Promise<ActionResponse<ParsedQuoteData>> {
  try {
    console.log('🤖 parseQuoteWithAIAction: Starting parse for quote:', input.quoteId)

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

    console.log('🤖 parseQuoteWithAIAction: User authenticated:', user.id)

    // Fetch quote record to get file path and verify access
    const { data: quote, error: quoteError } = await supabase
      .from('project_quotes')
      .select('id, project_id, file_path, mime_type, ai_parsed')
      .eq('id', quoteId)
      .is('deleted_at', null)
      .single()

    if (quoteError || !quote) {
      console.error('❌ parseQuoteWithAIAction: Quote not found:', quoteError)
      return { success: false, error: 'Quote not found' }
    }

    console.log('🤖 parseQuoteWithAIAction: Quote found:', quote.id)

    // Verify project access
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', quote.project_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (accessError || !access) {
      console.error('❌ parseQuoteWithAIAction: Access denied')
      throw new UnauthorizedError('You do not have access to this project')
    }

    console.log('🤖 parseQuoteWithAIAction: Access verified, role:', access.role)

    // Download file from storage
    console.log('🤖 parseQuoteWithAIAction: Downloading file from storage:', quote.file_path)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('project-quotes')
      .download(quote.file_path)

    if (downloadError || !fileData) {
      console.error('❌ parseQuoteWithAIAction: File download failed:', downloadError)
      return { success: false, error: 'Failed to download quote file' }
    }

    console.log('✅ parseQuoteWithAIAction: File downloaded, size:', fileData.size)

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse quote with OpenAI Vision API
    console.log('🤖 parseQuoteWithAIAction: Sending to AI for parsing...')
    const parsedData = await parseQuoteWithAI(buffer, quote.mime_type)

    console.log('✅ parseQuoteWithAIAction: AI parsing complete')
    console.log('   Line items extracted:', parsedData.line_items.length)
    console.log('   Overall confidence:', parsedData.confidence)

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
      console.error('⚠️  parseQuoteWithAIAction: Failed to update quote metadata:', updateError)
      // Don't fail the whole operation - just log the error
    }

    console.log('✅ parseQuoteWithAIAction: Quote metadata updated')

    return { success: true, data: parsedData }
  } catch (error) {
    console.error('❌ parseQuoteWithAIAction: Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse quote',
    }
  }
}
