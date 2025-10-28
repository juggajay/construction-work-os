/**
 * Parse construction quotes using OpenAI Vision API
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

import OpenAI from 'openai'
import type { Database } from '@/lib/types/supabase'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

// Lazy initialization to avoid build-time errors
let openaiInstance: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

export interface ParsedLineItem {
  line_number: number
  description: string
  quantity: number | null
  unit_of_measure: string | null
  unit_price: number | null
  line_total: number
  category_hint: BudgetCategory | null
  confidence: number // 0.0 to 1.0
}

export interface ParsedQuoteData {
  vendor: string | null
  quote_number: string | null
  quote_date: string | null // YYYY-MM-DD format
  line_items: ParsedLineItem[]
  total_amount: number
  confidence: number // Overall confidence 0.0 to 1.0
}

/**
 * Parse a construction quote document using OpenAI Vision API
 * Extracts line items with quantities, unit prices, and category hints
 */
export async function parseQuoteWithAI(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ParsedQuoteData> {
  try {
    console.log('🤖 parseQuoteWithAI: Starting AI extraction')
    console.log('   File size:', fileBuffer.length, 'bytes')
    console.log('   MIME type:', mimeType)

    // Convert buffer to base64
    const base64Image = fileBuffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Latest model with vision capabilities
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting line items from construction quotes and estimates.

Extract all line items from this quote document and return structured JSON.

Required fields per line item:
- line_number: Sequential number (1, 2, 3, ...)
- description: Full item description/specification
- quantity: Numeric quantity (decimal allowed, null if not found)
- unit_of_measure: Unit abbreviation (EA, LF, SF, HR, etc., null if not found)
- unit_price: Price per unit (decimal, null if not found)
- line_total: Total for this line (quantity × unit_price, or best estimate)
- category_hint: Best guess category based on description
- confidence: Your confidence in this line item extraction (0.0 to 1.0)

Category hints (use these exact values or null):
- "labor" - for labor, installation, man-hours, service work
- "materials" - for lumber, wire, panels, fixtures, supplies, equipment purchase
- "equipment" - for equipment rental, crane, lift, temporary structures
- "other" - for permits, fees, miscellaneous items
- null - if uncertain

Also extract quote-level metadata:
- vendor: Company name
- quote_number: Quote/estimate number
- quote_date: Date in YYYY-MM-DD format
- total_amount: Grand total

Return JSON format:
{
  "vendor": "string or null",
  "quote_number": "string or null",
  "quote_date": "YYYY-MM-DD or null",
  "line_items": [
    {
      "line_number": 1,
      "description": "...",
      "quantity": 0.0 or null,
      "unit_of_measure": "..." or null,
      "unit_price": 0.00 or null,
      "line_total": 0.00,
      "category_hint": "materials" or null,
      "confidence": 0.95
    }
  ],
  "total_amount": 0.00,
  "confidence": 0.95
}

If uncertain about a field, set to null. Provide overall confidence 0.0-1.0 for entire extraction.
Be thorough - extract ALL line items, even if formatting is inconsistent across pages.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
            {
              type: 'text',
              text: 'Please extract all line items and metadata from this construction quote/estimate.',
            },
          ],
        },
      ],
      max_tokens: 4000, // Allow for larger responses with many line items
      temperature: 0.1, // Low temperature for more consistent extraction
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI')
    }

    console.log('🤖 parseQuoteWithAI: Received response from OpenAI')

    // Parse the JSON response
    const parsed = JSON.parse(content) as ParsedQuoteData

    console.log('🤖 parseQuoteWithAI: Parsed response')
    console.log('   Vendor:', parsed.vendor)
    console.log('   Line items:', parsed.line_items?.length || 0)
    console.log('   Total amount:', parsed.total_amount)
    console.log('   Confidence:', parsed.confidence)

    // Validate and sanitize the data
    const today = new Date().toISOString().split('T')[0] as string
    const sanitized: ParsedQuoteData = {
      vendor: parsed.vendor || null,
      quote_number: parsed.quote_number || null,
      quote_date: validateDate(parsed.quote_date) || null,
      line_items: (parsed.line_items || []).map((item, index) => ({
        line_number: item.line_number || index + 1,
        description: item.description || 'No description',
        quantity: item.quantity !== null && item.quantity !== undefined ? Number(item.quantity) : null,
        unit_of_measure: item.unit_of_measure || null,
        unit_price: item.unit_price !== null && item.unit_price !== undefined ? Number(item.unit_price) : null,
        line_total: Number(item.line_total) || 0,
        category_hint: validateCategoryHint(item.category_hint),
        confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0.5)),
      })),
      total_amount: Number(parsed.total_amount) || 0,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
    }

    // Validate line item calculations
    sanitized.line_items = sanitized.line_items.map((item) => {
      // If we have quantity and unit_price, recalculate line_total
      if (item.quantity !== null && item.unit_price !== null) {
        const calculated = item.quantity * item.unit_price
        // If line_total is significantly different from calculation, use calculated value
        if (Math.abs(calculated - item.line_total) > 0.01) {
          console.log(`⚠️  Line ${item.line_number}: Recalculated line_total from ${item.line_total} to ${calculated}`)
          return { ...item, line_total: calculated }
        }
      }
      return item
    })

    console.log('✅ parseQuoteWithAI: Extraction complete')
    return sanitized
  } catch (error) {
    console.error('❌ parseQuoteWithAI: Error:', error)
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to parse quote. Please try again or enter line items manually.'
    )
  }
}

function validateDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null

  // Try to parse the date
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null

  // Return in YYYY-MM-DD format
  return date.toISOString().split('T')[0] as string
}

function validateCategoryHint(
  category: string | null | undefined
): BudgetCategory | null {
  if (!category) return null

  const valid: BudgetCategory[] = ['labor', 'materials', 'equipment', 'other']
  const normalized = category.toLowerCase()

  if (valid.includes(normalized as BudgetCategory)) {
    return normalized as BudgetCategory
  }

  return null
}
