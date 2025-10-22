/**
 * Unit tests for project Server Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProject } from '../project'
import {
  mockSuccessResponse,
  mockErrorResponse,
  mockUser,
  mockOrganization,
  mockProject,
} from '@/lib/test-utils/supabase-mock'
import { createClient } from '@/lib/supabase/server'

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('createProject', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('should create project successfully when user is org admin', async () => {
    // Arrange: Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock is_org_admin check (returns true)
    mockSupabase.rpc
      .mockResolvedValueOnce(mockSuccessResponse(true)) // is_org_admin
      .mockResolvedValueOnce(
        mockSuccessResponse([
          {
            project_id: mockProject.id,
            project_name: mockProject.name,
            project_org_id: mockProject.org_id,
            project_number: mockProject.number,
            project_address: mockProject.address,
            project_status: mockProject.status,
            project_budget: mockProject.budget,
            project_start_date: mockProject.start_date,
            project_end_date: mockProject.end_date,
          },
        ])
      ) // create_project_with_access

    // Mock org fetch for revalidation
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { slug: mockOrganization.slug },
        error: null,
      }),
    })

    // Act: Create project
    const result = await createProject({
      orgId: mockOrganization.id,
      name: 'Sunset Tower Project',
      number: 'P-00001',
      address: '123 Main St',
      status: 'planning',
    })

    // Assert: Successful creation
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toMatchObject({
        id: mockProject.id,
        name: 'Sunset Tower Project',
        org_id: mockOrganization.id,
      })
    }

    // Verify RPC was called with correct params
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'create_project_with_access',
      expect.objectContaining({
        p_org_id: mockOrganization.id,
        p_name: 'Sunset Tower Project',
      })
    )
  })

  it('should fail if user is not authenticated', async () => {
    // Arrange: No authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    // Act: Attempt to create project
    const result = await createProject({
      orgId: mockOrganization.id,
      name: 'Test Project',
    })

    // Assert: Should fail with auth error
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Authentication required')
    }
  })

  it('should fail if user is not org admin', async () => {
    // Arrange: Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock is_org_admin check (returns false)
    mockSupabase.rpc.mockResolvedValueOnce(mockSuccessResponse(false))

    // Act: Attempt to create project
    const result = await createProject({
      orgId: mockOrganization.id,
      name: 'Test Project',
    })

    // Assert: Should fail with permission error
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('admin')
    }

    // Should only check is_org_admin, not create project
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1)
  })

  it('should handle optional fields correctly', async () => {
    // Arrange: Mock authenticated user and admin check
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.rpc
      .mockResolvedValueOnce(mockSuccessResponse(true))
      .mockResolvedValueOnce(
        mockSuccessResponse([
          {
            project_id: mockProject.id,
            project_name: 'Minimal Project',
            project_org_id: mockOrganization.id,
            project_number: null,
            project_address: null,
            project_status: 'planning',
            project_budget: null,
            project_start_date: null,
            project_end_date: null,
          },
        ])
      )

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { slug: 'test-org' },
        error: null,
      }),
    })

    // Act: Create project with minimal fields
    const result = await createProject({
      orgId: mockOrganization.id,
      name: 'Minimal Project',
    })

    // Assert: Should succeed with defaults
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toMatchObject({
        name: 'Minimal Project',
        number: null,
        budget: null,
      })
    }

    // Verify RPC called with nulls for optional fields
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'create_project_with_access',
      expect.objectContaining({
        p_number: null,
        p_address: null,
        p_budget: null,
        p_start_date: null,
        p_end_date: null,
      })
    )
  })

  it('should handle RPC database error', async () => {
    // Arrange: Mock authenticated user and admin
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    mockSupabase.rpc
      .mockResolvedValueOnce(mockSuccessResponse(true))
      .mockResolvedValueOnce(
        mockErrorResponse('Foreign key constraint violation', '23503')
      )

    // Act: Create project
    const result = await createProject({
      orgId: mockOrganization.id,
      name: 'Test Project',
    })

    // Assert: Should fail with error
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Foreign key')
    }
  })
})
