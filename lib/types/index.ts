/**
 * Shared application types
 */

import type {
  Database,
  Organization,
  OrganizationInsert,
  OrganizationInsert as OrganizationUpdate,
  Project,
  ProjectInsert,
  ProjectUpdate,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  OrganizationMember,
  OrganizationMemberInsert,
  OrganizationMemberUpdate,
  ProjectAccess,
  ProjectAccessInsert,
  ProjectAccessUpdate,
  AuditLog,
  OrgRole,
  ProjectRole,
  ProjectStatus,
  AuditAction,
} from './database'

// ============================================================================
// RE-EXPORTS FROM DATABASE
// ============================================================================

export type {
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  Project,
  ProjectInsert,
  ProjectUpdate,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  OrganizationMember,
  OrganizationMemberInsert,
  OrganizationMemberUpdate,
  ProjectAccess,
  ProjectAccessInsert,
  ProjectAccessUpdate,
  AuditLog,
  OrgRole,
  ProjectRole,
  ProjectStatus,
  AuditAction,
  Database,
}

// ============================================================================
// SUPABASE CLIENT TYPES
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

export type TypedSupabaseClient = SupabaseClient<Database>

// ============================================================================
// SERVER ACTION RESPONSE TYPES
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export type ActionError = {
  success: false
  error: string
  fieldErrors?: Record<string, string[]>
}

export type ActionSuccess<T = void> = {
  success: true
  data: T
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface UserWithProfile {
  id: string
  email: string
  profile: Profile | null
}

export interface SessionUser {
  id: string
  email: string | undefined
  role?: string
}

// ============================================================================
// MULTI-TENANT CONTEXT TYPES
// ============================================================================

export interface OrganizationContext {
  organization: Organization
  role: OrgRole
  memberId: string
}

export interface ProjectContext {
  project: Project
  organization: Organization
  role: ProjectRole
  accessId: string
}

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

export interface OrganizationWithMemberCount extends Organization {
  memberCount: number
  projectCount: number
}

export interface ProjectWithOrganization extends Project {
  organization: Pick<Organization, 'id' | 'name' | 'slug'>
}

export interface OrganizationMemberWithProfile extends OrganizationMember {
  profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
  invitedByProfile: Pick<Profile, 'id' | 'full_name'> | null
}

export interface ProjectAccessWithProfile extends ProjectAccess {
  profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface OrganizationFilters extends PaginationParams {
  search?: string
}

export interface ProjectFilters extends PaginationParams {
  orgId?: string
  status?: ProjectStatus | ProjectStatus[]
  search?: string
}

export interface MemberFilters extends PaginationParams {
  orgId: string
  role?: OrgRole | OrgRole[]
  search?: string
}
