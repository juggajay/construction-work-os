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
