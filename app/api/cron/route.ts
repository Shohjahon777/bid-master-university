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
 * Consolidated cron job endpoint for scheduled tasks
 * 
 * Runs:
 * - checkAndEndAuctions() - every 5 minutes (always runs)
 * - sendAuctionEndingReminders() - only at the top of each hour (when minute is 0)
 * - cleanup tasks - only at 2 AM daily (when hour is 2 and minute is 0)
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
    const now = new Date()
    const currentMinute = now.getMinutes()
    const currentHour = now.getHours()

    // Get the cron type from query params or auto-detect
    const type = request.nextUrl.searchParams.get('type')

    // Always run end-auctions check (runs every 5 minutes)
    if (type === 'end-auctions' || !type || type === 'all') {
      try {
        const endedCount = await checkAndEndAuctions()
        results.endedAuctions = endedCount
      } catch (error) {
        console.error('Error ending auctions:', error)
        results.endedAuctionsError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Run reminders only at the top of each hour (minute 0)
    const shouldRunReminders = (type === 'reminders' || type === 'all') && currentMinute === 0
    if (shouldRunReminders) {
      try {
        const reminders = await sendAuctionEndingReminders()
        results.reminders = reminders
      } catch (error) {
        console.error('Error sending reminders:', error)
        results.remindersError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Run cleanup only at 2 AM daily
    const shouldRunCleanup = (type === 'cleanup' || type === 'all') && currentHour === 2 && currentMinute === 0
    if (shouldRunCleanup) {
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
      schedule: {
        reminders: shouldRunReminders ? 'running' : `skipped (runs at minute 0)`,
        cleanup: shouldRunCleanup ? 'running' : `skipped (runs at 2:00 AM)`
      },
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

