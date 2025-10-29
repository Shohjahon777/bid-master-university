import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = [
  '/auctions/new',
  '/dashboard',
  '/profile'
]

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auctions',
  '/login',
  '/register',
  '/verify-email',
  '/how-it-works',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/help'
]

// Auth routes that should redirect if already authenticated
const authRoutes = [
  '/login',
  '/register',
  '/verify-email'
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Create Supabase client for proxy
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in proxy')
    return NextResponse.next()
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Get the current session from cookies
  const token = request.cookies.get('sb-access-token')?.value || 
                request.cookies.get('supabase-auth-token')?.value

  let session = null
  if (token) {
    try {
      const { data: { user } } = await supabase.auth.getUser(token)
      session = user ? { user } : null
    } catch (error) {
      console.error('Error getting user in proxy:', error)
      session = null
    }
  }

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Handle protected routes
  if (isProtectedRoute) {
    if (!session) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Handle auth routes (redirect if already authenticated)
  if (isAuthRoute && session) {
    // Check if there's a redirect URL
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    // Default redirect to auctions
    return NextResponse.redirect(new URL('/auctions', request.url))
  }

  // Handle auction detail pages (allow public access)
  if (pathname.startsWith('/auctions/') && pathname !== '/auctions/new') {
    // Allow public access to auction detail pages
    return NextResponse.next()
  }

  // Handle root path
  if (pathname === '/') {
    // If user is authenticated, redirect to auctions
    if (session) {
      return NextResponse.redirect(new URL('/auctions', request.url))
    }
    // If not authenticated, show landing page
    return NextResponse.next()
  }

  // Handle 404 for unknown routes
  if (!isPublicRoute && !isProtectedRoute && !pathname.startsWith('/auctions/')) {
    return NextResponse.redirect(new URL('/404', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
