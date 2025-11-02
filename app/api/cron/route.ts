import { NextRequest, NextResponse } from 'next/server'
import { checkAndEndAuctions, sendAuctionEndingReminders } from '@/lib/scheduler'

/**
 * Verify the cron API key from request headers
 */
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured')
    return false
  }

  // Check Authorization header: "Bearer <secret>" or just the secret
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    return token === cronSecret
  }

  // Check for X-Vercel-Cron-Secret header (Vercel specific)
  const vercelSecret = request.headers.get('x-vercel-cron-secret')
  if (vercelSecret) {
    return vercelSecret === cronSecret
  }

  // Check query parameter as fallback
  const querySecret = request.nextUrl.searchParams.get('secret')
  if (querySecret) {
    return querySecret === cronSecret
  }

  return false
}

/**
 * GET /api/cron
 * Cron job endpoint for scheduled tasks
 * 
 * Runs:
 * - checkAndEndAuctions() - every 5 minutes
 * - sendAuctionEndingReminders() - every hour
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyCronAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const startTime = Date.now()
    const results: Record<string, unknown> = {}

    // Get the cron type from query params or run both
    const type = request.nextUrl.searchParams.get('type')

    if (type === 'end-auctions' || !type) {
      // Check and end expired auctions
      try {
        const endedCount = await checkAndEndAuctions()
        results.endedAuctions = endedCount
      } catch (error) {
        console.error('Error ending auctions:', error)
        results.endedAuctionsError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    if (type === 'reminders' || !type) {
      // Send auction ending reminders
      try {
        const reminders = await sendAuctionEndingReminders()
        results.reminders = reminders
      } catch (error) {
        console.error('Error sending reminders:', error)
        results.remindersError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron
 * Alternative endpoint for cron services that use POST
 */
export async function POST(request: NextRequest) {
  return GET(request)
}

