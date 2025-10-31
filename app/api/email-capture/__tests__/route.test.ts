/**
 * Unit tests for email capture API endpoint
 * Tests validation, rate limiting, and database integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('POST /api/email-capture', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    }

    const { createClient } = require('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    // Clear rate limit map between tests
    vi.restoreAllMocks()
  })

  describe('Request validation', () => {
    it('should reject requests without email', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'exit-intent' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email is required')
    })

    it('should reject requests with non-string email', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 123, source: 'exit-intent' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email is required')
    })

    it('should reject requests without source', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Source is required')
    })

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test@.com',
        'test..test@example.com',
        '',
        'a@b',
      ]

      for (const email of invalidEmails) {
        const request = new NextRequest('http://localhost:3000/api/email-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'exit-intent' }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid email')
      }
    })

    it('should reject emails that are too short', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'a@', source: 'exit-intent' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
    })

    it('should accept valid email addresses', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@subdomain.example.com',
      ]

      for (const email of validEmails) {
        const request = new NextRequest('http://localhost:3000/api/email-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'exit-intent' }),
        })

        const response = await POST(request)

        expect(response.status).toBe(200)
      }
    })
  })

  describe('Email sanitization', () => {
    it('should convert email to lowercase', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'TEST@EXAMPLE.COM', source: 'exit-intent' }),
      })

      await POST(request)

      expect(mockSupabase.from).toHaveBeenCalledWith('email_captures')
      const insertCall = mockSupabase.from().insert
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      )
    })

    it('should trim whitespace from email', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '  test@example.com  ', source: 'exit-intent' }),
      })

      await POST(request)

      const insertCall = mockSupabase.from().insert
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      )
    })
  })

  describe('Duplicate prevention', () => {
    it('should return success for duplicate emails without inserting', async () => {
      // Mock existing email
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: '123', email: 'test@example.com' },
          error: null,
        }),
      }))

      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', source: 'exit-intent' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Email captured successfully')
    })
  })

  describe('Rate limiting', () => {
    it('should allow requests under rate limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ email: 'test@example.com', source: 'exit-intent' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    })

    it('should return rate limit headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.2',
        },
        body: JSON.stringify({ email: 'test@example.com', source: 'exit-intent' }),
      })

      const response = await POST(request)

      expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined()
    })

    it('should block requests exceeding rate limit', async () => {
      const ip = '192.168.1.3'

      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        const request = new NextRequest('http://localhost:3000/api/email-capture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': ip,
          },
          body: JSON.stringify({ email: `test${i}@example.com`, source: 'exit-intent' }),
        })

        await POST(request)
      }

      // 6th request should be blocked
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({ email: 'test6@example.com', source: 'exit-intent' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain('Too many requests')
      expect(response.headers.get('Retry-After')).toBe('3600')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    })
  })

  describe('Database integration', () => {
    it('should store email capture with metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.4',
          'user-agent': 'Mozilla/5.0 Test Browser',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          source: 'exit-intent',
        }),
      })

      await POST(request)

      const insertCall = mockSupabase.from().insert
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          source: 'exit-intent',
          ip_address: '192.168.1.4',
          user_agent: 'Mozilla/5.0 Test Browser',
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }))

      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', source: 'exit-intent' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to save email')
    })
  })

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Internal server error')
    })

    it('should use unknown IP when headers are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', source: 'exit-intent' }),
      })

      await POST(request)

      const insertCall = mockSupabase.from().insert
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          ip_address: 'unknown',
        })
      )
    })
  })
})
