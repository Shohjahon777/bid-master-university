'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { placeBidSchema, buyNowSchema } from '@/lib/validations/bid'
import { AuctionStatus, NotificationType } from '@/types'
import { isAuctionActive } from '@/lib/utils'

// Helper function to create notifications
async function createNotifications(tx: any, notifications: Array<{
  type: NotificationType
  message: string
  link?: string
  userId: string
}>) {
  if (notifications.length > 0) {
    await tx.notification.createMany({
      data: notifications
    })
  }
}

// Place a bid on an auction
export async function placeBid(auctionId: string, amount: number) {
  try {
    const user = await requireAuth()

    // Validate input
    const validatedData = placeBidSchema.parse({ amount, auctionId })

    // Get auction details with current highest bidder
    const auction = await db.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        currentPrice: true,
        status: true,
        endTime: true,
        userId: true,
        title: true,
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            userId: true
          }
        }
      }
    })

    if (!auction) {
      return { success: false, error: 'Auction not found' }
    }

    // Check if auction is active
    const now = new Date()
    const isActive = auction.status === 'ACTIVE' && auction.endTime > now
    if (!isActive) {
      return { success: false, error: 'Auction is no longer active' }
    }

    // Check if user is the seller
    if (auction.userId === user.id) {
      return { success: false, error: 'You cannot bid on your own auction' }
    }

    // Check if bid is higher than current price
    if (amount <= Number(auction.currentPrice)) {
      return { 
        success: false, 
        error: `Bid must be higher than current price of $${Number(auction.currentPrice).toFixed(2)}` 
      }
    }

    // Get previous highest bidder (if exists)
    const previousHighestBidder = auction.bids.length > 0 ? auction.bids[0].userId : null

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx: any) => {
      // Create the bid
      const bid = await tx.bid.create({
        data: {
          amount: validatedData.amount,
          userId: user.id,
          auctionId: auctionId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              university: true
            }
          }
        }
      })

      // Update auction current price
      await tx.auction.update({
        where: { id: auctionId },
        data: { currentPrice: validatedData.amount }
      })

      // Create notifications
      const notifications = []

      // Notify previous highest bidder if they were outbid
      if (previousHighestBidder && previousHighestBidder !== user.id) {
        notifications.push({
          type: 'BID_OUTBID' as NotificationType,
          message: `You were outbid on "${auction.title}". New highest bid: $${validatedData.amount.toFixed(2)}`,
          link: `/auctions/${auctionId}`,
          userId: previousHighestBidder
        })
      }

      // Notify seller about new bid
      notifications.push({
        type: 'BID_PLACED' as NotificationType,
        message: `New bid placed on "${auction.title}". Current price: $${validatedData.amount.toFixed(2)}`,
        link: `/auctions/${auctionId}`,
        userId: auction.userId
      })

      // Create all notifications
      await createNotifications(tx, notifications)

      return bid
    })

    // Revalidate the auction page
    revalidatePath(`/auctions/${auctionId}`)
    revalidatePath('/auctions')

    // Serialize Decimal and Date fields
    return { 
      success: true, 
      bid: {
        ...result,
        amount: Number(result.amount),
        createdAt: result.createdAt.toISOString()
      }
    }
  } catch (error) {
    console.error('Error placing bid:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: 'Invalid bid data' }
    }
    return { success: false, error: 'Failed to place bid' }
  }
}

