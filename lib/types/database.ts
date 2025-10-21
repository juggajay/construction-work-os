/**
 * Database type definitions
 * Based on schema in supabase/migrations/20250120000000_initial_schema.sql
 *
 * Note: After applying migrations, regenerate with:
 * npx supabase gen types typescript --local > lib/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// ENUMS
// ============================================================================

export type OrgRole = 'owner' | 'admin' | 'member'
export type ProjectRole = 'manager' | 'supervisor' | 'viewer'
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Organization {
  id: string
  name: string
  slug: string
  settings: Json
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface OrganizationInsert {
  id?: string
  name: string
  slug: string
  settings?: Json
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface OrganizationUpdate {
  id?: string
  name?: string
  slug?: string
  settings?: Json
  updated_at?: string
  deleted_at?: string | null
}

export interface Project {
  id: string
  org_id: string
  name: string
  number: string | null
  address: string | null
  status: ProjectStatus
  budget: string | null // DECIMAL stored as string
  start_date: string | null
  end_date: string | null
  settings: Json
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProjectInsert {
  id?: string
  org_id: string
  name: string
  number?: string | null
  address?: string | null
  status?: ProjectStatus
  budget?: string | null
  start_date?: string | null
  end_date?: string | null
  settings?: Json
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface ProjectUpdate {
  id?: string
  org_id?: string
  name?: string
  number?: string | null
  address?: string | null
  status?: ProjectStatus
  budget?: string | null
  start_date?: string | null
  end_date?: string | null
  settings?: Json
  updated_at?: string
  deleted_at?: string | null
}

export interface Profile {
  id: string // References auth.users(id)
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  settings: Json
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  full_name?: string | null
  avatar_url?: string | null
  phone?: string | null
  settings?: Json
  created_at?: string
  updated_at?: string
}

export interface ProfileUpdate {
  full_name?: string | null
  avatar_url?: string | null
  phone?: string | null
  settings?: Json
  updated_at?: string
}

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: OrgRole
  invited_by: string | null
  invited_at: string
  joined_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface OrganizationMemberInsert {
  id?: string
  org_id: string
  user_id: string
  role?: OrgRole
  invited_by?: string | null
  invited_at?: string
  joined_at?: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface OrganizationMemberUpdate {
  role?: OrgRole
  joined_at?: string | null
  updated_at?: string
  deleted_at?: string | null
}

export interface ProjectAccess {
  id: string
  project_id: string
  user_id: string
  role: ProjectRole
  trade: string | null
  granted_by: string | null
  granted_at: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProjectAccessInsert {
  id?: string
  project_id: string
  user_id: string
  role?: ProjectRole
  trade?: string | null
  granted_by?: string | null
  granted_at?: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface ProjectAccessUpdate {
  role?: ProjectRole
  trade?: string | null
  updated_at?: string
  deleted_at?: string | null
}

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: AuditAction
  old_values: Json | null
  new_values: Json | null
  user_id: string | null
  ip_address: string | null
  user_agent: string | null
  timestamp: string
}

// ============================================================================
// DATABASE SCHEMA TYPE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: OrganizationInsert
        Update: OrganizationUpdate
      }
      projects: {
        Row: Project
        Insert: ProjectInsert
        Update: ProjectUpdate
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      organization_members: {
        Row: OrganizationMember
        Insert: OrganizationMemberInsert
        Update: OrganizationMemberUpdate
      }
      project_access: {
        Row: ProjectAccess
        Insert: ProjectAccessInsert
        Update: ProjectAccessUpdate
      }
      audit_logs: {
        Row: AuditLog
        Insert: never // Only triggers can insert
        Update: never // Immutable
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_org_ids: {
        Args: { user_uuid?: string }
        Returns: { org_id: string }[]
      }
      user_project_ids: {
        Args: { user_uuid?: string }
        Returns: { project_id: string }[]
      }
      is_org_admin: {
        Args: { user_uuid: string; check_org_id: string }
        Returns: boolean
      }
      is_project_manager: {
        Args: { user_uuid: string; check_project_id: string }
        Returns: boolean
      }
      get_audit_history: {
        Args: {
          p_table_name: string
          p_record_id: string
          p_limit?: number
        }
        Returns: {
          id: string
          action: AuditAction
          old_values: Json | null
          new_values: Json | null
          user_id: string | null
          user_email: string | null
          timestamp: string
        }[]
      }
    }
    Enums: {
      org_role: OrgRole
      project_role: ProjectRole
      project_status: ProjectStatus
    }
  }
}
