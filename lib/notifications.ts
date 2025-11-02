'use server'

import { db } from '@/lib/db'
import { NotificationType, Notification } from '@prisma/client'
import { formatCurrency } from '@/lib/utils'

/**
 * Base notification interface
 */
export interface CreateNotificationData {
  userId: string
  type: NotificationType
  message: string
  link?: string
}

/**
 * Created notification with serialized date
 */
export interface CreatedNotification {
  id: string
  type: NotificationType
  message: string
  read: boolean
  link: string | null
  userId: string
  createdAt: string
}

/**
 * Create a notification in the database
 * @param userId - User ID to send notification to
 * @param type - Notification type
 * @param message - Notification message
 * @param link - Optional link to related page
 * @returns Created notification
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  link?: string
): Promise<CreatedNotification | null> {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        message,
        link: link || null,
      },
    })

    return {
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    }
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Notify user they've been outbid on an auction
 * @param userId - User ID who was outbid
 * @param auctionId - Auction ID
 * @param newBidAmount - New highest bid amount
 * @returns Created notification
 */
export async function notifyOutbid(
  userId: string,
  auctionId: string,
  newBidAmount: number
): Promise<CreatedNotification | null> {
  try {
    // Fetch auction title
    const auction = await db.auction.findUnique({
      where: { id: auctionId },
      select: { title: true },
    })

    if (!auction) {
      console.error('Auction not found for outbid notification:', auctionId)
      return null
    }

    const message = `You've been outbid on "${auction.title}". New highest bid: ${formatCurrency(newBidAmount)}`
    const link = `/auctions/${auctionId}`

    return await createNotification(userId, NotificationType.BID_OUTBID, message, link)
  } catch (error) {
    console.error('Error creating outbid notification:', error)
    return null
  }
}

/**
 * Notify user that an auction is ending soon (in 1 hour)
 * @param userId - User ID to notify
 * @param auctionId - Auction ID
 * @returns Created notification
 */
export async function notifyAuctionEnding(
  userId: string,
  auctionId: string
): Promise<CreatedNotification | null> {
  try {
    // Fetch auction title
    const auction = await db.auction.findUnique({
      where: { id: auctionId },
      select: { title: true },
    })

    if (!auction) {
      console.error('Auction not found for ending notification:', auctionId)
      return null
    }

    const message = `Auction "${auction.title}" is ending in 1 hour`
    const link = `/auctions/${auctionId}`

    return await createNotification(userId, NotificationType.AUCTION_ENDED, message, link)
  } catch (error) {
    console.error('Error creating auction ending notification:', error)
    return null
  }
}

/**
 * Notify user they won an auction
 * @param userId - User ID who won
 * @param auctionId - Auction ID
 * @returns Created notification
 */
export async function notifyAuctionWon(
  userId: string,
  auctionId: string
): Promise<CreatedNotification | null> {
  try {
    // Fetch auction details
    const auction = await db.auction.findUnique({
      where: { id: auctionId },
      select: { title: true, currentPrice: true },
    })

    if (!auction) {
      console.error('Auction not found for won notification:', auctionId)
      return null
    }

    const message = `Congratulations! You won "${auction.title}" for ${formatCurrency(Number(auction.currentPrice))}`
    const link = `/auctions/${auctionId}`

    return await createNotification(userId, NotificationType.AUCTION_WON, message, link)
  } catch (error) {
    console.error('Error creating auction won notification:', error)
    return null
  }
}

/**
 * Notify seller of a new bid on their auction
 * @param sellerId - Seller user ID
 * @param auctionId - Auction ID
 * @param bidAmount - Bid amount
 * @returns Created notification
 */
export async function notifyNewBid(
  sellerId: string,
  auctionId: string,
  bidAmount: number
): Promise<CreatedNotification | null> {
  try {
    // Fetch auction title
    const auction = await db.auction.findUnique({
      where: { id: auctionId },
      select: { title: true },
    })

    if (!auction) {
      console.error('Auction not found for new bid notification:', auctionId)
      return null
    }

    const message = `New bid of ${formatCurrency(bidAmount)} on "${auction.title}"`
    const link = `/auctions/${auctionId}`

    return await createNotification(sellerId, NotificationType.BID_PLACED, message, link)
  } catch (error) {
    console.error('Error creating new bid notification:', error)
    return null
  }
}

/**
 * Mark a notification as read
 * @param notificationId - Notification ID
 * @returns Success status
 */
export async function markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })

    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark notification as read',
    }
  }
}

/**
 * Mark all notifications for a user as read
 * @param userId - User ID
 * @returns Success status and count of updated notifications
 */
export async function markAllAsRead(userId: string): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const result = await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    })

    return {
      success: true,
      count: result.count,
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
    }
  }
}

/**
 * Delete a notification
 * @param notificationId - Notification ID
 * @param userId - User ID (for authorization check)
 * @returns Success status
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify notification belongs to user
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    })

    if (!notification) {
      return { success: false, error: 'Notification not found' }
    }

    if (notification.userId !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    await db.notification.delete({
      where: { id: notificationId },
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete notification',
    }
  }
}

/**
 * Get notifications with filters and pagination
 * @param userId - User ID
 * @param filters - Filter options
 * @returns Notifications with pagination info
 */
export interface GetNotificationsFilters {
  read?: boolean
  type?: NotificationType
  types?: NotificationType[] // For filtering by multiple types
  page?: number
  limit?: number
}

export interface GetNotificationsResult {
  notifications: CreatedNotification[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export async function getNotifications(
  userId: string,
  filters: GetNotificationsFilters = {}
): Promise<GetNotificationsResult> {
  try {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    const where: any = { userId }

    if (filters.read !== undefined) {
      where.read = filters.read
    }

    if (filters.type) {
      where.type = filters.type
    } else if (filters.types && filters.types.length > 0) {
      where.type = { in: filters.types }
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return {
      notifications: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasMore: false,
    }
  }
}

/**
 * Bulk create notifications (useful for transactions)
 * @param notifications - Array of notification data
 * @returns Created notifications
 */
export async function createNotifications(
  notifications: CreateNotificationData[]
): Promise<CreatedNotification[]> {
  try {
    if (notifications.length === 0) {
      return []
    }

    const createdNotifications = await db.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        message: n.message,
        link: n.link || null,
      })),
    })

    // Fetch the created notifications to return them
    // Note: createMany doesn't return the created records, so we need to fetch them
    const userIds = [...new Set(notifications.map((n) => n.userId))]
    const recentNotifications = await db.notification.findMany({
      where: {
        userId: { in: userIds },
        message: { in: notifications.map((n) => n.message) },
      },
      orderBy: { createdAt: 'desc' },
      take: notifications.length,
    })

    return recentNotifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error('Error creating notifications:', error)
    return []
  }
}

