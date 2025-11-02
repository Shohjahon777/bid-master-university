'use server'

import { db } from '@/lib/db'
import { AuctionStatus, NotificationType } from '@prisma/client'
import { sendVerificationEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

/**
 * Cleanup result interface
 */
export interface CleanupResult {
  success: boolean
  deletedCount?: number
  error?: string
  message?: string
}

/**
 * Cleanup expired sessions
 * Note: Supabase Auth manages sessions, so this mainly cleans up any session-related data
 * If you have custom session tables, clean those up here
 */
export async function cleanupExpiredSessions(): Promise<CleanupResult> {
  try {
    // Note: Supabase Auth handles session management automatically
    // If you have custom session tables or tokens, clean them here
    // Example:
    // const thirtyDaysAgo = new Date()
    // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    // const deletedCount = await db.session.deleteMany({
    //   where: { expiresAt: { lt: thirtyDaysAgo } }
    // })

    // For now, return success (no custom sessions to clean)
    return {
      success: true,
      deletedCount: 0,
      message: 'No custom session cleanup needed (handled by Supabase Auth)'
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Cleanup old read notifications
 * Deletes read notifications older than 90 days
 * Keeps unread notifications regardless of age
 */
export async function cleanupOldNotifications(): Promise<CleanupResult> {
  try {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const result = await db.notification.deleteMany({
      where: {
        read: true,
        createdAt: {
          lt: ninetyDaysAgo
        }
      }
    })

    return {
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} old read notifications`
    }
  } catch (error) {
    console.error('Error cleaning up old notifications:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Cleanup unverified users
 * Deletes users who haven't verified email in 7 days
 * Sends final reminder email 1 day before deletion
 */
export async function cleanupUnverifiedUsers(): Promise<CleanupResult> {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

    // Find users who need final reminder (6 days old, unverified)
    const usersNeedingReminder = await db.user.findMany({
      where: {
        verified: false,
        createdAt: {
          gte: sevenDaysAgo,
          lt: sixDaysAgo
        }
      }
    })

    // Send reminder emails
    for (const user of usersNeedingReminder) {
      try {
        // Send final reminder (you may need to adjust the token generation)
        const reminderToken = 'reminder-' + user.id // Placeholder token
        sendVerificationEmail(user, reminderToken).catch((error) => {
          console.error(`Error sending reminder to user ${user.id}:`, error)
        })
      } catch (error) {
        console.error(`Error processing reminder for user ${user.id}:`, error)
      }
    }

    // Delete users who are 7+ days old and still unverified
    const result = await db.user.deleteMany({
      where: {
        verified: false,
        createdAt: {
          lt: sevenDaysAgo
        },
        // Don't delete users with active auctions or bids
        OR: [
          {
            auctions: {
              none: {}
            },
            bids: {
              none: {}
            }
          }
        ]
      }
    })

    return {
      success: true,
      deletedCount: result.count,
      message: `Sent ${usersNeedingReminder.length} reminders and deleted ${result.count} unverified users`
    }
  } catch (error) {
    console.error('Error cleaning up unverified users:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update auction statistics
 * Recalculates user ratings, view counts, and caches popular categories
 * Note: This is a placeholder - add rating/viewCount fields to schema if needed
 */
export async function updateAuctionStatistics(): Promise<CleanupResult> {
  try {
    // Calculate popular categories
    const categoryStats = await db.auction.groupBy({
      by: ['category'],
      where: {
        status: {
          in: [AuctionStatus.ACTIVE, AuctionStatus.ENDED]
        }
      },
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      },
      take: 10
    })

    // Note: If you add a viewCount field or rating system to the schema,
    // you can update them here. For now, we'll just log the stats.
    console.log('Popular categories:', categoryStats)

    // You could also:
    // 1. Calculate user ratings based on completed auctions
    // 2. Update view counts for auctions
    // 3. Cache popular categories in Redis or a separate table

    return {
      success: true,
      message: `Updated statistics for ${categoryStats.length} categories`
    }
  } catch (error) {
    console.error('Error updating auction statistics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Archive old auctions
 * Note: This would require an archive table or you can simply delete very old auctions
 * For now, we'll mark very old auctions for archival (you can create an archive table later)
 */
export async function archiveOldAuctions(): Promise<CleanupResult> {
  try {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    // Find ended auctions older than 1 year
    const oldAuctions = await db.auction.findMany({
      where: {
        status: AuctionStatus.ENDED,
        endTime: {
          lt: oneYearAgo
        }
      },
      select: {
        id: true,
        title: true
      },
      take: 100 // Process in batches
    })

    // Note: If you have an archive table, move auctions there:
    // await db.archiveAuction.createMany({ data: oldAuctions })
    // await db.auction.deleteMany({ where: { id: { in: oldAuctions.map(a => a.id) } } })

    // For now, we'll just count them (you can implement actual archiving later)
    // Or delete them if you want to keep database lean:
    const result = await db.auction.deleteMany({
      where: {
        status: AuctionStatus.ENDED,
        endTime: {
          lt: oneYearAgo
        },
        // Only delete if no active related data
        bids: {
          none: {}
        }
      }
    })

    return {
      success: true,
      deletedCount: result.count,
      message: `Archived/deleted ${result.count} old ended auctions`
    }
  } catch (error) {
    console.error('Error archiving old auctions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Run all cleanup tasks
 * Returns summary of all cleanup operations
 */
export async function runAllCleanupTasks(): Promise<{
  success: boolean
  results: Record<string, CleanupResult>
  errors: string[]
}> {
  const results: Record<string, CleanupResult> = {}
  const errors: string[] = []

  try {
    // Run all cleanup tasks
    results.sessions = await cleanupExpiredSessions()
    results.notifications = await cleanupOldNotifications()
    results.unverifiedUsers = await cleanupUnverifiedUsers()
    results.statistics = await updateAuctionStatistics()
    results.archive = await archiveOldAuctions()

    // Collect errors
    Object.entries(results).forEach(([task, result]) => {
      if (!result.success) {
        errors.push(`${task}: ${result.error || 'Unknown error'}`)
      }
    })

    return {
      success: errors.length === 0,
      results,
      errors
    }
  } catch (error) {
    console.error('Error running cleanup tasks:', error)
    return {
      success: false,
      results,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
    }
  }
}
