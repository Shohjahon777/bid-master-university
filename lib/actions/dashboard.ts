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
  status: "winning" | "outbid" | "won"
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

  // In a real app, you would fetch this data from your database
  // For now, we'll return mock data
  return {
    activeAuctions: 12,
    totalBidsReceived: 47,
    itemsWon: 8,
    totalEarnings: 2340
  }
}

export async function getActiveAuctions(limit: number = 4): Promise<ActiveAuction[]> {
  const user = await getCurrentUser()
  
  // Return empty array for unauthenticated users (during build)
  if (!user) {
    return []
  }

  // Mock data - in a real app, this would come from your database
  return [
    {
      id: "1",
      title: "Vintage MacBook Pro 13\"",
      currentBid: 850,
      bids: 12,
      timeLeft: "2d 14h",
      status: "active" as const,
      views: 156,
      imageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    },
    {
      id: "2",
      title: "Nintendo Switch OLED",
      currentBid: 280,
      bids: 8,
      timeLeft: "1d 8h",
      status: "active" as const,
      views: 89,
      imageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    },
    {
      id: "3",
      title: "Designer Backpack",
      currentBid: 120,
      bids: 5,
      timeLeft: "6h 23m",
      status: "ending" as const,
      views: 67,
      imageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    },
    {
      id: "4",
      title: "Gaming Chair",
      currentBid: 180,
      bids: 3,
      timeLeft: "3d 2h",
      status: "active" as const,
      views: 45,
      imageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    }
  ].slice(0, limit)
}

export async function getRecentBids(limit: number = 5): Promise<RecentBid[]> {
  const user = await getCurrentUser()
  
  // Return empty array for unauthenticated users (during build)
  if (!user) {
    return []
  }

  // Mock data - in a real app, this would come from your database
  return [
    {
      id: "1",
      auctionTitle: "iPhone 15 Pro Max",
      auctionId: "auction-1",
      bidAmount: 950,
      status: "outbid" as const,
      timeAgo: "2 hours ago",
      auctionImageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    },
    {
      id: "2",
      auctionTitle: "Gaming Chair - Ergonomic",
      auctionId: "auction-2",
      bidAmount: 180,
      status: "winning" as const,
      timeAgo: "5 hours ago",
      auctionImageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    },
    {
      id: "3",
      auctionTitle: "Textbook Bundle - Computer Science",
      auctionId: "auction-3",
      bidAmount: 45,
      status: "won" as const,
      timeAgo: "1 day ago",
      auctionImageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    },
    {
      id: "4",
      auctionTitle: "Vintage Camera Collection",
      auctionId: "auction-4",
      bidAmount: 320,
      status: "outbid" as const,
      timeAgo: "2 days ago",
      auctionImageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    },
    {
      id: "5",
      auctionTitle: "Wireless Headphones",
      auctionId: "auction-5",
      bidAmount: 85,
      status: "winning" as const,
      timeAgo: "3 days ago",
      auctionImageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    }
  ].slice(0, limit)
}

export async function getEndingSoonAuctions(limit: number = 3): Promise<EndingSoonAuction[]> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  // Mock data - in a real app, this would come from your database
  return [
    {
      id: "1",
      title: "Designer Backpack",
      currentBid: 120,
      timeLeft: "6h 23m",
      bids: 5,
      imageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    },
    {
      id: "2",
      title: "Vintage Watch",
      currentBid: 450,
      timeLeft: "12h 15m",
      bids: 8,
      imageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    },
    {
      id: "3",
      title: "Gaming Keyboard",
      currentBid: 95,
      timeLeft: "18h 42m",
      bids: 3,
      imageUrl: "https://placehold.co/300x200/e5e7eb/9ca3af?text=No+Image"
    }
  ].slice(0, limit)
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