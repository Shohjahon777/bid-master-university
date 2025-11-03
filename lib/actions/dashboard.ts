"use server"

import { revalidatePath } from 'next/cache'
import { db } from "@/lib/db"
import { getCurrentUser, requireAuth } from "@/lib/auth"
import { AuctionStatus } from '@prisma/client'

export interface DashboardStats {
  activeAuctions: number
  totalBidsReceived: number
  itemsWon: number
  totalEarnings: number
}

export interface ActiveAuction {
  id: string
  title: string
  currentBid: number
  bids: number
  timeLeft: string
  status: "active" | "ending"
  views: number
  imageUrl?: string
}

export interface RecentBid {
  id: string
  auctionTitle: string
  auctionId: string
  bidAmount: number
  status: "winning" | "outbid" | "won" | "lost"
  timeAgo: string
  auctionImageUrl?: string
}

export interface EndingSoonAuction {
  id: string
  title: string
  currentBid: number
  timeLeft: string
  bids: number
  imageUrl?: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const user = await getCurrentUser()
  
  // Return default stats for unauthenticated users (during build)
  if (!user) {
    return {
      activeAuctions: 0,
      totalBidsReceived: 0,
      itemsWon: 0,
      totalEarnings: 0
    }
  }

  try {
    // Fetch real data from database
    const [activeAuctions, allAuctions, wonAuctions, bidsReceived] = await Promise.all([
      // Count active auctions created by user
      db.auction.count({
        where: {
          userId: user.id,
          status: AuctionStatus.ACTIVE
        }
      }),
      // Get all auctions to calculate earnings
      db.auction.findMany({
        where: {
          userId: user.id,
          status: AuctionStatus.ENDED
        },
        include: {
          _count: {
            select: { bids: true }
          }
        }
      }),
      // Count auctions won by user
      db.auction.count({
        where: {
          winnerId: user.id,
          status: AuctionStatus.ENDED
        }
      }),
      // Count total bids on user's auctions
      db.bid.count({
        where: {
          auction: {
            userId: user.id
          }
        }
      })
    ])

    // Calculate total earnings from completed auctions
    const totalEarnings = allAuctions.reduce((sum, auction) => {
      return sum + Number(auction.currentPrice)
    }, 0)

    return {
      activeAuctions,
      totalBidsReceived: bidsReceived,
      itemsWon: wonAuctions,
      totalEarnings
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return zeros on error instead of crashing
    return {
      activeAuctions: 0,
      totalBidsReceived: 0,
      itemsWon: 0,
      totalEarnings: 0
    }
  }
}

export async function getActiveAuctions(limit: number = 4): Promise<ActiveAuction[]> {
  const user = await getCurrentUser()
  
  // Return empty array for unauthenticated users (during build)
  if (!user) {
    return []
  }

  try {
    const auctions = await db.auction.findMany({
      where: {
        userId: user.id,
        status: AuctionStatus.ACTIVE
      },
      include: {
        _count: {
          select: { bids: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const now = new Date()
    return auctions.map(auction => {
      const timeRemaining = auction.endTime.getTime() - now.getTime()
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
      
      const timeLeft = days > 0 
        ? `${days}d ${hours}h` 
        : hours > 0 
        ? `${hours}h ${minutes}m` 
        : `${minutes}m`
      
      const isEndingSoon = timeRemaining < 24 * 60 * 60 * 1000 // Less than 24 hours
      
      return {
        id: auction.id,
        title: auction.title,
        currentBid: Number(auction.currentPrice),
        bids: auction._count.bids,
        timeLeft,
        status: isEndingSoon ? "ending" as const : "active" as const,
        views: 0, // We don't track views yet
        imageUrl: auction.images[0] || "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
      }
    })
  } catch (error) {
    console.error('Error fetching active auctions:', error)
    return []
  }
}

export async function getRecentBids(limit: number = 5): Promise<RecentBid[]> {
  const user = await getCurrentUser()
  
  // Return empty array for unauthenticated users (during build)
  if (!user) {
    return []
  }

  try {
    const userBids = await getUserBids()
    
    // Get most recent bids and format them
    const recentBids = userBids.slice(0, limit)
    
    return recentBids.map(bid => {
      const timeAgo = formatTimeAgo(bid.createdAt)
      
      return {
        id: bid.id,
        auctionTitle: bid.auction.title,
        auctionId: bid.auctionId,
        bidAmount: bid.amount,
        status: bid.status,
        timeAgo,
        auctionImageUrl: bid.auction.images[0] || "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
      }
    })
  } catch (error) {
    console.error('Error fetching recent bids:', error)
    return []
  }
}

// Helper function to format time ago
function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMs = now.getTime() - time.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  } else {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  }
}

export async function getEndingSoonAuctions(limit: number = 3): Promise<EndingSoonAuction[]> {
  const user = await getCurrentUser()
  if (!user) {
    return []
  }

  try {
    const now = new Date()
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    const auctions = await db.auction.findMany({
      where: {
        status: AuctionStatus.ACTIVE,
        endTime: {
          gte: now,
          lte: twentyFourHoursFromNow
        }
      },
      include: {
        _count: {
          select: { bids: true }
        }
      },
      orderBy: { endTime: 'asc' },
      take: limit
    })

    return auctions.map(auction => {
      const timeRemaining = auction.endTime.getTime() - now.getTime()
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
      const timeLeft = `${hours}h ${minutes}m`
      
      return {
        id: auction.id,
        title: auction.title,
        currentBid: Number(auction.currentPrice),
        timeLeft,
        bids: auction._count.bids,
        imageUrl: auction.images[0] || "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
      }
    })
  } catch (error) {
    console.error('Error fetching ending soon auctions:', error)
    return []
  }
}

// Get user's auctions by status
export interface UserAuction {
  id: string
  title: string
  description: string
  images: string[]
  startingPrice: number
  currentPrice: number
  buyNowPrice: number | null
  startTime: string
  endTime: string
  status: string
  createdAt: string
  updatedAt: string
  _count: {
    bids: number
  }
}

export async function getUserAuctions(status?: 'ACTIVE' | 'ENDED' | 'CANCELLED') {
  try {
    const user = await requireAuth()
    
    const where: any = { userId: user.id }
    if (status) {
      where.status = status
    }
    
    const auctions = await db.auction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bids: true }
        }
      }
    })
    
