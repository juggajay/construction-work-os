/**
 * Supabase Mock Utilities
 * Helpers for mocking Supabase client in tests
 */

import { vi } from 'vitest'

export interface MockSupabaseResponse<T = any> {
  data: T | null
  error: { message: string; code?: string } | null
}

export function createMockSupabaseClient(overrides: any = {}) {
  const mockClient = {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: null
      }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/file.jpg' }
        }),
      })),
    },
    ...overrides,
  }

  return mockClient
}

// Mock successful responses
export function mockSuccessResponse<T>(data: T): MockSupabaseResponse<T> {
  return { data, error: null }
}

// Mock error responses
export function mockErrorResponse(
  message: string,
  code?: string
): MockSupabaseResponse {
  return {
    data: null,
    error: { message, code },
  }
}

// Common test data
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  created_at: '2025-01-01T00:00:00Z',
}

export const mockOrganization = {
  id: '223e4567-e89b-12d3-a456-426614174000',
  name: 'Test Construction Co',
  slug: 'test-construction',
  settings: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  deleted_at: null,
}

export const mockProject = {
  id: '323e4567-e89b-12d3-a456-426614174000',
  org_id: mockOrganization.id,
  name: 'Sunset Tower Project',
  number: 'P-00001',
  address: '123 Main St, City, ST 12345',
  status: 'active',
  budget: '1500000.00',
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  settings: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  deleted_at: null,
}
