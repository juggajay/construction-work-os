/**
 * Parse invoice using OpenAI Vision API
 */

import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
}

export async function parseInvoiceWithAI(fileBuffer: Buffer, mimeType: string): Promise<ParsedInvoiceData> {
  try {
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

    // Parse the JSON response
    const parsed = JSON.parse(content) as ParsedInvoiceData

    // Validate and sanitize the data
    const today = new Date().toISOString().split('T')[0] as string
    return {
      vendorName: parsed.vendorName || 'Unknown Vendor',
      invoiceNumber: parsed.invoiceNumber || 'N/A',
      invoiceDate: validateDate(parsed.invoiceDate) ?? today,
      amount: Number(parsed.amount) || 0,
      description: parsed.description || 'No description available',
      lineItems: parsed.lineItems || [],
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
