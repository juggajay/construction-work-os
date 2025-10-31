import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Rate limiting map (in-memory - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Lazy cleanup: Clean up expired entries during rate limit checks instead of using setInterval
// This is more efficient and doesn't keep the event loop busy in serverless environments
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
}

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  // Perform lazy cleanup on each check (more efficient than setInterval)
  if (Math.random() < 0.1) { // Only cleanup 10% of the time to reduce overhead
    cleanupExpiredEntries()
  }

  const now = Date.now()
  const limit = 5 // 5 submissions per hour
  const windowMs = 3600000 // 1 hour

  const record = rateLimitMap.get(identifier)

  if (!record || record.resetTime < now) {
    // New window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check rate limit
    const { allowed, remaining } = checkRateLimit(ip)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '3600',
          },
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()

    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!body.source || typeof body.source !== 'string') {
      return NextResponse.json(
        { error: 'Source is required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(body.email)

    // Additional validation
    if (sanitizedEmail.length < 3) {
      return NextResponse.json(
        { error: 'Email too short' },
        { status: 400 }
      )
    }

    // Store in database
    const supabase = await createClient()

    // Check if email already exists (optional - prevent duplicates)
    // Note: Types will be available after running migration and regenerating types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('email_captures')
      .select('id')
      .eq('email', sanitizedEmail)
      .single()

    if (existing) {
      // Email already captured - still return success for UX
      return NextResponse.json(
        { success: true, message: 'Email captured successfully' },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': remaining.toString(),
          },
        }
      )
    }

    // Insert new email capture
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('email_captures')
      .insert({
        email: sanitizedEmail,
        source: body.source,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || 'unknown',
        captured_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Email captured successfully' },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Email capture error:', error)

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