// Buy now at buyNowPrice
export async function buyNow(auctionId: string) {
  try {
    const user = await requireAuth()

    // Validate input
    const validatedData = buyNowSchema.parse({ auctionId })

    // Get auction details with current highest bidder
    const auction = await db.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        buyNowPrice: true,
        status: true,
        endTime: true,
        userId: true,
        title: true,
        currentPrice: true,
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            userId: true
          }
        }
      }
    })

    if (!auction) {
      return { success: false, error: 'Auction not found' }
    }

    // Check if auction is active
    const now = new Date()
    const isActive = auction.status === 'ACTIVE' && auction.endTime > now
    if (!isActive) {
      return { success: false, error: 'Auction is no longer active' }
    }

    // Check if user is the seller
    if (auction.userId === user.id) {
      return { success: false, error: 'You cannot buy your own auction' }
    }

    // Check if buy now is available
    if (!auction.buyNowPrice || Number(auction.buyNowPrice) <= 0) {
      return { success: false, error: 'Buy now is not available for this auction' }
    }

    // Get previous highest bidder (if exists)
    const previousHighestBidder = auction.bids.length > 0 ? auction.bids[0].userId : null

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx: any) => {
      // Create the winning bid at buy now price
      const bid = await tx.bid.create({
        data: {
          amount: auction.buyNowPrice!,
          userId: user.id,
          auctionId: auctionId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              university: true
            }
          }
        }
      })

      // Update auction to ended with winner
      await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: auction.buyNowPrice!,
          status: 'ENDED' as AuctionStatus,
          winnerId: user.id
        }
      })

      // Create notifications
      const notifications = []

      // Notify previous highest bidder if they were outbid
      if (previousHighestBidder && previousHighestBidder !== user.id) {
        notifications.push({
          type: 'BID_OUTBID' as NotificationType,
          message: `Auction "${auction.title}" was bought now for $${Number(auction.buyNowPrice).toFixed(2)}`,
          link: `/auctions/${auctionId}`,
          userId: previousHighestBidder
        })
      }

      // Notify seller about auction won
      notifications.push({
        type: 'AUCTION_WON' as NotificationType,
        message: `Your auction "${auction.title}" was bought now for $${Number(auction.buyNowPrice).toFixed(2)}`,
        link: `/auctions/${auctionId}`,
        userId: auction.userId
      })

      // Notify winner
      notifications.push({
        type: 'AUCTION_WON' as NotificationType,
        message: `Congratulations! You won "${auction.title}" for $${Number(auction.buyNowPrice).toFixed(2)}`,
        link: `/auctions/${auctionId}`,
        userId: user.id
      })

      // Create all notifications
      await createNotifications(tx, notifications)

      return bid
    })

    // Revalidate the auction page
    revalidatePath(`/auctions/${auctionId}`)
    revalidatePath('/auctions')

    // Serialize Decimal and Date fields
    return { 
      success: true, 
      bid: {
        ...result,
        amount: Number(result.amount),
        createdAt: result.createdAt.toISOString()
      }
    }
  } catch (error) {
    console.error('Error buying now:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: 'Invalid auction data' }
    }
    return { success: false, error: 'Failed to buy now' }
  }
}

// Get bid history for an auction
export async function getBidHistory(auctionId: string, limit: number = 10) {
  try {
    const bids = await db.bid.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            university: true
          }
        }
      }
    })

    // Serialize Decimal and Date fields
    const serializedBids = bids.map(bid => ({
      ...bid,
      amount: Number(bid.amount),
      createdAt: bid.createdAt.toISOString()
    }))

    return { success: true, bids: serializedBids }
  } catch (error) {
    console.error('Error fetching bid history:', error)
    return { success: false, error: 'Failed to fetch bid history' }
  }
}

// Handle auction ending notifications
export async function handleAuctionEnding(auctionId: string) {
  try {
    const auction = await db.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        title: true,
        userId: true,
        winnerId: true,
        currentPrice: true,
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            userId: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!auction) {
      return { success: false, error: 'Auction not found' }
    }

    // Update auction status to ended
    await db.auction.update({
      where: { id: auctionId },
      data: { status: 'ENDED' as AuctionStatus }
    })

    const notifications = []

    // Notify seller
    if (auction.winnerId) {
      notifications.push({
        type: 'AUCTION_ENDED' as NotificationType,
        message: `Your auction "${auction.title}" ended. Winner: ${auction.bids[0]?.user.name || 'Unknown'}`,
        link: `/auctions/${auctionId}`,
        userId: auction.userId
      })

      // Notify winner
      notifications.push({
        type: 'AUCTION_WON' as NotificationType,
        message: `Congratulations! You won "${auction.title}" for $${Number(auction.currentPrice).toFixed(2)}`,
        link: `/auctions/${auctionId}`,
        userId: auction.winnerId
      })
    } else {
      // No winner - auction ended without bids
      notifications.push({
        type: 'AUCTION_ENDED' as NotificationType,
        message: `Your auction "${auction.title}" ended without any bids`,
        link: `/auctions/${auctionId}`,
        userId: auction.userId
      })
    }

    // Create notifications
    if (notifications.length > 0) {
      await db.notification.createMany({
        data: notifications
      })
    }

    // Revalidate pages
    revalidatePath(`/auctions/${auctionId}`)
    revalidatePath('/auctions')

    return { success: true }
  } catch (error) {
    console.error('Error handling auction ending:', error)
    return { success: false, error: 'Failed to handle auction ending' }
  }
}

// Get user notifications
export async function getUserNotifications(userId: string, limit: number = 20) {
  try {
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return { success: true, notifications }
  } catch (error) {
    console.error('Error fetching user notifications:', error)
    return { success: false, error: 'Failed to fetch notifications' }
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    await db.notification.update({
      where: { id: notificationId },
      data: { read: true }
    })

    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: 'Failed to mark notification as read' }
  }
}
