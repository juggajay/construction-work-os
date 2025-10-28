/**
 * Confirm Line Items from AI-Parsed Quote
 * Saves reviewed/edited line items to database after PM confirmation
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import type { ParsedLineItem } from '@/lib/utils/parse-quote'

export interface LineItemInput {
  description: string
  quantity: number | null
  unit_of_measure: string | null
  unit_price: number | null
  line_total: number
  line_number: number
  ai_confidence: number | null
  original_data?: any // Track what AI originally extracted
}

export interface ConfirmLineItemsInput {
  quoteId: string
  budgetId: string
  lineItems: LineItemInput[]
  corrections?: Record<string, any> // Track PM edits: { line_1: { original: {}, edited: {} } }
}

export async function confirmLineItems(
  input: ConfirmLineItemsInput
): Promise<ActionResponse<{ lineItemIds: string[] }>> {
  try {
    console.log('✅ confirmLineItems: Starting confirmation')
    console.log('   Quote ID:', input.quoteId)
    console.log('   Budget ID:', input.budgetId)
    console.log('   Line items:', input.lineItems.length)

    const { quoteId, budgetId, lineItems, corrections } = input

    if (!quoteId || !budgetId || !lineItems || lineItems.length === 0) {
      return { success: false, error: 'Missing required fields' }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    console.log('✅ confirmLineItems: User authenticated:', user.id)

    // Verify budget exists and get project_id
    const { data: budget, error: budgetError } = await supabase
      .from('project_budgets')
      .select('id, project_id, category')
      .eq('id', budgetId)
      .is('deleted_at', null)
      .single()

    if (budgetError || !budget) {
      console.error('❌ confirmLineItems: Budget not found:', budgetError)
      return { success: false, error: 'Budget not found' }
    }

    console.log('✅ confirmLineItems: Budget found, project:', budget.project_id)

    // Verify project access (manager or supervisor)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', budget.project_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (accessError || !access || !['manager', 'supervisor'].includes(access.role)) {
      console.error('❌ confirmLineItems: Access denied')
      throw new UnauthorizedError('Only managers and supervisors can confirm line items')
    }

    console.log('✅ confirmLineItems: Access verified, role:', access.role)

    // Verify quote exists
    const { data: quote, error: quoteError } = await supabase
      .from('project_quotes')
      .select('id, project_id')
      .eq('id', quoteId)
      .is('deleted_at', null)
      .single()

    if (quoteError || !quote) {
      console.error('❌ confirmLineItems: Quote not found:', quoteError)
      return { success: false, error: 'Quote not found' }
    }

    // Verify quote belongs to same project as budget
    if (quote.project_id !== budget.project_id) {
      console.error('❌ confirmLineItems: Quote/budget project mismatch')
      return { success: false, error: 'Quote and budget must belong to same project' }
    }

    // Prepare line items for insertion
    const lineItemsToInsert = lineItems.map((item) => ({
      project_budget_id: budgetId,
      project_quote_id: quoteId,
      line_number: item.line_number,
      description: item.description,
      quantity: item.quantity,
      unit_of_measure: item.unit_of_measure,
      unit_price: item.unit_price,
      line_total: item.line_total,
      ai_confidence: item.ai_confidence,
      ai_corrections: corrections || null,
      created_by: user.id,
    }))

    console.log('✅ confirmLineItems: Inserting line items...')

    // Bulk insert line items
    const { data: insertedItems, error: insertError } = await supabase
      .from('budget_line_items')
      .insert(lineItemsToInsert)
      .select('id')

    if (insertError) {
      console.error('❌ confirmLineItems: Insert failed:', insertError)
      return { success: false, error: `Failed to save line items: ${insertError.message}` }
    }

    console.log('✅ confirmLineItems: Line items inserted:', insertedItems.length)

    // Mark quote as AI parsed
    const { error: updateQuoteError } = await supabase
      .from('project_quotes')
      .update({ ai_parsed: true })
      .eq('id', quoteId)

    if (updateQuoteError) {
      console.error('⚠️  confirmLineItems: Failed to update quote ai_parsed flag:', updateQuoteError)
      // Don't fail the whole operation
    }

    console.log('✅ confirmLineItems: Quote marked as parsed')

    // Refresh materialized view (happens automatically via trigger, but log it)
    console.log('🔄 confirmLineItems: Materialized view will refresh automatically via trigger')

    return {
      success: true,
      data: {
        lineItemIds: insertedItems.map((item) => item.id),
      },
    }
  } catch (error) {
    console.error('❌ confirmLineItems: Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm line items',
    }
  }
}
