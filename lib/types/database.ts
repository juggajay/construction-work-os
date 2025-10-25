/**
 * Database type definitions
 * Auto-generated from Supabase schema
 *
 * This file re-exports types from supabase.ts and creates convenient type aliases
 *
 * To regenerate:
 * supabase gen types typescript --project-id <project-ref> > lib/types/supabase.ts
 */

// Re-export everything from generated types
export * from './supabase'

// Re-export Database type
export type { Database } from './supabase'

// Import for creating type aliases
import type { Database } from './supabase'

// Create convenient type aliases for table rows
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert']
export type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update']

export type ProjectAccess = Database['public']['Tables']['project_access']['Row']
export type ProjectAccessInsert = Database['public']['Tables']['project_access']['Insert']
export type ProjectAccessUpdate = Database['public']['Tables']['project_access']['Update']

export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

// Change Order type aliases
export type ChangeOrder = Database['public']['Tables']['change_orders']['Row']
export type ChangeOrderInsert = Database['public']['Tables']['change_orders']['Insert']
export type ChangeOrderUpdate = Database['public']['Tables']['change_orders']['Update']

export type ChangeOrderLineItem = Database['public']['Tables']['change_order_line_items']['Row']
export type ChangeOrderLineItemInsert = Database['public']['Tables']['change_order_line_items']['Insert']
export type ChangeOrderLineItemUpdate = Database['public']['Tables']['change_order_line_items']['Update']

export type ChangeOrderApproval = Database['public']['Tables']['change_order_approvals']['Row']
export type ChangeOrderApprovalInsert = Database['public']['Tables']['change_order_approvals']['Insert']
export type ChangeOrderApprovalUpdate = Database['public']['Tables']['change_order_approvals']['Update']

export type ChangeOrderVersion = Database['public']['Tables']['change_order_versions']['Row']
export type ChangeOrderVersionInsert = Database['public']['Tables']['change_order_versions']['Insert']

export type ChangeOrderAttachment = Database['public']['Tables']['change_order_attachments']['Row']
export type ChangeOrderAttachmentInsert = Database['public']['Tables']['change_order_attachments']['Insert']

// Enum type aliases
export type OrgRole = Database['public']['Enums']['org_role']
export type ProjectRole = Database['public']['Enums']['project_role']
export type ProjectStatus = Database['public']['Enums']['project_status']
// AuditAction enum doesn't exist in the generated types - defining manually
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

export type ChangeOrderStatus = Database['public']['Enums']['change_order_status']
export type ChangeOrderType = Database['public']['Enums']['change_order_type']
export type OriginatingEventType = Database['public']['Enums']['originating_event_type']
export type ApprovalStage = Database['public']['Enums']['approval_stage']
export type ApprovalStatus = Database['public']['Enums']['approval_status']
export type AttachmentCategory = Database['public']['Enums']['attachment_category']
