import { NextRequest, NextResponse } from 'next/server'
import { runAllCleanupTasks } from '@/lib/cleanup'
import { createNotification } from '@/lib/notifications'
import { db } from '@/lib/db'
import { NotificationType } from '@prisma/client'

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
 * Log cleanup results to database (optional - you can create a CleanupLog model)
 */
async function logCleanupResults(results: any) {
  try {
    // Optional: Create a CleanupLog model in Prisma schema to track cleanup runs
    // For now, we'll just log to console and optionally to EmailLog
    console.log('Cleanup results:', JSON.stringify(results, null, 2))
    
    // You could store this in a cleanup_logs table if you add one to the schema
  } catch (error) {
    console.error('Error logging cleanup results:', error)
  }
}

/**
 * Notify admins if there are issues
 */
async function notifyAdminsIfNeeded(results: any, errors: string[]) {
  try {
    if (errors.length === 0) return

    // Find admin users
    // Note: After running `npx prisma generate`, use UserRole.ADMIN
    const admins = await (db as any).user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    // Send notifications to admins
    for (const admin of admins) {
      await createNotification(
        admin.id,
        NotificationType.AUCTION_CANCELLED, // Reuse or create new type
        `Cleanup job completed with ${errors.length} error(s): ${errors.join(', ')}`,
        '/admin'
      ).catch((error) => {
        console.error(`Error notifying admin ${admin.id}:`, error)
      })
    }
  } catch (error) {
    console.error('Error notifying admins:', error)
  }
}

/**
 * GET /api/cron/cleanup
 * Cron job endpoint for database cleanup tasks
 * 
 * Runs:
 * - cleanupExpiredSessions()
 * - cleanupOldNotifications()
 * - cleanupUnverifiedUsers()
 * - updateAuctionStatistics()
 * - archiveOldAuctions()
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

    // Run all cleanup tasks
    const cleanupResults = await runAllCleanupTasks()

    // Log results
    await logCleanupResults(cleanupResults)

    // Notify admins if there are errors
    if (cleanupResults.errors.length > 0) {
      await notifyAdminsIfNeeded(cleanupResults.results, cleanupResults.errors)
    }

    const duration = Date.now() - startTime

    // Calculate summary statistics
    const totalDeleted = Object.values(cleanupResults.results).reduce((sum, result) => {
      return sum + (result.deletedCount || 0)
    }, 0)

    return NextResponse.json({
      success: cleanupResults.success,
      summary: {
        totalDeleted,
        tasksRun: Object.keys(cleanupResults.results).length,
        errors: cleanupResults.errors.length,
        duration: `${duration}ms`
      },
      results: cleanupResults.results,
      errors: cleanupResults.errors,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cleanup cron job error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron/cleanup
 * Alternative endpoint for cron services that use POST
 */
export async function POST(request: NextRequest) {
  return GET(request)
}

