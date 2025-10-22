/**
 * Unit tests for organization Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrganization } from '../organization'
import {
  mockSuccessResponse,
  mockErrorResponse,
  mockUser,
  mockOrganization,
} from '@/lib/test-utils/supabase-mock'
import { createClient } from '@/lib/supabase/server'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('createOrganization', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Create mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    }

    // Mock createClient to return our mock
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('should create organization successfully', async () => {
    // Arrange: Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock slug availability check (not exists)
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null, // Slug is available
        error: null,
      }),
    })

    // Mock RPC call to create org
    const rpcResult = [{
      organization_id: mockOrganization.id,
      organization_name: mockOrganization.name,
      organization_slug: mockOrganization.slug,
    }]
    mockSupabase.rpc.mockResolvedValue(mockSuccessResponse(rpcResult))

    // Act: Create organization
    const result = await createOrganization({
      name: 'Test Construction Co',
      slug: 'test-construction',
    })

    // Assert: Successful creation
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toMatchObject({
        id: mockOrganization.id,
        name: mockOrganization.name,
        slug: mockOrganization.slug,
      })
    }

    // Verify RPC was called with correct params
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'create_organization_with_member',
      {
        p_name: 'Test Construction Co',
        p_slug: 'test-construction',
      }
    )
  })

  it('should fail if user is not authenticated', async () => {
    // Arrange: No authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    // Act: Attempt to create organization
    const result = await createOrganization({
      name: 'Test Org',
      slug: 'test-org',
    })

    // Assert: Should fail with auth error
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Authentication required')
    }

    // Should not call RPC
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('should fail if slug is already in use', async () => {
    // Arrange: Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock slug already exists
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'existing-org-id' }, // Slug exists
        error: null,
      }),
    })

    // Act: Attempt to create org with existing slug
    const result = await createOrganization({
      name: 'Test Org',
      slug: 'existing-slug',
    })

    // Assert: Should fail with slug error
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('slug')
      expect(result.fieldErrors?.slug).toBeDefined()
    }

    // Should not call RPC
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('should handle RPC function failure', async () => {
    // Arrange: Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock slug is available
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })

    // Mock RPC failure
    mockSupabase.rpc.mockResolvedValue(
      mockErrorResponse('Database error', '42501')
    )

    // Act: Create organization
    const result = await createOrganization({
      name: 'Test Org',
      slug: 'test-org',
    })

    // Assert: Should fail with error message
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Database error')
    }
  })

  it('should handle empty RPC result', async () => {
    // Arrange: Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock slug is available
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })

    // Mock RPC returns empty array
    mockSupabase.rpc.mockResolvedValue(mockSuccessResponse([]))

    // Act: Create organization
    const result = await createOrganization({
      name: 'Test Org',
      slug: 'test-org',
    })

    // Assert: Should fail
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeDefined()
    }
  })
})
