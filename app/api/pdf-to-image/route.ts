/**
 * PDF to Image Conversion API Route
 *
 * TEMPORARY: Disabled due to canvas native dependency issues in Vercel serverless
 * TODO: Implement using a browser-based solution or external PDF service
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'PDF conversion temporarily unavailable',
      details: 'Please upload an image file (JPG, PNG, HEIC) instead of PDF',
    },
    { status: 503 }
  )
}
