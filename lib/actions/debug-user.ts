'use server'

import { createClient } from '@/lib/supabase/server'

export async function debugCurrentUser() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      error: 'Not authenticated',
      user: null,
      profile: null
    }
  }

  // Check if profile exists
  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .single()

  const profileData = data as { id: string; full_name: string } | null

  if (profileData) {
    return {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: {
        id: profileData.id,
        full_name: profileData.full_name,
        exists: true as const
      }
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    },
    profile: {
      exists: false as const,
      error: profileError?.message
    }
  }
}
