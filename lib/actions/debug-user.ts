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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    },
    profile: profile ? {
      id: profile.id,
      full_name: profile.full_name,
      exists: true
    } : {
      exists: false,
      error: profileError?.message
    }
  }
}
