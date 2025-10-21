import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing logic between createServerClient and getClaims().
  // Using getClaims() instead of getUser() for performance (no DB query).
  const { data } = await supabase.auth.getClaims()
  // Check if user is authenticated by verifying sub (subject) claim exists
  const user = data?.claims?.sub ? { id: data.claims.sub } : null

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/magic-link',
    '/forgot-password',
    '/reset-password',
    '/confirm',
    '/auth/callback',
  ]

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Redirect authenticated users away from auth pages
  if (isPublicRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to login (except for public routes and root)
  if (!isPublicRoute && !user && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect root to login or dashboard
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = user ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
