import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes requiring auth
  const requiresAuth = pathname.startsWith('/browse') || pathname.startsWith('/watch')
  const requiresAdmin = pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')

  if (requiresAuth || requiresAdmin) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (requiresAdmin) {
      const { data: profile } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single()

      const adminEmails = (process.env.ADMIN_EMAIL ?? '')
        .split(',')
        .map(e => e.trim().toLowerCase())

      if (!profile || !adminEmails.includes(profile.email.toLowerCase())) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    if (requiresAuth) {
      const { data: profile } = await supabase
        .from('users')
        .select('is_subscribed')
        .eq('id', user.id)
        .single()

      if (!profile?.is_subscribed) {
        return NextResponse.redirect(new URL('/subscribe', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip all /api routes (each does its own auth) plus static assets — this
    // avoids a redundant Supabase auth call on every API request and asset.
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
