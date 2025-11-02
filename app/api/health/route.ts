import { NextResponse } from 'next/server'

/**
 * Health check endpoint
 * Used for monitoring and deployment verification
 */
export async function GET() {
  try {
    // Basic health check
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      checks: {
        database: await checkDatabase(),
        email: checkEmailService(),
        supabase: checkSupabase()
      }
    }

    // If any critical check fails, return 503
    const allHealthy = 
      health.checks.database &&
      health.checks.email &&
      health.checks.supabase

    return NextResponse.json(health, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}

/**
 * Check database connection
 */
async function checkDatabase(): Promise<boolean> {
  try {
    const { db } = await import('@/lib/db')
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

/**
 * Check email service configuration
 */
function checkEmailService(): boolean {
  return !!process.env.RESEND_API_KEY
}

/**
 * Check Supabase configuration
 */
function checkSupabase(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

