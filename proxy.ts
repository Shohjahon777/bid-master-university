import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// Protected routes that require authentication
const protectedRoutes = [
  '/auctions/new',
  '/dashboard',
  '/profile',
  '/notifications',
  '/messages'
]

// Admin routes that require admin role
const adminRoutes = [
  '/admin'
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
  
  // Create Supabase client for proxy with SSR
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in proxy')
    return NextResponse.next()
  }

  // Create a Supabase client with cookie support
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        // Cannot set cookies in NextRequest - would need NextResponse
      },
      remove(name: string, options: any) {
        // Cannot remove cookies in NextRequest - would need NextResponse
      },
    },
  })

  // Get the current session from cookies
  const { data: { user } } = await supabase.auth.getUser()
  const session = user ? { user } : null

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

  // Check if the current path is an admin route
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Handle admin routes - require authentication and admin role
  if (isAdminRoute) {
    if (!session || !user) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Check if user has admin role
    try {
      const dbUser = await db.user.findUnique({
        where: { id: user.id }
      })
      
      if (!dbUser || (dbUser as any).role !== 'ADMIN') {
        // Redirect to dashboard if not admin
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Error checking admin role:', error)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

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

  // Handle root path - always allow access to home page
  if (pathname === '/') {
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
     * - api routes
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
