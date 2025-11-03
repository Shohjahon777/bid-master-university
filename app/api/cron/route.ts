import { NextRequest, NextResponse } from 'next/server'
import { checkAndEndAuctions, sendAuctionEndingReminders } from '@/lib/scheduler'
import { runAllCleanupTasks } from '@/lib/cleanup'

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
 * Daily cron job endpoint for scheduled tasks (Vercel Hobby plan - daily limit)
 * 
 * Runs once daily at 2 AM:
 * - checkAndEndAuctions() - ends expired auctions
 * - sendAuctionEndingReminders() - sends reminders for auctions ending soon
 * - runAllCleanupTasks() - database cleanup tasks
 * 
 * Note: For more frequent auction ending checks, consider implementing
 * on-demand checks when users view/place bids on auctions.
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

    // Get the cron type from query params (allows manual triggering)
    const type = request.nextUrl.searchParams.get('type')

    // Run end-auctions check (check for expired auctions)
    if (type === 'end-auctions' || !type || type === 'all') {
      try {
        const endedCount = await checkAndEndAuctions()
        results.endedAuctions = endedCount
      } catch (error) {
        console.error('Error ending auctions:', error)
        results.endedAuctionsError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Send auction ending reminders
    if (type === 'reminders' || !type || type === 'all') {
      try {
        const reminders = await sendAuctionEndingReminders()
        results.reminders = reminders
      } catch (error) {
        console.error('Error sending reminders:', error)
        results.remindersError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Run cleanup tasks
    if (type === 'cleanup' || !type || type === 'all') {
      try {
        const cleanupResults = await runAllCleanupTasks()
        results.cleanup = {
          success: cleanupResults.success,
          totalDeleted: Object.values(cleanupResults.results).reduce((sum, result) => {
            return sum + (result.deletedCount || 0)
          }, 0),
          tasksRun: Object.keys(cleanupResults.results).length,
          errors: cleanupResults.errors.length
        }
        if (cleanupResults.errors.length > 0) {
          results.cleanupErrors = cleanupResults.errors
        }
      } catch (error) {
        console.error('Error running cleanup:', error)
        results.cleanupError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      results,
      note: 'This cron runs once daily at 2 AM (Vercel Hobby plan limitation). All tasks run together.',
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

