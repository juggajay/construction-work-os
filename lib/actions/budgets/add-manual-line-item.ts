/**
 * Add Manual Line Item (without quote)
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface AddManualLineItemInput {
  budgetId: string
  description: string
  quantity?: number | null
  unit_of_measure?: string | null
  unit_price?: number | null
  line_total: number
}

export async function addManualLineItem(
  input: AddManualLineItemInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { budgetId, description, quantity, unit_of_measure, unit_price, line_total } = input

    if (!budgetId || !description || line_total === undefined) {
      return { success: false, error: 'Missing required fields' }
    }

    // Validate calculation if quantity and unit_price provided
    if (quantity !== null && unit_price !== null && quantity !== undefined && unit_price !== undefined) {
      const calculated = quantity * unit_price
      if (Math.abs(calculated - line_total) > 0.01) {
        return {
          success: false,
          error: `Line total mismatch: expected ${calculated.toFixed(2)}, got ${line_total.toFixed(2)}`,
        }
      }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    console.log('➕ addManualLineItem: Adding manual line item to budget:', budgetId)

    // Get the next line number for this budget
    const { data: existingItems } = await supabase
      .from('budget_line_items')
      .select('line_number')
      .eq('project_budget_id', budgetId)
      .is('deleted_at', null)
      .order('line_number', { ascending: false })
      .limit(1)

    const nextLineNumber = existingItems && existingItems.length > 0
      ? (existingItems[0]?.line_number || 0) + 1
      : 1

    // Insert manual line item (project_quote_id is NULL, ai_confidence is NULL)
    const { data, error } = await supabase
      .from('budget_line_items')
      .insert({
        project_budget_id: budgetId,
        project_quote_id: null, // Manual entry
        line_number: nextLineNumber,
        description,
        quantity: quantity || null,
        unit_of_measure: unit_of_measure || null,
        unit_price: unit_price || null,
        line_total,
        ai_confidence: null, // NULL indicates manual entry
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('❌ addManualLineItem: Insert failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ addManualLineItem: Manual line item added successfully')

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error('❌ addManualLineItem: Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add manual line item',
    }
  }
}
