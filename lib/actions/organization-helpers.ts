/**
 * Organization Helper Functions
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { UnauthorizedError, ErrorMessages } from '@/lib/utils/errors'

export async function getUserOrganizations() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
  }

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      created_at,
      organization_members!inner (
        role,
        joined_at
      )
    `)
    .eq('organization_members.user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return orgs || []
}

export async function getOrganizationBySlug(slug: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
  }

  const { data: org, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      settings,
      created_at,
      updated_at,
      organization_members!inner (
        role,
        joined_at
      )
    `)
    .eq('slug', slug)
    .eq('organization_members.user_id', user.id)
    .single()

  if (error || !org) {
    return null
  }

  return org
}
