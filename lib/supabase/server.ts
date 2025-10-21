import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  // Debug: Log cookie retrieval
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(c => c.name.includes('auth-token'))
  console.log('[DEBUG createClient] Cookies found:', {
    total: allCookies.length,
    authCookies: authCookies.length,
    hasAuthToken: authCookies.length > 0,
  })

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.log('[DEBUG createClient] setAll failed (expected in Server Components):', error)
          }
        },
      },
    }
  )
}