    return auctions.map(auction => ({
      id: auction.id,
      title: auction.title,
      description: auction.description,
      images: auction.images,
      startingPrice: Number(auction.startingPrice),
      currentPrice: Number(auction.currentPrice),
      buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
      startTime: auction.startTime.toISOString(),
      endTime: auction.endTime.toISOString(),
      status: auction.status,
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
      _count: {
        bids: auction._count?.bids || 0
      }
    }))
  } catch (error) {
    console.error('Error fetching user auctions:', error)
    return []
  }
}

// Cancel auction
export async function cancelAuction(auctionId: string) {
  try {
    const user = await requireAuth()
    
    const auction = await db.auction.findUnique({
      where: { id: auctionId }
    })
    
    if (!auction) {
      return { success: false, error: 'Auction not found' }
    }
    
    if (auction.userId !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    if (auction.status !== AuctionStatus.ACTIVE) {
      return { success: false, error: 'Only active auctions can be cancelled' }
    }
    
    await db.auction.update({
      where: { id: auctionId },
      data: { status: AuctionStatus.CANCELLED }
    })
    
    revalidatePath('/dashboard/auctions')
    return { success: true, message: 'Auction cancelled successfully' }
  } catch (error) {
    console.error('Error cancelling auction:', error)
    return { success: false, error: 'Failed to cancel auction' }
  }
}

// Delete auction
export async function deleteAuction(auctionId: string) {
  try {
    const user = await requireAuth()
    
    const auction = await db.auction.findUnique({
      where: { id: auctionId }
    })
    
    if (!auction) {
      return { success: false, error: 'Auction not found' }
    }
    
    if (auction.userId !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    if (auction.status === AuctionStatus.ACTIVE) {
      return { success: false, error: 'Active auctions cannot be deleted' }
    }
    
    await db.auction.delete({
      where: { id: auctionId }
    })
    
    revalidatePath('/dashboard/auctions')
    return { success: true, message: 'Auction deleted successfully' }
  } catch (error) {
    console.error('Error deleting auction:', error)
    return { success: false, error: 'Failed to delete auction' }
  }
}

// Get user's bids with auction data
export interface UserBid {
  id: string
  amount: number
  createdAt: string
  auctionId: string
  auction: {
    id: string
    title: string
    images: string[]
    currentPrice: number
    status: AuctionStatus
    endTime: string
    winnerId: string | null
  }
  status: 'winning' | 'outbid' | 'won' | 'lost'
}

export async function getUserBids() {
  try {
    const user = await requireAuth()
    const now = new Date()
    
    // Get all user's bids with auction data
    const bids = await db.bid.findMany({
      where: {
        userId: user.id
      },
      include: {
        auction: {
          select: {
            id: true,
            title: true,
            images: true,
            currentPrice: true,
            status: true,
            endTime: true,
            winnerId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Process bids to determine status and group by auction (show highest bid per auction)
    const bidsByAuction = new Map<string, typeof bids[0]>()
    
    for (const bid of bids) {
      const auctionId = bid.auctionId
      const existingBid = bidsByAuction.get(auctionId)
      
      // Keep the highest bid for each auction
      if (!existingBid || Number(bid.amount) > Number(existingBid.amount)) {
        bidsByAuction.set(auctionId, bid)
      }
    }
    
    // Map to UserBid format with status determination
    const userBids: UserBid[] = Array.from(bidsByAuction.values()).map(bid => {
      const auction = bid.auction
      const bidAmount = Number(bid.amount)
      const currentPrice = Number(auction.currentPrice)
      const isActive = auction.status === AuctionStatus.ACTIVE && auction.endTime > now
      const isEnded = auction.status === AuctionStatus.ENDED || auction.endTime <= now
      
      let status: 'winning' | 'outbid' | 'won' | 'lost'
      
      if (isEnded) {
        // Auction ended - check if user won
        if (auction.winnerId === user.id) {
          status = 'won'
        } else {
          status = 'lost'
        }
      } else if (isActive) {
        // Auction active - check if user is winning or outbid
        // User is winning if their bid amount equals current price (they are highest bidder)
        if (bidAmount === currentPrice) {
          status = 'winning'
        } else {
          status = 'outbid'
        }
      } else {
        // Auction cancelled or not started yet - treat as lost
        status = 'lost'
      }
      
      return {
        id: bid.id,
        amount: bidAmount,
        createdAt: bid.createdAt.toISOString(),
        auctionId: bid.auctionId,
        auction: {
          id: auction.id,
          title: auction.title,
          images: auction.images,
          currentPrice: currentPrice,
          status: auction.status,
          endTime: auction.endTime.toISOString(),
          winnerId: auction.winnerId
        },
        status
      }
    })
    
    return userBids
  } catch (error) {
    console.error('Error fetching user bids:', error)
    return []
  }
}