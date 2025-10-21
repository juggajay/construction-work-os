/**
 * Project Server Actions
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createProjectSchema,
  updateProjectSchema,
  grantProjectAccessSchema,
  updateProjectAccessSchema,
  revokeProjectAccessSchema,
  deleteProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type GrantProjectAccessInput,
  type UpdateProjectAccessInput,
  type RevokeProjectAccessInput,
  type DeleteProjectInput,
} from '@/lib/schemas'
import type { ActionResponse, Project, ProjectAccess } from '@/lib/types'
import { withAction, success, revalidateProject } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors'

// ============================================================================
// CREATE PROJECT
// ============================================================================

export const createProject = withAction(
  createProjectSchema,
  async (data: CreateProjectInput): Promise<ActionResponse<Project>> => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Check if user is org admin
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      user_uuid: user.id,
      check_org_id: data.orgId,
    })

    if (!isAdmin) {
      throw new ForbiddenError(ErrorMessages.ORG_ADMIN_REQUIRED)
    }

    // Create project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        org_id: data.orgId,
        name: data.name,
        number: data.number,
        address: data.address,
        status: data.status,
        budget: data.budget,
        start_date: data.startDate,
        end_date: data.endDate,
      })
      .select()
      .single()

    if (error || !project) {
      return {
        success: false,
        error: error?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', data.orgId)
      .single()

    if (org) {
      revalidateProject(org.slug, project.id)
    }

    return success(project)
  }
)

// ============================================================================
// UPDATE PROJECT
// ============================================================================

export const updateProject = withAction(
  updateProjectSchema,
  async (
    data: UpdateProjectInput,
    projectId: string
  ): Promise<ActionResponse<Project>> => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get project to check org
    const { data: project } = await supabase
      .from('projects')
      .select('org_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      throw new NotFoundError(ErrorMessages.PROJECT_NOT_FOUND)
    }

    // Check if user is org admin or project manager
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      user_uuid: user.id,
      check_org_id: project.org_id,
    })

    const { data: isManager } = await supabase.rpc('is_project_manager', {
      user_uuid: user.id,
      check_project_id: projectId,
    })

    if (!isAdmin && !isManager) {
      throw new ForbiddenError(ErrorMessages.PROJECT_MANAGER_REQUIRED)
    }

    // Update project
    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update({
        name: data.name,
        number: data.number,
        address: data.address,
        status: data.status,
        budget: data.budget,
        start_date: data.startDate,
        end_date: data.endDate,
        settings: data.settings,
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error || !updatedProject) {
      return {
        success: false,
        error: error?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', project.org_id)
      .single()

    if (org) {
      revalidateProject(org.slug, projectId)
    }

    return success(updatedProject)
  }
)

// ============================================================================
// GRANT PROJECT ACCESS
// ============================================================================

export const grantProjectAccess = withAction(
  grantProjectAccessSchema,
  async (data: GrantProjectAccessInput): Promise<ActionResponse<ProjectAccess>> => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get project to check org
    const { data: project } = await supabase
      .from('projects')
      .select('org_id')
      .eq('id', data.projectId)
      .single()

    if (!project) {
      throw new NotFoundError(ErrorMessages.PROJECT_NOT_FOUND)
    }

    // Check if user is org admin or project manager
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      user_uuid: user.id,
      check_org_id: project.org_id,
    })

    const { data: isManager } = await supabase.rpc('is_project_manager', {
      user_uuid: user.id,
      check_project_id: data.projectId,
    })

    if (!isAdmin && !isManager) {
      throw new ForbiddenError(ErrorMessages.PROJECT_MANAGER_REQUIRED)
    }

    // Check if user already has access
    const { data: existingAccess } = await supabase
      .from('project_access')
      .select('id')
      .eq('project_id', data.projectId)
      .eq('user_id', data.userId)
      .is('deleted_at', null)
      .single()

    if (existingAccess) {
      return {
        success: false,
        error: 'User already has access to this project',
      }
    }

    // Grant access
    const { data: access, error } = await supabase
      .from('project_access')
      .insert({
        project_id: data.projectId,
        user_id: data.userId,
        role: data.role,
        trade: data.trade,
        granted_by: user.id,
      })
      .select()
      .single()

    if (error || !access) {
      return {
        success: false,
        error: error?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', project.org_id)
      .single()

    if (org) {
      revalidateProject(org.slug, data.projectId)
    }

    return success(access)
  }
)

// ============================================================================
// UPDATE PROJECT ACCESS
// ============================================================================

export const updateProjectAccess = withAction(
  updateProjectAccessSchema,
  async (data: UpdateProjectAccessInput): Promise<ActionResponse<void>> => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get access record to find project
    const { data: accessRecord } = await supabase
      .from('project_access')
      .select('project_id, project:projects(org_id)')
      .eq('id', data.accessId)
      .single()

    if (!accessRecord || !accessRecord.project) {
      throw new NotFoundError('Access record not found')
    }

    const project = accessRecord.project as { org_id: string }

    // Check if user is org admin or project manager
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      user_uuid: user.id,
      check_org_id: project.org_id,
    })

    const { data: isManager } = await supabase.rpc('is_project_manager', {
      user_uuid: user.id,
      check_project_id: accessRecord.project_id,
    })

    if (!isAdmin && !isManager) {
      throw new ForbiddenError(ErrorMessages.PROJECT_MANAGER_REQUIRED)
    }

    // Update access
    const { error } = await supabase
      .from('project_access')
      .update({
        role: data.role,
        trade: data.trade,
      })
      .eq('id', data.accessId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', project.org_id)
      .single()

    if (org) {
      revalidateProject(org.slug, accessRecord.project_id)
    }

    return success(undefined)
  }
)

// ============================================================================
// REVOKE PROJECT ACCESS
// ============================================================================

export const revokeProjectAccess = withAction(
  revokeProjectAccessSchema,
  async (data: RevokeProjectAccessInput): Promise<ActionResponse<void>> => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get access record to find project
    const { data: accessRecord } = await supabase
      .from('project_access')
      .select('project_id, project:projects(org_id)')
      .eq('id', data.accessId)
      .single()

    if (!accessRecord || !accessRecord.project) {
      throw new NotFoundError('Access record not found')
    }

    const project = accessRecord.project as { org_id: string }

    // Check if user is org admin or project manager
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      user_uuid: user.id,
      check_org_id: project.org_id,
    })

    const { data: isManager } = await supabase.rpc('is_project_manager', {
      user_uuid: user.id,
      check_project_id: accessRecord.project_id,
    })

    if (!isAdmin && !isManager) {
      throw new ForbiddenError(ErrorMessages.PROJECT_MANAGER_REQUIRED)
    }

    // Soft delete access
    const { error } = await supabase
      .from('project_access')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', data.accessId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', project.org_id)
      .single()

    if (org) {
      revalidateProject(org.slug, accessRecord.project_id)
    }

    return success(undefined)
  }
)

// ============================================================================
// DELETE PROJECT
// ============================================================================

export const deleteProject = withAction(
  deleteProjectSchema,
  async (data: DeleteProjectInput): Promise<ActionResponse<void>> => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get project to check org
    const { data: project } = await supabase
      .from('projects')
      .select('org_id')
      .eq('id', data.projectId)
      .single()

    if (!project) {
      throw new NotFoundError(ErrorMessages.PROJECT_NOT_FOUND)
    }

    // Check if user is org admin
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      user_uuid: user.id,
      check_org_id: project.org_id,
    })

    if (!isAdmin) {
      throw new ForbiddenError(ErrorMessages.ORG_ADMIN_REQUIRED)
    }

    // Soft delete project
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', data.projectId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', project.org_id)
      .single()

    if (org) {
      revalidateProject(org.slug, data.projectId)
    }

    return success(undefined)
  }
)
