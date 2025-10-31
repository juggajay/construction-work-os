/**
 * PDF to Image Conversion API Route
 *
 * Converts the first page of a PDF to a PNG image
 * This runs in an API route context where pdfjs-dist and canvas can be properly bundled
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { Canvas } from 'canvas'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    // Load PDF
    const pdf = await getDocument({ data: pdfBuffer }).promise
    const page = await pdf.getPage(1) // Get first page

    // Set scale for better quality
    const scale = 2.0
    const viewport = page.getViewport({ scale })

    // Create canvas
    const canvas = new Canvas(viewport.width, viewport.height)
    const context = canvas.getContext('2d')

    // Render PDF page to canvas
    await page.render({
      canvasContext: context as any,
      viewport: viewport,
      canvas: canvas as any,
    }).promise

    // Convert canvas to PNG buffer
    const imageBuffer = canvas.toBuffer('image/png')

    // Return the image as a response (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error converting PDF to image:', error)
    return NextResponse.json(
      {
        error: 'Failed to convert PDF to image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
