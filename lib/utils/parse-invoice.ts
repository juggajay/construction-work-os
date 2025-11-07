/**
 * Parse invoice using OpenAI Vision API
 *
 * Note: Only supports image files (JPEG, PNG, HEIC)
 * PDFs must be converted to images before calling this function
 */

import OpenAI from 'openai'

export interface ParsedInvoiceData {
  vendorName: string
  invoiceNumber: string
  invoiceDate: string // YYYY-MM-DD format
  amount: number
  description: string
  lineItems?: Array<{
    description: string
    quantity?: number
    unitPrice?: number
    amount: number
  }>
  // AI metadata
  confidence?: number // 0-1 score
  rawResponse?: any // Full OpenAI response for audit
}

export async function parseInvoiceWithAI(fileBuffer: Buffer, mimeType: string): Promise<ParsedInvoiceData> {
  try {
    // Check for API key at runtime
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    // Validate that we're receiving an image
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/heic']
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid MIME type: ${mimeType}. Only images are supported. PDFs must be converted first.`)
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Convert buffer to base64
    const base64Image = fileBuffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Latest model with vision capabilities
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting structured data from invoices.
Extract the following information from the invoice image:
- Vendor name (company that issued the invoice)
- Invoice number
- Invoice date (convert to YYYY-MM-DD format)
- Total amount (as a number, no currency symbols)
- Brief description of services/products
- Line items if available (description, quantity, unit price, amount)

Return the data as a JSON object with this exact structure:
{
  "vendorName": "string",
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "amount": number,
  "description": "string",
  "lineItems": [{"description": "string", "quantity": number, "unitPrice": number, "amount": number}]
}

If you cannot find a field, use reasonable defaults:
- vendorName: "Unknown Vendor"
- invoiceNumber: "N/A"
- invoiceDate: today's date
- amount: 0
- description: "No description available"
- lineItems: []`,
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
              text: 'Please extract all invoice information from this image.',
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for more consistent extraction
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Strip markdown code fences if present (OpenAI sometimes wraps JSON in ```json ... ```)
    let jsonContent = content.trim()
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

    // Parse the JSON response
    const parsed = JSON.parse(jsonContent) as ParsedInvoiceData

    // Calculate confidence score based on field completeness
    let confidence = 1.0
    const today = new Date().toISOString().split('T')[0] as string

    // Reduce confidence for missing/default fields
    if (!parsed.vendorName || parsed.vendorName === 'Unknown Vendor') confidence -= 0.2
    if (!parsed.invoiceNumber || parsed.invoiceNumber === 'N/A') confidence -= 0.15
    if (!parsed.invoiceDate || !validateDate(parsed.invoiceDate)) confidence -= 0.15
    if (!parsed.amount || parsed.amount === 0) confidence -= 0.3
    if (!parsed.description) confidence -= 0.1
    if (!parsed.lineItems || parsed.lineItems.length === 0) confidence -= 0.1

    // Ensure confidence stays in 0-1 range
    confidence = Math.max(0, Math.min(1, confidence))

    return {
      vendorName: parsed.vendorName || 'Unknown Vendor',
      invoiceNumber: parsed.invoiceNumber || 'N/A',
      invoiceDate: validateDate(parsed.invoiceDate) ?? today,
      amount: Number(parsed.amount) || 0,
      description: parsed.description || 'No description available',
      lineItems: parsed.lineItems || [],
      confidence,
      rawResponse: response, // Store full OpenAI response for audit
    }
  } catch (error) {
    console.error('Error parsing invoice with AI:', error)
    throw new Error(
      error instanceof Error ? error.message : 'Failed to parse invoice. Please try again or enter data manually.'
    )
  }
}

function validateDate(dateString: string): string | null {
  if (!dateString) return null

  // Try to parse the date
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null

  // Return in YYYY-MM-DD format
  return date.toISOString().split('T')[0] as string
}
