/**
 * Project Helper Functions
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { UnauthorizedError, ErrorMessages } from '@/lib/utils/errors'

export async function getOrganizationProjects(orgId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return projects || []
}

export async function getProjectById(projectId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error || !project) {
    return null
  }

  return project
}

export async function getProjectMetrics(projectId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
  }

  // Fetch actual spent amount from project_invoices
  const { data: invoices } = await supabase
    .from('project_invoices')
    .select('amount')
    .eq('project_id', projectId)
    .is('deleted_at', null)

  const totalSpent = invoices?.reduce((sum, invoice) => sum + (invoice.amount || 0), 0) || 0

  // Fetch actual RFI count
  const { count: rfiCount } = await supabase
    .from('rfis')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('deleted_at', null)

  // Fetch actual team size from project_access
  const { count: teamSize } = await supabase
    .from('project_access')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('deleted_at', null)

  // Calculate completion percentage based on budget spent
  // You can also add other completion metrics here (e.g., tasks completed)
  const { data: project } = await supabase
    .from('projects')
    .select('budget')
    .eq('id', projectId)
    .single()

  let completionPercentage = 0
  if (project?.budget && project.budget > 0) {
    completionPercentage = Math.min(Math.round((totalSpent / project.budget) * 100), 100)
  }

  return {
    totalSpent,
    rfiCount: rfiCount || 0,
    teamSize: teamSize || 0,
    completionPercentage,
  }
}
